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
  // `FilesRepository` sale por la misma razón: Community valida dentro de su
  // transacción que el archivo que un post pretende adjuntar exista y sea de
  // quien publica, y esa comprobación no puede vivir en otro dominio.
  exports: [
    IdentifiersRepository,
    ContactPointsRepository,
    FilesRepository,
    FileVersionsRepository,
  ],
})
export class CommonModule {}
