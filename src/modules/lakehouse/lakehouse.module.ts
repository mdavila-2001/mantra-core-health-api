import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LakehouseController } from './lakehouse.controller';
import { LakehouseService } from './lakehouse.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [LakehouseController],
  providers: [LakehouseService],
})
export class LakehouseModule {}
