import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type AuthenticatedUser } from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import { OutboxService } from '../../messaging/services/outbox.service';
import { AUTHZ } from '../../authz/authz.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  actionPayload,
  atomMeta,
  decideFourEyes,
  eligibleApprovers,
  expireFourEyes,
  hashPayload,
  payloadMatches,
  pendingExpiryFor,
  type ApprovalNeed,
  type ApproverDirectory,
  type FourEyesApproverKind,
  type FourEyesFailure,
  type FourEyesKind,
  type FourEyesRequestState,
  type FourEyesStatus,
  type PermissionSensitivity,
} from '../domain';
import type {
  CreateSupportApprovalDto,
  DecideApprovalDto,
  DecideApprovalResponseDto,
  GrantChangeDetailsDto,
  ListSupportApprovalsResponseDto,
  SupportApprovalCreatedDto,
  SupportApprovalViewDto,
} from '../dto';
import type { FourEyesRequests } from '../entities';
import {
  FourEyesRepository,
  SupportAccessRepository,
  isPatientLinkedToTenant,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { ApproverDirectoryBuilder } from './four-eyes-directory';
import { mapGovernanceDbError } from './governance-db-errors';
import { governanceError } from './governance-errors';
import { grantChangeSummary } from './grant-change.details';
import { inTenantTransaction } from './governance-tx';
import { GovernanceSettingsService } from './governance-settings.service';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import { SupportAccessPolicy } from './support-access.policy';
import { withPersonScope } from './tenant-context';

const KIND_CONCEPT: Readonly<Record<FourEyesKind, string>> = {
  ACTION: DELEG.FOUR_EYES_KIND_ACTION,
  GRANT_CHANGE: DELEG.FOUR_EYES_KIND_GRANT_CHANGE,
  SOD_EXCEPTION: DELEG.FOUR_EYES_KIND_SOD_EXCEPTION,
  REACTIVATION: DELEG.FOUR_EYES_KIND_REACTIVATION,
  ENGAGEMENT_MOVE: DELEG.FOUR_EYES_KIND_ENGAGEMENT_MOVE,
};
const STATUS_CONCEPT: Readonly<Record<FourEyesStatus, string>> = {
  PENDING: DELEG.FOUR_EYES_PENDING,
  APPROVED: DELEG.FOUR_EYES_APPROVED,
  REJECTED: DELEG.FOUR_EYES_REJECTED,
  EXPIRED: DELEG.FOUR_EYES_EXPIRED,
  CANCELLED: DELEG.FOUR_EYES_CANCELLED,
  EXECUTED: DELEG.FOUR_EYES_EXECUTED,
};
const APPROVER_CONCEPT: Readonly<Record<FourEyesApproverKind, string>> = {
  DOCTOR: AUTHZ.APPROVAL_DOCTOR,
  SERVICE_HEAD: AUTHZ.APPROVAL_SERVICE_HEAD,
  SECOND_APPROVER: AUTHZ.APPROVAL_SECOND_APPROVER,
};
const invert = <K extends string>(map: Readonly<Record<K, string>>) =>
  new Map<string, K>(
    (Object.entries(map) as [K, string][]).map(([key, id]) => [id, key]),
  );
const KIND_BY_CONCEPT = invert(KIND_CONCEPT);
const STATUS_BY_CONCEPT = invert(STATUS_CONCEPT);
const APPROVER_BY_CONCEPT = invert(APPROVER_CONCEPT);

/** Lo que se sabe al ejecutar un cambio aprobado. */
export interface FourEyesExecutionContext {
  /** Quien aprobó (ya validado como elegible). */
  readonly approverUserId: string;
  /** Organización de la solicitud. */
  readonly tenantId: string;
  /** Instante de la aprobación. */
  readonly now: Date;
  /** Quien aprobó, completo (para sellar la auditoría de lo ejecutado). */
  readonly actor: AuthenticatedUser;
}

/**
 * Quien ejecuta un cambio administrativo aprobado (`GRANT_CHANGE`,
 * `SOD_EXCEPTION`, `REACTIVATION`, `ENGAGEMENT_MOVE`). Corre DENTRO de la
 * transacción de la aprobación, vuelve a validar guardarrailes, SoD, techo y
 * `row_version` de lo afectado y, si algo ya no vale, lanza una excepción con
 * `reason = FOUR_EYES_PAYLOAD_INVALID` (la solicitud sigue pendiente para que
 * quien aprueba la rechace).
 */
export interface FourEyesExecutor {
  /** Tipo de solicitud que ejecuta. */
  readonly kind: FourEyesKind;
  /**
   * Hechos extra para elegir aprobadores (quién otorgó, sensibilidad, objetivo,
   * motivo de suspensión). Opcional.
   */
  need?(
    tx: EntityManager,
    row: FourEyesRequests,
  ): Promise<
    Partial<
      Pick<
        ApprovalNeed,
        'chainUserIds' | 'sensitivity' | 'target' | 'suspensionReason'
      >
    >
  >;
  /**
   * Lo que ve quien decide, por solicitud (N-1): el detalle completo de lo que
   * se ejecutaría al aprobar, sin datos de pacientes. Opcional.
   */
  describe?(
    tx: EntityManager,
    rows: readonly FourEyesRequests[],
  ): Promise<ReadonlyMap<string, GrantChangeDetailsDto>>;
  /** Ejecuta el cambio y devuelve un resultado con identificadores (sin PHI). */
  execute(
    tx: EntityManager,
    row: FourEyesRequests,
    context: FourEyesExecutionContext,
  ): Promise<Record<string, unknown>>;
}

/**
 * Registro de ejecutores por tipo de solicitud. Cada servicio dueño de un
 * cambio (SoD, ciclo de vida, plantillas) registra el suyo al arrancar; este
 * servicio no conoce sus reglas.
 */
@Injectable()
export class FourEyesExecutors {
  private readonly byKind = new Map<FourEyesKind, FourEyesExecutor>();

  /**
   * Registra (o reemplaza) el ejecutor de un tipo.
   *
   * @param executor - Ejecutor del tipo.
   */
  register(executor: FourEyesExecutor): void {
    this.byKind.set(executor.kind, executor);
  }

  /**
   * Ejecutor de un tipo, si lo hay.
   *
   * @param kind - Tipo de solicitud.
   * @returns El ejecutor o `undefined`.
   */
  get(kind: FourEyesKind): FourEyesExecutor | undefined {
    return this.byKind.get(kind);
  }
}

/** Datos de una solicitud administrativa de cuatro ojos. */
export interface AdministrativeRequestInput {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Tipo (`GRANT_CHANGE`, `SOD_EXCEPTION`, `REACTIVATION`, `ENGAGEMENT_MOVE`). */
  readonly kind: Exclude<FourEyesKind, 'ACTION'>;
  /** Quien pide (el actor). */
  readonly actor: AuthenticatedUser;
  /** Persona a quien afecta. */
  readonly subjectUserId?: string;
  /** Vínculo afectado. */
  readonly organizationUserAssignmentId?: string;
  /** Átomo implicado, si lo hay. */
  readonly permissionCode?: string;
  /** Quién debe aprobar. */
  readonly approverKind: FourEyesApproverKind;
  /** Cuerpo de lo que se aprueba (sin datos de pacientes). */
  readonly payload: Record<string, unknown>;
  /** Motivo escrito por quien pide. */
  readonly reasonText?: string;
}

const MAX_LIST = 100;
/** Solicitudes de acción PENDIENTES que una persona puede tener a la vez (B-M7: no llena la cola). */
export const MAX_PENDING_PER_REQUESTER = 10;
/** Filas que `GET /approvals/pending` lee de SQL por lote. */
const PENDING_PAGE = 100;
/** Filas que revisa como máximo por petición antes de devolver cursor. */
const PENDING_MAX_SCANNED = 500;
/** Tamaño de página por defecto y máximo de `GET /approvals/pending`. */
const PENDING_DEFAULT_LIMIT = 50;

/**
 * Aprobaciones de cuatro ojos (CONTRATO-GOBIERNO §6.5): pedir, decidir,
 * consumir y ejecutar.
 *
 * - **Pedir:** acciones (`ACTION`, 24 h) y cambios administrativos (7 días). El
 *   cuerpo se guarda canónico con su SHA-256.
 * - **Decidir:** el aprobador se calcula AL DECIDIR (`eligibleApprovers`);
 *   nadie aprueba lo propio ni lo que le afecta (servicio y CHECK de la base,
 *   `23514` → 403); CRÍTICA exige el paso extra del aprobador. Una acción queda
 *   `APPROVED` con vigencia (`approved_until`); un cambio administrativo se
 *   ejecuta en la misma transacción y re-valida.
 * - **Consumir:** una sola vez, atómico en SQL ({@link FourEyesRepository.consume}).
 */
@Injectable()
export class FourEyesService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Solicitudes de cuatro ojos.
   * @param access - Vínculos de apoyo.
   * @param directory - Directorio de aprobadores.
   * @param executors - Ejecutores de cambios administrativos.
   * @param policy - Política de apoyo (valida lo que se pide aprobar).
   * @param settings - Ajustes de gobierno.
   * @param stepUp - Paso extra de la sesión.
   * @param audit - Cadena de auditoría.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: FourEyesRepository,
    private readonly access: SupportAccessRepository,
    private readonly directory: ApproverDirectoryBuilder,
    private readonly executors: FourEyesExecutors,
    private readonly policy: SupportAccessPolicy,
    private readonly settings: GovernanceSettingsService,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly audit: AuditTrailService,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FourEyesService.name);
  }

  /**
   * La persona de apoyo pide aprobación para una acción (`POST /me/support-approvals`).
   *
   * Pregunta a la política real, sin consumir nada: si la acción ya se permite no
   * hay nada que aprobar y si no se podría ni con aprobación no se pide.
   *
   * @param dto - Átomo, objetivo y motivo.
   * @param actor - La persona de apoyo.
   * @returns La solicitud creada.
   */
  async createAction(
    dto: CreateSupportApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<SupportApprovalCreatedDto> {
    const meta = atomMeta(dto.atom);
    if (!meta) {
      throw governanceError(
        Reason.FOUR_EYES_REQUEST_INVALID,
        'Ese permiso no existe: no se puede pedir aprobación.',
      );
    }
    const appointmentStartAt = dto.appointmentStartAt
      ? new Date(dto.appointmentStartAt)
      : undefined;
    return inTenantTransaction(this.em, dto.tenantId, async (tx) => {
      const engagements = await this.access.findEngagements(tx, {
        userId: actor.id,
        tenantId: dto.tenantId,
      });
      if (engagements.length === 0) {
        throw governanceError(
          Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
          'Vínculo de apoyo no encontrado.',
        );
      }
      // SEG N-6: el paciente de la solicitud tiene que tener relación con la
      // organización; si no, el mismo 404 que un vínculo inexistente. Sin esto
      // el `peek` de la política leía edad, cobertura y banderas de CUALQUIER
      // paciente de la plataforma y la respuesta distinguía existente de
      // inexistente (oráculo). Misma frontera que `explain`.
      if (
        dto.patientProfileId &&
        !(await isPatientLinkedToTenant(tx, dto.tenantId, dto.patientProfileId))
      ) {
        throw governanceError(
          Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
          'Vínculo de apoyo no encontrado.',
        );
      }
      const decision = await this.policy.can(
        {
          userId: actor.id,
          tenantId: dto.tenantId,
          action: dto.atom as never,
          practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId,
          healthcareServiceId: dto.healthcareServiceId,
          careSpaceId: dto.careSpaceId,
          context: {
            peek: true,
            patientProfileId: dto.patientProfileId,
            appointmentStartAt,
            proof: { reasonText: dto.reasonText },
          },
        },
        tx,
      );
      if (decision.effect !== 'CHALLENGE') {
        throw governanceError(
          Reason.FOUR_EYES_REQUEST_INVALID,
          decision.allowed
            ? 'Esa acción no necesita aprobación: puede hacerla directamente.'
            : 'No tiene ese permiso sobre esa agenda: no se puede pedir aprobación.',
        );
      }
      const wanted = decision.challenge?.details?.approverKind;
      const approverKind: FourEyesApproverKind =
        wanted === 'DOCTOR' ||
        wanted === 'SERVICE_HEAD' ||
        wanted === 'SECOND_APPROVER'
          ? wanted
          : (meta.approvalMode ?? 'SECOND_APPROVER');
      const payload = actionPayload({
        atom: dto.atom,
        practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId,
        healthcareServiceId: dto.healthcareServiceId,
        careSpaceId: dto.careSpaceId,
        patientProfileId: dto.patientProfileId,
        appointmentStartAt,
      });
      const payloadHash = hashPayload(payload);
      const duplicate = await this.repo.findPendingDuplicate(tx, {
        tenantId: dto.tenantId,
        kindConceptId: KIND_CONCEPT.ACTION,
        requesterUserId: actor.id,
        permissionCode: dto.atom,
        payloadHash,
      });
      if (duplicate) {
        throw governanceError(
          Reason.FOUR_EYES_DUPLICATE_PENDING,
          'Ya hay una solicitud pendiente igual a esta.',
          { approvalId: duplicate.id },
        );
      }
      // N-3: el cerrojo por solicitante serializa «contar y crear»: con 30
      // peticiones a la vez ninguna pasa del tope. Cuenta solo lo vigente.
      await this.repo.lockRequesterQueue(tx, dto.tenantId, actor.id);
      const open = await this.repo.countPendingByRequester(
        tx,
        dto.tenantId,
        actor.id,
        new Date(),
      );
      if (open >= MAX_PENDING_PER_REQUESTER) {
        throw governanceError(
          Reason.FOUR_EYES_TOO_MANY_PENDING,
          'Tiene demasiadas solicitudes pendientes. Espere a que se decidan o cancele alguna.',
          { max: MAX_PENDING_PER_REQUESTER },
        );
      }
      const row = this.repo.create(tx, {
        tenantId: dto.tenantId,
        kindConceptId: KIND_CONCEPT.ACTION,
        requesterUserId: actor.id,
        permissionCode: dto.atom,
        approverKindConceptId: APPROVER_CONCEPT[approverKind],
        payload,
        payloadHash,
        payloadSchemaVersion: 1,
        reasonText: dto.reasonText,
        expiresAt: pendingExpiryFor('ACTION', new Date()),
        actorUserId: actor.id,
      });
      await this.flush(tx);
      await this.announce(tx, actor, row, 'requested', 'FOUR_EYES_REQUESTED');
      return toView(row);
    });
  }

  /**
   * Pide la aprobación de un cambio administrativo (lo usan SoD, ciclo de vida
   * y las escrituras que superan un techo). Participa en la transacción de quien
   * la llama: no abre otra.
   *
   * @param tx - Transacción activa del servicio que detectó la necesidad.
   * @param input - Tipo, persona afectada, aprobador y cuerpo.
   * @returns La solicitud creada (con id) para responder `202`.
   */
  async requestAdministrative(
    tx: EntityManager,
    input: AdministrativeRequestInput,
  ): Promise<FourEyesRequests> {
    const payloadHash = hashPayload(input.payload);
    const duplicate = await this.repo.findPendingDuplicate(tx, {
      tenantId: input.tenantId,
      kindConceptId: KIND_CONCEPT[input.kind],
      requesterUserId: input.actor.id,
      permissionCode: input.permissionCode,
      payloadHash,
    });
    if (duplicate) {
      throw governanceError(
        Reason.FOUR_EYES_DUPLICATE_PENDING,
        'Ya hay una solicitud pendiente igual a esta.',
        { approvalId: duplicate.id },
      );
    }
    const row = this.repo.create(tx, {
      tenantId: input.tenantId,
      kindConceptId: KIND_CONCEPT[input.kind],
      requesterUserId: input.actor.id,
      subjectUserId: input.subjectUserId,
      organizationUserAssignmentId: input.organizationUserAssignmentId,
      permissionCode: input.permissionCode,
      approverKindConceptId: APPROVER_CONCEPT[input.approverKind],
      payload: input.payload,
      payloadHash,
      payloadSchemaVersion: 1,
      reasonText: input.reasonText,
      expiresAt: pendingExpiryFor(input.kind, new Date()),
      actorUserId: input.actor.id,
    });
    await this.flush(tx);
    await this.announce(
      tx,
      input.actor,
      row,
      'requested',
      'FOUR_EYES_REQUESTED',
    );
    return row;
  }

  /**
   * Pide la aprobación de un cambio de permisos con átomos CRÍTICA
   * (`GRANT_CHANGE`, CONTRATO-GOBIERNO §6.5): segundo `SECURITY_ADMIN` distinto de
   * quien pide y de la persona afectada. Antes comprueba que EXISTA ese segundo
   * aprobador (D-11): con un solo administrador de seguridad no se habilitan
   * átomos CRÍTICA (422 `FOUR_EYES_NO_APPROVER`), pero el resto de la
   * organización sigue funcionando; mejor negar que otorgar sin segunda mirada.
   *
   * @param tx - Transacción activa de quien intentó otorgar.
   * @param input - Persona afectada, vínculo, átomo crítico y cuerpo firmado.
   * @returns La solicitud creada (con id) para responder `202`.
   * @throws DomainException 422 `FOUR_EYES_NO_APPROVER`; 409 `FOUR_EYES_DUPLICATE_PENDING`.
   */
  async requestGrantChange(
    tx: EntityManager,
    input: Omit<
      AdministrativeRequestInput,
      'kind' | 'approverKind' | 'organizationUserAssignmentId'
    > & { readonly engagementId: string },
  ): Promise<FourEyesRequests> {
    const need: ApprovalNeed = {
      kind: 'GRANT_CHANGE',
      approverKind: 'SECOND_APPROVER',
      requesterUserId: input.actor.id,
      subjectUserId: input.subjectUserId ?? null,
      sensitivity: 'CRITICAL',
    };
    const directory = await this.directory.build(tx, input.tenantId, {});
    if (eligibleApprovers(need, directory).userIds.length === 0) {
      throw governanceError(
        Reason.FOUR_EYES_NO_APPROVER,
        'Para dar permisos críticos hace falta que otro administrador de seguridad los apruebe. Agregue un segundo administrador a la organización.',
        { approversAvailable: 0 },
      );
    }
    const { engagementId, ...rest } = input;
    return this.requestAdministrative(tx, {
      ...rest,
      kind: 'GRANT_CHANGE',
      approverKind: 'SECOND_APPROVER',
      organizationUserAssignmentId: engagementId,
    });
  }

  /**
   * Las solicitudes que la persona pidió (`GET /me/support-approvals`).
   *
   * @param actor - La persona de apoyo.
   * @returns Sus solicitudes, las más recientes primero.
   */
  async listMine(
    actor: AuthenticatedUser,
  ): Promise<ListSupportApprovalsResponseDto> {
    const rows = await withPersonScope(this.em, (tx, scope) =>
      scope.ownRows(() => this.repo.findByRequester(tx, actor.id, MAX_LIST)),
    );
    const items = rows.map(toView);
    return { items, count: items.length };
  }

  /**
   * Cancela una solicitud propia que sigue pendiente.
   *
   * @param id - Solicitud.
   * @param actor - Quien la pidió.
   * @returns La solicitud cancelada.
   */
  async cancel(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportApprovalViewDto> {
    return withPersonScope(
      this.em,
      async (tx, scope) => {
        const mine = await scope.ownRows(() =>
          this.repo.findByRequester(tx, actor.id, MAX_LIST),
        );
        const found = mine.find((r) => r.id === id);
        if (!found) throw this.notFound();
        return scope.inTenant(found.tenantId, async () => {
          const row = await this.repo.findById(tx, found.tenantId, id);
          if (!row || row.requesterUserId !== actor.id) throw this.notFound();
          if (row.statusConceptId !== STATUS_CONCEPT.PENDING) {
            throw governanceError(
              Reason.FOUR_EYES_NOT_PENDING,
              'La solicitud ya no está pendiente.',
            );
          }
          row.statusConceptId = STATUS_CONCEPT.CANCELLED;
          row.updatedAt = new Date();
          row.updatedByUserId = actor.id;
          await this.flush(tx);
          await this.audit.record(tx, actor, {
            action: 'FOUR_EYES_CANCELLED',
            entity: 'four_eyes_request',
            entityId: row.id,
            tenantId: row.tenantId,
            success: true,
          });
          return toView(row);
        });
      },
      { transactional: true },
    );
  }

  /**
   * Lo que YO puedo decidir ahora (`GET /approvals/pending`): solo las pendientes
   * de la organización donde soy aprobador elegible. Pagina por cursor sobre el
   * orden estable `expires_at, id`; SQL ya deja fuera lo vencido y lo propio, y
   * el directorio de aprobadores se arma una vez por agenda en la petición (no
   * por fila), así el costo no crece con la cola.
   *
   * @param actor - Quien consulta.
   * @param query - Tamaño de página (1-100, 50 por defecto) y cursor.
   * @returns Las solicitudes pendientes que puede decidir y, si hay más, `nextCursor`.
   */
  async pending(
    actor: AuthenticatedUser,
    query: { readonly limit?: number; readonly cursor?: string } = {},
  ): Promise<ListSupportApprovalsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const limit = Math.min(
      Math.max(Math.trunc(query.limit ?? PENDING_DEFAULT_LIMIT), 1),
      MAX_LIST,
    );
    let after = query.cursor ? decodePendingCursor(query.cursor) : undefined;
    const directories = new Map<string, Promise<ApproverDirectory>>();
    const directoryOf = (
      row: FourEyesRequests,
      need: ApprovalNeed,
    ): Promise<ApproverDirectory> => {
      const role = (row.payloadJson as Record<string, unknown> | undefined)
        ?.practitionerRoleAssignmentId;
      const key = `${typeof role === 'string' ? role : ''}|${
        need.approverKind === 'SERVICE_HEAD' || need.kind === 'REACTIVATION'
      }`;
      let found = directories.get(key);
      if (!found) {
        found = this.directoryFor(tx, tenantId, row, need);
        directories.set(key, found);
      }
      return found;
    };
    const items: SupportApprovalViewDto[] = [];
    const rowsShown = new Map<string, FourEyesRequests>();
    let scanned = 0;
    let more = false;
    scan: while (scanned < PENDING_MAX_SCANNED) {
      const rows = await this.repo.findPendingByTenant(
        tx,
        tenantId,
        PENDING_PAGE,
        {
          ...(after ? { after } : {}),
          excludeRequesterUserId: actor.id,
          notExpiredAt: now,
        },
      );
      for (const row of rows) {
        scanned += 1;
        after = { expiresAt: row.expiresAt, id: row.id };
        if (row.requesterUserId === actor.id) continue;
        if (row.expiresAt.getTime() <= now.getTime()) continue;
        const need = await this.needOf(tx, row);
        const directory = await directoryOf(row, need);
        if (eligibleApprovers(need, directory).userIds.includes(actor.id)) {
          items.push(toView(row));
          rowsShown.set(row.id, row);
          if (items.length >= limit) {
            more = true;
            break scan;
          }
        }
      }
      // Página llena: puede haber más (si no, terminamos y no hay cursor).
      more = rows.length >= PENDING_PAGE;
      if (!more) break;
    }
    return {
      items: await this.withDetails(tx, items, rowsShown),
      count: items.length,
      ...(more && after ? { nextCursor: encodePendingCursor(after) } : {}),
    };
  }

  /**
   * Decide una solicitud (`POST /approvals/:id/decision`).
   *
   * @param id - Solicitud.
   * @param dto - `APPROVE` o `REJECT` y comentario (obligatorio al rechazar).
   * @param actor - Quien decide.
   * @returns La solicitud decidida y, si ejecutó un cambio, su resultado.
   */
  async decide(
    id: string,
    dto: DecideApprovalDto,
    actor: AuthenticatedUser,
  ): Promise<DecideApprovalResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const outcome = await this.em.transactional(async (tx) => {
      const row = await this.repo.findById(tx, tenantId, id);
      if (!row) throw this.notFound();
      const now = new Date();
      const state = toState(row);
      const need = await this.needOf(tx, row);
      const directory = await this.directoryFor(tx, tenantId, row, need);
      const ttl =
        state.kind === 'ACTION'
          ? (await this.settings.read(tx, tenantId)).settings
              .fourEyesActionTtlMinutes
          : undefined;
      const result = decideFourEyes({
        request: state,
        decision: dto.decision,
        approverUserId: actor.id,
        comment: dto.comment,
        now,
        need,
        directory,
        ttlMinutes: ttl,
      });
      if (!result.ok) {
        if (result.shouldMarkExpired) {
          this.repo.markExpired(row, now);
          await this.flush(tx);
          return { expired: true as const };
        }
        throw failure(result.reason);
      }
      const approving = dto.decision === 'APPROVE';
      let executor = undefined as ReturnType<FourEyesExecutors['get']>;
      if (approving) {
        if (!payloadMatches(row.payloadHash, row.payloadJson))
          throw failure('FOUR_EYES_PAYLOAD_CHANGED');
        if (eligibleApprovers(need, directory).requiresStepUp) {
          await this.stepUp.assertFresh(tx, actor);
        }
        if (state.kind !== 'ACTION') {
          executor = this.executors.get(state.kind);
          if (!executor) {
            throw governanceError(
              Reason.FOUR_EYES_KIND_UNSUPPORTED,
              'Este tipo de solicitud todavía no se puede aprobar desde aquí.',
            );
          }
        }
      }
      // El ejecutor corre ANTES de tocar la fila: si lo aprobado ya no vale, la
      // solicitud queda exactamente como estaba (pendiente) para que se rechace.
      let execution: Record<string, unknown> | undefined;
      if (approving && executor) {
        execution = await executor.execute(tx, row, {
          approverUserId: actor.id,
          tenantId,
          now,
          actor,
        });
      }
      const next = result.request;
      row.statusConceptId = STATUS_CONCEPT[next.status];
      row.decidedAt = next.decidedAt;
      row.decidedByUserId = next.decidedByUserId;
      row.decisionCommentText = next.decisionComment;
      if (next.approvedUntil) {
        row.approvedUntil = next.approvedUntil;
        row.expiresAt = next.expiresAt;
      }
      row.updatedAt = now;
      row.updatedByUserId = actor.id;
      if (execution) {
        row.statusConceptId = STATUS_CONCEPT.EXECUTED;
        row.executedAt = now;
        row.executionResultJson = execution;
      }
      await this.flush(tx);
      const status = STATUS_BY_CONCEPT.get(row.statusConceptId) ?? next.status;
      await this.announce(
        tx,
        actor,
        row,
        approving ? 'approved' : 'rejected',
        approving ? 'FOUR_EYES_APPROVED' : 'FOUR_EYES_REJECTED',
      );
      if (status === 'EXECUTED') {
        await this.announce(tx, actor, row, 'executed', 'FOUR_EYES_EXECUTED');
      }
      return { expired: false as const, row, execution };
    });
    if (outcome.expired) {
      throw governanceError(
        Reason.FOUR_EYES_EXPIRED,
        'La solicitud venció: pida una nueva.',
      );
    }
    return {
      approval: toView(outcome.row),
      ...(outcome.execution ? { execution: outcome.execution } : {}),
    };
  }

  /**
   * Consume una aprobación de acción: UNA sola vez, aunque lleguen diez usos a
   * la vez (actualización condicionada en SQL).
   *
   * @param tx - Transacción activa o contexto de persistencia.
   * @param approvalId - Aprobación.
   * @param now - Instante del uso.
   * @throws DomainException 409 `FOUR_EYES_ALREADY_CONSUMED` si ya no se puede.
   */
  async consume(
    tx: EntityManager,
    approvalId: string,
    now: Date,
  ): Promise<void> {
    if (!(await this.repo.consume(tx, approvalId, now))) {
      throw governanceError(
        Reason.FOUR_EYES_ALREADY_CONSUMED,
        'Esa aprobación ya se usó o venció: pida una nueva.',
      );
    }
  }

  /**
   * Vence una solicitud cuyo plazo pasó (la usa el barrido diario): lo pendiente
   * y lo aprobado sin consumir. No hace `flush`.
   *
   * @param tx - Transacción activa.
   * @param row - Solicitud.
   * @param now - Instante del barrido.
   * @returns `true` si la venció.
   */
  async expire(
    tx: EntityManager,
    row: FourEyesRequests,
    now: Date,
  ): Promise<boolean> {
    const next = expireFourEyes(toState(row), now);
    if (!next) return false;
    this.repo.markExpired(row, now);
    await this.outbox.publishDomainEvent(tx, {
      tenantId: row.tenantId,
      eventType: 'delegated_access.four_eyes.expired',
      aggregateType: 'four_eyes_request',
      aggregateId: row.id,
      payloadJson: eventPayload(row),
    });
    return true;
  }

  /**
   * N-1: a quien puede decidir un cambio administrativo se le muestra TODO lo que
   * se ejecutaría (el ejecutor del tipo lo describe). Un fallo al describir no
   * rompe el listado: la vista queda con su resumen.
   */
  private async withDetails(
    tx: EntityManager,
    items: SupportApprovalViewDto[],
    rows: ReadonlyMap<string, FourEyesRequests>,
  ): Promise<SupportApprovalViewDto[]> {
    const byKind = new Map<FourEyesKind, FourEyesRequests[]>();
    for (const item of items) {
      const row = rows.get(item.id);
      const kind = row ? KIND_BY_CONCEPT.get(row.kindConceptId) : undefined;
      if (!row || !kind || kind === 'ACTION') continue;
      byKind.set(kind, [...(byKind.get(kind) ?? []), row]);
    }
    const details = new Map<string, GrantChangeDetailsDto>();
    for (const [kind, kindRows] of byKind) {
      const executor = this.executors.get(kind);
      if (!executor?.describe) continue;
      try {
        for (const [id, d] of await executor.describe(tx, kindRows)) {
          details.set(id, d);
        }
      } catch (err) {
        this.logger.warn(
          {
            operation: 'delegated_access.four_eyes.describe',
            kind,
            err: err instanceof Error ? err.message : String(err),
          },
          'No se pudo detallar la solicitud: se muestra solo el resumen',
        );
      }
    }
    return items.map((i) =>
      details.has(i.id) ? { ...i, details: details.get(i.id) } : i,
    );
  }

  /** Hechos para elegir aprobadores: lo de la fila más lo que aporte el ejecutor. */
  private async needOf(
    tx: EntityManager,
    row: FourEyesRequests,
  ): Promise<ApprovalNeed> {
    const kind = KIND_BY_CONCEPT.get(row.kindConceptId) ?? 'ACTION';
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const atomSensitivity: PermissionSensitivity | undefined =
      row.permissionCode
        ? atomMeta(row.permissionCode)?.sensitivity
        : undefined;
    const extra =
      kind === 'ACTION'
        ? {}
        : ((await this.executors.get(kind)?.need?.(tx, row)) ?? {});
    return {
      kind,
      approverKind:
        APPROVER_BY_CONCEPT.get(row.approverKindConceptId) ?? 'SECOND_APPROVER',
      requesterUserId: row.requesterUserId,
      subjectUserId: row.subjectUserId ?? null,
      ...(atomSensitivity ? { sensitivity: atomSensitivity } : {}),
      ...(typeof payload.suspensionReason === 'string'
        ? {
            suspensionReason:
              payload.suspensionReason as ApprovalNeed['suspensionReason'],
          }
        : {}),
      ...extra,
    };
  }

  /** Directorio de aprobadores para una solicitud. */
  private directoryFor(
    tx: EntityManager,
    tenantId: string,
    row: FourEyesRequests,
    need: ApprovalNeed,
  ): Promise<ApproverDirectory> {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const role = payload.practitionerRoleAssignmentId;
    return this.directory.build(tx, tenantId, {
      practitionerRoleAssignmentIds: typeof role === 'string' ? [role] : [],
      wantServiceHeads:
        need.approverKind === 'SERVICE_HEAD' || need.kind === 'REACTIVATION',
    });
  }

  /** Evento de dominio (solo ids) y asiento de auditoría de un paso. */
  private async announce(
    tx: EntityManager,
    actor: AuthenticatedUser,
    row: FourEyesRequests,
    event: 'requested' | 'approved' | 'rejected' | 'executed',
    action: string,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId: row.tenantId,
      eventType: `delegated_access.four_eyes.${event}`,
      aggregateType: 'four_eyes_request',
      aggregateId: row.id,
      payloadJson: eventPayload(row),
      actorUserId: actor.id,
    });
    await this.audit.record(tx, actor, {
      action,
      entity: 'four_eyes_request',
      entityId: row.id,
      tenantId: row.tenantId,
      success: true,
    });
    this.logger.info(
      {
        operation: `delegated_access.four_eyes.${event}`,
        tenantId: row.tenantId,
        approvalId: row.id,
        actorId: actor.id,
      },
      'Four-eyes step',
    );
  }

  private async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (err) {
      throw mapGovernanceDbError(err) ?? err;
    }
  }

  private notFound(): Error {
    return governanceError(
      Reason.FOUR_EYES_NOT_FOUND,
      'Solicitud de aprobación no encontrada.',
    );
  }
}

