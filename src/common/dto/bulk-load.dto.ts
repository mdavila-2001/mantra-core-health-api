import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { IsStrictBoolean } from '../validators/strict-boolean.validator';

/*
 * Contrato HTTP de la carga masiva: el cuerpo `{ mode, dryRun, rows }` y la
 * respuesta por fila. Lo comparten las cargas del catálogo de `pharmacy` y la
 * del stock por sucursal de `pharmacy_inventory`; vive en `common` para que
 * ninguno de los dos tenga que entrar al otro para declararlo.
 */

/** Cómo trata la carga una clave que ya existe o que falta. */
export const BULK_MODES = ['CREATE', 'UPDATE', 'UPSERT'] as const;
export type BulkMode = (typeof BULK_MODES)[number];

/** Qué pasó con cada fila. */
export const BULK_OUTCOMES = [
  'CREATED',
  'UPDATED',
  'REJECTED',
  'UNCHANGED',
] as const;
export type BulkOutcome = (typeof BULK_OUTCOMES)[number];

/** Tope de filas por pedido: el cuerpo JSON no pasa de 1 MB. */
export const BULK_MAX_ROWS = 1000;

/**
 * Cuerpo de `POST /pharmacies/:pharmacyId/{categories|products|prices|sites}/bulk`
 * y de `POST /pharmacies/:pharmacyId/sites/:siteId/availability/bulk`.
 *
 * Las filas viajan como objetos sueltos a propósito: el pipe global no las
 * valida, porque una fila mala no puede tumbar el pedido. Cada una se valida
 * después, con el DTO de su tabla, y el error vuelve en su resultado.
 */
export class BulkRequestDto {
  /**
   * `CREATE` rechaza una clave existente; `UPDATE`, una ausente; `UPSERT` acepta las dos.
   */
  @ApiProperty({ enum: BULK_MODES })
  @IsIn(BULK_MODES)
  mode!: BulkMode;

  /**
   * Con `true` no escribe nada y responde lo que habría pasado con cada fila.
   * Booleano estricto o ausente: `0`, `""`, `null`, `"true"`, `[]` o `{}` son un
   * 400 y no se escribe nada (una vista previa mal tipada no puede cargar).
   */
  @ApiPropertyOptional({ type: Boolean, default: false })
  // `@IsOptional()` dejaría pasar `null`: sólo la ausencia omite la regla.
  @ValidateIf((_body: unknown, value: unknown) => value !== undefined)
  @IsStrictBoolean()
  dryRun?: boolean;

  /**
   * Las filas, en el orden del archivo (entre 1 y 1000).
   */
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    minItems: 1,
    maxItems: BULK_MAX_ROWS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_MAX_ROWS)
  @IsObject({ each: true })
  // Sin esto, la conversión implícita del pipe global convierte cada fila en
  // un arreglo; con `Object` la fila llega tal cual y la valida su tabla.
  @Type(() => Object)
  rows!: Record<string, unknown>[];
}

/** Por qué se rechazó una fila. */
export class BulkRowErrorDto {
  /**
   * Campo de la fila, o `row` si el problema es la fila entera.
   */
  @ApiProperty()
  field!: string;

  /**
   * Código estable del motivo.
   */
  @ApiProperty()
  reason!: string;

  /**
   * El motivo en castellano, para mostrarlo tal cual.
   */
  @ApiPropertyOptional()
  message?: string;
}

/** Lo que pasó con una fila. */
export class BulkRowResultDto {
  /**
   * Número de fila, desde 1, en el orden del pedido.
   */
  @ApiProperty()
  row!: number;

  /**
   * Resultado de la fila.
   */
  @ApiProperty({ enum: BULK_OUTCOMES })
  outcome!: BulkOutcome;

  /**
   * Registro creado o cambiado; solo sin `dryRun` y si no se rechazó.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  /**
   * Motivos del rechazo; solo con `REJECTED`.
   */
  @ApiPropertyOptional({ type: [BulkRowErrorDto] })
  errors?: BulkRowErrorDto[];

  /**
   * Avisos de una fila que se carga igual (en la vista previa, que se cargaría):
   * por ejemplo `MEDICATION_NOT_LINKED`, un producto que pide receta sin
   * medicamento vinculado, que ninguna receta va a encontrar.
   */
  @ApiPropertyOptional({ type: [BulkRowErrorDto] })
  warnings?: BulkRowErrorDto[];
}

/** Respuesta de una carga masiva: una entrada por fila, en orden. */
export class BulkResponseDto {
  /**
   * Si fue una vista previa sin escritura.
   */
  @ApiProperty()
  dryRun!: boolean;

  /**
   * Resultado por fila.
   */
  @ApiProperty({ type: [BulkRowResultDto] })
  results!: BulkRowResultDto[];
}
