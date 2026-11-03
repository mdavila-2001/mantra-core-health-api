import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, PreconditionFailedException } from '../../../../common';
import { SchedulingErrorReason } from '../../scheduling.error-reasons';
// Dónde se atiende lo sabe `practice`: es su dato y no se copia acá. La
// dependencia va en un solo sentido —`practice` no importa `scheduling`— así
// que no cierra ciclo.
import { SchedulingAgendaRepository } from '../../infrastructure/repositories';
import {
  PRACTITIONER_DIRECTORY_PORT,
  type PractitionerDirectoryPort,
} from '../ports/practitioner-directory.port';
import {
  BOOKING_BILLING_PORT,
  type BookingBillingPort,
} from '../ports/booking-billing.port';
import type { BookableSlots, SchedulableResources } from '../../entities';
import {
  AGENDA_MAX_LIMIT,
  BookableOrganizationsResponseDto,
  ListResourcesQueryDto,
  ListResourcesResponseDto,
  ListSlotsQueryDto,
  ListSlotsResponseDto,
  ResourceListItemDto,
  ResourceSiteDto,
  SlotListItemDto,
  SlotPriceDto,
  type ResourceType,
} from '../../presentation/dto';
import { PRACTITIONER_PROFILE_TABLES } from '../../domain/resource/practitioner-profile-tables';

const RESOURCE_TYPE_CONCEPT: Readonly<Record<ResourceType, string>> = {
  PRACTITIONER: CONCEPTS.RESOURCE_PRACTITIONER,
  ROOM: CONCEPTS.RESOURCE_ROOM,
  EQUIPMENT: CONCEPTS.RESOURCE_EQUIPMENT,
};

const DEFAULT_LIMIT = 200;

/**
 * Ventana máxima que se acepta consultar de una vez. Un año de cupos de un
 * consultorio son decenas de miles de filas: el tope obliga a paginar por
 * ventana, que es como una agenda se navega de todas formas.
 */
const MAX_WINDOW_DAYS = 92;
const MAX_WINDOW_MS = MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Lectura de la agenda: recursos, cupos y citas.
 *
 * Existe porque el módulo sólo exponía escritura. Sin `GET /scheduling/slots`
 * no hay forma de obtener el `slotId` que pide `POST /scheduling/slots/{id}/holds`,
 * de modo que reservar una cita desde el portal era, literalmente, imposible.
 */
