import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MessagingModule } from '../messaging/messaging.module';
import * as entities from './entities';
import { AudioAssetsController } from './controllers/audio-assets.controller';
import { AudioAssetsInternalController } from './controllers/audio-assets-internal.controller';
import { AudioAssetsRepository } from './repositories/audio-assets.repository';
import { AudioBudgetPolicy } from './application/audio-budget.policy';
import { ResolveAudioAssetUseCase } from './application/resolve-audio-asset.use-case';
import { AudioGenerationUseCase } from './application/audio-generation.use-case';
import { PregenerateAudioAssetsUseCase } from './application/pregenerate-audio-assets.use-case';
import { AudioValueCipherService } from './infrastructure/audio-value-cipher.service';
import { AudioJobQueueAdapter } from './infrastructure/audio-job-queue.adapter';
import { AudioAssetsFacade } from './audio-assets.facade';
import { AudioContentService } from './audio-content.service';
import { AudioMaintenanceRepository } from './repositories/audio-maintenance.repository';
import { AudioMaintenanceService } from './application/audio-maintenance.service';
import { AudioMetricsService } from './infrastructure/audio-metrics.service';

@Module({
  imports: [
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
  ],
  exports: [AudioAssetsFacade],
})
export class AudioAssetsModule {}
