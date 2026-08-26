import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Largos de la contraseña de las cuentas de demostración. */
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

/** Un paquete de contenido en el listado. */
export class ContentPackDto {
  /** Código con el que se aplica. */
  @ApiProperty({ description: 'Código del paquete', example: 'ARANCEL_BO' })
  code!: string;

  /** Nombre legible. */
  @ApiProperty({ description: 'Nombre legible del paquete' })
  name!: string;

  /** Qué trae y para qué sirve. */
  @ApiProperty({ description: 'Qué contiene el paquete' })
  description!: string;

  /** Cuántas filas trae, aproximadamente. */
  @ApiProperty({ description: 'Filas que trae, en orden de magnitud' })
  approxRows!: number;

  /** Si hace falta declarar una contraseña al aplicarlo. */
  @ApiProperty({
    description: 'Si el paquete crea cuentas y necesita una contraseña',
  })
  requiresDemoPassword!: boolean;
}

/** Respuesta de `GET /admin/content-packs`. */
export class ListContentPacksResponseDto {
  /** Los paquetes disponibles. */
  @ApiProperty({ type: [ContentPackDto] })
  items!: ContentPackDto[];
}

/** Cuerpo de `POST /admin/content-packs/{code}/apply`. */
export class ApplyContentPackDto {
  /**
   * Contraseña para las cuentas que crea el paquete.
   *
   * Sólo la usa `CUENTAS_DEMO`. Se acepta en la petición además de por entorno
   * porque quien aplica el paquete desde la pantalla no tiene forma de tocar
   * las variables del servidor.
   */
  @ApiPropertyOptional({
    description: 'Contraseña de las cuentas de demostración',
    minLength: MIN_PASSWORD,
    maxLength: MAX_PASSWORD,
  })
  @IsOptional()
  @IsString()
  @MinLength(MIN_PASSWORD)
  @MaxLength(MAX_PASSWORD)
  demoPassword?: string;
}

/** Respuesta de aplicar un paquete. */
export class ApplyContentPackResponseDto {
  /** El paquete aplicado. */
  @ApiProperty({ description: 'Código del paquete aplicado' })
  code!: string;

  /**
   * Filas nuevas que dejó esta aplicación.
   *
   * **Cero no es un error**: los paquetes convergen, así que aplicar dos veces
   * el mismo devuelve cero la segunda. Ese cero significa «ya estaba».
   */
  @ApiProperty({
    description: 'Filas nuevas; cero significa que el contenido ya estaba',
    nullable: true,
    type: Number,
  })
  inserted!: number | null;

  /** Cuánto tardó, en milisegundos. */
  @ApiProperty({ description: 'Duración de la aplicación en milisegundos' })
  tookMs!: number;

  /** Los contadores tal como los reporta el paquete, sin agregar. */
  @ApiProperty({
    description: 'Contadores por tipo de fila, con la forma propia del paquete',
    type: Object,
  })
  counters!: unknown;
}
