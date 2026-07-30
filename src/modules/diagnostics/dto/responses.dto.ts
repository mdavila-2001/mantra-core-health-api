import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica al crear un recurso: id y concepto de estado resultante. */
export class ResourceCreatedDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Id del recurso creado' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concept id del estado del recurso',
  })
  status!: string;
}

/** Respuesta de una operación que no devuelve un recurso nuevo. */
export class OperationResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'La operación se completó', example: true })
  ok!: boolean;
}

/** Respuesta al acesionar: id de la acesión y de los items creados. */
export class AccessionCreatedDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de accession specimen ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Ids de accession_specimens',
  })
  accessionSpecimenIds!: string[];
}

/** Respuesta al crear una orden de trabajo: id de la orden y de sus pruebas. */
export class WorkOrderCreatedDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de test ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Ids de las pruebas creadas',
  })
  testIds!: string[];
}

/** Respuesta al ingerir un estudio DICOM (STOW-RS). */
export class ImagingStudyStoredDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  status!: string;

  /**
   * Valor de number of series mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de series creadas' })
  numberOfSeries!: number;

  /**
   * Valor de number of instances mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de instancias creadas' })
  numberOfInstances!: number;
}
