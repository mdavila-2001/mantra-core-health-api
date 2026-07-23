import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
