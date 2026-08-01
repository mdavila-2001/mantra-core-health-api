import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PracticesRepository } from '../repositories';

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
}