/** Fallas del dominio → excepciones con su estado fijo. */
function failure(reason: FourEyesFailure): Error {
  switch (reason) {
    case 'FOUR_EYES_SELF_APPROVAL':
      return governanceError(
        Reason.FOUR_EYES_SELF_APPROVAL,
        'No puede aprobar lo que usted mismo pidió ni lo que le afecta.',
      );
    case 'FOUR_EYES_NOT_ELIGIBLE':
      return governanceError(
        Reason.FOUR_EYES_NOT_ELIGIBLE,
        'Usted no es quien puede aprobar esta solicitud.',
      );
    case 'FOUR_EYES_NOT_PENDING':
    case 'NOT_APPROVED':
      return governanceError(
        Reason.FOUR_EYES_NOT_PENDING,
        'La solicitud ya no está pendiente.',
      );
    case 'FOUR_EYES_EXPIRED':
      return governanceError(
        Reason.FOUR_EYES_EXPIRED,
        'La solicitud venció: pida una nueva.',
      );
    case 'FOUR_EYES_PAYLOAD_CHANGED':
      return governanceError(
        Reason.FOUR_EYES_PAYLOAD_CHANGED,
        'Lo que se quiere hacer no es lo que se aprobó: pida una aprobación nueva.',
      );
    case 'FOUR_EYES_ALREADY_CONSUMED':
      return governanceError(
        Reason.FOUR_EYES_ALREADY_CONSUMED,
        'Esa aprobación ya se usó.',
      );
    case 'COMMENT_REQUIRED':
      return governanceError(
        Reason.COMMENT_REQUIRED,
        'Para rechazar escriba un comentario de al menos 5 caracteres.',
      );
    default:
      return governanceError(
        Reason.FOUR_EYES_NOT_FOUND,
        'Solicitud de aprobación no encontrada.',
      );
  }
}

