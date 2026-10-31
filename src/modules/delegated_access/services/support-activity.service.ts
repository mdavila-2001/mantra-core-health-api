import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { isEngagementLive } from '../domain/engagement-liveness';
import { STATUS } from './concept-maps';
import type { AuditLog } from '../../audit/entities';
import {
  activityBoundary,
  activityKindOf,
  activitySummary,
  auditActionsFor,
  decodeActivityCursor,
  encodeActivityCursor,
  looksLikeUuid,
  sameName,
} from '../domain/support-activity';
import type {
  SupportActivityEntryDto,
  SupportActivityQueryDto,
  SupportActivityResponseDto,
} from '../dto';
import {
  SupportAccessRepository,
  SupportActivityRepository,
  SupportEngagementsRepository,
  type ActivityAttribution,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { withPersonScope } from './tenant-context';

/** Asientos que se piden por lote al recorrer la bitácora. */
const BATCH = 200;
/** Lotes que se recorren como máximo en una página (con filtros muy selectivos). */
const MAX_BATCHES = 8;

/** Quién consulta y, con eso, qué nombres y qué filas puede ver. */
interface Audience {
  readonly kind: 'org' | 'doctor' | 'person';
  /** Organizaciones cuyos asientos se leen. */
  readonly tenantIds: readonly string[];
  /** Personas de apoyo candidatas (autoras de los asientos). */
  readonly userIds: readonly string[];
  /** Doctor que consulta (`doctor`): solo ve filas de su propia agenda y equipo. */
  readonly doctorProfileId?: string;
  /** Doctores cuyo nombre puede ver quien consulta (`person`: los que la aceptaron). */
  readonly visibleDoctorProfileIds?: ReadonlySet<string>;
}

/** Resolución de un asiento a doctor y cita. */
type Attributions = Awaited<
  ReturnType<SupportActivityRepository['attributions']>
>;

/**
 * Bitácora de lo que hizo el personal de apoyo: los asientos de la cadena de
 * auditoría de la organización cuyo autor es una persona con vínculo de apoyo,
 * con el nombre de la persona y del doctor ya resueltos en el servidor.
 *
 * Tres audiencias, cada una ve solo lo suyo:
 * - la **organización** ve a todo su personal y los doctores de su organización;
 * - el **doctor**, solo lo hecho sobre su propia agenda por las personas de su
 *   equipo (lo que se hizo sobre la agenda de otro doctor no figura);
 * - la **persona**, solo lo suyo, y los nombres de los doctores que la aceptaron.
 */
@Injectable()
export class SupportActivityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos y estructura.
   * @param engagements - Delegaciones del doctor.
   * @param activity - Lecturas de la bitácora y de los nombres.
   * @param scope - Política común de tenant.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly activity: SupportActivityRepository,
    private readonly scope: DelegationScopeService,
  ) {}

  /**
   * Actividad de todo el personal de apoyo de la organización activa.
   *
   * @param query - Filtros, tope y cursor.
   * @returns Una página de asientos, los más recientes primero.
   */
  async forTenant(
    query: SupportActivityQueryDto,
  ): Promise<SupportActivityResponseDto> {
    const tenantId = this.scope.resolveTenant();
    if (query.tenantId && query.tenantId !== tenantId) return emptyPage();
    const tx = this.em.fork({ keepTransactionContext: true });
    const records = await this.access.findEngagements(tx, { tenantId });
    return this.page(
      tx,
      {
        kind: 'org',
        tenantIds: [tenantId],
        userIds: records.map((r) => r.userId),
      },
      query,
    );
  }

  /**
   * Actividad del equipo de apoyo de un doctor, sobre su propia agenda.
   *
   * @param actor - El doctor.
   * @param query - Filtros, tope y cursor.
   * @returns Una página de asientos de las personas que lo asisten.
   */
  async forPractitioner(
    actor: AuthenticatedUser,
    query: SupportActivityQueryDto,
  ): Promise<SupportActivityResponseDto> {
    const tenantId = this.scope.resolveTenant();
    if (!actor.practitionerProfileId) {
      throw new ForbiddenException(
        'La cuenta no tiene perfil profesional: no tiene equipo de apoyo.',
      );
    }
    if (query.tenantId && query.tenantId !== tenantId) return emptyPage();
    const tx = this.em.fork({ keepTransactionContext: true });
    const roles = await this.access.findRoleAssignmentsOfPractitioner(
      tx,
      actor.practitionerProfileId,
      tenantId,
    );
    const delegations = await this.engagements.findDelegationsOfDoctor(
      tx,
      roles.map((r) => r.id),
    );
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ids: delegations.map((d) => d.delegateUserAssignmentId),
    });
    return this.page(
      tx,
      {
        kind: 'doctor',
        tenantIds: [tenantId],
        userIds: records.map((r) => r.userId),
        doctorProfileId: actor.practitionerProfileId,
      },
      query,
    );
  }

  /**
   * Actividad de la propia persona de apoyo, en las organizaciones donde tiene un
   * vínculo VIVO (o solo en la de `tenantId`). Sin organización activa: con RLS
   * corre en UNA transacción (`withPersonScope`) y el contexto de sistema solo se
   * abre mientras se leen sus propios vínculos y, para la bitácora, acotado por
   * llaves ya verificadas: su propio id de persona y las organizaciones con
   * vínculo vivo. Un vínculo terminado, vencido o suspendido no abre su
   * organización.
   *
   * @param actor - La persona de apoyo.
   * @param query - Filtros, tope y cursor.
   * @returns Una página de sus asientos.
   */
  async forPerson(
    actor: AuthenticatedUser,
    query: SupportActivityQueryDto,
  ): Promise<SupportActivityResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      const records = await scope.ownRows(() =>
        this.access.findEngagements(tx, { userId: actor.id }),
      );
      const now = new Date();
      const live = records.filter((r) =>
        isEngagementLive(
          {
            assignmentActive: r.assignment.statusConceptId === STATUS.ACTIVE,
            validFrom: r.assignment.validFrom,
            validTo: r.assignment.validTo,
            membershipActive:
              r.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
            membershipEndDate: r.membershipEndDate,
            nextRecertificationAt: r.assignment.nextRecertificationAt,
          },
          now,
        ),
      );
      const mine = query.tenantId
        ? live.filter((r) => r.tenantId === query.tenantId)
        : live;
      if (mine.length === 0) return emptyPage();
      const delegations = await scope.ownRows(() =>
        this.access.findDelegationsOfEngagements(
          tx,
          mine.map((r) => r.assignment.id),
        ),
      );
      const audience: Audience = {
        kind: 'person',
        tenantIds: [...new Set(mine.map((r) => r.tenantId))],
        userIds: [actor.id],
        visibleDoctorProfileIds: new Set(
          delegations.map((d) => d.practitionerProfileId),
        ),
      };
      // Lo de otra persona nunca se pide por esta ruta.
      const own = { ...query, userId: undefined };
      return scope.keyed(() => this.page(tx, audience, own));
    });
  }

  /** Recorre la bitácora, filtra y arma una página. */
  private async page(
    tx: EntityManager,
    audience: Audience,
    query: SupportActivityQueryDto,
  ): Promise<SupportActivityResponseDto> {
    const names = await this.activity.userNames(tx, [
      ...new Set(audience.userIds),
    ]);
    const users = [...new Set(audience.userIds)].filter((id) => {
      if (query.userId && id !== query.userId) return false;
      if (!query.person) return true;
      return looksLikeUuid(query.person)
        ? id === query.person
        : sameName(names.get(id), query.person);
    });
    if (users.length === 0) return emptyPage();

    const limit = query.limit ?? 50;
    const actions = query.action ? auditActionsFor(query.action) : undefined;
    const from = query.from ? activityBoundary(query.from, 'start') : undefined;
    const to = query.to ? activityBoundary(query.to, 'end') : undefined;
    let before = query.cursor ? decodeActivityCursor(query.cursor) : undefined;

    const items: SupportActivityEntryDto[] = [];
    let nextCursor: string | null = null;
    for (let n = 0; n < MAX_BATCHES; n += 1) {
      const rows = await this.activity.scan(tx, {
        tenantIds: audience.tenantIds,
        userIds: users,
        actions,
        from,
        to,
        before,
        limit: BATCH,
      });
      if (rows.length === 0) break;
      const attributions = await this.activity.attributions(
        tx,
        audience.tenantIds,
        refsOf(rows),
      );
      for (const [index, row] of rows.entries()) {
        const entry = toEntry(row, names, attributions, audience, query);
        if (entry) items.push(entry);
        if (items.length === limit && entry) {
          // Hay más si quedan asientos en el lote o el lote vino lleno.
          const more = index < rows.length - 1 || rows.length === BATCH;
          return {
            items,
            count: items.length,
            nextCursor: more ? encodeActivityCursor(row) : null,
          };
        }
      }
      const last = rows[rows.length - 1];
      before = { recordedAt: last.recordedAt, id: last.id };
      // Un lote incompleto es el final de la bitácora.
      if (rows.length < BATCH) {
        return { items, count: items.length, nextCursor: null };
      }
      // Si se agotan los lotes con la página incompleta, el cursor deja seguir.
      nextCursor = encodeActivityCursor(last);
    }
    return { items, count: items.length, nextCursor };
  }
}

