import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
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

/**
 * Entradas del plano de planta (CONTRATO-PLANO §3). La validación de tipos es
 * de estos DTO; los rangos, la geometría y las reglas de dibujo son del
 * servicio, que contesta con `PLAN_LAYOUT_INVALID` y un error **por elemento**
 * (un 400 de validación no dice cuál figura falló).
 */

/** Alta de un lienzo. */
export class CreateFloorPlanDto {
  /** Código estable del lienzo, único por sede. */
  @ApiProperty({ example: 'PLANO-PB', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  /** Nombre para mostrar. */
  @ApiProperty({ example: 'Planta baja', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /** Espacio ancla (piso, ala, área, sala, edificio); ausente = campus. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  anchorSpaceId?: string;

  /** Ancho en metros (1–5000). */
  @ApiProperty({ example: 64 })
  @IsNumber()
  widthM!: number;

  /** Alto en metros (1–5000). */
  @ApiProperty({ example: 26 })
  @IsNumber()
  heightM!: number;

  /** Cota del piso (`IfcBuildingStorey`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  elevationM?: number;

  /** Rumbo del «arriba» respecto del norte, en [0, 360). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  northBearingDeg?: number;

  /** Grilla del editor (0,01–10 m). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gridSizeM?: number;

  /** Ajuste a la grilla. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean;

  /** Margen de contacto entre hermanos (0–0,1 m). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contactToleranceM?: number;
}

/** Edición de metadatos de un lienzo (`If-Match: rowVersion`). */
export class UpdateFloorPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  widthM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  heightM?: number;

  /** `null` quita la cota. */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  elevationM?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  northBearingDeg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gridSizeM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  contactToleranceM?: number;
}

/** Clausura o reapertura de un lienzo. */
export class FloorPlanLifecycleDto {
  @ApiProperty({ enum: ['retire', 'reactivate'] })
  @IsIn(['retire', 'reactivate'])
  action!: 'retire' | 'reactivate';

  /** Motivo (obligatorio). */
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;
}

/** Un punto de la imagen del fondo, en píxeles. */
export class ImagePointDto {
  @ApiProperty()
  @IsNumber()
  px!: number;

  @ApiProperty()
  @IsNumber()
  py!: number;
}

/** Calibración por dos puntos y la distancia real entre ellos. */
export class BackgroundCalibrationDto {
  @ApiProperty({ type: ImagePointDto })
  @ValidateNested()
  @Type(() => ImagePointDto)
  p1!: ImagePointDto;

  @ApiProperty({ type: ImagePointDto })
  @ValidateNested()
  @Type(() => ImagePointDto)
  p2!: ImagePointDto;

  /** Distancia real entre `p1` y `p2`, en metros. */
  @ApiProperty()
  @IsNumber()
  distanceM!: number;
}

/** Fondo importado de un lienzo (`PUT /floor-plans/:id/background`). */
export class SetBackgroundDto {
  /** Archivo ya subido (imagen PNG/JPEG/WebP del mismo tenant). */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;

  /** Calibración por dos puntos (alternativa a `scaleMPerPx`). */
  @ApiPropertyOptional({ type: BackgroundCalibrationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BackgroundCalibrationDto)
  calibration?: BackgroundCalibrationDto;

  /** Metros por píxel (alternativa a `calibration`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  scaleMPerPx?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetXM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetYM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rotationDeg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  opacity?: number;
}

/** Ubicación de un espacio en un guardado de layout. */
export class PlacementItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  spaceId!: string;

  /** `{kind:'RECT',…}` o `{kind:'POLYGON', vertices}`; el servicio la valida. */
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  geometry!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  zOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;
}

/** Elemento de lienzo en un guardado de layout (campos por tipo; los valida el servicio). */
export class ElementItemDto {
  /** Id nuevo (UUID v4 generado por el cliente: reintentar es idempotente) o existente. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({
    enum: [
      'WALL',
      'DOOR',
      'WINDOW',
      'OPENING',
      'STAIRS',
      'ELEVATOR',
      'CIRCULATION',
      'COLUMN',
      'ANNOTATION',
    ],
  })
  @IsString()
  kind!: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'array' } })
  @IsOptional()
  @IsArray()
  vertices?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  thicknessM?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  hostElementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  widthM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swingSide?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verticalLinkCode?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  connectsSpaceAId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  connectsSpaceBId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  zOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;
}

/** Lo que se agrega o cambia. */
export class LayoutUpsertDto {
  @ApiPropertyOptional({ type: [PlacementItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => PlacementItemDto)
  placements?: PlacementItemDto[];

  @ApiPropertyOptional({ type: [ElementItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => ElementItemDto)
  elements?: ElementItemDto[];
}

/** Lo que se quita. */
export class LayoutRemoveDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @IsUUID('all', { each: true })
  spaceIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10_000)
  @IsUUID('all', { each: true })
  elementIds?: string[];

  /** Quita también los hijos dibujados de cada espacio quitado. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}

/** `PATCH /floor-plans/:id/layout`: delta que el editor guarda. */
export class PatchLayoutDto {
  @ApiPropertyOptional({ type: LayoutUpsertDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutUpsertDto)
  upsert?: LayoutUpsertDto;

  @ApiPropertyOptional({ type: LayoutRemoveDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutRemoveDto)
  remove?: LayoutRemoveDto;
}

/** `PUT /floor-plans/:id/layout`: reemplazo total. */
export class ReplaceLayoutDto {
  @ApiProperty({ type: [PlacementItemDto] })
  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => PlacementItemDto)
  placements!: PlacementItemDto[];

  @ApiProperty({ type: [ElementItemDto] })
  @IsArray()
  @ArrayMaxSize(10_000)
  @ValidateNested({ each: true })
  @Type(() => ElementItemDto)
  elements!: ElementItemDto[];

  /** Obligatorio si el reemplazo quita algo de lo que hay. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  confirmRemoval?: boolean;
}

/** Alta de una ubicación suelta (`POST /floor-plans/:id/placements`). */
export class CreatePlacementDto extends PlacementItemDto {}

/** Cambio parcial de una ubicación (`PATCH /space-placements/:id`). */
export class UpdatePlacementDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  zOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}

/** Alta de un elemento suelto (`POST /floor-plans/:id/elements`). */
export class CreateElementDto extends ElementItemDto {}

/** Cambio parcial de un elemento (`PATCH /plan-elements/:id`). */
export class UpdateElementDto {
  @ApiPropertyOptional({ type: 'array', items: { type: 'array' } })
  @IsOptional()
  @IsArray()
  vertices?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  thicknessM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hostElementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offsetM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  widthM?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swingSide?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verticalLinkCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  connectsSpaceAId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  connectsSpaceBId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  zOrder?: number;
}

const toBool = ({ value }: { value: unknown }): unknown =>
  value === 'true' || value === true
    ? true
    : value === 'false' || value === false
      ? false
      : value;

const toNumberList = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.split(',').map((part) => Number(part.trim()))
    : value;

/** Parámetros de `GET /floor-plans/:id/layout`. */
export class LayoutQueryDto {
  /** Ventana `x0,y0,x1,y1` en metros. */
  @ApiPropertyOptional({ example: '0,0,32,13' })
  @IsOptional()
  @Transform(toNumberList)
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMaxSize(4)
  bbox?: number[];

  @ApiPropertyOptional({ enum: ['lite', 'full'] })
  @IsOptional()
  @IsIn(['lite', 'full'])
  detail?: 'lite' | 'full';

  /** Qué incluir: `spaces`, `elements` o ambos (`spaces,elements`). */
  @ApiPropertyOptional({ example: 'spaces,elements' })
  @IsOptional()
  @IsString()
  @Matches(/^(spaces|elements)(,(spaces|elements))?$/)
  include?: string;

  @ApiPropertyOptional({ default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  focusSpaceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: ['filter', 'flag'] })
  @IsOptional()
  @IsIn(['filter', 'flag'])
  unitMode?: 'filter' | 'flag';

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeRetired?: boolean;
}

/** Parámetros de `GET /floor-plans/:id/state`. */
export class StateQueryDto {
  @ApiPropertyOptional({ example: '0,0,32,13' })
  @IsOptional()
  @Transform(toNumberList)
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMaxSize(4)
  bbox?: number[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  focusSpaceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  /** Ejes a incluir: `availability,occupancy,hygiene,isolation` (por defecto todos). */
  @ApiPropertyOptional({ example: 'occupancy,hygiene' })
  @IsOptional()
  @IsString()
  @Matches(/^(availability|occupancy|hygiene|isolation)(,(availability|occupancy|hygiene|isolation))*$/)
  axis?: string;
}

/** Parámetros de las listas de lienzos. */
export class ListPlansQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  includeRetired?: boolean;
}

/** Parámetros de `GET /floor-plans/:id/unplaced-spaces`. */
export class UnplacedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  limit?: number;
}

/** Parámetros de `GET /sites/:siteId/plan-search`. */
export class PlanSearchQueryDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  q!: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

/** Parámetros de `GET /sites/:siteId/plan-focus`. */
export class PlanFocusQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitId?: string;
}

/** Parámetros del catálogo. */
export class PlanCatalogQueryDto {
  /** Sede para leer las plantillas y los límites de la práctica. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;
}

/** Parámetros de `GET /floor-plans/:id/background/content`. */
export class BackgroundContentQueryDto {
  @ApiProperty()
  @IsString()
  @Matches(/^\d{10,16}$/)
  exp!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  sig!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  v!: string;
}
