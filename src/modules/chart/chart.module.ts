import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ChartNotesController,
  ChartDocumentsController,
  ChartCarePlansController,
  ChartTemplatesController,
  ChartReadController,
  ChartEncountersController,
} from './controllers';
import {
  ChartNotesService,
  ChartDocumentsService,
  ChartCarePlansService,
  ChartTemplatesService,
  ChartReadService,
  ChartNotesReadService,
  EncounterPdfService,
} from './services';
import {
  ClinicalNotesRepository,
  CarePlansRepository,
  DocumentsRepository,
  ChartTemplatesRepository,
} from './repositories';
// FT-07-R08: `ChartReadController` necesita el mismo guard que
// `ClinicalReadController` — ambos son la misma pregunta de autorización
// (¿puede este profesional ver el expediente de este paciente?) sobre la misma
// pantalla de archivo clínico. `ClinicalModule` exporta el guard ya resuelto
// contra `ClinicalReadService`; importar `AuthzModule` directamente acá sería
// redundante.
import { ClinicalModule } from '../clinical/clinical.module';
// C.4 — el PDF del encuentro necesita el encuentro y sus diagnósticos y
// prescripciones. `EncountersRepository` ya lo exporta `ClinicalModule`;
// `ConditionsRepository` y `MedicationRequestsRepository` no, así que se
// proveen sueltos acá, mismo criterio que `clinical.module.ts` usa con los
// repositorios de otros módulos: son clases sin estado que reciben el
// `EntityManager` por parámetro.
import {
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
} from '../clinical/repositories';
// El vínculo gobernado de `POST /charts/documents` necesita comprobar, dentro
// de su propia transacción, que cada `fileId` existe y es del actor
// (`AttachableFileService`); la descarga contextual del documento pide los
// bytes ya autorizados (`FileUploadService`). `CommonModule` exporta ambos, y
// `FilesRepository` (C.4) resuelve el nombre original de cada archivo adjunto
// del PDF del encuentro.
import { CommonModule } from '../common/common.module';
// C.4 — el PDF resuelve CIE-10 y medicamentos por su concepto: mismo
// resolvedor en lote que ya usa el resto del repo, sin ciclo (`terminology`
// no conoce a `chart`).
import { TerminologyModule } from '../terminology/terminology.module';
// C.4 — nombre del paciente y del profesional en el encabezado y el pie del
// PDF. `*_profiles.profile_id` es FK directa a `profiles.persons(id)` (CTI):
// sin paso intermedio por `person_profiles`. Mismo criterio: clases sin
// estado con `EntityManager` por parámetro.
import { PatientProfilesRepository } from '../profiles/repositories/patient-profiles.repository';
import { HealthPractitionerProfilesRepository } from '../profiles/repositories/health-practitioner-profiles.repository';
import { PersonsRepository } from '../profiles/repositories/persons.repository';

/**
 * Módulo Chart (15): notas clínicas versionadas y firmadas, liberación al
 * paciente, hallazgos de examen físico, documentos gobernados, planes de cuidado
 * y asignación de plantillas por especialidad.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    ClinicalModule,
    CommonModule,
    TerminologyModule,
  ],
  controllers: [
    ChartNotesController,
    ChartDocumentsController,
    ChartCarePlansController,
    ChartTemplatesController,
    ChartReadController,
    ChartEncountersController,
  ],
  providers: [
    // Repositorios
    ClinicalNotesRepository,
    CarePlansRepository,
    DocumentsRepository,
    ChartTemplatesRepository,
    ConditionsRepository,
    EncountersRepository,
    MedicationRequestsRepository,
    PatientProfilesRepository,
    HealthPractitionerProfilesRepository,
    PersonsRepository,
    // Servicios
    ChartNotesService,
    ChartDocumentsService,
    ChartCarePlansService,
    ChartTemplatesService,
    ChartReadService,
    ChartNotesReadService,
    EncounterPdfService,
  ],
})
export class ChartModule {}
