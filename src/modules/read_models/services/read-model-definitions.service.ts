import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ReadModelDefinitionsRepository,
  ReadModelDependenciesRepository,
  ReadModelRefreshRunsRepository,
  FrontendPageViewsRepository,
} from '../repositories';
import {
  CreateReadModelDefinitionDto,
  CreateReadModelVersionDto,
  ReadModelDefinitionResponseDto,
  RefreshRunResponseDto,
  ReadModelHealthResponseDto,
  OperationResultDto,
} from '../dto';
import {
  RM,
  OBJECT_TYPE_CONCEPT_BY_CODE,
  DEPENDENCY_TYPE_CONCEPT_BY_CODE,
} from '../read_models.concepts';
import type { ReadModelDefinitions } from '../entities';

/**
 * Lista blanca de identificador SQL para el nombre físico de la vista. Un
 * identificador no admite *bind*, así que validar contra esta expresión (y citar
 * cada parte) es lo que sustituye al parámetro y cierra la inyección. Admite un
 * único par `esquema.objeto`.
 */
const VIEW_IDENTIFIER = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i;

/**
 * Casos de uso del contrato de read model versionado y su materialización:
 * publicación (UC-30-01), versionado (UC-30-08), refresh manual (UC-30-03),
 * backfill (UC-30-04), invalidación/recomputo (UC-30-06), reconciliación
 * (UC-30-07), salud/staleness (UC-30-12) y deprecación/retiro (UC-30-13).
 *
 * El servicio posee la unidad de trabajo (`em.transactional`) y hace `flush` del
 * padre (definición) antes de crear los hijos (dependencias): las FK son columnas
 * uuid planas y MikroORM no ordena inserts entre entidades no relacionadas.
 */
