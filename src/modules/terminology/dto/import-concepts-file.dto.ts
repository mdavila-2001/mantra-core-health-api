import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

import type { FormatoDeArchivo } from '../import';

/**
 * Lee como booleano lo que en un formulario viaja como texto.
 *
 * En `multipart/form-data` todo campo es una cadena, así que sin esto la
 * validación rechazaría el `'false'` que manda cualquier formulario.
 *
 * @param params - El valor tal como llegó del formulario.
 * @returns El booleano, o el valor original si no es uno de los dos textos.
 */
function comoBooleano({ value }: TransformFnParams): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/** Lo que acompaña al archivo en el formulario de importación. */
export class ImportConceptsFileRequestDto {
  /**
   * Validar sin escribir.
   *
   * Por omisión la importación escribe: quien quiera mirar antes lo pide.
   */
  @ApiPropertyOptional({
    description: 'Validar el archivo sin escribir nada',
    default: false,
  })
  @IsOptional()
  @Transform(comoBooleano)
  @IsBoolean()
  dryRun?: boolean;

  /**
   * Qué se está cargando.
   *
   * No lleva lista cerrada a propósito: qué perfiles existen lo sabe el
   * importador, y dejar que lo decida él es lo que permite responder «no se
   * puede importar eso» con su propio código en vez de un error de validación
   * genérico que la pantalla no puede distinguir.
   */
  @ApiPropertyOptional({
    description: 'Qué se está cargando',
    default: 'conceptos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  profile?: string;
}

/** Una fila que el importador no pudo usar. */
export class ImportFileIssueDto {
  /**
   * Número de fila dentro del archivo, empezando en 1.
   *
   * Es la fila que ve quien abre el archivo: en un CSV o una planilla el
   * encabezado es la 1, así que la primera fila de datos es la 2.
   */
  @ApiProperty({ description: 'Fila del archivo, empezando en 1' })
  line!: number;

  /**
   * Qué columna tiene el problema, cuando es de una columna.
   *
   * Ausente cuando el problema es de la fila entera —una línea que no es un
   * objeto— porque señalar una columna que no existe no ayuda a corregir nada.
   */
  @ApiPropertyOptional({ description: 'Columna con el problema, si es de una' })
  column?: string;

  /** Qué tenía de malo, en castellano y accionable. */
  @ApiProperty({ description: 'Motivo por el que la fila se descartó' })
  message!: string;
}

/**
 * Una fila de la vista previa.
 *
 * Lleva el número de fila más las columnas del perfil tal como se leyeron, así
 * que sus claves dependen de qué se esté cargando: para conceptos son `code`,
 * `display` y `definition`.
 */
export class ImportPreviewRowDto {
  [columna: string]: string | number | undefined;

  /** Fila del archivo de la que salió. */
  @ApiProperty({ description: 'Fila del archivo, empezando en 1' })
  line!: number;
}

/** Respuesta de la importación por archivo. */
export class ImportConceptsFileResponseDto {
  /**
   * El lote que quedó registrado, para poder auditarlo después.
   *
   * Es `null` cuando no hubo nada que registrar: en una validación sin escribir
   * y cuando el archivo se rechazó entero por traer errores. Un lote de cero
   * conceptos no documenta una importación, documenta un intento.
   */
  @ApiProperty({
    description: 'Lote de importación registrado; nulo si no se escribió nada',
    format: 'uuid',
    nullable: true,
  })
  batchId!: string | null;

  /** Con qué formato se leyó, decidido por el contenido del archivo. */
  @ApiProperty({
    description: 'Formato reconocido en el contenido del archivo',
    enum: ['ndjson', 'csv', 'xlsx'],
  })
  format!: FormatoDeArchivo;

  /** Qué se estaba cargando. */
  @ApiProperty({ description: 'Perfil con el que se leyeron las columnas' })
  profile!: string;

  /** Si fue una validación sin escribir. */
  @ApiProperty({
    description: 'La importación fue una validación sin escribir',
  })
  dryRun!: boolean;

  /**
   * Si el archivo se rechazó entero.
   *
   * Es verdadero exactamente cuando hubo al menos un problema: el archivo entra
   * completo o no entra, así que un error deja la versión como estaba.
   */
  @ApiProperty({
    description: 'El archivo se rechazó entero por tener errores',
  })
  aborted!: boolean;

  /** Cuántas filas con contenido tenía el archivo. */
  @ApiProperty({ description: 'Filas con contenido leídas' })
  totalRead!: number;

  /** Cuántos conceptos nuevos entraron. */
  @ApiProperty({ description: 'Conceptos creados' })
  inserted!: number;

  /** Cuántos ya estaban, por código, y se dejaron como estaban. */
  @ApiProperty({ description: 'Códigos que ya existían en la versión' })
  skipped!: number;

  /** Cuántos problemas se encontraron. */
  @ApiProperty({ description: 'Problemas encontrados' })
  errors!: number;

  /**
   * Una muestra de los errores, no todos.
   *
   * Un archivo mal formado puede tener cien mil filas malas, y devolverlas
   * todas convertiría la respuesta en otro problema. Con las primeras alcanza
   * para entender qué pasó.
   */
  @ApiProperty({
    description: 'Primeros errores encontrados, como muestra',
    type: [ImportFileIssueDto],
  })
  errorSamples!: ImportFileIssueDto[];

  /**
   * Las primeras filas válidas, para poder mirar antes de escribir.
   *
   * Sólo viaja en una validación sin escribir, que es cuando sirve: después de
   * importar, lo que entró se consulta en la versión.
   */
  @ApiPropertyOptional({
    description: 'Primeras filas válidas, en una validación sin escribir',
    type: [ImportPreviewRowDto],
  })
  preview?: ImportPreviewRowDto[];
}

/** Qué se le pide a la importación además del archivo. */
export interface ImportFileOptions {
  /** Validar sin escribir. */
  readonly dryRun?: boolean;
  /** Qué se está cargando; por omisión, conceptos. */
  readonly profile?: string;
}
