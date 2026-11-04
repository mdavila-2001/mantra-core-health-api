import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../../../common';
import type {
  PatientProfilesRepository,
  PersonsRepository,
} from '../../../infrastructure/repositories';
import type { SearchPatientsResponseDto } from '../../../presentation/dto';
import { ProfilesErrorReason } from '../../../profiles.error-reasons';
import type { AdministrativeAreaCatalogService } from '../../services/administrative-area-catalog.service';
import {
  resolvePatientSearchScope,
  searchRequiresCriterion,
} from '../../services/patient-search-scope';

/** Search options of UC-05-13. */
export interface SearchPatientsOptions {
  /** Free text over patient code and name. */
  query?: string;
  /** Exact national id (AC-07-1/AC-07-2). */
  nationalId?: string;
  /** Department that issued the document (`VS_BO_DEPARTMENT`). */
  issuerAdministrativeAreaConceptId?: string;
  /** Opaque cursor returned by the previous page. */
  cursor?: string;
  /** Page size. */
  limit: number;
}

/** Visible digits of a masked national id. */
const VISIBLE_DIGITS = 3;

/**
 * Masks a national id down to its last digits: enough to tell two homonyms
 * apart, not enough to read someone's document off a name search.
 */
export function maskNationalId(value: string | null): string | null {
  if (!value) return null;
  const clean = value.trim();
  if (clean.length <= VISIBLE_DIGITS) return '•'.repeat(clean.length);
  return `•••${clean.slice(-VISIBLE_DIGITS)}`;
}

/**
 * UC-05-13: paginated patient search (filiation data, never clinical).
 *
 * Merged losers are excluded by the repository, and each row says whether the
 * person has an own account, so a clinician can see which homonym will actually
 * receive a care-relationship request.
 */
export class SearchPatientsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly administrativeAreas: AdministrativeAreaCatalogService,
  ) {}

  async execute(
    options: SearchPatientsOptions,
    actor: AuthenticatedUser,
  ): Promise<SearchPatientsResponseDto> {
    // P-07-10: without text or document a clinical role would page through the
    // whole registry — enumeration, not search. Admin roles still list freely.
    if (
      searchRequiresCriterion(actor) &&
      !options.query &&
      !options.nationalId
    ) {
      throw new PreconditionFailedException(
        'Busque por nombre, código o documento: no se puede listar el padrón completo de pacientes',
        {},
        ProfilesErrorReason.PATIENT_SEARCH_CRITERIA_REQUIRED,
      );
    }

    const em = this.em.fork();
    if (options.issuerAdministrativeAreaConceptId) {
      await this.administrativeAreas.assertIsAdministrativeArea(
        em,
        options.issuerAdministrativeAreaConceptId,
      );
    }

    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterPatientCode =
      typeof after?.patientCode === 'string' ? after.patientCode : undefined;

    // One extra row tells whether there is a next page without a COUNT.
    const rows = await this.patientProfilesRepo.searchPage(
      em,
      {
        query: options.query,
        nationalId: options.nationalId,
        issuerAdministrativeAreaConceptId:
          options.issuerAdministrativeAreaConceptId,
        scope: resolvePatientSearchScope(actor),
        afterPatientCode,
      },
      options.limit + 1,
    );
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    const persons = await this.personsRepo.findByIds(
      em,
      page.map((row) => row.profileId),
    );

    const items = page.map((row) => {
      const person = persons.get(row.profileId);
      return {
        profileId: row.profileId,
        personId: row.profileId,
        patientCode: row.patientCode,
        displayName: person?.displayName,
        birthDate: person?.birthDate,
        personStatusConceptId: person?.personStatusConceptId,
        deceased: Boolean(person?.deceasedAt),
        nationalIdMasked: maskNationalId(row.nationalId),
        hasAccount: row.hasAccount,
      };
    });

    const last = page.at(-1);
    return {
      items,
      count: items.length,
      limit: options.limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ patientCode: last.patientCode })
          : null,
    };
  }
}
