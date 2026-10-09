import { randomUUID } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { PatientRepresentationService } from '../../../profiles/services/patient-representation.service';
import type {
  PractitionerServiceOfferings,
  SchedulableResources,
} from '../../entities';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
  SchedulingOfferingsRepository,
} from '../../infrastructure/repositories';
import {
  serviceFits,
  proposeServiceTimes,
  busySpan,
  type ServiceDuration,
  type Interval,
} from '../../domain/time/service-availability';
import type {
  CreateServiceHoldDto,
  ServiceAvailabilityQueryDto,
  ServiceAvailabilityResponseDto,
  ServiceHoldResponseDto,
  ServiceStartDto,
} from '../../presentation/dto/scheduling-service-offerings.dto';
import { SCHED } from '../../domain/scheduling.concepts';
import { PractitionerAffiliationGateService } from '../affiliation/practitioner-affiliation-gate.service';
import { SchedulingProfessionalTimeService } from '../professional-time/scheduling-professional-time.service';
import {
  SchedulingServiceAgendaService,
  type ServiceBands,
} from './scheduling-service-agenda.service';
import { AGENDA_OPERATOR_ROLES } from '../bookings/scheduling-bookings.service';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** Cuántos días se pueden mirar de una vez: una pantalla de calendario, no el año. */
const MAX_QUERY_DAYS = 62;

/** Cuánto dura la retención de un turno si ninguna política dice otra cosa. */
const HOLD_TTL_SECONDS = 300;

const PRACTITIONER_PROFILE_TABLES: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/**
 * Leer horarios de un servicio y retener el turno elegido.
 *
 * ## El cupo nace al retener
 *
 * Las consultas salen de una grilla ya generada; un servicio no, porque dura entre
 * `min` y `max` minutos según el profesional y cada reserva distinta dejaría la
 * grilla mintiendo. Acá se **calcula** qué cabe ({@link availability}) y recién al
 * retener ({@link placeHold}) nace un cupo puntual —de capacidad 1, ya tomado— con
 * la duración máxima. Desde ahí es una reserva más: la confirma el mismo
 * `POST /scheduling/holds/:token/confirm` que ya usan las consultas.
 *
 * ## Por qué la comprobación definitiva es la de retener
 *
 * El cliente leyó los horarios hace minutos. Lo único que cuenta es lo que el
 * servidor comprueba **bajo el candado del profesional**, el mismo que toma la regla
 * madre: dos pedidos concurrentes se serializan y el segundo ve al primero.
 */