@Injectable()
export class ReadModelDefinitionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly definitionsRepo: ReadModelDefinitionsRepository,
    private readonly dependenciesRepo: ReadModelDependenciesRepository,
    private readonly runsRepo: ReadModelRefreshRunsRepository,
    private readonly pageViewsRepo: FrontendPageViewsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReadModelDefinitionsService.name);
  }

  /** UC-30-01: registra y publica un contrato de read model versionado. */
  async createDefinition(
    dto: CreateReadModelDefinitionDto,
    actor: AuthenticatedUser,
  ): Promise<ReadModelDefinitionResponseDto> {
    this.logger.info(
      {
        operation: 'read_models.definition.create',
        schema: dto.schemaName,
        object: dto.objectName,
      },
      'Publishing read model contract',
    );
    return this.em.transactional(async (tx) => {
      const versionNumber = dto.versionNumber ?? 1;
      const clash = await this.definitionsRepo.findBySchemaObjectVersion(
        tx,
        dto.schemaName,
        dto.objectName,
        versionNumber,
      );
      if (clash) {
        throw new ConflictException('Ya existe esa versión del read model', {
          schemaName: dto.schemaName,
          objectName: dto.objectName,
          versionNumber,
        });
      }

      const definitionHash = this.computeHash(
        dto.schemaName,
        dto.objectName,
        versionNumber,
        dto.dependencies,
      );
      const definition = this.definitionsRepo.create(tx, {
        schemaName: dto.schemaName,
        objectName: dto.objectName,
        objectTypeConceptId: OBJECT_TYPE_CONCEPT_BY_CODE[dto.objectType],
        owningModule: dto.owningModule,
        purposeText: dto.purposeText,
        refreshModeConceptId:
          dto.refreshMode === 'CONCURRENT'
            ? RM.REFRESH_MODE_CONCURRENT
            : dto.refreshMode === 'SCHEDULED'
              ? RM.REFRESH_MODE_SCHEDULED
              : undefined,
        maximumStalenessSeconds: dto.maximumStalenessSeconds,
        defaultPageSize: dto.defaultPageSize,
        maximumPageSize: dto.maximumPageSize,
        stableCursorColumnsJson: dto.stableCursorColumns,
        containsPii: dto.containsPii,
        containsPhi: dto.containsPhi,
        securityBarrierRequired: dto.securityBarrierRequired,
        rowLevelSecurityRequired: dto.rowLevelSecurityRequired,
        definitionHash,
        versionNumber,
        statusConceptId: RM.DEF_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir la definición antes de sus dependencias.
      await tx.flush();

      for (const dep of dto.dependencies) {
        this.dependenciesRepo.create(tx, {
          readModelDefinitionId: definition.id,
          sourceSchemaName: dep.sourceSchemaName,
          sourceObjectName: dep.sourceObjectName,
          dependencyTypeConceptId:
            DEPENDENCY_TYPE_CONCEPT_BY_CODE[dep.dependencyType],
          selectedColumnsJson: dep.selectedColumns,
          filteringRuleSummary: dep.filteringRuleSummary,
        });
      }

      this.logger.info(
        {
          operation: 'read_models.definition.create',
          definitionId: definition.id,
        },
        'Read model contract published',
      );
      return this.toDefinitionResponse(definition, dto.dependencies.length);
    });
  }

  /** UC-30-08: versiona el esquema de un read model para el frontend. */
  async createVersion(
    schemaName: string,
    objectName: string,
    dto: CreateReadModelVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ReadModelDefinitionResponseDto> {
    this.logger.info(
      {
        operation: 'read_models.definition.version',
        schema: schemaName,
        object: objectName,
      },
      'Creating new read model version',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.definitionsRepo.findAllBySchemaObject(
        tx,
        schemaName,
        objectName,
      );
      if (existing.length === 0) {
        throw new ResourceNotFoundException(
          'No existe una versión previa del read model',
          {
            schemaName,
            objectName,
          },
        );
      }
      const hasActive = existing.some(
        (d) => d.statusConceptId === RM.DEF_ACTIVE,
      );
      if (!hasActive) {
        throw new PreconditionFailedException(
          'No hay una versión ACTIVE previa que respalde el corte de versión',
          { schemaName, objectName },
        );
      }
      const nextVersion = existing[0].versionNumber + 1;

      const definitionHash = this.computeHash(
        schemaName,
        objectName,
        nextVersion,
        dto.dependencies,
      );
      const definition = this.definitionsRepo.create(tx, {
        schemaName,
        objectName,
        objectTypeConceptId: OBJECT_TYPE_CONCEPT_BY_CODE[dto.objectType],
        purposeText: dto.purposeText,
        refreshModeConceptId:
          dto.refreshMode === 'CONCURRENT'
            ? RM.REFRESH_MODE_CONCURRENT
            : dto.refreshMode === 'SCHEDULED'
              ? RM.REFRESH_MODE_SCHEDULED
              : undefined,
        maximumStalenessSeconds: dto.maximumStalenessSeconds,
        containsPii: dto.containsPii,
        containsPhi: dto.containsPhi,
        definitionHash,
        versionNumber: nextVersion,
        // La nueva versión nace en DRAFT; la anterior sigue ACTIVE para rollback.
        statusConceptId: RM.DEF_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const dep of dto.dependencies) {
        this.dependenciesRepo.create(tx, {
          readModelDefinitionId: definition.id,
          sourceSchemaName: dep.sourceSchemaName,
          sourceObjectName: dep.sourceObjectName,
          dependencyTypeConceptId:
            DEPENDENCY_TYPE_CONCEPT_BY_CODE[dep.dependencyType],
          selectedColumnsJson: dep.selectedColumns,
          filteringRuleSummary: dep.filteringRuleSummary,
        });
      }

      return this.toDefinitionResponse(definition, dto.dependencies.length);
    });
  }

  /** UC-30-03: refresca la materialized view (REFRESH ... CONCURRENTLY, manual). */
  async refresh(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.runRefresh(
      definitionId,
      RM.REFRESH_TYPE_CONCURRENT,
      RM.RESULT_SUCCESS,
      actor,
      {
        requireMaterialized: true,
        operation: 'read_models.definition.refresh',
      },
    );
  }

  /** UC-30-04: backfill inicial de una nueva materialized view. */
  async backfill(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.runRefresh(
      definitionId,
      RM.REFRESH_TYPE_FULL_BACKFILL,
      RM.RESULT_SUCCESS,
      actor,
      {
        requireMaterialized: true,
        operation: 'read_models.definition.backfill',
      },
    );
  }

  /** UC-30-06: invalida y recomputa el read model tras un cambio upstream. */
  async invalidate(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.runRefresh(
      definitionId,
      RM.REFRESH_TYPE_INCREMENTAL,
      RM.RESULT_SUCCESS,
      actor,
      {
        requireMaterialized: false,
        operation: 'read_models.definition.invalidate',
      },
    );
  }

  /** UC-30-07: reconcilia el read model divergente contra la fuente canónica. */
  async reconcile(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.runRefresh(
      definitionId,
      RM.REFRESH_TYPE_RECONCILE,
      RM.RESULT_REPAIRED,
      actor,
      {
        requireMaterialized: true,
        operation: 'read_models.definition.reconcile',
      },
    );
  }

  /** UC-30-13a: deprecación de una versión (ACTIVE -> DEPRECATED). */
  async deprecate(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    this.logger.info(
      { operation: 'read_models.definition.deprecate', definitionId },
      'Deprecating read model version',
    );
    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findById(tx, definitionId);
      if (!definition) {
        throw new ResourceNotFoundException('Read model no encontrado', {
          definitionId,
        });
      }
      if (definition.statusConceptId === RM.DEF_RETIRED) {
        throw new PreconditionFailedException('La versión ya está retirada', {
          definitionId,
        });
      }
      definition.statusConceptId = RM.DEF_DEPRECATED;
      touch(definition, actor.id);
      return { ok: true, status: definition.statusConceptId };
    });
  }

  /** UC-30-13b: retiro de una versión (-> RETIRED). Guarda de FK: sin vistas apuntando. */
  async retire(
    definitionId: string,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    this.logger.info(
      { operation: 'read_models.definition.retire', definitionId },
      'Retiring read model version',
    );
    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findById(tx, definitionId);
      if (!definition) {
        throw new ResourceNotFoundException('Read model no encontrado', {
          definitionId,
        });
      }
      const referencing = await this.pageViewsRepo.countByDefinition(
        tx,
        definitionId,
      );
      if (referencing > 0) {
        throw new PreconditionFailedException(
          'No se puede retirar: hay vistas apuntando a esta versión',
          { definitionId, referencingViews: referencing },
        );
      }
      definition.statusConceptId = RM.DEF_RETIRED;
      touch(definition, actor.id);
      return { ok: true, status: definition.statusConceptId };
    });
  }

  /** UC-30-12: detecta y reporta staleness/degradación de las MV. */
  async health(): Promise<ReadModelHealthResponseDto> {
    const em = this.em.fork();
    const definitions = await this.definitionsRepo.findAllNotRetired(
      em,
      RM.DEF_RETIRED,
    );
    const now = Date.now();
    const items = await Promise.all(
      definitions.map(async (def) => {
        const lastRun = await this.runsRepo.findLatestByDefinition(em, def.id);
        const refreshedAt = lastRun?.completedAt ?? lastRun?.createdAt ?? null;
        const stalenessSeconds = refreshedAt
          ? Math.max(0, Math.floor((now - refreshedAt.getTime()) / 1000))
          : Number.MAX_SAFE_INTEGER;
        const threshold =
          def.maximumStalenessSeconds ?? Number.MAX_SAFE_INTEGER;
        return {
          definitionId: def.id,
          schemaName: def.schemaName,
          objectName: def.objectName,
          lastRefreshedAt: refreshedAt,
          stalenessSeconds,
          stale: stalenessSeconds > threshold,
        };
      }),
    );
    return { generatedAt: new Date(), items };
  }

  /**
   * Núcleo compartido de las corridas de refresh (03/04/06/07). Materializa de
   * verdad: si la definición es una materialized view ejecuta el
   * `REFRESH MATERIALIZED VIEW [CONCURRENTLY] <vista>` real y cuenta las filas
   * resultantes; si la vista física no existe (o el REFRESH falla) el error se
   * captura, la corrida queda como FAILURE con su mensaje y NO se oculta.
   *
   * El REFRESH corre en una conexión sin contexto de transacción (autocommit):
   * si lanzara dentro de la transacción del `refresh_run`, Postgres abortaría esa
   * transacción y no podríamos ni siquiera registrar el fallo.
   */
  private async runRefresh(
    definitionId: string,
    refreshTypeConceptId: string,
    successResultConceptId: string,
    actor: AuthenticatedUser,
    opts: { requireMaterialized: boolean; operation: string },
  ): Promise<RefreshRunResponseDto> {
    this.logger.info(
      { operation: opts.operation, definitionId, actorId: actor.id },
      'Refresh run',
    );

    const readEm = this.em.fork();
    const definition = await this.definitionsRepo.findById(readEm, definitionId);
    if (!definition) {
      throw new ResourceNotFoundException('Read model no encontrado', {
        definitionId,
      });
    }
    const isMaterialized =
      definition.objectTypeConceptId === RM.OBJECT_TYPE_MATERIALIZED_VIEW;
    if (opts.requireMaterialized && !isMaterialized) {
      throw new PreconditionFailedException(
        'La operación requiere una materialized view',
        { definitionId },
      );
    }
    if (definition.statusConceptId === RM.DEF_RETIRED) {
      throw new PreconditionFailedException('La versión está retirada', {
        definitionId,
      });
    }

    const startedAt = new Date();
    const correlationId = randomUUID();
    // Watermark de la corrida: sirve de checkpoint para la invalidación de una
    // VIEW (que siempre está viva) y de marca temporal para las MV.
    const sourceWatermark = String(startedAt.getTime());

    let resultConceptId = successResultConceptId;
    let rowsAffected = '0';
    let errorCode: string | undefined;

    // refresh/backfill/reconcile e invalidate sobre una MV recomputan físicamente;
    // invalidate sobre una VIEW plana solo marca el checkpoint (no hay que refrescar).
    if (isMaterialized) {
      const viewName = this.resolveViewName(definition);
      // Solo el refresh concurrente manual usa CONCURRENTLY, y únicamente si la
      // definición lo declara: el backfill inicial y el recomputo de reconcile
      // deben ser no concurrentes.
      const concurrently =
        refreshTypeConceptId === RM.REFRESH_TYPE_CONCURRENT &&
        definition.refreshModeConceptId === RM.REFRESH_MODE_CONCURRENT;
      const connection = this.em.getConnection();
      try {
        await connection.execute(
          `REFRESH MATERIALIZED VIEW ${concurrently ? 'CONCURRENTLY ' : ''}${viewName}`,
          [],
          'run',
        );
        // REFRESH no reporta un rowcount fiable: se cuentan las filas materializadas.
        const counted = await connection.execute<{ affected: string }[]>(
          `SELECT count(*)::text AS affected FROM ${viewName}`,
          [],
          'all',
        );
        rowsAffected = counted?.[0]?.affected ?? '0';
      } catch (err) {
        // La MV puede no existir físicamente aún: es un FAILURE legítimo.
        resultConceptId = RM.RESULT_FAILED;
        errorCode = this.describeError(err);
        this.logger.warn(
          { operation: opts.operation, definitionId, error: errorCode },
          'Materialized view refresh failed',
        );
      }
    }

    const completedAt = new Date();
    const run = await this.em.transactional(async (tx) =>
      this.runsRepo.create(tx, {
        readModelDefinitionId: definitionId,
        refreshTypeConceptId,
        startedAt,
        completedAt,
        rowsAffected,
        sourceWatermark,
        resultConceptId,
        errorCode,
        correlationId,
      }),
    );

    return {
      id: run.id,
      readModelDefinitionId: definitionId,
      refreshType: refreshTypeConceptId,
      result: resultConceptId,
      rowsAffected: run.rowsAffected ?? rowsAffected,
      startedAt: run.startedAt ?? startedAt,
      completedAt: run.completedAt ?? completedAt,
      correlationId,
    };
  }

  /**
   * Resuelve y valida el nombre físico de la vista (`esquema.objeto`) contra la
   * lista blanca de identificador antes de interpolarlo, y cita cada parte. Nunca
   * se interpola sin validar.
   */
  private resolveViewName(definition: ReadModelDefinitions): string {
    const schema = definition.schemaName;
    const object = definition.objectName;
    if (
      !VIEW_IDENTIFIER.test(schema) ||
      !VIEW_IDENTIFIER.test(object) ||
      !VIEW_IDENTIFIER.test(`${schema}.${object}`)
    ) {
      throw new PreconditionFailedException(
        'El nombre físico de la vista no es un identificador SQL válido',
        { definitionId: definition.id },
      );
    }
    return `"${schema}"."${object}"`;
  }

  /** Mensaje de error acotado para la bitácora de la corrida. */
  private describeError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return message.slice(0, 500);
  }

  private computeHash(
    schemaName: string,
    objectName: string,
    versionNumber: number,
    dependencies: { sourceSchemaName: string; sourceObjectName: string }[],
  ): string {
    const material = [
      schemaName,
      objectName,
      String(versionNumber),
      ...dependencies
        .map((d) => `${d.sourceSchemaName}.${d.sourceObjectName}`)
        .sort(),
    ].join('|');
    return createHash('sha256').update(material).digest('hex');
  }

  private toDefinitionResponse(
    definition: ReadModelDefinitions,
    dependencyCount: number,
  ): ReadModelDefinitionResponseDto {
    return {
      id: definition.id,
      schemaName: definition.schemaName,
      objectName: definition.objectName,
      versionNumber: definition.versionNumber,
      status: definition.statusConceptId,
      definitionHash: definition.definitionHash ?? '',
      dependencyCount,
      createdAt: definition.createdAt,
    };
  }
}
