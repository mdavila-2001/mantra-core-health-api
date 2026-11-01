import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-04 · Verificación de órdenes
// ---------------------------------------------------------------------------

/** Papel de la orden preoperatoria. */
export type PreopOrderRole = 'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION';
export const PREOP_ORDER_ROLES = [
  'LAB',
  'IMAGING',
  'CONSULT',
  'MEDICATION',
] as const;

/**
 * Cuerpo de `POST /procedure-cases/{id}/preoperative-orders` (UC-53-04).
 */
export class CreatePreoperativeOrderDto {
  /**
   * Identificador asociado a service request.
   *
   * Alternativa a `serviceRequestCodeConceptId`: hay que indicar uno de los dos.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Orden clínica ya existente',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /**
   * Código de la orden clínica, cuando todavía no existe.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Código de la orden clínica a registrar si aún no existe',
  })
  @IsOptional()
  @IsUUID()
  serviceRequestCodeConceptId?: string;

  /**
   * Valor de order role mantenido por la instancia.
   */
  @ApiProperty({ enum: PREOP_ORDER_ROLES })
  @IsIn(PREOP_ORDER_ROLES)
  orderRole!: PreopOrderRole;

  /**
   * Valor de mandatory mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description:
      'Si es obligatoria antes de la cirugía; una pendiente impide que el caso quede listo',
  })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;
}

/** Respuesta del alta de una orden preoperatoria. */
export class PreoperativeOrderResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a service request.
   */
  @ApiProperty({ format: 'uuid' })
  serviceRequestId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/preoperative-orders/verify` (UC-53-04). */
export class VerifyOrdersDto {
  /**
   * Valor de order ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Órdenes que se dan por verificadas',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  orderIds!: string[];

  /**
   * Identificador asociado a verified by profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Profesional que verifica' })
  @IsUUID()
  verifiedByProfileId!: string;
}

/**
 * Define el contrato validado para verify orders response.
 */
export class VerifyOrdersResponseDto {
  /**
   * Identificador asociado a procedure case.
   */
  @ApiProperty({ format: 'uuid' })
  procedureCaseId!: string;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes que pasaron a verificadas' })
  verified!: number;

  /**
   * Valor de pending mandatory mantenido por la instancia.
   */
  @ApiProperty({ description: 'Órdenes obligatorias que siguen pendientes' })
  pendingMandatory!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda el caso',
  })
  statusConceptId!: string;
}
