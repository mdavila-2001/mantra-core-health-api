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
  strategy: 'STATIC' | 'ENUMERATED' | 'CACHED_DYNAMIC' | 'FALLBACK';
  language: string;
  textTemplate: string;
  fallbackText?: string;
  voiceProfile: string;
  dynamicFieldsJson: unknown[];
}

const VOICE = 'brand_es_latam_v1';

const PERSON_NAME_FIELD = (
  name: string,
  overrides: Partial<AudioTemplateSeed['dynamicFieldsJson'][number]> = {},
) => ({
  name,
  type: 'PERSON_NAME' as const,
  required: false,
  maxLength: 60,
  allowExternalTts: true,
  ...overrides,
});

/**
 * `AUDIO_TTS_GLOBAL_FALLBACK_TEMPLATE` (audio.env.ts) apunta por defecto a
 * este templateKey. Debe existir siempre, con estrategia `FALLBACK`: es el
 * único audio que el README permite servir sin contenido sintetizado por una
 * cuenta autorizada, y nunca puede deprecarse (ver `/deprecate`).
 */
const GLOBAL_FALLBACK: AudioTemplateSeed = {
  templateKey: 'onboarding.fallback.generic',
  version: 1,
  strategy: 'FALLBACK',
  language: 'es-419',
  textTemplate: 'Hola. Qué bueno tenerte aquí.',
  voiceProfile: VOICE,
  dynamicFieldsJson: [],
};

