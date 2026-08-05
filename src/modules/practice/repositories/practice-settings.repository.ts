import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSettings } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un ajuste de práctica. */
export interface CreateSettingData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de setting key mantenido por la instancia.
   */
  settingKey: string;
  /**
   * Valor de value json mantenido por la instancia.
   */
  valueJson: unknown;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.practice_settings` (stateless). Soporta upsert. */
@Injectable()
export class PracticeSettingsRepository {
  /**
   * Obtiene find by practice and key.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param settingKey - Valor de setting key requerido por la operación.
   * @returns Resultado de find by practice and key conforme al contrato `Promise<PracticeSettings | null>`.
   */
  findByPracticeAndKey(
    em: EntityManager,
    practiceId: string,
    settingKey: string,
  ): Promise<PracticeSettings | null> {
    return em.findOne(PracticeSettings, { practiceId, settingKey });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PracticeSettings`.
   */
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
