import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch } from '../../../../common';
import type {
  BookableSlots,
  PractitionerServiceOfferings,
} from '../../entities';
import type { ServiceCatalog } from '../../../billing/entities';
import {
  SchedulingCatalogRepository,
  SchedulingOfferingsRepository,
} from '../../infrastructure/repositories';
import { SCHED } from '../../domain/scheduling.concepts';
import {
  slotsThatCanReopen,
  busySpan,
  type Interval,
} from '../../domain/time/service-availability';
import {
  matchingLocalDays,
  localTimeToUtc,
  type LocalDay,
} from '../../domain/time/scheduling-time';
import { SchedulingProfessionalTimeService } from '../professional-time/scheduling-professional-time.service';

const MS_PER_MINUTE = 60_000;

/**
 * Cuánto se ensancha la ventana al mirar compromisos vecinos: el techo de los
 * colchones (`MAX_SERVICE_BUFFER_MINUTES`), para no perder un turno cuya limpieza
 * llega hasta el rango que se está mirando aunque él mismo quede afuera.
 */
const BUFFER_MARGIN_MS = 240 * MS_PER_MINUTE;

/** Franjas de una plantilla que admiten servicios, con las reglas de su política. */
export interface ServiceBands {
  readonly resourceId: string;
  readonly resourceName: string;
  readonly bands: readonly Interval[];
  /** Aviso mínimo de la política de la plantilla, en minutos (0 ≡ sin política). */
  readonly minNoticeMinutes: number;
  /** Días de anticipación máximos; `undefined` ≡ sin tope declarado. */
  readonly maxAdvanceDays?: number;
}

/** Un recurso con lo mínimo que hace falta para mirar sus franjas. */
export interface PractitionerSite {
  readonly id: string;
  readonly name: string;
  readonly timeZone?: string;
}

/**
 * El tiempo de un profesional visto desde los servicios: qué está ocupado, qué franjas
 * admiten servicios y cómo se retraen y reabren los cupos de consulta.
 *
 * ## Por qué es un servicio aparte
 *
 * Lo usan tres casos de uso —leer horarios, retener un turno y reabrir lo retraído al
 * cancelar, vencer o terminar antes— y los tres tienen que mirar **el mismo** tiempo
 * ocupado. Con tres copias, la primera que se desviara dejaría ofrecer un horario que
 * otra rechaza.
 *
 * ## Qué cuenta como ocupado
 *
 * Citas confirmadas y tiempo ocupado (la regla madre), **retenciones vivas** de
 * cualquier cupo, y los turnos de servicio vivos **ensanchados con sus colchones**.
 * Las retenciones no las cuenta la regla madre y con turnos de largo variable son
 * justo lo que permite que dos pacientes reserven rangos que se pisan.
 */
@Injectable()
export class SchedulingServiceAgendaService {
  constructor(
    private readonly offeringsRepo: SchedulingOfferingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
  ) {}

  /**
   * Todo lo que ocupa el tiempo del profesional en un rango, en todas sus sedes.
   *
   * @param now - «Ahora», inyectado para que las retenciones vencidas no cuenten.
   */
  async practitionerBusyTime(
    em: EntityManager,
    practitionerProfileId: string,
    from: Date,
    to: Date,
    now: Date,
  ): Promise<Interval[]> {
    const wideFrom = new Date(from.getTime() - BUFFER_MARGIN_MS);
    const wideTo = new Date(to.getTime() + BUFFER_MARGIN_MS);

    const [commitments, holds, services] = await Promise.all([
      this.professionalTime.commitments(
        em,
        practitionerProfileId,
        wideFrom,
        wideTo,
      ),
      this.offeringsRepo.findLiveHoldsOfProfessional(
        em,
        practitionerProfileId,
        wideFrom,
        wideTo,
        CONCEPTS.HOLD_ACTIVE,
        now,
      ),
      this.offeringsRepo.findLiveServiceSlotsOfProfessional(
        em,
        practitionerProfileId,
        wideFrom,
        wideTo,
        {
          bookedStatusConceptId: CONCEPTS.SLOT_BOOKED,
          heldStatusConceptId: CONCEPTS.SLOT_HELD,
          activeHoldStatusConceptId: CONCEPTS.HOLD_ACTIVE,
        },
        now,
      ),
    ]);

    return [
      ...commitments.map((c) => ({ startAt: c.startAt, endAt: c.endAt })),
      ...holds.map((r) => ({ startAt: r.startAt, endAt: r.endAt })),
      ...services.map((s) => busySpan(s.startAt, s.endAt, s)),
    ];
  }

