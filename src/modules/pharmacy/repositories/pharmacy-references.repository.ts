import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InsuranceCarriers } from '../../insurance/entities';
import { PracticeSites, Practices } from '../../practice/entities';
import { PharmacySites } from '../entities';

/**
 * Comprobaciones de propiedad de las referencias que un cuerpo de escritura
 * trae hacia otros agregados (sede de la farmacia, sede de la práctica,
 * aseguradora). Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class PharmacyReferencesRepository {
  /** Busca una sede dispensadora dentro de una farmacia; `null` si no es de ella. */
  findPharmacySiteInPharmacy(
    em: EntityManager,
    pharmacySiteId: string,
    pharmacyId: string,
  ): Promise<PharmacySites | null> {
    return em.findOne(PharmacySites, { id: pharmacySiteId, pharmacyId });
  }

  /**
   * Si la sede de práctica pertenece a una práctica del tenant. La sede sólo
   * lleva `practice_id`: el dueño es el `tenant_id` de la práctica.
   */
  async practiceSiteBelongsToTenant(
    em: EntityManager,
    practiceSiteId: string,
    tenantId: string,
  ): Promise<boolean> {
    const site = await em.findOne(PracticeSites, { id: practiceSiteId });
    if (!site) return false;
    const practice = await em.findOne(Practices, {
      id: site.practiceId,
      tenantId,
    });
    return practice !== null;
  }

  /** Si el tenant está registrado como aseguradora (`insurance_carriers`). */
  async isRegisteredInsurer(
    em: EntityManager,
    insurerTenantId: string,
  ): Promise<boolean> {
    const count = await em.count(InsuranceCarriers, {
      tenantId: insurerTenantId,
    });
    return count > 0;
  }
}