/** Cursor opaco de `GET /approvals/pending`: `expires_at` e id de la última fila vista. */
function encodePendingCursor(at: { expiresAt: Date; id: string }): string {
  return Buffer.from(`${at.expiresAt.toISOString()}|${at.id}`).toString(
    'base64url',
  );
}

/** Lee el cursor; uno ilegible equivale a no haber cursor (empieza de nuevo). */
function decodePendingCursor(
  cursor: string,
): { expiresAt: Date; id: string } | undefined {
  const [iso, id] = Buffer.from(cursor, 'base64url')
    .toString('utf8')
    .split('|');
  const expiresAt = new Date(iso ?? '');
  return id && !Number.isNaN(expiresAt.getTime())
    ? { expiresAt, id }
    : undefined;
}

function eventPayload(row: FourEyesRequests): Record<string, unknown> {
  return {
    approvalId: row.id,
    tenantId: row.tenantId,
    kind: KIND_BY_CONCEPT.get(row.kindConceptId),
    status: STATUS_BY_CONCEPT.get(row.statusConceptId),
    requesterUserId: row.requesterUserId,
    ...(row.subjectUserId ? { subjectUserId: row.subjectUserId } : {}),
    ...(row.permissionCode ? { atom: row.permissionCode } : {}),
  };
}

