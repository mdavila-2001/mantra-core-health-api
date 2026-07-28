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
  /**
   * Identificador asociado a value type concept.
   */
  valueTypeConceptId: string;
  /**
   * Valor de value decimal mantenido por la instancia.
   */
  valueDecimal?: string;
  /**
   * Valor de value integer mantenido por la instancia.
   */
  valueInteger?: string;
  /**
   * Valor de value boolean mantenido por la instancia.
   */
  valueBoolean?: boolean;
  /**
   * Valor de value text mantenido por la instancia.
   */
  valueText?: string;
  /**
   * Identificador asociado a value concept.
   */
  valueConceptId?: string;
  /**
   * Valor de value datetime mantenido por la instancia.
   */
  valueDatetime?: Date;
  /**
   * Valor de quantity value mantenido por la instancia.
   */
  quantityValue?: string;
  /**
   * Identificador asociado a quantity unit concept.
   */
  quantityUnitConceptId?: string;
  /**
   * Valor de range low value mantenido por la instancia.
   */
  rangeLowValue?: string;
  /**
   * Valor de range high value mantenido por la instancia.
   */
  rangeHighValue?: string;
  /**
   * Identificador asociado a range unit concept.
   */
  rangeUnitConceptId?: string;
}

/**
 * Describe el contrato estructural de create observation data.
 */
export interface CreateObservationData extends ObservationValue {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a based on service request.
   */
  basedOnServiceRequestId?: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a interpretation concept.
   */
  interpretationConceptId?: string;
  /**
   * Identificador asociado a method concept.
   */
  methodConceptId?: string;
  /**
   * Identificador asociado a body site concept.
   */
  bodySiteConceptId?: string;
  /**
   * Identificador asociado a source device.
   */
  sourceDeviceId?: string;
  /**
   * Valor de effective start at mantenido por la instancia.
   */
  effectiveStartAt?: Date;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  issuedAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create component data.
 */
export interface CreateComponentData extends ObservationValue {
  /**
   * Identificador asociado a observation.
   */
  observationId: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a interpretation concept.
   */
  interpretationConceptId?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reference range data.
 */
export interface CreateReferenceRangeData {
  /**
   * Identificador asociado a observation.
   */
  observationId: string;
  /**
   * Identificador asociado a observation component.
   */
  observationComponentId?: string;
  /**
   * Valor de low value mantenido por la instancia.
   */
  lowValue?: string;
  /**
   * Valor de high value mantenido por la instancia.
   */
  highValue?: string;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Identificador asociado a applies to concept.
   */
  appliesToConceptId?: string;
  /**
   * Valor de age low years mantenido por la instancia.
   */
  ageLowYears?: string;
  /**
   * Valor de age high years mantenido por la instancia.
   */
  ageHighYears?: string;
  /**
   * Valor de text mantenido por la instancia.
   */
  text?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create performer data.
 */
export interface CreatePerformerData {
  /**
   * Identificador asociado a observation.
   */
  observationId: string;
  /**
   * Identificador asociado a performer type concept.
   */
  performerTypeConceptId: string;
  /**
   * Identificador asociado a performer.
   */
  performerId: string;
  /**
   * Identificador asociado a performer role concept.
   */
  performerRoleConceptId?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create note data.
 */
export interface CreateNoteData {
  /**
   * Identificador asociado a observation.
   */
  observationId: string;
  /**
   * Identificador asociado a author user.
   */
  authorUserId: string;
  /**
   * Valor de note text mantenido por la instancia.
   */
  noteText: string;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt?: Date;
}

/** Acceso a datos del agregado observación (repositorio stateless). */
@Injectable()
export class ObservationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Observations | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Observations | null> {
    return em.findOne(Observations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Observations`.
   */
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

  /**
   * Crea create component.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create component conforme al contrato `ObservationComponents`.
   */
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

  /**
   * Crea create reference range.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reference range conforme al contrato `ObservationReferenceRanges`.
   */
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

  /**
   * Crea create performer.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create performer conforme al contrato `ObservationPerformers`.
   */
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

  /**
   * Crea create note.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create note conforme al contrato `ObservationNotes`.
   */
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

  /**
   * Obtiene find components.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param observationId - Identificador de observation.
   * @returns Resultado de find components conforme al contrato `Promise<ObservationComponents[]>`.
   */
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
