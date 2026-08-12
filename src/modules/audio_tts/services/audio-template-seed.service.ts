import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type { AudioTemplateRecord } from '../domain/audio.types';
import { AudioAssetsRepository } from '../repositories';

/**
 * Catálogo de arranque de plantillas de audio.
 *
 * Vive en código y no en un `.json` suelto por la misma razón que
 * `CONCEPT_DEFS` en `common/constants/concepts.ts`: es un dato estructural del
 * que dependen los flujos, así que el compilador tiene que poder comprobar su
 * forma y una revisión tiene que poder verlo en el diff.
 *
 * El orden importa: la plantilla de degradación va primero porque las otras la
 * referencian por clave ajena.
 */
export const AUDIO_BOOT_TEMPLATES: readonly AudioTemplateRecord[] = [
  {
    code: 'onboarding.fallback.generic',
    version: 1,
    strategy: 'FALLBACK',
    templateText: 'Bienvenido. Estamos listos para comenzar.',
    language: 'es-419',
    isActive: true,
  },
  {
    code: 'onboarding.welcome.generic',
    version: 1,
    strategy: 'STATIC',
    templateText: 'Bienvenido. Estamos listos para comenzar.',
    language: 'es-419',
    fallbackTemplateCode: 'onboarding.fallback.generic',
    isActive: true,
  },
  {
    code: 'onboarding.welcome.named',
    version: 1,
    strategy: 'DYNAMIC',
    templateText: 'Bienvenido, {{name}}. Estamos listos para comenzar.',
    language: 'es-419',
    fallbackTemplateCode: 'onboarding.fallback.generic',
    isActive: true,
  },
];

/**
 * Siembra el catálogo de plantillas en el arranque.
 *
 * Es idempotente (`ON CONFLICT DO UPDATE`) y **no genera audio**: sembrar es un
 * paso de despliegue, y hacer que un despliegue llame a un servicio externo de
 * pago por uso mezcla dos cosas que deben poder fallar por separado. El audio se
 * pre-genera después, con `POST /audio-tts/prewarm`, cuando quien despliega decide
 * gastar cuota.
 *
 * Corre en `OnApplicationBootstrap` —igual que `SeedBootstrapService`— para que el
 * esquema ya esté materializado por `SchemaBootstrapService`.
 */
@Injectable()
export class AudioTemplateSeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly em: EntityManager,
    private readonly assets: AudioAssetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioTemplateSeedService.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.seedTemplates) {
      this.logger.info(
        'AUDIO_TTS_SEED_TEMPLATES=false: el catálogo de plantillas de audio no se toca',
      );
      return;
    }
    await this.seed();
  }

  /**
   * Aplica el catálogo.
   *
   * Separado del gancho de ciclo de vida para poder invocarlo desde una prueba de
   * integración sin depender del arranque de Nest.
   */
  async seed(): Promise<number> {
    // Se usa un `EntityManager` bifurcado: el global es de larga vida y compartirlo
    // con el resto del arranque haría que este seed dejara entidades gestionadas en
    // su unidad de trabajo.
    const em = this.em.fork();
    for (const template of AUDIO_BOOT_TEMPLATES) {
      await this.assets.upsertTemplate(em, template);
    }
    this.logger.info(
      `Catálogo de plantillas de audio al día: ${AUDIO_BOOT_TEMPLATES.length} plantillas`,
    );
    return AUDIO_BOOT_TEMPLATES.length;
  }
}
