import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_PAGE_SIZE } from '../data_catalog.constants';

const sinEspacios = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Paginación por cursor común a todos los listados del portal. */
export class PaginacionQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor opaco de la página anterior (`nextCursor`)',
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Filas por página',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const RIESGOS = ['ALTO', 'MEDIO', 'BAJO'] as const;
const ORIGENES = ['CONTRATO', 'CONTRATO_AUSENTE'] as const;

/** Un identificador de módulo, schema o señal: minúsculas, mayúsculas, dígitos y guion bajo. */
const IDENTIFICADOR = /^[A-Za-z0-9_]{1,80}$/;

/** Filtros del listado de operaciones y del mapa. */
export class OperacionesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    description:
      'Busca (sin tildes ni mayúsculas) en ruta, nombre y controlador',
    maxLength: 120,
  })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({
    description: 'Carpeta del módulo, p. ej. `scheduling`',
  })
  @IsOptional()
  @Matches(IDENTIFICADOR)
  modulo?: string;

  @ApiPropertyOptional({ enum: RIESGOS })
  @IsOptional()
  @IsIn(RIESGOS)
  riesgo?: (typeof RIESGOS)[number];

  @ApiPropertyOptional({ enum: METODOS })
  @IsOptional()
  @IsIn(METODOS)
  metodo?: (typeof METODOS)[number];

  @ApiPropertyOptional({
    enum: ORIGENES,
    description:
      '`CONTRATO_AUSENTE`: existe en el código y `openapi.json` no la publica',
  })
  @IsOptional()
  @IsIn(ORIGENES)
  origen?: (typeof ORIGENES)[number];

  @ApiPropertyOptional({
    description: 'Señal del mapa, p. ej. `ESCRIBE_SIN_ROLES` o `SIN_PRUEBAS`',
  })
  @IsOptional()
  @Matches(IDENTIFICADOR)
  senal?: string;

  @ApiPropertyOptional({
    description:
      'Código del proceso al que pertenece, p. ej. `scheduling` o `critico:scheduling`',
  })
  @IsOptional()
  @Matches(/^[a-z0-9_:]{1,80}$/)
  flujo?: string;
}

/** Filtros del listado de procesos. */
export class ProcesosQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: ['MODULO', 'CRITICO'] })
  @IsOptional()
  @IsIn(['MODULO', 'CRITICO'])
  tipo?: 'MODULO' | 'CRITICO';

  @ApiPropertyOptional({ description: 'Carpeta del módulo' })
  @IsOptional()
  @Matches(IDENTIFICADOR)
  modulo?: string;

  @ApiPropertyOptional({
    enum: [
      'CASO_DE_USO_README',
      'AGRUPACION_POR_CONTROLADOR',
      'MIXTO',
      'CURADO_EN_DOCUMENTO',
    ],
  })
  @IsOptional()
  @IsIn([
    'CASO_DE_USO_README',
    'AGRUPACION_POR_CONTROLADOR',
    'MIXTO',
    'CURADO_EN_DOCUMENTO',
  ])
  agrupacion?: string;
}

/** Filtros del listado de tablas del catálogo estático. */
export class TablasQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(IDENTIFICADOR)
  schema?: string;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en `schema.tabla` y propósito',
  })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({
    enum: ['COINCIDE', 'DIVERGE', 'SIN_ENTIDAD'],
    description: 'Estado frente al ORM',
  })
  @IsOptional()
  @IsIn(['COINCIDE', 'DIVERGE', 'SIN_ENTIDAD'])
  orm?: string;

  @ApiPropertyOptional({
    description:
      'Sólo (o excluyendo) las tablas que un README declara append-only',
  })
  @IsOptional()
  // `enableImplicitConversion` convertiría "false" en `true` (Boolean("false")): se lee el valor crudo
  @Transform(({ obj }: { obj: { appendOnly?: unknown } }) =>
    obj.appendOnly === 'true' || obj.appendOnly === true
      ? true
      : obj.appendOnly === 'false' || obj.appendOnly === false
        ? false
        : obj.appendOnly,
  )
  @IsBoolean()
  appendOnly?: boolean;
}

/** Búsqueda libre paginada (glosario). */
export class BusquedaQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;
}

/** Parámetro de ruta con el identificador de una operación (`Clase_método`). */
export class OperacionIdParamDto {
  @Matches(/^[A-Za-z0-9_]{1,200}$/, { message: 'id de operación inválido' })
  id!: string;
}

/** Parámetro de ruta con el código de un proceso (`scheduling`, `critico:scheduling`). */
export class ProcesoCodigoParamDto {
  @Matches(/^[a-z0-9_:]{1,80}$/, { message: 'código de proceso inválido' })
  codigo!: string;
}

/** Parámetros de ruta de una tabla. */
export class TablaParamDto {
  @Matches(IDENTIFICADOR, { message: 'schema inválido' })
  schema!: string;

  @Matches(IDENTIFICADOR, { message: 'tabla inválida' })
  tabla!: string;
}

/** Parámetro de ruta con el identificador de un hallazgo (`FLU-01`). */
export class HallazgoIdParamDto {
  @Matches(/^[A-Z]{3}-\d{2}$/, { message: 'id de hallazgo inválido' })
  id!: string;
}
