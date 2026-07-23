import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
