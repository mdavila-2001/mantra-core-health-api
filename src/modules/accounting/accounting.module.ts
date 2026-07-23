import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AccountingController],
  providers: [AccountingService],
})
export class AccountingModule {}
