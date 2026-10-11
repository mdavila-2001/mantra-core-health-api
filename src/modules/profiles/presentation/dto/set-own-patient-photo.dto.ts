import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Cuerpo de `PUT /profiles/patients/me/photo`.
 *
 * Espejo de {@link SetPractitionerPhotoDto}: el cuerpo es un id de archivo y
 * no bytes, porque los bytes ya tienen su puerta —`POST /common/files/upload`,
 * donde se valida el contenido por su firma binaria—. Lo que este endpoint
 * decide no es qué es el archivo, sino que sea del titular de la cuenta, esté
 * vivo y sea una imagen.
 */
export class SetOwnPatientPhotoDto {
  /** Archivo ya subido por el titular con `POST /common/files/upload`. */
  @ApiProperty({
    description: 'Identificador del archivo ya subido que será la foto',
    format: 'uuid',
  })
  @IsUUID()
  fileId!: string;
}
