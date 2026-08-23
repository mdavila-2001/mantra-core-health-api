import { ApiProperty } from '@nestjs/swagger';

/** Una línea que el importador no pudo usar. */
export class ImportFileIssueDto {
  /** Número de línea dentro del archivo, empezando en 1. */
  @ApiProperty({ description: 'Línea del archivo, empezando en 1' })
  line!: number;

  /** Qué tenía de malo. */
  @ApiProperty({ description: 'Motivo por el que la línea se descartó' })
  message!: string;
}

/** Respuesta de la importación por archivo. */
export class ImportConceptsFileResponseDto {
  /** El lote que quedó registrado, para poder auditarlo después. */
  @ApiProperty({
    description: 'Lote de importación registrado',
    format: 'uuid',
  })
  batchId!: string;

  /** Cuántas líneas con contenido tenía el archivo. */
  @ApiProperty({ description: 'Líneas con contenido leídas' })
  totalRead!: number;

  /** Cuántos conceptos nuevos entraron. */
  @ApiProperty({ description: 'Conceptos creados' })
  inserted!: number;

  /** Cuántos ya estaban, por código, y se dejaron como estaban. */
  @ApiProperty({ description: 'Códigos que ya existían en la versión' })
  skipped!: number;

  /** Cuántas líneas se descartaron por inválidas. */
  @ApiProperty({ description: 'Líneas descartadas' })
  errors!: number;

  /**
   * Una muestra de los errores, no todos.
   *
   * Un archivo mal formado puede tener cien mil líneas malas, y devolverlas
   * todas convertiría la respuesta en otro problema. Con las primeras alcanza
   * para entender qué pasó.
   */
  @ApiProperty({
    description: 'Primeros errores encontrados, como muestra',
    type: [ImportFileIssueDto],
  })
  errorSamples!: ImportFileIssueDto[];
}
