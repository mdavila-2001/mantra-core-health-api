import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from './directory.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [DirectoryController],
  providers: [DirectoryService],
})
export class DirectoryModule {}
