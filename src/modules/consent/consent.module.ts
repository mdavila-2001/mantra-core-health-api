import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ConsentController],
  providers: [ConsentService],
})
export class ConsentModule {}
