import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PolyglotStorageController } from './polyglot_storage.controller';
import { PolyglotStorageService } from './polyglot_storage.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PolyglotStorageController],
  providers: [PolyglotStorageService],
})
export class PolyglotStorageModule {}
