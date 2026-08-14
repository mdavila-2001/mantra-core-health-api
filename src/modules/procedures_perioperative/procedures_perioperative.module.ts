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
} from './services';
import {
  PeriopCasesRepository,
  PeriopPreopRepository,
  PeriopIntraopRepository,
  PeriopInstrumentsRepository,
  PeriopDentalRepository,
} from './repositories';
import { ProfessionalCredentialsRepository } from '../profiles/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ClinicalModule } from '../clinical/clinical.module';

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
  ],
  controllers: [PeriopController, DentalController],
  providers: [
    PeriopCasesRepository,
    PeriopPreopRepository,
    PeriopIntraopRepository,
    PeriopInstrumentsRepository,
    PeriopDentalRepository,
    // Fuente autoritativa de vigencia de credencial del equipo (C-14).
    ProfessionalCredentialsRepository,
    PeriopCasesService,
    PeriopPreopService,
    PeriopIntraopService,
    PeriopDentalService,
  ],
})
export class ProceduresPerioperativeModule {}
