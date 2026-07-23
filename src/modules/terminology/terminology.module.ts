import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TerminologyController } from './terminology.controller';
import { TerminologyService } from './terminology.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [TerminologyController],
  providers: [TerminologyService],
})
export class TerminologyModule {}
