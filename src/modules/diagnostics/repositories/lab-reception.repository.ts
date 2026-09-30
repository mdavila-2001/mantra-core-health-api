import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests } from '../../clinical/entities';
import { Tenants } from '../../directory/entities';
import {
  PatientProfiles,
  PersonProfiles,
  Persons,
} from '../../profiles/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { LaboratoryAccessions, Specimens } from '../entities';

/** Última fila de la página anterior: la clave del cursor keyset. */
export interface InboxAfterKey {
  /** Fecha de emisión de la última orden devuelta. */
  createdAt: Date;
  /** Identificador de la última orden devuelta (desempate). */
  id: string;
}

/** Lo que el mostrador pinta de un paciente. */
export interface InboxPatientLabel {
  /** Nombre pintable, si la persona tiene alguno. */
  displayName: string | null;
  /** Código de paciente (historia clínica), si tiene perfil de paciente. */
  patientCode: string | null;
}

/**
 * Lecturas de la bandeja de recepción de muestras.
 *
 * Sin estado y con el `EntityManager` por parámetro, igual que
 * `DiagnosticOrdersRepository`: la orden vive en `clinical`, el paciente en
 * `profiles` y la organización en `directory`, y esto sólo las lee.
 *
 * Todas las consultas son `em.find` por columnas indexadas y en lote —ninguna
 * por fila—: la bandeja pide un bloque de órdenes y resuelve todo lo demás
 * sobre los ids de ese bloque.
 */
@Injectable()
export class LabReceptionRepository {
  /**
   * Un bloque de órdenes dirigidas al laboratorio, de la más vieja a la más
   * nueva, a partir del cursor.
   *
   * Filtra por `performer_tenant_id` —el laboratorio al que se derivó la
   * orden—, no por `custodian_tenant_id`, que es la organización que la emitió.
   *
   * @param em - Contexto de persistencia.
   * @param performerTenantId - Laboratorio del contexto.
   * @param categoryConceptIds - Categorías con espécimen.
   * @param statusConceptId - Estado de orden vigente.
   * @param after - Última fila de la página anterior.
   * @param limit - Tope del bloque.
   * @returns Las órdenes del bloque.
   */
  findInboxCandidates(
    em: EntityManager,
    performerTenantId: string,
    categoryConceptIds: readonly string[],
    statusConceptId: string,
    after: InboxAfterKey | undefined,
    limit: number,
  ): Promise<ServiceRequests[]> {
    const where: Record<string, unknown> = {
      performerTenantId,
      categoryConceptId: { $in: [...categoryConceptIds] },
      statusConceptId,
    };
    if (after) {
      where.$or = [
        { createdAt: { $gt: after.createdAt } },
        { createdAt: after.createdAt, id: { $gt: after.id } },
      ];
    }
    return em.find(ServiceRequests, where, {
      orderBy: [{ createdAt: 'ASC' }, { id: 'ASC' }],
      limit,
    });
  }

  /**
   * Cuáles de estas órdenes ya tienen una acesión en este laboratorio: ésas
   * salieron de la recepción y están en la cola de trabajo.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Laboratorio del contexto.
   * @param serviceRequestIds - Órdenes del bloque.
   * @returns Los ids de orden ya acesionados.
   */
  async findAccessionedServiceRequestIds(
    em: EntityManager,
    custodianTenantId: string,
    serviceRequestIds: readonly string[],
  ): Promise<Set<string>> {
    if (serviceRequestIds.length === 0) return new Set();
    const accessions = await em.find(LaboratoryAccessions, {
      custodianTenantId,
      serviceRequestId: { $in: [...serviceRequestIds] },
    });
    return new Set(
      accessions
        .map((accession) => accession.serviceRequestId)
        .filter((id): id is string => typeof id === 'string'),
    );
  }

  /**
   * Especímenes que este laboratorio ya registró para estas órdenes.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Laboratorio del contexto.
   * @param serviceRequestIds - Órdenes de la página.
   * @returns Los especímenes, del más viejo al más nuevo.
   */
  findSpecimensForServiceRequests(
    em: EntityManager,
    custodianTenantId: string,
    serviceRequestIds: readonly string[],
  ): Promise<Specimens[]> {
    if (serviceRequestIds.length === 0) return Promise.resolve([]);
    return em.find(
      Specimens,
      {
        custodianTenantId,
        serviceRequestId: { $in: [...serviceRequestIds] },
      },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /**
   * Nombre y código de cada paciente, en lote.
   *
   * `patient_profile_id` es el id del `person_profiles` del paciente: de ahí
   * sale la persona (el nombre) y, del perfil de paciente, el código.
   *
   * @param em - Contexto de persistencia.
   * @param patientProfileIds - Perfiles de paciente.
   * @returns Mapa perfil → rótulo. Un perfil sin persona ni código no figura.
   */
  async findPatientLabels(
    em: EntityManager,
    patientProfileIds: readonly string[],
  ): Promise<Map<string, InboxPatientLabel>> {
    const labels = new Map<string, InboxPatientLabel>();
    if (patientProfileIds.length === 0) return labels;
    const ids = [...new Set(patientProfileIds)];

    const [profiles, patients] = await Promise.all([
      em.find(PersonProfiles, { id: { $in: ids } }),
      em.find(PatientProfiles, { profileId: { $in: ids } }),
    ]);
    const persons = profiles.length
      ? await em.find(Persons, {
          id: { $in: [...new Set(profiles.map((p) => p.personId))] },
        })
      : [];
    const personById = new Map(persons.map((person) => [person.id, person]));
    const codeByProfile = new Map(
      patients.map((patient) => [patient.profileId, patient.patientCode]),
    );

    for (const id of ids) {
      const profile = profiles.find((p) => p.id === id);
      const person = profile ? personById.get(profile.personId) : undefined;
      const displayName = person ? personDisplayName(person) : null;
      const patientCode = codeByProfile.get(id) ?? null;
      if (displayName !== null || patientCode !== null) {
        labels.set(id, { displayName, patientCode });
      }
    }
    return labels;
  }

  /**
   * Rótulos de conceptos (el nombre del estudio pedido), en lote.
   *
   * @param em - Contexto de persistencia.
   * @param conceptIds - Conceptos a nombrar.
   * @returns Mapa concepto → rótulo.
   */
  async findConceptDisplays(
    em: EntityManager,
    conceptIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (conceptIds.length === 0) return new Map();
    const concepts = await em.find(CatalogConcepts, {
      id: { $in: [...new Set(conceptIds)] },
    });
    return new Map(concepts.map((concept) => [concept.id, concept.display]));
  }

  /**
   * Nombre de cada organización que emitió una orden, en lote.
   *
   * @param em - Contexto de persistencia.
   * @param tenantIds - Organizaciones.
   * @returns Mapa tenant → nombre (comercial, o razón social).
   */
  async findTenantNames(
    em: EntityManager,
    tenantIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (tenantIds.length === 0) return new Map();
    const tenants = await em.find(Tenants, {
      id: { $in: [...new Set(tenantIds)] },
    });
    return new Map(
      tenants.map((tenant) => [
        tenant.id,
        tenant.tradeName || tenant.legalName,
      ]),
    );
  }
}

/** El nombre pintable de una persona: display, o nombre y apellidos. */
export function personDisplayName(person: Persons): string | null {
  if (person.displayName) return person.displayName;
  const composed = [person.name, person.lastName, person.motherLastName]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(' ')
    .trim();
  return composed === '' ? null : composed;
}
