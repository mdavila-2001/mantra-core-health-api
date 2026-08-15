import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PracticesRepository,
  PractitionerRoleAssignmentsRepository,
} from '../repositories';
import { PRAC } from '../practice.concepts';

/** Proyección mínima compartida con dominios que necesitan agrupar por tenant. */
export interface ActivePracticeTenant {
  id: string;
  tenantId: string;
}

/**
 * Puerto de lectura público de Practice. Evita que otros dominios importen la
 * entidad persistente `Practices` o registren metadata ORM ajena.
 */
@Injectable()
export class PracticeTenantLookupService {
  constructor(
    private readonly em: EntityManager,
    private readonly practices: PracticesRepository,
    private readonly roleAssignments: PractitionerRoleAssignmentsRepository,
  ) {}

  /** Devuelve sólo id y tenant de las prácticas en el estado solicitado. */
  async findActive(
    activeStatusConceptId: string,
  ): Promise<ActivePracticeTenant[]> {
    const practices = await this.practices.findActive(
      this.em,
      activeStatusConceptId,
    );
    return practices.map(({ id, tenantId }) => ({ id, tenantId }));
  }

  /**
   * Las organizaciones (`practice.practices.id`) donde un profesional tiene
   * una vinculación ACTIVE vigente hoy (`validTo` nulo).
   *
   * Puerto que necesita `accounting` (Carril 18): un profesional solo puede
   * registrar movimientos contables de una práctica a la que pertenece — sin
   * esto, no había forma de comprobarlo sin que `accounting` importara la
   * entidad persistente de `practice`.
   */
  async findActivePracticeIdsForPractitioner(
    practitionerProfileId: string,
  ): Promise<string[]> {
    const assignments = await this.roleAssignments.findActiveByPractitioner(
      this.em.fork(),
      practitionerProfileId,
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
    );
    return [...new Set(assignments.map((a) => a.practiceId))];
  }
}
