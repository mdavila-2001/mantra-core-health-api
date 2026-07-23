import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GraphIntelligenceController } from './graph_intelligence.controller';
import { GraphIntelligenceService } from './graph_intelligence.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [GraphIntelligenceController],
  providers: [GraphIntelligenceService],
})
export class GraphIntelligenceModule {}
