import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
// Dónde se atiende lo sabe `practice`: es su dato y no se copia acá. La
// dependencia va en un solo sentido —`practice` no importa `scheduling`— así
// que no cierra ciclo.
import { PractitionerSitesService } from '../../practice/services';
import { SchedulingAgendaRepository } from '../repositories';
import type { BookableSlots, SchedulableResources } from '../entities';
import {
  AGENDA_MAX_LIMIT,
  ListResourcesQueryDto,
  ListResourcesResponseDto,
  ListSlotsQueryDto,
  ListSlotsResponseDto,
  ResourceListItemDto,
  ResourceSiteDto,
  SlotListItemDto,
  type ResourceType,
} from '../dto';

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
   * @param sitesService - Resolución de la sede de cada recurso (`practice`).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly agendaRepo: SchedulingAgendaRepository,
    private readonly sitesService: PractitionerSitesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingAgendaService.name);
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
      sites = await this.sitesService.resolveSitesForResources(
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

    const items = resources.map((resource) =>
      this.toResourceItem(resource, sites.get(resource.resourceRefId) ?? null),
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
        openStatusConceptId: CONCEPTS.SLOT_OPEN,
      },
      limit,
    );

    const truncated = rows.length > limit;
    const items = rows.slice(0, limit).map((slot) => this.toSlotItem(slot));
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
      );
    }
    if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
      throw new PreconditionFailedException(
        `La ventana no puede superar ${MAX_WINDOW_DAYS} días`,
        { maxWindowDays: MAX_WINDOW_DAYS, maxLimit: AGENDA_MAX_LIMIT },
      );
    }
  }

  /** Proyecta el recurso al contrato de lectura. */
  private toResourceItem(
    resource: SchedulableResources,
    site: ResourceSiteDto | null,
  ): ResourceListItemDto {
    return {
      site,
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

  /** Proyecta el cupo al contrato de lectura. */
  private toSlotItem(slot: BookableSlots): SlotListItemDto {
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
    };
  }
}
