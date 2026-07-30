import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { Observations } from '../clinical/entities';
import { ObservationsRepository } from '../clinical/repositories';
import { MessagingModule } from '../messaging/messaging.module';
import { SeriesController, TimescaleAdminController } from './controllers';
import {
  SeriesIngestService,
  VitalNormalizationService,
  TimescaleAdminService,
  SeriesQueryService,
} from './services';
import { SeriesIngestRepository, TimescaleRepository } from './repositories';

/**
 * Módulo 58 del modelo: series temporales de alto volumen sobre TimescaleDB
 * (UC-58-01 … 13).
 *
 * Las 12 entidades de este módulo son mediciones append-only (constantes vitales
 * normalizadas, latencia de pasarelas de pago, SLI de servicios...). Se distinguen
 * del resto del modelo en dos cosas:
 *
 *   - no tienen `id` uuid: su clave primaria es compuesta
 *     (time, tenant_id, series_id), que es también la clave de particionado;
 *   - sus tablas se convierten en hypertables en la capa 07 del arranque del ORM,
 *     lo que las particiona por tiempo de forma transparente.
 *
 * Registra `Observations` de `clinical` y su repositorio a propósito: UC-58-03
 * promueve una constante vital validada al registro clínico **en la misma
 * transacción**, y sin la entidad registrada aquí el `EntityManager` de este
 * módulo no sabría persistirla.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([...Object.values(entities), Observations]),
    MessagingModule,
  ],
  controllers: [SeriesController, TimescaleAdminController],
  providers: [
    SeriesIngestRepository,
    TimescaleRepository,
    ObservationsRepository,
    SeriesIngestService,
    VitalNormalizationService,
    TimescaleAdminService,
    SeriesQueryService,
  ],
})
export class TimeSeriesModule {}
