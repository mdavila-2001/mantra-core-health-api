import { Module } from '@nestjs/common';
import { AlovidaStandardController } from './alovida-standard.controller';
import {
  PHARMACY_ERP_CLOCK,
  PharmacyCatalogService,
} from './pharmacy-catalog.service';
import { PharmacyErpController } from './pharmacy-erp.controller';
import { PharmacyErpService } from './pharmacy-erp.service';
import { SimulatedChainController } from './simulated-chain.controller';

@Module({
  controllers: [
    PharmacyErpController,
    AlovidaStandardController,
    SimulatedChainController,
  ],
  providers: [
    PharmacyErpService,
    PharmacyCatalogService,
    { provide: PHARMACY_ERP_CLOCK, useValue: () => new Date() },
  ],
})
export class PharmacyErpModule {}
