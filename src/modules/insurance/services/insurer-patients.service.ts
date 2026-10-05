import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { COMM } from '../../community/community.concepts';
import {
  patientCoverageReferenceDate,
  patientCoverageValidity,
} from '../../profiles/patient-coverage-validity';
import { PROF } from '../../profiles/profiles.concepts';
import type {
  InsurerPatientCoverageDto,
  InsurerPatientListDto,
  InsurerPatientListItemDto,
  InsurerPatientSearchQueryDto,
} from '../dto/insurer-patients.dto';
import { INS } from '../insurance.concepts';
import { InsurerContextService } from './insurer-context.service';
import {
  buildInsurerPatientPageQuery,
  FULL_NAME_SQL,
  nextCursorAfter,
  type InsurerPatientCriteria,
  type InsurerPatientPageRow,
} from './insurer-patients.query';

const ACCESS_DENIED = 'No hay acceso al directorio de pacientes';
const DEFAULT_PAGE_SIZE = 10;

/** Filiación y contacto de los pacientes de una página. */
interface PersonRow {
  patient_profile_id: string;
  full_name: string;
  birth_date: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  gender_concept_id: string | null;
  gender_code: string | null;
  occupation_display: string | null;
  community_profile_slug: string | null;
}

/** Una cobertura con ESTA aseguradora, con sus dos períodos de vigencia. */
interface CoverageRow {
  patient_profile_id: string;
  plan_name: string | null;
  policy_identifier: string | null;
  member_identifier: string | null;
  status_concept_id: string | null;
  plan_status_concept_id: string | null;
  effective_from: string | null;
  effective_to: string | null;
  plan_effective_from: string | null;
  plan_effective_to: string | null;
}

/** El mismo objeto sin las claves `null`/`undefined`. */
function withoutEmpty<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== null && v !== undefined),
  ) as T;
}

