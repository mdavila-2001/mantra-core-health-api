import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfiles } from '../../community/entities';
import { COMM } from '../../community/community.concepts';
import { PRAC } from '../practice.concepts';
import { PracticeAffiliationErrorReason } from '../practice-affiliation.error-reasons';
import {
  PracticesRepository,
  PracticeSitesRepository,
  ClinicalUnitsRepository,
  HealthcareServicesRepository,
  PractitionerRoleAssignmentsRepository,
  PractitionerSupportAssignmentsRepository,
} from '../repositories';
import {
  assertPracticeScope,
  loadPracticeInScope,
  practiceOutOfScope,
} from './practice-scope';
import { PracticeAdministrationService } from './practice-administration.service';
import { PRACTICE_ASSIGNMENT_TRANSITIONS } from './role-assignment-transitions';
import {
  loadRoleAssignmentRowContext,
  toRoleAssignmentRow,
} from './role-assignment-row.mapper';
import {
  CreateRoleAssignmentDto,
  CreateSupportAssignmentDto,
  RoleAssignmentResponseDto,
  SupportAssignmentResponseDto,
  SelfRequestRoleAssignmentDto,
  RoleAssignmentTransitionDto,
  MyRoleAssignmentResponseDto,
  ListPracticeRoleAssignmentsResponseDto,
} from '../dto';

/** Tope de vinculaciones por página cuando el cliente no pide uno (CV-14). */
const DEFAULT_ASSIGNMENTS_PAGE_SIZE = 50;

/** Estados que cuentan como «relación en curso» con un procedimiento de la sede. */
const OPEN_ASSIGNMENT_STATUSES = [
  PRAC.ROLE_ASSIGNMENT_INVITED,
  PRAC.ROLE_ASSIGNMENT_PENDING,
  PRAC.ROLE_ASSIGNMENT_ACTIVE,
  PRAC.ROLE_ASSIGNMENT_SUSPENDED,
];

/**
 * Personal de práctica: asignación de rol de profesional a sitio/unidad/servicio
 * (UC-14-08) y adjuntar personal de apoyo a un rol (UC-14-09).
 */
