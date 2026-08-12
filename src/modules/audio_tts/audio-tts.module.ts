import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AudioStorageModule } from './storage';
import { AudioTtsController, AudioTtsInternalController } from './controllers';
import {
  AudioAssetResolver,
  AudioGenerationService,
  AudioPlaybackService,
  AudioReconcileService,
  AudioTemplateSeedService,
} from './services';
import { AudioAssetsRepository, AudioQuotaRepository } from './repositories';

/**
 * Síntesis de voz cacheada por identidad (dominio `audio_tts`).
 *
 * Qué hace, en una línea: convierte una plantilla y unas variables en un audio, y
 * se asegura de no pagar dos veces por el mismo audio ni de gastar más de lo
 * presupuestado.
 *
 * Este módulo es la mitad que vive en el proceso de la **API**: resuelve, cachea,
 * cifra el texto, contabiliza el gasto y publica la superficie interna que el
 * worker consume. La otra mitad —la que habla con ElevenLabs y escribe los bytes—
 * vive en `src/worker/jobs/audio_tts` y corre en su propio proceso. Ninguno de los
 * dos puede hacer el trabajo del otro, y ese es el punto: la API no tiene la
 * credencial del proveedor, y el worker no tiene ni la clave de cifrado ni acceso
 * a PostgreSQL.
 *
 * **Exporta `AudioAssetResolver`** para que cualquier dominio (onboarding,
 * mensajería, educación) pida un audio por inyección sin volver a implementar la
 * caché, el presupuesto ni la degradación. Los cuatro estados de su respuesta
 * —`READY`, `QUEUED`, `FALLBACK`, `UNAVAILABLE`— están pensados para que el
 * llamador pueda continuar en todos ellos: la falta de audio nunca es un error.
 *
 * `AudioPlaybackService` se exporta con él porque son inseparables en la práctica:
 * el resolutor devuelve la referencia canónica y este firma la URL con la que un
 * cliente la reproduce.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    AudioStorageModule,
  ],
  controllers: [AudioTtsController, AudioTtsInternalController],
  providers: [
    AudioAssetsRepository,
    AudioQuotaRepository,
    AudioAssetResolver,
    AudioGenerationService,
    AudioReconcileService,
    AudioPlaybackService,
    AudioTemplateSeedService,
  ],
  exports: [AudioAssetResolver, AudioPlaybackService],
})
export class AudioTtsModule {}
