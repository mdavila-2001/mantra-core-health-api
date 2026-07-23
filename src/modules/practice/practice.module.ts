import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
