import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Roles con los que puede arrancar un usuario recién creado. */
export type InitialRole = 'USER' | 'SECURITY_ADMIN';

/** Cuerpo de `POST /iam/users` (UC-01-01). */
export class CreateUserDto {
  @ApiProperty({ description: 'Nombre visible del usuario', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiProperty({
    description: 'Email que actúa como identidad de login',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: 'Contraseña en claro (se persiste solo su hash argon2id)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    description: 'Rol inicial',
    enum: ['USER', 'SECURITY_ADMIN'],
  })
  @IsOptional()
  @IsIn(['USER', 'SECURITY_ADMIN'])
  initialRole?: InitialRole;
}
