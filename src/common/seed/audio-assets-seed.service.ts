import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, deterministicId } from '../constants/concepts';
import { MessageQueues } from '../../modules/messaging/entities';
import { AudioTemplates } from '../../modules/audio_assets/entities';
import { AUDIO_GENERATION_QUEUE } from '../../modules/audio_assets/domain/audio-queue.constants';

const AUDIO_DLQ_CODE = 'audio-generation-dlq';
const AUDIO_QUEUE_ID = deterministicId('seed:queue:audio-generation');
const AUDIO_DLQ_ID = deterministicId('seed:queue:audio-generation-dlq');

interface AudioTemplateSeed {
  templateKey: string;
  version: number;
  strategy: 'STATIC' | 'CACHED_DYNAMIC';
  language: string;
  textTemplate: string;
  fallbackText?: string;
  voiceProfile: string;
  dynamicFieldsJson: unknown[];
}

const AUDIO_TEMPLATES: readonly AudioTemplateSeed[] = [
  {
    templateKey: 'onboarding.welcome',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate: 'Hola {preferredName}. Qué bueno tenerte aquí.',
    fallbackText: 'Hola. Qué bueno tenerte aquí.',
    voiceProfile: 'brand_es_latam_v1',
    dynamicFieldsJson: [
      {
        name: 'preferredName',
        type: 'PERSON_NAME',
        required: false,
        maxLength: 60,
        allowExternalTts: true,
      },
    ],
  },
  {
    templateKey: 'onboarding.dashboard.intro',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate: 'En esta pantalla encontrarás todos tus pacientes.',
    voiceProfile: 'brand_es_latam_v1',
    dynamicFieldsJson: [],
  },
];

/** Boot seed idempotente del contrato mínimo de audio y sus colas durables. */
@Injectable()
export class AudioAssetsSeedService {
  constructor(private readonly orm: MikroORM, private readonly logger: PinoLogger) {
    this.logger.setContext(AudioAssetsSeedService.name);
  }

  async run(): Promise<{ inserted: number }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;
    inserted += await this.seedQueue(em, AUDIO_DLQ_ID, AUDIO_DLQ_CODE, 'Audio generation dead letter', undefined, now);
    inserted += await this.seedQueue(em, AUDIO_QUEUE_ID, AUDIO_GENERATION_QUEUE, 'Audio asset generation', AUDIO_DLQ_ID, now);
    for (const template of AUDIO_TEMPLATES) inserted += await this.seedTemplate(em, template, now);
    await em.flush();
    if (inserted > 0) this.logger.info({ inserted }, 'Audio asset boot seed materialized');
    return { inserted };
  }

  private async seedQueue(
    em: ReturnType<MikroORM['em']['fork']>,
    id: string,
    code: string,
    name: string,
    deadLetterQueueId: string | undefined,
    now: Date,
  ): Promise<number> {
    const existing = await em.findOne(MessageQueues, { id });
    if (existing) return 0;
    em.create(MessageQueues, {
      id,
      code,
      name,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      defaultPriority: 5,
      defaultMaxAttempts: 4,
      visibilityTimeoutS: 120,
      deadLetterQueueId,
      createdAt: now,
      updatedAt: now,
    }, { partial: true });
    return 1;
  }

  private async seedTemplate(
    em: ReturnType<MikroORM['em']['fork']>,
    seed: AudioTemplateSeed,
    now: Date,
  ): Promise<number> {
    const existing = await em.findOne(AudioTemplates, {
      templateKey: seed.templateKey,
      version: seed.version,
    });
    if (existing) return 0;
    em.create(AudioTemplates, {
      id: deterministicId(`seed:audio-template:${seed.templateKey}:v${seed.version}`),
      ...seed,
      enabled: true,
      metadata: { source: 'boot-seed' },
      createdAt: now,
      updatedAt: now,
    }, { partial: true });
    return 1;
  }
}
