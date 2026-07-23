import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
