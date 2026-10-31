import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Files } from '../../common/entities';
import { PublicProfiles } from '../../community/entities';
import {
  ClinicalUnits,
  HealthcareServices,
  PracticeSites,
  Practices,
} from '../../practice/entities';
import { DataUseAgreements } from '../entities';

/**
 * Pertenencia de los UUID ajenos que llegan en el cuerpo (práctica, sede,
 * servicio, unidad, perfil público, archivo, acuerdo de uso de datos).
 *
 * Cada método responde si el recurso existe **y** su dueño está entre los
 * tenants indicados: la práctica y el archivo llevan `tenant_id`; la sede, el
 * servicio y la unidad heredan el tenant de su práctica. Stateless: recibe el
 * `EntityManager` activo en cada llamada.
 */
@Injectable()
export class OrgextReferencesRepository {
  /** La práctica es de alguno de los tenants. */
  async practiceInTenants(
    em: EntityManager,
    practiceId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    return (
      (await em.count(Practices, {
        id: practiceId,
        tenantId: { $in: [...tenantIds] },
      })) > 0
    );
  }

  /** La sede cuelga de una práctica de alguno de los tenants. */
  async practiceSiteInTenants(
    em: EntityManager,
    practiceSiteId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    const site = await em.findOne(PracticeSites, { id: practiceSiteId });
    return site
      ? this.practiceInTenants(em, site.practiceId, tenantIds)
      : false;
  }

  /** El servicio de salud cuelga de una práctica de alguno de los tenants. */
  async healthcareServiceInTenants(
    em: EntityManager,
    healthcareServiceId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    const service = await em.findOne(HealthcareServices, {
      id: healthcareServiceId,
    });
    return service
      ? this.practiceInTenants(em, service.practiceId, tenantIds)
      : false;
  }

  /** La unidad clínica está en una sede de una práctica de alguno de los tenants. */
  async clinicalUnitInTenants(
    em: EntityManager,
    clinicalUnitId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    const unit = await em.findOne(ClinicalUnits, { id: clinicalUnitId });
    return unit
      ? this.practiceSiteInTenants(em, unit.practiceSiteId, tenantIds)
      : false;
  }

  /** El perfil público es de alguno de los tenants. */
  async publicProfileInTenants(
    em: EntityManager,
    publicProfileId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    return (
      (await em.count(PublicProfiles, {
        id: publicProfileId,
        tenantId: { $in: [...tenantIds] },
      })) > 0
    );
  }

  /** El archivo es de alguno de los tenants. */
  async fileInTenants(
    em: EntityManager,
    fileId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    return (
      (await em.count(Files, {
        id: fileId,
        tenantId: { $in: [...tenantIds] },
      })) > 0
    );
  }

  /** El acuerdo de uso de datos es de alguno de los tenants. */
  async dataUseAgreementInTenants(
    em: EntityManager,
    dataUseAgreementId: string,
    tenantIds: readonly string[],
  ): Promise<boolean> {
    return (
      (await em.count(DataUseAgreements, {
        id: dataUseAgreementId,
        tenantId: { $in: [...tenantIds] },
      })) > 0
    );
  }
}
