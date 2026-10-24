import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  FormsDefinitionSetsController,
  FormsFieldsController,
  FormsAssignmentsController,
  FormsInstancesController,
  FormsMeController,
  FormsValuesController,
} from './controllers';
import {
  FormsSchemaService,
  FormsFieldsService,
  FormsAssignmentsService,
  FormsInstancesService,
  FormsValuesService,
  FormsReadService,
} from './services';
import {
  DefinitionSetsRepository,
  FieldDefinitionsRepository,
  AssignmentsRepository,
  FormInstancesRepository,
  FieldValuesRepository,
  MigrationsRepository,
} from './repositories';

/**
 * El barrel también re-exporta los contratos de las columnas jsonb (ADR-0022),
 * que incluyen funciones; al ORM se registran solo las clases de entidad.
 */
const entityClasses = Object.values(entities).filter((value) =>
  /^class\b/.test(Function.prototype.toString.call(value)),
);

/**
 * Módulo Forms (09): formularios dinámicos y gobernanza de extensibilidad.
 * Cubre definición de sets/versiones, campos con reglas y dependencias,
 * localizaciones, asignaciones gobernadas, instancias y captura/curación de
 * valores, y migración de esquema.
 */
@Module({
  imports: [MikroOrmModule.forFeature(entityClasses)],
  controllers: [
    FormsDefinitionSetsController,
    FormsFieldsController,
    FormsAssignmentsController,
    FormsInstancesController,
    FormsMeController,
    FormsValuesController,
  ],
  providers: [
    // Repositorios
    DefinitionSetsRepository,
    FieldDefinitionsRepository,
    AssignmentsRepository,
    FormInstancesRepository,
    FieldValuesRepository,
    MigrationsRepository,
    // Servicios
    FormsSchemaService,
    FormsFieldsService,
    FormsAssignmentsService,
    FormsInstancesService,
    FormsValuesService,
    FormsReadService,
  ],
})
export class FormsModule {}
