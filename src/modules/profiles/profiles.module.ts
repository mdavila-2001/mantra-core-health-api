import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
