import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica de creación: id del recurso recién materializado. */
export class CreatedResourceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador del recurso creado',
  })
  id!: string;
}

/** Respuesta genérica de creación con estado (concept id) y marca temporal. */
export class ResourceStatusDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del recurso',
  })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado booleano para operaciones que mutan estado sin devolver entidad. */
export class OkResultDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}
