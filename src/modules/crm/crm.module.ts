import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [CrmController],
  providers: [CrmService],
})
export class CrmModule {}
