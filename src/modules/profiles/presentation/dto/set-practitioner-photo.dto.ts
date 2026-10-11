import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Cuerpo de `PUT /profiles/practitioners/:profileId/photo`.
 *
 * ## Por qué el cuerpo es un id de archivo y no bytes
 *
 * Porque los bytes ya tienen su puerta: `POST /common/files/upload`, que es
 * donde se valida el contenido por su firma binaria, se aplica el límite de
 * tamaño y se registra la versión. Recibir la foto otra vez acá crearía una
 * segunda entrada al almacenamiento con sus propias reglas —y con sus propios
 * agujeros—.
 *
 * Lo que este endpoint decide no es qué es el archivo, sino de quién es y para
 * qué se usa: que la persona sea la titular del perfil y que ese archivo sea
 * suyo, esté vivo y sea una imagen.
 */
export class SetPractitionerPhotoDto {
  /** Archivo ya subido por el titular con `POST /common/files/upload`. */
  @ApiProperty({
    description: 'Identificador del archivo ya subido que será la foto',
    format: 'uuid',
  })
  @IsUUID()
  fileId!: string;
}
