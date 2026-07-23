import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ErpController],
  providers: [ErpService],
})
export class ErpModule {}
