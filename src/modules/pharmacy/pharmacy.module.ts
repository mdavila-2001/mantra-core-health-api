import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PharmacyController],
  providers: [PharmacyService],
})
export class PharmacyModule {}
