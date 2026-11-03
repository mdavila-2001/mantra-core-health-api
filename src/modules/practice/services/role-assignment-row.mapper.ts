import type { EntityManager } from '@mikro-orm/postgresql';
import { findPractitionerNames } from '../../profiles/infrastructure/read-models/practitioner-names';
import { PersonAccountLinks } from '../../profiles/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { PRACTICE_CONCEPT_SEEDS, PRAC } from '../practice.concepts';
import type { RoleAssignmentRowDto } from '../dto/role-assignment-row.dto';
import {
  HealthcareServices,
  type PractitionerRoleAssignments,
} from '../entities';

/** Nombre que se muestra cuando el profesional no tiene nombre cargado. */
const UNNAMED_PRACTITIONER = '(profesional sin nombre)';

/**
 * Código de cada concepto de estado de la vinculación (`ROLE_ASG_ACTIVE`, …),
 * indexado por su uuid. Sale de las mismas definiciones que siembran los
 * conceptos, así que un estado nuevo en `practice.concepts.ts` aparece solo.
 */
export const ROLE_ASSIGNMENT_STATUS_CODES: ReadonlyMap<string, string> =
  new Map(
    PRACTICE_CONCEPT_SEEDS.filter((seed) =>
      seed.key.startsWith('practice:ROLE_ASSIGNMENT_'),
    ).map((seed) => [
      PRAC[seed.key.slice('practice:'.length) as keyof typeof PRAC],
      seed.code,
    ]),
  );

/** Lo que hay que haber leído para armar las filas de un lote de vinculaciones. */
export interface RoleAssignmentRowContext {
  /** Nombre de cada profesional, por `practitionerProfileId`. */
  practitionerNames: ReadonlyMap<string, string>;
  /** Cuentas de usuario de cada profesional, por `practitionerProfileId`. */
  practitionerUserIds: ReadonlyMap<string, ReadonlySet<string>>;
  /** Procedimiento de cada servicio, por `healthcareServiceId`. */
  serviceConceptIds: ReadonlyMap<string, string>;
  /** Nombre de cada procedimiento, por concepto. */
  conceptDisplays: ReadonlyMap<string, string>;
}

/**
 * Arma la fila de una vinculación tal como la ven el centro y el profesional.
 *
 * Es pura: todo lo que no está en la vinculación llega en `context`.
 *
 * @param role - Vinculación.
 * @param context - Lecturas por lote ({@link loadRoleAssignmentRowContext}).
 * @returns La fila, sin campo `status`: el estado viaja como concepto y código.
 */
export function toRoleAssignmentRow(
  role: PractitionerRoleAssignments,
  context: RoleAssignmentRowContext,
): RoleAssignmentRowDto {
  const serviceConceptId = role.healthcareServiceId
    ? (context.serviceConceptIds.get(role.healthcareServiceId) ?? null)
    : null;
  const ownAccounts = context.practitionerUserIds.get(
    role.practitionerProfileId,
  );
  const createdByPractitioner =
    role.createdByUserId !== undefined &&
    (ownAccounts?.has(role.createdByUserId) ?? false);
  return {
    id: role.id,
    practitionerProfileId: role.practitionerProfileId,
    practitionerName:
      context.practitionerNames.get(role.practitionerProfileId) ??
      UNNAMED_PRACTITIONER,
    practiceId: role.practiceId,
    practiceSiteId: role.practiceSiteId ?? null,
    healthcareServiceId: role.healthcareServiceId ?? null,
    serviceConceptId,
    serviceDisplay: serviceConceptId
      ? (context.conceptDisplays.get(serviceConceptId) ?? null)
      : null,
    statusConceptId: role.statusConceptId,
    statusCode: ROLE_ASSIGNMENT_STATUS_CODES.get(role.statusConceptId) ?? '',
    initiatedBy: createdByPractitioner ? 'PRACTITIONER' : 'PRACTICE',
  };
}

/**
 * Lee, en una consulta por tabla, todo lo que las filas de un lote necesitan.
 *
 * @param em - Contexto de persistencia o transacción activa.
 * @param roles - Vinculaciones del lote.
 * @returns El contexto para {@link toRoleAssignmentRow}.
 */
export async function loadRoleAssignmentRowContext(
  em: EntityManager,
  roles: readonly PractitionerRoleAssignments[],
): Promise<RoleAssignmentRowContext> {
  const profileIds = [...new Set(roles.map((r) => r.practitionerProfileId))];
  const serviceIds = [
    ...new Set(
      roles
        .map((r) => r.healthcareServiceId)
        .filter((id): id is string => id !== undefined && id !== null),
    ),
  ];

  const [practitionerNames, links, services] = await Promise.all([
    findPractitionerNames(em, profileIds),
    profileIds.length === 0
      ? Promise.resolve([] as PersonAccountLinks[])
      : em.find(PersonAccountLinks, { personId: { $in: profileIds } }),
    serviceIds.length === 0
      ? Promise.resolve([] as HealthcareServices[])
      : em.find(HealthcareServices, { id: { $in: serviceIds } }),
  ]);

  const practitionerUserIds = new Map<string, Set<string>>();
  for (const link of links) {
    const accounts = practitionerUserIds.get(link.personId) ?? new Set();
    accounts.add(link.userId);
    practitionerUserIds.set(link.personId, accounts);
  }

  const serviceConceptIds = new Map(
    services.map((service) => [service.id, service.serviceConceptId] as const),
  );
  const conceptIds = [...new Set(serviceConceptIds.values())];
  const concepts =
    conceptIds.length === 0
      ? []
      : await em.find(CatalogConcepts, { id: { $in: conceptIds } });

  return {
    practitionerNames,
    practitionerUserIds,
    serviceConceptIds,
    conceptDisplays: new Map(concepts.map((c) => [c.id, c.display] as const)),
  };
}
