import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [InsuranceController],
  providers: [InsuranceService],
})
export class InsuranceModule {}
