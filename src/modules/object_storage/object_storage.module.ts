import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ObjectStorageController } from './object_storage.controller';
import { ObjectStorageService } from './object_storage.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ObjectStorageController],
  providers: [ObjectStorageService],
})
export class ObjectStorageModule {}