function toState(row: FourEyesRequests): FourEyesRequestState {
  return {
    id: row.id,
    kind: KIND_BY_CONCEPT.get(row.kindConceptId) ?? 'ACTION',
    status: STATUS_BY_CONCEPT.get(row.statusConceptId) ?? 'PENDING',
    requesterUserId: row.requesterUserId,
    subjectUserId: row.subjectUserId ?? null,
    approverKind:
      APPROVER_BY_CONCEPT.get(row.approverKindConceptId) ?? 'SECOND_APPROVER',
    permissionCode: row.permissionCode ?? null,
    payloadHash: row.payloadHash,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    ...(row.decidedAt ? { decidedAt: row.decidedAt } : {}),
    ...(row.decidedByUserId ? { decidedByUserId: row.decidedByUserId } : {}),
    ...(row.decisionCommentText
      ? { decisionComment: row.decisionCommentText }
      : {}),
    ...(row.approvedUntil ? { approvedUntil: row.approvedUntil } : {}),
    ...(row.consumedAt ? { consumedAt: row.consumedAt } : {}),
    ...(row.executedAt ? { executedAt: row.executedAt } : {}),
  };
}

const SUMMARY: Readonly<
  Record<FourEyesKind, (row: FourEyesRequests) => string>
> = {
  ACTION: (row) =>
    `Permitir una acción: ${atomMeta(row.permissionCode ?? '')?.name ?? 'acción sensible'}.`,
  GRANT_CHANGE: (row) => grantChangeSummary(row.payloadJson),
  SOD_EXCEPTION: (row) =>
    `Excepción a la segregación de funciones${
      typeof (row.payloadJson as { ruleCode?: unknown } | undefined)
        ?.ruleCode === 'string'
        ? ` (${(row.payloadJson as { ruleCode: string }).ruleCode})`
        : ''
    }.`,
  REACTIVATION: () => 'Reactivar a una persona suspendida.',
  ENGAGEMENT_MOVE: () =>
    'Cambio de rol que sube los privilegios de la persona.',
};

function toView(row: FourEyesRequests): SupportApprovalViewDto {
  const kind = KIND_BY_CONCEPT.get(row.kindConceptId) ?? 'ACTION';
  return {
    id: row.id,
    tenantId: row.tenantId,
    kind,
    status: STATUS_BY_CONCEPT.get(row.statusConceptId) ?? 'PENDING',
    approverKind:
      APPROVER_BY_CONCEPT.get(row.approverKindConceptId) ?? 'SECOND_APPROVER',
    ...(row.permissionCode ? { atom: row.permissionCode } : {}),
    requesterUserId: row.requesterUserId,
    ...(row.subjectUserId ? { subjectUserId: row.subjectUserId } : {}),
    ...(row.reasonText ? { reasonText: row.reasonText } : {}),
    ...(row.decisionCommentText
      ? { decisionComment: row.decisionCommentText }
      : {}),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    ...(row.approvedUntil ? { approvedUntil: row.approvedUntil } : {}),
    ...(row.decidedAt ? { decidedAt: row.decidedAt } : {}),
    ...(row.consumedAt ? { consumedAt: row.consumedAt } : {}),
    summary: SUMMARY[kind](row),
  };
}
