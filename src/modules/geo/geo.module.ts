import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [GeoController],
  providers: [GeoService],
})
export class GeoModule {}