/** Página sin asientos. */
function emptyPage(): SupportActivityResponseDto {
  return { items: [], count: 0, nextCursor: null };
}

/** Ids de las entidades de un lote, por tipo, para resolver doctor y cita en una consulta. */
function refsOf(rows: readonly AuditLog[]): {
  bookingIds: string[];
  appointmentIds: string[];
  delegateIds: string[];
  grantIds: string[];
} {
  const ids = (entity: string): string[] => [
    ...new Set(
      rows
        .filter((r) => r.entity === entity && r.entityId)
        .map((r) => r.entityId as string),
    ),
  ];
  return {
    bookingIds: ids('appointment_booking'),
    appointmentIds: ids('appointment'),
    delegateIds: ids('practitioner_delegate_assignment'),
    grantIds: ids('support_scope_grant'),
  };
}

/** El doctor y la cita a los que corresponde el asiento, si se pueden atribuir. */
function attributionOf(
  row: AuditLog,
  attributions: Attributions,
): ActivityAttribution | undefined {
  if (!row.entityId) return undefined;
  switch (row.entity) {
    case 'appointment_booking':
      return attributions.byBooking.get(row.entityId);
    case 'appointment':
      return attributions.byAppointment.get(row.entityId);
    case 'practitioner_delegate_assignment':
      return attributions.byDelegate.get(row.entityId);
    case 'support_scope_grant':
      return attributions.byGrant.get(row.entityId);
    default:
      return undefined;
  }
}

