import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Roles con los que puede arrancar un usuario recién creado. */
export type InitialRole = 'USER' | 'SECURITY_ADMIN';

/** Cuerpo de `POST /iam/users` (UC-01-01). */
export class CreateUserDto {
  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre visible del usuario', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Valor de email mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Email que actúa como identidad de login',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Valor de password mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Contraseña en claro (se persiste solo su hash argon2id)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Teléfono de contacto del usuario. Se persiste como punto de contacto
   * (`common.contact_points`) porque `iam.users` no tiene columna de teléfono:
   * sólo guarda si está verificado.
   */
  @ApiPropertyOptional({
    description: 'Teléfono de contacto en formato E.164 o nacional',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[+]?[0-9 ()-]{6,}$/, {
    message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion',
  })
  phone?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Valor de initial role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rol inicial',
    enum: ['USER', 'SECURITY_ADMIN'],
  })
  @IsOptional()
  @IsIn(['USER', 'SECURITY_ADMIN'])
  initialRole?: InitialRole;
}
