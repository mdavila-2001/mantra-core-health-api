import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { context } from '@opentelemetry/api';
import { suppressTracing } from '@opentelemetry/core';
import {
  CONCEPTS,
  PreconditionFailedException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityMessagingService } from '../../community/services/community-messaging.service';
import { DataAccessLogRepository } from '../../audit/repositories/data-access-log.repository';
import { AUD } from '../../audit/audit.concepts';
import { DIR } from '../../directory/directory.concepts';
import { COMM } from '../../community/community.concepts';
import {
  patientCoverageReferenceDate,
  patientCoverageValidity,
} from '../../profiles/domain/patient-coverage-validity';
import { PROF } from '../../profiles/profiles.concepts';
import type {
  InsurerPatientCarrierDto,
  InsurerPatientOptionsDto,
  InsurerPatientConversationDto,
  InsurerPatientConversationResponseDto,
  InsurerPatientListDto,
  InsurerPatientListItemDto,
  InsurerPatientSearchQueryDto,
} from '../dto/insurer-patients.dto';
import { INS } from '../insurance.concepts';
import { InsurerContextService } from './insurer-context.service';
import {
  buildInsurerPatientPageQuery,
  buildInsurerPatientCountQuery,
  FULL_NAME_SQL,
  nextCursorAfter,
  type InsurerPatientCriteria,
  type InsurerPatientPageRow,
} from './insurer-patients.query';

const ACCESS_DENIED = 'No hay acceso al directorio de pacientes';
const DEFAULT_PAGE_SIZE = 25;

/** Filiación y contacto de los pacientes de una página. */
interface PersonRow {
  patient_profile_id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  gender_code: string | null;
  occupation_display: string | null;
  community_profile_id: string | null;
}

/** Una cobertura con ESTA aseguradora, con sus dos períodos de vigencia. */
interface CoverageRow {
  patient_profile_id: string;
  carrier_id: string;
  carrier_name: string;
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

/** Directorio autorizado: cada petición revalida membresía, cobertura y mensajería. */
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
    private readonly messaging: CommunityMessagingService,
    private readonly dataAccess: DataAccessLogRepository,
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
    const { carrierId, tenantId } = await this.resolveScope(em, actor);

    const criteria: InsurerPatientCriteria = {
      carrierId,
      referenceDate: patientCoverageReferenceDate(now),
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
      cursor: query.cursor,
      search: query.search?.trim() || undefined,
      genderConceptId: query.genderConceptId,
      occupation: query.occupation?.trim() || undefined,
      insuranceCarrierId: query.insuranceCarrierId,
      birthDateFrom: query.birthDateFrom,
      birthDateTo: query.birthDateTo,
      insuranceStatus: query.insuranceStatus ?? 'ALL',
      sortBy: query.sortBy ?? 'fullName',
      sortDirection: query.sortDirection ?? 'asc',
    };

