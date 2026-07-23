import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