@Injectable()
export class SchedulingAgendaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agendaRepo - Repositorio de lectura de agenda.
   * @param directory - Sede y nombre de los profesionales (`practice` y `profiles`).
   * @param billing - El precio de la consulta de cada práctica (FAC-01).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly agendaRepo: SchedulingAgendaRepository,
    @Inject(PRACTITIONER_DIRECTORY_PORT)
    private readonly directory: PractitionerDirectoryPort,
    @Inject(BOOKING_BILLING_PORT)
    private readonly billing: BookingBillingPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingAgendaService.name);
  }

  /**
   * Las organizaciones con las que un paciente puede pedir cita **hoy**: las
   * que tienen algún profesional o laboratorio con un cupo abierto por delante.
   *
   * ## Por qué cruza organizaciones
   *
   * El paciente no es de una organización: pide cita con la que tiene a su
   * profesional. Sin esta lectura, «Mis citas» sólo podía mostrar la agenda de
   * la organización por defecto de la cuenta, y el resto era inalcanzable. La
   * lista sólo trae lo que hace falta para elegir —identificador, nombre y
   * cuántos hay— y nada de la organización que no sea público para quien va a
   * reservar; los profesionales y sus cupos se piden después, uno a uno, con
   * `X-Tenant-Id` (`@PatientAnyTenant`).
   *
   * Corre en contexto de sistema porque RLS acota toda lectura al tenant de la
   * cuenta, que es justo lo que esta pregunta tiene que saltarse.
   */
  async listBookableOrganizations(): Promise<BookableOrganizationsResponseDto> {
    const rows = await this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return tx.execute<
        {
          tenant_id: string;
          name: string;
          practitioner_count: string;
          room_count: string;
        }[]
      >(
        `SELECT t.id AS tenant_id,
                coalesce(nullif(t.trade_name, ''), t.legal_name) AS name,
                count(DISTINCT r.id) FILTER (WHERE r.resource_type_concept_id = ?) AS practitioner_count,
                count(DISTINCT r.id) FILTER (WHERE r.resource_type_concept_id = ?) AS room_count
           FROM directory.tenants t
           JOIN scheduling.schedulable_resources r
             ON r.tenant_id = t.id AND r.state_concept_id = ?
           JOIN scheduling.bookable_slots s
             ON s.resource_id = r.id
            AND s.status_concept_id = ?
            AND s.remaining_capacity > 0
            AND s.start_at > now()
          WHERE t.status_concept_id = ?
            AND r.resource_type_concept_id IN (?, ?)
          GROUP BY t.id, name
          ORDER BY name`,
        [
          CONCEPTS.RESOURCE_PRACTITIONER,
          CONCEPTS.RESOURCE_ROOM,
          CONCEPTS.STATE_ACTIVE,
          CONCEPTS.SLOT_OPEN,
          CONCEPTS.TENANT_ACTIVE,
          CONCEPTS.RESOURCE_PRACTITIONER,
          CONCEPTS.RESOURCE_ROOM,
        ],
      );
    });

    const items = rows.map((row) => ({
      tenantId: row.tenant_id,
      name: row.name,
      practitionerCount: Number(row.practitioner_count),
      roomCount: Number(row.room_count),
    }));
    return { items, count: items.length };
  }

  /** Recursos agendables del tenant. */
  async listResources(
    query: ListResourcesQueryDto,
  ): Promise<ListResourcesResponseDto> {
    const em = this.em.fork();
    const resources = await this.agendaRepo.findResources(em, {
      tenantId: query.tenantId,
      practiceId: query.practiceId,
      resourceTypeConceptId: query.resourceType
        ? RESOURCE_TYPE_CONCEPT[query.resourceType]
        : undefined,
      stateConceptId: query.includeInactive ? undefined : CONCEPTS.STATE_ACTIVE,
    });

    // La ubicación se resuelve de una pasada para todos los recursos. La agenda
    // los pinta juntos, así que hacerlo de a uno sería un N+1 que no se nota en
    // desarrollo y sí en una sala de espera.
    //
    // Si `practice` no puede resolverla, la agenda sigue: quedarse sin horarios
    // porque no se pudo averiguar una dirección sería cambiar una carencia por
    // una caída.
    let sites = new Map<string, ResourceSiteDto>();
    try {
      sites = await this.directory.resolveSitesForResources(
        resources.map((resource) => ({
          refType: resource.resourceRefType,
          refId: resource.resourceRefId,
        })),
        query.tenantId,
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'scheduling.resources.list', err: error },
        'No se pudo resolver la sede de los recursos; la agenda va sin ubicación',
      );
    }

    // El nombre del profesional se resuelve en lote, por la misma razón que la
    // sede: el selector del paciente pinta todos los recursos juntos. Si la
    // resolución falla, la lista sigue con `practitionerName: null` — el
    // cliente cae al nombre del recurso, que es lo que mostraba siempre.
    let names = new Map<string, string>();
    try {
      names = await this.directory.findPractitionerNames(
        em,
        resources
          .filter((resource) =>
            PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType),
          )
          .map((resource) => resource.resourceRefId),
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'scheduling.resources.list', err: error },
        'No se pudo resolver el nombre de los profesionales; la agenda va con el nombre del recurso',
      );
    }

    const items = resources.map((resource) =>
      this.toResourceItem(
        resource,
        sites.get(resource.resourceRefId) ?? null,
        names.get(resource.resourceRefId) ?? null,
      ),
    );
    return { items, count: items.length };
  }

  /**
   * Cupos de la ventana. Con `onlyAvailable` devuelve exactamente lo que el
   * portal puede ofrecer para reservar.
   */
  async listSlots(query: ListSlotsQueryDto): Promise<ListSlotsResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    this.assertWindow(from, to);

    const limit = query.limit ?? DEFAULT_LIMIT;
    const em = this.em.fork();
    const rows = await this.agendaRepo.findSlots(
      em,
      {
        resourceId: query.resourceId,
        scheduleTemplateId: query.scheduleTemplateId,
        from,
        to,
        onlyAvailable: query.onlyAvailable,
        now: new Date(),
        openStatusConceptId: CONCEPTS.SLOT_OPEN,
      },
      limit,
    );

    const truncated = rows.length > limit;
    const page = rows.slice(0, limit);
    const prices = await this.slotPrices(em, page);
    const items = page.map((slot) =>
      this.toSlotItem(slot, prices.get(slot.resourceId) ?? null),
    );
    if (truncated) {
      this.logger.warn(
        { operation: 'scheduling.slots.list', limit },
        'Slot window exceeded the page cap; narrow the window',
      );
    }
    return { items, count: items.length, limit, truncated };
  }

  /** Citas que cumplen el filtro, ordenadas por el instante del cupo. */
  private assertWindow(from: Date, to: Date): void {
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: from.toISOString(), to: to.toISOString() },
        SchedulingErrorReason.AGENDA_WINDOW_INVERTED,
      );
    }
    if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
      throw new PreconditionFailedException(
        `La ventana no puede superar ${MAX_WINDOW_DAYS} días`,
        { maxWindowDays: MAX_WINDOW_DAYS, maxLimit: AGENDA_MAX_LIMIT },
        SchedulingErrorReason.AGENDA_WINDOW_TOO_WIDE,
      );
    }
  }

  /** Proyecta el recurso al contrato de lectura. */
  private toResourceItem(
    resource: SchedulableResources,
    site: ResourceSiteDto | null,
    practitionerName: string | null,
  ): ResourceListItemDto {
    return {
      site,
      practitionerName,
      id: resource.id,
      name: resource.name,
      resourceTypeConceptId: resource.resourceTypeConceptId,
      resourceRefType: resource.resourceRefType,
      resourceRefId: resource.resourceRefId,
      practiceId: resource.practiceId ?? null,
      timeZone: resource.timeZone ?? null,
      // El recurso puede no declarar capacidad; 1 es lo que asume el alta.
      capacity: resource.capacity ?? 1,
      stateConceptId: resource.stateConceptId,
    };
  }

  /**
   * El precio de la consulta por recurso, en lote: una consulta para las
   * prácticas y otra para sus precios. Un precio que no es mayor que 0 no se
   * publica: el paciente ve «todavía no publicó el precio», nunca «0,00».
   */
  private async slotPrices(
    em: EntityManager,
    slots: readonly BookableSlots[],
  ): Promise<Map<string, SlotPriceDto>> {
    const practices = await this.agendaRepo.findResourcePractices(em, [
      ...new Set(slots.map((s) => s.resourceId)),
    ]);
    if (practices.size === 0) return new Map();
    const prices = await this.billing.findConsultationPrices(em, [
      ...new Set(practices.values()),
    ]);
    const byResource = new Map<string, SlotPriceDto>();
    for (const [resourceId, practiceId] of practices) {
      const amount = Number(prices.get(practiceId)?.price);
      if (amount > 0)
        byResource.set(resourceId, { amount, currencyCode: 'BOB' });
    }
    return byResource;
  }

  /** Proyecta el cupo al contrato de lectura. */
  private toSlotItem(
    slot: BookableSlots,
    price: SlotPriceDto | null,
  ): SlotListItemDto {
    return {
      id: slot.id,
      resourceId: slot.resourceId,
      scheduleTemplateId: slot.scheduleTemplateId ?? null,
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      capacity: slot.capacity,
      remainingCapacity: slot.remainingCapacity,
      statusConceptId: slot.statusConceptId,
      serviceConceptId: slot.serviceConceptId ?? null,
      price,
    };
  }
}
