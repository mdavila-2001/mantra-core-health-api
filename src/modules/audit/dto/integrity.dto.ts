import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
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
    description:
      'Modo diagnóstico acotado: máximo de eslabones a recorrer. Si se omite, ' +
      'se verifica la partición completa. Un límite menor al total devuelve un ' +
      'resultado parcial (`complete: false`) sin atestación positiva. Debe ser ' +
      'un entero entre 1 y 100000 (`400 AUDIT_INTEGRITY_RANGE_INVALID`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

/** Resultado de la atestación de integridad. */
export class IntegrityReportDto {
  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true sólo si se recorrió la partición completa y está íntegra. Un ' +
      'resultado parcial nunca es `verified`.',
  })
  verified!: boolean;

  /**
   * Indica si se examinó toda la partición.
   */
  @ApiProperty({
    description:
      'true si se examinaron todos los eslabones de la partición; false si el ' +
      'límite de diagnóstico dejó eslabones sin examinar',
  })
  complete!: boolean;

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
  @ApiProperty({
    description:
      'Id del evento de atestación registrado. null cuando el resultado es ' +
      'parcial e íntegro: no se emite atestación positiva',
    nullable: true,
  })
  attestationId!: string | null;
}
