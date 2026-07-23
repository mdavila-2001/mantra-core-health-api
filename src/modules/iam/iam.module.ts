import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [IamController],
  providers: [IamService],
})
export class IamModule {}
