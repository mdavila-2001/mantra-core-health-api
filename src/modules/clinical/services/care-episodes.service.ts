import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { CareEpisodesRepository } from '../repositories';
import { CreateCareEpisodeDto, CareEpisodeResponseDto } from '../dto';
import { CLIN } from '../clinical.concepts';

/**
 * UC-08-01: apertura de episodios de cuidado. Un episodio agrupa los encuentros
 * de un paciente en torno a un problema/estancia. Se impide abrir dos episodios
 * activos para el mismo paciente en el mismo tenant.
 */
@Injectable()
export class CareEpisodesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param episodesRepo - Valor de episodes repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareEpisodesService.name);
  }

  /** UC-08-01: abre un episodio de cuidado activo. */
  async open(
    dto: CreateCareEpisodeDto,
    actor: AuthenticatedUser,
  ): Promise<CareEpisodeResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.care-episode.open',
        patientProfileId: dto.patientProfileId,
      },
      'Opening care episode',
    );
    return this.em.transactional(async (tx) => {
      const active = await this.episodesRepo.findActiveByPatient(
        tx,
        dto.tenantId,
        dto.patientProfileId,
      );
      if (active) {
        this.logger.warn(
          { operation: 'clinical.care-episode.open', reason: 'active-exists' },
          'Rejected: patient already has an active episode',
        );
        throw new ConflictException('El paciente ya tiene un episodio activo', {
          patientProfileId: dto.patientProfileId,
        });
      }

      const episode = this.episodesRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId,
        responsiblePractitionerId: dto.responsiblePractitionerId,
        typeConceptId: dto.typeConceptId,
        statusConceptId: CLIN.EPISODE_ACTIVE,
        startAt: dto.startAt ? new Date(dto.startAt) : new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.care-episode.open', episodeId: episode.id },
        'Care episode opened',
      );
      return {
        id: episode.id,
        patientProfileId: episode.patientProfileId,
        tenantId: episode.tenantId,
        status: episode.statusConceptId,
        startAt: episode.startAt ?? null,
        createdAt: episode.createdAt,
      };
    });
  }
}