/** Años cumplidos a una fecha civil, comparando texto `YYYY-MM-DD`. */
export function ageAt(birthDate: string, referenceDate: string): number {
  const years =
    Number(referenceDate.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return referenceDate.slice(5) < birthDate.slice(5) ? years - 1 : years;
}

/**
 * Directorio de pacientes de la aseguradora activa (consola de la aseguradora).
 *
 * ## Qué ve y qué no
 *
 * Sólo pacientes con relación con **esta** aseguradora —una cobertura en uno
 * de sus planes o un reclamo presentado a ella— y, de cada uno, sólo filiación
 * y contacto: nombre, documento, nacimiento, sexo, ocupación, teléfono, correo.
 * Nada clínico. De las coberturas, sólo las de esta aseguradora: que el
 * paciente tenga además seguro con otra no es asunto de ésta.
 *
 * ## «Escribir»
 *
 * Se devuelve el slug de su perfil de comunidad **sólo si se le puede
 * escribir**: activo, público y de usuario — exactamente lo que exige
 * `CommunityMessagingService.createConversation` al destinatario. Devolver un
 * slug de un perfil privado dibujaría un botón que después falla.
 */
@Injectable()
export class InsurerPatientsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia raíz.
   * @param insurerContext - La aseguradora del tenant activo y su permiso.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly insurerContext: InsurerContextService,
  ) {}

  /**
   * Una página del directorio.
   *
   * @param query - Filtros ya validados.
   * @param actor - La sesión.
   * @param now - Reloj (inyectable en pruebas).
   * @returns Hasta `limit` pacientes y el cursor de la siguiente página.
   * @throws ForbiddenException si la organización activa no es una aseguradora
   *   o la sesión no puede operarla.
   */
  async list(
    query: InsurerPatientSearchQueryDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<InsurerPatientListDto> {
    const em = this.em.fork();
    const { carrierId } = await this.insurerContext.resolve(
      em,
      actor,
      ACCESS_DENIED,
    );

    const criteria: InsurerPatientCriteria = {
      carrierId,
      referenceDate: patientCoverageReferenceDate(now),
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
      cursor: query.cursor,
      search: query.search?.trim() || undefined,
      genderConceptId: query.genderConceptId,
      occupationConceptId: query.occupationConceptId,
      birthDateFrom: query.birthDateFrom,
      birthDateTo: query.birthDateTo,
      insuranceStatus: query.insuranceStatus ?? 'ALL',
      sortBy: query.sortBy ?? 'fullName',
      sortDirection: query.sortDirection ?? 'asc',
    };

    const { sql, params } = buildInsurerPatientPageQuery(criteria);
    const rows = await em
      .getConnection()
      .execute<InsurerPatientPageRow[]>(sql, params);
    const hasMore = rows.length > criteria.limit;
    const page = hasMore ? rows.slice(0, criteria.limit) : rows;
    if (page.length === 0) {
      return { items: [], limit: criteria.limit, nextCursor: null };
    }

    const ids = page.map((row) => row.patient_profile_id);
    const [people, coverages] = await Promise.all([
      this.readPeople(em, ids),
      this.readCoverages(em, ids, carrierId),
    ]);
    const personById = new Map(people.map((p) => [p.patient_profile_id, p]));

    const items = page.flatMap((row) => {
      const person = personById.get(row.patient_profile_id);
      if (!person) return [];
      return [
        this.toItem(
          person,
          coverages.filter(
            (c) => c.patient_profile_id === row.patient_profile_id,
          ),
          criteria.referenceDate,
        ),
      ];
    });

    const last = page.at(-1);
    return {
      items,
      limit: criteria.limit,
      nextCursor: hasMore && last ? nextCursorAfter(last, criteria) : null,
    };
  }

  /** Filiación, contacto y perfil de comunidad elegible de esos pacientes. */
  private readPeople(em: EntityManager, ids: string[]): Promise<PersonRow[]> {
    const placeholders = ids.map(() => '?').join(', ');
    return em.getConnection().execute<PersonRow[]>(
      `select pa.profile_id as patient_profile_id,
              ${FULL_NAME_SQL} as full_name,
              to_char(p.birth_date, 'YYYY-MM-DD') as birth_date,
              (select i.value from common.identifiers i
                where i.owner_id = p.id and i.type_concept_id = ?
                  and i.state_concept_id = ?
                order by i.created_at limit 1) as document_number,
              (select cp.value from common.contact_points cp
                where cp.owner_id = p.id and cp.valid_to is null
                  and cp.system_concept_id in (?, ?)
                order by (cp.system_concept_id = ?) desc, cp.rank nulls last
                limit 1) as phone,
              (select cp.value from common.contact_points cp
                where cp.owner_id = p.id and cp.valid_to is null
                  and cp.system_concept_id = ?
                order by cp.rank nulls last limit 1) as email,
              p.administrative_gender_concept_id as gender_concept_id,
              gender.code as gender_code,
              coalesce(occupation.display, nullif(p.occupation_free_text, ''))
                as occupation_display,
              (select pub.slug
                 from profiles.person_account_links pal
                 join community.public_profiles pub
                   on pub.target_id = pal.user_id
                  and pub.target_type_concept_id = ?
                  and pub.status_concept_id = ?
                  and pub.visibility_concept_id = ?
                where pal.person_id = p.id and pal.status_concept_id = ?
                order by pub.created_at limit 1) as community_profile_slug
         from profiles.patient_profiles pa
         join profiles.persons p on p.id = pa.profile_id
         left join terminology.catalog_concepts gender
           on gender.id = p.administrative_gender_concept_id
         left join terminology.catalog_concepts occupation
           on occupation.id = p.occupation_concept_id
        where pa.profile_id in (${placeholders})`,
      [
        CONCEPTS.ID_TYPE_NATIONAL,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_PHONE,
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_EMAIL,
        COMM.PROFILE_TARGET_USER,
        CONCEPTS.STATE_ACTIVE,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        PROF.ACCOUNT_LINK_ACTIVE,
        ...ids,
      ],
    );
  }

  /** Las coberturas de esos pacientes en planes de ESTA aseguradora. */
  private readCoverages(
    em: EntityManager,
    ids: string[],
    carrierId: string,
  ): Promise<CoverageRow[]> {
    const placeholders = ids.map(() => '?').join(', ');
    return em.getConnection().execute<CoverageRow[]>(
      `select c.patient_profile_id, pl.name as plan_name,
              c.policy_identifier, c.member_identifier,
              c.status_concept_id, pl.status_concept_id as plan_status_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') as effective_to,
              to_char(pl.effective_from, 'YYYY-MM-DD') as plan_effective_from,
              to_char(pl.effective_to, 'YYYY-MM-DD') as plan_effective_to
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
        where pr.insurance_carrier_id = ?
          and c.patient_profile_id in (${placeholders})
        order by c.coverage_order nulls last, c.id`,
      [carrierId, ...ids],
    );
  }

  private toItem(
    person: PersonRow,
    coverages: CoverageRow[],
    referenceDate: string,
  ): InsurerPatientListItemDto {
    return withoutEmpty({
      patientProfileId: person.patient_profile_id,
      fullName: person.full_name,
      documentNumber: person.document_number,
      birthDate: person.birth_date,
      age: person.birth_date
        ? ageAt(person.birth_date, referenceDate)
        : undefined,
      phone: person.phone,
      email: person.email,
      genderConceptId: person.gender_concept_id,
      genderCode: person.gender_code,
      occupationDisplay: person.occupation_display,
      coverage: this.toCoverage(coverages, referenceDate),
      communityProfileSlug: person.community_profile_slug,
    }) as InsurerPatientListItemDto;
  }

  /**
   * La cobertura a mostrar: la vigente si hay; si no, ninguna.
   *
   * Una vencida no se muestra en la fila (supuesto A1, confirmado): para quien
   * opera la aseguradora, «Ninguno» es «hoy no lo cubrimos».
   */
  private toCoverage(
    coverages: CoverageRow[],
    referenceDate: string,
  ): InsurerPatientCoverageDto {
    const current = coverages
      .map((row) => ({
        row,
        validity: patientCoverageValidity(referenceDate, [
          {
            statusConceptId: row.status_concept_id,
            activeConceptId: INS.COVERAGE_ACTIVE,
            effectiveFrom: row.effective_from,
            effectiveTo: row.effective_to,
          },
          {
            statusConceptId: row.plan_status_concept_id,
            activeConceptId: INS.PLAN_ACTIVE,
            effectiveFrom: row.plan_effective_from,
            effectiveTo: row.plan_effective_to,
          },
        ]),
      }))
      .find((entry) => entry.validity === 'CURRENT');
    if (!current) return { hasActiveCoverage: false };
    return withoutEmpty({
      hasActiveCoverage: true,
      planName: current.row.plan_name,
      policyIdentifier: current.row.policy_identifier,
      memberIdentifier: current.row.member_identifier,
      validityStatus: current.validity,
    }) as InsurerPatientCoverageDto;
  }
}
