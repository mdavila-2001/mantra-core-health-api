import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  SUPPORT_PERMISSION_INPUT_CODES,
  SUPPORT_TARGET_KINDS,
  type SupportTargetKind,
} from '../domain';

/**
 * Objetivo de un permiso de apoyo: el tipo y las referencias que ese tipo
 * exige (doctor, servicio, espacio o sede). Lo comparten solicitudes, ítems,
 * ajustes y altas de permisos.
 */
export class SupportTargetDto {
  /** Tipo de objetivo. */
  @ApiProperty({ enum: SUPPORT_TARGET_KINDS })
  @IsIn(SUPPORT_TARGET_KINDS)
  targetKind!: SupportTargetKind;

  /** Doctor (asignación de rol) del objetivo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerRoleAssignmentId?: string;

  /** Servicio del objetivo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  /** Espacio (edificio, piso, sala…) del objetivo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careSpaceId?: string;

  /** Sede del objetivo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;
}

/**
 * Objetivo más las acciones que el permiso incluye: permisos atómicos
 * (`agenda.appointment.cancel`) o los 15 códigos antiguos (alias, que se siguen
 * aceptando; D-02). Quien decide puede además acotar el permiso con una
 * condición ABAC v1 (`condition`), que el guardián de escritura valida con el
 * mismo validador de siempre (422 `CONDITION_*`).
 */
export class SupportTargetWithActionsDto extends SupportTargetDto {
  /** Acciones del permiso (átomos o alias); si se omiten rigen las de la plantilla. */
  @ApiPropertyOptional({
    enum: SUPPORT_PERMISSION_INPUT_CODES as string[],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(80)
  @ArrayUnique()
  @IsIn(SUPPORT_PERMISSION_INPUT_CODES, { each: true })
  actions?: string[];

  /**
   * Condición ABAC (esquema versionado) de todo el permiso. Solo la fija quien
   * decide: en una solicitud nueva la persona no se pone condiciones propias.
   */
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
}
