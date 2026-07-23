import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DiagnosticUnitsController } from './diagnostic_units.controller';
import { DiagnosticUnitsService } from './diagnostic_units.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [DiagnosticUnitsController],
  providers: [DiagnosticUnitsService],
})
export class DiagnosticUnitsModule {}
