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
  @ApiProperty({ enum: OwnerType })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ enum: ContactSystem })
  @IsEnum(ContactSystem)
  system!: ContactSystem;

  @ApiProperty({ description: 'Correo o teléfono según el sistema.' })
  @IsString()
  @MaxLength(255)
  value!: string;

  @ApiPropertyOptional({ enum: ContactUse })
  @IsOptional()
  @IsEnum(ContactUse)
  use?: ContactUse;

  @ApiPropertyOptional({ minimum: 0, description: 'Orden de preferencia.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;
}

/** Cuerpo de `POST /common/contact-points/:id/verify`. */
export class VerifyContactPointDto {
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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ enum: OwnerType })
  ownerType!: OwnerType;

  @ApiProperty({ enum: ContactSystem })
  system!: ContactSystem;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  verified!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
