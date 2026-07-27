import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import {
  AgentsRepository,
  AutomationGovernanceRepository,
  AutomationRunsRepository,
  TargetRecordRepository,
  parseTargetResource,
} from '../repositories';
import {
  ExecuteRecordAutomationDto,
  ExecuteRecordAutomationResponseDto,
} from '../dto';

/**
 * Forma admitida de `field_mapping_json`: columna de destino → de dónde sale su
 * valor. `from` es una ruta con puntos dentro de `payloadJson`; `value` es un
 * literal. `required` hace que falte el dato sea un error en vez de un `null`.
 */
interface FieldMapping {
  from?: string;
  value?: unknown;
  required?: boolean;
}

/**
 * Ejecución de automatizaciones de registro (UC-48-13): el paso en que el agente
 * escribe de verdad en un esquema de negocio.
 *
 * Es la operación más delicada del módulo, y por eso está sola en su servicio: el
 * destino no se conoce en tiempo de compilación, la escritura se atribuye a la
 * identidad de servicio del agente y la deduplicación es lo único que impide que
 * un reintento del runtime cree el registro dos veces.
 */
@Injectable()
export class RecordAutomationService {
  constructor(
    private readonly em: EntityManager,
    private readonly runsRepo: AutomationRunsRepository,
    private readonly agentsRepo: AgentsRepository,
    private readonly governanceRepo: AutomationGovernanceRepository,
    private readonly targetRepo: TargetRecordRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RecordAutomationService.name);
  }

  /**
   * UC-48-13: ejecutar la automatización con deduplicación.
   *
   * El orden importa: se comprueba que el run está en marcha —no en pausa
   * esperando una aprobación— **antes** de escribir nada. Escribir con el run
   * pausado sería exactamente lo que el guardrail acaba de impedir.
   */
  async executeRecordAutomation(
    agentRunId: string,
    recordAutomationId: string,
    dto: ExecuteRecordAutomationDto,
    actor: AuthenticatedUser,
  ): Promise<ExecuteRecordAutomationResponseDto> {
    return this.em.transactional(async (tx) => {
      const agentRun = await this.runsRepo.findAgentRunForUpdate(
        tx,
        agentRunId,
      );
      if (!agentRun) {
        throw new ResourceNotFoundException(
          'Ejecución de agente no encontrada.',
          { agentRunId },
        );
      }
      if (agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_RUNNING) {
        throw new PreconditionFailedException(
          'La ejecución del agente no está en marcha; no puede escribir registros.',
          { agentRunId, statusConceptId: agentRun.statusConceptId },
        );
      }

      const automation =
        await this.governanceRepo.findRecordAutomationForUpdate(
          tx,
          recordAutomationId,
        );
      if (!automation) {
        throw new ResourceNotFoundException(
          'Automatización de registro no encontrada.',
          {
            recordAutomationId,
          },
        );
      }
      if (!automation.isActive) {
        throw new PreconditionFailedException(
          'La automatización de registro no está activa.',
          {
            recordAutomationId,
          },
        );
      }
      // Una automatización atada a un agente concreto no la puede ejecutar otro:
      // el mapeo y la validación se escribieron pensando en lo que produce ése.
      if (automation.agentId && automation.agentId !== agentRun.agentId) {
        throw new PreconditionFailedException(
          'La automatización de registro pertenece a otro agente.',
          { recordAutomationId, agentId: agentRun.agentId },
        );
      }

      const agent = await this.agentsRepo.findAgentById(tx, agentRun.agentId);
      // La escritura se atribuye a la identidad de servicio del agente. Es lo que
      // hace que, mirando la fila escrita, se sepa que la puso un agente y cuál.
      const writerUserId = agent?.actsAsUserId;
      if (!writerUserId) {
        throw new PreconditionFailedException(
          'El agente no tiene identidad de servicio; su escritura no sería atribuible.',
          { agentId: agentRun.agentId },
        );
      }

      const draft =
        automation.writeModeConceptId === CONCEPTS.AUTO_WRITE_MODE_DRAFT;
      const upsert =
        automation.writeModeConceptId === CONCEPTS.AUTO_WRITE_MODE_UPSERT;

      const columns = this.applyFieldMapping(
        automation.fieldMappingJson,
        dto.payloadJson,
        writerUserId,
      );
      this.assertValidation(automation.validationJson, columns);

      const dedupeColumns = this.parseDedupeColumns(automation.dedupeKeyExpr);
      if (upsert && dedupeColumns.length === 0) {
        throw new PreconditionFailedException(
          'Un modo de escritura `upsert` necesita una clave de deduplicación.',
          { recordAutomationId },
        );
      }

      let targetRecordId: string | undefined;
      let written = false;

      if (!draft) {
        const target = parseTargetResource(automation.targetResourceType);
        const result = await this.targetRepo.writeRecord(
          tx,
          target,
          columns,
          dedupeColumns,
          upsert,
        );
        targetRecordId = result.id;
        written = result.written;
      }

      // El paso de traza se registra pase lo que pase, incluso si la deduplicación
      // no escribió nada: que el agente lo intentara también es un hecho.
      const stepId =
        dto.agentRunStepId ??
        this.runsRepo.createAgentRunStep(tx, {
          agentRunId,
          sequenceNo:
            (await this.runsRepo.findMaxSequenceNo(tx, agentRunId)) + 1,
          stepKindConceptId: CONCEPTS.AUTO_STEP_TOOL_CALL,
          toolInputJson: { recordAutomationId, payloadJson: dto.payloadJson },
          toolOutputJson: {
            targetRecordId: targetRecordId ?? null,
            written,
            draft,
          },
          statusConceptId: CONCEPTS.AUTO_STEP_SUCCEEDED,
          recordedByUserId: writerUserId,
        }).id;

      touch(automation, writerUserId);

      await this.outbox.publishDomainEvent(tx, {
        tenantId: automation.tenantId,
        eventType: 'RecordAutomated',
        aggregateType: automation.targetResourceType,
        aggregateId: targetRecordId ?? agentRunId,
        payloadJson: {
          recordAutomationId,
          agentRunId,
          agentRunStepId: stepId,
          targetRecordId: targetRecordId ?? null,
          written,
          draft,
        },
        actorUserId: writerUserId,
      });

      this.logger.info(
        {
          operation: 'automation.record.execute',
          recordAutomationId,
          agentRunId,
          written,
          draft,
        },
        'Automatización de registro ejecutada',
      );

      return { targetRecordId, written, agentRunStepId: stepId, draft };
    });
  }

  /**
   * Traduce el payload del agente a columnas del destino según
   * `field_mapping_json`.
   *
   * **Falla cerrado**: si el mapeo no tiene la forma admitida, no se escribe.
   * Adivinar la correspondencia entre un campo del agente y una columna de una
   * tabla clínica es exactamente lo que no se debe hacer.
   */
  private applyFieldMapping(
    fieldMappingJson: unknown,
    payload: Record<string, unknown>,
    writerUserId: string,
  ): Record<string, unknown> {
    if (!fieldMappingJson || typeof fieldMappingJson !== 'object') {
      throw new PreconditionFailedException(
        'La automatización de registro no declara mapeo de campos.',
      );
    }

    const mapping = fieldMappingJson as Record<string, FieldMapping>;
    const columns: Record<string, unknown> = {};

    for (const [column, rule] of Object.entries(mapping)) {
      if (!rule || typeof rule !== 'object') {
        throw new PreconditionFailedException(
          'El mapeo de campos tiene una regla que no se entiende.',
          { column },
        );
      }

      let value: unknown;
      if (rule.from !== undefined) {
        if (typeof rule.from !== 'string') {
          throw new PreconditionFailedException(
            'El origen de un campo mapeado tiene que ser una ruta.',
            { column },
          );
        }
        value = this.readPath(payload, rule.from);
      } else if (rule.value !== undefined) {
        value = rule.value;
      } else {
        throw new PreconditionFailedException(
          'Una regla de mapeo tiene que declarar `from` o `value`.',
          { column },
        );
      }

      if ((value === undefined || value === null) && rule.required === true) {
        throw new PreconditionFailedException(
          'Falta un campo obligatorio del mapeo.',
          { column },
        );
      }
      if (value === undefined) continue;

      columns[column] = value;
    }

    // La atribución no la decide el mapeo: la pone el módulo, y por eso va después
    // de recorrerlo. Si el mapeo trajera estas columnas, quedarían pisadas.
    columns.created_by_user_id = writerUserId;
    columns.updated_by_user_id = writerUserId;

    return columns;
  }

  /**
   * Comprobaciones declaradas en `validation_json`. Se admite
   * `{ required: [columna, …] }`; cualquier otra clave se ignora, porque validar
   * de más rechazaría escrituras legítimas de automatizaciones ya configuradas.
   */
  private assertValidation(
    validationJson: unknown,
    columns: Record<string, unknown>,
  ): void {
    if (!validationJson || typeof validationJson !== 'object') return;

    const required = (validationJson as { required?: unknown }).required;
    if (!Array.isArray(required)) return;

    for (const column of required) {
      if (typeof column !== 'string') continue;
      const value = columns[column];
      if (value === undefined || value === null || value === '') {
        throw new PreconditionFailedException(
          'La validación de la automatización exige un campo que no llegó.',
          { column },
        );
      }
    }
  }

  /**
   * `dedupe_key_expr` se interpreta como la lista de columnas que forman la clave
   * natural, separadas por comas. Es la forma que puede llevarse directamente a un
   * `ON CONFLICT`; una expresión arbitraria no, y el modelo no define ninguna otra.
   */
  private parseDedupeColumns(dedupeKeyExpr?: string): string[] {
    if (!dedupeKeyExpr) return [];
    return dedupeKeyExpr
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  private readPath(source: Record<string, unknown>, path: string): unknown {
    let current: unknown = source;
    for (const segment of path.split('.')) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }
}
