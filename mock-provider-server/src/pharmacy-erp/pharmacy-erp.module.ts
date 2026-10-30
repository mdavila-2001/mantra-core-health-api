import { Module } from '@nestjs/common';
import { PharmacyErpController } from './pharmacy-erp.controller';
import { PharmacyErpService } from './pharmacy-erp.service';

@Module({
  controllers: [PharmacyErpController],
  providers: [PharmacyErpService],
})
export class PharmacyErpModule {}
