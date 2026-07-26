import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException, touch, type AuthenticatedUser } from '../../../common';
import { PRAC } from '../practice.concepts';
import { PracticesRepository, PracticeSettingsRepository } from '../repositories';
import { UpsertSettingDto, SettingResponseDto } from '../dto';

/** UC-14-07: configura (upsert) un ajuste de práctica por (practice_id, setting_key). */
@Injectable()
export class PracticeSettingsService {
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly settingsRepo: PracticeSettingsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeSettingsService.name);
  }

  /** Inserta el ajuste si no existe, o actualiza su valor/categoría si ya existe. */
  async upsert(
    practiceId: string,
    settingKey: string,
    dto: UpsertSettingDto,
    actor: AuthenticatedUser,
  ): Promise<SettingResponseDto> {
    this.logger.info({ operation: 'practice.setting.upsert', practiceId, settingKey }, 'Upserting setting');
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice) throw new ResourceNotFoundException('Práctica no encontrada', { practiceId });

      const existing = await this.settingsRepo.findByPracticeAndKey(tx, practiceId, settingKey);
      if (existing) {
        existing.valueJson = dto.valueJson;
        existing.categoryConceptId = dto.categoryConceptId ?? existing.categoryConceptId;
        touch(existing, actor.id);
        await tx.flush();
        return { id: existing.id, practiceId, settingKey, created: false };
      }

      const setting = this.settingsRepo.create(tx, {
        practiceId,
        settingKey,
        valueJson: dto.valueJson,
        categoryConceptId: dto.categoryConceptId ?? PRAC.SETTING_CATEGORY_GENERAL,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: setting.id, practiceId, settingKey, created: true };
    });
  }
}
