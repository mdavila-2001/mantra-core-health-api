import { PracticeModule } from '../practice/practice.module';
import { PeriopOrController } from './controllers/periop-or.controller';
import { OperatingRoomValidator } from './services/or/operating-room.validator';
import { CaseOrViewBuilder } from './services/or/case-or-view';
import {
  OrBlocksUseCases,
  OrTurnoverObserver,
  RecordRoomEventUseCase,
  SafetyChecklistUseCases,
} from './services/or/or.use-cases';
import { OperatingRoomsReadUseCases } from './services/or/or-read.use-cases';
import { InfraF4PolicyRegistrar } from './policies/infra-f4.policy';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
// El registro odontológico se escribe en `clinical.procedures`: la entidad se
// declara acá para que este módulo pueda persistirla en su propia transacción.
import { Procedures } from '../clinical/entities';
import { PeriopController, DentalController } from './controllers';
import {
  PeriopCasesService,
  PeriopPreopService,
  PeriopIntraopService,
  PeriopDentalService,
  PeriopReacceptanceService,
} from './services';
import {
  PeriopCasesRepository,
  PeriopPreopRepository,
  PeriopIntraopRepository,
  PeriopInstrumentsRepository,
  PeriopDentalRepository,
} from './repositories';
import { ProfessionalCredentialsRepository } from '../profiles/infrastructure/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ClinicalModule } from '../clinical/clinical.module';
import { AuthzModule } from '../authz/authz.module';

/**
 * Módulo perioperatorio: programación del caso quirúrgico, valoración y
 * clearance preoperatorio, checklist de seguridad, anestesia, intervención con
 * implantes e insumos, reporte operatorio, recuperación, cancelación y cargos
 * (UC-53-01 … 14).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([...Object.values(entities), Procedures]),
    AuditModule,
    MessagingModule,
    // El caso quirúrgico registra su diagnóstico y su procedimiento a través de
    // los servicios de `clinical`, que no importa este módulo (sin ciclo).
    ClinicalModule,
    // El paciente del caso se prueba contra el tenant con la regla de `authz`
    // (`AuthzClinicalScopeService.isPatientInTenant`, #893).
    AuthzModule,
    // F4 (CONTRATO-F2-F5 §F4): quirófano = espacio de F2 (puerto, evaluador
    // §0.3, observadores de limpieza). `practice` no importa periop.
    PracticeModule,
  ],
  controllers: [PeriopController, DentalController, PeriopOrController],
  providers: [
    PeriopCasesRepository,
    OperatingRoomValidator,
    CaseOrViewBuilder,
    SafetyChecklistUseCases,
    RecordRoomEventUseCase,
    OrBlocksUseCases,
    OrTurnoverObserver,
    OperatingRoomsReadUseCases,
    InfraF4PolicyRegistrar,
    PeriopPreopRepository,
    PeriopIntraopRepository,
    PeriopInstrumentsRepository,
    PeriopDentalRepository,
    // Fuente autoritativa de vigencia de credencial del equipo (C-14).
    ProfessionalCredentialsRepository,
    // Regla compartida por el caso, el equipo y la valoración preoperatoria.
    PeriopReacceptanceService,
    PeriopCasesService,
    PeriopPreopService,
    PeriopIntraopService,
    PeriopDentalService,
  ],
})
export class ProceduresPerioperativeModule {}
