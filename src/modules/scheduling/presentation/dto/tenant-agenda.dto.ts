import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * El rango máximo que se puede pedir de una vez, en días.
 *
 * No es una limitación técnica sino de lectura: una recepción mira su día o su
 * semana, y quien pide un año no está mirando una agenda sino descargando una
 * base. El tope obliga a que ese uso sea explícito y paginado.
 */
export const MAX_RANGO_AGENDA_DIAS = 31;

/** Tope de citas por respuesta. */
export const MAX_CITAS_POR_PAGINA = 500;

/** Filtros de `GET /tenants/{tenantId}/agenda`. */
export class TenantAgendaQueryDto {
  /** Inicio de la ventana, en ISO 8601. */
  @ApiProperty({ example: '2026-08-19T00:00:00.000Z' })
  @IsDateString()
  from!: string;

  /** Fin de la ventana, en ISO 8601. */
  @ApiProperty({ example: '2026-08-26T00:00:00.000Z' })
  @IsDateString()
  to!: string;

  /**
   * Acotar a un profesional concreto.
   *
   * Se traduce a «sus recursos **en esta organización**»: pedir el de un
   * profesional de otra clínica no devuelve sus citas allá, devuelve vacío.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practitionerProfileId?: string;

  /** Tope de citas. */
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_CITAS_POR_PAGINA })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_CITAS_POR_PAGINA)
  limit?: number;
}

/**
 * Una cita tal como la ve la organización (TP-5).
 *
 * ## Lo que NO está acá, y es lo importante
 *
 * **El motivo de consulta.** Es del paciente y de su médico, de nadie más. Una
 * recepción necesita saber quién viene, cuándo y con quién —eso es recibir a
 * alguien— y no por qué viene, que es un dato clínico. El DTO no lo declara, y
 * por eso no hay forma de que se filtre: no hay un `if` que alguien pueda
 * invertir ni una bandera que alguien pueda encender.
 *
 * Tampoco hay diagnóstico, ni notas, ni nada del expediente. Esta lectura vive
 * en `scheduling` y no toca `clinical` ni `chart`.
 *
 * El nombre del paciente **sí** está: la organización lo recibe en la puerta, y
 * una agenda sin nombres no sirve para recibir a nadie.
 */
export class TenantAgendaItemDto {
  /** La cita. */
  @ApiProperty({ format: 'uuid' })
  bookingId!: string;

  /** Cuándo empieza. */
  @ApiProperty()
  startAt!: Date;

  /** Cuándo termina. */
  @ApiProperty()
  endAt!: Date;

  /** El recurso —la sede— donde se atiende. */
  @ApiProperty({ format: 'uuid', nullable: true })
  resourceId!: string | null;

  /** Nombre de la sede, para no obligar a la pantalla a cruzarlo. */
  @ApiProperty({ nullable: true })
  resourceName!: string | null;

  /** El profesional que atiende, si el recurso apunta a uno. */
  @ApiProperty({ format: 'uuid', nullable: true })
  practitionerProfileId!: string | null;

  /** El paciente citado. */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Nombre del paciente: la organización lo recibe en la puerta. */
  @ApiProperty({ nullable: true })
  patientName!: string | null;

  /** Estado de la cita. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** La agenda de la organización en la ventana pedida. */
export class TenantAgendaResponseDto {
  /** Las citas, en orden cronológico. */
  @ApiProperty({ type: [TenantAgendaItemDto] })
  items!: TenantAgendaItemDto[];

  /**
   * Si la ventana devolvió tantas citas como el tope permitía.
   *
   * Una agenda a la que le faltan citas sin avisar se lee como una agenda más
   * vacía de lo que está, que es exactamente la lectura contraria a la que una
   * recepción necesita.
   */
  @ApiProperty()
  truncated!: boolean;
}
