import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PharmacyInventoryController } from './pharmacy_inventory.controller';
import { PharmacyInventoryService } from './pharmacy_inventory.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PharmacyInventoryController],
  providers: [PharmacyInventoryService],
})
export class PharmacyInventoryModule {}
