import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
