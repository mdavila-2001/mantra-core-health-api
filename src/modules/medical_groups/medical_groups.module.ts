import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PracticeModule } from '../practice/practice.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { MedicalGroupsController } from './controllers';
import { MedicalGroupsService } from './services';
import {
  MedicalGroupMembersRepository,
  MedicalGroupsRepository,
} from './repositories';
import { ServiceCatalogRepository } from '../billing/repositories';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
} from '../profiles/repositories';
import { ConditionsRepository } from '../clinical/repositories';

/**
 * Módulo Medical Groups (21, nuevo — FT-21 "Corrección de grupo médico").
 *
 * `ServiceCatalogRepository`, `HealthPractitionerProfilesRepository`,
 * `PatientProfilesRepository` y `ConditionsRepository` son de otros módulos,
 * pero se registran acá directamente en vez de importar sus módulos enteros:
 * son clases sin estado (reciben el `EntityManager` por parámetro) y este es
 * el mismo criterio que ya usa `PracticeModule` con este mismo
 * `ServiceCatalogRepository` (ver el comentario en `practice.module.ts`).
 * `PracticeTenantLookupService` y `ClinicalReadService` sí tienen dependencias
 * propias (varios repositorios cada uno), así que para esos dos se importa el
 * módulo dueño completo.
 */
@Module({
  imports: [
    // Sólo las entidades: el índice también exporta constantes (estados del
    // grupo) que `forFeature` no admite.
    MikroOrmModule.forFeature([
      entities.MedicalGroups,
      entities.MedicalGroupMembers,
    ]),
    PracticeModule,
    ClinicalModule,
  ],
  controllers: [MedicalGroupsController],
  providers: [
    MedicalGroupsRepository,
    MedicalGroupMembersRepository,
    ServiceCatalogRepository,
    HealthPractitionerProfilesRepository,
    PatientProfilesRepository,
    ConditionsRepository,
    MedicalGroupsService,
  ],
})
export class MedicalGroupsModule {}
