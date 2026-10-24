import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HEALTH_RISKS } from '../domain/health-risk';

/** Resultado de la operación que dejó el sello. */
export const AUDIT_RESULTS = ['SUCCESS', 'FAILURE'] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

/** Verbos HTTP que pueden dejar sello (los que mutan). */
export const AUDIT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type AuditMethod = (typeof AUDIT_METHODS)[number];

/** Operaciones registradas en `audit.data_access_log`. */
export const DATA_OPERATIONS = [
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
] as const;

/** Tope de elementos por página de las consultas de bitácora. */
export const AUDIT_MAX_PAGE_SIZE = 200;
export const AUDIT_DEFAULT_PAGE_SIZE = 50;

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Paginación y rango de fechas comunes a las dos consultas. */
class AuditPageQueryDto {
  @ApiPropertyOptional({
    description:
      'Desde (ISO 8601, incluido). Sin rango, la consulta mira los últimos 30 días',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Hasta (ISO 8601, excluido)',
    example: '2026-10-24T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Quién actuó' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: AUDIT_MAX_PAGE_SIZE,
    default: AUDIT_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AUDIT_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    maxLength: 400,
    description: '`nextCursor` de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  cursor?: string;
}

/** Filtros de `GET /audit/log` (acciones que mutaron). */
export class AuditLogQueryDto extends AuditPageQueryDto {
  @ApiPropertyOptional({ enum: AUDIT_RESULTS })
  @IsOptional()
  @IsIn(AUDIT_RESULTS)
  result?: AuditResult;

  @ApiPropertyOptional({
    maxLength: 200,
    description:
      'Acción exacta: el código de negocio (`CATALOG_ANNOTATION_SAVED`) o `HTTP <VERBO> <plantilla>`',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(200)
  action?: string;

  @ApiPropertyOptional({
    enum: AUDIT_METHODS,
    description:
      'Verbo HTTP, derivado de la acción; las acciones de negocio salen del mapa de rutas armado al arrancar',
  })
  @IsOptional()
  @IsIn(AUDIT_METHODS)
  method?: AuditMethod;

  @ApiPropertyOptional({
    maxLength: 300,
    example: '/admin/catalog/objects/:id/annotation',
    description: 'Plantilla exacta de la ruta, con `:parámetros`',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(300)
  route?: string;

  @ApiPropertyOptional({ maxLength: 100, description: 'Entidad afectada' })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(100)
  entity?: string;
}

/** Filtros de `GET /audit/data-access` (lecturas de datos sensibles). */
export class DataAccessQueryDto extends AuditPageQueryDto {
  @ApiPropertyOptional({ enum: DATA_OPERATIONS })
  @IsOptional()
  @IsIn(DATA_OPERATIONS)
  operation?: (typeof DATA_OPERATIONS)[number];

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente cuyo dato se leyó',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

export class AuditLogEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) tenantId!:
    string | null;
  @ApiProperty({
    description: 'Código de negocio o `HTTP <VERBO> <plantilla>`',
  })
  action!: string;
  @ApiProperty() entity!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) entityId!:
    string | null;
  @ApiProperty({ enum: [...AUDIT_RESULTS, 'UNKNOWN'] }) result!: string;
  @ApiPropertyOptional({ nullable: true }) ip!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    enum: AUDIT_METHODS,
    description: 'Derivado de la acción; `null` si no se pudo derivar',
  })
  method!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description:
      'Plantilla de la ruta, derivada de la acción; `null` si no se pudo derivar',
  })
  route!: string | null;
  @ApiProperty({
    enum: HEALTH_RISKS,
    description:
      'Riesgo para la seguridad de la salud, derivado al leer (no se guarda)',
  })
  healthRisk!: string;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: string;
}

export class AuditLogPageDto {
  @ApiProperty({ type: [AuditLogEntryDto] }) items!: AuditLogEntryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

export class DataAccessEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) tenantId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) patientProfileId!:
    string | null;
  @ApiProperty({ enum: DATA_OPERATIONS }) operation!: string;
  @ApiPropertyOptional({ nullable: true }) resourceType!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) resourceId!:
    string | null;
  @ApiPropertyOptional({ nullable: true }) purpose!: string | null;
  @ApiProperty({ enum: HEALTH_RISKS }) healthRisk!: string;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: string;
}

export class DataAccessPageDto {
  @ApiProperty({ type: [DataAccessEntryDto] }) items!: DataAccessEntryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}

/**
 * Filtros de `GET /audit/me/data-access`: sólo rango y paginación. El paciente sale de la sesión;
 * ni el actor, ni el tenant, ni el paciente se aceptan por parámetro (el `ValidationPipe` global
 * rechaza lo que no esté declarado).
 */
export class MyDataAccessQueryDto extends PickType(DataAccessQueryDto, [
  'from',
  'to',
  'limit',
  'cursor',
] as const) {}

/** Un acceso a los datos del titular, tal como lo ve él: quién, qué, para qué y cuándo. */
export class MyDataAccessEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({
    format: 'uuid',
    description: 'Cuenta (`iam.users`) de quien accedió',
  })
  userId!: string;
  @ApiProperty({ enum: DATA_OPERATIONS }) operation!: string;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Tipo de dato al que se accedió',
  })
  resourceType!: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) resourceId!:
    string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Finalidad declarada del acceso',
  })
  purpose!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: string;
}

export class MyDataAccessPageDto {
  @ApiProperty({ type: [MyDataAccessEntryDto] }) items!: MyDataAccessEntryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
}