@Injectable()
export class PracticeWorkforceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practicesRepo - Valor de practices repo requerido por la operación.
   * @param sitesRepo - Valor de sites repo requerido por la operación.
   * @param unitsRepo - Unidades clínicas: la de una vinculación debe ser de la práctica.
   * @param servicesRepo - Servicios de salud: el de una vinculación debe ser de la práctica.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param supportRepo - Valor de support repo requerido por la operación.
   * @param administration - Regla de administración por organización (A-6).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly servicesRepo: HealthcareServicesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly supportRepo: PractitionerSupportAssignmentsRepository,
    private readonly administration: PracticeAdministrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeWorkforceService.name);
  }

  /** UC-14-08: asigna un rol de profesional dentro de una práctica activa. */
  async assignRole(
    practiceId: string,
    dto: CreateRoleAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'practice.role.assign', practiceId },
      'Assigning practitioner role',
    );
    return this.em.transactional(async (tx) => {
      const practice = await loadPracticeInScope(
        this.practicesRepo,
        tx,
        practiceId,
        tenantId,
      );
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }

      if (dto.practiceSiteId) {
        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El sitio no pertenece a la práctica',
            {
              practiceId,
              siteId: dto.practiceSiteId,
            },
          );
        }
      }

      if (dto.clinicalUnitId) {
        const unit = await this.unitsRepo.findById(tx, dto.clinicalUnitId);
        const unitSite = unit
          ? await this.sitesRepo.findById(tx, unit.practiceSiteId)
          : null;
        if (!unit || !unitSite || unitSite.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'La unidad no pertenece a la práctica',
            { practiceId, clinicalUnitId: dto.clinicalUnitId },
          );
        }
      }
      if (dto.healthcareServiceId) {
        const service = await this.servicesRepo.findById(
          tx,
          dto.healthcareServiceId,
        );
        if (!service || service.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El servicio no pertenece a la práctica',
            { practiceId, healthcareServiceId: dto.healthcareServiceId },
          );
        }
      }

      const role = this.rolesRepo.create(tx, {
        practitionerProfileId: dto.practitionerProfileId,
        practiceId,
        practiceSiteId: dto.practiceSiteId,
        clinicalUnitId: dto.clinicalUnitId,
        healthcareServiceId: dto.healthcareServiceId,
        roleConceptId: dto.roleConceptId ?? PRAC.ROLE_ATTENDING,
        specialtyConceptId: dto.specialtyConceptId,
        supervisorPractitionerProfileId: dto.supervisorPractitionerProfileId,
        revenueSharePercent: dto.revenueSharePercent,
        isPrimary: dto.isPrimary,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: role.id,
        practiceId: role.practiceId,
        practitionerProfileId: role.practitionerProfileId,
        status: role.statusConceptId,
        createdAt: role.createdAt,
      };
    });
  }

  /** UC-14-09: adjunta personal de apoyo a un rol de profesional activo. */
  async attachSupport(
    roleId: string,
    dto: CreateSupportAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<SupportAssignmentResponseDto> {
    const tenantId = requireTenantId();
    this.logger.info(
      { operation: 'practice.support.attach', roleId },
      'Attaching support staff',
    );
    return this.em.transactional(async (tx) => {
      const role = await this.loadRoleInScope(
        tx,
        roleId,
        tenantId,
        'Rol de profesional no encontrado',
      );
      if (role.statusConceptId !== PRAC.ROLE_ASSIGNMENT_ACTIVE) {
        throw new PreconditionFailedException(
          'El rol de profesional no está activo',
          { roleId },
        );
      }

      const support = this.supportRepo.create(tx, {
        practitionerRoleAssignmentId: roleId,
        supportProfileId: dto.supportProfileId,
        supportRoleConceptId:
          dto.supportRoleConceptId ?? PRAC.SUPPORT_ROLE_SECRETARY,
        scopeConceptId: dto.scopeConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: PRAC.SUPPORT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: support.id,
        practitionerRoleAssignmentId: support.practitionerRoleAssignmentId,
        status: support.statusConceptId,
        createdAt: support.createdAt,
      };
    });
  }

  /**
   * Carril 18 (spec líneas 1619-1654) — un profesional pide vincularse a una
   * organización por su cuenta. A diferencia de {@link assignRole} (alta
   * administrativa inmediata, `SECURITY_ADMIN`), esto queda `PENDING`: la
   * organización tiene que aprobarla, rechazarla, suspenderla o finalizarla
   * (spec línea 1655) — el profesional nunca se auto-activa.
   *
   * Deliberadamente NO toca `authz.care_relationships` ni ningún otro
   * mecanismo de acceso a pacientes: pertenecer a una organización no debe
   * conceder acceso automático a sus pacientes (spec línea 1659); ese acceso
   * depende de una relación asistencial concreta (línea 1663), que este
   * método no crea.
   */
  async selfRequestAffiliation(
    practiceId: string,
    dto: SelfRequestRoleAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    this.logger.info(
      { operation: 'practice.role.self-request', practiceId },
      'Practitioner self-requesting organization affiliation',
    );
    return this.em.transactional(async (tx) => {
      const practice = await this.practicesRepo.findById(tx, practiceId);
      if (!practice)
        throw new ResourceNotFoundException('Práctica no encontrada', {
          practiceId,
        });
      if (practice.statusConceptId !== PRAC.PRACTICE_ACTIVE) {
        throw new PreconditionFailedException('La práctica no está activa', {
          practiceId,
        });
      }
      if (dto.practiceSiteId) {
        const site = await this.sitesRepo.findById(tx, dto.practiceSiteId);
        if (!site || site.practiceId !== practiceId) {
          throw new PreconditionFailedException(
            'El sitio no pertenece a la práctica',
            { practiceId, siteId: dto.practiceSiteId },
          );
        }
      }
      if (dto.healthcareServiceId) {
        await this.assertServiceOfferedBySite(
          tx,
          practiceId,
          dto.practiceSiteId,
          dto.healthcareServiceId,
        );
        const open = await this.rolesRepo.findOpenForServices(
          tx,
          practitionerProfileId,
          dto.practiceSiteId!,
          [dto.healthcareServiceId],
          OPEN_ASSIGNMENT_STATUSES,
        );
        if (open.length > 0) {
          throw new ConflictException(
            'Ya tenés una vinculación en curso con ese procedimiento',
            { healthcareServiceId: dto.healthcareServiceId },
            PracticeAffiliationErrorReason.ASSIGNMENT_ALREADY_OPEN,
          );
        }
      }

      const role = this.rolesRepo.create(tx, {
        practitionerProfileId,
        practiceId,
        practiceSiteId: dto.practiceSiteId,
        healthcareServiceId: dto.healthcareServiceId,
        roleConceptId: dto.roleConceptId ?? PRAC.ROLE_ATTENDING,
        specialtyConceptId: dto.specialtyConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: role.id,
        practiceId: role.practiceId,
        practitionerProfileId: role.practitionerProfileId,
        status: role.statusConceptId,
        createdAt: role.createdAt,
      };
    });
  }

  /**
   * Carril 18 — todas las vinculaciones del profesional autenticado, en
   * cualquier organización, incluidas las pendientes y las históricas.
   */
  async listMyAssignments(
    actor: AuthenticatedUser,
  ): Promise<MyRoleAssignmentResponseDto[]> {
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    const em = this.em.fork();
    const assignments = await this.rolesRepo.findByPractitioner(
      em,
      actor.practitionerProfileId,
    );
    const practiceIds = [...new Set(assignments.map((a) => a.practiceId))];
    const practices = new Map(
      (
        await Promise.all(
          practiceIds.map((id) => this.practicesRepo.findById(em, id)),
        )
      )
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.id, p] as const),
    );

    // El logo de una organización vive en su ficha pública
    // (`community.public_profiles`), no en `practice.practices`: es la única
    // fuente para no terminar con dos logos que se contradicen.
    const avatarsByPracticeId =
      practiceIds.length === 0
        ? new Map<string, string | null>()
        : new Map(
            (
              await em.find(PublicProfiles, {
                targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
                targetId: { $in: practiceIds },
              })
            ).map((p) => [p.targetId, this.fileUrl(p.avatarFileId)] as const),
          );

    const rowContext = await loadRoleAssignmentRowContext(em, assignments);

    return assignments.map((a) => {
      const practice = practices.get(a.practiceId);
      return {
        ...toRoleAssignmentRow(a, rowContext),
        practiceName: practice?.name ?? '(organización no encontrada)',
        practiceType: practice?.typeConceptId ?? null,
        roleConceptId: a.roleConceptId,
        specialtyConceptId: a.specialtyConceptId ?? null,
        status: a.statusConceptId,
        isPrimary: a.isPrimary ?? false,
        validFrom: a.validFrom ?? null,
        validTo: a.validTo ?? null,
        createdAt: a.createdAt,
        avatarUrl: avatarsByPracticeId.get(a.practiceId) ?? null,
      };
    });
  }

  /**
   * URL pública de un archivo, o `null`. Nunca el identificador interno: ver
   * el mismo criterio en `CommunityPublicService.fileUrl`.
   */
  private fileUrl(fileId?: string): string | null {
    return fileId ? `/public/media/${fileId}` : null;
  }

  /**
   * CV-14 — página de vinculaciones profesional-organización de una práctica,
   * para que su administrador deje de aprobar a ciegas.
   *
   * Autorización: la lista es de quien administra **esa** organización
   * (A-6). Una práctica inexistente responde 404; el administrador de otra
   * organización recibe 403.
   *
   * @param practiceId - Práctica cuyas vinculaciones se listan.
   * @param actor - Quien pide la lista: administrador de esa organización.
   * @param options - Filtro de estado, cursor y tope de página.
   * @throws ForbiddenException si el actor no administra esa organización (A-6).
   */
  async listPracticeAssignments(
    practiceId: string,
    actor: AuthenticatedUser,
    options: { statusConceptId?: string; cursor?: string; limit?: number },
  ): Promise<ListPracticeRoleAssignmentsResponseDto> {
    const em = this.em.fork();
    await this.administration.assertCanAdministerPractice(
      em,
      practiceId,
      actor,
    );

    const limit = options.limit ?? DEFAULT_ASSIGNMENTS_PAGE_SIZE;
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterId = typeof after?.id === 'string' ? after.id : undefined;

    // Una fila de más para saber si hay página siguiente sin un COUNT aparte.
    const rows = await this.rolesRepo.findByPracticePage(
      em,
      practiceId,
      options.statusConceptId,
      afterId,
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    const rowContext = await loadRoleAssignmentRowContext(em, page);

    return {
      items: page.map((role) => ({
        ...toRoleAssignmentRow(role, rowContext),
        status: role.statusConceptId,
        createdAt: role.createdAt,
      })),
      count: page.length,
      limit,
      nextCursor: hasMore && last ? encodeKeysetCursor({ id: last.id }) : null,
    };
  }

  /**
   * Carril 18 (spec línea 1655) — la organización aprueba una vinculación
   * pendiente: `PENDING → ACTIVE`, solo esa fila. La aprueba quien administra
   * **esa** organización (A-6) o un rol de plataforma; una invitación
   * (`INVITED`) no la puede activar la organización, solo el profesional.
   */
  approveAssignment(
    roleId: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.transitionAssignment(
      roleId,
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
      dto,
      actor,
      'practice-administrator',
    );
  }

  /** `PENDING → REJECTED`, solo esa fila (A-6). */
  rejectAssignment(
    roleId: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.transitionAssignment(
      roleId,
      PRAC.ROLE_ASSIGNMENT_REJECTED,
      dto,
      actor,
      'practice-administrator',
    );
  }

  /** `ACTIVE → SUSPENDED`. */
  suspendAssignment(
    roleId: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.transitionAssignment(
      roleId,
      PRAC.ROLE_ASSIGNMENT_SUSPENDED,
      dto,
      actor,
    );
  }

  /** `ACTIVE|SUSPENDED → ENDED`. Sella `validTo` porque deja de estar vigente. */
  endAssignment(
    roleId: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.transitionAssignment(
      roleId,
      PRAC.ROLE_ASSIGNMENT_ENDED,
      dto,
      actor,
    );
  }

  /**
   * Carga una vinculación por UUID hasta su práctica y exige que sea del tenant
   * activo. La vinculación no lleva tenant: es el de su práctica. Se compara
   * **antes** de cualquier transición o creación hija.
   *
   * @throws ResourceNotFoundException (`PRACTICE_RESOURCE_OUT_OF_SCOPE`) si la
   * vinculación o su práctica no existen, o son de otro tenant.
   */
  private async loadRoleInScope(
    tx: EntityManager,
    roleId: string,
    tenantId: string,
    message: string,
  ) {
    const role = await this.rolesRepo.findById(tx, roleId);
    const practice = role
      ? await this.practicesRepo.findById(tx, role.practiceId)
      : null;
    if (!role || !practice) throw practiceOutOfScope(message);
    return assertPracticeScope(role, practice.tenantId, tenantId, message);
  }

  /**
   * Carga una vinculación y exige que el actor administre su organización
   * (A-6): 404 si no existe, 403 si es administrador de otra.
   *
   * @throws ResourceNotFoundException si la vinculación o su práctica no existen.
   * @throws ForbiddenException si el actor no administra esa organización.
   */
  private async loadRoleForAdministrator(
    tx: EntityManager,
    roleId: string,
    actor: AuthenticatedUser,
    message: string,
  ) {
    const role = await this.rolesRepo.findById(tx, roleId);
    if (!role) throw practiceOutOfScope(message);
    await this.administration.assertCanAdministerPractice(
      tx,
      role.practiceId,
      actor,
    );
    return role;
  }

  /**
   * Exige que el servicio exista, sea de la práctica y de la sede indicada, y
   * esté activo: solo se puede pedir trabajar en lo que la sede ofrece hoy.
   *
   * @throws PreconditionFailedException (`SERVICE_NOT_OFFERED_BY_SITE`) si no.
   */
  private async assertServiceOfferedBySite(
    tx: EntityManager,
    practiceId: string,
    practiceSiteId: string | undefined,
    healthcareServiceId: string,
  ): Promise<void> {
    const service = await this.servicesRepo.findById(tx, healthcareServiceId);
    if (
      !practiceSiteId ||
      !service ||
      service.practiceId !== practiceId ||
      service.practiceSiteId !== practiceSiteId ||
      service.statusConceptId !== PRAC.SERVICE_ACTIVE
    ) {
      throw new PreconditionFailedException(
        'El procedimiento no está publicado y activo en esa sede',
        { healthcareServiceId },
        PracticeAffiliationErrorReason.SERVICE_NOT_OFFERED_BY_SITE,
      );
    }
  }

  /**
   * Motor común de transición de la **organización**: valida que el paso sea
   * uno de los declarados en {@link PRACTICE_ASSIGNMENT_TRANSITIONS} (rechaza
   * cualquier otro con 422) y sella `validTo` cuando el destino es un estado
   * terminal (rechazada/finalizada).
   *
   * @param scope - `practice-administrator`: autoriza quien administra esa
   * organización (A-6). `tenant`: acota al tenant activo (suspender y finalizar).
   */
  private async transitionAssignment(
    roleId: string,
    toStatus: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
    scope: 'practice-administrator' | 'tenant' = 'tenant',
  ): Promise<RoleAssignmentResponseDto> {
    const message = 'Vinculación profesional-organización no encontrada';
    const tenantId = scope === 'tenant' ? requireTenantId() : undefined;
    return this.em.transactional(async (tx) => {
      const role =
        tenantId === undefined
          ? await this.loadRoleForAdministrator(tx, roleId, actor, message)
          : await this.loadRoleInScope(tx, roleId, tenantId, message);

      const allowed =
        PRACTICE_ASSIGNMENT_TRANSITIONS[role.statusConceptId] ?? [];
      if (!allowed.includes(toStatus)) {
        throw new PreconditionFailedException(
          'La vinculación no admite esa transición desde su estado actual',
          { roleId, from: role.statusConceptId, to: toStatus },
        );
      }

      role.statusConceptId = toStatus;
      role.updatedByUserId = actor.id;
      role.updatedAt = new Date();
      if (
        toStatus === PRAC.ROLE_ASSIGNMENT_REJECTED ||
        toStatus === PRAC.ROLE_ASSIGNMENT_ENDED
      ) {
        role.validTo = new Date();
      }
      this.logger.info(
        {
          operation: 'practice.role.transition',
          roleId,
          to: toStatus,
          reason: dto.reason,
        },
        'Role assignment transitioned',
      );
      await tx.flush();
      return {
        id: role.id,
        practiceId: role.practiceId,
        practitionerProfileId: role.practitionerProfileId,
        status: role.statusConceptId,
        createdAt: role.createdAt,
      };
    });
  }
}
