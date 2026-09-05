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

  /**
   * Las prácticas activas (`practice.practices.id`) de una organización.
   *
   * Puerto que necesita `insurance` (TAREA-16): el reclamo lo presenta una
   * práctica —`insurance_claims.billing_provider_entity_id`— y no tiene
   * `tenant_id` propio, así que acotar «los reclamos que envió mi
   * organización» exige saber primero cuáles son sus prácticas. Sin esto,
   * `insurance` tendría que importar la entidad persistente de `practice`.
   *
   * Devuelve la lista vacía cuando la organización no tiene ninguna práctica
   * activa: quién llama decide si eso es un listado vacío o un rechazo, porque
   * la respuesta correcta depende de su propio contrato.
   *
   * @param tenantId - Organización activa.
   * @returns Los ids de práctica activa de esa organización.
   */
  async findActivePracticeIdsForTenant(tenantId: string): Promise<string[]> {
    const practices = await this.practices.findByTenant(
      this.em.fork(),
      tenantId,
      PRAC.PRACTICE_ACTIVE,
    );
    return practices.map((practice) => practice.id);
  }

  /**
   * El tenant dueño de una práctica, o `null` si esa práctica no existe.
   *
   * La alternativa era `findActive()`, que trae **todas** las prácticas activas
   * para mirar una sola. Un dominio que sólo necesita acotar «esta práctica es
   * de mi organización» pregunta por esa práctica.
   */
  async findTenantOfPractice(practiceId: string): Promise<string | null> {
    const practice = await this.practices.findById(this.em.fork(), practiceId);
    return practice?.tenantId ?? null;
  }
}
