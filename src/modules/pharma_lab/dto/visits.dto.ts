import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Producto o tema que el visitador declara que presentará. */
export class VisitTopicDto {
  /**
   * Producto del catálogo, cuando el tema es un medicamento concreto.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmaProductId?: string;

  /**
   * Tema libre.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;
}

/** Solicitud de visita médica (UC-17-13). */
export class CreateVisitRequestDto {
  /**
   * Doctor al que se solicita la visita.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorUserId!: string;

  /**
   * Organización del doctor.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  doctorTenantId?: string;

  /**
   * Motivo de la visita.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  reason!: string;

  /**
   * Inicio solicitado, en ISO 8601 con zona.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  requestedStartAt!: string;

  /**
   * Duración solicitada, en minutos.
   */
  @ApiProperty({ minimum: 5, maximum: 240 })
  @IsInt()
  @Min(5)
  @Max(240)
  durationMinutes!: number;

  /**
   * Modalidad solicitada.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  modalityConceptId!: string;

  /**
   * Ubicación o enlace propuesto.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  /**
   * Observaciones.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  /**
   * Productos o temas a presentar.
   */
  @ApiProperty({ type: [VisitTopicDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => VisitTopicDto)
  topics!: VisitTopicDto[];
}

/** Decisión del doctor sobre una solicitud (UC-17-14). */
export class VisitDecisionDto {
  /**
   * Nota o motivo de la decisión.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/** Propuesta de otro horario por parte del doctor (UC-17-15). */
export class ProposeVisitTimeDto {
  /**
   * Nuevo inicio propuesto.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  proposedStartAt!: string;

  /**
   * Nota que acompaña la propuesta.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/** Reprogramación pedida por el visitador (UC-17-16). */
export class RescheduleVisitDto {
  /**
   * Nuevo inicio solicitado.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  requestedStartAt!: string;

  /**
   * Motivo de la reprogramación.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Cancelación de una solicitud (UC-17-17). */
export class CancelVisitDto {
  /**
   * Motivo de la cancelación.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Material presentado durante la visita. */
export class VisitMaterialDto {
  /**
   * Material informativo presentado.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  informationalMaterialId!: string;

  /**
   * Si además se entregó una copia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  wasHandedOver?: boolean;
}

/** Registro de la visita realizada (UC-17-18). */
export class CreateVisitRecordDto {
  /**
   * Solicitud confirmada de la que nace el registro.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  visitRequestId!: string;

  /**
   * Momento en que se realizó.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  occurredAt!: string;

  /**
   * Lugar.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  /**
   * Temas tratados.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  topicsDiscussed?: string;

  /**
   * Preguntas realizadas.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  questions?: string;

  /**
   * Compromisos asumidos.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  commitments?: string;

  /**
   * Próxima acción acordada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nextAction?: string;

  /**
   * Observaciones.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string;

  /**
   * Asistencia del visitador.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  visitorAttendanceConceptId!: string;

  /**
   * Asistencia del doctor.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  doctorAttendanceConceptId!: string;

  /**
   * Material presentado o entregado.
   */
  @ApiPropertyOptional({ type: [VisitMaterialDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VisitMaterialDto)
  materials?: VisitMaterialDto[];
}

/** Confirmación de la visita por parte del doctor (UC-17-19). */
export class ConfirmVisitRecordDto {
  /**
   * `true` si la visita ocurrió tal como se registró.
   */
  @ApiProperty()
  @IsBoolean()
  occurred!: boolean;

  /**
   * Nota del doctor.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

/** Calificación de la visita por el doctor (UC-17-20). */
export class RateVisitDto {
  /**
   * Naturaleza del registro: calificación interna, encuesta privada o
   * reclamación formal.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  kindConceptId!: string;

  /**
   * Puntualidad, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  punctuality?: number;

  /**
   * Calidad de la información, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  informationQuality?: number;

  /**
   * Claridad, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  clarity?: number;

  /**
   * Relevancia, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  relevance?: number;

  /**
   * Conducta profesional, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  professionalConduct?: number;

  /**
   * Utilidad del material, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  materialUsefulness?: number;

  /**
   * Satisfacción general, 1 a 5.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallSatisfaction?: number;

  /**
   * Comentario opcional.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
