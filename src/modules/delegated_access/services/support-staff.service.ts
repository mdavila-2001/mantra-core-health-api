import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  awaitingPartyOf,
  buildSupportScope,
  grantsOrganizationAccess,
  initiatorOf,
  mayDecide,
  scopeCoversPractitioner,
  targetKindOf,
  type SupportDecider,
  type SupportParty,
  type SupportLinkRow,
  type SupportLinkStatus,
  type SupportTenantScope,
} from '../domain/support-links';
import type {
  CreateEngagementRequestDto,
  DecideSupportLinkDto,
  InviteSupportStaffDto,
  MySupportEngagementsResponseDto,
  PractitionerInviteSupportDto,
  SupportAccessResponseDto,
  SupportAgendaQueryDto,
  SupportAgendaResponseDto,
  SupportCatalogResponseDto,
  SupportLinkListDto,
  SupportLinksCreatedDto,
  SupportLinkViewDto,
  SupportTargetDto,
} from '../dto/support-staff.dto';
import { SupportLinksRepository } from '../repositories/support-links.repository';

/** Roles de plataforma que administran cualquier hospital (como `TenantAdministrationService`). */
const PLATFORM_ADMIN_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

/** Rango máximo de agenda que se lee de una vez. */
const MAX_AGENDA_DAYS = 31;

/** 403 con `reason` del módulo. */
function forbidden(message: string, reason: Reason): DomainException {
  return new DomainException(
    HttpStatus.FORBIDDEN,
    ErrorCode.FORBIDDEN,
    message,
    undefined,
    reason,
  );
}

/** Un objetivo ya validado contra el hospital. */
interface ResolvedTarget {
  readonly kind: 'LOCATION' | 'PRACTITIONER';
  readonly practiceId?: string;
  readonly practiceSiteId?: string;
  readonly clinicalUnitId?: string;
  readonly careSpaceId?: string;
  readonly practitionerRoleAssignmentId?: string;
  readonly accessScopeConceptId: string;
}

/**
 * Secretarias (personal de apoyo hospitalario): pedir, ofrecer, aceptar,
 * rechazar y terminar vínculos, y el alcance que de ellos resulta.
 *
 * ## El esquema de solicitud y aceptación
 *
 * Es el mismo del vínculo médico–organización (`ProfilesAffiliationsService`):
 * una parte pide, la otra decide, y nada abre acceso hasta que la otra parte
 * acepta. Cambia quiénes son las partes —la secretaria por un lado, el hospital
 * o el doctor por el otro— y que el pedido puede venir de cualquiera de los dos
 * lados (la secretaria pide entrar; el hospital o el doctor la invitan). Quién
 * decide lo dice {@link awaitingPartyOf}; si el actor puede, {@link mayDecide}.
 *
 * ## El alcance
 *
 * Aceptar un vínculo abre la organización para el token (membresía con
 * `DIR.ROLE_SUPPORT`, que no lee la estructura entera) y suma el lugar o el
 * doctor al alcance. Lo que la secretaria puede ver sale **sólo** de sus
 * vínculos activos ({@link buildSupportScope}); la agenda de un doctor exige un
 * vínculo activo con ese doctor en ese hospital.
 *
 * Los motivos y mensajes que llegan en los cuerpos no se guardan (las tablas no
 * tienen columna para ellos) ni se registran: pueden traer datos de pacientes.
 */