/** Onboarding: primer contacto de la persona con la app, previo a cualquier dato clínico. */
const ONBOARDING_TEMPLATES: readonly AudioTemplateSeed[] = [
  {
    templateKey: 'onboarding.welcome',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate: 'Hola {preferredName}. Qué bueno tenerte aquí.',
    fallbackText: 'Hola. Qué bueno tenerte aquí.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [PERSON_NAME_FIELD('preferredName')],
  },
  {
    templateKey: 'onboarding.privacy.intro',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'Antes de empezar, queremos que sepas cómo cuidamos tu información. ' +
      'Todo lo que compartas aquí es confidencial y solo tu profesional tratante puede verlo.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
  {
    templateKey: 'onboarding.consent.informed',
    version: 1,
    strategy: 'ENUMERATED',
    language: 'es-419',
    textTemplate:
      'Vamos a pedirte tu consentimiento para {consentPurpose}. Podés leerlo con calma y aceptar cuando estés listo.',
    fallbackText:
      'Vamos a pedirte tu consentimiento antes de continuar. Podés leerlo con calma y aceptar cuando estés listo.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [
      {
        name: 'consentPurpose',
        type: 'ENUM',
        required: true,
        allowedValues: [
          'iniciar tu tratamiento',
          'compartir tu información con tu profesional',
          'recibir recordatorios por mensaje',
        ],
      },
    ],
  },
  {
    templateKey: 'onboarding.dashboard.intro.patient',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'Esta es tu pantalla principal. Acá vas a ver tus próximas citas, tus formularios pendientes y los mensajes de tu profesional.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
  {
    templateKey: 'onboarding.dashboard.intro.professional',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'En esta pantalla encontrarás todos tus pacientes, su próxima cita y los formularios que te enviaron.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
];

/** Agenda: turnos y recordatorios, el flujo con más volumen de audio generado. */
const SCHEDULING_TEMPLATES: readonly AudioTemplateSeed[] = [
  {
    templateKey: 'scheduling.appointment.reminder',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate:
      'Hola {preferredName}. Te recordamos tu cita con {professionalName} el {appointmentSlot}.',
    fallbackText: 'Tenés una cita próxima. Revisá el detalle en la app.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [
      PERSON_NAME_FIELD('preferredName'),
      PERSON_NAME_FIELD('professionalName'),
      {
        name: 'appointmentSlot',
        type: 'SAFE_TEXT',
        required: true,
        maxLength: 40,
      },
    ],
  },
  {
    templateKey: 'scheduling.appointment.confirmed',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate: 'Tu cita con {professionalName} quedó confirmada.',
    fallbackText: 'Tu cita quedó confirmada.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [PERSON_NAME_FIELD('professionalName')],
  },
  {
    templateKey: 'scheduling.appointment.cancelled',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate: 'Tu cita con {professionalName} fue cancelada.',
    fallbackText: 'Una de tus citas fue cancelada. Revisá el detalle en la app.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [PERSON_NAME_FIELD('professionalName')],
  },
  {
    templateKey: 'scheduling.appointment.reschedule_needed',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'Tu profesional necesita reprogramar tu próxima cita. Elegí un nuevo horario cuando puedas.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
];

/** Sesión clínica: apertura y cierre, siempre en lenguaje neutro (sin diagnóstico ni contenido sensible). */
const CLINICAL_TEMPLATES: readonly AudioTemplateSeed[] = [
  {
    templateKey: 'clinical.session.starting_soon',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate: 'Tu sesión está por comenzar. Cuando quieras, podés ingresar a la sala.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
  {
    templateKey: 'clinical.session.closing',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'La sesión terminó. Tu profesional te va a escribir si necesita algo más de vos antes del próximo encuentro.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
  {
    templateKey: 'clinical.form.assigned',
    version: 1,
    strategy: 'ENUMERATED',
    language: 'es-419',
    textTemplate:
      'Tu profesional te asignó un formulario de {formCategory}. Podés completarlo cuando tengas un momento tranquilo.',
    fallbackText: 'Tenés un formulario nuevo para completar.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [
      {
        name: 'formCategory',
        type: 'ENUM',
        required: true,
        allowedValues: [
          'evaluación de salud mental',
          'seguimiento de síntomas',
          'hábitos y bienestar',
        ],
      },
    ],
  },
];

/** Comunidad y mensajería: notificaciones de bajo riesgo, siempre con fallback estático. */
const COMMUNITY_TEMPLATES: readonly AudioTemplateSeed[] = [
  {
    templateKey: 'community.welcome',
    version: 1,
    strategy: 'STATIC',
    language: 'es-419',
    textTemplate:
      'Bienvenido a la comunidad. Acá vas a encontrar espacios para compartir y acompañarte con otras personas.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [],
  },
  {
    templateKey: 'messaging.new_message',
    version: 1,
    strategy: 'CACHED_DYNAMIC',
    language: 'es-419',
    textTemplate: 'Tenés un mensaje nuevo de {professionalName}.',
    fallbackText: 'Tenés un mensaje nuevo.',
    voiceProfile: VOICE,
    dynamicFieldsJson: [PERSON_NAME_FIELD('professionalName')],
  },
];

const AUDIO_TEMPLATES: readonly AudioTemplateSeed[] = [
  GLOBAL_FALLBACK,
  ...ONBOARDING_TEMPLATES,
  ...SCHEDULING_TEMPLATES,
  ...CLINICAL_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
];

/** Boot seed idempotente del contrato mínimo de audio y sus colas durables. */
@Injectable()
export class AudioAssetsSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioAssetsSeedService.name);
  }

  async run(): Promise<{ inserted: number }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;
    inserted += await this.seedQueue(
      em,
      AUDIO_DLQ_ID,
      AUDIO_DLQ_CODE,
      'Audio generation dead letter',
      undefined,
      now,
    );
    inserted += await this.seedQueue(
      em,
      AUDIO_QUEUE_ID,
      AUDIO_GENERATION_QUEUE,
      'Audio asset generation',
      AUDIO_DLQ_ID,
      now,
    );
    for (const template of AUDIO_TEMPLATES)
      inserted += await this.seedTemplate(em, template, now);
    await em.flush();
    if (inserted > 0)
      this.logger.info({ inserted }, 'Audio asset boot seed materialized');
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
    em.create(
      MessageQueues,
      {
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
      },
      { partial: true },
    );
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
    em.create(
      AudioTemplates,
      {
        id: deterministicId(
          `seed:audio-template:${seed.templateKey}:v${seed.version}`,
        ),
        ...seed,
        enabled: true,
        metadata: { source: 'boot-seed' },
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }
}
