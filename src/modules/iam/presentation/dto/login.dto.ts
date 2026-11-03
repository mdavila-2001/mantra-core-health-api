import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Cuerpo de `POST /iam/auth/login` (UC-01-04).
 *
 * Admite dos identificadores porque conviven dos formas de alta: el personal y
 * los administradores se dan de alta por correo, y el paciente se auto-registra
 * con su documento de identidad. Se aporta uno u otro: el `external_subject` de
 * la credencial es un único valor, y aceptar ambos obligaría a decidir cuál gana
 * —una regla implícita que acabaría sorprendiendo a alguien.
 */
export class LoginDto {
  /**
   * Correo de la cuenta (alta por correo).
   */
  @ApiPropertyOptional({ format: 'email' })
  // Exigido —y validado como correo— sólo cuando no se aporta documento.
  @ValidateIf((dto: LoginDto) => dto.nationalId === undefined)
  @IsEmail()
  @MaxLength(320)
  email?: string;

  /**
   * Documento de identidad (cuentas de paciente auto-registradas).
   */
  @ApiPropertyOptional({ description: 'Documento de identidad (CI)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nationalId?: string;

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
