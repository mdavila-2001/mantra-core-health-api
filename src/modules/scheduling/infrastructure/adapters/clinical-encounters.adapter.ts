import { Injectable } from '@nestjs/common';
import { EncountersRepository } from '../../../clinical/repositories';
import type {
  ClinicalEncountersPort,
  EncounterRef,
  NewEncounter,
  NewEncounterParticipant,
} from '../../application/ports/clinical-encounters.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa los encuentros clínicos sobre el repositorio de `clinical`. */
@Injectable()
export class ClinicalEncountersAdapter implements ClinicalEncountersPort {
  constructor(private readonly encounters: EncountersRepository) {}

  open(uow: UnitOfWork, data: NewEncounter): EncounterRef {
    return this.encounters.create(uow, data);
  }

  addParticipant(uow: UnitOfWork, data: NewEncounterParticipant): void {
    this.encounters.createParticipant(uow, data);
  }
}
