import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica al crear un recurso: id y concepto de estado resultante. */
export class ResourceCreatedDto {
  @ApiProperty({ format: 'uuid', description: 'Id del recurso creado' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Concept id del estado del recurso' })
  status!: string;
}

/** Respuesta de una operación que no devuelve un recurso nuevo. */
export class OperationResultDto {
  @ApiProperty({ description: 'La operación se completó', example: true })
  ok!: boolean;
}

/** Respuesta al acesionar: id de la acesión y de los items creados. */
export class AccessionCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [String], format: 'uuid', description: 'Ids de accession_specimens' })
  accessionSpecimenIds!: string[];
}

/** Respuesta al crear una orden de trabajo: id de la orden y de sus pruebas. */
export class WorkOrderCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [String], format: 'uuid', description: 'Ids de las pruebas creadas' })
  testIds!: string[];
}

/** Respuesta al ingerir un estudio DICOM (STOW-RS). */
export class ImagingStudyStoredDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Nº de series creadas' })
  numberOfSeries!: number;

  @ApiProperty({ description: 'Nº de instancias creadas' })
  numberOfInstances!: number;
}
