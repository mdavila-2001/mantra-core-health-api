import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SystemContextRepository } from '../repositories';
import {
  CreateSystemContextDto,
  SystemContextResponseDto,
  RefreshSystemContextDto,
  RefreshRunResponseDto,
  ActivateContextVersionDto,
  ActivateContextVersionResponseDto,
  CreateContextBindingDto,
  ContextBindingResponseDto,
  RollbackContextDto,
  RollbackContextResponseDto,
  type RefreshTrigger,
} from '../dto';

const REFRESH_TRIGGER_CONCEPT: Readonly<Record<RefreshTrigger, string>> = {
  SCHEDULED: CONCEPTS.REFRESH_TRIGGER_SCHEDULED,
  MANUAL: CONCEPTS.REFRESH_TRIGGER_MANUAL,
  EVENT: CONCEPTS.REFRESH_TRIGGER_EVENT,
};

const DEFAULT_SCHEMA_VERSION = '1';

/**
 * Contextos de sistema: alta con versión inicial, refresco idempotente con
 * procedencia, promoción de versión, binding a consumidores y vuelta atrás
 * (UC-45-06 … 10, UC-45-12).
 */
@Injectable()
export class SystemContextsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contextRepo - Valor de context repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly contextRepo: SystemContextRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SystemContextsService.name);
  }

  /**
   * UC-45-06: crear el contexto y su versión 1 en la misma transacción. Un
   * contexto sin versión no tiene nada que entregar a un consumidor.
   */
  async createContext(
    dto: CreateSystemContextDto,
    actor: AuthenticatedUser,
  ): Promise<SystemContextResponseDto> {
    this.logger.info(
      { operation: 'system-context.context.create', code: dto.code },
      'Creating system context',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.contextRepo.findContextByCode(tx, dto.code);
      if (duplicate) {
        throw new ConflictException('Ya existe un contexto con ese código', {
          code: dto.code,
        });
      }

      const context = this.contextRepo.createContext(tx, {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        contextTypeConceptId: dto.contextTypeConceptId,
        scopeTypeConceptId: dto.scopeTypeConceptId,
        tenantId: dto.tenantId,
        countryConceptId: dto.countryConceptId,
        localeConceptId: dto.localeConceptId,
        refreshPolicyConceptId: dto.refreshPolicyConceptId,
        statusConceptId: CONCEPTS.SYSCTX_ACTIVE,
        actorUserId: actor.id,
      });

      const contentHash = this.contentHash(dto.contextJson);
      const version = this.contextRepo.createContextVersion(tx, {
        systemContextId: context.id,
        versionNumber: 1,
        schemaVersion: dto.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
        contextJson: dto.contextJson,
        contentHash,
        statusConceptId: CONCEPTS.SYSCTX_VERSION_DRAFT,
        recordedByUserId: actor.id,
      });

      // El contexto apunta a su versión 1 desde el principio; activarla es una
      // decisión aparte (UC-45-09).
      context.currentVersionId = version.id;
      touch(context, actor.id);

      return {
        id: context.id,
        code: dto.code,
        currentVersionId: version.id,
        contentHash,
        statusConceptId: CONCEPTS.SYSCTX_ACTIVE,
      };
    });
  }

  /**
   * UC-45-07 (incluye UC-45-08): refrescar el contexto. Es idempotente por
   * clave: el worker reintenta y no vuelve a refrescar. Si el contenido
   * regenerado coincide con el vigente no se redacta versión — versionar lo
   * idéntico llenaría el historial de ruido.
   */
  async refreshContext(
    contextId: string,
    dto: RefreshSystemContextDto,
    actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.context.refresh',
        contextId,
        trigger: dto.trigger,
      },
      'Refreshing system context',
    );

    return this.em.transactional(async (tx) => {
      const existingRun = await this.contextRepo.findRefreshRunByKey(
        tx,
        dto.idempotencyKey,
      );
      if (existingRun) {
        return {
          runId: existingRun.id,
          statusConceptId: existingRun.statusConceptId,
          contentHash: existingRun.outputContentHash ?? '',
          unchanged:
            existingRun.statusConceptId === CONCEPTS.REFRESH_RUN_UNCHANGED,
          inputCount: existingRun.inputCount ?? 0,
          duplicate: true,
        };
      }

      const context = await this.contextRepo.findContextForUpdate(
        tx,
        contextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId,
        });
      }
      if (context.statusConceptId !== CONCEPTS.SYSCTX_ACTIVE) {
        throw new PreconditionFailedException('El contexto no está activo', {
          contextId,
        });
      }

      const run = this.contextRepo.createRefreshRun(tx, {
        systemContextId: contextId,
        idempotencyKey: dto.idempotencyKey,
        triggerConceptId: REFRESH_TRIGGER_CONCEPT[dto.trigger],
        statusConceptId: CONCEPTS.REFRESH_RUN_RUNNING,
        recordedByUserId: actor.id,
      });

      const inputs = dto.inputs ?? [];
      const contentHash = this.contentHash(dto.contextJson);

      // Una entrada obligatoria que no se pudo recoger invalida la corrida: el
      // contexto quedaría incompleto sin que nadie lo notara.
      const missingRequired = inputs.find(
        (input) => input.required && input.missing,
      );
      if (missingRequired) {
        run.statusConceptId = CONCEPTS.REFRESH_RUN_FAILED;
        run.finishedAt = new Date();
        run.inputCount = inputs.length;
        run.errorSummary = `Falta una entrada obligatoria: ${
          missingRequired.sourceEntityName ??
          missingRequired.sourceRecordId ??
          'sin identificar'
        }`;

        this.logger.warn(
          {
            operation: 'system-context.context.refresh',
            contextId,
            runId: run.id,
          },
          'Context refresh failed on a missing required input',
        );

        return {
          runId: run.id,
          statusConceptId: CONCEPTS.REFRESH_RUN_FAILED,
          contentHash,
          unchanged: false,
          inputCount: inputs.length,
          duplicate: false,
        };
      }

      const latest = await this.contextRepo.findLatestContextVersion(
        tx,
        contextId,
      );
      if (latest?.contentHash === contentHash) {
        run.statusConceptId = CONCEPTS.REFRESH_RUN_UNCHANGED;
        run.finishedAt = new Date();
        run.inputCount = inputs.length;
        run.outputContentHash = contentHash;

        return {
          runId: run.id,
          statusConceptId: CONCEPTS.REFRESH_RUN_UNCHANGED,
          contentHash,
          unchanged: true,
          inputCount: inputs.length,
          duplicate: false,
        };
      }

      const versionNumber = (latest?.versionNumber ?? 0) + 1;
      const version = this.contextRepo.createContextVersion(tx, {
        systemContextId: contextId,
        versionNumber,
        refreshRunId: run.id,
        schemaVersion:
          dto.schemaVersion ?? latest?.schemaVersion ?? DEFAULT_SCHEMA_VERSION,
        contextJson: dto.contextJson,
        contentHash,
        generatedByAgentId: dto.generatedByAgentId,
        statusConceptId: CONCEPTS.SYSCTX_VERSION_DRAFT,
        recordedByUserId: actor.id,
      });

      // UC-45-08: la procedencia se snapshotea en la misma transacción, ordenada
      // por precedencia, y es inmutable.
      inputs.forEach((input, index) => {
        this.contextRepo.createContextInput(tx, {
          systemContextVersionId: version.id,
          sourceTypeConceptId: input.sourceTypeConceptId,
          sourceSchemaName: input.sourceSchemaName,
          sourceEntityName: input.sourceEntityName,
          sourceRecordId: input.sourceRecordId,
          sourceVersionId: input.sourceVersionId,
          sourceContentHash: input.sourceContentHash,
          sourceFreshnessAt: input.sourceFreshnessAt
            ? new Date(input.sourceFreshnessAt)
            : undefined,
          precedence: input.precedence ?? index + 1,
          required: input.required ?? false,
          recordedByUserId: actor.id,
        });
      });

      run.statusConceptId = CONCEPTS.REFRESH_RUN_SUCCEEDED;
      run.finishedAt = new Date();
      run.inputCount = inputs.length;
      run.outputContentHash = contentHash;

      return {
        runId: run.id,
        statusConceptId: CONCEPTS.REFRESH_RUN_SUCCEEDED,
        versionId: version.id,
        versionNumber,
        contentHash,
        unchanged: false,
        inputCount: inputs.length,
        duplicate: false,
      };
    });
  }

  /**
   * UC-45-09: promover la versión a vigente. La anterior queda superseded en la
   * misma transacción: la invariante es que haya exactamente una activa sin
   * `effective_to`.
   */
  async activateVersion(
    contextId: string,
    versionNumber: number,
    dto: ActivateContextVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ActivateContextVersionResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.version.activate',
        contextId,
        versionNumber,
      },
      'Activating system context version',
    );

    return this.em.transactional(async (tx) => {
      const context = await this.contextRepo.findContextForUpdate(
        tx,
        contextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId,
        });
      }
      if (context.statusConceptId !== CONCEPTS.SYSCTX_ACTIVE) {
        throw new PreconditionFailedException('El contexto no está activo', {
          contextId,
        });
      }

      const version = await this.contextRepo.findContextVersionForUpdate(
        tx,
        contextId,
        versionNumber,
      );
      if (!version) {
        throw new ResourceNotFoundException(
          'Versión del contexto no encontrada',
          {
            contextId,
            versionNumber,
          },
        );
      }
      if (version.statusConceptId === CONCEPTS.SYSCTX_VERSION_ACTIVE) {
        throw new ConflictException('La versión ya es la vigente', {
          contextId,
          versionNumber,
        });
      }
      if (version.statusConceptId !== CONCEPTS.SYSCTX_VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión no está en borrador',
          {
            contextId,
            versionNumber,
          },
        );
      }
      // Activar algo distinto de lo que se revisó es exactamente el error que
      // el hash existe para impedir.
      if (
        dto.expectedContentHash &&
        dto.expectedContentHash !== version.contentHash
      ) {
        throw new PreconditionFailedException(
          'El contenido de la versión no es el esperado',
          {
            contextId,
            versionNumber,
          },
        );
      }

      const now = new Date();
      const previous = await this.contextRepo.findActiveContextVersionForUpdate(
        tx,
        contextId,
        CONCEPTS.SYSCTX_VERSION_ACTIVE,
      );
      if (previous) {
        previous.statusConceptId = CONCEPTS.SYSCTX_VERSION_SUPERSEDED;
        previous.effectiveTo = now;
      }

      version.statusConceptId = CONCEPTS.SYSCTX_VERSION_ACTIVE;
      version.effectiveFrom = now;
      version.effectiveTo = undefined;

      context.currentVersionId = version.id;
      touch(context, actor.id);

      return {
        id: version.id,
        versionNumber,
        statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE,
        supersededVersionId: previous?.id,
      };
    });
  }

  /** UC-45-10: vincular el contexto a un consumidor con su ventana de validez. */
  async createBinding(
    contextId: string,
    dto: CreateContextBindingDto,
    actor: AuthenticatedUser,
  ): Promise<ContextBindingResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.context.bind',
        contextId,
        consumerId: dto.consumerId,
      },
      'Binding system context to consumer',
    );

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : undefined;
    const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
    if (validFrom && validTo && validTo <= validFrom) {
      throw new PreconditionFailedException(
        'La ventana de validez está invertida',
        {
          contextId,
          validFrom: dto.validFrom,
          validTo: dto.validTo,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const context = await this.contextRepo.findContextById(tx, contextId);
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId,
        });
      }
      if (context.statusConceptId !== CONCEPTS.SYSCTX_ACTIVE) {
        throw new PreconditionFailedException('El contexto no está activo', {
          contextId,
        });
      }

      const existing = await this.contextRepo.findContextBindingsForConsumer(
        tx,
        contextId,
        dto.consumerTypeConceptId,
        dto.consumerId,
        CONCEPTS.SYSCTX_BINDING_ACTIVE,
      );
      // Dos bindings solapados del mismo consumidor dejarían sin decidir cuál
      // contexto se le entrega en el periodo común.
      const overlapping = existing.find((binding) =>
        this.overlaps(binding.validFrom, binding.validTo, validFrom, validTo),
      );
      if (overlapping) {
        throw new ConflictException(
          'El consumidor ya tiene un binding en esa ventana',
          {
            contextId,
            bindingId: overlapping.id,
          },
        );
      }

      const binding = this.contextRepo.createContextBinding(tx, {
        systemContextId: contextId,
        consumerTypeConceptId: dto.consumerTypeConceptId,
        consumerId: dto.consumerId,
        tenantId: dto.tenantId,
        countryConceptId: dto.countryConceptId,
        activationRuleJson: dto.activationRuleJson,
        priority: dto.priority ?? 1,
        validFrom,
        validTo,
        statusConceptId: CONCEPTS.SYSCTX_BINDING_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: binding.id,
        systemContextId: contextId,
        priority: dto.priority ?? 1,
        statusConceptId: CONCEPTS.SYSCTX_BINDING_ACTIVE,
      };
    });
  }

  /**
   * UC-45-12: volver a una versión anterior. No se borra nada: la actual pasa a
   * superseded y la objetivo vuelve a estar vigente, de modo que el historial
   * conserva el ida y vuelta.
   */
  async rollbackContext(
    contextId: string,
    dto: RollbackContextDto,
    actor: AuthenticatedUser,
  ): Promise<RollbackContextResponseDto> {
    this.logger.info(
      {
        operation: 'system-context.context.rollback',
        contextId,
        target: dto.targetVersionNumber,
      },
      'Rolling back system context version',
    );

    return this.em.transactional(async (tx) => {
      const context = await this.contextRepo.findContextForUpdate(
        tx,
        contextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId,
        });
      }

      const target = await this.contextRepo.findContextVersionForUpdate(
        tx,
        contextId,
        dto.targetVersionNumber,
      );
      if (!target) {
        throw new ResourceNotFoundException('Versión objetivo no encontrada', {
          contextId,
          targetVersionNumber: dto.targetVersionNumber,
        });
      }
      // Sólo se vuelve a algo que estuvo vigente: una versión que nunca se
      // activó no es un estado conocido al que volver.
      if (target.statusConceptId !== CONCEPTS.SYSCTX_VERSION_SUPERSEDED) {
        throw new PreconditionFailedException(
          'Sólo se puede volver a una versión que estuvo vigente',
          { contextId, targetVersionNumber: dto.targetVersionNumber },
        );
      }
      if (
        dto.expectedContentHash &&
        dto.expectedContentHash !== target.contentHash
      ) {
        throw new PreconditionFailedException(
          'El contenido de la versión no es el esperado',
          {
            contextId,
            targetVersionNumber: dto.targetVersionNumber,
          },
        );
      }

      const current = await this.contextRepo.findActiveContextVersionForUpdate(
        tx,
        contextId,
        CONCEPTS.SYSCTX_VERSION_ACTIVE,
      );
      if (!current) {
        throw new PreconditionFailedException(
          'El contexto no tiene versión vigente',
          {
            contextId,
          },
        );
      }

      const now = new Date();
      current.statusConceptId = CONCEPTS.SYSCTX_VERSION_SUPERSEDED;
      current.effectiveTo = now;

      target.statusConceptId = CONCEPTS.SYSCTX_VERSION_ACTIVE;
      target.effectiveFrom = now;
      target.effectiveTo = undefined;

      context.currentVersionId = target.id;
      touch(context, actor.id);

      this.logger.warn(
        {
          operation: 'system-context.context.rollback',
          contextId,
          fromVersion: current.versionNumber,
          toVersion: target.versionNumber,
          reason: dto.reason,
        },
        'System context rolled back',
      );

      return {
        id: target.id,
        versionNumber: target.versionNumber,
        supersededVersionId: current.id,
        statusConceptId: CONCEPTS.SYSCTX_VERSION_ACTIVE,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Hash del contenido con las claves ordenadas: dos objetos con el mismo
   * contenido y distinto orden de claves deben producir el mismo hash, o el
   * refresco redactaría versiones nuevas sin que nada haya cambiado.
   */
  private contentHash(contextJson: unknown): string {
    return createHash('sha256')
      .update(this.canonicalise(contextJson))
      .digest('hex');
  }

  /**
   * Obtiene canonicalise.
   *
   * @param value - Valor de value requerido por la operación.
   * @returns Resultado de canonicalise conforme al contrato `string`.
   */
  private canonicalise(value: unknown): string {
    if (value === null || typeof value !== 'object')
      return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalise(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        ([key, item]) => `${JSON.stringify(key)}:${this.canonicalise(item)}`,
      );

    return `{${entries.join(',')}}`;
  }

  /** Dos ventanas abiertas por un extremo se solapan salvo que una acabe antes de que empiece la otra. */
  private overlaps(
    aFrom: Date | undefined,
    aTo: Date | undefined,
    bFrom: Date | undefined,
    bTo: Date | undefined,
  ): boolean {
    if (aTo && bFrom && aTo <= bFrom) return false;
    if (bTo && aFrom && bTo <= aFrom) return false;
    return true;
  }
}
