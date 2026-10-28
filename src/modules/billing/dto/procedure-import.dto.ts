import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Tope de procedimientos que una sola importación en lote puede abarcar. */
export const PROCEDURE_IMPORT_MAX = 5000;

/**
 * Cuerpo de `POST /billing/service-catalog/import-procedures`.
 *
 * Los criterios **se combinan con Y**: `specialties` (cualquiera de las
 * listadas), `codes` (cualquiera de los listados) y `q` (todas sus palabras)
 * acotan el mismo conjunto. Hace falta al menos uno.
 */
export class ImportProceduresDto {
  /** Práctica cuyo catálogo recibe los servicios. */
  @ApiProperty({
    description:
      'Práctica (practice.practices) cuyo catálogo recibe los servicios',
    format: 'uuid',
  })
  @IsUUID()
  practiceId!: string;

  /** Especialidades del arancel, con el nombre exacto que publica. */
  @ApiPropertyOptional({
    description:
      'Nombres exactos de especialidad del arancel (`GET procedure-specialties`)',
    type: [String],
    example: ['Cardiología'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  specialties?: string[];

  /** Códigos de procedimiento a importar. */
  @ApiPropertyOptional({
    description: 'Códigos del arancel (`procedure:...`) a importar',
    type: [String],
    example: ['procedure:bo:BO_ARM_AUDITORIA_MEDICA_I_GENERAL'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PROCEDURE_IMPORT_MAX)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  codes?: string[];

  /** Texto libre sobre el nombre del procedimiento. */
  @ApiPropertyOptional({
    description:
      'Texto a buscar en el nombre del procedimiento; sin tildes ni mayúsculas, todas las palabras',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

/** Resultado de `POST /billing/service-catalog/import-procedures`. */
export class ImportProceduresResponseDto {
  /** Servicios que se crearon en el catálogo. */
  @ApiProperty({ description: 'Servicios creados', example: 98 })
  created!: number;

  /** Coincidencias que ya estaban en el catálogo de la práctica. */
  @ApiProperty({
    description: 'Coincidencias que ya existían en la práctica y se saltaron',
    example: 0,
  })
  skipped!: number;

  /** Procedimientos del arancel que cumplen el filtro. */
  @ApiProperty({
    description: 'Procedimientos del arancel que cumplen el filtro',
    example: 98,
  })
  total!: number;
}

/** Una especialidad del arancel que corresponde al profesional. */
export class MyProcedureSpecialtyDto {
  /** Nombre exacto de la especialidad, tal cual lo publica el arancel. */
  @ApiProperty({ example: 'Cardiología' })
  specialty!: string;

  /** Procedimientos que el arancel agrupa bajo esa especialidad. */
  @ApiProperty({ example: 98 })
  count!: number;
}

/** Respuesta de `GET /billing/service-catalog/procedure-specialties/mine`. */
export class MyProcedureSpecialtiesResponseDto {
  /** Especialidades del arancel que corresponden al médico autenticado. */
  @ApiProperty({ type: [MyProcedureSpecialtyDto] })
  items!: MyProcedureSpecialtyDto[];
}
