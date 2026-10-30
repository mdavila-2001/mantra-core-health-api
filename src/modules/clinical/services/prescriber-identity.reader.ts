import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';
import type { JurisdictionAuthorizations } from '../../profiles/entities';
import { composePersonDisplayName } from '../../profiles/domain/person-name';
import { HealthPractitionerProfilesRepository } from '../../profiles/infrastructure/repositories/health-practitioner-profiles.repository';
import { PersonsRepository } from '../../profiles/infrastructure/repositories/persons.repository';
import { JurisdictionAuthorizationsRepository } from '../../profiles/infrastructure/repositories/jurisdiction-authorizations.repository';
import type { PrescriberLicense } from './prescription-pdf.service';

/** Quién emitió una receta, tal como se muestra fuera de la historia clínica. */
export interface PrescriberIdentity {
  /** Nombre visible del profesional, o `null` si su persona no se encuentra. */
  readonly name: string | null;
  /** Matrícula nacional, o `null` si no declaró ninguna. */
  readonly license: PrescriberLicense | null;
}

/**
 * La matrícula nacional entre las autorizaciones de un profesional.
 *
 * Es la misma que imprime el PDF y la que devuelve el verify público:
 * `ACTIVE` si la plataforma la verificó, `PENDING` si es solo declarada.
 *
 * @param authorizations - Autorizaciones jurisdiccionales del profesional.
 * @returns La matrícula nacional, o `null` si no hay.
 */
export function nationalLicenseOf(
  authorizations: readonly JurisdictionAuthorizations[],
): PrescriberLicense | null {
  const registration = authorizations.find(
    (auth) => auth.jurisdictionConceptId === PROF.JURISDICTION_NATIONAL,
  );
  if (!registration) return null;
  return {
    number: registration.licenseNumber,
    authority: registration.regulatoryAuthority ?? null,
    state:
      registration.stateConceptId === PROF.AUTH_ACTIVE ? 'ACTIVE' : 'PENDING',
  };
}

/**
 * Nombre y matrícula de quien emitió una receta. Lo usa el enlace compartido
 * (`delegated_access`): el nombre del prescriptor no es dato del paciente
 * (D-2), y nunca se lee aquí nada del paciente ni del medicamento.
 */
@Injectable()
export class PrescriberIdentityReader {
  constructor(
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly jurisdictionAuthorizationsRepo: JurisdictionAuthorizationsRepository,
  ) {}

  /**
   * Nombre y matrícula del profesional.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - Perfil profesional que emitió la receta.
   * @returns Su identidad, o `null` si el perfil no existe.
   */
  async read(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PrescriberIdentity | null> {
    const profile = await this.practitionerProfilesRepo.findById(
      em,
      practitionerProfileId,
    );
    if (!profile) return null;
    const [person, authorizations] = await Promise.all([
      this.personsRepo.findById(em, profile.profileId),
      this.jurisdictionAuthorizationsRepo.findByPractitioner(
        em,
        practitionerProfileId,
      ),
    ]);
    return {
      name: person
        ? (person.displayName ?? composePersonDisplayName(person) ?? null)
        : null,
      license: nationalLicenseOf(authorizations),
    };
  }
}