  /**
   * Las franjas que admiten servicios en el rango, por plantilla.
   *
   * Una franja admite servicios si su modo es `SERVICES` o `MIXED`. Sin modo
   * declarado (`NULL`) es sólo consultas: así se comportaba toda franja antes de este
   * cambio y es lo que mantiene intacta la agenda existente.
   */
  async bandsOfServices(
    em: EntityManager,
    practitionerProfileId: string,
    sites: readonly PractitionerSite[],
    from: Date,
    to: Date,
  ): Promise<ServiceBands[]> {
    if (sites.length === 0) return [];
    const siteById = new Map(sites.map((site) => [site.id, site]));

    const rules = await this.catalogRepo.findRulesByResourceOwner(
      em,
      practitionerProfileId,
      CONCEPTS.TEMPLATE_PUBLISHED,
    );

    const byTemplate = new Map<string, ServiceBands & { bands: Interval[] }>();
    for (const { rule, resourceId, validTo: validUntil } of rules) {
      const site = siteById.get(resourceId);
      if (site === undefined) continue;
      if (!acceptsServices(rule.bookingModeConceptId)) continue;

      let group = byTemplate.get(rule.scheduleTemplateId);
      if (group === undefined) {
        const policy = await this.policyOf(em, rule.scheduleTemplateId);
        group = {
          resourceId,
          resourceName: site.name,
          bands: [],
          minNoticeMinutes: policy.minNoticeMinutes,
          maxAdvanceDays: policy.maxAdvanceDays,
        };
        byTemplate.set(rule.scheduleTemplateId, group);
      }

      const zone = site.timeZone ?? 'UTC';
      for (const day of matchingLocalDays(from, to, rule.dayOfWeek, zone)) {
        if (!validThatDay(day, rule.validFrom, rule.validTo ?? validUntil))
          continue;
        const start = localTimeToUtc(day, rule.startTime, zone);
        const end = localTimeToUtc(day, rule.endTime, zone);
        const clippedFrom = start < from ? from : start;
        const clippedTo = end > to ? to : end;
        if (clippedTo > clippedFrom) {
          group.bands.push({
            startAt: clippedFrom,
            endAt: clippedTo,
          });
        }
      }
    }
    return [...byTemplate.values()];
  }

  /**
   * Retira de la oferta los cupos de consulta que un turno de servicio pisa.
   *
   * Es el mismo gesto que la cita puntual del doctor, con un estado propio: el
   * cupo queda **retraído** y no bloqueado, porque al bloqueado nadie lo devuelve y
   * al retraído sí. Sólo los intactos (sin reserva adentro).
   *
   * @returns Cuántos cupos se retiraron.
   */
  async retract(
    em: EntityManager,
    resourceRefId: string,
    from: Date,
    to: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    const freeOnes = await this.catalogRepo.findOpenSlotsOfProfessionalInWindow(
      em,
      resourceRefId,
      from,
      to,
      CONCEPTS.SLOT_OPEN,
    );
    for (const free of freeOnes) {
      free.statusConceptId = SCHED.SLOT_RETRACTED;
      touch(free, actorUserId);
    }
    return freeOnes.length;
  }

