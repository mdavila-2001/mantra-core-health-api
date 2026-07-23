import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
