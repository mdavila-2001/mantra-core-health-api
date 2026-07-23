import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProceduresPerioperativeController } from './procedures_perioperative.controller';
import { ProceduresPerioperativeService } from './procedures_perioperative.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ProceduresPerioperativeController],
  providers: [ProceduresPerioperativeService],
})
export class ProceduresPerioperativeModule {}
