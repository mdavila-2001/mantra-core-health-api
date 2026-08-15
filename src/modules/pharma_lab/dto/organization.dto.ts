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

/** Alta de una organización de tipo laboratorio farmacéutico (UC-17-01). */
export class CreatePharmaLabDto {
  /**
   * Organización del directorio a la que se asocia el laboratorio.
   */
  @ApiProperty({ format: 'uuid', description: 'Tenant del directorio' })
  @IsUUID()
  tenantId!: string;

  /**
   * Tipo de laboratorio, del catálogo de conceptos del módulo.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  labTypeConceptId!: string;

  /**
   * Razón social.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  legalName!: string;

  /**
   * Nombre comercial.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  /**
   * Identificación tributaria.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;

  /**
   * Descripción institucional.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Áreas de investigación.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  researchAreas?: string[];

  /**
   * URL del logotipo.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  logoUrl?: string;
}

/** Actualización del perfil institucional (UC-17-02). */
export class UpdatePharmaLabDto {
  /**
   * Nombre comercial.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradeName?: string;

  /**
   * Identificación tributaria.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;

  /**
   * Descripción institucional.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Áreas de investigación.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  researchAreas?: string[];

  /**
   * URL del logotipo.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  logoUrl?: string;

  /**
   * Estado del laboratorio.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Vinculación de un colaborador al laboratorio (UC-17-03). */
export class LinkStaffDto {
  /**
   * Cuenta del colaborador.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  /**
   * Tipo de personal.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  staffTypeConceptId!: string;

  /**
   * Rol funcional.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleCode?: string;

  /**
   * Cargo.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  position?: string;

  /**
   * Área.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  area?: string;

  /**
   * Sede.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  /**
   * Jornada.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  workSchedule?: string;

  /**
   * Fecha de ingreso.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  hiredOn!: string;

  /**
   * Permisos concedidos.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  permissions?: string[];
}

/** Cambio de permisos de un colaborador (UC-17-04). */
export class UpdateStaffPermissionsDto {
  /**
   * Permisos que quedan vigentes tras el cambio.
   */
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  permissions!: string[];

  /**
   * Motivo del cambio, que queda en la bitácora.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

/** Desvinculación de un colaborador o de un visitador (UC-17-05, UC-17-08). */
export class UnlinkDto {
  /**
   * Motivo de la desvinculación. Obligatorio: sin él la bitácora no sirve.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;

  /**
   * Fecha efectiva de la baja. Por omisión, hoy.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  effectiveOn?: string;
}
