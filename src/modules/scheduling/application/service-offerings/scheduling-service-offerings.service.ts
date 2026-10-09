import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import { PracticeTenantLookupService } from '../../../practice/services';
import type { PractitionerServiceOfferings } from '../../entities';
import { SchedulingOfferingsRepository } from '../../infrastructure/repositories/scheduling-offerings.repository';
import { SCHED } from '../../domain/scheduling.concepts';
import type { AppointmentChannel } from '../../presentation/dto/scheduling-bookings.dto';
import type {
  CreateServiceOfferingDto,
  ServiceOfferingDto,
  ServiceOfferingListDto,
  UpdateServiceOfferingDto,
} from '../../presentation/dto/scheduling-service-offerings.dto';
import type { ServiceCatalog } from '../../../billing/entities';

/** Quién administra las agendas de otros por oficio. */
const ROLES_QUE_ADMINISTRAN_AGENDAS: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SUPERADMIN',
];

/** Modalidad de atención, a su concepto de `clinical`. */
export const CONCEPTO_DE_MODALIDAD: Readonly<
  Record<AppointmentChannel, string>
> = {
  PRESENCIAL: CLIN.APPOINTMENT_CHANNEL_IN_PERSON,
  TELECONSULTA: CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
  DOMICILIO: CLIN.APPOINTMENT_CHANNEL_HOME_VISIT,
};

/** Y de vuelta: el concepto guardado, a lo que el cliente entiende. */
const MODALIDAD_DEL_CONCEPTO: ReadonlyMap<string, AppointmentChannel> = new Map(
  (Object.entries(CONCEPTO_DE_MODALIDAD) as [AppointmentChannel, string][]).map(
    ([modalidad, concepto]) => [concepto, modalidad],
  ),
);

/**
 * Las ofertas de servicio de un profesional: lo que declara que ofrece, cuánto tarda
 * y en qué condiciones se puede pedir.
 *
 * ## Quién puede qué
 *
 * - **El profesional** da de alta, edita y apaga **sus** ofertas, y sólo sobre
 *   servicios de una práctica donde tiene vínculo vigente.
 * - **Quien administra agendas** puede hacerlo por otro profesional.
 * - **El paciente** sólo lee, y sólo lo que se puede reservar y está activo.
 *
 * Un servicio de otra práctica responde **404 y no 403**: un id ajeno no se
 * distingue de uno inventado, así que probar uuids no confirma nada.
 */
