import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /iam/auth/login` (UC-01-04). */
export class LoginDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  password!: string;

  @ApiPropertyOptional({ description: 'Código MFA de un solo uso, si el usuario lo tiene activo' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mfaCode?: string;
}
