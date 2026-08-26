import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  CommonAddressesController,
  CommonContactPointsController,
  CommonFilesController,
  CommonIdentifiersController,
  InternalFilesController,
} from './controllers';
import {
  AddressesService,
  AttachableFileService,
  ContactPointsService,
  FileUploadService,
  FilesService,
  IdentifiersService,
} from './services';
import {
  AddressesRepository,
  ContactPointsRepository,
  FileDerivativesRepository,
  FileLinksRepository,
  FileVersionsRepository,
  FilesRepository,
  IdentifiersRepository,
} from './repositories';

/**
 * Módulo Common: datos transversales compartidos por el resto de dominios
 * (identificadores oficiales, puntos de contacto, direcciones y el subsistema de
 * archivos con versionado, derivados, vínculos, escaneo y borrado lógico).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    CommonIdentifiersController,
    CommonContactPointsController,
    CommonAddressesController,
    CommonFilesController,
    InternalFilesController,
  ],
  providers: [
    IdentifiersService,
    ContactPointsService,
    AddressesService,
    FilesService,
    FileUploadService,
    AttachableFileService,
    IdentifiersRepository,
    ContactPointsRepository,
    AddressesRepository,
    FilesRepository,
    FileVersionsRepository,
    FileDerivativesRepository,
    FileLinksRepository,
  ],
  // Documento de identidad y correo del auto-registro de pacientes los escribe
  // IAM dentro de su propia transacción, así que necesita estos repositorios.
  // `AttachableFileService` sale por la misma razón: quien adjunta un archivo
  // —el muro social a una publicación, `profiles` a la foto del profesional—
  // tiene que poder comprobar dentro de su propia transacción que ese archivo
  // existe y es de quien lo adjunta.
  exports: [
    IdentifiersRepository,
    ContactPointsRepository,
    // El alta pública escribe el domicilio del municipio elegido, y vive en
    // `iam`: sin exportarlo, ese módulo no puede inyectarlo.
    AddressesRepository,
    FilesRepository,
    FileVersionsRepository,
    AttachableFileService,
  ],
})
export class CommonModule {}
