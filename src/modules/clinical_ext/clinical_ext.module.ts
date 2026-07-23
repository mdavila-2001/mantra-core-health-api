import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ClinicalExtController } from './clinical_ext.controller';
import { ClinicalExtService } from './clinical_ext.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ClinicalExtController],
  providers: [ClinicalExtService],
})
export class ClinicalExtModule {}
