import { randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import {
  PATIENT_REPRESENTATION_PORT,
  type PatientRepresentationPort,
} from '../ports/patient-representation.port';
import type { BookingPolicies, SchedulableResources } from '../../entities';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../infrastructure/repositories';
import {
  proposeServiceTimes,
  serviceFits,
  type Interval,
} from '../../domain/time/service-availability';
import {
  FLEXIBLE_START_STEP_MINUTES,
  flexibleBands,
  flexibleDuration,
  isWholeMinute,
} from '../../domain/time/flexible-hours';
import type {
  CreateFlexibleHoldDto,
  FlexibleAvailabilityQueryDto,
  FlexibleAvailabilityResponseDto,
  FlexibleHoldResponseDto,
  FlexibleStartDto,
} from '../../presentation/dto/scheduling-flexible.dto';
import { DEFAULT_SLOT_MINUTES } from '../../domain/catalog/catalog-concepts';
import { DEFAULT_HOLD_TTL_SECONDS } from '../../domain/booking/booking-defaults';
import { ACTIVE_BOOKING_STATES } from '../../domain/booking/booking-states';
import { AGENDA_OPERATOR_ROLES } from '../../domain/booking/agenda-actors';
import { PRACTITIONER_PROFILE_TABLES } from '../../domain/resource/practitioner-profile-tables';
import { SCHED } from '../../domain/scheduling.concepts';
import { PractitionerAffiliationGateService } from '../affiliation/practitioner-affiliation-gate.service';
import { SchedulingProfessionalTimeService } from '../professional-time/scheduling-professional-time.service';
import { SchedulingServiceAgendaService } from '../service-offerings/scheduling-service-agenda.service';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** Cuántos días se pueden mirar de una vez: una pantalla de calendario, no el año. */
const MAX_QUERY_DAYS = 62;

/** Lo que ofrece una plantilla flexible en la ventana mirada. */
interface FlexibleOffer {
  readonly templateId: string;
  readonly bands: readonly Interval[];
  readonly minutesPerPatient: number;
  readonly policy: BookingPolicies | null;
}

/**
 * Horario flexible, sin turnos fijos (P36): qué horas se pueden pedir y la
 * retención de la elegida.
 *
 * ## Cómo reserva el paciente (decisión del 2026-10-26)
 *
 * **Pide una hora libre dentro de la franja; el turno ocupa el tiempo por
 * paciente que declaró el médico.** No es un bloque con capacidad por orden de
 * llegada: varias citas con el mismo rango chocarían con la regla madre
 * (`ex_appointments_practitioner_time`), y el paciente no sabría a qué hora ir.
 * Tampoco hace falta un pedido aparte que el médico confirme: si la política de
 * la plantilla exige aprobación, la reserva ya entra como solicitud por
 * `POST /scheduling/holds/{token}/request`, como cualquier consulta.
 *
 * ## El cupo nace al retener
 *
 * Igual que el de un servicio: se calcula qué cabe (franjas menos tiempo ocupado
 * del profesional en **todas** sus sedes) y recién al retener nace un cupo de
 * capacidad 1, ya tomado, con la plantilla que lo ofreció —de ella salen la
 * política, el aviso mínimo y la vigencia de la retención—.
 *
 * ## Por qué no hay doble reserva
 *
 * La comprobación que cuenta es la de {@link placeHold}, bajo el **mismo candado
 * del profesional** que toma la regla madre (`pg_advisory_xact_lock`): dos
 * pedidos concurrentes se serializan y el segundo ve la retención del primero
 * como tiempo ocupado. Al confirmar, `assertRangeFree` y la restricción
 * `EXCLUDE` de la base son la segunda y la tercera red.
 */
@Injectable()
export class SchedulingFlexibleBookingService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly agenda: SchedulingServiceAgendaService,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly affiliations: PractitionerAffiliationGateService,
    @Inject(PATIENT_REPRESENTATION_PORT)
    private readonly representation: PatientRepresentationPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingFlexibleBookingService.name);
  }

  /**
   * Las horas que se pueden pedir en el horario flexible de una agenda.
   *
   * Es una lectura: una hora ofrecida acá puede dejar de estar libre un segundo
   * después, y por eso {@link placeHold} la vuelve a decidir. Una agenda sin
   * horario flexible publicado responde 200 con la lista vacía: existe, sólo que
   * sus turnos son fijos y se leen con `GET /scheduling/slots`.
   */
  async availability(
    resourceId: string,
    query: FlexibleAvailabilityQueryDto,
    actor: AuthenticatedUser,
  ): Promise<FlexibleAvailabilityResponseDto> {
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
      const site = await this.practitionerSite(tx, resourceId, actor);
      const offers = await this.offersOf(tx, site, from, to);
      if (offers.length === 0) {
        return {
          resourceId,
          stepMinutes: FLEXIBLE_START_STEP_MINUTES,
          items: [],
        };
      }

      const busy = await this.agenda.practitionerBusyTime(
        tx,
        site.resourceRefId,
        from,
        to,
        now,
      );

      const items = new Map<number, FlexibleStartDto>();
      for (const offer of offers) {
        const notice = offer.policy?.minNoticeMinutes ?? 0;
        const advance = offer.policy?.maxAdvanceDays ?? undefined;
        const times = proposeServiceTimes({
          bands: offer.bands,
          busy,
          service: flexibleDuration(offer.minutesPerPatient),
          notBefore: new Date(now.getTime() + notice * MS_PER_MINUTE),
          notAfter:
            advance === undefined
              ? to
              : new Date(
                  Math.min(to.getTime(), now.getTime() + advance * MS_PER_DAY),
                ),
          stepMinutes: FLEXIBLE_START_STEP_MINUTES,
        });
        for (const time of times) {
          const key = time.startAt.getTime();
          if (items.has(key)) continue;
          items.set(key, {
            templateId: offer.templateId,
            startAt: time.startAt.toISOString(),
            endAt: time.endAtMax.toISOString(),
          });
        }
      }

      return {
        resourceId,
        stepMinutes: FLEXIBLE_START_STEP_MINUTES,
        items: [...items.values()].sort((a, b) =>
          a.startAt.localeCompare(b.startAt),
        ),
      };
    });
  }

  /**
   * Retiene la hora pedida: crea su cupo y la retención.
   *
   * @throws ConflictException (409) si la hora ya no está libre.
   * @throws PreconditionFailedException (422) si no cae en una franja flexible, ya
   *   pasó, no respeta la política o no es un minuto entero.
   */
  async placeHold(
    resourceId: string,
    dto: CreateFlexibleHoldDto,
    actor: AuthenticatedUser,
  ): Promise<FlexibleHoldResponseDto> {
    // Antes de la transacción, como la retención de una consulta: la
    // comprobación lee de otro módulo y no tiene que hacerse bajo el candado.
    if (dto.patientProfileId !== undefined && this.isPatientActor(actor)) {
      await this.representation.assertMayActForPatient(
        dto.patientProfileId,
        actor,
      );
    }
    const startAt = new Date(dto.startAt);
    if (!isWholeMinute(startAt)) {
      throw new PreconditionFailedException(
        'La hora pedida tiene que caer en un minuto entero.',
        { startAt: dto.startAt },
      );
    }

    this.logger.info(
      { operation: 'scheduling.flexible-hold.place', resourceId },
      'Placing hold on a flexible-hours time',
    );

    return this.em.transactional(async (tx) => {
      const site = await this.practitionerSite(tx, resourceId, actor);

      // El MISMO candado que toma la regla madre: serializa este pedido con
      // cualquier otra decisión sobre el calendario del profesional, en
      // cualquiera de sus sedes. Desde acá hasta el commit nadie más decide.
      await this.professionalTime.lockPractitionerAgenda(
        tx,
        site.resourceRefId,
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
        to: new Date(startAt.getTime() + 2 * MS_PER_DAY),
      };
      const offers = await this.offersOf(tx, site, around.from, around.to);
      const inBand = offers.filter((offer) =>
        serviceFits(
          offer.bands,
          [],
          flexibleDuration(offer.minutesPerPatient),
          startAt,
        ),
      );
      if (inBand.length === 0) {
        throw new PreconditionFailedException(
          'Esa hora no está dentro del horario que atiende este profesional.',
          { resourceId, startAt: startAt.toISOString() },
        );
      }

      const busy = await this.agenda.practitionerBusyTime(
        tx,
        site.resourceRefId,
        around.from,
        around.to,
        now,
      );
      const offer = inBand.find((candidate) =>
        serviceFits(
          candidate.bands,
          busy,
          flexibleDuration(candidate.minutesPerPatient),
          startAt,
        ),
      );
      if (offer === undefined) {
        throw new ConflictException(
          'Esa hora ya no está disponible. Elija otra.',
          { resourceId, startAt: startAt.toISOString() },
        );
      }
      this.assertPolicy(offer.policy, startAt, now);
      await this.assertPatientBelowCap(tx, offer.policy, dto.patientProfileId);

      const endAt = new Date(
        startAt.getTime() + offer.minutesPerPatient * MS_PER_MINUTE,
      );
      const slot = this.catalogRepo.createSlot(tx, {
        resourceId: site.id,
        scheduleTemplateId: offer.templateId,
        startAt,
        endAt,
        capacity: 1,
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
        actorUserId: actor.id,
      });
      await tx.flush();

      const ttlSeconds =
        offer.policy?.holdTtlSeconds ?? DEFAULT_HOLD_TTL_SECONDS;
      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: slot.id,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        bookableSlotId: slot.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      };
    });
  }

  /**
   * Las plantillas flexibles publicadas de la agenda, con sus franjas de
   * consultas en la ventana. Una franja sólo de servicios no ofrece consultas.
   */
  private async offersOf(
    tx: EntityManager,
    site: SchedulableResources,
    from: Date,
    to: Date,
  ): Promise<FlexibleOffer[]> {
    const templates = await this.catalogRepo.findFlexibleTemplatesOfResource(
      tx,
      site.id,
      CONCEPTS.TEMPLATE_PUBLISHED,
    );
    const offers: FlexibleOffer[] = [];
    for (const { template, rules } of templates) {
      const consultations = rules.filter(
        (rule) => rule.bookingModeConceptId !== SCHED.RULE_MODE_SERVICES,
      );
      const bands = flexibleBands(
        consultations,
        site.timeZone ?? 'UTC',
        from,
        to,
        { validFrom: template.validFrom, validTo: template.validTo },
      );
      if (bands.length === 0) continue;
      const policy =
        template.bookingPolicyId == null
          ? null
          : await this.catalogRepo.findPolicyById(tx, template.bookingPolicyId);
      offers.push({
        templateId: template.id,
        bands,
        minutesPerPatient: template.slotMinutes ?? DEFAULT_SLOT_MINUTES,
        policy,
      });
    }
    return offers;
  }

  /**
   * La agenda, si es la de un profesional y el actor puede verla.
   *
   * 404 si no existe o no es de un profesional —una sala no tiene horario
   * flexible que ofrecer—; 403 si es de otra organización.
   */
  private async practitionerSite(
    tx: EntityManager,
    resourceId: string,
    actor: AuthenticatedUser,
  ): Promise<SchedulableResources> {
    const site = await this.catalogRepo.findResourceById(tx, resourceId);
    if (
      site === null ||
      !PRACTITIONER_PROFILE_TABLES.includes(site.resourceRefType)
    ) {
      throw new ResourceNotFoundException('Agenda no encontrada', {
        resourceId,
      });
    }
    if (!this.siteInScope(site, actor)) {
      throw new ForbiddenException(
        'La agenda indicada pertenece a otra organización.',
      );
    }
    return site;
  }

  /** Aviso mínimo y anticipación máxima de la política de la plantilla. */
  private assertPolicy(
    policy: BookingPolicies | null,
    startAt: Date,
    now: Date,
  ): void {
    const notice = policy?.minNoticeMinutes ?? 0;
    if (startAt.getTime() < now.getTime() + notice * MS_PER_MINUTE) {
      throw new PreconditionFailedException(
        `Esa cita empieza demasiado pronto: hay que pedirla con al menos ${notice} minutos de anticipación.`,
        { minNoticeMinutes: notice },
      );
    }
    const advance = policy?.maxAdvanceDays ?? undefined;
    if (
      advance !== undefined &&
      startAt.getTime() > now.getTime() + advance * MS_PER_DAY
    ) {
      throw new PreconditionFailedException(
        `Sólo se puede pedir con hasta ${advance} días de anticipación.`,
        { maxAdvanceDays: advance },
      );
    }
  }

  /** El tope de citas activas por paciente, igual que la retención de una consulta. */
  private async assertPatientBelowCap(
    tx: EntityManager,
    policy: BookingPolicies | null,
    patientProfileId: string | undefined,
  ): Promise<void> {
    if (!policy?.maxActivePerPatient || patientProfileId === undefined) return;
    const active = await this.bookingsRepo.countActiveBookingsForPatient(
      tx,
      patientProfileId,
      [...ACTIVE_BOOKING_STATES],
    );
    if (active >= policy.maxActivePerPatient) {
      throw new ConflictException(
        'El paciente alcanzó el máximo de citas activas',
        {
          patientProfileId,
          maxActivePerPatient: policy.maxActivePerPatient,
        },
      );
    }
  }

  /** Mismo criterio que los servicios y las reservas: la organización activa. */
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

  /** ¿Es una cuenta de paciente sin más oficio? Mismo criterio que las reservas. */
  private isPatientActor(actor: AuthenticatedUser): boolean {
    if (actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role)))
      return false;
    return actor.practitionerProfileId === undefined;
  }

  /** Quien atiende no puede comprometer turnos de una organización que lo desvinculó. */
  private async assertAffiliationCurrent(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((role) => AGENDA_OPERATOR_ROLES.includes(role)))
      return;
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
