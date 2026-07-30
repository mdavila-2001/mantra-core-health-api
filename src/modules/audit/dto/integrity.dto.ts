import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Cuerpo de `POST /audit/integrity/verify` (UC-10-06). */
@ApiSchema({ name: 'AuditVerifyIntegrityDto' })
export class VerifyIntegrityDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Partición de tenant a verificar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
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
  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la cadena está íntegra' })
  verified!: boolean;

  /**
   * Valor de checked count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de eslabones verificados' })
  checkedCount!: number;

  /**
   * Valor de broken at mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Id del primer eslabón roto, si lo hay',
    nullable: true,
  })
  brokenAt!: string | null;

  /**
   * Identificador asociado a attestation.
   */
  @ApiProperty({ description: 'Id del evento de atestación registrado' })
  attestationId!: string;
}
