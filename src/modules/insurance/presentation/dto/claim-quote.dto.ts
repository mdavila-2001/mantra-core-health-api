import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimLineDto } from './claims.dto';

/**
 * Estado de la aprobación previa de una línea cotizada.
 *
 * `NOT_REQUIRED` si el beneficio no la exige; los demás valores dicen por qué
 * la que se mandó (o la que falta) no alcanza.
 */
export const PRIOR_AUTHORIZATION_QUOTE_STATUSES = [
  'NOT_REQUIRED',
  'APPROVED',
  'MISSING',
  'PENDING',
  'DENIED',
  'EXPIRED',
  'MISMATCH',
  'AMOUNT_EXCEEDED',
] as const;

/**
 * Cotización previa de un cobro a la aseguradora (carril 16, REQ-16-026).
 *
 * Es el mismo cuerpo del reclamo directo, sin lo que sólo sirve para persistir
 * (identificador del reclamo, clave de idempotencia, prestador facturador). La
 * parte del paciente que traiga cada línea se ignora: la cotización la calcula
 * el servidor.
 */
export class ClaimQuoteDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Aprobación previa que se piensa vincular al cobro',
  })
  @IsOptional()
  @IsUUID()
  priorAuthorizationRequestId?: string;

  @ApiProperty({
    type: [ClaimLineDto],
    description:
      '1..N líneas. `patientResponsibilityAmount` se ignora: lo calcula el servidor.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClaimLineDto)
  lines!: ClaimLineDto[];
}

/** Una línea cotizada: lo que el plan decide y, si no, por qué no. */
export class ClaimQuoteLineResultDto {
  @ApiProperty({ example: 1 })
  lineSequence!: number;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceConceptId!: string | null;

  @ApiProperty({ example: '500.00' })
  billedAmount!: string;

  @ApiProperty({
    description:
      'El plan cubre el servicio y el reparto se pudo calcular. No implica que el cobro se pueda enviar: mire `reason`.',
  })
  covered!: boolean;

  @ApiPropertyOptional({ example: '80', nullable: true })
  coveragePercent!: string | null;

  @ApiPropertyOptional({ example: '50.00', nullable: true })
  copayAmount!: string | null;

  @ApiPropertyOptional({
    example: '25.00',
    nullable: true,
    description:
      'Informativo: el deducible todavía no se aplica al reparto (decisión del propietario).',
  })
  deductibleAmount!: string | null;

  @ApiProperty()
  requiresPriorAuthorization!: boolean;

  @ApiPropertyOptional({
    enum: PRIOR_AUTHORIZATION_QUOTE_STATUSES,
    nullable: true,
    description: '`null` si el servicio no tiene beneficio vigente.',
  })
  priorAuthorizationStatus!: string | null;

  @ApiPropertyOptional({ example: '140.00', nullable: true })
  patientAmount!: string | null;

  @ApiPropertyOptional({ example: '360.00', nullable: true })
  insurerAmount!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Motivo tipificado por el que esta línea no se podría cobrar (por ejemplo `PRIOR_AUTHORIZATION_REQUIRED`).',
  })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  message!: string | null;
}

/** Resultado de la cotización previa: sin efectos, nada se guardó. */
export class ClaimQuoteResultDto {
  @ApiProperty({
    description:
      'Todas las líneas se podrían enviar hoy. Si es `false`, el botón «Enviar a la aseguradora» debe quedar deshabilitado y explicar el motivo.',
  })
  canSubmit!: boolean;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currencyConceptId!: string | null;

  @ApiPropertyOptional({
    example: '500.00',
    nullable: true,
    description: '`null` si algún monto no es un decimal válido.',
  })
  totalBilledAmount!: string | null;

  @ApiPropertyOptional({
    example: '140.00',
    nullable: true,
    description: '`null` mientras alguna línea no tenga reparto calculable.',
  })
  totalPatientAmount!: string | null;

  @ApiPropertyOptional({ example: '360.00', nullable: true })
  totalInsurerAmount!: string | null;

  @ApiProperty({ type: [ClaimQuoteLineResultDto] })
  lines!: ClaimQuoteLineResultDto[];
}
