import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  TenantMedicalFacilities,
  TenantMedicalFacilitySites,
} from '../entities';

/** El director médico tal como se persiste en la fila del establecimiento. */
export interface MedicalDirectorData {
  readonly name: string;
  readonly middleName?: string;
  readonly lastName: string;
  readonly motherLastName?: string;
  readonly professionalLicenseNumber: string;
  readonly email: string;
  readonly phone?: string;
}

/** Datos para registrar el establecimiento médico declarado por un tenant. */
export interface CreateMedicalFacilityData {
  readonly tenantId: string;
  readonly taxIdentifierNumber: string;
  readonly healthFacilityRegistrationNumber: string;
  readonly medicalDirector: MedicalDirectorData;
  readonly actorUserId?: string;
}

/** Datos para registrar una sede declarada (casa central o sucursal). */
export interface CreateMedicalFacilitySiteData {
  readonly tenantId: string;
  readonly medicalFacilityId: string;
  readonly siteKind: 'headquarters' | 'branch';
  /** 0 para la casa central; 1..50 para las sucursales, en orden de declaración. */
  readonly ordinal: number;
  readonly name: string;
  readonly addressLines: readonly string[];
  readonly latitude?: number;
  readonly longitude?: number;
  readonly actorUserId?: string;
}

/**
 * Acceso a datos de `directory.tenant_medical_facilities` y de
 * `directory.tenant_medical_facility_sites`. Stateless: la unidad de trabajo se
 * recibe siempre por parámetro.
 */
@Injectable()
export class TenantMedicalFacilitiesRepository {
  /** El establecimiento declarado por el tenant, si lo declaró. */
  findByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<TenantMedicalFacilities | null> {
    return em.findOne(TenantMedicalFacilities, { tenantId });
  }

  /** Las sedes declaradas del establecimiento, la central primero. */
  listSites(
    em: EntityManager,
    medicalFacilityId: string,
  ): Promise<TenantMedicalFacilitySites[]> {
    return em.find(
      TenantMedicalFacilitySites,
      { medicalFacilityId },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /** Crea el establecimiento en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateMedicalFacilityData,
  ): TenantMedicalFacilities {
    const director = data.medicalDirector;
    return em.create(
      TenantMedicalFacilities,
      {
        tenantId: data.tenantId,
        taxIdentifierNumber: data.taxIdentifierNumber,
        healthFacilityRegistrationNumber: data.healthFacilityRegistrationNumber,
        medicalDirectorName: director.name,
        medicalDirectorMiddleName: director.middleName,
        medicalDirectorLastName: director.lastName,
        medicalDirectorMotherLastName: director.motherLastName,
        medicalDirectorLicenseNumber: director.professionalLicenseNumber,
        medicalDirectorEmail: director.email,
        medicalDirectorPhone: director.phone,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea una sede declarada en la unidad de trabajo (sin flush).
   *
   * Las coordenadas se guardan como texto: la columna es `numeric` y la
   * entidad la mapea como `string`, igual que `directory.branches`.
   */
  createSite(
    em: EntityManager,
    data: CreateMedicalFacilitySiteData,
  ): TenantMedicalFacilitySites {
    return em.create(
      TenantMedicalFacilitySites,
      {
        tenantId: data.tenantId,
        medicalFacilityId: data.medicalFacilityId,
        siteKind: data.siteKind,
        ordinal: data.ordinal,
        name: data.name,
        addressLines: [...data.addressLines],
        latitude:
          data.latitude !== undefined ? String(data.latitude) : undefined,
        longitude:
          data.longitude !== undefined ? String(data.longitude) : undefined,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
