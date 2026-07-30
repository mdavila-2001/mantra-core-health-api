import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FieldSchemaMigrations } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una migración de esquema entre versiones. */
export interface CreateMigrationData {
  /**
   * Identificador único de la instancia.
   */
  id?: string;
  /**
   * Identificador asociado a definition set.
   */
  definitionSetId: string;
  /**
   * Identificador asociado a from version.
   */
  fromVersionId: string;
  /**
   * Identificador asociado a to version.
   */
  toVersionId: string;
  /**
   * Identificador asociado a migration type concept.
   */
  migrationTypeConceptId: string;
  /**
   * Valor de transformation expression mantenido por la instancia.
   */
  transformationExpression?: string;
  /**
   * Valor de validation expression mantenido por la instancia.
   */
  validationExpression?: string;
  /**
   * Valor de rollback expression mantenido por la instancia.
   */
  rollbackExpression?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `forms.field_schema_migrations`. */
@Injectable()
export class MigrationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<FieldSchemaMigrations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<FieldSchemaMigrations | null> {
    return em.findOne(FieldSchemaMigrations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FieldSchemaMigrations`.
   */
  create(em: EntityManager, data: CreateMigrationData): FieldSchemaMigrations {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldSchemaMigrations,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
