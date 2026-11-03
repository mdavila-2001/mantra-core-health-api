import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

/** Cuerpo de `POST /profiles/persons/{personId}/decease` (UC-05-12). */
export class DeceasePersonDto {
  /**
   * Valor de deceased at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Momento de defunción (ISO date-time)',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  deceasedAt?: string;

  /**
   * Valor de anonymize mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Anonimiza la PII (borrado lógico del display_name) al registrar',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  anonymize?: boolean;
}

/** Respuesta de registro de defunción. */
export class DeceaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de vital status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Concept id del estado vital', format: 'uuid' })
  vitalStatus!: string;

  /**
   * Valor de person status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de la persona',
    format: 'uuid',
  })
  personStatus!: string;

  /**
   * Valor de deceased at mantenido por la instancia.
   */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  deceasedAt?: Date;

  /**
   * Valor de revoked account links mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de vínculos de cuenta revocados' })
  revokedAccountLinks!: number;

  /**
   * Valor de revoked proxies mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de proxies de portal revocados' })
  revokedProxies!: number;
}
