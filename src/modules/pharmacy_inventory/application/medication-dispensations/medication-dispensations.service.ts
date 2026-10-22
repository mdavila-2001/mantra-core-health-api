import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateDispensationDto,
  ReverseDispensationDto,
  MovementResponseDto,
  StatusResultDto,
} from '../../presentation/dto';
import { DispenseMedicationUseCase } from './dispense-medication.use-case';
import { ReverseMedicationDispensationUseCase } from './reverse-medication-dispensation.use-case';

/** Fachada pública de dispensación y reversión. */
@Injectable()
export class MedicationDispensationsService {
  constructor(
    private readonly dispenseMedication: DispenseMedicationUseCase,
    private readonly reverseMedication: ReverseMedicationDispensationUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(MedicationDispensationsService.name);
  }

  dispense(
    pharmacyId: string,
    dto: CreateDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<MovementResponseDto> {
    return this.dispenseMedication.execute(pharmacyId, dto, actor);
  }

  reverse(
    id: string,
    dto: ReverseDispensationDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.reverseMedication.execute(id, dto, actor);
  }
}
