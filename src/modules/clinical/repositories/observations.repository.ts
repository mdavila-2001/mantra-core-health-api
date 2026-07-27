import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Observations,
  ObservationComponents,
  ObservationReferenceRanges,
  ObservationPerformers,
  ObservationNotes,
} from '../entities';
import { createdBy } from '../../../common';

/** Familia de valor exclusiva de una observación o componente (VALUE CONTRACT). */
export interface ObservationValue {
  valueTypeConceptId: string;
  valueDecimal?: string;
  valueInteger?: string;
  valueBoolean?: boolean;
  valueText?: string;
  valueConceptId?: string;
  valueDatetime?: Date;
  quantityValue?: string;
  quantityUnitConceptId?: string;
  rangeLowValue?: string;
  rangeHighValue?: string;
  rangeUnitConceptId?: string;
}

export interface CreateObservationData extends ObservationValue {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  basedOnServiceRequestId?: string;
  categoryConceptId?: string;
  codeConceptId: string;
  statusConceptId: string;
  interpretationConceptId?: string;
  methodConceptId?: string;
  bodySiteConceptId?: string;
  sourceDeviceId?: string;
  effectiveStartAt?: Date;
  issuedAt?: Date;
  recordedByUserId?: string;
  actorUserId?: string;
}

export interface CreateComponentData extends ObservationValue {
  observationId: string;
  codeConceptId: string;
  interpretationConceptId?: string;
  ordinal: number;
  actorUserId?: string;
}

export interface CreateReferenceRangeData {
  observationId: string;
  observationComponentId?: string;
  lowValue?: string;
  highValue?: string;
  unitConceptId?: string;
  appliesToConceptId?: string;
  ageLowYears?: string;
  ageHighYears?: string;
  text?: string;
  actorUserId?: string;
}

export interface CreatePerformerData {
  observationId: string;
  performerTypeConceptId: string;
  performerId: string;
  performerRoleConceptId?: string;
  ordinal: number;
  actorUserId?: string;
}

export interface CreateNoteData {
  observationId: string;
  authorUserId: string;
  noteText: string;
  recordedAt?: Date;
}

/** Acceso a datos del agregado observación (repositorio stateless). */
@Injectable()
export class ObservationsRepository {
  findById(em: EntityManager, id: string): Promise<Observations | null> {
    return em.findOne(Observations, { id });
  }

  create(em: EntityManager, data: CreateObservationData): Observations {
    return em.create(
      Observations,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        basedOnServiceRequestId: data.basedOnServiceRequestId,
        categoryConceptId: data.categoryConceptId,
        codeConceptId: data.codeConceptId,
        statusConceptId: data.statusConceptId,
        valueTypeConceptId: data.valueTypeConceptId,
        valueDecimal: data.valueDecimal,
        valueInteger: data.valueInteger,
        valueBoolean: data.valueBoolean,
        valueText: data.valueText,
        valueConceptId: data.valueConceptId,
        valueDatetime: data.valueDatetime,
        quantityValue: data.quantityValue,
        quantityUnitConceptId: data.quantityUnitConceptId,
        rangeLowValue: data.rangeLowValue,
        rangeHighValue: data.rangeHighValue,
        rangeUnitConceptId: data.rangeUnitConceptId,
        interpretationConceptId: data.interpretationConceptId,
        methodConceptId: data.methodConceptId,
        bodySiteConceptId: data.bodySiteConceptId,
        sourceDeviceId: data.sourceDeviceId,
        effectiveStartAt: data.effectiveStartAt,
        issuedAt: data.issuedAt,
        recordedByUserId: data.recordedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createComponent(
    em: EntityManager,
    data: CreateComponentData,
  ): ObservationComponents {
    return em.create(
      ObservationComponents,
      {
        observationId: data.observationId,
        codeConceptId: data.codeConceptId,
        valueTypeConceptId: data.valueTypeConceptId,
        valueDecimal: data.valueDecimal,
        valueInteger: data.valueInteger,
        valueBoolean: data.valueBoolean,
        valueText: data.valueText,
        valueConceptId: data.valueConceptId,
        valueDatetime: data.valueDatetime,
        quantityValue: data.quantityValue,
        quantityUnitConceptId: data.quantityUnitConceptId,
        rangeLowValue: data.rangeLowValue,
        rangeHighValue: data.rangeHighValue,
        rangeUnitConceptId: data.rangeUnitConceptId,
        interpretationConceptId: data.interpretationConceptId,
        ordinal: data.ordinal,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createReferenceRange(
    em: EntityManager,
    data: CreateReferenceRangeData,
  ): ObservationReferenceRanges {
    return em.create(
      ObservationReferenceRanges,
      {
        observationId: data.observationId,
        observationComponentId: data.observationComponentId,
        lowValue: data.lowValue,
        highValue: data.highValue,
        unitConceptId: data.unitConceptId,
        appliesToConceptId: data.appliesToConceptId,
        ageLowYears: data.ageLowYears,
        ageHighYears: data.ageHighYears,
        text: data.text,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  createPerformer(
    em: EntityManager,
    data: CreatePerformerData,
  ): ObservationPerformers {
    return em.create(
      ObservationPerformers,
      {
        observationId: data.observationId,
        performerTypeConceptId: data.performerTypeConceptId,
        performerId: data.performerId,
        performerRoleConceptId: data.performerRoleConceptId,
        ordinal: data.ordinal,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  createNote(em: EntityManager, data: CreateNoteData): ObservationNotes {
    return em.create(
      ObservationNotes,
      {
        observationId: data.observationId,
        authorUserId: data.authorUserId,
        noteText: data.noteText,
        recordedAt: data.recordedAt ?? new Date(),
      },
      { partial: true },
    );
  }

  findComponents(
    em: EntityManager,
    observationId: string,
  ): Promise<ObservationComponents[]> {
    return em.find(
      ObservationComponents,
      { observationId },
      { orderBy: { ordinal: 'asc' } },
    );
  }
}
