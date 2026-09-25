import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceCatalogRepository } from '../../billing/repositories';
import type { Quotations, QuotationInstallments } from '../../billing/entities';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  QuotationInstallmentsRepository,
  QuotationsRepository,
} from '../repositories';
import { CreateQuotationDto } from '../dto';
import type {
  QuotationInstallmentDto,
  QuotationResponseDto,
} from '../dto/quotation-response.dto';
import { assertPaymentPlanClosesOnPrice } from './payment-plan';

/** Fecha (`date`) como `YYYY-MM-DD`, sin desplazamiento por huso horario. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * FT-24 — Creación de cotizaciones: presupuesto ofrecido a un paciente sobre
 * un servicio del catálogo (`billing.service_catalog`), con un plan de pagos
 * flexible **sin interés** (v4.2.18: anticipo y cuotas con fecha y monto
 * propios, que arma quien atiende) y las condiciones ofertadas congeladas (snapshot)
 * para trazabilidad — si el catálogo cambia después, la cotización ya
 * emitida no se ve afectada.
 *
 * **Alcance.** El rol no decide quién ve o arma una cotización: lo decide la
 * vinculación del actor con la práctica, igual que el `PATCH` del catálogo
 * (`BillingServiceCatalogService.assertPuedeEditar`). Crear en una práctica
 * ajena es 422 —la práctica viene declarada en el cuerpo, como en
 * `LedgerService.assertPractitionerOwnsPractice`—; leer una cotización de una
 * práctica ajena es el **mismo 404** que una inexistente; y el listado se acota
 * en la consulta a las prácticas alcanzables, no después de leer.
 */
