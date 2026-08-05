import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { PeriopController } from './controllers';
import {
  PeriopCasesService,
  PeriopPreopService,
  PeriopIntraopService,
} from './services';
import {
  PeriopCasesRepository,
  PeriopPreopRepository,
  PeriopIntraopRepository,
  PeriopInstrumentsRepository,
} from './repositories';
import { ProfessionalCredentialsRepository } from '../profiles/repositories';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';

/**
 * Módulo perioperatorio: programación del caso quirúrgico, valoración y
 * clearance preoperatorio, checklist de seguridad, anestesia, intervención con
 * implantes e insumos, reporte operatorio, recuperación, cancelación y cargos
 * (UC-53-01 … 14).
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AuditModule,
    MessagingModule,
  ],
  controllers: [PeriopController],
  providers: [
    PeriopCasesRepository,
    PeriopPreopRepository,
    PeriopIntraopRepository,
    PeriopInstrumentsRepository,
    // Fuente autoritativa de vigencia de credencial del equipo (C-14).
    ProfessionalCredentialsRepository,
    PeriopCasesService,
    PeriopPreopService,
    PeriopIntraopService,
  ],
})
export class ProceduresPerioperativeModule {}
