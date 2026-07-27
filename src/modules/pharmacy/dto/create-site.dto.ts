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
  @ApiProperty({
    description: 'Sede física (practice.practice_sites)',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  @ApiProperty({
    description: 'Código único de sede por farmacia',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre de la sede', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional({
    description: 'Concept id del tipo de sede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  pharmacySiteTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concept id del modo de dispensación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dispensingModeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Concept id de capacidad de sustancias controladas',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  controlledSubstanceCapabilityConceptId?: string;

  @ApiPropertyOptional({ description: 'Ofrece entrega a domicilio' })
  @IsOptional()
  @IsBoolean()
  homeDeliveryAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Ofrece retiro en tienda' })
  @IsOptional()
  @IsBoolean()
  pickupAvailable?: boolean;
}