@Injectable()
export class QuotationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param quotationsRepo - Acceso a `billing.quotations`.
   * @param installmentsRepo - Acceso a `billing.quotation_installments`.
   * @param serviceCatalogRepo - Acceso a `billing.service_catalog`, para el snapshot.
   * @param practiceTenantLookup - A qué prácticas llega el actor (vinculación u organización).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly quotationsRepo: QuotationsRepository,
    private readonly installmentsRepo: QuotationInstallmentsRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QuotationsService.name);
  }

  /**
   * Crea una cotización: valida las precondiciones —entre ellas, que anticipo
   * + cuotas cierre con el precio—, congela el nombre del servicio del
   * catálogo y persiste cotización + cuotas en una única transacción.
   *
   * @throws PreconditionFailedException si el actor no tiene perfil
   * profesional, si no alcanza la práctica declarada, si `validUntil` no es
   * posterior a `attentionDate`, o si el plan de pagos no cierra con el precio
   * (ver `assertPaymentPlanClosesOnPrice`).
   * @throws ResourceNotFoundException si el servicio no existe en el catálogo
   * o pertenece a otra práctica (mismo 404, a propósito).
   */
  async createQuotation(
    dto: CreateQuotationDto,
    actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto> {
    // Se copia a una constante porque la narrowing de `actor.practitionerProfileId`
    // no cruza el cierre de `em.transactional` de abajo (TS no la retiene para
    // una propiedad `readonly` de un parámetro capturado por una función anidada).
    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) {
      throw new PreconditionFailedException(
        'Se requiere un perfil profesional para crear una cotización',
      );
    }

    // La práctica viene declarada en el cuerpo: el rol no alcanza, hay que
    // estar vinculado a ella (mismo criterio y mismo mensaje que el asiento
    // contable, `LedgerService.assertPractitionerOwnsPractice`).
    if (!(await this.alcanzaPractica(actor, dto.practiceId))) {
      throw new PreconditionFailedException(
        'El profesional no tiene una vinculación activa con esa práctica',
        { practiceId: dto.practiceId },
      );
    }

    const attentionDate = new Date(dto.attentionDate);
    const validUntil = new Date(dto.validUntil);
    if (validUntil <= attentionDate) {
      throw new PreconditionFailedException(
        'validUntil debe ser posterior a attentionDate',
        { attentionDate: dto.attentionDate, validUntil: dto.validUntil },
      );
    }

    assertPaymentPlanClosesOnPrice(dto);

    this.logger.info(
      {
        operation: 'quotations.create',
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        serviceCatalogId: dto.serviceCatalogId,
        actorId: actor.id,
      },
      'Creating quotation',
    );

    return this.em.transactional(async (tx) => {
      const service = await this.serviceCatalogRepo.findById(
        tx,
        dto.serviceCatalogId,
      );
      // Un servicio de otra práctica responde el MISMO 404 que uno
      // inexistente (criterio del catálogo): probar uuids no confirma qué
      // ofrece la práctica de al lado, y una cotización no puede congelar el
      // nombre de un servicio que su práctica no ofrece.
      if (service === null || service.practiceId !== dto.practiceId) {
        throw new ResourceNotFoundException(
          'Servicio no encontrado en el catálogo',
          { serviceCatalogId: dto.serviceCatalogId },
        );
      }

      const quotation = this.quotationsRepo.create(tx, {
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        createdByPractitionerProfileId: practitionerProfileId,
        attentionDate,
        appointmentId: dto.appointmentId,
        serviceCatalogId: dto.serviceCatalogId,
        // Snapshot: se copia el nombre vigente del catálogo al momento de la
        // creación; si el catálogo cambia después, esta cotización no se ve
        // afectada (trazabilidad de la oferta tal como se presentó).
        serviceNameSnapshot: service.name,
        offeredPrice: dto.offeredPrice,
        currencyConceptId: dto.currencyConceptId,
        paymentPlanInstallmentCount: dto.paymentPlanInstallmentCount,
        downPaymentAmount: dto.downPaymentAmount,
        paymentFrequency: dto.paymentFrequency,
        validUntil,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir la cotización antes de sus cuotas.
      await tx.flush();

      const installments = this.installmentsRepo.createMany(
        tx,
        dto.installments.map((row) => ({
          quotationId: quotation.id,
          installmentNumber: row.installmentNumber,
          dueDate: new Date(row.dueDate),
          amount: row.amount,
        })),
      );

      this.logger.info(
        {
          operation: 'quotations.create',
          quotationId: quotation.id,
          installments: installments.length,
        },
        'Quotation created',
      );
      return toResponseDto(quotation, installments);
    });
  }

  /**
   * Trae una cotización con sus cuotas.
   *
   * @throws ResourceNotFoundException si no existe, o si es de una práctica
   * que el actor no alcanza — el mismo 404, para que probar ids no confirme
   * qué cotizó la práctica de al lado.
   */
  async getQuotation(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto> {
    const em = this.em.fork();
    const quotation = await this.quotationsRepo.findById(em, id);
    if (
      quotation === null ||
      !(await this.alcanzaPractica(actor, quotation.practiceId))
    ) {
      throw new ResourceNotFoundException('Cotización no encontrada', { id });
    }
    const installments = await this.installmentsRepo.findByQuotationId(em, id);
    return toResponseDto(quotation, installments);
  }

  /**
   * Lista las cotizaciones de un paciente, más recientes primero, acotadas en
   * la consulta a las prácticas que el actor alcanza. Sin ninguna práctica
   * alcanzable no hay lectura: la lista es vacía sin ir a la base.
   */
  async listQuotationsByPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto[]> {
    const practiceIds = await this.practicasAlcanzables(actor);
    if (practiceIds.length === 0) {
      return [];
    }
    const em = this.em.fork();
    const quotations = await this.quotationsRepo.findByPatient(
      em,
      patientProfileId,
      practiceIds,
    );
    return Promise.all(
      quotations.map(async (quotation) => {
        const installments = await this.installmentsRepo.findByQuotationId(
          em,
          quotation.id,
        );
        return toResponseDto(quotation, installments);
      }),
    );
  }

  /**
   * Si el actor alcanza esa práctica: por vinculación activa (quien atiende)
   * o, para la cuenta administradora, porque la práctica es de su
   * organización. Es `BillingServiceCatalogService.assertPuedeEditar` con
   * respuesta booleana, porque acá el error lo decide el llamador: 422 al
   * crear con una práctica declarada, 404 al leer por id.
   */
  private async alcanzaPractica(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<boolean> {
    if (actor.practitionerProfileId !== undefined) {
      const propias =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          actor.practitionerProfileId,
        );
      if (propias.includes(practiceId)) return true;
    }

    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      const tenantDeLaPractica =
        await this.practiceTenantLookup.findTenantOfPractice(practiceId);
      // Sin tenant en contexto son los carriles internos, que no pasan por la
      // cabecera: lo único que se exige es que la práctica exista.
      if (
        tenantDeLaPractica !== null &&
        (tenantId === undefined || tenantDeLaPractica === tenantId)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Las prácticas que el actor alcanza, para acotar un listado **en la
   * consulta**: las de su vinculación activa más, si es cuenta administradora,
   * las activas de la organización en contexto. Sin organización en contexto
   * la cuenta administradora no tiene contra qué acotar y no suma ninguna.
   */
  private async practicasAlcanzables(
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const ids = new Set<string>();
    if (actor.practitionerProfileId !== undefined) {
      const propias =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          actor.practitionerProfileId,
        );
      for (const id of propias) ids.add(id);
    }
    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      if (tenantId !== undefined) {
        const delTenant =
          await this.practiceTenantLookup.findActivePracticeIdsForTenant(
            tenantId,
          );
        for (const id of delTenant) ids.add(id);
      }
    }
    return [...ids];
  }
}

/** Traduce cotización + cuotas a su forma pública de transporte. */
function toResponseDto(
  quotation: Pick<
    Quotations,
    | 'id'
    | 'practiceId'
    | 'patientProfileId'
    | 'createdByPractitionerProfileId'
    | 'attentionDate'
    | 'appointmentId'
    | 'serviceCatalogId'
    | 'serviceNameSnapshot'
    | 'offeredPrice'
    | 'currencyConceptId'
    | 'paymentPlanInstallmentCount'
    | 'downPaymentAmount'
    | 'paymentFrequency'
    | 'validUntil'
    | 'statusConceptId'
    | 'createdAt'
  >,
  installments: ReadonlyArray<
    Pick<QuotationInstallments, 'installmentNumber' | 'dueDate' | 'amount'>
  >,
): QuotationResponseDto {
  const installmentDtos: QuotationInstallmentDto[] = installments.map(
    (installment) => ({
      installmentNumber: installment.installmentNumber,
      dueDate: toIsoDate(installment.dueDate),
      amount: installment.amount,
    }),
  );

  return {
    id: quotation.id,
    practiceId: quotation.practiceId,
    patientProfileId: quotation.patientProfileId,
    createdByPractitionerProfileId: quotation.createdByPractitionerProfileId,
    attentionDate: toIsoDate(quotation.attentionDate),
    appointmentId: quotation.appointmentId,
    serviceCatalogId: quotation.serviceCatalogId,
    serviceNameSnapshot: quotation.serviceNameSnapshot,
    offeredPrice: quotation.offeredPrice,
    currencyConceptId: quotation.currencyConceptId,
    paymentPlanInstallmentCount: quotation.paymentPlanInstallmentCount,
    downPaymentAmount: quotation.downPaymentAmount,
    paymentFrequency: quotation.paymentFrequency,
    validUntil: toIsoDate(quotation.validUntil),
    statusConceptId: quotation.statusConceptId,
    createdAt: quotation.createdAt,
    installments: installmentDtos,
  };
}
