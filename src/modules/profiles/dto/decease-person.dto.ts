import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

/** Cuerpo de `POST /profiles/persons/{personId}/decease` (UC-05-12). */
export class DeceasePersonDto {
  @ApiPropertyOptional({ description: 'Momento de defunción (ISO date-time)', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  deceasedAt?: string;

  @ApiPropertyOptional({
    description: 'Anonimiza la PII (borrado lógico del display_name) al registrar',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  anonymize?: boolean;
}

/** Respuesta de registro de defunción. */
export class DeceaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Concept id del estado vital', format: 'uuid' })
  vitalStatus!: string;

  @ApiProperty({ description: 'Concept id del estado de la persona', format: 'uuid' })
  personStatus!: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  deceasedAt?: Date;

  @ApiProperty({ description: 'Nº de vínculos de cuenta revocados' })
  revokedAccountLinks!: number;

  @ApiProperty({ description: 'Nº de proxies de portal revocados' })
  revokedProxies!: number;
}
