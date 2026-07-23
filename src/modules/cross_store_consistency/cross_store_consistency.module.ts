import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CrossStoreConsistencyController } from './cross_store_consistency.controller';
import { CrossStoreConsistencyService } from './cross_store_consistency.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [CrossStoreConsistencyController],
  providers: [CrossStoreConsistencyService],
})
export class CrossStoreConsistencyModule {}
