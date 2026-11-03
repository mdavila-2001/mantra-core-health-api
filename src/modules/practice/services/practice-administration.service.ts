import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import type { Practices } from '../entities';
import { PracticesRepository } from '../repositories';
import { practiceOutOfScope } from './practice-scope';

/**
 * Decide quién administra el catálogo y las afiliaciones de una práctica.
 *
 * La regla es la de la organización dueña: pasa quien tiene un rol de plataforma
 * y quien es `OWNER` o `ADMIN` activo del tenant de **esa** práctica. El
 * administrador de otra organización recibe 403, no 404: ya conoce el uuid de la
 * práctica por la búsqueda pública y lo que se le niega es el permiso.
 */
@Injectable()
export class PracticeAdministrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practicesRepo - Repositorio de prácticas.
   * @param tenantAdministration - Regla de administración por organización.
   */
  constructor(
    private readonly practicesRepo: PracticesRepository,
    private readonly tenantAdministration: TenantAdministrationService,
  ) {}

  /**
   * Exige que el actor pueda administrar la organización dueña de la práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Práctica sobre la que se quiere operar.
   * @param actor - Quien pide la operación.
   * @returns La práctica, ya autorizada.
   * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`) si no existe.
   * @throws ForbiddenException si el actor no administra esa organización.
   */
  async assertCanAdministerPractice(
    em: EntityManager,
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<Practices> {
    const practice = await this.practicesRepo.findById(em, practiceId);
    if (!practice) throw practiceOutOfScope('Práctica no encontrada');
    await this.tenantAdministration.assertCanAdminister(
      em,
      practice.tenantId,
      actor,
    );
    return practice;
  }
}
