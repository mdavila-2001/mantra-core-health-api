import { Module } from '@nestjs/common';
import { AdminDataQualityController } from './controllers/admin-data-quality.controller';
import { DataQualityRepository } from './repositories/data-quality.repository';
import { DataQualityService } from './services/data-quality.service';

/**
 * Calidad de datos CLÍNICOS (incidencias y reglas de `health_data.*`). No posee tablas y su única
 * escritura es cerrar una incidencia. No es la calidad del catálogo de datos de la plataforma
 * (`data_catalog.quality_*`, `admin/catalog/quality/*`). Las solicitudes de privacidad (DSAR) las
 * sirve `audit` (`GET /privacy/dsar`): este módulo ya no las duplica.
 */
@Module({
  controllers: [AdminDataQualityController],
  providers: [DataQualityRepository, DataQualityService],
})
export class GovernanceAdminModule {}
