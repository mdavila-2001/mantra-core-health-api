import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSettings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un ajuste de práctica. */
export interface CreateSettingData {
  practiceId: string;
  settingKey: string;
  valueJson: unknown;
  categoryConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `practice.practice_settings` (stateless). Soporta upsert. */
@Injectable()
export class PracticeSettingsRepository {
  findByPracticeAndKey(
    em: EntityManager,
    practiceId: string,
    settingKey: string,
  ): Promise<PracticeSettings | null> {
    return em.findOne(PracticeSettings, { practiceId, settingKey });
  }

  create(em: EntityManager, data: CreateSettingData): PracticeSettings {
    return em.create(
      PracticeSettings,
      {
        practiceId: data.practiceId,
        settingKey: data.settingKey,
        valueJson: data.valueJson,
        categoryConceptId: data.categoryConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
