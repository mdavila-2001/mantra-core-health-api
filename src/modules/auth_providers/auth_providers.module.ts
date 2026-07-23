import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthProvidersController } from './auth_providers.controller';
import { AuthProvidersService } from './auth_providers.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AuthProvidersController],
  providers: [AuthProvidersService],
})
export class AuthProvidersModule {}
