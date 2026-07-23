import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OrganizationExtensionsController } from './organization_extensions.controller';
import { OrganizationExtensionsService } from './organization_extensions.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [OrganizationExtensionsController],
  providers: [OrganizationExtensionsService],
})
export class OrganizationExtensionsModule {}
