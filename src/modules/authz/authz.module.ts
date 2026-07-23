import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthzController } from './authz.controller';
import { AuthzService } from './authz.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AuthzController],
  providers: [AuthzService],
})
export class AuthzModule {}