    const { sql, params } = buildInsurerPatientPageQuery(criteria);
    const countQuery = buildInsurerPatientCountQuery(criteria);
    // MikroORM interpola valores antes de llegar a pg. Su span SQL expondría
    // la búsqueda incluso con enhancedDatabaseReporting desactivado.
    const [{ total }] = await context.with(
      suppressTracing(context.active()),
      () =>
        em
          .getConnection()
          .execute<{ total: number }[]>(
            countQuery.sql,
            countQuery.params,
            'all',
            undefined,
            { debugMode: ['query'] },
          ),
    );
    const rows = await context.with(suppressTracing(context.active()), () =>
      em
        .getConnection()
        .execute<InsurerPatientPageRow[]>(sql, params, 'all', undefined, {
          debugMode: ['query'],
        }),
    );
    const hasMore = rows.length > criteria.limit;
    const page = hasMore ? rows.slice(0, criteria.limit) : rows;
    if (page.length === 0) {
      return {
        items: [],
        total: Number(total),
        limit: criteria.limit,
        nextCursor: null,
      };
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

    this.recordAccess(
      em,
      items.map((item) => item.patientProfileId),
      actor,
      tenantId,
    );
    await em.flush();
    const last = page.at(-1);
    return {
      items,
      total: Number(total),
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
              (select cp.value from common.contact_points cp
                where cp.owner_id = p.id and cp.valid_to is null
                  and cp.system_concept_id in (?, ?)
                order by (cp.system_concept_id = ?) desc, cp.rank nulls last
                limit 1) as phone,
              (select cp.value from common.contact_points cp
                where cp.owner_id = p.id and cp.valid_to is null
                  and cp.system_concept_id = ?
                order by cp.rank nulls last limit 1) as email,
              gender.code as gender_code,
              coalesce(occupation.display, nullif(p.occupation_free_text, ''))
                as occupation_display,
              (select pub.id
                 from profiles.person_account_links pal
                 join iam.users account on account.id = pal.user_id and account.status_concept_id = ?
                 join community.public_profiles pub
                   on pub.target_id = pal.user_id
                  and pub.target_type_concept_id = ?
                  and pub.status_concept_id = ?
                  and pub.visibility_concept_id = ?
                where pal.person_id = p.id and pal.status_concept_id = ?
                  and pal.link_type_concept_id = ? and pal.valid_from <= now()
                  and (pal.valid_to is null or pal.valid_to > now())
                order by pub.created_at limit 1) as community_profile_id
         from profiles.patient_profiles pa
         join profiles.persons p on p.id = pa.profile_id
         left join terminology.catalog_concepts gender
           on gender.id = p.administrative_gender_concept_id
         left join terminology.catalog_concepts occupation
           on occupation.id = p.occupation_concept_id
        where pa.profile_id in (${placeholders})`,
      [
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_PHONE,
        CONCEPTS.CONTACT_MOBILE,
        CONCEPTS.CONTACT_EMAIL,
        CONCEPTS.USER_ACTIVE,
        COMM.PROFILE_TARGET_USER,
        CONCEPTS.STATE_ACTIVE,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        PROF.ACCOUNT_LINK_ACTIVE,
        PROF.ACCOUNT_LINK_SELF,
        ...ids,
      ],
    );
  }

  /** Coberturas de la página, limitadas a las aseguradoras que puede consultar el actor. */
  private readCoverages(
    em: EntityManager,
    ids: string[],
    carrierId: string | undefined,
  ): Promise<CoverageRow[]> {
    const placeholders = ids.map(() => '?').join(', ');
    return em.getConnection().execute<CoverageRow[]>(
      `select c.patient_profile_id, cr.id as carrier_id, cr.legal_name as carrier_name,
              c.status_concept_id, pl.status_concept_id as plan_status_concept_id,
              to_char(c.effective_from, 'YYYY-MM-DD') as effective_from,
              to_char(c.effective_to, 'YYYY-MM-DD') as effective_to,
              to_char(pl.effective_from, 'YYYY-MM-DD') as plan_effective_from,
              to_char(pl.effective_to, 'YYYY-MM-DD') as plan_effective_to
         from insurance.patient_coverages c
         join insurance.insurance_plans pl on pl.id = c.insurance_plan_id
         join insurance.insurance_products pr on pr.id = pl.insurance_product_id
         join insurance.insurance_carriers cr on cr.id = pr.insurance_carrier_id
        where cr.status_concept_id = ?
          ${carrierId ? 'and pr.insurance_carrier_id = ?' : ''}
          and c.patient_profile_id in (${placeholders})
        order by c.coverage_order nulls last, c.id`,
      [INS.CARRIER_ACTIVE, ...(carrierId ? [carrierId] : []), ...ids],
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
      birthDate: person.birth_date,
      age: person.birth_date
        ? ageAt(person.birth_date, referenceDate)
        : undefined,
      phone: person.phone,
      email: person.email,
      genderCode: person.gender_code,
      occupationDisplay: person.occupation_display,
      insurers: this.toInsurers(coverages, referenceDate),
      messaging: {
        channel: 'internal' as const,
        available: Boolean(person.community_profile_id),
      },
    }) as InsurerPatientListItemDto;
  }

  /** Todas las aseguradoras vigentes autorizadas, sin duplicar sus planes. */
  private toInsurers(
    coverages: CoverageRow[],
    referenceDate: string,
  ): InsurerPatientCarrierDto[] {
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
      .filter((entry) => entry.validity === 'CURRENT');
    return [
      ...new Map(
        current.map(({ row }) => [
          row.carrier_id,
          {
            id: row.carrier_id,
            name: row.carrier_name,
          },
        ]),
      ).values(),
    ];
  }

  /** El alcance depende del actor; un filtro del cliente nunca lo amplía. */
  private async resolveScope(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<{ carrierId?: string; tenantId?: string }> {
    if (
      ['SECURITY_ADMIN', 'SUPERADMIN'].some((role) =>
        roleAuthorizesInTenant(actor, role, undefined),
      )
    )
      return {};
    const scope = await this.insurerContext.resolve(em, actor, ACCESS_DENIED);
    // Un JWT emitido antes de revocar la membresía no conserva acceso al directorio.
    const memberships = await em.getConnection().execute<{ id: string }[]>(
      `select tm.id from directory.tenant_memberships tm
        join insurance.insurance_carriers cr on cr.tenant_id = tm.tenant_id
        where tm.tenant_id = ? and tm.user_id = ? and tm.status_concept_id = ?
          and cr.id = ? and cr.status_concept_id = ?
          and (tm.tenant_role_concept_id in (?, ?) or ?)
          and tm.start_date <= now() and (tm.end_date is null or tm.end_date > now()) limit 1`,
      [
        scope.tenantId,
        actor.id,
        DIR.MEMBERSHIP_ACTIVE,
        scope.carrierId,
        INS.CARRIER_ACTIVE,
        DIR.ROLE_OWNER,
        DIR.ROLE_ADMIN,
        roleAuthorizesInTenant(actor, 'INSURANCE_OPERATOR', scope.tenantId),
      ],
    );
    if (!memberships.length) throw new ForbiddenException(ACCESS_DENIED);
    return scope;
  }

  async options(actor: AuthenticatedUser): Promise<InsurerPatientOptionsDto> {
    const em = this.em.fork();
    const { carrierId } = await this.resolveScope(em, actor);
    const insurers = await em
      .getConnection()
      .execute<InsurerPatientCarrierDto[]>(
        `select id, legal_name as name from insurance.insurance_carriers
       where status_concept_id = ? ${carrierId ? 'and id = ?' : ''}
       order by legal_name, id`,
        [INS.CARRIER_ACTIVE, ...(carrierId ? [carrierId] : [])],
      );
    return { insurers };
  }

  async openConversation(
    dto: InsurerPatientConversationDto,
    actor: AuthenticatedUser,
    now = new Date(),
  ): Promise<InsurerPatientConversationResponseDto> {
    const em = this.em.fork();
    const { carrierId, tenantId } = await this.resolveScope(em, actor);
    const query = buildInsurerPatientPageQuery({
      carrierId,
      patientProfileId: dto.patientProfileId,
      referenceDate: patientCoverageReferenceDate(now),
      limit: 10,
      insuranceStatus: 'ALL',
      sortBy: 'fullName',
      sortDirection: 'asc',
    });
    const allowed = await em
      .getConnection()
      .execute<InsurerPatientPageRow[]>(query.sql, query.params);
    if (!allowed.length) throw new NotFoundException('Paciente no disponible');
    const [recipient] = await this.readPeople(em, [dto.patientProfileId]);
    const [initiator] = await em.getConnection().execute<{ id: string }[]>(
      `select pub.id from community.public_profiles pub
       join iam.users account on account.id = pub.target_id
       where pub.target_id = ? and pub.target_type_concept_id = ?
         and pub.status_concept_id = ? and account.status_concept_id = ?
       order by pub.created_at, pub.id limit 1`,
      [
        actor.id,
        COMM.PROFILE_TARGET_USER,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.USER_ACTIVE,
      ],
    );
    if (!recipient?.community_profile_id || !initiator) {
      throw new PreconditionFailedException(
        'La mensajería no está disponible para estos perfiles',
        {},
      );
    }
    const conversation = await this.messaging.createConversation(
      {
        participantProfileIds: [initiator.id, recipient.community_profile_id],
      },
      actor,
    );
    this.recordAccess(em, [dto.patientProfileId], actor, tenantId);
    await em.flush();
    return { conversationId: conversation.id };
  }

  private recordAccess(
    em: EntityManager,
    patientIds: string[],
    actor: AuthenticatedUser,
    tenantId?: string,
  ): void {
    for (const patientProfileId of patientIds) {
      this.dataAccess.record(em, {
        userId: actor.id,
        patientProfileId,
        tenantId,
        actionConceptId: AUD.ACTION_READ,
        purpose: 'PATIENT_DIRECTORY',
        resourceType: 'patient_profile',
        resourceId: patientProfileId,
      });
    }
  }
}
