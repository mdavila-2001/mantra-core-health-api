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

  /** Núcleo compartido de las corridas de refresh (03/04/06/07). */
  private runRefresh(
    definitionId: string,
    refreshTypeConceptId: string,
    resultConceptId: string,
    actor: AuthenticatedUser,
    opts: { requireMaterialized: boolean; operation: string },
  ): Promise<RefreshRunResponseDto> {
    this.logger.info(
      { operation: opts.operation, definitionId, actorId: actor.id },
      'Refresh run',
    );
    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findById(tx, definitionId);
      if (!definition) {
        throw new ResourceNotFoundException('Read model no encontrado', {
          definitionId,
        });
      }
      if (
        opts.requireMaterialized &&
        definition.objectTypeConceptId !== RM.OBJECT_TYPE_MATERIALIZED_VIEW
      ) {
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
      const run = this.runsRepo.create(tx, {
        readModelDefinitionId: definitionId,
        refreshTypeConceptId,
        startedAt,
        completedAt: new Date(),
        rowsAffected: '0',
        sourceWatermark: String(startedAt.getTime()),
        resultConceptId,
        correlationId,
      });

      return {
        id: run.id,
        readModelDefinitionId: definitionId,
        refreshType: refreshTypeConceptId,
        result: resultConceptId,
        rowsAffected: run.rowsAffected,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        correlationId,
      };
    });
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
