import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RESOURCE_TYPES, type ResourceType } from './scheduling-catalog.dto';

/**
 * Tope de una página de agenda. Alto porque una semana de un consultorio con
 * franjas de 15 minutos ya pasa de 200 cupos, y partirla obligaría al front a
 * encadenar peticiones sólo para pintar un calendario semanal.
 */
export const AGENDA_MAX_LIMIT = 500;
const AGENDA_DEFAULT_LIMIT = 200;

/**
 * Convierte el booleano de una query string.
 *
 * `Boolean('false')` es `true`, así que ni `@Type(() => Boolean)` ni la
 * conversión implícita del `ValidationPipe` sirven aquí: `?onlyAvailable=false`
 * activaría el filtro que pide desactivar. Sólo las formas afirmativas
 * explícitas cuentan como `true`.
 *
 * Se lee de `obj[key]` y no de `value` a propósito: con
 * `enableImplicitConversion` activo —lo está en `main.ts` y en el harness de
 * pruebas—, class-transformer ya convirtió el valor antes de llamar aquí, y
 * `value` llegaría siendo `true`. `obj` conserva la cadena original.
 */
const queryBoolean = () =>
  Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj?.[key];
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'boolean') return raw;
    // Sólo una cadena o un número describen un booleano de query; cualquier otra
    // cosa se devuelve tal cual para que `@IsBoolean` la rechace con su mensaje.
    if (typeof raw !== 'string' && typeof raw !== 'number') return raw;
    const normalized = String(raw).trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no', ''].includes(normalized)) return false;
    return raw;
  });

/** Query de `GET /scheduling/resources`. */
export class ListResourcesQueryDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid', description: 'Tenant dueño de la agenda' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por práctica' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Valor de resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de recurso',
    enum: RESOURCE_TYPES,
  })
  @IsOptional()
  @IsIn(RESOURCE_TYPES as readonly string[])
  resourceType?: ResourceType;

  /**
   * Valor de include inactive mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Incluir los recursos dados de baja',
    default: false,
  })
  @IsOptional()
  @queryBoolean()
  @IsBoolean()
  includeInactive?: boolean;
}

/** Un recurso agendable tal como lo lista la agenda. */
export class ResourceListItemDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @ApiProperty({ format: 'uuid' })
  resourceTypeConceptId!: string;

  /**
   * Tipo de la entidad referenciada por el recurso.
   */
  @ApiProperty({ example: 'health_practitioner_profiles' })
  resourceRefType!: string;

  /**
   * Identificador asociado a resource ref.
   */
  @ApiProperty({ format: 'uuid' })
  resourceRefId!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  practiceId!: string | null;

  /**
   * Zona horaria IANA del recurso.
   */
  @ApiPropertyOptional({ nullable: true, example: 'America/La_Paz' })
  timeZone!: string | null;

  /**
   * Atenciones simultáneas que admite. 1 cuando el recurso no lo declara.
   */
  @ApiProperty()
  capacity!: number;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

/** Respuesta de `GET /scheduling/resources`. */
export class ListResourcesResponseDto {
  /**
   * Recursos de esta página.
   */
  @ApiProperty({ type: [ResourceListItemDto] })
  items!: ResourceListItemDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;
}

/**
 * Query de `GET /scheduling/slots`.
 *
 * `from`/`to` son obligatorios a propósito: sin ventana, la consulta barre la
 * tabla entera de cupos, que crece sin techo con cada generación.
 */
export class ListSlotsQueryDto {
  /**
   * Identificador asociado a resource.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Recurso cuya agenda se consulta',
  })
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  /**
   * Identificador asociado a schedule template.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plantilla que materializó los cupos',
  })
  @IsOptional()
  @IsUUID()
  scheduleTemplateId?: string;

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana consultada',
  })
  @IsISO8601()
  from!: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la ventana (exclusivo)',
  })
  @IsISO8601()
  to!: string;

  /**
   * Valor de only available mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Sólo cupos con capacidad libre y abiertos: lo que el portal ofrece para reservar',
    default: false,
  })
  @IsOptional()
  @queryBoolean()
  @IsBoolean()
  onlyAvailable?: boolean;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: AGENDA_DEFAULT_LIMIT, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AGENDA_MAX_LIMIT)
  limit?: number;
}

/** Un cupo agendable, con lo que el front necesita para ofrecerlo. */
export class SlotListItemDto {
  /**
   * Identificador único de la instancia. Es el que se envía a
   * `POST /scheduling/slots/{id}/holds`.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Id a enviar para reservar el cupo',
  })
  id!: string;

  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a schedule template.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  scheduleTemplateId!: string | null;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  startAt!: string;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  endAt!: string;

  /**
   * Cupos totales del slot.
   */
  @ApiProperty()
  capacity!: number;

  /**
   * Cupos que quedan libres.
   */
  @ApiProperty()
  remainingCapacity!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceConceptId!: string | null;
}

/** Respuesta de `GET /scheduling/slots`. */
export class ListSlotsResponseDto {
  /**
   * Cupos de esta página, del más próximo al más lejano.
   */
  @ApiProperty({ type: [SlotListItemDto] })
  items!: SlotListItemDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado.
   */
  @ApiProperty()
  limit!: number;

  /**
   * `true` cuando la ventana tenía más cupos de los que entran en el tope: hay
   * que estrecharla. No se devuelve cursor porque la ventana ya es el cursor
   * natural de una agenda.
   */
  @ApiProperty({
    description: 'Si la ventana excede el tope y hay que estrecharla',
  })
  truncated!: boolean;
}