@Injectable()
export class SupportStaffService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param links - Lecturas y escrituras de los vínculos.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly links: SupportLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportStaffService.name);
  }

  // --------------------------------------------------------------------------
  // La secretaria
  // --------------------------------------------------------------------------

  /** Sus vínculos (todos) y, aparte, los que siguen pendientes. */
  async listMine(
    actor: AuthenticatedUser,
  ): Promise<MySupportEngagementsResponseDto> {
    const rows = await this.links.findLinks(this.em.fork(), {
      supportUserId: actor.id,
    });
    const items = rows.map(toView);
    return {
      items,
      count: items.length,
      requests: items.filter((item) => item.status === 'PENDING'),
    };
  }

  /** Lo que puede ver hoy: hospitales, sedes, servicios, pisos y doctores. */
  async myAccess(actor: AuthenticatedUser): Promise<SupportAccessResponseDto> {
    const em = this.em.fork();
    const scope = await this.scopeOf(em, actor.id);
    const open = new Set(
      await this.links.findActiveMembershipTenantIds(em, actor.id),
    );
    // `organizationAccess`: el hospital la aceptó y entra a su token. Sin eso
    // (un vínculo que sólo aceptó el doctor) ve la agenda de ese doctor y nada
    // más del hospital.
    return {
      tenants: scope.map((tenant) => ({
        ...tenant,
        organizationAccess: open.has(tenant.tenantId),
      })),
    };
  }

  /**
   * Catálogo de un hospital para armar el pedido. Lo puede ver cualquier
   * secretaria: son los nombres de las sedes, servicios, pisos y doctores, lo
   * mismo que un paciente ve al buscar dónde atenderse.
   */
  async catalogForSupport(
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<SupportCatalogResponseDto> {
    const em = this.em.fork();
    await this.requireSecretaryPerson(em, actor.id);
    return this.catalog(em, tenantId);
  }

  /**
   * La secretaria pide entrar a un hospital, a sus sedes, servicios o pisos, o
   * asistir a sus doctores. Cada objetivo queda como un vínculo PENDING.
   */
  async request(
    dto: CreateEngagementRequestDto,
    actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    const created = await this.em.transactional(async (tx) => {
      const personId = await this.requireSecretaryPerson(tx, actor.id);
      return this.createLinks(tx, {
        tenantId: dto.tenantId,
        supportUserId: actor.id,
        supportPersonId: personId,
        items: dto.items,
        actorUserId: actor.id,
        initiatedBy: 'SUPPORT_STAFF',
      });
    });
    this.logger.info(
      {
        operation: 'delegated_access.support.request',
        tenantId: dto.tenantId,
        userId: actor.id,
        links: created.length,
      },
      'Support staff requested links',
    );
    return this.createdView(dto.tenantId, created);
  }

  /** La secretaria acepta lo que le ofrecieron el hospital o un doctor. */
  async confirmMine(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.decide(id, actor, 'APPROVED', (row) => ({
      isSupportStaff: row.supportUserId === actor.id,
      isOrganizationAdmin: false,
      isPractitioner: false,
    }));
  }

  /** La secretaria rechaza lo que le ofrecieron. */
  async declineMine(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.decide(id, actor, 'REJECTED', (row) => ({
      isSupportStaff: row.supportUserId === actor.id,
      isOrganizationAdmin: false,
      isPractitioner: false,
    }));
  }

  /** La secretaria deja un vínculo (o retira su pedido). */
  async leaveMine(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.end(id, actor, async (row) => row.supportUserId === actor.id);
  }

  /**
   * La agenda de un doctor, sólo si la secretaria tiene un vínculo ACTIVO con
   * ese doctor en ese hospital. Es la comprobación que hace a la API la
   * autoridad: el front no decide qué agenda se ve.
   */
  async agenda(
    query: SupportAgendaQueryDto,
    actor: AuthenticatedUser,
  ): Promise<SupportAgendaResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    const span = to.getTime() - from.getTime();
    if (!(span > 0) || span > MAX_AGENDA_DAYS * 24 * 60 * 60 * 1000) {
      throw new PreconditionFailedException(
        `El rango tiene que ser positivo y de ${MAX_AGENDA_DAYS} días como mucho`,
        undefined,
        Reason.SUPPORT_AGENDA_RANGE_INVALID,
      );
    }
    const em = this.em.fork();
    const scope = await this.scopeOf(em, actor.id);
    if (
      !scopeCoversPractitioner(
        scope,
        query.tenantId,
        query.practitionerRoleAssignmentId,
      )
    ) {
      throw forbidden(
        'No tiene un vínculo activo con ese doctor en ese hospital',
        Reason.SUPPORT_SCOPE_DENIED,
      );
    }
    const role = await this.links.findActiveRoleAssignmentInTenant(
      em,
      query.tenantId,
      query.practitionerRoleAssignmentId,
    );
    if (!role) {
      // La vinculación del doctor dejó de estar activa: el vínculo con la
      // secretaria ya no abre nada.
      throw forbidden(
        'No tiene un vínculo activo con ese doctor en ese hospital',
        Reason.SUPPORT_SCOPE_DENIED,
      );
    }
    const items = await this.links.findPractitionerAgenda(
      em,
      query.tenantId,
      role.practitionerProfileId,
      from,
      to,
    );
    return { items, count: items.length };
  }

  // --------------------------------------------------------------------------
  // El hospital
  // --------------------------------------------------------------------------

  /** Catálogo del hospital activo, para invitar. */
  async catalogForOrganization(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<SupportCatalogResponseDto> {
    const em = this.em.fork();
    await this.assertOrganizationAdmin(em, tenantId, actor);
    return this.catalog(em, tenantId);
  }

  /** La bandeja del hospital: vínculos en un estado (por defecto PENDING). */
  async listForOrganization(
    tenantId: string,
    actor: AuthenticatedUser,
    status: SupportLinkStatus = 'PENDING',
  ): Promise<SupportLinkListDto> {
    const em = this.em.fork();
    await this.assertOrganizationAdmin(em, tenantId, actor);
    const rows = await this.links.findLinks(em, {
      tenantId,
      statuses: [status],
    });
    const items = rows.map(toView);
    return { items, count: items.length, nextCursor: null };
  }

  /** Personal de apoyo del hospital: vínculos vivos (activos y pendientes). */
  async listEngagementsForOrganization(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkListDto> {
    const em = this.em.fork();
    await this.assertOrganizationAdmin(em, tenantId, actor);
    const rows = await this.links.findLinks(em, {
      tenantId,
      statuses: ['ACTIVE', 'PENDING'],
    });
    const items = rows.map(toView);
    return { items, count: items.length, nextCursor: null };
  }

  /** El hospital acepta o rechaza lo que pidió una secretaria. */
  async decideForOrganization(
    tenantId: string,
    id: string,
    dto: DecideSupportLinkDto,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.decide(
      id,
      actor,
      dto.decision,
      () => ({
        isSupportStaff: false,
        isOrganizationAdmin: true,
        isPractitioner: false,
      }),
      async (tx, row) => {
        if (row.tenantId !== tenantId) return false;
        await this.assertOrganizationAdmin(tx, tenantId, actor);
        return true;
      },
    );
  }

  /** El hospital termina un vínculo (o retira una invitación). */
  async endForOrganization(
    tenantId: string,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.end(id, actor, async (row, tx) => {
      if (row.tenantId !== tenantId) return false;
      await this.assertOrganizationAdmin(tx, tenantId, actor);
      return true;
    });
  }

  /** El hospital invita a una secretaria (por su documento) a lugares o doctores. */
  async inviteForOrganization(
    tenantId: string,
    dto: InviteSupportStaffDto,
    actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    const created = await this.em.transactional(async (tx) => {
      await this.assertOrganizationAdmin(tx, tenantId, actor);
      const secretary = await this.requireSecretaryByNationalId(
        tx,
        dto.nationalId,
      );
      return this.createLinks(tx, {
        tenantId,
        supportUserId: secretary.userId,
        supportPersonId: secretary.personId,
        items: dto.items,
        actorUserId: actor.id,
        // Sólo después de `assertOrganizationAdmin`, unas líneas arriba.
        initiatedBy: 'ORGANIZATION',
      });
    });
    this.logger.info(
      {
        operation: 'delegated_access.support.invite',
        tenantId,
        actorId: actor.id,
        links: created.length,
      },
      'Organization invited support staff',
    );
    return this.createdView(tenantId, created);
  }

  // --------------------------------------------------------------------------
  // El doctor
  // --------------------------------------------------------------------------

  /** Las secretarias del doctor (activas y pendientes), en todos sus hospitales. */
  async practitionerTeam(
    actor: AuthenticatedUser,
  ): Promise<SupportLinkListDto> {
    if (!actor.practitionerProfileId) {
      return { items: [], count: 0, nextCursor: null };
    }
    const rows = await this.links.findLinks(this.em.fork(), {
      practitionerProfileId: actor.practitionerProfileId,
      statuses: ['ACTIVE', 'PENDING'],
    });
    const items = rows.map(toView);
    return { items, count: items.length, nextCursor: null };
  }

  /** El doctor acepta a la secretaria que pidió asistirlo. */
  async acceptForPractitioner(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.decide(id, actor, 'APPROVED', (row) => ({
      isSupportStaff: false,
      isOrganizationAdmin: false,
      isPractitioner: isOwnPractitionerLink(row, actor),
    }));
  }

  /** El doctor rechaza a la secretaria que pidió asistirlo. */
  async rejectForPractitioner(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.decide(id, actor, 'REJECTED', (row) => ({
      isSupportStaff: false,
      isOrganizationAdmin: false,
      isPractitioner: isOwnPractitionerLink(row, actor),
    }));
  }

  /** El doctor termina el vínculo con una secretaria suya. */
  async endForPractitioner(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<SupportLinkViewDto> {
    return this.end(id, actor, async (row) =>
      isOwnPractitionerLink(row, actor),
    );
  }

  /** El doctor invita a una secretaria (por su documento) a asistirlo. */
  async inviteForPractitioner(
    dto: PractitionerInviteSupportDto,
    actor: AuthenticatedUser,
  ): Promise<SupportLinksCreatedDto> {
    const { tenantId, created } = await this.em.transactional(async (tx) => {
      const own = actor.practitionerProfileId
        ? await this.links.findActiveRoleAssignmentsOfPractitioner(
            tx,
            actor.practitionerProfileId,
          )
        : [];
      const role = own.find(
        (assignment) => assignment.id === dto.practitionerRoleAssignmentId,
      );
      if (!role) {
        // Una vinculación ajena responde igual que una inexistente.
        throw new ResourceNotFoundException(
          'Vinculación no encontrada',
          undefined,
          Reason.SUPPORT_TARGET_NOT_FOUND,
        );
      }
      const secretary = await this.requireSecretaryByNationalId(
        tx,
        dto.nationalId,
      );
      const links = await this.createLinks(tx, {
        tenantId: role.tenantId,
        supportUserId: secretary.userId,
        supportPersonId: secretary.personId,
        items: [
          {
            targetKind: 'PRACTITIONER',
            practitionerRoleAssignmentId: role.id,
          },
        ],
        actorUserId: actor.id,
        initiatedBy: 'PRACTITIONER',
      });
      return { tenantId: role.tenantId, created: links };
    });
    this.logger.info(
      {
        operation: 'delegated_access.support.practitioner-invite',
        tenantId,
        actorId: actor.id,
      },
      'Practitioner invited support staff',
    );
    return this.createdView(tenantId, created);
  }

  // --------------------------------------------------------------------------
  // Tronco común
  // --------------------------------------------------------------------------

  /** El alcance vigente de una secretaria. */
  private async scopeOf(
    em: EntityManager,
    userId: string,
  ): Promise<SupportTenantScope[]> {
    const rows = await this.links.findLinks(em, {
      supportUserId: userId,
      statuses: ['ACTIVE'],
    });
    return buildSupportScope(rows);
  }

  /** Catálogo de un hospital, con 404 si no existe. */
  private async catalog(
    em: EntityManager,
    tenantId: string,
  ): Promise<SupportCatalogResponseDto> {
    const organizationName = await this.links.findOrganizationName(
      em,
      tenantId,
    );
    if (organizationName === undefined) {
      throw new ResourceNotFoundException(
        'Organización no encontrada',
        undefined,
        Reason.SUPPORT_ORGANIZATION_NOT_FOUND,
      );
    }
    const catalog = await this.links.findCatalog(em, tenantId);
    return { tenantId, organizationName, ...catalog };
  }

  /**
   * Valida cada objetivo contra el hospital y crea los vínculos PENDING.
   * Un objetivo ajeno al hospital responde igual que uno inexistente.
   */
  private async createLinks(
    tx: EntityManager,
    input: {
      readonly tenantId: string;
      readonly supportUserId: string;
      readonly supportPersonId: string;
      readonly items: readonly SupportTargetDto[];
      readonly actorUserId: string;
      /**
       * Quién inicia. Lo fija cada caso de uso tras su propia comprobación
       * (`ORGANIZATION` sólo después de `assertOrganizationAdmin`), nunca el
       * cliente.
       */
      readonly initiatedBy: SupportParty;
    },
  ): Promise<string[]> {
    const organizationName = await this.links.findOrganizationName(
      tx,
      input.tenantId,
    );
    if (organizationName === undefined) {
      throw new ResourceNotFoundException(
        'Organización no encontrada',
        undefined,
        Reason.SUPPORT_ORGANIZATION_NOT_FOUND,
      );
    }
    const resolved: ResolvedTarget[] = [];
    for (const item of input.items) {
      resolved.push(await this.resolveTarget(tx, input.tenantId, item));
    }

    const live = await this.links.findLinks(tx, {
      supportUserId: input.supportUserId,
      tenantId: input.tenantId,
      statuses: ['PENDING', 'ACTIVE'],
    });
    const seen = new Set(live.map(targetKey));
    for (const target of resolved) {
      const key = targetKey({
        kind: target.kind,
        practiceSiteId:
          target.careSpaceId || target.clinicalUnitId
            ? null
            : (target.practiceSiteId ?? null),
        clinicalUnitId: target.careSpaceId
          ? null
          : (target.clinicalUnitId ?? null),
        careSpaceId: target.careSpaceId ?? null,
        practitionerRoleAssignmentId:
          target.practitionerRoleAssignmentId ?? null,
      });
      if (seen.has(key)) {
        throw new ConflictException(
          'Ya hay un vínculo vivo con ese mismo objetivo',
          undefined,
          Reason.SUPPORT_LINK_DUPLICATE,
        );
      }
      seen.add(key);
    }

    const membership = await this.links.findOrCreateMembership(
      tx,
      input.supportUserId,
      input.tenantId,
      input.actorUserId,
    );
    const ids: string[] = [];
    for (const target of resolved) {
      if (target.kind === 'PRACTITIONER') {
        const link = await this.links.createPractitionerLink(tx, {
          practitionerRoleAssignmentId:
            target.practitionerRoleAssignmentId as string,
          supportPersonId: input.supportPersonId,
          initiatedBy: input.initiatedBy,
          actorUserId: input.actorUserId,
        });
        ids.push(link.id);
      } else {
        const link = await this.links.createLocationLink(tx, {
          tenantId: input.tenantId,
          tenantMembershipId: membership.id,
          practiceId: target.practiceId,
          // Sólo la columna más específica: así el vínculo nombra un único
          // objetivo y `locationTargetKind` no tiene que adivinar.
          practiceSiteId:
            target.careSpaceId || target.clinicalUnitId
              ? undefined
              : target.practiceSiteId,
          clinicalUnitId: target.careSpaceId
            ? undefined
            : target.clinicalUnitId,
          careSpaceId: target.careSpaceId,
          accessScopeConceptId: target.accessScopeConceptId,
          initiatedBy: input.initiatedBy,
          actorUserId: input.actorUserId,
        });
        ids.push(link.id);
      }
    }
    await tx.flush();
    return ids;
  }

  /** Valida un objetivo contra el hospital. */
  private async resolveTarget(
    tx: EntityManager,
    tenantId: string,
    item: SupportTargetDto,
  ): Promise<ResolvedTarget> {
    const missing = (field: string): never => {
      throw new PreconditionFailedException(
        `El objetivo ${item.targetKind} exige ${field}`,
        { targetKind: item.targetKind },
        Reason.SUPPORT_TARGET_INVALID,
      );
    };
    const notFound = (): never => {
      throw new ResourceNotFoundException(
        'Objetivo no encontrado en esa organización',
        { targetKind: item.targetKind },
        Reason.SUPPORT_TARGET_NOT_FOUND,
      );
    };
    switch (item.targetKind) {
      case 'ORGANIZATION':
        return { kind: 'LOCATION', accessScopeConceptId: DELEG.SCOPE_TENANT };
      case 'SITE': {
        if (!item.practiceSiteId) return missing('practiceSiteId');
        const site = await this.links.findSiteInTenant(
          tx,
          tenantId,
          item.practiceSiteId,
        );
        if (!site) return notFound();
        return {
          kind: 'LOCATION',
          practiceId: site.practiceId,
          practiceSiteId: item.practiceSiteId,
          accessScopeConceptId: DELEG.SCOPE_SITE,
        };
      }
      case 'SERVICE': {
        if (!item.clinicalUnitId) return missing('clinicalUnitId');
        const unit = await this.links.findUnitInTenant(
          tx,
          tenantId,
          item.clinicalUnitId,
        );
        if (!unit) return notFound();
        return {
          kind: 'LOCATION',
          practiceId: unit.practiceId,
          practiceSiteId: unit.practiceSiteId,
          clinicalUnitId: item.clinicalUnitId,
          accessScopeConceptId: DELEG.SCOPE_UNIT,
        };
      }
      case 'SPACE': {
        if (!item.careSpaceId) return missing('careSpaceId');
        const space = await this.links.findSpaceInTenant(
          tx,
          tenantId,
          item.careSpaceId,
        );
        if (!space) return notFound();
        return {
          kind: 'LOCATION',
          practiceId: space.practiceId,
          practiceSiteId: space.practiceSiteId,
          clinicalUnitId: space.clinicalUnitId ?? undefined,
          careSpaceId: item.careSpaceId,
          accessScopeConceptId: DELEG.SCOPE_SPACE,
        };
      }
      case 'PRACTITIONER': {
        if (!item.practitionerRoleAssignmentId) {
          return missing('practitionerRoleAssignmentId');
        }
        const role = await this.links.findActiveRoleAssignmentInTenant(
          tx,
          tenantId,
          item.practitionerRoleAssignmentId,
        );
        if (!role) return notFound();
        return {
          kind: 'PRACTITIONER',
          practitionerRoleAssignmentId: item.practitionerRoleAssignmentId,
          accessScopeConceptId: DELEG.SCOPE_PRACTICE,
        };
      }
      default:
        return missing('targetKind');
    }
  }

  /**
   * Acepta o rechaza un vínculo pendiente.
   *
   * @param id - El vínculo.
   * @param actor - Quien decide.
   * @param decision - Aceptar o rechazar.
   * @param who - Qué es el actor respecto de ese vínculo.
   * @param guard - Comprobación extra (hospital activo, administración); si
   *   devuelve `false`, el vínculo se trata como inexistente.
   */
  private async decide(
    id: string,
    actor: AuthenticatedUser,
    decision: 'APPROVED' | 'REJECTED',
    who: (row: SupportLinkRow) => SupportDecider,
    guard?: (tx: EntityManager, row: SupportLinkRow) => Promise<boolean>,
  ): Promise<SupportLinkViewDto> {
    const row = await this.em.transactional(async (tx) => {
      const link = await this.loadLink(tx, id);
      if (guard && !(await guard(tx, link))) throw linkNotFound();
      const decider = who(link);
      if (
        !decider.isSupportStaff &&
        !decider.isOrganizationAdmin &&
        !decider.isPractitioner
      ) {
        throw linkNotFound();
      }
      if (!mayDecide(link, decider)) {
        throw new PreconditionFailedException(
          'Ese vínculo no está esperando su decisión',
          { status: link.status, awaiting: awaitingPartyOf(link) },
          Reason.SUPPORT_LINK_NOT_AWAITING_YOU,
        );
      }
      const status: SupportLinkStatus =
        decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED';
      await this.links.setStatus(tx, link.kind, link.id, status, actor.id);
      // Sólo el hospital mete a alguien en el hospital. Un vínculo de lugar
      // siempre lo aprobó el hospital (lo aceptó su administración, o lo
      // ofreció él y lo aceptó la secretaria); uno con un doctor, sólo si lo
      // aceptó la administración o lo ofreció el hospital. El que acepta el
      // doctor solo abre la agenda de ese doctor (`/me/support-agenda`, sin
      // tenant activo), no la membresía del hospital.
      if (status === 'ACTIVE' && grantsOrganizationAccess(link, decider)) {
        await this.links.activateMembership(
          tx,
          link.supportUserId,
          link.tenantId,
          actor.id,
        );
      }
      await tx.flush();
      if (status === 'REJECTED') {
        await this.links.closeMembershipIfUnused(
          tx,
          link.supportUserId,
          link.tenantId,
          actor.id,
        );
        await tx.flush();
      }
      return { ...link, status };
    });
    this.logger.info(
      {
        operation: 'delegated_access.support.decide',
        linkId: id,
        kind: row.kind,
        tenantId: row.tenantId,
        decision,
        actorId: actor.id,
      },
      'Support link decided',
    );
    return toView(row);
  }

  /** Termina un vínculo vivo (activo o pendiente). */
  private async end(
    id: string,
    actor: AuthenticatedUser,
    allowed: (row: SupportLinkRow, tx: EntityManager) => Promise<boolean>,
  ): Promise<SupportLinkViewDto> {
    const row = await this.em.transactional(async (tx) => {
      const link = await this.loadLink(tx, id);
      if (!(await allowed(link, tx))) throw linkNotFound();
      if (link.status !== 'ACTIVE' && link.status !== 'PENDING') {
        throw new PreconditionFailedException(
          'Sólo se termina un vínculo activo o pendiente',
          { status: link.status },
          Reason.SUPPORT_LINK_NOT_LIVE,
        );
      }
      await this.links.setStatus(tx, link.kind, link.id, 'ENDED', actor.id);
      await tx.flush();
      await this.links.closeMembershipIfUnused(
        tx,
        link.supportUserId,
        link.tenantId,
        actor.id,
      );
      await tx.flush();
      return { ...link, status: 'ENDED' as const };
    });
    this.logger.info(
      {
        operation: 'delegated_access.support.end',
        linkId: id,
        kind: row.kind,
        tenantId: row.tenantId,
        actorId: actor.id,
      },
      'Support link ended',
    );
    return toView(row);
  }

  /** Un vínculo por id, o 404. */
  private async loadLink(
    em: EntityManager,
    id: string,
  ): Promise<SupportLinkRow> {
    const [link] = await this.links.findLinks(em, { id });
    if (!link) throw linkNotFound();
    return link;
  }

  /** La persona de secretaria de la cuenta, o 403. */
  private async requireSecretaryPerson(
    em: EntityManager,
    userId: string,
  ): Promise<string> {
    const personId = await this.links.findSecretaryPersonId(em, userId);
    if (!personId) {
      throw forbidden(
        'La cuenta no tiene perfil de secretaria',
        Reason.SUPPORT_PROFILE_REQUIRED,
      );
    }
    return personId;
  }

  /** La secretaria con ese documento, o 404. */
  private async requireSecretaryByNationalId(
    em: EntityManager,
    nationalId: string,
  ): Promise<{ userId: string; personId: string }> {
    const found = await this.links.findSecretaryByNationalId(em, nationalId);
    if (!found) {
      throw new ResourceNotFoundException(
        'No hay una secretaria registrada con ese documento',
        undefined,
        Reason.SUPPORT_STAFF_NOT_FOUND,
      );
    }
    return found;
  }

  /**
   * Exige administrar el hospital: OWNER/ADMIN activo de él, o un rol de
   * plataforma que lo alcance (misma regla que `TenantAdministrationService`).
   */
  private async assertOrganizationAdmin(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const platform = PLATFORM_ADMIN_ROLES.some(
      (role) =>
        actor.roles.includes(role) &&
        roleAuthorizesInTenant(actor, role, tenantId),
    );
    if (platform) return;
    if (await this.links.isOrganizationAdmin(em, tenantId, actor.id)) return;
    throw forbidden(
      'Se requiere ser OWNER o ADMIN de la organización',
      Reason.SUPPORT_ORGANIZATION_ADMIN_REQUIRED,
    );
  }

  /** Lee los vínculos recién creados para devolverlos. */
  private async createdView(
    tenantId: string,
    ids: readonly string[],
  ): Promise<SupportLinksCreatedDto> {
    const em = this.em.fork();
    const items: SupportLinkViewDto[] = [];
    for (const id of ids) {
      const [row] = await this.links.findLinks(em, { id });
      if (row) items.push(toView(row));
    }
    return { id: ids[0], tenantId, items };
  }
}

/** 404 uniforme: un vínculo ajeno responde igual que uno inexistente. */
function linkNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Vínculo no encontrado',
    undefined,
    Reason.SUPPORT_LINK_NOT_FOUND,
  );
}

