import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

/** Alta manual de un sello, sólo para `SECURITY_ADMIN`. */
export class GrantBadgeDto {
  @ApiProperty({
    description: 'Sujeto de dominio (profesional, institución)',
    format: 'uuid',
  })
  @IsUUID()
  targetId!: string;

  @ApiPropertyOptional({
    description:
      'Referencia a la evidencia que justifica el alta manual. Se guarda en ' +
      'el sello y queda en auditoría: es lo que hace revisable la escotilla.',
  })
  @IsOptional()
  @IsString()
  evidenceRef?: string;

  @ApiPropertyOptional({
    description: 'Hasta cuándo vale el sello (ISO). Sin esto no vence solo.',
  })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/** Resultado del alta de un sello. */
export class GrantBadgeResponseDto {
  @ApiProperty({
    enum: ['granted', 'renewed', 'no-profile'],
    description: '`no-profile` si el sujeto no tiene vitrina pública',
  })
  action!: 'granted' | 'renewed' | 'no-profile';
}

/** Baja manual de los sellos de un sujeto. */
export class RevokeBadgeDto {
  @ApiPropertyOptional({
    enum: ['REVOKED', 'EXPIRED'],
    default: 'REVOKED',
    description:
      '`REVOKED` = la autoridad retiró el respaldo; `EXPIRED` = sólo venció. ' +
      'No significan lo mismo y la pantalla los muestra distinto.',
  })
  @IsOptional()
  @IsIn(['REVOKED', 'EXPIRED'])
  reason?: 'REVOKED' | 'EXPIRED';
}

/** Resultado del barrido de sellos vencidos. */
export class BadgeSweepResponseDto {
  @ApiProperty({ description: 'Sellos que cayeron' })
  expired!: number;

  @ApiProperty({ description: 'Perfiles que dejaron de estar verificados' })
  profiles!: number;
}
