import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DelegatedAccessController } from './delegated_access.controller';
import { DelegatedAccessService } from './delegated_access.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [DelegatedAccessController],
  providers: [DelegatedAccessService],
})
export class DelegatedAccessModule {}
