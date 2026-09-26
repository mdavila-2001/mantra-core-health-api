import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { PublicProfiles } from '../../community/entities';
import { COMM } from '../../community/community.concepts';
import { PRAC } from '../practice.concepts';
import {
  PracticesRepository,
  PracticeSitesRepository,
  PractitionerRoleAssignmentsRepository,
  PractitionerSupportAssignmentsRepository,
} from '../repositories';
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

/** Transiciones válidas del ciclo de vida de una vinculación (Carril 18). */
const ASSIGNMENT_TRANSITIONS: Record<string, readonly string[]> = {
  [PRAC.ROLE_ASSIGNMENT_PENDING]: [
    PRAC.ROLE_ASSIGNMENT_ACTIVE,
    PRAC.ROLE_ASSIGNMENT_REJECTED,
  ],
  [PRAC.ROLE_ASSIGNMENT_ACTIVE]: [
    PRAC.ROLE_ASSIGNMENT_SUSPENDED,
    PRAC.ROLE_ASSIGNMENT_ENDED,
  ],
  [PRAC.ROLE_ASSIGNMENT_SUSPENDED]: [
    PRAC.ROLE_ASSIGNMENT_ACTIVE,
    PRAC.ROLE_ASSIGNMENT_ENDED,
  ],
  [PRAC.ROLE_ASSIGNMENT_REJECTED]: [],
  [PRAC.ROLE_ASSIGNMENT_ENDED]: [],
};

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
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param supportRepo - Valor de support repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly practicesRepo: PracticesRepository,
    private readonly sitesRepo: PracticeSitesRepository,
    private readonly rolesRepo: PractitionerRoleAssignmentsRepository,
    private readonly supportRepo: PractitionerSupportAssignmentsRepository,
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
    this.logger.info(
      { operation: 'practice.role.assign', practiceId },
      'Assigning practitioner role',
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
            {
              practiceId,
              siteId: dto.practiceSiteId,
            },
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
    this.logger.info(
      { operation: 'practice.support.attach', roleId },
      'Attaching support staff',
    );
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findById(tx, roleId);
      if (!role)
        throw new ResourceNotFoundException(
          'Rol de profesional no encontrado',
          { roleId },
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

      const role = this.rolesRepo.create(tx, {
        practitionerProfileId,
        practiceId,
        practiceSiteId: dto.practiceSiteId,
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

    return assignments.map((a) => {
      const practice = practices.get(a.practiceId);
      return {
        id: a.id,
        practiceId: a.practiceId,
        practiceName: practice?.name ?? '(organización no encontrada)',
        practiceType: practice?.typeConceptId ?? null,
        practiceSiteId: a.practiceSiteId ?? null,
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
   * Aislamiento: si la práctica no existe o es de otro tenant, 404 sin
   * distinguir el caso (el mismo criterio que
   * {@link PracticeOrganizationReadService.getConsole}) — un administrador de
   * la clínica A no debe poder confirmar, ni siquiera por el código de error,
   * que una práctica de la clínica B existe.
   *
   * @param practiceId - Práctica cuyas vinculaciones se listan.
   * @param tenantId - Tenant del contexto (el del actor).
   * @param options - Filtro de estado, cursor y tope de página.
   */
  async listPracticeAssignments(
    practiceId: string,
    tenantId: string,
    options: { statusConceptId?: string; cursor?: string; limit?: number },
  ): Promise<ListPracticeRoleAssignmentsResponseDto> {
    const em = this.em.fork();
    const practice = await this.practicesRepo.findById(em, practiceId);
    if (!practice || practice.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }

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

    return {
      items: page.map((role) => ({
        id: role.id,
        practiceId: role.practiceId,
        practitionerProfileId: role.practitionerProfileId,
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
   * pendiente: `PENDING → ACTIVE`. Rol `SECURITY_ADMIN` (administra la
   * organización); el gate autoritativo vive en el controlador.
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
    );
  }

  /** `PENDING → REJECTED`. */
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
   * Motor común de transición: valida que el paso sea uno de los declarados
   * en {@link ASSIGNMENT_TRANSITIONS} (rechaza cualquier otro con 422) y sella
   * `validTo` cuando el destino es un estado terminal (rechazada/finalizada).
   */
  private async transitionAssignment(
    roleId: string,
    toStatus: string,
    dto: RoleAssignmentTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.em.transactional(async (tx) => {
      const role = await this.rolesRepo.findById(tx, roleId);
      if (!role)
        throw new ResourceNotFoundException(
          'Vinculación profesional-organización no encontrada',
          { roleId },
        );

      const allowed = ASSIGNMENT_TRANSITIONS[role.statusConceptId] ?? [];
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
