import { Module } from '@nestjs/common';

import { SeedModule } from '../../common/seed/seed.module';
import { ContentPacksController } from './content-packs.controller';
import { ContentPacksService } from './content-packs.service';

/**
 * Los paquetes de contenido aplicables a demanda.
 *
 * No declara providers de datos propios: **reutiliza** los servicios de siembra
 * que `SeedModule` ya exporta. Son los mismos datos, las mismas reglas y el
 * mismo código idempotente que corre el arranque; un importador paralelo daría
 * dos fuentes del mismo contenido, con la garantía de que un día se separen.
 */
@Module({
  imports: [SeedModule],
  controllers: [ContentPacksController],
  providers: [ContentPacksService],
  exports: [ContentPacksService],
})
export class ContentPacksModule {}
