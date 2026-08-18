import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from '../notifications.contract';

/** Tope duro de filas por página de la bandeja. */
const MAX_PAGE = 100;

/* ============================================================================
    Carril P1 · la cara que consume la campana

    Las lecturas de este archivo son del **usuario final**, no del worker. Es
    la distinción que faltaba: `GET /internal/notifications/pending` reclama
    trabajo para entregar, y nada de eso le sirve a quien sólo quiere saber si
    tiene algo sin leer.
    ========================================================================== */

/** Consulta de `GET /notifications/me`. */
export class MyNotificationsQueryDto {
  /**
   * Sólo las que siguen sin leer.
   *
   * La campana pide el badge con esto en `true` y un tope chico; el centro
   * pide la bandeja completa. Es la misma lectura porque son la misma bandeja.
   */
  @ApiPropertyOptional({ description: 'Sólo las no leídas' })
  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  /** Cursor opaco de la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor de la página anterior' })
  @IsOptional()
  @IsString()
  cursor?: string;

  /** Cuántas traer. */
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_PAGE, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE)
  limit?: number;
}

/** A dónde navega una notificación al abrirla. */
export class NotificationDestinationDto {
  /** Clase de objeto que se abre. */
  @ApiProperty({ description: 'Clase de objeto: PRESCRIPTION, CONVERSATION…' })
  type!: string;

  /** Identificador de ese objeto. */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Una notificación de la bandeja in-app. */
export class InAppNotificationDto {
  /** Identificador de la notificación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Categoría en el vocabulario del contrato (`CLINICAL`, `MESSAGES`…).
   *
   * Va resuelta y no como concept id: el front tendría que mantener una tabla
   * de uuids para poder decir «clínica» en la pantalla de preferencias, y esa
   * tabla se desincroniza el día que alguien vuelve a sembrar.
   */
  @ApiPropertyOptional({ enum: NOTIFICATION_CATEGORIES })
  category?: NotificationCategory | null;

  /** Título corto. */
  @ApiPropertyOptional()
  subject?: string | null;

  /** Cuerpo de una o dos líneas. */
  @ApiPropertyOptional()
  bodyText?: string | null;

  /** A dónde lleva al abrirla, si lleva a algo. */
  @ApiPropertyOptional({ type: NotificationDestinationDto, nullable: true })
  destination?: NotificationDestinationDto | null;

  /** Datos extra que la pantalla de destino quiera aprovechar. */
  @ApiPropertyOptional({ type: Object, nullable: true })
  payloadJson?: unknown;

  /** `true` mientras siga sin leer. */
  @ApiProperty()
  unread!: boolean;

  /** Cuándo quedó disponible para el destinatario. */
  @ApiProperty({ type: String, format: 'date-time' })
  availableAt!: string;

  /** Cuándo la leyó, si la leyó. */
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  readAt?: string | null;
}

/** Página de la bandeja in-app propia. */
export class InAppNotificationPageDto {
  /** Las notificaciones de la página, de la más reciente a la más vieja. */
  @ApiProperty({ type: [InAppNotificationDto] })
  items!: InAppNotificationDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  /**
   * Cuántas quedan sin leer **en total**, no en esta página.
   *
   * Viaja con cada página porque es el número del badge, y pedirlo aparte
   * obligaría a la campana a hacer dos llamadas por cada tic de sondeo.
   */
  @ApiProperty()
  unreadCount!: number;
}

/** Resultado de marcar toda la bandeja como leída. */
export class MarkAllInAppReadResponseDto {
  /** Cuántas se marcaron en esta pasada. */
  @ApiProperty()
  marked!: number;

  /** Cuántas quedan sin leer después de marcar. */
  @ApiProperty()
  unreadCount!: number;
}
