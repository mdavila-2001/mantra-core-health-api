import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /iam/auth/login` (UC-01-04). */
export class LoginDto {
  /**
   * Valor de email mantenido por la instancia.
   */
  @ApiProperty({ format: 'email' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Valor de password mantenido por la instancia.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  password!: string;

  /**
   * Valor de mfa code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Código MFA de un solo uso, si el usuario lo tiene activo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mfaCode?: string;
}
