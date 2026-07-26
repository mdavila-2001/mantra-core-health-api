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
    IdentifiersRepository,
    ContactPointsRepository,
    AddressesRepository,
    FilesRepository,
    FileVersionsRepository,
    FileDerivativesRepository,
    FileLinksRepository,
  ],
})
export class CommonModule {}
