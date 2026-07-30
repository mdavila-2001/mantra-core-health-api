import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  FormsDefinitionSetsController,
  FormsFieldsController,
  FormsAssignmentsController,
  FormsInstancesController,
  FormsValuesController,
} from './controllers';
import {
  FormsSchemaService,
  FormsFieldsService,
  FormsAssignmentsService,
  FormsInstancesService,
  FormsValuesService,
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
 * Módulo Forms (09): formularios dinámicos y gobernanza de extensibilidad.
 * Cubre definición de sets/versiones, campos con reglas y dependencias,
 * localizaciones, asignaciones gobernadas, instancias y captura/curación de
 * valores, y migración de esquema.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    FormsDefinitionSetsController,
    FormsFieldsController,
    FormsAssignmentsController,
    FormsInstancesController,
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
  ],
})
export class FormsModule {}
