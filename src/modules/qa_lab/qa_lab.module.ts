import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { QaLabController } from './qa_lab.controller';
import { QaLabService } from './qa_lab.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [QaLabController],
  providers: [QaLabService],
})
export class QaLabModule {}
