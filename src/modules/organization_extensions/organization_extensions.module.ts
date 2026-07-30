import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  OrgextHospitalsController,
  OrgextFacilityLicensesController,
  OrgextAffiliationsController,
  OrgextDataBoundariesController,
} from './controllers';
import {
  OrgextHospitalsService,
  OrgextFacilityLicensesService,
  OrgextAffiliationsService,
  OrgextDataBoundariesService,
} from './services';
import {
  HospitalsRepository,
  HospitalServiceLinesRepository,
  FacilityLicensesRepository,
  OrganizationAffiliationsRepository,
  OrganizationDataBoundariesRepository,
} from './repositories';

/**
 * Módulo Organization Extensions (22 — Healthcare Organization Specializations):
 * hospitales y sus líneas de servicio, licencias de instalación, afiliaciones
 * entre organizaciones y fronteras de datos (residencia/RLS). Auth y conceptos
 * llegan por los módulos transversales (global).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    OrgextHospitalsController,
    OrgextFacilityLicensesController,
    OrgextAffiliationsController,
    OrgextDataBoundariesController,
  ],
  providers: [
    // Repositorios
    HospitalsRepository,
    HospitalServiceLinesRepository,
    FacilityLicensesRepository,
    OrganizationAffiliationsRepository,
    OrganizationDataBoundariesRepository,
    // Servicios
    OrgextHospitalsService,
    OrgextFacilityLicensesService,
    OrgextAffiliationsService,
    OrgextDataBoundariesService,
  ],
})
export class OrganizationExtensionsModule {}
