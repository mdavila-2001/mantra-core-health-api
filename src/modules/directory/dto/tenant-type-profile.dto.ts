import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Datos que identifican a una aseguradora (`PAYER`).
 *
 * Se exigen porque una aseguradora sin su código ni su identificador ante el
 * regulador no es contrastable: `insurance.insurance_carriers` los necesita para
 * existir y todo el flujo de siniestros cuelga de esa fila.
 */
export class PayerProfileDto {
  /**
   * Código interno de la aseguradora dentro de la plataforma.
   */
  @ApiProperty({ description: 'Código de la aseguradora', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  carrierCode!: string;

  /**
   * Identificador ante el regulador de seguros (registro, matrícula, NIT).
   */
  @ApiProperty({
    description: 'Identificador ante el regulador de seguros',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  regulatorIdentifier!: string;

  /**
   * Jurisdicción en la que está autorizada a operar.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}

/**
 * Datos que identifican a un corredor de seguros (`BROKER`).
 *
 * Un corredor sin número de licencia no es un corredor: es la credencial que lo
 * habilita a intermediar, y `insurance.insurance_brokers` es la fila de la que
 * cuelgan sus acuerdos con aseguradoras y sus comisiones.
 */
export class BrokerProfileDto {
  /**
   * Código interno del corredor dentro de la plataforma.
   */
  @ApiProperty({ description: 'Código del corredor', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  brokerCode!: string;

  /**
   * Número de licencia de intermediación.
   */
  @ApiProperty({
    description: 'Número de licencia de intermediación',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber!: string;

  /**
   * Jurisdicción que emitió la licencia.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;
}
