import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDefined,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * La primera sede del centro, con la dirección y el punto que usa la
 * búsqueda por cercanía.
 *
 * Las coordenadas son obligatorias: un centro sin punto en el mapa no puede
 * ordenarse por distancia ni dibujarse, que es para lo que existe esta sede.
 */
export class CreateOrganizationPracticeSiteDto {
  /** Nombre de la sede, tal como lo va a ver el paciente. */
  @ApiProperty({ description: 'Nombre de la sede', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /** Dirección en una línea (calle, número, referencia). */
  @ApiProperty({
    description: 'Dirección en una línea',
    maxLength: 500,
    example: 'Av. San Martín 123',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  addressText!: string;

  /** Latitud del punto elegido en el mapa. */
  @ApiProperty({ minimum: -90, maximum: 90, example: -17.7833 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  /** Longitud del punto elegido en el mapa. */
  @ApiProperty({ minimum: -180, maximum: 180, example: -63.1821 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  /** Ciudad, en texto libre. */
  @ApiPropertyOptional({ maxLength: 255, example: 'Santa Cruz de la Sierra' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cityText?: string;
}

/**
 * Cuerpo de `POST /tenants/{tenantId}/practices` (CM-11).
 *
 * Una organización ya verificada abre su práctica con la primera sede: es el
 * paso que le falta a un centro médico dado de alta con
 * `POST /iam/auth/register-organization` para que el catálogo por sede y la
 * búsqueda tengan dónde colgar su oferta.
 */
export class CreateOrganizationPracticeDto {
  /** Nombre de la práctica (el centro médico). */
  @ApiProperty({ description: 'Nombre del centro médico', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  /** Primera sede de la práctica. */
  @ApiProperty({ type: CreateOrganizationPracticeSiteDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateOrganizationPracticeSiteDto)
  site!: CreateOrganizationPracticeSiteDto;
}

/** Respuesta de `POST /tenants/{tenantId}/practices`. */
export class OrganizationPracticeResponseDto {
  /** Identificador de la práctica creada. */
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  /** Identificador de su primera sede. */
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
}
