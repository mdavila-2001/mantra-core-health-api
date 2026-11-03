import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica de creación: id del recurso recién materializado. */
export class CreatedResourceDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador del recurso creado',
  })
  id!: string;
}

/** Respuesta genérica de creación con estado (concept id) y marca temporal. */
export class ResourceStatusDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Concepto de estado del recurso',
  })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Resultado booleano para operaciones que mutan estado sin devolver entidad. */
export class OkResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ example: true })
  ok!: boolean;
}
