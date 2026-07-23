import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClinicalController } from './clinical.controller';
import { ClinicalService } from './clinical.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ClinicalController],
  providers: [ClinicalService],
})
export class ClinicalModule {}
