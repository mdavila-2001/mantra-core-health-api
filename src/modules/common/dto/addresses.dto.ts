import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ContactUse, OwnerType } from './enums';

/** Cuerpo de `POST /common/addresses`. */
export class CreateAddressDto {
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ type: [String], description: 'Líneas de la dirección.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  lines!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @ApiPropertyOptional({ description: "Código de país ISO. Por defecto 'PE'." })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ enum: ContactUse })
  @IsOptional()
  @IsEnum(ContactUse)
  use?: ContactUse;
}

/** Representación segura de una dirección. */
export class AddressResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  @ApiProperty({ type: [String] })
  lines!: string[];

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty({ description: 'Código de país.' })
  country!: string;

  @ApiProperty()
  createdAt!: Date;
}
