import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { CloseEncounterDto, EncounterResponseDto } from '../dto';
import { EncountersRepository } from '../repositories';
import {
  ENCOUNTER_CLOSED_PORT,
  type EncounterClosedPort,
} from '../ports/encounter-closed.port';
import { EncountersService } from './encounters.service';

/**
 * Cierre del encuentro (UC-08-14) y su consecuencia en la agenda: el turno que
 * el encuentro atendía pasa a completado, y con eso sale la encuesta al
 * paciente (`ENCOUNTER_CLOSED_PORT`).
 *
 * Envuelve a `EncountersService.close`, que no cambia: el aviso va después de
 * que el cierre terminó su trabajo y nunca lo deshace (el puerto no lanza).
 */
@Injectable()
export class EncounterCloseService {
  constructor(
    private readonly em: EntityManager,
    private readonly encounters: EncountersService,
    private readonly encountersRepo: EncountersRepository,
    @Inject(ENCOUNTER_CLOSED_PORT)
    private readonly encounterClosed: EncounterClosedPort,
  ) {}

  /** Cierra el encuentro y avisa a la agenda con su cita clínica. */
  async close(
    encounterId: string,
    dto: CloseEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    const closed = await this.encounters.close(encounterId, dto, actor);
    const encounter = await this.encountersRepo.findById(
      this.em.fork({ keepTransactionContext: true }),
      encounterId,
    );
    await this.encounterClosed.onEncounterClosed(
      { encounterId, appointmentId: encounter?.appointmentId },
      actor,
    );
    return closed;
  }
}
