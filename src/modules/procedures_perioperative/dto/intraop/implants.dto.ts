import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LATERALITIES, type Laterality } from '../common';

// ---------------------------------------------------------------------------
// UC-53-09 · Implantes
// ---------------------------------------------------------------------------

/** Papel del implante en la intervención. */
export type ImplantRole = 'PRIMARY' | 'ADJUNCT';
export const IMPLANT_ROLES = ['PRIMARY', 'ADJUNCT'] as const;

/** Tipo de identificador del implante. */
export type ImplantIdentifierType = 'UDI_DI' | 'UDI_PI' | 'SERIAL';
export const IMPLANT_IDENTIFIER_TYPES = ['UDI_DI', 'UDI_PI', 'SERIAL'] as const;

/**
 * Define el contrato validado para implant identifier.
 */
export class ImplantIdentifierDto {
  /**
   * Valor de identifier type mantenido por la instancia.
   */
  @ApiProperty({ enum: IMPLANT_IDENTIFIER_TYPES })
  @IsIn(IMPLANT_IDENTIFIER_TYPES)
  identifierType!: ImplantIdentifierType;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del identificador', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  identifierValue!: string;

  /**
   * Valor de issuing system mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sistema emisor', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuingSystem?: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  /**
   * Valor de expiration date mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  expirationDate?: string;
}

/** Cuerpo de `POST /procedure-cases/{id}/implants` (UC-53-09). */
export class RecordImplantDto {
  /**
   * Identificador asociado a procedure.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  procedureId!: string;

  /**
   * Identificador asociado a implant device.
   */
  @ApiProperty({ format: 'uuid', description: 'Dispositivo implantado' })
  @IsUUID()
  implantDeviceId!: string;

  /**
   * Valor de implant role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['PRIMARY', 'ADJUNCT'] })
  @IsIn(['PRIMARY', 'ADJUNCT'])
  implantRole!: ImplantRole;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Valor de laterality mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: LATERALITIES })
  @IsOptional()
  @IsIn(LATERALITIES)
  laterality?: Laterality;

  /**
   * Valor de identifiers mantenido por la instancia.
   */
  @ApiProperty({
    type: [ImplantIdentifierDto],
    description: 'Identificadores de trazabilidad, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImplantIdentifierDto)
  identifiers!: ImplantIdentifierDto[];

  /**
   * Valor de udi carrier mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Portador UDI leído del envase',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  udiCarrier?: string;
}

/**
 * Define el contrato validado para implant response.
 */
export class ImplantResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de identifier ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  identifierIds!: string[];

  /**
   * Identificador asociado a device use.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Registro del dispositivo usado',
  })
  deviceUseId!: string;
}