@Injectable()
export class SchedulingServiceBookingService {
  constructor(
    private readonly em: EntityManager,
    private readonly offeringsRepo: SchedulingOfferingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly agenda: SchedulingServiceAgendaService,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly affiliations: PractitionerAffiliationGateService,
    private readonly representation: PatientRepresentationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingServiceBookingService.name);
  }

  /**
   * Los horarios donde cabe el servicio, en las sedes del profesional.
   *
   * No reserva nada: es una lectura. Un horario que se ofrece acá puede dejar de
   * estar libre un segundo después, y por eso {@link placeHold} lo vuelve a decidir.
   */
  async availability(
    query: ServiceAvailabilityQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceAvailabilityResponseDto> {
    const now = new Date();
    const from = new Date(
      Math.max(new Date(query.from).getTime(), now.getTime()),
    );
    const to = new Date(query.to);
    if (!(to.getTime() > from.getTime())) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar.',
        { from: query.from, to: query.to },
      );
    }
    if (to.getTime() - from.getTime() > MAX_QUERY_DAYS * MS_PER_DAY) {
      throw new PreconditionFailedException(
        `Se pueden mirar hasta ${MAX_QUERY_DAYS} días de una vez.`,
        { from: query.from, to: query.to },
      );
    }

    return this.em.transactional(async (tx) => {
      const offering = await this.visibleOffering(tx, query.offeringId, actor);
      const sites = (
        await this.offeringsRepo.findResourcesOfProfessional(
          tx,
          offering.practitionerProfileId,
        )
      ).filter(
        (site) =>
          (query.resourceId === undefined || site.id === query.resourceId) &&
          this.siteInScope(site, actor),
      );

      const groups = await this.agenda.bandsOfServices(
        tx,
        offering.practitionerProfileId,
        sites.map((site) => ({
          id: site.id,
          name: site.name,
          timeZone: site.timeZone ?? undefined,
        })),
        from,
        to,
      );
      const busy = await this.agenda.practitionerBusyTime(
        tx,
        offering.practitionerProfileId,
        from,
        to,
        now,
      );

      const service = durationOf(offering);
      const items = new Map<string, ServiceStartDto>();
      for (const group of groups) {
        const times = proposeServiceTimes({
          bands: group.bands,
          busy: busy,
          service: service,
          notBefore: new Date(
            now.getTime() + group.minNoticeMinutes * MS_PER_MINUTE,
          ),
          notAfter:
            group.maxAdvanceDays === undefined
              ? to
              : new Date(
                  Math.min(
                    to.getTime(),
                    now.getTime() + group.maxAdvanceDays * MS_PER_DAY,
                  ),
                ),
        });
        for (const time of times) {
          const key = `${group.resourceId}|${time.startAt.getTime()}`;
          if (items.has(key)) continue;
          items.set(key, {
            resourceId: group.resourceId,
            startAt: time.startAt.toISOString(),
            endAtMax: time.endAtMax.toISOString(),
            endAtMin: time.endAtMin.toISOString(),
          });
        }
      }

      return {
        offeringId: offering.id,
        minDurationMinutes: offering.minDurationMinutes,
        maxDurationMinutes: offering.maxDurationMinutes,
        items: [...items.values()].sort((a, b) =>
          a.startAt.localeCompare(b.startAt),
        ),
      };
    });
  }

  /**
   * Retiene el turno de un servicio: crea su cupo puntual y la retención.
   *
   * @throws ConflictException si el horario ya no cabe (otro lo tomó, o cambió la agenda).
   */
  async placeHold(
    offeringId: string,
    dto: CreateServiceHoldDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceHoldResponseDto> {
    if (dto.patientProfileId !== undefined && this.isPatientActor(actor)) {
      await this.representation.assertMayActForPatient(
        dto.patientProfileId,
        actor,
      );
    }
    const startAt = new Date(dto.startAt);

    this.logger.info(
      {
        operation: 'scheduling.service-hold.place',
        offeringId,
        resourceId: dto.resourceId,
      },
      'Placing hold on a service slot',
    );

    return this.em.transactional(async (tx) => {
      const offering = await this.visibleOffering(tx, offeringId, actor);
      const site = await this.catalogRepo.findResourceById(tx, dto.resourceId);
      if (site === null || !this.isPractitionerSite(site, offering)) {
        throw new ResourceNotFoundException('Agenda no encontrada', {
          resourceId: dto.resourceId,
        });
      }
      this.assertSiteInScope(site, actor);

      // El MISMO candado que toma la regla madre: serializa este pedido con cualquier
      // otra decisión sobre el calendario del profesional, en cualquiera de sus sedes.
      await this.professionalTime.lockPractitionerAgenda(
        tx,
        offering.practitionerProfileId,
      );

      const service = durationOf(offering);
      const endAt = new Date(
        startAt.getTime() + offering.maxDurationMinutes * MS_PER_MINUTE,
      );
      const now = new Date();
      if (startAt.getTime() <= now.getTime()) {
        throw new PreconditionFailedException('Ese horario ya pasó.', {
          startAt: startAt.toISOString(),
        });
      }
      await this.assertAffiliationCurrent(site.tenantId, actor);

      const around = {
        from: new Date(startAt.getTime() - MS_PER_DAY),
        to: new Date(endAt.getTime() + MS_PER_DAY),
      };
      const groups = (
        await this.agenda.bandsOfServices(
          tx,
          offering.practitionerProfileId,
          [
            {
              id: site.id,
              name: site.name,
              timeZone: site.timeZone ?? undefined,
            },
          ],
          around.from,
          around.to,
        )
      ).filter((group) => group.resourceId === site.id);

      const busy = await this.agenda.practitionerBusyTime(
        tx,
        offering.practitionerProfileId,
        startAt,
        endAt,
        now,
      );
      const bands: Interval[] = groups.flatMap((group) => [
        ...group.bands,
      ]);
      if (!serviceFits(bands, busy, service, startAt)) {
        throw new ConflictException(
          'Ese horario ya no está disponible para este servicio. Elija otro.',
          { offeringId, startAt: startAt.toISOString() },
        );
      }
      this.assertPolicy(groups, startAt, endAt, now);

      const catalog = await this.offeringsRepo.findCatalogItem(
        tx,
        offering.serviceCatalogId,
      );
      const span = busySpan(startAt, endAt, service);
      const retractedSlots = await this.agenda.retract(
        tx,
        site.resourceRefId,
        span.startAt,
        span.endAt,
        actor.id,
      );

      const slot = this.catalogRepo.createSlot(tx, {
        resourceId: site.id,
        serviceConceptId: catalog?.serviceConceptId ?? undefined,
        practitionerServiceOfferingId: offering.id,
        startAt,
        endAt,
        capacity: 1,
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
        actorUserId: actor.id,
      });
      await tx.flush();

      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: slot.id,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(now.getTime() + HOLD_TTL_SECONDS * 1000),
        actorUserId: actor.id,
      });
      touch(slot, actor.id);
      await tx.flush();

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        bookableSlotId: slot.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        retractedSlots,
      };
    });
  }

  /** La política de la plantilla que ofrece ese rato: aviso mínimo y anticipación máxima. */
  private assertPolicy(
    groups: readonly ServiceBands[],
    startAt: Date,
    endAt: Date,
    now: Date,
  ): void {
    const group = groups.find((g) =>
      g.bands.some(
        (band) =>
          band.startAt.getTime() <= startAt.getTime() &&
          band.endAt.getTime() >= endAt.getTime(),
      ),
    );
    if (group === undefined) return;
    if (
      startAt.getTime() <
      now.getTime() + group.minNoticeMinutes * MS_PER_MINUTE
    ) {
      throw new PreconditionFailedException(
        `Esa cita empieza demasiado pronto: hay que pedirla con al menos ${group.minNoticeMinutes} minutos de anticipación.`,
        { minNoticeMinutes: group.minNoticeMinutes },
      );
    }
    if (
      group.maxAdvanceDays !== undefined &&
      startAt.getTime() > now.getTime() + group.maxAdvanceDays * MS_PER_DAY
    ) {
      throw new PreconditionFailedException(
        `Sólo se puede pedir con hasta ${group.maxAdvanceDays} días de anticipación.`,
        { maxAdvanceDays: group.maxAdvanceDays },
      );
    }
  }

  /**
   * La oferta, si el actor puede verla.
   *
   * Un paciente sólo ve lo activo y reservable. Lo demás responde 404, igual que una
   * oferta inexistente: no se confirma que exista algo que no se puede pedir.
   */
  private async visibleOffering(
    tx: EntityManager,
    offeringId: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerServiceOfferings> {
    const offering = await this.offeringsRepo.findOfferingById(tx, offeringId);
    const missing = new ResourceNotFoundException('Servicio no encontrado', {
      offeringId,
    });
    if (offering === null) throw missing;

    const isOwner =
      actor.practitionerProfileId === offering.practitionerProfileId;
    const operatesAgendas = actor.roles.some((role) =>
      AGENDA_OPERATOR_ROLES.includes(role),
    );
    if (isOwner || operatesAgendas) return offering;

    if (
      offering.statusConceptId !== SCHED.OFFERING_ACTIVE ||
      !offering.isPatientBookable
    ) {
      throw missing;
    }
    const catalog = await this.offeringsRepo.findCatalogItem(
      tx,
      offering.serviceCatalogId,
    );
    if (catalog === null || !catalog.isActive) throw missing;
    return offering;
  }

  private isPractitionerSite(
    site: SchedulableResources,
    offering: PractitionerServiceOfferings,
  ): boolean {
    return (
      site.resourceRefId === offering.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(site.resourceRefType)
    );
  }

  /** Mismo criterio que `assertResourceInActiveTenant` de las reservas, sin lanzar. */
  private siteInScope(
    site: SchedulableResources,
    actor: AuthenticatedUser,
  ): boolean {
    if (actor.roles.includes('SUPERADMIN')) return true;
    const active = getCurrentTenantId();
    return active
      ? active === site.tenantId
      : actor.tenantIds?.includes(site.tenantId) === true;
  }

  private assertSiteInScope(
    site: SchedulableResources,
    actor: AuthenticatedUser,
  ): void {
    if (!this.siteInScope(site, actor)) {
      throw new ForbiddenException(
        'La agenda indicada pertenece a otra organización.',
      );
    }
  }

  /** ¿Es una cuenta de paciente sin más oficio? Mismo criterio que las reservas. */
  private isPatientActor(actor: AuthenticatedUser): boolean {
    if (actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role))) return false;
    return actor.practitionerProfileId === undefined;
  }

  /** Quien atiende no puede comprometer turnos de una organización que lo desvinculó. */
  private async assertAffiliationCurrent(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role))) return;
    if (actor.practitionerProfileId === undefined) return;
    const verdict = await this.affiliations.evaluate(tenantId, actor);
    if (verdict === 'sin-vinculos' || verdict === 'aprobado') return;
    throw new PreconditionFailedException(
      verdict === 'pendiente'
        ? 'Su vínculo con esta organización todavía está pendiente de aprobación.'
        : 'Su vínculo con esta organización ya no está vigente.',
      { tenantId, vinculo: verdict },
    );
  }
}

function durationOf(offering: PractitionerServiceOfferings): ServiceDuration {
  return {
    minDurationMinutes: offering.minDurationMinutes,
    maxDurationMinutes: offering.maxDurationMinutes,
    prepMinutes: offering.prepMinutes ?? 0,
    cleanupMinutes: offering.cleanupMinutes ?? 0,
  };
}
