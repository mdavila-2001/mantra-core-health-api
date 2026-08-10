import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common';
import type { ResolveAudioAssetInput, ResolveAudioAssetResult } from './application/resolve-audio-asset.use-case';
import { ResolveAudioAssetUseCase } from './application/resolve-audio-asset.use-case';

/** Puerto estable para que onboarding/otros dominios no dependan de la infraestructura TTS. */
@Injectable()
export class AudioAssetsFacade {
  constructor(private readonly resolveUseCase: ResolveAudioAssetUseCase) {}
  resolve(input: ResolveAudioAssetInput, actor: AuthenticatedUser): Promise<ResolveAudioAssetResult> {
    return this.resolveUseCase.execute(input, actor, 'RUNTIME');
  }
}
