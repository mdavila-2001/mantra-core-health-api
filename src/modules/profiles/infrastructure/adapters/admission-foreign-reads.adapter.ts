import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common';
import {
  Addresses,
  ContactPoints,
  Files,
  FileVersions,
  Identifiers,
} from '../../../common/entities';
import { Users } from '../../../iam/entities';
import {
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../../practice/entities';
import { CatalogConcepts } from '../../../terminology/entities';
import type {
  AdmissionFileFacts,
  AdmissionForeignReadsPort,
  ForeignAddress,
  ForeignContactPoint,
  ForeignNationalId,
  ForeignPracticeSite,
} from '../../application/ports/admission-foreign-reads.port';

const uniqueIds = (ids: ReadonlyArray<string | undefined | null>): string[] => [
  ...new Set(ids.filter((id): id is string => !!id)),
];

/**
 * Las lecturas de otros contextos que necesita la admisión, en un solo lugar de
 * `infrastructure/`: la aplicación no importa entidades ajenas.
 */
@Injectable()
export class AdmissionForeignReadsAdapter implements AdmissionForeignReadsPort {
  async conceptNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>> {
    const unique = uniqueIds(ids);
    if (unique.length === 0) return new Map();
    const rows = await em.find(
      CatalogConcepts,
      { id: { $in: unique } },
      { fields: ['id', 'display'] },
    );
    return new Map(rows.map((r) => [r.id, r.display]));
  }

  async userNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>> {
    const unique = uniqueIds(ids);
    if (unique.length === 0) return new Map();
    const users = await em.find(
      Users,
      { id: { $in: unique } },
      { fields: ['id', 'displayName'] },
    );
    return new Map(users.map((u) => [u.id, u.displayName]));
  }

  async userExists(em: EntityManager, userId: string): Promise<boolean> {
    return (await em.count(Users, { id: userId })) > 0;
  }

  async fileFacts(
    em: EntityManager,
    fileIds: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, AdmissionFileFacts>> {
    const ids = uniqueIds(fileIds);
    const result = new Map<string, AdmissionFileFacts>();
    if (ids.length === 0) return result;
    const files = await em.find(Files, { id: { $in: ids } });
    const versionIds = files
      .map((f) => f.currentVersionId)
      .filter((id): id is string => !!id);
    const versions = versionIds.length
      ? await em.find(FileVersions, { id: { $in: versionIds } })
      : [];
    const versionById = new Map(versions.map((v) => [v.id, v]));
    for (const file of files) {
      const version = file.currentVersionId
        ? versionById.get(file.currentVersionId)
        : undefined;
      result.set(file.id, {
        id: file.id,
        name: file.originalName ?? 'documento',
        mimeType: version?.mimeType ?? 'application/octet-stream',
        sizeBytes: version ? Number(version.sizeBytes) : 0,
        uploadedAt: version?.uploadedAt ?? file.createdAt,
        contentHash: version?.contentHash,
      });
    }
    return result;
  }

  async nationalIds(
    em: EntityManager,
    ownerIds: readonly string[],
  ): Promise<Map<string, ForeignNationalId>> {
    const result = new Map<string, ForeignNationalId>();
    if (ownerIds.length === 0) return result;
    const rows = await em.find(Identifiers, {
      ownerId: { $in: [...ownerIds] },
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
    });
    for (const row of rows) {
      if (result.has(row.ownerId)) continue;
      result.set(row.ownerId, {
        ownerId: row.ownerId,
        value: row.value,
        issuerAdministrativeAreaConceptId:
          row.issuerAdministrativeAreaConceptId ?? null,
      });
    }
    return result;
  }

  async contactPoints(
    em: EntityManager,
    ownerId: string,
  ): Promise<ForeignContactPoint[]> {
    const rows = await em.find(ContactPoints, { ownerId });
    return rows.map((c) => ({
      systemConceptId: c.systemConceptId,
      useConceptId: c.useConceptId,
      value: c.value,
    }));
  }

  async addresses(
    em: EntityManager,
    ownerId: string,
  ): Promise<ForeignAddress[]> {
    const rows = await em.find(Addresses, { ownerId });
    return rows.map((a) => ({
      useConceptId: a.useConceptId,
      lines: a.lines,
      districtText: a.districtText,
      city: a.city,
      municipalityConceptId: a.municipalityConceptId,
      administrativeAreaConceptId: a.administrativeAreaConceptId,
      latitude: a.latitude,
      longitude: a.longitude,
    }));
  }

  async practiceSites(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<ForeignPracticeSite[]> {
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
    });
    const siteIds = uniqueIds(roles.map((r) => r.practiceSiteId));
    if (siteIds.length === 0) return [];
    const sites = await em.find(PracticeSites, { id: { $in: siteIds } });
    const addressIds = uniqueIds(sites.map((s) => s.addressId));
    const addresses = addressIds.length
      ? await em.find(Addresses, { id: { $in: addressIds } })
      : [];
    const addressById = new Map(addresses.map((a) => [a.id, a]));
    return sites
      .map((site) => {
        const address = site.addressId
          ? addressById.get(site.addressId)
          : undefined;
        return {
          id: site.id,
          name: site.name,
          address: address?.lines ?? null,
          latitude: address?.latitude ?? null,
          longitude: address?.longitude ?? null,
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }
}
