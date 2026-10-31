import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /me/support-access-requests`: la persona de apoyo pide ver la
 * historia clínica de un paciente por un rato. Quien decide es el doctor.
 */
export class CreateSupportAccessRequestDto {
  /** Organización en la que trabaja con ese doctor. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /** Doctor que decide (el titular de la delegación). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practitionerProfileId!: string;

  /** Paciente cuya historia pide ver. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /** Encuentro concreto, si el pedido es sobre una consulta. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /** Para qué lo necesita: el doctor lo lee antes de decidir. */
  @ApiProperty({ minLength: 5, maxLength: 1000 })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reasonText!: string;
}