/**
 * Arma la entrada de un asiento para esta audiencia, o `undefined` si no le
 * corresponde verlo (otra agenda para un doctor; otro doctor para el filtro).
 */
function toEntry(
  row: AuditLog,
  names: ReadonlyMap<string, string>,
  attributions: Attributions,
  audience: Audience,
  query: SupportActivityQueryDto,
): SupportActivityEntryDto | undefined {
  const found = attributionOf(row, attributions);
  const profileId = found?.practitionerProfileId;
  if (
    audience.kind === 'doctor' &&
    profileId &&
    profileId !== audience.doctorProfileId
  ) {
    return undefined;
  }
  // La persona solo conoce el nombre de los doctores que la aceptaron.
  const doctorVisible =
    !!profileId &&
    (audience.kind !== 'person' ||
      audience.visibleDoctorProfileIds?.has(profileId) === true);
  const doctor = doctorVisible ? found : undefined;
  if (query.doctor) {
    const wanted = query.doctor;
    const matches = doctor
      ? looksLikeUuid(wanted)
        ? doctor.practitionerProfileId === wanted ||
          doctor.practitionerRoleAssignmentId === wanted
        : sameName(doctor.practitionerName, wanted)
      : false;
    if (!matches) return undefined;
  }
  const kind = activityKindOf(row.action);
  const personName = names.get(row.userId) ?? '';
  const success = row.outcomeConceptId === CONCEPTS.OUTCOME_SUCCESS;
  const bookingId =
    found?.bookingId ??
    (row.entity === 'appointment_booking' ? row.entityId : undefined);
  const appointmentId =
    found?.appointmentId ??
    (row.entity === 'appointment' ? row.entityId : undefined);
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    personName,
    actorName: personName,
    action: kind.code,
    auditAction: row.action,
    permission: kind.permission,
    entity: row.entity,
    entityId: row.entityId,
    bookingId,
    appointmentId,
    practitionerProfileId: doctor?.practitionerProfileId,
    practitionerRoleAssignmentId: doctor?.practitionerRoleAssignmentId,
    practitionerName: doctor?.practitionerName || undefined,
    summary: activitySummary(
      personName,
      kind,
      doctor?.practitionerName || undefined,
      success,
    ),
    success,
    result: success ? 'SUCCESS' : 'FAILURE',
    createdAt: row.recordedAt,
    occurredAt: row.recordedAt,
    recordedAt: row.recordedAt,
  };
}
