import { ForbiddenException, Injectable } from '@nestjs/common';
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
import { ClinicalReadService } from '../../clinical/services/clinical-read.service';
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
import { QuotationsErrorReason } from '../quotations.error-reasons';
import { assertPaymentPlanClosesOnPrice } from './payment-plan';

/**
 * Respuesta única cuando el paciente o la cita de una cotización no está al
 * alcance del actor: inexistente, de otro tenant o sin base clínica. Mismo
 * mensaje, mismo `reason` y sin `details` en los tres casos.
 */
const PATIENT_NOT_AVAILABLE = {
  message: 'Paciente no disponible',
  reason: QuotationsErrorReason.QUOTATION_PATIENT_NOT_AVAILABLE,
} as const;

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
 *
 * **Paciente.** Alcanzar la práctica no da acceso a cualquier paciente: crear
 * una cotización, o listar las de un paciente por la vía profesional, exige la
 * misma base clínica que la historia (`ClinicalReadService.assertCanReadHistory`:
 * turno de hoy, relación asistencial o consentimiento vigente). Sin ella, el
 * paciente es «no disponible» —404 `QUOTATION_PATIENT_NOT_AVAILABLE`, igual que
 * un uuid inexistente— y no se persiste nada. La cita, si viene, debe ser del
 * mismo paciente y del tenant activo. La cuenta administradora no necesita
 * relación clínica: ve sólo lo que cotizaron las prácticas de su organización.
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
   * @param clinicalRead - Política clínica: si el actor puede tratar a un paciente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly quotationsRepo: QuotationsRepository,
    private readonly installmentsRepo: QuotationInstallmentsRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly clinicalRead: ClinicalReadService,
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
   * o pertenece a otra práctica (mismo 404, a propósito), o si el paciente o la
   * cita no están al alcance del actor (`QUOTATION_PATIENT_NOT_AVAILABLE`).
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
    if (!(await this.reachesPractice(actor, dto.practiceId))) {
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

    // Antes de cualquier escritura: la práctica es alcanzable, pero el paciente
    // y la cita declarados tienen que estar al alcance del actor.
    await this.assertPatientAndAppointmentAvailable(
      dto.patientProfileId,
      dto.appointmentId,
      actor,
    );

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
      !(await this.reachesPractice(actor, quotation.practiceId))
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
   *
   * @throws ResourceNotFoundException (`QUOTATION_PATIENT_NOT_AVAILABLE`) si el
   * actor llega sólo por vinculación profesional y no tiene base clínica sobre
   * el paciente: la lista no se acota en silencio a vacía, porque eso
   * distinguiría un paciente sin cotizaciones de uno ajeno.
   */
  async listQuotationsByPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto[]> {
    const practiceIds = await this.reachablePracticesForPatient(
      patientProfileId,
      actor,
    );
    if (practiceIds.length === 0) {
      return [];
    }
    const em = this.em.fork();
    const quotations = await this.quotationsRepo.findByPatient(
      em,
      patientProfileId,
      practiceIds,
    );
    if (quotations.length === 0) {
      return [];
    }
    // Una sola lectura de cuotas para todo el listado, no una por cotización
    // (el N+1 de M4 · H3.S1.M3). Vienen ordenadas por número de cuota.
    const installments = await this.installmentsRepo.findByQuotationIds(
      em,
      quotations.map((quotation) => quotation.id),
    );
    const byQuotation = new Map<string, typeof installments>();
    for (const installment of installments) {
      const rows = byQuotation.get(installment.quotationId) ?? [];
      rows.push(installment);
      byQuotation.set(installment.quotationId, rows);
    }
    return quotations.map((quotation) =>
      toResponseDto(quotation, byQuotation.get(quotation.id) ?? []),
    );
  }

  /**
   * Si el actor alcanza esa práctica: por vinculación activa (quien atiende)
   * o, para la cuenta administradora, porque la práctica es de su
   * organización. Es `BillingServiceCatalogService.assertPuedeEditar` con
   * respuesta booleana, porque acá el error lo decide el llamador: 422 al
   * crear con una práctica declarada, 404 al leer por id.
   */
  private async reachesPractice(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<boolean> {
    if (actor.practitionerProfileId !== undefined) {
      const own =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          actor.practitionerProfileId,
        );
      if (own.includes(practiceId)) return true;
    }

    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      const tenantPractice =
        await this.practiceTenantLookup.findTenantOfPractice(practiceId);
      // Sin tenant en contexto son los carriles internos, que no pasan por la
      // cabecera: lo único que se exige es que la práctica exista.
      if (
        tenantPractice !== null &&
        (tenantId === undefined || tenantPractice === tenantId)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Las prácticas desde las que el actor puede listar las cotizaciones de este
   * paciente, para acotar el listado **en la consulta**.
   *
   * - La cuenta administradora suma las activas de la organización en contexto:
   *   ve lo que cotizó su organización, sin relación clínica. Sin organización
   *   en contexto no tiene contra qué acotar y no suma ninguna.
   * - La vía profesional (vinculación activa con una práctica) suma esas
   *   prácticas **sólo si** el actor tiene base clínica sobre el paciente.
   *
   * @throws ResourceNotFoundException si el único camino del actor es el
   * profesional y no tiene base clínica sobre el paciente.
   */
  private async reachablePracticesForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const ids = new Set<string>();
    let administrativeScope = false;
    if (actor.roles.includes('SECURITY_ADMIN')) {
      const tenantId = getCurrentTenantId();
      if (tenantId !== undefined) {
        administrativeScope = true;
        const ofTenant =
          await this.practiceTenantLookup.findActivePracticeIdsForTenant(
            tenantId,
          );
        for (const id of ofTenant) ids.add(id);
      }
    }
    if (actor.practitionerProfileId !== undefined) {
      if (await this.hasClinicalBasis(patientProfileId, actor)) {
        const own =
          await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
            actor.practitionerProfileId,
          );
        for (const id of own) ids.add(id);
      } else if (!administrativeScope) {
        throw new ResourceNotFoundException(
          PATIENT_NOT_AVAILABLE.message,
          undefined,
          PATIENT_NOT_AVAILABLE.reason,
        );
      }
    }
    return [...ids];
  }

  /**
   * Exige que el paciente (y la cita, si viene) estén al alcance del actor
   * antes de persistir nada.
   *
   * - El actor debe tener base clínica sobre el paciente.
   * - La cita debe existir, ser de ese paciente y, con tenant en contexto, de
   *   ese tenant.
   *
   * Todos los fallos son el mismo 404 sin `details`.
   *
   * @throws ResourceNotFoundException (`QUOTATION_PATIENT_NOT_AVAILABLE`).
   */
  private async assertPatientAndAppointmentAvailable(
    patientProfileId: string,
    appointmentId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const notAvailable = (): ResourceNotFoundException =>
      new ResourceNotFoundException(
        PATIENT_NOT_AVAILABLE.message,
        undefined,
        PATIENT_NOT_AVAILABLE.reason,
      );

    if (!(await this.hasClinicalBasis(patientProfileId, actor))) {
      throw notAvailable();
    }
    if (appointmentId === undefined) return;

    const appointment = await this.quotationsRepo.findAppointmentById(
      this.em.fork(),
      appointmentId,
    );
    const tenantId = getCurrentTenantId();
    if (
      appointment === null ||
      appointment.patientProfileId !== patientProfileId ||
      (tenantId !== undefined && appointment.tenantId !== tenantId)
    ) {
      throw notAvailable();
    }
  }

  /**
   * Si el actor tiene base clínica para tratar al paciente. Traduce el 403 de
   * la política de la historia en un booleano: acá el error lo decide el
   * llamador y es siempre el 404 uniforme.
   */
  private async hasClinicalBasis(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    try {
      await this.clinicalRead.assertCanReadHistory(patientProfileId, actor);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
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
