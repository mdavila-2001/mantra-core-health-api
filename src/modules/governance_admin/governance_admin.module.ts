import { Module } from '@nestjs/common';
import { AdminDataQualityController } from './controllers/admin-data-quality.controller';
import { AdminPrivacyRequestsController } from './controllers/admin-privacy-requests.controller';
import { DataQualityRepository } from './repositories/data-quality.repository';
import { PrivacyRequestsRepository } from './repositories/privacy-requests.repository';
import { DataQualityService } from './services/data-quality.service';
import { PrivacyRequestsService } from './services/privacy-requests.service';

/**
 * Vistas de administración de la calidad de datos (incidencias y reglas) y de las solicitudes de
 * privacidad. No posee tablas: lee `health_data.*` y `audit.dsar_requests`, y su única escritura
 * es cerrar una incidencia de calidad.
 */
@Module({
  controllers: [AdminDataQualityController, AdminPrivacyRequestsController],
  providers: [
    DataQualityRepository,
    PrivacyRequestsRepository,
    DataQualityService,
    PrivacyRequestsService,
  ],
})
export class GovernanceAdminModule {}
