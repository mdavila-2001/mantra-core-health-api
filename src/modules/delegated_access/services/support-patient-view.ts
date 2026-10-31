import { AUTHZ } from '../../authz/authz.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import {
  ADULT_AGE_YEARS,
  ageInYears,
  maskDocument,
  maskPhone,
  normalizePersonText,
} from '../domain';
import type {
  SupportPatientDuplicateDto,
  SupportPatientMatchDto,
  SupportPatientRepresentativeDto,
} from '../dto';
import type {
  DuplicateCandidateRow,
  RepresentativeRow,
  SupportPatientRow,
} from '../repositories';

/** Rótulo del parentesco o del tipo de representación, en palabras de quien registra. */
const RELATIONSHIP_LABEL: ReadonlyMap<string, string> = new Map([
  [PROF.RELATIONSHIP_GUARDIAN, 'Tutor legal'],
  [PROF.RELATIONSHIP_MOTHER, 'Madre'],
  [PROF.RELATIONSHIP_FATHER, 'Padre'],
  [PROF.RELATIONSHIP_GRANDPARENT, 'Abuelo o abuela'],
  [PROF.RELATIONSHIP_SIBLING, 'Hermano o hermana'],
  [PROF.RELATIONSHIP_UNCLE_AUNT, 'Tío o tía'],
  [PROF.RELATIONSHIP_OTHER_RELATIVE, 'Familiar autorizado'],
  [AUTHZ.REPRESENTATION_LEGAL_GUARDIAN, 'Tutor legal'],
  [AUTHZ.REPRESENTATION_PARENT, 'Madre o padre'],
  [AUTHZ.REPRESENTATION_ATTORNEY, 'Apoderado'],
  [AUTHZ.REPRESENTATION_CURATOR, 'Curador'],
]);

/** Rótulo de un parentesco; lo que no se reconoce es «familiar autorizado». */
export function relationshipLabel(conceptId: string | undefined): string {
  return (
    (conceptId ? RELATIONSHIP_LABEL.get(conceptId) : undefined) ??
    'Familiar autorizado'
  );
}

/** Rótulo genérico de un posible duplicado que es de otra organización. */
export const FOREIGN_PATIENT_LABEL = 'Persona registrada en otra organización';

/**
 * Representantes tal como salen: sin repetir a quien figura como persona
 * relacionada y además tiene una representación legal con el mismo nombre.
 */
export function toRepresentativeDtos(
  rows: readonly RepresentativeRow[] | undefined,
): SupportPatientRepresentativeDto[] {
  const seen = new Set<string>();
  const out: SupportPatientRepresentativeDto[] = [];
  for (const row of rows ?? []) {
    const key = normalizePersonText(row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: row.id,
      name: row.name,
      relationship: relationshipLabel(row.relationshipConceptId),
    });
  }
  return out;
}

/**
 * La coincidencia mínima de un paciente: nombre, edad, documento y teléfono
 * tapados y, si es menor, sus representantes. Lleva el perfil con los dos
 * nombres que usan el contrato compartido (`patientProfileId`) y el front
 * (`profileId`).
 *
 * @param row - Paciente leído.
 * @param representatives - Representantes de los menores, por paciente.
 * @param now - Instante para calcular la edad.
 * @returns La coincidencia lista para responder.
 */
export function toMatchDto(
  row: SupportPatientRow,
  representatives: ReadonlyMap<string, readonly RepresentativeRow[]>,
  now: Date = new Date(),
): SupportPatientMatchDto {
  const age = ageInYears(row.birthDate, now);
  const isMinor = age !== undefined && age < ADULT_AGE_YEARS;
  return {
    patientProfileId: row.profileId,
    profileId: row.profileId,
    displayName: row.displayName,
    ...(row.nationalId ? { documentMasked: maskDocument(row.nationalId) } : {}),
    ...(row.phone ? { phoneMasked: maskPhone(row.phone) } : {}),
    ...(age === undefined ? {} : { ageYears: age }),
    isMinor,
    ...(isMinor
      ? {
          representatives: toRepresentativeDtos(
            representatives.get(row.profileId),
          ),
        }
      : {}),
  };
}

/**
 * Un posible duplicado, con cuidado de lo que se muestra.
 *
 * - **De la organización** (tiene citas, una representación legal o lo registró
 *   alguien de ella): perfil, nombre, edad, documento y teléfono tapados y, si es
 *   menor, sus representantes. Es lo que hace falta para decir «es esta persona».
 * - **De otra organización**: ni perfil, ni nombre, ni edad, ni documento del
 *   registro ajeno. Solo que existe alguien que coincide y con qué. Lo «tapado» y
 *   la edad que salen son los de lo que quien registra escribió, no los del otro
 *   registro: la respuesta no revela nada que no tuviera ya.
 *
 * @param row - Candidato leído.
 * @param declared - Documento y fecha de nacimiento que quien registra escribió.
 * @param representatives - Representantes de los menores, por paciente.
 * @param now - Instante para calcular la edad.
 * @returns El candidato listo para responder.
 */
export function toDuplicateDto(
  row: DuplicateCandidateRow,
  declared: { nationalId: string; birthDate: string },
  representatives: ReadonlyMap<string, readonly RepresentativeRow[]>,
  now: Date = new Date(),
): SupportPatientDuplicateDto {
  if (!row.linkedToTenant) {
    const age = ageInYears(declared.birthDate, now);
    return {
      displayName: FOREIGN_PATIENT_LABEL,
      documentMasked: maskDocument(declared.nationalId),
      ...(age === undefined ? {} : { ageYears: age }),
      isMinor: age !== undefined && age < ADULT_AGE_YEARS,
      linkedToOrganization: false,
      matchedBy: [...row.basis],
    };
  }
  const match = toMatchDto(row, representatives, now);
  return {
    profileId: match.profileId,
    patientProfileId: match.patientProfileId,
    displayName: match.displayName,
    documentMasked: match.documentMasked ?? maskDocument(declared.nationalId),
    ...(match.phoneMasked ? { phoneMasked: match.phoneMasked } : {}),
    ...(match.ageYears === undefined ? {} : { ageYears: match.ageYears }),
    isMinor: match.isMinor,
    ...(match.representatives
      ? { representatives: match.representatives }
      : {}),
    linkedToOrganization: true,
    matchedBy: [...row.basis],
  };
}
