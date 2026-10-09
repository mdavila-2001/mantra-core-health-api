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
const AGENDA_ADMIN_ROLES: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SUPERADMIN',
];

/** Modalidad de atención, a su concepto de `clinical`. */
export const CONCEPT_OF_MODALITY: Readonly<
  Record<AppointmentChannel, string>
> = {
  PRESENCIAL: CLIN.APPOINTMENT_CHANNEL_IN_PERSON,
  TELECONSULTA: CLIN.APPOINTMENT_CHANNEL_TELEHEALTH,
  DOMICILIO: CLIN.APPOINTMENT_CHANNEL_HOME_VISIT,
};

/** Y de vuelta: el concepto guardado, a lo que el cliente entiende. */
const MODALITY_OF_CONCEPT: ReadonlyMap<string, AppointmentChannel> = new Map(
  (Object.entries(CONCEPT_OF_MODALITY) as [AppointmentChannel, string][]).map(
    ([modality, concept]) => [concept, modality],
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
    const practitionerProfileId = this.offeringOwner(
      actor,
      dto.practitionerProfileId,
    );
    validateDurations(dto.minDurationMinutes, dto.maxDurationMinutes);

    this.logger.info(
      {
        operation: 'scheduling.service-offering.create',
        practitionerProfileId,
        serviceCatalogId: dto.serviceCatalogId,
      },
      'Creating service offering',
    );

    return this.em.transactional(async (tx) => {
      const service = await this.repo.findCatalogItem(
        tx,
        dto.serviceCatalogId,
      );
      await this.assertServiceReachable(
        service,
        practitionerProfileId,
        dto.serviceCatalogId,
      );
      if (service === null || !service.isActive) {
        throw new PreconditionFailedException(
          'Ese servicio está inactivo en el catálogo.',
          { serviceCatalogId: dto.serviceCatalogId },
        );
      }

      const existing = await this.repo.findOfferingOf(
        tx,
        practitionerProfileId,
        dto.serviceCatalogId,
      );
      if (existing !== null) {
        throw new ConflictException(
          'Ya ofrece ese servicio. Edite la oferta que ya tiene.',
          { offeringId: existing.id },
        );
      }

      const offering = this.repo.createOffering(tx, {
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
            : CONCEPT_OF_MODALITY[dto.channel],
        statusConceptId: SCHED.OFFERING_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return aDto(offering, service);
    });
  }

  /** Edita una oferta: duraciones, colchones, reservabilidad, aprobación o estado. */
  async update(
    id: string,
    dto: UpdateServiceOfferingDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceOfferingDto> {
    return this.em.transactional(async (tx) => {
      const offering = await this.repo.findOfferingById(tx, id);
      if (offering === null) {
        throw new ResourceNotFoundException('Oferta no encontrada', { id });
      }
      this.assertIsOwn(offering, actor);

      const min = dto.minDurationMinutes ?? offering.minDurationMinutes;
      const max = dto.maxDurationMinutes ?? offering.maxDurationMinutes;
      validateDurations(min, max);

      offering.minDurationMinutes = min;
      offering.maxDurationMinutes = max;
      if (dto.prepMinutes !== undefined) offering.prepMinutes = dto.prepMinutes;
      if (dto.cleanupMinutes !== undefined)
        offering.cleanupMinutes = dto.cleanupMinutes;
      if (dto.isPatientBookable !== undefined)
        offering.isPatientBookable = dto.isPatientBookable;
      if (dto.requiresApproval !== undefined)
        offering.requiresApproval = dto.requiresApproval;
      if (dto.channel !== undefined) {
        offering.channelConceptId = CONCEPT_OF_MODALITY[dto.channel];
      }
      if (dto.isActive !== undefined) {
        offering.statusConceptId = dto.isActive
          ? SCHED.OFFERING_ACTIVE
          : SCHED.OFFERING_INACTIVE;
      }
      touch(offering, actor.id);
      await tx.flush();

      const service = await this.repo.findCatalogItem(
        tx,
        offering.serviceCatalogId,
      );
      return aDto(offering, service);
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
    const goal = practitionerProfileId ?? actor.practitionerProfileId;
    if (goal === undefined) {
      throw new PreconditionFailedException(
        'Indique de qué profesional quiere ver los servicios.',
        {},
      );
    }
    const seesAll = this.maySeeAll(actor, goal);

    return this.em.transactional(async (tx) => {
      const offerings = await this.repo.listOfferings(
        tx,
        goal,
        seesAll
          ? {}
          : { statusConceptId: SCHED.OFFERING_ACTIVE, onlyBookable: true },
      );
      const catalog = await this.repo.findCatalogItems(
        tx,
        offerings.map((offering) => offering.serviceCatalogId),
      );
      const byId = new Map(
        catalog.map((service) => [service.id, service]),
      );
      return {
        items: offerings
          .map((offering) =>
            aDto(offering, byId.get(offering.serviceCatalogId) ?? null),
          )
          // Un servicio que el catálogo apagó no se ofrece aunque la oferta siga viva.
          .filter((offering) => seesAll || offering.isActive),
      };
    });
  }

  /** Quién es el profesional dueño de la oferta que se está creando. */
  private offeringOwner(actor: AuthenticatedUser, requested?: string): string {
    const administers = actor.roles.some((role) =>
      AGENDA_ADMIN_ROLES.includes(role),
    );
    const own = actor.practitionerProfileId;

    // Pidió una oferta para OTRO profesional: sólo quien administra agendas puede.
    if (requested !== undefined && requested !== own) {
      if (!administers) {
        throw new ForbiddenException('Sólo puede crear ofertas para usted.');
      }
      return requested;
    }
    // Sin pedido explícito la oferta es de quien atiende. Hay quien atiende Y
    // administra agendas (el consultorio propio): exigirle su propio id sería
    // pedirle un dato que el servidor ya tiene.
    if (own !== undefined) return own;
    if (administers) {
      throw new PreconditionFailedException(
        'Indique de qué profesional es la oferta.',
        {},
      );
    }
    throw new ForbiddenException('Sólo un profesional ofrece servicios.');
  }

  private assertIsOwn(
    offering: PractitionerServiceOfferings,
    actor: AuthenticatedUser,
  ): void {
    const administers = actor.roles.some((role) =>
      AGENDA_ADMIN_ROLES.includes(role),
    );
    if (
      administers ||
      actor.practitionerProfileId === offering.practitionerProfileId
    ) {
      return;
    }
    // 404 y no 403: una oferta ajena no se distingue de una inexistente.
    throw new ResourceNotFoundException('Oferta no encontrada', {
      id: offering.id,
    });
  }

  private maySeeAll(actor: AuthenticatedUser, goal: string): boolean {
    return (
      actor.practitionerProfileId === goal ||
      actor.roles.some((role) => AGENDA_ADMIN_ROLES.includes(role))
    );
  }

  /** El servicio tiene que existir y ser de una práctica donde el profesional atiende. */
  private async assertServiceReachable(
    service: ServiceCatalog | null,
    practitionerProfileId: string,
    serviceCatalogId: string,
  ): Promise<void> {
    const notFound = new ResourceNotFoundException(
      'Servicio no encontrado',
      {
        serviceCatalogId,
      },
    );
    if (service === null) throw notFound;
    const ownOnes =
      await this.practiceLookup.findActivePracticeIdsForPractitioner(
        practitionerProfileId,
      );
    if (!ownOnes.includes(service.practiceId)) throw notFound;
  }
}

function validateDurations(min: number, max: number): void {
  if (min > max) {
    throw new PreconditionFailedException(
      'La duración mínima no puede ser mayor que la máxima.',
      { minDurationMinutes: min, maxDurationMinutes: max },
    );
  }
}

function aDto(
  offering: PractitionerServiceOfferings,
  service: ServiceCatalog | null,
): ServiceOfferingDto {
  return {
    id: offering.id,
    practitionerProfileId: offering.practitionerProfileId,
    serviceCatalogId: offering.serviceCatalogId,
    serviceCode: service?.code ?? '',
    serviceName: service?.name ?? '',
    price: service?.defaultPrice ?? '0.00',
    currencyConceptId: service?.currencyConceptId ?? undefined,
    minDurationMinutes: offering.minDurationMinutes,
    maxDurationMinutes: offering.maxDurationMinutes,
    prepMinutes: offering.prepMinutes ?? 0,
    cleanupMinutes: offering.cleanupMinutes ?? 0,
    isPatientBookable: offering.isPatientBookable,
    requiresApproval: offering.requiresApproval,
    channel:
      offering.channelConceptId === undefined
        ? undefined
        : MODALITY_OF_CONCEPT.get(offering.channelConceptId),
    isActive:
      offering.statusConceptId === SCHED.OFFERING_ACTIVE &&
      (service?.isActive ?? true),
  };
}

export { aDto as offeringToDto };
