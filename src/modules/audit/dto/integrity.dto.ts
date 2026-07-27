import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Cuerpo de `POST /audit/integrity/verify` (UC-10-06). */
export class VerifyIntegrityDto {
  @ApiPropertyOptional({
    description: 'Partición de tenant a verificar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Máximo de eslabones a recorrer',
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  limit?: number;
}

/** Resultado de la atestación de integridad. */
export class IntegrityReportDto {
  @ApiProperty({ description: 'true si la cadena está íntegra' })
  verified!: boolean;

  @ApiProperty({ description: 'Nº de eslabones verificados' })
  checkedCount!: number;

  @ApiProperty({
    description: 'Id del primer eslabón roto, si lo hay',
    nullable: true,
  })
  brokenAt!: string | null;

  @ApiProperty({ description: 'Id del evento de atestación registrado' })
  attestationId!: string;
}
