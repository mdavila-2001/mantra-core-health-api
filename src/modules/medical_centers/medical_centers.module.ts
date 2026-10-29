import { Module } from '@nestjs/common';
import { ProcedureReferenceReader } from '../billing/services/procedure-reference.reader';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../profiles/infrastructure/repositories';
import { MedicalCentersController } from './controllers/medical-centers.controller';
import {
  MedicalCenterOffersPort,
  OwnServiceRequestsPort,
  PractitionerAffiliationsPort,
} from './ports/medical-center.ports';
import { MedicalCenterOffersRepository } from './repositories/medical-center-offers.repository';
import { OwnServiceRequestsRepository } from './repositories/own-service-requests.repository';
import { PractitionerAffiliationsRepository } from './repositories/practitioner-affiliations.repository';
import { MedicalCentersForMyOrdersService } from './services/medical-centers-for-my-orders.service';
import { MedicalCentersSearchService } from './services/medical-centers-search.service';

/**
 * Módulo Medical Centers: búsqueda de centros médicos por los procedimientos que
 * ofrecen, con precio y cobertura.
 *
 * Lee `practice`, `billing`, `clinical` y `terminology` por el `EntityManager`
 * y registra por clase lo que necesita de otros módulos, sin importarlos: la
 * dependencia va en un solo sentido y no cierra ciclo con `practice` ni `billing`.
 */
@Module({
  controllers: [MedicalCentersController],
  providers: [
    {
      provide: MedicalCenterOffersPort,
      useClass: MedicalCenterOffersRepository,
    },
    { provide: OwnServiceRequestsPort, useClass: OwnServiceRequestsRepository },
    {
      provide: PractitionerAffiliationsPort,
      useClass: PractitionerAffiliationsRepository,
    },
    // Lectura sin estado del nomenclador y repositorios de identidad del titular.
    ProcedureReferenceReader,
    PersonAccountLinksRepository,
    PatientProfilesRepository,
    MedicalCentersSearchService,
    MedicalCentersForMyOrdersService,
  ],
})
export class MedicalCentersModule {}
