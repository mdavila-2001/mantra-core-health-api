import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [EducationController],
  providers: [EducationService],
})
export class EducationModule {}
