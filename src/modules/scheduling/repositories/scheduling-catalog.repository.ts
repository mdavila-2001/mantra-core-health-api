import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SchedulableResources,
  BookingPolicies,
  ScheduleTemplates,
  ScheduleRules,
  AvailabilityExceptions,
  BookableSlots,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create resource data.
 */
export interface CreateResourceData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Valor de resource ref type mantenido por la instancia.
   */
  resourceRefType: string;
  /**
   * Identificador asociado a resource ref.
   */
  resourceRefId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create booking policy data.
 */
export interface CreateBookingPolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de min notice minutes mantenido por la instancia.
   */
  minNoticeMinutes?: number;
  /**
   * Valor de max advance days mantenido por la instancia.
   */
  maxAdvanceDays?: number;
  /**
   * Valor de cancellation window minutes mantenido por la instancia.
   */
  cancellationWindowMinutes?: number;
  /**
   * Valor de no show fee amount mantenido por la instancia.
   */
  noShowFeeAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de max active per patient mantenido por la instancia.
   */
  maxActivePerPatient?: number;
  /**
   * Valor de hold ttl seconds mantenido por la instancia.
   */
  holdTtlSeconds?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create template data.
 */
export interface CreateTemplateData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  slotMinutes?: number;
  /**
   * Identificador asociado a booking policy.
   */
  bookingPolicyId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create rule data.
 */
