import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  FieldValuesRepository,
  FormInstancesRepository,
} from '../repositories';
import {
  CaptureValuesDto,
  CorrectValueDto,
  ImportValuesDto,
  IdListResponseDto,
  IdResponseDto,
} from '../dto';
import { FORMS } from '../forms.concepts';
import { buildValueColumns } from './value-columns';

/**
 * Captura y curación de valores de formulario: captura con value[x] exclusivo
 * (UC-09-08), corrección con supersede y snapshot inmutable (UC-09-09) e
 * importación batch con procedencia (UC-09-10). Cada escritura de valor deja un
 * registro append-only en `field_value_audit`.
 */
@Injectable()
export class FormsValuesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param valuesRepo - Valor de values repo requerido por la operación.
   * @param instancesRepo - Valor de instances repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly valuesRepo: FieldValuesRepository,
    private readonly instancesRepo: FormInstancesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsValuesService.name);
  }

  /** UC-09-08: captura valores en una instancia abierta. */
  async captureValues(
    instanceId: string,
    dto: CaptureValuesDto,
    actor: AuthenticatedUser,
  ): Promise<IdListResponseDto> {
    this.logger.info(
      {
        operation: 'forms.value.capture',
        instanceId,
        count: dto.values.length,
      },
      'Capturing field values',
    );
    return this.em.transactional(async (tx) => {
      const instance = await this.instancesRepo.findById(tx, instanceId);
      if (!instance)
        throw new ResourceNotFoundException('Instancia no encontrada', {
          instanceId,
        });
      if (instance.stateConceptId !== FORMS.INSTANCE_OPEN) {
        throw new PreconditionFailedException('La instancia no está abierta', {
          instanceId,
        });
      }

      const created = dto.values.map((v) =>
        this.valuesRepo.create(tx, {
          formInstanceId: instanceId,
          resourceTypeConceptId: instance.resourceTypeConceptId,
          resourceId: instance.resourceId,
          fieldId: v.fieldId,
          assignmentId: v.assignmentId,
          ordinal: v.ordinal ?? 0,
          unitConceptId: v.unitConceptId,
          dataSourceConceptId: FORMS.SOURCE_INTERNAL,
          valueStatusConceptId: FORMS.VALUE_FINAL,
          valueVersion: 1,
          effectiveFrom: new Date(),
          actorUserId: actor.id,
          ...buildValueColumns(v.dataType, v.value),
        }),
      );
      // FK planas: persistir los valores antes de su auditoría.
      await tx.flush();

      for (const value of created) {
        this.valuesRepo.createAudit(tx, {
          fieldValueId: value.id,
          actionConceptId: FORMS.AUDIT_CREATE,
          userId: actor.id,
          newSnapshotJson: this.snapshot(value),
        });
      }

      touch(instance, actor.id);

      return { ids: created.map((v) => v.id) };
    });
  }

  /** UC-09-09: corrige un valor creando una nueva versión y superando la anterior. */
  async correctValue(
    valueId: string,
    dto: CorrectValueDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info(
      { operation: 'forms.value.correct', valueId },
      'Correcting field value',
    );
    return this.em.transactional(async (tx) => {
      const previous = await this.valuesRepo.findById(tx, valueId);
      if (!previous)
        throw new ResourceNotFoundException('Valor no encontrado', { valueId });
      if (previous.valueStatusConceptId === FORMS.VALUE_SUPERSEDED) {
        throw new PreconditionFailedException('El valor ya fue superado', {
          valueId,
        });
      }

      const previousSnapshot = this.snapshot(previous);

      const corrected = this.valuesRepo.create(tx, {
        formInstanceId: previous.formInstanceId,
        resourceTypeConceptId: previous.resourceTypeConceptId,
        resourceId: previous.resourceId,
        fieldId: previous.fieldId,
        assignmentId: previous.assignmentId,
        ordinal: previous.ordinal,
        unitConceptId: previous.unitConceptId,
        dataSourceConceptId: FORMS.SOURCE_INTERNAL,
        valueStatusConceptId: FORMS.VALUE_CORRECTED,
        valueVersion: (previous.valueVersion ?? 1) + 1,
        supersedesValueId: previous.id,
        effectiveFrom: new Date(),
        actorUserId: actor.id,
        ...buildValueColumns(dto.dataType, dto.value),
      });
      await tx.flush();

      previous.effectiveTo = new Date();
      previous.valueStatusConceptId = FORMS.VALUE_SUPERSEDED;
      touch(previous, actor.id);

      this.valuesRepo.createAudit(tx, {
        fieldValueId: corrected.id,
        actionConceptId: FORMS.AUDIT_CORRECT,
        userId: actor.id,
        reasonConceptId: dto.reasonConceptId ?? FORMS.REASON_CORRECTION,
        previousSnapshotJson: previousSnapshot,
        newSnapshotJson: this.snapshot(corrected),
      });

      return { id: corrected.id };
    });
  }

  /** UC-09-10: importa valores externos (batch ETL) con su procedencia. */
  async importValues(
    dto: ImportValuesDto,
    actor: AuthenticatedUser,
  ): Promise<IdListResponseDto> {
    this.logger.info(
      {
        operation: 'forms.value.import',
        importBatchId: dto.importBatchId,
        count: dto.items.length,
      },
      'Importing field values',
    );
    return this.em.transactional(async (tx) => {
      const created: {
        /**
         * Identificador único de la instancia.
         */
        id: string;
        /**
         * Valor de snapshot mantenido por la instancia.
         */
        snapshot: unknown;
        /**
         * Valor de item mantenido por la instancia.
         */
        item: (typeof dto.items)[number];
      }[] = [];

      for (const item of dto.items) {
        const instance = await this.instancesRepo.findById(
          tx,
          item.formInstanceId,
        );
        if (!instance) {
          throw new ResourceNotFoundException('Instancia no encontrada', {
            formInstanceId: item.formInstanceId,
          });
        }
        const value = this.valuesRepo.create(tx, {
          formInstanceId: item.formInstanceId,
          resourceTypeConceptId: instance.resourceTypeConceptId,
          resourceId: instance.resourceId,
          fieldId: item.fieldId,
          ordinal: 0,
          dataSourceConceptId: FORMS.SOURCE_EXTERNAL,
          valueStatusConceptId: FORMS.VALUE_PRELIMINARY,
          valueVersion: 1,
          effectiveFrom: new Date(),
          actorUserId: actor.id,
          ...buildValueColumns(item.dataType, item.value),
        });
        created.push({ id: value.id, snapshot: this.snapshot(value), item });
      }
      // FK planas: persistir los valores antes de procedencia y auditoría.
      await tx.flush();

      for (const c of created) {
        this.valuesRepo.createProvenance(tx, {
          fieldValueId: c.id,
          sourceSystemUri: c.item.sourceSystemUri,
          sourceResourceType: c.item.sourceResourceType,
          sourceResourceId: c.item.sourceResourceId,
          importBatchId: dto.importBatchId,
          verificationStatusConceptId: FORMS.VERIF_UNVERIFIED,
          contentHash: c.item.contentHash,
          actorUserId: actor.id,
        });
        this.valuesRepo.createAudit(tx, {
          fieldValueId: c.id,
          actionConceptId: FORMS.AUDIT_IMPORT,
          userId: actor.id,
          newSnapshotJson: c.snapshot,
        });
      }

      return { ids: created.map((c) => c.id) };
    });
  }

  /** Congela el estado observable de un valor para el log de auditoría. */
  private snapshot(value: {
    /**
     * Identificador asociado a field.
     */
    fieldId: string;
    /**
     * Valor de ordinal mantenido por la instancia.
     */
    ordinal: number;
    /**
     * Identificador asociado a value status concept.
     */
    valueStatusConceptId?: string;
    /**
     * Valor de value version mantenido por la instancia.
     */
    valueVersion?: number;
    /**
     * Valor de value string mantenido por la instancia.
     */
    valueString?: string;
    /**
     * Valor de value text mantenido por la instancia.
     */
    valueText?: string;
    /**
     * Valor de value integer mantenido por la instancia.
     */
    valueInteger?: string;
    /**
     * Valor de value decimal mantenido por la instancia.
     */
    valueDecimal?: string;
    /**
     * Valor de value boolean mantenido por la instancia.
     */
    valueBoolean?: boolean;
    /**
     * Valor de value json mantenido por la instancia.
     */
    valueJson?: unknown;
    /**
     * Identificador asociado a value concept.
     */
    valueConceptId?: string;
    /**
     * Identificador asociado a value reference.
     */
    valueReferenceId?: string;
  }): Record<string, unknown> {
    return {
      fieldId: value.fieldId,
      ordinal: value.ordinal,
      status: value.valueStatusConceptId,
      version: value.valueVersion,
      valueString: value.valueString,
      valueText: value.valueText,
      valueInteger: value.valueInteger,
      valueDecimal: value.valueDecimal,
      valueBoolean: value.valueBoolean,
      valueJson: value.valueJson,
      valueConceptId: value.valueConceptId,
      valueReferenceId: value.valueReferenceId,
    };
  }
}
