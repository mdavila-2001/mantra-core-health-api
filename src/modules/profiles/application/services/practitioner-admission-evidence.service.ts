import { createHash } from 'node:crypto';
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
import { CatalogConcepts } from '../../../terminology/entities';
import {
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../../practice/entities';
import {
  JurisdictionAuthorizations,
  Persons,
  PractitionerSpecialties,
  ProfessionalCredentials,
} from '../../entities';
import {
  credentialSubtype,
  licenseSubtype,
  resolveProfessionGroup,
  type AdmissionItemType,
  type ProfessionGroup,
} from '../../domain/admissions/admission-requirements.catalog';

/** Un ítem tal como está hoy en la ficha del profesional. */
export interface LiveAdmissionItem {
  readonly itemType: AdmissionItemType;
  readonly itemSubtype?: string;
  readonly itemId: string;
  /** Texto corto para el checklist («Matrícula 12345 — Ministerio de Salud»). */
  readonly label: string;
  readonly fileId?: string;
  /** Estado de la ficha (concepto), para saber si ya fue resuelta. */
  readonly entityStateConceptId?: string;
  /** Huella de lo revisable: cambia si cambia el dato o el archivo. */
  readonly evidenceSha256: string;
}

/** Lo que el profesional tiene hoy y se revisa, más su grupo profesional. */
export interface LiveAdmissionEvidence {
  readonly items: LiveAdmissionItem[];
  readonly professionGroup: ProfessionGroup;
}

/** Datos de un archivo que acompaña a una admisión. */
export interface AdmissionFileFacts {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly uploadedAt: Date;
  readonly contentHash?: string;
}

/** Punto GPS declarado. */
export interface GpsPoint {
  readonly lat: number;
  readonly lng: number;
}

/** El formulario tal como lo envió el médico. */
export interface SubmittedForm {
  readonly personal: {
    readonly requirementCode: 'CI';
    readonly firstName: string | null;
    readonly middleName: string | null;
    readonly paternalLastName: string | null;
    readonly maternalLastName: string | null;
    readonly nationalId: string | null;
    readonly nationalIdIssuer: string | null;
    readonly birthDate: string | null;
    readonly age: number | null;
    readonly occupation: string | null;
  };
  readonly contact: {
    readonly personalMobile: string | null;
    readonly personalEmail: string | null;
    readonly workMobile: string | null;
    readonly workPhone: string | null;
    readonly workEmail: string | null;
  };
  readonly addresses: {
    readonly home: SubmittedAddress | null;
    readonly work: SubmittedAddress | null;
  };
  readonly licenses: ReadonlyArray<{
    readonly id: string;
    readonly requirementCode: string;
    readonly number: string;
    readonly jurisdiction: string | null;
    readonly authority: string | null;
    readonly validFrom: string | null;
    readonly validTo: string | null;
    readonly fileId: string | null;
  }>;
  readonly education: ReadonlyArray<{
    readonly id: string;
    readonly requirementCode: string;
    readonly level: string;
    readonly title: string | null;
    readonly institution: string | null;
    readonly year: number | null;
    readonly number: string;
    readonly fileId: string | null;
  }>;
  readonly specialties: ReadonlyArray<{
    readonly id: string;
    readonly requirementCode: 'ESPECIALIDADES_DECLARADAS';
    readonly name: string | null;
    readonly isPrimary: boolean;
    readonly supportingCredentialId: string | null;
  }>;
  readonly practices: ReadonlyArray<{
    readonly id: string;
    readonly requirementCode: 'UBICACION_CONSULTORIOS';
    readonly name: string;
    readonly address: string | null;
    readonly gps: GpsPoint | null;
  }>;
}

/** Domicilio declarado. */
export interface SubmittedAddress {
  readonly lines: string | null;
  readonly locality: string | null;
  readonly department: string | null;
  readonly gps: GpsPoint | null;
}

const REQUIREMENT_BY_SUBTYPE: Readonly<Record<string, string>> = {
  DEGREE: 'TITULO_UNIVERSITARIO',
  DIPLOMA: 'DIPLOMADO',
  MASTER: 'MAESTRIA',
  DOCTORATE: 'DOCTORADO',
  SPECIALTY: 'TITULO_ESPECIALIDAD',
};

const LEVEL_BY_SUBTYPE: Readonly<Record<string, string>> = {
  DEGREE: 'Título universitario',
  DIPLOMA: 'Diplomado',
  MASTER: 'Maestría',
  DOCTORATE: 'Doctorado',
  SPECIALTY: 'Especialidad',
};

/** SHA-256 hexadecimal de un valor serializable de forma canónica (claves ordenadas). */
export function sha256Of(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
    .join(',')}}`;
}

function asDateString(value: Date | string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

function ageOn(birth: string | null, now: Date): number | null {
  if (!birth) return null;
  const [y, m, d] = birth.split('-').map(Number);
  if (!y || !m || !d) return null;
  let age = now.getUTCFullYear() - y;
  const hadBirthday =
    now.getUTCMonth() + 1 > m || (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : null;
}

function toGps(lat?: string | null, lng?: string | null): GpsPoint | null {
  if (lat == null || lng == null) return null;
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) ? { lat: la, lng: ln } : null;
}

/**
 * Lo que se revisa en una admisión y cómo se ve lo que el médico envió.
 *
 * Sin dependencias de otros servicios: sólo lee con el `EntityManager` que
 * recibe, así que sirve igual dentro de la transacción del alta, del reenvío o
 * de una lectura.
 */
@Injectable()
export class PractitionerAdmissionEvidenceService {
  /** Resuelve el nombre legible de varios conceptos de catálogo. */
  private async conceptNames(
    em: EntityManager,
    ids: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    if (unique.length === 0) return new Map();
    const rows = await em.find(
      CatalogConcepts,
      { id: { $in: unique } },
      { fields: ['id', 'display'] },
    );
    return new Map(rows.map((r) => [r.id, r.display]));
  }

  /** Los datos de varios archivos (nombre, tipo, tamaño, fecha, huella). */
  async fileFacts(
    em: EntityManager,
    fileIds: ReadonlyArray<string | undefined | null>,
  ): Promise<Map<string, AdmissionFileFacts>> {
    const ids = [...new Set(fileIds.filter((id): id is string => !!id))];
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

  /** Los ítems que hoy tiene el profesional y que la admisión revisa. */
  async collect(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<LiveAdmissionEvidence> {
    const [licenses, credentials, specialties, person, identifier] =
      await Promise.all([
        em.find(JurisdictionAuthorizations, { practitionerProfileId }),
        em.find(ProfessionalCredentials, { practitionerProfileId }),
        em.find(PractitionerSpecialties, {
          practitionerProfileId,
          validTo: null,
        }),
        em.findOne(Persons, { id: practitionerProfileId }),
        em.findOne(Identifiers, {
          ownerId: practitionerProfileId,
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        }),
      ]);

    const fileIds = [
      ...licenses.map((l) => l.fileId),
      ...credentials.map((c) => c.fileId),
    ];
    const facts = await this.fileFacts(em, fileIds);
    const names = await this.conceptNames(em, [
      ...licenses.map((l) => l.jurisdictionConceptId),
      ...credentials.map((c) => c.professionConceptId),
      ...specialties.map((s) => s.specialtyConceptId),
    ]);

    const fileSha = (fileId?: string) =>
      fileId ? (facts.get(fileId)?.contentHash ?? null) : null;

    const items: LiveAdmissionItem[] = [];
    for (const l of licenses) {
      items.push({
        itemType: 'LICENSE',
        itemSubtype: licenseSubtype(l.jurisdictionConceptId),
        itemId: l.id,
        label: `Matrícula ${l.licenseNumber}`,
        fileId: l.fileId ?? undefined,
        entityStateConceptId: l.stateConceptId,
        evidenceSha256: sha256Of({
          number: l.licenseNumber,
          jurisdiction: l.jurisdictionConceptId,
          authority: l.regulatoryAuthority,
          validFrom: asDateString(l.validFrom),
          validTo: asDateString(l.validTo),
          fileId: l.fileId,
          fileSha: fileSha(l.fileId),
        }),
      });
    }
    for (const c of credentials) {
      const subtype = credentialSubtype(c.credentialTypeConceptId);
      items.push({
        itemType: 'CREDENTIAL',
        itemSubtype: subtype,
        itemId: c.id,
        label: `${LEVEL_BY_SUBTYPE[subtype]}${c.titleText ? `: ${c.titleText}` : ` ${c.number}`}`,
        fileId: c.fileId ?? undefined,
        entityStateConceptId: c.stateConceptId,
        evidenceSha256: sha256Of({
          type: c.credentialTypeConceptId,
          number: c.number,
          title: c.titleText,
          institution: c.issuingInstitutionText,
          issueDate: asDateString(c.issueDate),
          profession: c.professionConceptId,
          fileId: c.fileId,
          fileSha: fileSha(c.fileId),
        }),
      });
    }
    for (const s of specialties) {
      items.push({
        itemType: 'SPECIALTY',
        itemId: s.id,
        label: names.get(s.specialtyConceptId) ?? 'Especialidad',
        entityStateConceptId: s.verificationStatusConceptId,
        evidenceSha256: sha256Of({
          specialty: s.specialtyConceptId,
          supporting: s.supportingCredentialId,
          primary: s.isPrimary,
        }),
      });
    }
    items.push({
      itemType: 'PROFILE',
      itemSubtype: 'IDENTITY',
      itemId: practitionerProfileId,
      label: 'Cédula de identidad y datos personales',
      evidenceSha256: sha256Of({
        nationalId: identifier?.value,
        issuer: identifier?.issuerAdministrativeAreaConceptId,
        name: person?.name,
        middle: person?.middleName,
        last: person?.lastName,
        mother: person?.motherLastName,
        birth: asDateString(person?.birthDate),
      }),
    });
    const sites = await this.practiceSites(em, practitionerProfileId);
    if (sites.length > 0) {
      items.push({
        itemType: 'PROFILE',
        itemSubtype: 'PRACTICE_SITES',
        itemId: practitionerProfileId,
        label: 'Ubicación de los consultorios de atención',
        evidenceSha256: sha256Of(sites),
      });
    }

    return {
      items,
      professionGroup: resolveProfessionGroup([
        ...credentials.map((c) => names.get(c.professionConceptId ?? '')),
        ...credentials.map((c) => c.titleText),
      ]),
    };
  }

  private async practiceSites(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<Array<{ id: string; name: string; address: string | null; gps: GpsPoint | null }>> {
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
    });
    const siteIds = [
      ...new Set(roles.map((r) => r.practiceSiteId).filter((id): id is string => !!id)),
    ];
    if (siteIds.length === 0) return [];
    const sites = await em.find(PracticeSites, { id: { $in: siteIds } });
    const addressIds = sites
      .map((s) => s.addressId)
      .filter((id): id is string => !!id);
    const addresses = addressIds.length
      ? await em.find(Addresses, { id: { $in: addressIds } })
      : [];
    const addressById = new Map(addresses.map((a) => [a.id, a]));
    return sites
      .map((site) => {
        const address = site.addressId ? addressById.get(site.addressId) : undefined;
        return {
          id: site.id,
          name: site.name,
          address: address?.lines ?? null,
          gps: toGps(address?.latitude, address?.longitude),
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  /** Toma la foto del formulario tal como está hoy. */
  async buildSnapshot(
    em: EntityManager,
    practitionerProfileId: string,
    now: Date,
    professionGroup: ProfessionGroup = 'MEDICO',
  ): Promise<SubmittedForm> {
    const [person, identifier, contacts, addresses] = await Promise.all([
        em.findOne(Persons, { id: practitionerProfileId }),
        em.findOne(Identifiers, {
          ownerId: practitionerProfileId,
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        }),
        em.find(ContactPoints, { ownerId: practitionerProfileId }),
        em.find(Addresses, { ownerId: practitionerProfileId }),
      ]);
    const licenses = await em.find(JurisdictionAuthorizations, {
      practitionerProfileId,
    });
    const credentials = await em.find(ProfessionalCredentials, {
      practitionerProfileId,
    });
    const specialties = await em.find(PractitionerSpecialties, {
      practitionerProfileId,
      validTo: null,
    });
    const names = await this.conceptNames(em, [
      person?.occupationConceptId,
      identifier?.issuerAdministrativeAreaConceptId,
      ...addresses.map((a) => a.administrativeAreaConceptId),
      ...addresses.map((a) => a.municipalityConceptId),
      ...licenses.map((l) => l.jurisdictionConceptId),
      ...specialties.map((s) => s.specialtyConceptId),
    ]);
    const sites = await this.practiceSites(em, practitionerProfileId);

    const contact = (system: string, use: string) =>
      contacts.find((c) => c.systemConceptId === system && c.useConceptId === use)
        ?.value ?? null;
    const address = (use: string): SubmittedAddress | null => {
      const row = addresses.find((a) => a.useConceptId === use);
      if (!row) return null;
      return {
        lines: row.lines ?? null,
        locality:
          (row.municipalityConceptId ? names.get(row.municipalityConceptId) : undefined) ??
          row.districtText ??
          row.city ??
          null,
        department: row.administrativeAreaConceptId
          ? (names.get(row.administrativeAreaConceptId) ?? null)
          : null,
        gps: toGps(row.latitude, row.longitude),
      };
    };
    const birth = asDateString(person?.birthDate);

    return {
      personal: {
        requirementCode: 'CI',
        firstName: person?.name ?? null,
        middleName: person?.middleName ?? null,
        paternalLastName: person?.lastName ?? null,
        maternalLastName: person?.motherLastName ?? null,
        nationalId: identifier?.value ?? null,
        nationalIdIssuer: identifier?.issuerAdministrativeAreaConceptId
          ? (names.get(identifier.issuerAdministrativeAreaConceptId) ?? null)
          : null,
        birthDate: birth,
        age: ageOn(birth, now),
        occupation:
          (person?.occupationConceptId
            ? names.get(person.occupationConceptId)
            : undefined) ??
          person?.occupationFreeText ??
          null,
      },
      contact: {
        personalMobile: contact(CONCEPTS.CONTACT_MOBILE, CONCEPTS.CONTACT_USE_HOME),
        personalEmail: contact(CONCEPTS.CONTACT_EMAIL, CONCEPTS.CONTACT_USE_HOME),
        workMobile: contact(CONCEPTS.CONTACT_MOBILE, CONCEPTS.CONTACT_USE_WORK),
        workPhone: contact(CONCEPTS.CONTACT_PHONE, CONCEPTS.CONTACT_USE_WORK),
        workEmail: contact(CONCEPTS.CONTACT_EMAIL, CONCEPTS.CONTACT_USE_WORK),
      },
      addresses: {
        home: address(CONCEPTS.ADDR_USE_HOME),
        work: address(CONCEPTS.ADDR_USE_WORK),
      },
      licenses: licenses.map((l) => {
        const subtype = licenseSubtype(l.jurisdictionConceptId);
        return {
          id: l.id,
          requirementCode:
            subtype === 'SEDES'
              ? 'REGISTRO_SEDES'
              : subtype === 'PROFESSIONAL_COLLEGE'
                ? professionGroup === 'ODONTOLOGO'
                  ? 'REGISTRO_COLEGIO_ODONTOLOGOS'
                  : 'REGISTRO_COLEGIO_MEDICO'
                : 'MATRICULA_MSALUD',
          number: l.licenseNumber,
          jurisdiction: names.get(l.jurisdictionConceptId) ?? null,
          authority: l.regulatoryAuthority ?? null,
          validFrom: asDateString(l.validFrom),
          validTo: asDateString(l.validTo),
          fileId: l.fileId ?? null,
        };
      }),
      education: credentials.map((c) => {
        const subtype = credentialSubtype(c.credentialTypeConceptId);
        return {
          id: c.id,
          requirementCode: REQUIREMENT_BY_SUBTYPE[subtype],
          level: LEVEL_BY_SUBTYPE[subtype],
          title: c.titleText ?? null,
          institution: c.issuingInstitutionText ?? null,
          year: c.issueDate ? Number(asDateString(c.issueDate)?.slice(0, 4)) : null,
          number: c.number,
          fileId: c.fileId ?? null,
        };
      }),
      specialties: specialties.map((s) => ({
        id: s.id,
        requirementCode: 'ESPECIALIDADES_DECLARADAS' as const,
        name: names.get(s.specialtyConceptId) ?? null,
        isPrimary: s.isPrimary === true,
        supportingCredentialId: s.supportingCredentialId ?? null,
      })),
      practices: sites.map((s) => ({
        id: s.id,
        requirementCode: 'UBICACION_CONSULTORIOS' as const,
        name: s.name,
        address: s.address,
        gps: s.gps,
      })),
    };
  }
}