/** Si el vínculo es con una vinculación del propio doctor. */
function isOwnPractitionerLink(
  row: SupportLinkRow,
  actor: AuthenticatedUser,
): boolean {
  return (
    row.kind === 'PRACTITIONER' &&
    actor.practitionerProfileId !== undefined &&
    row.practitionerProfileId === actor.practitionerProfileId
  );
}

/** Clave de un objetivo, para detectar vínculos repetidos. */
function targetKey(row: {
  readonly kind: string;
  readonly practiceSiteId: string | null;
  readonly clinicalUnitId: string | null;
  readonly careSpaceId: string | null;
  readonly practitionerRoleAssignmentId: string | null;
}): string {
  // Un vínculo con un doctor se identifica sólo por la vinculación: la sede
  // que trae es la del doctor, no un objetivo propio.
  if (row.kind === 'PRACTITIONER') {
    return `PRACTITIONER|${row.practitionerRoleAssignmentId ?? ''}`;
  }
  return [
    row.kind,
    row.practiceSiteId ?? '',
    row.clinicalUnitId ?? '',
    row.careSpaceId ?? '',
    row.practitionerRoleAssignmentId ?? '',
  ].join('|');
}

/** La vista pública de un vínculo. */
export function toView(row: SupportLinkRow): SupportLinkViewDto {
  return {
    id: row.id,
    kind: row.kind,
    targetKind: targetKindOf(row),
    tenantId: row.tenantId,
    organizationName: row.organizationName,
    userId: row.supportUserId,
    personName: row.supportName,
    status: row.status,
    initiatedBy: initiatorOf(row),
    awaiting: awaitingPartyOf(row),
    practiceSiteId: row.practiceSiteId,
    clinicalUnitId: row.clinicalUnitId,
    careSpaceId: row.careSpaceId,
    practitionerRoleAssignmentId: row.practitionerRoleAssignmentId,
    practitionerProfileId: row.practitionerProfileId,
    targetName: row.targetName,
    createdAt: row.createdAt,
  };
}
