import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
