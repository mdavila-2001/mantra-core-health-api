import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  EncountersRepository,
  ObservationsRepository,
  ServiceRequestsRepository,
  type ObservationValue,
} from '../repositories';
import {
  AmendObservationDto,
  CreateObservationDto,
  ObservationResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';

/** Campos de valor recibidos por DTO (números; el modelo persiste string). */
interface ValueLike {
  valueTypeConceptId?: string;
  valueDecimal?: number;
  valueBoolean?: boolean;
  valueText?: string;
  valueConceptId?: string;
  quantityValue?: number;
  quantityUnitConceptId?: string;
}

/**
 * UC-08-03 (registrar) y UC-08-04 (enmendar) de observaciones. Respeta el VALUE
 * CONTRACT: la observación (y cada componente) lleva un único tipo de valor con su
 * familia de campos. Los performers, rangos y notas son hijos opcionales.
 */
@Injectable()
export class ObservationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly observationsRepo: ObservationsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ObservationsService.name);
  }

  /**
   * Resuelve la familia de valor a partir de los campos del DTO. Si no se indica
   * `valueTypeConceptId`, se infiere del campo presente para poblar la columna
   * NOT NULL `value_type_concept_id`.
   */
  private resolveValue(input: ValueLike): ObservationValue {
    const value: ObservationValue = { valueTypeConceptId: input.valueTypeConceptId ?? '' };
    if (input.quantityValue !== undefined) {
      value.quantityValue = String(input.quantityValue);
      value.quantityUnitConceptId = input.quantityUnitConceptId;
      value.valueTypeConceptId = input.valueTypeConceptId ?? CLIN.VALUE_TYPE_QUANTITY;
    } else if (input.valueDecimal !== undefined) {
      value.valueDecimal = String(input.valueDecimal);
      value.valueTypeConceptId = input.valueTypeConceptId ?? CLIN.VALUE_TYPE_DECIMAL;
    } else if (input.valueBoolean !== undefined) {
      value.valueBoolean = input.valueBoolean;
      value.valueTypeConceptId = input.valueTypeConceptId ?? CLIN.VALUE_TYPE_BOOLEAN;
    } else if (input.valueConceptId !== undefined) {
      value.valueConceptId = input.valueConceptId;
      value.valueTypeConceptId = input.valueTypeConceptId ?? CLIN.VALUE_TYPE_CODEABLE;
    } else if (input.valueText !== undefined) {
      value.valueText = input.valueText;
      value.valueTypeConceptId = input.valueTypeConceptId ?? CLIN.VALUE_TYPE_STRING;
    }
    return value;
  }

  /** UC-08-03: registra una observación con componentes, rangos y ejecutantes. */
  async record(dto: CreateObservationDto, actor: AuthenticatedUser): Promise<ObservationResponseDto> {
    this.logger.info(
      { operation: 'clinical.observation.record', patientProfileId: dto.patientProfileId },
      'Recording observation',
    );
    return this.em.transactional(async (tx) => {
      if (dto.encounterId) {
        const encounter = await this.encountersRepo.findById(tx, dto.encounterId);
        if (!encounter) {
          throw new ResourceNotFoundException('Encuentro no encontrado', {
            encounterId: dto.encounterId,
          });
        }
      }
      if (dto.basedOnServiceRequestId) {
        const sr = await this.serviceRequestsRepo.findById(tx, dto.basedOnServiceRequestId);
        if (!sr) {
          throw new ResourceNotFoundException('Orden de servicio no encontrada', {
            serviceRequestId: dto.basedOnServiceRequestId,
          });
        }
      }

      const value = this.resolveValue(dto);
      if (!value.valueTypeConceptId) {
        throw new PreconditionFailedException(
          'La observación requiere un valor (cantidad, decimal, texto, booleano o concepto)',
        );
      }

      const observation = this.observationsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        basedOnServiceRequestId: dto.basedOnServiceRequestId,
        categoryConceptId: dto.categoryConceptId,
        codeConceptId: dto.codeConceptId,
        statusConceptId: CLIN.OBSERVATION_FINAL,
        interpretationConceptId: dto.interpretationConceptId,
        methodConceptId: dto.methodConceptId,
        bodySiteConceptId: dto.bodySiteConceptId,
        sourceDeviceId: dto.sourceDeviceId,
        effectiveStartAt: dto.effectiveStartAt ? new Date(dto.effectiveStartAt) : undefined,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
        recordedByUserId: actor.id,
        actorUserId: actor.id,
        ...value,
      });
      await tx.flush();

      const componentIds: string[] = [];
      let ordinal = 0;
      for (const c of dto.components ?? []) {
        const cValue = this.resolveValue(c);
        const component = this.observationsRepo.createComponent(tx, {
          observationId: observation.id,
          codeConceptId: c.codeConceptId,
          interpretationConceptId: c.interpretationConceptId,
          ordinal: ordinal++,
          actorUserId: actor.id,
          ...cValue,
        });
        componentIds.push(component.id);
      }

      let performerOrdinal = 0;
      for (const p of dto.performers ?? []) {
        this.observationsRepo.createPerformer(tx, {
          observationId: observation.id,
          performerTypeConceptId: p.performerTypeConceptId,
          performerId: p.performerId,
          performerRoleConceptId: p.performerRoleConceptId,
          ordinal: performerOrdinal++,
          actorUserId: actor.id,
        });
      }

      for (const r of dto.referenceRanges ?? []) {
        this.observationsRepo.createReferenceRange(tx, {
          observationId: observation.id,
          lowValue: r.lowValue !== undefined ? String(r.lowValue) : undefined,
          highValue: r.highValue !== undefined ? String(r.highValue) : undefined,
          unitConceptId: r.unitConceptId,
          text: r.text,
          actorUserId: actor.id,
        });
      }

      for (const note of dto.notes ?? []) {
        this.observationsRepo.createNote(tx, {
          observationId: observation.id,
          authorUserId: actor.id,
          noteText: note,
        });
      }
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.observation.record', observationId: observation.id },
        'Observation recorded',
      );
      return {
        id: observation.id,
        patientProfileId: observation.patientProfileId,
        status: observation.statusConceptId,
        componentIds,
        rowVersion: observation.rowVersion,
        createdAt: observation.createdAt,
      };
    });
  }

  /** UC-08-04: corrige/enmienda una observación previa (final/preliminary). */
  async amend(
    observationId: string,
    dto: AmendObservationDto,
    actor: AuthenticatedUser,
  ): Promise<ObservationResponseDto> {
    this.logger.info(
      { operation: 'clinical.observation.amend', observationId },
      'Amending observation',
    );
    return this.em.transactional(async (tx) => {
      const observation = await this.observationsRepo.findById(tx, observationId);
      if (!observation) {
        throw new ResourceNotFoundException('Observación no encontrada', { observationId });
      }
      const amendable = [CLIN.OBSERVATION_FINAL, CLIN.OBSERVATION_PRELIMINARY];
      if (!amendable.includes(observation.statusConceptId)) {
        throw new PreconditionFailedException('La observación no admite enmienda en su estado', {
          observationId,
          status: observation.statusConceptId,
        });
      }
      if (
        dto.expectedRowVersion !== undefined &&
        dto.expectedRowVersion !== observation.rowVersion
      ) {
        throw new ConcurrencyConflictException('Versión de la observación desactualizada', {
          expected: dto.expectedRowVersion,
          actual: observation.rowVersion,
        });
      }

      const value = this.resolveValue(dto);
      if (value.valueTypeConceptId) {
        observation.valueTypeConceptId = value.valueTypeConceptId;
        observation.valueDecimal = value.valueDecimal;
        observation.valueBoolean = value.valueBoolean;
        observation.valueText = value.valueText;
        observation.valueConceptId = value.valueConceptId;
        observation.quantityValue = value.quantityValue;
        observation.quantityUnitConceptId = value.quantityUnitConceptId;
      }
      if (dto.interpretationConceptId) {
        observation.interpretationConceptId = dto.interpretationConceptId;
      }
      observation.statusConceptId = CLIN.OBSERVATION_AMENDED;
      touch(observation, actor.id);

      this.observationsRepo.createNote(tx, {
        observationId: observation.id,
        authorUserId: actor.id,
        noteText: dto.note,
      });
      await tx.flush();

      const components = await this.observationsRepo.findComponents(tx, observation.id);
      this.logger.info(
        { operation: 'clinical.observation.amend', observationId },
        'Observation amended',
      );
      return {
        id: observation.id,
        patientProfileId: observation.patientProfileId,
        status: observation.statusConceptId,
        componentIds: components.map((c) => c.id),
        rowVersion: observation.rowVersion,
        createdAt: observation.createdAt,
      };
    });
  }
}
