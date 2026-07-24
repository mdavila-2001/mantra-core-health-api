import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TimeSeriesController } from './time_series.controller';
import { TimeSeriesService } from './time_series.service';
import * as entities from './entities';

/**
 * Módulo 58 del modelo: series temporales sobre TimescaleDB.
 *
 * Las 12 entidades de este módulo son mediciones append-only (constantes
 * vitales normalizadas, latencia de pasarelas de pago, SLI de servicios...). Se
 * distinguen del resto del modelo en dos cosas:
 *
 *   - no tienen `id` uuid: su clave primaria es compuesta
 *     (tenant_id, series_id, time), que es también la clave de particionado;
 *   - sus tablas se convierten en hypertables en la capa 07 del arranque del
 *     ORM, lo que las particiona por tiempo de forma transparente.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [TimeSeriesController],
  providers: [TimeSeriesService],
})
export class TimeSeriesModule {}
