import { Injectable } from '@nestjs/common';
import { loadAudioEnv } from '../audio.env';
import type { AudioGenerationMode } from '../domain/audio.types';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';

export type AudioBudgetDenialReason =
  | 'TTS_DISABLED'
  | 'PROVIDER_DISABLED'
  | 'MONTHLY_LIMIT_REACHED'
  | 'SAFETY_RESERVE_REACHED'
  | 'PRODUCTION_LICENSE_NOT_CONFIRMED'
  | 'RUNTIME_GENERATION_DISABLED'
  | 'ACTOR_DAILY_LIMIT_REACHED';
export type AudioBudgetDecision =
  { allowed: true } | { allowed: false; reason: AudioBudgetDenialReason };

@Injectable()
export class AudioBudgetPolicy {
  private readonly env = loadAudioEnv();
  constructor(private readonly repository: AudioAssetsRepository) {}

  environmentDecision(mode: AudioGenerationMode): AudioBudgetDecision {
    if (!this.env.enabled) return { allowed: false, reason: 'TTS_DISABLED' };
    if (this.env.provider === 'disabled')
      return { allowed: false, reason: 'PROVIDER_DISABLED' };
    if (mode === 'RUNTIME' && !this.env.allowRuntimeGeneration)
      return { allowed: false, reason: 'RUNTIME_GENERATION_DISABLED' };
    if (process.env.NODE_ENV === 'production' && !this.env.prodLicenseConfirmed)
      return { allowed: false, reason: 'PRODUCTION_LICENSE_NOT_CONFIRMED' };
    if (this.env.safetyReserveUnits >= this.env.monthlyBudgetUnits)
      return { allowed: false, reason: 'SAFETY_RESERVE_REACHED' };
    return { allowed: true };
  }

  async canGenerate(
    mode: AudioGenerationMode,
    estimatedUnits: number,
    actorHash?: string,
  ): Promise<AudioBudgetDecision> {
    const environment = this.environmentDecision(mode);
    if (!environment.allowed) return environment;
    if (
      mode === 'RUNTIME' &&
      actorHash &&
      this.env.runtimeGenerationsPerActorDay > 0
    ) {
      const usedByActor = await this.repository.countQueuedByActorSince(
        actorHash,
        startOfUtcDay(),
      );
      if (usedByActor >= this.env.runtimeGenerationsPerActorDay)
        return { allowed: false, reason: 'ACTOR_DAILY_LIMIT_REACHED' };
    }
    const used = await this.repository.estimatedUsage(
      this.periodKey(),
      this.env.provider,
    );
    return used + estimatedUnits <= this.usableMonthlyLimit()
      ? { allowed: true }
      : { allowed: false, reason: 'MONTHLY_LIMIT_REACHED' };
  }
  usableMonthlyLimit(): number {
    return Math.max(
      0,
      this.env.monthlyBudgetUnits - this.env.safetyReserveUnits,
    );
  }
  periodKey(): string {
    return new Date().toISOString().slice(0, 7);
  }
}
function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
