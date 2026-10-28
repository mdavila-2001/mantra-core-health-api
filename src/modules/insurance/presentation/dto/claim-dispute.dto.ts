import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateDisputeDto } from './claims.dto';

/** Motivos cerrados por los que un paciente objeta un cobro. */
export const PATIENT_OBJECTION_REASONS = [
  'AMOUNT_DIFFERS',
  'SERVICE_NOT_RECEIVED',
  'NOT_INFORMED',
] as const;

export type PatientObjectionReason = (typeof PATIENT_OBJECTION_REASONS)[number];

/**
 * Disputa de un reclamo: apelación del prestador u objeción del paciente
 * (carril 16, REQ-16-032).
 *
 * Es el cuerpo de siempre más un motivo cerrado opcional. El motivo sólo lo
 * usa la rama del paciente. **No hay texto libre** a propósito: lo que escriba
 * una persona podría ser un dato de salud y viajaría a eventos y bitácoras; el
 * motivo cerrado deja el registro completo sin ese riesgo.
 */
export class ClaimDisputeDto extends CreateDisputeDto {
  @ApiPropertyOptional({
    enum: PATIENT_OBJECTION_REASONS,
    description:
      'Motivo de la objeción del paciente. Por defecto, NOT_INFORMED. Lo ignora la apelación del prestador.',
  })
  @IsOptional()
  @IsIn(PATIENT_OBJECTION_REASONS)
  objectionReason?: PatientObjectionReason;
}