export interface CreateRuleData {
  /**
   * Identificador asociado a schedule template.
   */
  scheduleTemplateId: string;
  /**
   * Valor de day of week mantenido por la instancia.
   */
  dayOfWeek: number;
  /**
   * Valor de start time mantenido por la instancia.
   */
  startTime: string;
  /**
   * Valor de end time mantenido por la instancia.
   */
  endTime: string;
  /**
   * Valor de slot minutes mantenido por la instancia.
   */
  slotMinutes?: number;
  /**
   * Valor de capacity per slot mantenido por la instancia.
   */
  capacityPerSlot?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create exception data.
 */
export interface CreateExceptionData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a exception type concept.
   */
  exceptionTypeConceptId: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt: Date;
  /**
   * Valor de reason mantenido por la instancia.
   */
  reason?: string;
  /**
   * Valor de is available mantenido por la instancia.
   */
  isAvailable: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create slot data.
 */
export interface CreateSlotData {
  /**
   * Identificador asociado a resource.
   */
  resourceId: string;
  /**
   * Identificador asociado a schedule template.
   */
  scheduleTemplateId?: string;
  /**
   * Identificador asociado a service concept.
   */
  serviceConceptId?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt: Date;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity: number;
  /**
   * Valor de remaining capacity mantenido por la instancia.
   */
  remainingCapacity: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de la configuración de agenda: recursos, políticas, plantillas y slots. */
@Injectable()
export class SchedulingCatalogRepository {
  /**
   * Crea create resource.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create resource conforme al contrato `SchedulableResources`.
   */
  createResource(
    em: EntityManager,
    data: CreateResourceData,
  ): SchedulableResources {
    return em.create(
      SchedulableResources,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceRefType: data.resourceRefType,
        resourceRefId: data.resourceRefId,
        name: data.name,
        timeZone: data.timeZone,
        capacity: data.capacity,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find resource by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find resource by id conforme al contrato `Promise<SchedulableResources | null>`.
   */
  findResourceById(
    em: EntityManager,
    id: string,
  ): Promise<SchedulableResources | null> {
    return em.findOne(SchedulableResources, { id });
  }

  /**
   * Crea create policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create policy conforme al contrato `BookingPolicies`.
   */
  createPolicy(
    em: EntityManager,
    data: CreateBookingPolicyData,
  ): BookingPolicies {
    return em.create(
      BookingPolicies,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        minNoticeMinutes: data.minNoticeMinutes,
        maxAdvanceDays: data.maxAdvanceDays,
        cancellationWindowMinutes: data.cancellationWindowMinutes,
        noShowFeeAmount: data.noShowFeeAmount,
        currencyConceptId: data.currencyConceptId,
        maxActivePerPatient: data.maxActivePerPatient,
        holdTtlSeconds: data.holdTtlSeconds,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<BookingPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<BookingPolicies | null> {
    return em.findOne(BookingPolicies, { id });
  }

  /** La UNIQUE es `(tenant_id, code)`; esta lectura anticipa el conflicto. */
  findPolicyByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<BookingPolicies | null> {
    return em.findOne(BookingPolicies, { tenantId, code });
  }

  /**
   * Crea create template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create template conforme al contrato `ScheduleTemplates`.
   */
  createTemplate(
    em: EntityManager,
    data: CreateTemplateData,
  ): ScheduleTemplates {
    return em.create(
      ScheduleTemplates,
      {
        resourceId: data.resourceId,
        name: data.name,
        serviceConceptId: data.serviceConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        slotMinutes: data.slotMinutes,
        bookingPolicyId: data.bookingPolicyId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find template by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find template by id conforme al contrato `Promise<ScheduleTemplates | null>`.
   */
  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<ScheduleTemplates | null> {
    return em.findOne(ScheduleTemplates, { id });
  }

  /**
   * Crea create rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create rule conforme al contrato `ScheduleRules`.
   */
  createRule(em: EntityManager, data: CreateRuleData): ScheduleRules {
    return em.create(
      ScheduleRules,
      {
        scheduleTemplateId: data.scheduleTemplateId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        slotMinutes: data.slotMinutes,
        capacityPerSlot: data.capacityPerSlot,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find rules by template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scheduleTemplateId - Identificador de schedule template.
   * @returns Resultado de find rules by template conforme al contrato `Promise<ScheduleRules[]>`.
   */
  findRulesByTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
  ): Promise<ScheduleRules[]> {
    return em.find(ScheduleRules, { scheduleTemplateId });
  }

  /**
   * Crea create exception.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create exception conforme al contrato `AvailabilityExceptions`.
   */
  createException(
    em: EntityManager,
    data: CreateExceptionData,
  ): AvailabilityExceptions {
    return em.create(
      AvailabilityExceptions,
      {
        resourceId: data.resourceId,
        exceptionTypeConceptId: data.exceptionTypeConceptId,
        startAt: data.startAt,
        endAt: data.endAt,
        reason: data.reason,
        isAvailable: data.isAvailable,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create slot.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create slot conforme al contrato `BookableSlots`.
   */
  createSlot(em: EntityManager, data: CreateSlotData): BookableSlots {
    return em.create(
      BookableSlots,
      {
        resourceId: data.resourceId,
        scheduleTemplateId: data.scheduleTemplateId,
        serviceConceptId: data.serviceConceptId,
        startAt: data.startAt,
        endAt: data.endAt,
        capacity: data.capacity,
        remainingCapacity: data.remainingCapacity,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Slots ya generados para la plantilla en la ventana pedida. La regeneración es
   * idempotente: los que ya existen no se vuelven a crear.
   */
  findSlotsByTemplateInRange(
    em: EntityManager,
    scheduleTemplateId: string,
    from: Date,
    to: Date,
  ): Promise<BookableSlots[]> {
    return em.find(BookableSlots, {
      scheduleTemplateId,
      startAt: { $gte: from, $lt: to },
    });
  }

  /**
   * Agenda publicada de un recurso en una ventana de tiempo (UC-41-14).
   *
   * Es la consulta que hace posible reservar desde una pantalla: hasta ahora los
   * slots se generaban pero no se podían listar, así que el único modo de
   * conseguir un `slotId` para tomar un hold era mirar la base de datos.
   *
   * `onlyAvailable` filtra por capacidad restante y no por estado: un slot puede
   * seguir marcado como abierto y tener el cupo tomado por un hold vivo, y
   * ofrecerlo llevaría al paciente a un 409 al intentar reservarlo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param resourceId - Recurso cuya agenda se consulta.
   * @param from - Inicio de la ventana (inclusive).
   * @param to - Fin de la ventana (exclusive).
   * @param options - `onlyAvailable` y tope de filas.
   * @returns Slots ordenados cronológicamente.
   */
  findSlotsByResourceInRange(
    em: EntityManager,
    resourceId: string,
    from: Date,
    to: Date,
    options: { onlyAvailable: boolean; limit: number },
  ): Promise<BookableSlots[]> {
    const where: Record<string, unknown> = {
      resourceId,
      startAt: { $gte: from, $lt: to },
    };
    if (options.onlyAvailable) {
      where.remainingCapacity = { $gt: 0 };
    }
    return em.find(BookableSlots, where, {
      orderBy: { startAt: 'ASC' },
      limit: options.limit,
    });
  }

  /** Slots del recurso que se solapan con una excepción de no disponibilidad. */
  findOpenSlotsInWindow(
    em: EntityManager,
    resourceId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<BookableSlots[]> {
    return em.find(BookableSlots, {
      resourceId,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    });
  }
}