  /**
   * Vuelve a ofrecer los cupos de consulta retraídos que **ya no chocan con nada**.
   *
   * Se llama cuando un turno de servicio deja de ocupar tiempo: vence la retención,
   * se cancela o termina antes. Reabre sólo lo que quedó libre: el cupo que otro
   * servicio sigue pisando se queda retraído, porque ofrecerlo sería ofrecer un
   * horario que no existe.
   *
   * @param from - Inicio del rango que se acaba de liberar.
   * @param to - Fin del rango que se acaba de liberar.
   * @returns Cuántos cupos volvieron a ofrecerse.
   */
  async reopen(
    em: EntityManager,
    practitionerProfileId: string,
    from: Date,
    to: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    const wideFrom = new Date(from.getTime() - BUFFER_MARGIN_MS);
    const wideTo = new Date(to.getTime() + BUFFER_MARGIN_MS);

    const retracted = await this.offeringsRepo.findRetractedSlotsOfProfessional(
      em,
      practitionerProfileId,
      wideFrom,
      wideTo,
      SCHED.SLOT_RETRACTED,
    );
    if (retracted.length === 0) return 0;

    const busy = await this.practitionerBusyTime(
      em,
      practitionerProfileId,
      wideFrom,
      wideTo,
      new Date(),
    );
    const reopenable = new Set(
      slotsThatCanReopen(
        retracted.map((slot) => ({
          id: slot.id,
          startAt: slot.startAt,
          endAt: slot.endAt ?? slot.startAt,
        })),
        busy,
      ),
    );
    const reopened: BookableSlots[] = retracted.filter((slot) =>
      reopenable.has(slot.id),
    );
    for (const slot of reopened) {
      slot.statusConceptId = CONCEPTS.SLOT_OPEN;
      touch(slot, actorUserId);
    }
    return reopened.length;
  }

  /**
   * Devuelve las consultas retraídas que el rango de un cupo ya no pisa.
   *
   * Resuelve el profesional desde el recurso del cupo; un cupo de un recurso que no es
   * un profesional (una sala, un equipo) no retrae nada y no devuelve nada.
   */
  async reopenSpan(
    em: EntityManager,
    slot: { resourceId?: string | null },
    from: Date,
    to: Date,
    actorUserId: string | undefined,
  ): Promise<number> {
    if (!slot.resourceId) return 0;
    const resource = await this.catalogRepo.findResourceById(
      em,
      slot.resourceId,
    );
    if (
      !resource ||
      !['practitioner_profiles', 'health_practitioner_profiles'].includes(
        resource.resourceRefType,
      )
    ) {
      return 0;
    }
    return this.reopen(em, resource.resourceRefId, from, to, actorUserId);
  }

  /** La oferta de un cupo de servicio y lo que el catálogo dice de su servicio. */
  async offeringOfSlot(
    em: EntityManager,
    offeringId: string,
  ): Promise<{
    offering: PractitionerServiceOfferings;
    catalog: ServiceCatalog | null;
  } | null> {
    const offering = await this.offeringsRepo.findOfferingById(em, offeringId);
    if (offering === null) return null;
    const catalog = await this.offeringsRepo.findCatalogItem(
      em,
      offering.serviceCatalogId,
    );
    return { offering: offering, catalog: catalog };
  }

  private async policyOf(
    em: EntityManager,
    templateId: string,
  ): Promise<{ minNoticeMinutes: number; maxAdvanceDays?: number }> {
    const template = await this.catalogRepo.findTemplateById(em, templateId);
    const policy =
      template?.bookingPolicyId == null
        ? null
        : await this.catalogRepo.findPolicyById(em, template.bookingPolicyId);
    return {
      minNoticeMinutes: policy?.minNoticeMinutes ?? 0,
      maxAdvanceDays: policy?.maxAdvanceDays ?? undefined,
    };
  }
}

function acceptsServices(mode?: string | null): boolean {
  return mode === SCHED.RULE_MODE_SERVICES || mode === SCHED.RULE_MODE_MIXED;
}

/** `YYYY-MM-DD` de un día local, comparable como texto. */
function ymdOfDay(day: LocalDay): string {
  const two = (n: number): string => String(n).padStart(2, '0');
  return `${day.year}-${two(day.month)}-${two(day.day)}`;
}

/** `YYYY-MM-DD` de una columna `date`, que el driver entrega como `Date` o como texto. */
function ymdOfColumn(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

function validThatDay(
  day: LocalDay,
  validFrom?: Date | string | null,
  validTo?: Date | string | null,
): boolean {
  const ymd = ymdOfDay(day);
  if (validFrom != null && ymd < ymdOfColumn(validFrom)) return false;
  if (validTo != null && ymd > ymdOfColumn(validTo)) return false;
  return true;
}
