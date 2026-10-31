import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

/** Lista de ids que llega como `a,b,c` o como parámetro repetido. */
const toList = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    : value;

/** Consulta de `GET /me/support-agenda`. */
export class SupportAgendaQueryDto {
  /**
   * Organización cuya agenda se pide, como `org` (contrato compartido) o como
   * `tenantId` (front): se acepta cualquiera de las dos; si llegan las dos,
   * tienen que ser la misma.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Alternativa: `tenantId`.',
  })
  @ValidateIf(
    (dto: SupportAgendaQueryDto) =>
      dto.tenantId === undefined || dto.org !== undefined,
  )
  @IsUUID()
  org?: string;

  /** Alias de `org`. */
  @ApiPropertyOptional({ format: 'uuid', description: 'Alias de `org`.' })
  @ValidateIf(
    (dto: SupportAgendaQueryDto) =>
      dto.org === undefined || dto.tenantId !== undefined,
  )
  @IsUUID()
  tenantId?: string;

  /** Inicio del rango. */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  /** Fin del rango (a lo sumo 31 días después del inicio). */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;

  /** Solo estos doctores (perfil profesional), separados por coma. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsUUID('all', { each: true })
  doctors?: string[];

  /** Solo estos servicios, separados por coma. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsUUID('all', { each: true })
  services?: string[];

  /** Solo estas ubicaciones (espacio o sede) y lo que contienen, separadas por coma. */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsUUID('all', { each: true })
  locations?: string[];
}

/** Doctor de la agenda combinada. */
export class SupportAgendaDoctorDto {
  /** Perfil profesional del doctor. */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;
  /** Nombre para mostrar. */
  @ApiProperty() displayName!: string;
}

/** Servicio de la agenda combinada. */
export class SupportAgendaServiceDto {
  /** Servicio. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Nombre. */
  @ApiProperty() name!: string;
}

/** Ubicación de la agenda combinada. */
export class SupportAgendaLocationDto {
  /** Espacio de atención. */
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** Nombre. */
  @ApiProperty() name!: string;
  /** Código. */
  @ApiProperty() code!: string;
}

/** Una cita de la agenda combinada, con su política ya resuelta. */
export class SupportAgendaItemDto {
  /** Cita: solo con `schedule.view`; un bloque sin él no nombra la cita. */
  @ApiPropertyOptional({ format: 'uuid' }) bookingId?: string;
  /** Agenda del doctor donde ocurre. */
  @ApiPropertyOptional({ format: 'uuid' }) resourceId?: string;
  /** Doctor (perfil profesional). */
  @ApiPropertyOptional({ format: 'uuid' }) practitionerProfileId?: string;
  /** Inicio. */
  @ApiProperty({ type: String, format: 'date-time' }) startAt!: Date;
  /** Fin. */
  @ApiProperty({ type: String, format: 'date-time' }) endAt!: Date;
  /** Estado de la cita (concepto). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
  /** Espacio. */
  @ApiPropertyOptional({ format: 'uuid' }) careSpaceId?: string;
  /** Servicio: solo con `schedule.view`. */
  @ApiPropertyOptional({ format: 'uuid' }) healthcareServiceId?: string;
  /** Paciente: solo con `schedule.view`. */
  @ApiPropertyOptional({ format: 'uuid' }) patientProfileId?: string;
  /** Nombre del paciente: solo con `schedule.view`. */
  @ApiPropertyOptional() patientName?: string;
  /**
   * Cuántas personas esperan por esta agenda en este horario (lista de espera
   * activa). Solo en las citas que puede ver, y ausente si nadie espera.
   */
  @ApiPropertyOptional() waitlistCount?: number;
  /** Acciones que puede hacer sobre esta cita. */
  @ApiProperty({ type: [String] }) allowedActions!: string[];
  /** Por qué no puede ver la cita, si no puede. */
  @ApiPropertyOptional() denialReason?: string;
}

/** Agenda combinada de la persona de apoyo. */
export class SupportAgendaResponseDto {
  /** Doctores que la persona cubre en el rango (opciones de filtro). */
  @ApiProperty({ type: [SupportAgendaDoctorDto] })
  doctors!: SupportAgendaDoctorDto[];
  /** Servicios que cubre (opciones de filtro). */
  @ApiProperty({ type: [SupportAgendaServiceDto] })
  services!: SupportAgendaServiceDto[];
  /** Ubicaciones que cubre (opciones de filtro). */
  @ApiProperty({ type: [SupportAgendaLocationDto] })
  locations!: SupportAgendaLocationDto[];
  /** Citas del rango, de la más próxima a la más lejana. */
  @ApiProperty({ type: [SupportAgendaItemDto] })
  items!: SupportAgendaItemDto[];
}
