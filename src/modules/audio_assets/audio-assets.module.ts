import { Module } from '@nestjs/common';
import { StorageLifecycleModule } from '../../common/storage/storage-lifecycle.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MessagingModule } from '../messaging/messaging.module';
import * as entities from './entities';
import { AudioAssetsController } from './presentation/controllers/audio-assets.controller';
import { AudioAssetsInternalController } from './presentation/controllers/audio-assets-internal.controller';
import { AudioAssetsRepository } from './infrastructure/repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './application/audio-budget.policy';
import { ResolveAudioAssetUseCase } from './application/resolve-audio-asset.use-case';
import { AudioGenerationUseCase } from './application/audio-generation.use-case';
import { PregenerateAudioAssetsUseCase } from './application/pregenerate-audio-assets.use-case';
import { AudioValueCipherService } from './infrastructure/adapters/audio-value-cipher.service';
import { AudioJobQueueAdapter } from './infrastructure/adapters/audio-job-queue.adapter';
import { AudioAssetsFacade } from './application/audio-assets.facade';
import { AudioContentService } from './application/audio-content.service';
import { AudioMaintenanceRepository } from './infrastructure/repositories/audio-maintenance.repository';
import { AudioMaintenanceService } from './application/audio-maintenance.service';
import { AudioMetricsService } from './infrastructure/adapters/audio-metrics.service';
import { AUDIO_JOB_QUEUE_PORT } from './application/ports/audio-job-queue.port';
import { AUDIO_METRICS_PORT } from './application/ports/audio-metrics.port';
import { AUDIO_VALUE_CIPHER_PORT } from './application/ports/audio-value-cipher.port';

@Module({
  imports: [
    StorageLifecycleModule,
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [AudioAssetsController, AudioAssetsInternalController],
  providers: [
    AudioAssetsRepository,
    AudioBudgetPolicy,
    AudioValueCipherService,
    AudioJobQueueAdapter,
    ResolveAudioAssetUseCase,
    AudioGenerationUseCase,
    PregenerateAudioAssetsUseCase,
    AudioAssetsFacade,
    AudioContentService,
    AudioMaintenanceRepository,
    AudioMaintenanceService,
    AudioMetricsService,
    { provide: AUDIO_VALUE_CIPHER_PORT, useExisting: AudioValueCipherService },
    { provide: AUDIO_JOB_QUEUE_PORT, useExisting: AudioJobQueueAdapter },
    { provide: AUDIO_METRICS_PORT, useExisting: AudioMetricsService },
  ],
  exports: [AudioAssetsFacade],
})
export class AudioAssetsModule {}
