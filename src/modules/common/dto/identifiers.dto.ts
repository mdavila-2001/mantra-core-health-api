import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IdentifierType, IdentifierUse, OwnerType } from './enums';

/** Cuerpo de `POST /common/identifiers`. */
export class CreateIdentifierDto {
  @ApiProperty({ enum: OwnerType, description: 'Tipo de propietario polimórfico.' })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiProperty({ format: 'uuid', description: 'Id del propietario (no FK).' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ enum: IdentifierType })
  @IsEnum(IdentifierType)
  type!: IdentifierType;

  @ApiPropertyOptional({ description: 'Sistema emisor (URI/OID) opcional.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  system?: string;

  @ApiProperty({ description: 'Valor del identificador.' })
  @IsString()
  @MaxLength(255)
  value!: string;

  @ApiPropertyOptional({ enum: IdentifierUse })
  @IsOptional()
  @IsEnum(IdentifierUse)
  use?: IdentifierUse;
}

/** Representación segura de un identificador. */
export class IdentifierResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  @ApiProperty({ enum: IdentifierType })
  type!: IdentifierType;

  @ApiPropertyOptional()
  system?: string;

  @ApiProperty()
  value!: string;

  @ApiProperty({ description: 'Estado lógico (siempre ACTIVE al crear).' })
  state!: string;

  @ApiProperty()
  createdAt!: Date;
}
