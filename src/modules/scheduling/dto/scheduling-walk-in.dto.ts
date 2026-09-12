import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  APPOINTMENT_CHANNELS,
  type AppointmentChannel,
} from './scheduling-bookings.dto';

/**
 * Reglas de forma copiadas de `RegisterPatientDto`
 * (`iam/dto/register-patient.dto.ts`): el mostrador declara la misma
 * filiación que el auto-registro, así que valida igual. Copiadas y no
 * importadas: `scheduling` no depende del DTO de `iam`, cuyo contrato es
 * territorio ajeno y puede cambiar por su cuenta.
 */
const PERSON_NAME_PART_MAX_LENGTH = 100;
const OCCUPATION_FREE_TEXT_MAX_LENGTH = 200;
const PHONE_MAX_LENGTH = 40;
const PHONE_PATTERN = /^[+]?[0-9 ()-]{6,}$/;
const PHONE_PATTERN_MESSAGE =
  'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion';

/**
 * Filiación del paciente de mostrador, tal como la declara quien lo atiende
 * (AC-3.3): mismas reglas de forma que `RegisterPatientDto`, sin cuenta.
 *
 * `name`/`lastName` son obligatorios acá — a diferencia del auto-registro no
 * existe la forma anterior `displayName`, así que no hay a qué caer.
 */
export class WalkInPatientDto {
  /** Nombre de pila. */
  @ApiProperty({ maxLength: PERSON_NAME_PART_MAX_LENGTH, example: 'Lucía' })
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  name!: string;

  /** Segundo nombre. Opcional: mucha gente no tiene. */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Andrea',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  middleName?: string;

  /** Apellido paterno. */
  @ApiProperty({ maxLength: PERSON_NAME_PART_MAX_LENGTH, example: 'Mamani' })
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  lastName!: string;

  /** Apellido materno. Opcional: no todas las jurisdicciones lo emiten. */
  @ApiPropertyOptional({
    maxLength: PERSON_NAME_PART_MAX_LENGTH,
    example: 'Quispe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(PERSON_NAME_PART_MAX_LENGTH)
  motherLastName?: string;

  /** Documento de identidad. */
  @ApiProperty({
    description: 'Documento de identidad del paciente',
    maxLength: 40,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9.-]+$/, {
    message: 'El documento sólo admite letras, dígitos, punto y guion',
  })
  nationalId!: string;

  /**
   * Departamento que emitió el documento (miembro de `VS_BO_DEPARTMENT`).
   *
   * **Opcional a diferencia del auto-registro**: quien atiende el mostrador
   * no siempre lo tiene a mano en el momento.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Departamento emisor del documento (catálogo VS_BO_DEPARTMENT)',
  })
  @IsOptional()
  @IsUUID()
  issuerAdministrativeAreaConceptId?: string;

  /** Fecha de nacimiento. Opcional: el mostrador puede no tenerla a mano. */
  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  /** Teléfono de contacto. */
  @ApiProperty({
    description:
      'Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres',
    maxLength: PHONE_MAX_LENGTH,
  })
  @IsString()
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })
  phone!: string;

  /** Ocupación, miembro de `VS_BO_OCCUPATION`. */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ocupación del catálogo (VS_BO_OCCUPATION)',
  })
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  /**
   * Ocupación en texto libre, para cuando no está en el catálogo. Se ignora
   * si viene `occupationConceptId`.
   */
  @ApiPropertyOptional({
    maxLength: OCCUPATION_FREE_TEXT_MAX_LENGTH,
    description: 'Ocupación en texto libre, para cuando no está en el catálogo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)
  occupationFreeText?: string;

  /** Nombre del tutor o persona autorizada. */
  @ApiPropertyOptional({
    maxLength: 200,
    description: 'Nombre del tutor o persona autorizada',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  guardianName?: string;

  /**
   * Teléfono del tutor. Que no se pueda mandar sin `guardianName` lo
   * comprueba el alta, no un `ValidateIf`.
   */
  @ApiPropertyOptional({
    maxLength: 40,
    description: 'Teléfono del tutor, en formato E.164 o nacional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[+]?[0-9 ()-]{6,}$/, {
    message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion',
  })
  guardianPhone?: string;

  /**
   * Parentesco declarado (miembro de `related-person-relationship`).
   * Opcional: sin él el alta escribe `RELATIONSHIP_GUARDIAN`.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Parentesco del contacto de emergencia (conjunto related-person-relationship)',
  })
  @IsOptional()
  @IsUUID()
  guardianRelationshipConceptId?: string;
}

/**
 * Cuerpo de `POST /scheduling/appointments/walk-in` — el turno de mostrador
 * atómico (AC-3.3): registra al paciente sin cuenta, reserva y abre el
 * encuentro en una sola transacción.
 */
export class WalkInAppointmentDto {
  /** Filiación de quien se presenta en el mostrador. */
  @ApiProperty({ type: WalkInPatientDto })
  @ValidateNested()
  @Type(() => WalkInPatientDto)
  patient!: WalkInPatientDto;

  /** La agenda del profesional donde ocurre la atención. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  resourceId!: string;

  /** Cuándo empieza. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  /** Cuánto dura, en minutos. */
  @ApiProperty({ minimum: 5, maximum: 480 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes!: number;

  /** El motivo de la consulta. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /**
   * Por qué medio ocurre la atención. Ausente = presencial. No es el canal
   * de la reserva —el mostrador siempre escribe `WALK_IN` ahí—, es la
   * modalidad de la cita clínica. Mismo campo que
   * `CreateDirectAppointmentDto.channel`.
   */
  @ApiPropertyOptional({
    enum: APPOINTMENT_CHANNELS,
    description:
      'Modalidad de la atención. Ausente = PRESENCIAL. No es el canal de la reserva.',
  })
  @IsOptional()
  @IsIn(APPOINTMENT_CHANNELS as readonly string[])
  channel?: AppointmentChannel;
}

/** Respuesta 201 del turno de mostrador. */
export class WalkInAppointmentResponseDto {
  /** El perfil de paciente recién creado. */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** La persona recién creada. */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /** El código de paciente asignado. */
  @ApiProperty()
  patientCode!: string;

  /** La reserva creada, ya `IN_PROGRESS`. */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /** El cupo único que la respalda. */
  @ApiProperty({ format: 'uuid' })
  bookableSlotId!: string;

  /** La cita clínica que respalda la reserva. */
  @ApiProperty({ format: 'uuid' })
  appointmentId!: string;

  /** El encuentro abierto, listo para registrar la atención. */
  @ApiProperty({ format: 'uuid' })
  encounterId!: string;

  /** Estado de la reserva: nace `IN_PROGRESS`. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cupos ofrecidos que este turno retiró. */
  @ApiProperty()
  retractedSlots!: number;
}
