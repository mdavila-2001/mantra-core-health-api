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

export interface CreateResourceData {
  tenantId: string;
  practiceId?: string;
  resourceTypeConceptId: string;
  resourceRefType: string;
  resourceRefId: string;
  name: string;
  timeZone?: string;
  capacity?: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateBookingPolicyData {
  tenantId: string;
  practiceId?: string;
  code: string;
  name: string;
  minNoticeMinutes?: number;
  maxAdvanceDays?: number;
  cancellationWindowMinutes?: number;
  noShowFeeAmount?: string;
  currencyConceptId?: string;
  maxActivePerPatient?: number;
  holdTtlSeconds?: number;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateTemplateData {
  resourceId: string;
  name: string;
  serviceConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  slotMinutes?: number;
  bookingPolicyId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateRuleData {
  scheduleTemplateId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes?: number;
  capacityPerSlot?: number;
  actorUserId?: string;
}

export interface CreateExceptionData {
  resourceId: string;
  exceptionTypeConceptId: string;
  startAt: Date;
  endAt: Date;
  reason?: string;
  isAvailable: boolean;
  actorUserId?: string;
}

export interface CreateSlotData {
  resourceId: string;
  scheduleTemplateId?: string;
  serviceConceptId?: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  remainingCapacity: number;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de la configuración de agenda: recursos, políticas, plantillas y slots. */
@Injectable()
export class SchedulingCatalogRepository {
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

  findResourceById(
    em: EntityManager,
    id: string,
  ): Promise<SchedulableResources | null> {
    return em.findOne(SchedulableResources, { id });
  }

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

  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<ScheduleTemplates | null> {
    return em.findOne(ScheduleTemplates, { id });
  }

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

  findRulesByTemplate(
    em: EntityManager,
    scheduleTemplateId: string,
  ): Promise<ScheduleRules[]> {
    return em.find(ScheduleRules, { scheduleTemplateId });
  }

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
