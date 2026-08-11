import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common';
import type { AudioDynamicField } from '../domain/audio.types';
import { AudioAssetsRepository } from '../repositories/audio-assets.repository';
import { ResolveAudioAssetUseCase } from './resolve-audio-asset.use-case';

const MAX_ENUMERATED_COMBINATIONS = 500;

@Injectable()
export class PregenerateAudioAssetsUseCase {
  constructor(
    private readonly repository: AudioAssetsRepository,
    private readonly resolve: ResolveAudioAssetUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    templateKeys?: string[],
  ): Promise<{
    requested: number;
    queued: number;
    ready: number;
    fallbackOnly: number;
  }> {
    const templates = await this.repository.listEnabledTemplates(templateKeys);
    const latest = [
      ...new Map(
        templates.map((template) => [template.templateKey, template]),
      ).values(),
    ];
    const totals = { requested: 0, queued: 0, ready: 0, fallbackOnly: 0 };
    for (const template of latest) {
      const variablesList = this.enumeratedVariables(
        this.repository.dynamicFields(template),
        template.strategy,
      );
      for (const variables of variablesList) {
        const result = await this.resolve.execute(
          {
            templateKey: template.templateKey,
            requestedVersion: template.version,
            variables,
          },
          actor,
          'PREGENERATE',
        );
        this.count(totals, result.status);
      }
      if (template.fallbackText) {
        const fallback = await this.resolve.resolveFallbackByTemplateKey(
          template.templateKey,
          actor,
          'PREGENERATE',
        );
        this.count(
          totals,
          fallback.jobId
            ? 'QUEUED'
            : fallback.fallbackAsset?.status === 'READY'
              ? 'READY'
              : 'FALLBACK',
        );
      }
    }
    return totals;
  }

  private enumeratedVariables(
    fields: AudioDynamicField[],
    strategy: string,
  ): Array<Record<string, string>> {
    if (strategy === 'STATIC') return [{}];
    if (strategy !== 'ENUMERATED') return [];
    if (
      fields.some(
        (field) => field.type !== 'ENUM' || !field.allowedValues?.length,
      )
    )
      return [];
    let combinations: Array<Record<string, string>> = [{}];
    for (const field of fields) {
      combinations = combinations.flatMap((base) =>
        (field.allowedValues ?? []).map((value) => ({
          ...base,
          [field.name]: value,
        })),
      );
      if (combinations.length > MAX_ENUMERATED_COMBINATIONS) {
        throw new Error(
          `La plantilla enumerada excede ${MAX_ENUMERATED_COMBINATIONS} combinaciones`,
        );
      }
    }
    return combinations;
  }

  private count(
    totals: {
      requested: number;
      queued: number;
      ready: number;
      fallbackOnly: number;
    },
    status: 'READY' | 'QUEUED' | 'FALLBACK',
  ): void {
    totals.requested += 1;
    if (status === 'READY') totals.ready += 1;
    else if (status === 'QUEUED') totals.queued += 1;
    else totals.fallbackOnly += 1;
  }
}
