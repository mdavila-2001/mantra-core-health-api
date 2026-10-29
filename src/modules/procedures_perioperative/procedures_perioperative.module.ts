import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
// El registro odontológico se escribe en `clinical.procedures`: la entidad se
// declara acá para que este módulo pueda persistirla en su propia transacción.
import { Procedures } from '../clinical/entities';
import {
  PeriopController,
  DentalController,
  PeriopOrController,
  PeriopOrInternalController,
} from './controllers';
import {
  PeriopCasesService,
  PeriopPreopService,
  PeriopIntraopService,
  PeriopDentalService,
  PeriopReacceptanceService,
  PeriopOperatingRoomService,
  PeriopBlocksService,
  PeriopChecklistGateService,
  PeriopCaseProjectionService,
  PeriopRoomEventsService,
  PeriopUtilizationService,
  PeriopRetireBlockersInitializer,
} from './services';
import {
  PeriopCasesRepository,
  PeriopPreopRepository,
  PeriopIntraopRepository,
  PeriopInstrumentsRepository,
  PeriopDentalRepository,
  PeriopBlocksRepository,
} from './repositories';
import { ProfessionalCredentialsRepository } from '../profiles/infrastructure/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ClinicalModule } from '../clinical/clinical.module';
// F4: `PracticeModule` exporta el registro de bloqueos de clausura; `practice` no importa
// este módulo, así que la dependencia va en un solo sentido.
import { PracticeModule } from '../practice/practice.module';
import { PeriopAccessModule } from './policies/periop-access.module';
import { InfraF4PolicyInitializer } from './policies/infra-f4.policy';
import { PractitionerScopeService } from './policies/practitioner-scope.service';
import { PractitionerRefsInterceptor } from './policies/practitioner-refs.interceptor';

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
    PracticeModule,
    PeriopAccessModule,
  ],
  controllers: [
    PeriopController,
    DentalController,
    PeriopOrController,
    PeriopOrInternalController,
  ],
  providers: [
    PeriopCasesRepository,
    PeriopPreopRepository,
    PeriopIntraopRepository,
    PeriopInstrumentsRepository,
    PeriopDentalRepository,
    PeriopBlocksRepository,
    // Fuente autoritativa de vigencia de credencial del equipo (C-14).
    ProfessionalCredentialsRepository,
    // Regla compartida por el caso, el equipo y la valoración preoperatoria.
    PeriopReacceptanceService,
    PeriopCasesService,
    PeriopPreopService,
    PeriopIntraopService,
    PeriopDentalService,
    // F4: quirófano como recurso, bloques, hechos de sala y utilización.
    PeriopOperatingRoomService,
    PeriopBlocksService,
    PeriopChecklistGateService,
    PeriopCaseProjectionService,
    PeriopRoomEventsService,
    PeriopUtilizationService,
    PeriopRetireBlockersInitializer,
    // Alta de la política de F4 en el registro de políticas de infraestructura.
    InfraF4PolicyInitializer,
    // F4: todo id de profesional del cuerpo debe ser de la organización activa.
    PractitionerScopeService,
    PractitionerRefsInterceptor,
  ],
})
export class ProceduresPerioperativeModule {}
