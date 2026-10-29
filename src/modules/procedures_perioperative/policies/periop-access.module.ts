import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DirectoryAuthorizationModule } from '../../directory/directory-authorization.module';
import { BranchMembershipsRepository } from '../../directory/repositories/branch-memberships.repository';
import { SpaceRoleScopeService } from '../../delegated_access/services/space-role-scope.service';
import { CareSpaces, PracticeSites } from '../../practice/entities';
import { StructureAccessService } from '../../practice/services/structure-access.service';
import { OperatingRoomAccessService } from './operating-room-access.service';

/**
 * Acceso a los quirófanos (política de F4): lo comparten `procedures_perioperative` y
 * `scheduling` (vincular el quirófano como recurso agendable). Módulo propio y mínimo para
 * que ninguno de los dos importe al otro y para no editar `PracticeModule`: las clases que
 * junta no guardan estado (reciben el `EntityManager` por llamada), así que una instancia
 * más es la misma cosa que la de `practice`.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([CareSpaces, PracticeSites]),
    DirectoryAuthorizationModule,
  ],
  providers: [
    BranchMembershipsRepository,
    StructureAccessService,
    SpaceRoleScopeService,
    OperatingRoomAccessService,
  ],
  exports: [OperatingRoomAccessService, SpaceRoleScopeService],
})
export class PeriopAccessModule {}
