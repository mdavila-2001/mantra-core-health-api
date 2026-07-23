import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ChartController],
  providers: [ChartService],
})
export class ChartModule {}
