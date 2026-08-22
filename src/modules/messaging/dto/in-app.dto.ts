import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

/* ============================================================================
    Carril P9 · preferencias de notificación

    La unidad de preferencia es la **categoría**, no el disparador: quien
    configura razona «no me avises de lo social», no «no me avises de
    reacciones a comentarios en publicaciones de grupos». Son cuatro filas de
    `recipient_preferences` por persona, más una quinta —sin categoría— que
    guarda la ventana de silencio del canal entero.
    ========================================================================== */

/** Ventana de silencio, en hora UTC. */
export class QuietHoursDto {
  /** Desde qué hora, `HH:mm`. */
  @ApiProperty({ example: '22:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de inicio debe tener el formato HH:mm',
  })
  start!: string;

  /**
   * Hasta qué hora, `HH:mm`.
   *
   * Puede ser **menor** que `start`: una ventana que cruza la medianoche es el
   * caso habitual —22:00 a 07:00— y el que se rompería comparando ingenuamente.
   */
  @ApiProperty({ example: '07:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora de fin debe tener el formato HH:mm',
  })
  end!: string;
}

/** La decisión del usuario para una categoría. */
export class CategoryPreferenceDto {
  /** Categoría a la que se refiere. */
  @ApiProperty({ enum: NOTIFICATION_CATEGORIES })
  @IsIn(NOTIFICATION_CATEGORIES)
  category!: NotificationCategory;

  /** Si acepta recibir avisos de esa categoría. */
  @ApiProperty()
  @IsBoolean()
  optedIn!: boolean;
}

/** Cuerpo de `PUT /notifications/preferences/me`. */
export class UpdateMyPreferencesDto {
  /**
   * Las categorías que se cambian.
   *
   * Es un reemplazo **por categoría**, no del conjunto entero: mandar sólo
   * `SOCIAL` deja las otras tres como estaban. Reemplazar todo obligaría a la
   * pantalla a reenviar decisiones que el usuario no tocó, y a pisar las que
   * hubiera cambiado en otra pestaña.
   */
  @ApiPropertyOptional({ type: [CategoryPreferenceDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CategoryPreferenceDto)
  categories?: CategoryPreferenceDto[];

  /**
   * Ventana de silencio del canal, o `null` para quitarla.
   *
   * `null` explícito y no ausencia: ausente significa «no la toques», que es
   * lo que manda una pantalla que sólo cambió una categoría.
   */
  @ApiPropertyOptional({ type: QuietHoursDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto | null;
}

/** Preferencias de notificación in-app de una persona. */
export class MyPreferencesDto {
  /** Decisión por categoría: **siempre las cuatro**, aunque nunca las tocó. */
  @ApiProperty({ type: [CategoryPreferenceDto] })
  categories!: CategoryPreferenceDto[];

  /** Ventana de silencio, o `null` si no configuró ninguna. */
  @ApiPropertyOptional({ type: QuietHoursDto, nullable: true })
  quietHours!: QuietHoursDto | null;
}
