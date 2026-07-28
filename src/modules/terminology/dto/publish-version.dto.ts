import { ApiProperty } from '@nestjs/swagger';

/** Resultado de la publicación de una versión (UC-03-04). */
export class PublishVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la versión publicada' })
  id!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Estado del ciclo de vida tras la publicación (código de concepto)',
  })
  state!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Instante de publicación' })
  publishedAt!: Date;
}
