import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Tope del grupo sanguíneo declarado («O+», «AB−»). */
export const BLOOD_TYPE_MAX_LENGTH = 20;
/** Tope de cada sección de texto libre declarada. */
export const MEDICAL_ASPECT_TEXT_MAX_LENGTH = 2000;

/**
 * Cuerpo de `PUT /clinical/me/medical-aspects` (D-B, CL-04 / CV-01).
 *
 * Todos opcionales: **un campo ausente no se toca y `''` lo borra**. Es lo que
 * permite guardar una sección sin pisar las demás. Sin id de paciente: el
 * titular sale de la sesión.
 */
export class UpdateOwnMedicalAspectsDto {
  /** Grupo y factor, tal como la persona lo declara. */
  @ApiPropertyOptional({ maxLength: BLOOD_TYPE_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(BLOOD_TYPE_MAX_LENGTH)
  bloodType?: string;

  /** A qué dice ser alérgica. No reemplaza a las alergias registradas. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  allergiesText?: string;

  /** Enfermedades crónicas o condiciones que declara. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  chronicConditionsText?: string;

  /** Qué está tomando ahora, incluidos los de venta libre. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  currentMedicationsText?: string;

  /** Cirugías y hospitalizaciones anteriores. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  surgeriesText?: string;

  /** Antecedentes familiares relevantes. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  familyHistoryText?: string;

  /** Hábitos: tabaco, alcohol, actividad física, alimentación. */
  @ApiPropertyOptional({ maxLength: MEDICAL_ASPECT_TEXT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)
  habitsText?: string;
}

/**
 * Respuesta de `GET|PUT /clinical/me/medical-aspects`: el estado completo. Un
 * titular que nunca declaró nada recibe el objeto vacío, no un 404.
 */
export class MedicalAspectsResponseDto {
  @ApiPropertyOptional()
  bloodType?: string;

  @ApiPropertyOptional()
  allergiesText?: string;

  @ApiPropertyOptional()
  chronicConditionsText?: string;

  @ApiPropertyOptional()
  currentMedicationsText?: string;

  @ApiPropertyOptional()
  surgeriesText?: string;

  @ApiPropertyOptional()
  familyHistoryText?: string;

  @ApiPropertyOptional()
  habitsText?: string;

  /** Cuándo se guardó por última vez. Sólo lectura: lo pone el servidor. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: Date;
}
