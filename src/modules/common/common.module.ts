import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
