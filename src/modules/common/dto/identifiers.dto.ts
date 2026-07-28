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
  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({
    enum: OwnerType,
    description: 'Tipo de propietario polimórfico.',
  })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid', description: 'Id del propietario (no FK).' })
  @IsUUID()
  ownerId!: string;

  /**
   * Valor de type mantenido por la instancia.
   */
  @ApiProperty({ enum: IdentifierType })
  @IsEnum(IdentifierType)
  type!: IdentifierType;

  /**
   * Valor de system mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Sistema emisor (URI/OID) opcional.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  system?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Valor del identificador.' })
  @IsString()
  @MaxLength(255)
  value!: string;

  /**
   * Valor de use mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: IdentifierUse })
  @IsOptional()
  @IsEnum(IdentifierUse)
  use?: IdentifierUse;
}

/** Representación segura de un identificador. */
export class IdentifierResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  /**
   * Valor de type mantenido por la instancia.
   */
  @ApiProperty({ enum: IdentifierType })
  type!: IdentifierType;

  /**
   * Valor de system mantenido por la instancia.
   */
  @ApiPropertyOptional()
  system?: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty()
  value!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado lógico (siempre ACTIVE al crear).' })
  state!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