@Injectable()
export class SchedulingServiceOfferingsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SchedulingOfferingsRepository,
    private readonly practiceLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingServiceOfferingsService.name);
  }

  /** Da de alta la oferta de un servicio. */
  async create(
    dto: CreateServiceOfferingDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceOfferingDto> {
    const practitionerProfileId = this.duenoDeLaOferta(
      actor,
      dto.practitionerProfileId,
    );
    validarDuraciones(dto.minDurationMinutes, dto.maxDurationMinutes);

    this.logger.info(
      {
        operation: 'scheduling.service-offering.create',
        practitionerProfileId,
        serviceCatalogId: dto.serviceCatalogId,
      },
      'Creating service offering',
    );

    return this.em.transactional(async (tx) => {
      const servicio = await this.repo.findCatalogItem(
        tx,
        dto.serviceCatalogId,
      );
      await this.assertServicioAlcanzable(
        servicio,
        practitionerProfileId,
        dto.serviceCatalogId,
      );
      if (servicio === null || !servicio.isActive) {
        throw new PreconditionFailedException(
          'Ese servicio está inactivo en el catálogo.',
          { serviceCatalogId: dto.serviceCatalogId },
        );
      }

      const existente = await this.repo.findOfferingOf(
        tx,
        practitionerProfileId,
        dto.serviceCatalogId,
      );
      if (existente !== null) {
        throw new ConflictException(
          'Ya ofrece ese servicio. Edite la oferta que ya tiene.',
          { offeringId: existente.id },
        );
      }

      const oferta = this.repo.createOffering(tx, {
        practitionerProfileId,
        serviceCatalogId: dto.serviceCatalogId,
        minDurationMinutes: dto.minDurationMinutes,
        maxDurationMinutes: dto.maxDurationMinutes,
        prepMinutes: dto.prepMinutes,
        cleanupMinutes: dto.cleanupMinutes,
        isPatientBookable: dto.isPatientBookable ?? true,
        requiresApproval: dto.requiresApproval ?? false,
        channelConceptId:
          dto.channel === undefined
            ? undefined
            : CONCEPTO_DE_MODALIDAD[dto.channel],
        statusConceptId: SCHED.OFFERING_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return aDto(oferta, servicio);
    });
  }

  /** Edita una oferta: duraciones, colchones, reservabilidad, aprobación o estado. */
  async update(
    id: string,
    dto: UpdateServiceOfferingDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceOfferingDto> {
    return this.em.transactional(async (tx) => {
      const oferta = await this.repo.findOfferingById(tx, id);
      if (oferta === null) {
        throw new ResourceNotFoundException('Oferta no encontrada', { id });
      }
      this.assertEsSuya(oferta, actor);

      const min = dto.minDurationMinutes ?? oferta.minDurationMinutes;
      const max = dto.maxDurationMinutes ?? oferta.maxDurationMinutes;
      validarDuraciones(min, max);

      oferta.minDurationMinutes = min;
      oferta.maxDurationMinutes = max;
      if (dto.prepMinutes !== undefined) oferta.prepMinutes = dto.prepMinutes;
      if (dto.cleanupMinutes !== undefined)
        oferta.cleanupMinutes = dto.cleanupMinutes;
      if (dto.isPatientBookable !== undefined)
        oferta.isPatientBookable = dto.isPatientBookable;
      if (dto.requiresApproval !== undefined)
        oferta.requiresApproval = dto.requiresApproval;
      if (dto.channel !== undefined) {
        oferta.channelConceptId = CONCEPTO_DE_MODALIDAD[dto.channel];
      }
      if (dto.isActive !== undefined) {
        oferta.statusConceptId = dto.isActive
          ? SCHED.OFFERING_ACTIVE
          : SCHED.OFFERING_INACTIVE;
      }
      touch(oferta, actor.id);
      await tx.flush();

      const servicio = await this.repo.findCatalogItem(
        tx,
        oferta.serviceCatalogId,
      );
      return aDto(oferta, servicio);
    });
  }

  /**
   * Las ofertas de un profesional.
   *
   * Un paciente —o cualquiera que no sea el dueño ni administre agendas— ve sólo
   * lo activo y reservable. El dueño ve todo lo suyo, apagado incluido, porque
   * necesita poder reactivarlo.
   */
  async list(
    practitionerProfileId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<ServiceOfferingListDto> {
    const objetivo = practitionerProfileId ?? actor.practitionerProfileId;
    if (objetivo === undefined) {
      throw new PreconditionFailedException(
        'Indique de qué profesional quiere ver los servicios.',
        {},
      );
    }
    const veTodo = this.puedeVerTodo(actor, objetivo);

    return this.em.transactional(async (tx) => {
      const ofertas = await this.repo.listOfferings(
        tx,
        objetivo,
        veTodo
          ? {}
          : { statusConceptId: SCHED.OFFERING_ACTIVE, soloReservables: true },
      );
      const catalogo = await this.repo.findCatalogItems(
        tx,
        ofertas.map((oferta) => oferta.serviceCatalogId),
      );
      const porId = new Map(
        catalogo.map((servicio) => [servicio.id, servicio]),
      );
      return {
        items: ofertas
          .map((oferta) =>
            aDto(oferta, porId.get(oferta.serviceCatalogId) ?? null),
          )
          // Un servicio que el catálogo apagó no se ofrece aunque la oferta siga viva.
          .filter((oferta) => veTodo || oferta.isActive),
      };
    });
  }

  /** Quién es el profesional dueño de la oferta que se está creando. */
  private duenoDeLaOferta(actor: AuthenticatedUser, pedido?: string): string {
    const administra = actor.roles.some((rol) =>
      ROLES_QUE_ADMINISTRAN_AGENDAS.includes(rol),
    );
    const propio = actor.practitionerProfileId;

    // Pidió una oferta para OTRO profesional: sólo quien administra agendas puede.
    if (pedido !== undefined && pedido !== propio) {
      if (!administra) {
        throw new ForbiddenException('Sólo puede crear ofertas para usted.');
      }
      return pedido;
    }
    // Sin pedido explícito la oferta es de quien atiende. Hay quien atiende Y
    // administra agendas (el consultorio propio): exigirle su propio id sería
    // pedirle un dato que el servidor ya tiene.
    if (propio !== undefined) return propio;
    if (administra) {
      throw new PreconditionFailedException(
        'Indique de qué profesional es la oferta.',
        {},
      );
    }
    throw new ForbiddenException('Sólo un profesional ofrece servicios.');
  }

  private assertEsSuya(
    oferta: PractitionerServiceOfferings,
    actor: AuthenticatedUser,
  ): void {
    const administra = actor.roles.some((rol) =>
      ROLES_QUE_ADMINISTRAN_AGENDAS.includes(rol),
    );
    if (
      administra ||
      actor.practitionerProfileId === oferta.practitionerProfileId
    ) {
      return;
    }
    // 404 y no 403: una oferta ajena no se distingue de una inexistente.
    throw new ResourceNotFoundException('Oferta no encontrada', {
      id: oferta.id,
    });
  }

  private puedeVerTodo(actor: AuthenticatedUser, objetivo: string): boolean {
    return (
      actor.practitionerProfileId === objetivo ||
      actor.roles.some((rol) => ROLES_QUE_ADMINISTRAN_AGENDAS.includes(rol))
    );
  }

  /** El servicio tiene que existir y ser de una práctica donde el profesional atiende. */
  private async assertServicioAlcanzable(
    servicio: ServiceCatalog | null,
    practitionerProfileId: string,
    serviceCatalogId: string,
  ): Promise<void> {
    const noEncontrado = new ResourceNotFoundException(
      'Servicio no encontrado',
      {
        serviceCatalogId,
      },
    );
    if (servicio === null) throw noEncontrado;
    const propias =
      await this.practiceLookup.findActivePracticeIdsForPractitioner(
        practitionerProfileId,
      );
    if (!propias.includes(servicio.practiceId)) throw noEncontrado;
  }
}

function validarDuraciones(min: number, max: number): void {
  if (min > max) {
    throw new PreconditionFailedException(
      'La duración mínima no puede ser mayor que la máxima.',
      { minDurationMinutes: min, maxDurationMinutes: max },
    );
  }
}

function aDto(
  oferta: PractitionerServiceOfferings,
  servicio: ServiceCatalog | null,
): ServiceOfferingDto {
  return {
    id: oferta.id,
    practitionerProfileId: oferta.practitionerProfileId,
    serviceCatalogId: oferta.serviceCatalogId,
    serviceCode: servicio?.code ?? '',
    serviceName: servicio?.name ?? '',
    price: servicio?.defaultPrice ?? '0.00',
    currencyConceptId: servicio?.currencyConceptId ?? undefined,
    minDurationMinutes: oferta.minDurationMinutes,
    maxDurationMinutes: oferta.maxDurationMinutes,
    prepMinutes: oferta.prepMinutes ?? 0,
    cleanupMinutes: oferta.cleanupMinutes ?? 0,
    isPatientBookable: oferta.isPatientBookable,
    requiresApproval: oferta.requiresApproval,
    channel:
      oferta.channelConceptId === undefined
        ? undefined
        : MODALIDAD_DEL_CONCEPTO.get(oferta.channelConceptId),
    isActive:
      oferta.statusConceptId === SCHED.OFFERING_ACTIVE &&
      (servicio?.isActive ?? true),
  };
}

export { aDto as ofertaADto };
