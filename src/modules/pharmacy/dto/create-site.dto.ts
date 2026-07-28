import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /pharmacies/{pharmacyId}/sites` (UC-24-02). */
export class CreateSiteDto {
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty({
    description: 'Sede física (practice.practice_sites)',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de sede por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la sede', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  /**
   * Identificador asociado a pharmacy site type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de sede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteTypeConceptId?: string;

  /**
   * Identificador asociado a dispensing mode concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del modo de dispensación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dispensingModeConceptId?: string;

  /**
   * Identificador asociado a controlled substance capability concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de capacidad de sustancias controladas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  controlledSubstanceCapabilityConceptId?: string;

  /**
   * Valor de home delivery available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ofrece entrega a domicilio' })
  @IsOptional()
  @IsBoolean()
  homeDeliveryAvailable?: boolean;

  /**
   * Valor de pickup available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ofrece retiro en tienda' })
  @IsOptional()
  @IsBoolean()
  pickupAvailable?: boolean;
}
