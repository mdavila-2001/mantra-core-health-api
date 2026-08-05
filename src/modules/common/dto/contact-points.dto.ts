import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ContactSystem, ContactUse, OwnerType } from './enums';

/** Cuerpo de `POST /common/contact-points`. */
export class CreateContactPointDto {
  /**
   * Valor de owner type mantenido por la instancia.
   */
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  /**
   * Identificador asociado a owner.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  /**
   * Valor de system mantenido por la instancia.
   */
  @ApiProperty({ enum: ContactSystem })
  @IsEnum(ContactSystem)
  system!: ContactSystem;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Correo o teléfono según el sistema.' })
  @IsString()
  @MaxLength(255)
  value!: string;

  /**
   * Valor de use mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: ContactUse })
  @IsOptional()
  @IsEnum(ContactUse)
  use?: ContactUse;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0, description: 'Orden de preferencia.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;
}

/** Cuerpo de `POST /common/contact-points/:id/verify`. */
export class VerifyContactPointDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Código de verificación (OTP). En esta implementación se acepta cualquiera.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;
}

/** Representación segura de un punto de contacto. */
export class ContactPointResponseDto {
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
   * Valor de system mantenido por la instancia.
   */
  @ApiProperty({ enum: ContactSystem })
  system!: ContactSystem;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiProperty()
  value!: string;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty()
  verified!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
