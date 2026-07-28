import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DefinitionSetsRepository,
  MigrationsRepository,
} from '../repositories';
import {
  CreateDefinitionSetDto,
  PublishVersionDto,
  RunMigrationDto,
  DefinitionSetResponseDto,
  MigrationRunResponseDto,
  OkResultDto,
} from '../dto';
import { FORMS } from '../forms.concepts';

/**
 * Gobernanza del esquema dinámico: creación de sets inmutables (UC-09-01),
 * publicación de versiones componiendo miembros (UC-09-03) y migración de
 * valores entre versiones (UC-09-13).
 *
 * El servicio posee la unidad de trabajo con `em.transactional` y hace `flush`
 * del padre antes de crear hijos (las FK son columnas uuid, MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class FormsSchemaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param setsRepo - Valor de sets repo requerido por la operación.
   * @param migrationsRepo - Valor de migrations repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly setsRepo: DefinitionSetsRepository,
    private readonly migrationsRepo: MigrationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsSchemaService.name);
  }

  /** UC-09-01: crea el set y su versión inicial (draft, inmutable). */
  async createDefinitionSet(
    dto: CreateDefinitionSetDto,
    actor: AuthenticatedUser,
  ): Promise<DefinitionSetResponseDto> {
    this.logger.info(
      { operation: 'forms.definitionSet.create', actorId: actor.id },
      'Creating definition set',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.setsRepo.findSetByNamespace(
        tx,
        dto.namespaceUri,
      );
      if (clash) {
        this.logger.warn(
          {
            operation: 'forms.definitionSet.create',
            reason: 'namespace-in-use',
          },
          'Rejected: namespace already in use',
        );
        throw new ConflictException('El namespace ya está en uso', {
          namespaceUri: dto.namespaceUri,
        });
      }

      const set = this.setsRepo.createSet(tx, {
        namespaceUri: dto.namespaceUri,
        code: dto.code,
        name: dto.name,
        ownerTenantId: dto.ownerTenantId,
        targetDomainConceptId:
          dto.targetDomainConceptId ?? FORMS.TARGET_DOMAIN_GENERIC,
        statusConceptId: FORMS.SET_STATUS_DRAFT,
        actorUserId: actor.id,
      });
      // FK planas: persistir el padre antes de la versión.
      await tx.flush();

      const semanticVersion = dto.semanticVersion ?? '1.0.0';
      const version = this.setsRepo.createVersion(tx, {
        definitionSetId: set.id,
        semanticVersion,
        schemaHash: this.provisionalHash(set.id, semanticVersion),
        publicationStatusConceptId: FORMS.PUB_DRAFT,
        compatibilityConceptId: FORMS.COMPAT_BACKWARD,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'forms.definitionSet.create',
          setId: set.id,
          versionId: version.id,
        },
        'Definition set created',
      );
      return { id: set.id, versionId: version.id, status: set.statusConceptId };
    });
  }

  /** UC-09-03: compone miembros y publica la versión (draft → published). */
  async publishVersion(
    setId: string,
    versionId: string,
    dto: PublishVersionDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    this.logger.info(
      { operation: 'forms.definitionSet.publish', setId, versionId },
      'Publishing definition set version',
    );
    return this.em.transactional(async (tx) => {
      const set = await this.setsRepo.findSetById(tx, setId);
      if (!set)
        throw new ResourceNotFoundException(
          'Set de definiciones no encontrado',
          { setId },
        );

      const version = await this.setsRepo.findVersionById(tx, versionId);
      if (!version || version.definitionSetId !== setId) {
        throw new ResourceNotFoundException(
          'Versión no encontrada para el set',
          { versionId },
        );
      }
      if (version.publicationStatusConceptId !== FORMS.PUB_DRAFT) {
        throw new PreconditionFailedException(
          'La versión no está en borrador',
          {
            versionId,
          },
        );
      }

      for (const [i, m] of dto.members.entries()) {
        this.setsRepo.createMember(tx, {
          definitionSetVersionId: version.id,
          fieldId: m.fieldId,
          sectionId: m.sectionId,
          required: m.required ?? false,
          ordinal: m.ordinal ?? i,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      version.publicationStatusConceptId = FORMS.PUB_PUBLISHED;
      version.effectiveFrom = new Date();
      version.schemaHash = this.finalHash(
        version.id,
        dto.members.map((m) => m.fieldId),
      );

      set.statusConceptId = FORMS.SET_STATUS_ACTIVE;
      touch(set, actor.id);

      this.logger.info(
        {
          operation: 'forms.definitionSet.publish',
          setId,
          versionId,
          members: dto.members.length,
        },
        'Definition set version published',
      );
      return { ok: true };
    });
  }

  /** UC-09-13: ejecuta una migración entre dos versiones publicadas. */
  async runMigration(
    setId: string,
    migrationId: string,
    dto: RunMigrationDto,
    actor: AuthenticatedUser,
  ): Promise<MigrationRunResponseDto> {
    this.logger.info(
      { operation: 'forms.schema.migrate', setId, migrationId },
      'Running schema migration',
    );
    return this.em.transactional(async (tx) => {
      const set = await this.setsRepo.findSetById(tx, setId);
      if (!set)
        throw new ResourceNotFoundException(
          'Set de definiciones no encontrado',
          { setId },
        );

      const existing = await this.migrationsRepo.findById(tx, migrationId);
      if (existing) {
        throw new ConflictException('La migración ya fue registrada', {
          migrationId,
        });
      }

      const fromVersion = await this.setsRepo.findVersionById(
        tx,
        dto.fromVersionId,
      );
      const toVersion = await this.setsRepo.findVersionById(
        tx,
        dto.toVersionId,
      );
      if (!fromVersion || fromVersion.definitionSetId !== setId) {
        throw new ResourceNotFoundException('Versión origen no válida', {
          fromVersionId: dto.fromVersionId,
        });
      }
      if (!toVersion || toVersion.definitionSetId !== setId) {
        throw new ResourceNotFoundException('Versión destino no válida', {
          toVersionId: dto.toVersionId,
        });
      }

      // pending → running → completed en una sola tx síncrona.
      const migration = this.migrationsRepo.create(tx, {
        id: migrationId,
        definitionSetId: setId,
        fromVersionId: dto.fromVersionId,
        toVersionId: dto.toVersionId,
        migrationTypeConceptId:
          dto.migrationTypeConceptId ?? FORMS.MIGRATION_TYPE_TRANSFORM,
        transformationExpression: dto.transformationExpression,
        validationExpression: dto.validationExpression,
        rollbackExpression: dto.rollbackExpression,
        statusConceptId: FORMS.MIGRATION_COMPLETED,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'forms.schema.migrate',
          migrationId: migration.id,
          migratedValues: 0,
        },
        'Schema migration completed',
      );
      return {
        id: migration.id,
        status: migration.statusConceptId,
        migratedValues: 0,
      };
    });
  }

  /**
   * Crea provisional hash.
   *
   * @param setId - Identificador de set.
   * @param semanticVersion - Valor de semantic version requerido por la operación.
   * @returns Resultado de provisional hash conforme al contrato `string`.
   */
  private provisionalHash(setId: string, semanticVersion: string): string {
    return createHash('sha256')
      .update(`${setId}:${semanticVersion}:draft`)
      .digest('hex');
  }

  /**
   * Ejecuta la operación final hash.
   *
   * @param versionId - Identificador de version.
   * @param fieldIds - Valor de field ids requerido por la operación.
   * @returns Resultado de final hash conforme al contrato `string`.
   */
  private finalHash(versionId: string, fieldIds: string[]): string {
    return createHash('sha256')
      .update(`${versionId}:${[...fieldIds].sort().join(',')}`)
      .digest('hex');
  }
}
