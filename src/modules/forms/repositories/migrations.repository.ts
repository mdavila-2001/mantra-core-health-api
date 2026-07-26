import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FieldSchemaMigrations } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una migración de esquema entre versiones. */
export interface CreateMigrationData {
  id?: string;
  definitionSetId: string;
  fromVersionId: string;
  toVersionId: string;
  migrationTypeConceptId: string;
  transformationExpression?: string;
  validationExpression?: string;
  rollbackExpression?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `forms.field_schema_migrations`. */
@Injectable()
export class MigrationsRepository {
  findById(em: EntityManager, id: string): Promise<FieldSchemaMigrations | null> {
    return em.findOne(FieldSchemaMigrations, { id });
  }

  create(em: EntityManager, data: CreateMigrationData): FieldSchemaMigrations {
    const { actorUserId, ...rest } = data;
    return em.create(FieldSchemaMigrations, { ...rest, ...createdBy(actorUserId) }, { partial: true });
  }
}
