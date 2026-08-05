import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  TENANT_TYPE_CODES,
  type TenantTypeCode,
} from '../../directory/directory.concepts';
import { BrokerProfileDto, PayerProfileDto } from '../../directory/dto';

/** Datos de la organización que se está dando de alta a sí misma. */
export class RegisterOrganizationDetailsDto {
  /**
   * Código único global con el que se identifica al tenant.
   */
  @ApiProperty({
    description: 'Código único global de la organización',
    maxLength: 100,
    example: 'CLINICA_SAN_RAFAEL',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  // Mismo criterio que el documento de identidad en el registro de pacientes:
  // el código viaja en URLs y logs, así que no admite espacios ni control.
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo',
  })
  code!: string;

  /**
   * Razón social con la que la organización está inscrita.
   */
  @ApiProperty({ description: 'Razón social / nombre legal', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Nombre comercial, si difiere de la razón social.
   */
  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  /**
   * Tipo de organización: prestador, aseguradora, corredor, universidad,
   * farmacia, institución de salud o negocio de salud.
   */
  @ApiProperty({
    description:
      'Tipo de organización. Obligatorio: cada tipo exige sus propios datos. ' +
      'PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto ' +
      '—PROVIDER, UNIVERSITY, PHARMACY y las cuatro institucionales ' +
      '(HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y HEALTH_BUSINESS— ' +
      'exigen país y ' +
      'jurisdicción, que es lo que determina bajo qué regulador operan.',
    enum: TENANT_TYPE_CODES,
    example: 'HOSPITAL',
  })
  @IsIn(TENANT_TYPE_CODES)
  tenantType!: TenantTypeCode;

  /**
   * Datos de aseguradora. Obligatorio cuando `tenantType` es `PAYER`.
   */
  @ApiPropertyOptional({ type: PayerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayerProfileDto)
  payer?: PayerProfileDto;

  /**
   * Datos de corredor. Obligatorio cuando `tenantType` es `BROKER`.
   */
  @ApiPropertyOptional({ type: BrokerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrokerProfileDto)
  broker?: BrokerProfileDto;

  /**
   * País de la organización. Obligatorio para `PROVIDER`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Jurisdicción de la organización. Obligatoria para `PROVIDER`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Zona horaria IANA en la que opera.
   */
  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    maxLength: 100,
    example: 'America/La_Paz',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/** Datos de la persona que queda como owner de la organización. */
export class RegisterOrganizationOwnerDto {
  /**
   * Correo con el que el owner iniciará sesión.
   */
  @ApiProperty({
    description: 'Correo con el que el owner iniciará sesión',
    format: 'email',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /**
   * Contraseña definitiva: el titular está presente, no hay token de activación.
   */
  @ApiProperty({ minLength: 8, maxLength: 200 })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  /**
   * Nombre para mostrar del owner.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  /**
   * Zona horaria del owner; por defecto la de la organización.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}

/**
 * Cuerpo de `POST /iam/auth/register-organization`.
 *
 * Registro en un solo paso: la organización y la cuenta de quien la dirige nacen
 * juntas. Separarlo obligaría a que alguien creara antes el usuario, que es
 * justo lo que impedía que una organización se diera de alta a sí misma.
 */
export class RegisterOrganizationDto {
  /**
   * Datos de la organización.
   */
  @ApiProperty({ type: RegisterOrganizationDetailsDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationDetailsDto)
  organization!: RegisterOrganizationDetailsDto;

  /**
   * Datos del owner inicial.
   */
  @ApiProperty({ type: RegisterOrganizationOwnerDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => RegisterOrganizationOwnerDto)
  owner!: RegisterOrganizationOwnerDto;
}

/** Resultado del auto-registro de una organización. */
export class RegisterOrganizationResponseDto {
  /**
   * Identificador del tenant creado.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Código único de la organización, tal como quedó persistido.
   */
  @ApiProperty({ example: 'CLINICA_SAN_RAFAEL' })
  code!: string;

  /**
   * Identificador de la cuenta owner creada.
   */
  @ApiProperty({ format: 'uuid' })
  ownerUserId!: string;

  /**
   * Identificador de la membresía OWNER que vincula cuenta y organización.
   */
  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  /**
   * Estado del tenant: nace pendiente de verificación por la plataforma.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del tenant (pendiente de verificación)',
  })
  status!: string;

  /**
   * Si el correo de verificación quedó encolado. No condiciona el acceso.
   */
  @ApiProperty({
    description: 'Si se pudo encolar el correo de verificación',
  })
  emailVerificationSent!: boolean;
}
