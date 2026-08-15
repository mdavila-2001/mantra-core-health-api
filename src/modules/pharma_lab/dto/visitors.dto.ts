import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Alta de un visitador médico desde la organización (UC-17-06).
 *
 * No hay endpoint de auto-registro de visitador y no lo habrá: la spec exige que
 * la cuenta se cree desde el laboratorio (5293) y que dependa de él (5294).
 */
export class CreateMedicalVisitorDto {
  /**
   * Cuenta ya creada para el visitador dentro de la organización.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Cuenta creada por la organización',
  })
  @IsUUID()
  userId!: string;

  /**
   * Nombre completo.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fullName!: string;

  /**
   * Código interno del visitador.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  internalCode!: string;

  /**
   * Fotografía.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  photoUrl?: string;

  /**
   * Cargo.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  position?: string;

  /**
   * Supervisor, como ficha de personal.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  supervisorStaffId?: string;

  /**
   * Sede.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Región.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  region?: string;

  /**
   * Área comercial.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  commercialArea?: string;

  /**
   * Zona asignada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  assignedZone?: string;

  /**
   * Fecha de inicio.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  startedOn!: string;

  /**
   * Fecha de finalización prevista.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  endedOn?: string;

  /**
   * Especialidades que visita.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  specialtyConceptIds?: string[];

  /**
   * Productos que representa.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(200)
  pharmaProductIds?: string[];
}

/** Registro de las verificaciones exigidas por la spec 5295-5301 (UC-17-07). */
export class VerifyMedicalVisitorDto {
  /**
   * Resultado de la verificación de identidad.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  identityVerificationConceptId?: string;

  /**
   * Resultado de la verificación del contrato.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contractVerificationConceptId?: string;

  /**
   * Resultado de la verificación de credenciales.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  credentialVerificationConceptId?: string;
}

/** Productos que el visitador queda autorizado a representar (UC-17-09). */
export class SetVisitorProductsDto {
  /**
   * Conjunto completo de productos autorizados. Reemplaza al anterior.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(200)
  pharmaProductIds!: string[];
}

/** Especialidades que el visitador queda autorizado a visitar (UC-17-10). */
export class SetVisitorSpecialtiesDto {
  /**
   * Conjunto completo de especialidades. Reemplaza al anterior.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  specialtyConceptIds!: string[];
}

/**
 * Revinculación de un visitador desvinculado (spec 5340: «la reactivación deberá
 * requerir una nueva vinculación autorizada»).
 */
export class RelinkMedicalVisitorDto {
  /**
   * Fecha de inicio de la nueva vinculación.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  startedOn!: string;

  /**
   * Autorización que respalda la revinculación.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  authorization!: string;
}
