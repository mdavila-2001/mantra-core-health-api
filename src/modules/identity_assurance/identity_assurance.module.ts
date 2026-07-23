import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { IdentityAssuranceController } from './identity_assurance.controller';
import { IdentityAssuranceService } from './identity_assurance.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [IdentityAssuranceController],
  providers: [IdentityAssuranceService],
})
export class IdentityAssuranceModule {}
