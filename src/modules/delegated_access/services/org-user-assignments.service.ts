import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  OrganizationUserAssignmentsRepository,
  PractitionerDelegateAssignmentsRepository,
} from '../repositories';
import {
  CreateOrgUserAssignmentDto,
  UpdateOrgUserAssignmentDto,
  ResourceCreatedDto,
  OperationResultDto,
} from '../dto';
import type { OrganizationUserAssignments } from '../entities';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import {
  ACCESS_SCOPE_BY_CONCEPT,
  ACCESS_SCOPE_CONCEPT,
  ASSIGNMENT_ROLE_BY_CONCEPT,
  ASSIGNMENT_ROLE_CONCEPT,
  STATUS,
} from './concept-maps';
import {
  DelegatedAccessEventsService,
  type AssignmentChange,
  type AssignmentScopeSnapshot,
} from './delegated-access-events.service';
import {
  OrgAssignmentScopeService,
  type AssignmentTargets,
  type ResolvedAssignmentScope,
} from './org-assignment-scope.service';

/** Instantánea del alcance de una asignación guardada. */
function snapshotOf(row: OrganizationUserAssignments): AssignmentScopeSnapshot {
  return {
    scope: ACCESS_SCOPE_BY_CONCEPT[row.accessScopeConceptId] ?? 'UNKNOWN',
    practiceId: row.practiceId ?? null,
    practiceSiteId: row.practiceSiteId ?? null,
    clinicalUnitId: row.clinicalUnitId ?? null,
    careSpaceId: row.careSpaceId ?? null,
    status: row.statusConceptId === STATUS.SUSPENDED ? 'SUSPENDED' : 'ACTIVE',
  };
}

/** Los objetivos de una fila. */
function targetsOf(row: OrganizationUserAssignments): AssignmentTargets {
  return {
    practiceId: row.practiceId ?? null,
    practiceSiteId: row.practiceSiteId ?? null,
    clinicalUnitId: row.clinicalUnitId ?? null,
    careSpaceId: row.careSpaceId ?? null,
    diagnosticUnitId: row.diagnosticUnitId ?? null,
    pharmacyId: row.pharmacyId ?? null,
  };
}

/**
 * UC-29-01 (asignar usuario de organización con alcance/vigencia) y UC-29-10
 * (reasignar supervisor / cambiar alcance / suspender), abiertos a la
 * administración de la organización y de la sucursal (CONTRATO-F2-F5 F5g).
 *
 * Antes de escribir se resuelve **todo** contra el tenant del contexto (membresía,
 * sede, unidad, espacio, supervisor) y se autoriza contra el objetivo autoritativo,
 * no contra lo que el cuerpo afirme. El servicio posee la unidad de trabajo:
 * `em.transactional` + `flush` del padre antes de los hijos (las FK son columnas
 * uuid planas, MikroORM no ordena inserts entre entidades no relacionadas).
 */
@Injectable()
export class OrgUserAssignmentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentsRepo - Valor de assignments repo requerido por la operación.
   * @param delegatesRepo - Valor de delegates repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param scope - Resolución y autorización de objetivos.
   * @param events - Publicación transaccional de `scope_changed`.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly logger: PinoLogger,
    private readonly scope: OrgAssignmentScopeService,
    private readonly events: DelegatedAccessEventsService,
  ) {
    this.logger.setContext(OrgUserAssignmentsService.name);
  }

  /** UC-29-01: alta de asignación de usuario de organización (scoped, vigente). */
  async createAssignment(
    tenantMembershipId: string,
    dto: CreateOrgUserAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'delegated_access.org_assignment.create',
        tenantMembershipId,
        actorId: actor.id,
      },
      'Creating organization user assignment',
    );
    const roleCode = dto.role ?? 'STAFF';
    const scopeCode = dto.accessScope ?? 'TENANT';
    const roleConceptId = ASSIGNMENT_ROLE_CONCEPT[roleCode];
    const scopeConceptId = ACCESS_SCOPE_CONCEPT[scopeCode];
    const tenantId = requireTenantId();

    return this.em.transactional(async (tx) => {
      // Primero quién es el titular y qué se le da, todo dentro del tenant.
      const grantee = await this.scope.membership(
        tx,
        tenantId,
        tenantMembershipId,
      );
      const resolved = await this.scope.resolve(
        tx,
        tenantId,
        roleCode,
        scopeCode,
        dto,
      );
      const access = await this.scope.access(tx, tenantId, actor);
      this.scope.assertCanManage(access, resolved, grantee, actor);
      if (dto.supervisorUserId) {
        await this.scope.assertSupervisor(tx, tenantId, dto.supervisorUserId);
      }

      const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
      const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
      if (validTo && validTo.getTime() <= validFrom.getTime()) {
        throw new PreconditionFailedException(
          'La vigencia termina antes de empezar',
          undefined,
          DelegatedAccessErrorReason.ASSIGNMENT_VALIDITY_INVALID,
        );
      }
      if (roleCode === 'UNIT_HEAD' && resolved.targets.clinicalUnitId) {
        await this.scope.assertNoUnitHeadOverlap(
          tx,
          resolved.targets.clinicalUnitId,
          { from: validFrom, to: validTo ?? null },
        );
      }

      const overlap = await this.assignmentsRepo.findActiveOverlap(
        tx,
        tenantMembershipId,
        roleConceptId,
        scopeConceptId,
        STATUS.ACTIVE,
        resolved.targets,
      );
      if (overlap) {
        this.logger.warn(
          {
            operation: 'delegated_access.org_assignment.create',
            reason: 'overlap',
          },
          'Rejected: active role+scope assignment already exists',
        );
        throw new ConflictException(
          'Ya existe una asignación activa con ese rol y alcance',
          {
            tenantMembershipId,
          },
        );
      }

      const assignment = this.assignmentsRepo.create(tx, {
        tenantMembershipId,
        practiceId: resolved.targets.practiceId ?? undefined,
        practiceSiteId: resolved.targets.practiceSiteId ?? undefined,
        clinicalUnitId: resolved.targets.clinicalUnitId ?? undefined,
        careSpaceId: resolved.targets.careSpaceId ?? undefined,
        diagnosticUnitId: resolved.targets.diagnosticUnitId ?? undefined,
        pharmacyId: resolved.targets.pharmacyId ?? undefined,
        assignmentRoleConceptId: roleConceptId,
        accessScopeConceptId: scopeConceptId,
        supervisorUserId: dto.supervisorUserId,
        validFrom,
        validTo,
        statusConceptId: STATUS.ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      await this.publish(
        tx,
        tenantId,
        actor,
        'CREATED',
        assignment,
        roleCode,
        null,
      );

      this.logger.info(
        {
          operation: 'delegated_access.org_assignment.create',
          assignmentId: assignment.id,
        },
        'Organization user assignment created',
      );
      return {
        id: assignment.id,
        status: assignment.statusConceptId,
        createdAt: assignment.createdAt,
      };
    });
  }

  /** UC-29-10: reasigna supervisor / cambia alcance y objetivo / suspende (cascada a delegaciones). */
  async updateAssignment(
    id: string,
    dto: UpdateOrgUserAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    this.logger.info(
      {
        operation: 'delegated_access.org_assignment.update',
        assignmentId: id,
        actorId: actor.id,
      },
      'Updating organization user assignment',
    );
    const retarget =
      dto.accessScope !== undefined ||
      dto.practiceId !== undefined ||
      dto.practiceSiteId !== undefined ||
      dto.clinicalUnitId !== undefined ||
      dto.careSpaceId !== undefined;
    if (dto.supervisorUserId === undefined && !retarget && !dto.suspend) {
      throw new PreconditionFailedException('No hay cambios que aplicar', {
        assignmentId: id,
      });
    }
    const tenantId = requireTenantId();

    return this.em.transactional(async (tx) => {
      const assignment = await this.assignmentsRepo.findById(tx, id);
      const membership = assignment
        ? await this.scope.membershipOwner(
            tx,
            tenantId,
            assignment.tenantMembershipId,
          )
        : null;
      // Ajena o inexistente: el mismo 404.
      if (!assignment || !membership) {
        throw new ResourceNotFoundException('Asignación no encontrada', {
          assignmentId: id,
        });
      }
      const access = await this.scope.access(tx, tenantId, actor);
      // Autoridad sobre lo que la asignación cubre hoy: para un administrador de
      // sucursal, lo que no es de sus sedes no existe.
      const current = await this.scope.locate(
        tx,
        tenantId,
        targetsOf(assignment),
      );
      if (
        access.level === 'BRANCH_ADMIN' &&
        !this.scope.canSee(access, current)
      ) {
        throw new ResourceNotFoundException('Asignación no encontrada', {
          assignmentId: id,
        });
      }
      this.scope.assertCanManage(access, current, membership, actor);

      if (assignment.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException('La asignación no está activa', {
          assignmentId: id,
        });
      }
      if (
        dto.expectedRowVersion !== undefined &&
        dto.expectedRowVersion !== assignment.rowVersion
      ) {
        throw new ConcurrencyConflictException('row_version no coincide', {
          expected: dto.expectedRowVersion,
          actual: assignment.rowVersion,
        });
      }

      const before = snapshotOf(assignment);
      const roleCode =
        ASSIGNMENT_ROLE_BY_CONCEPT[assignment.assignmentRoleConceptId] ??
        'STAFF';
      let change: AssignmentChange = 'SUPERVISOR_CHANGED';

      if (dto.supervisorUserId !== undefined) {
        await this.scope.assertSupervisor(tx, tenantId, dto.supervisorUserId);
        assignment.supervisorUserId = dto.supervisorUserId;
      }
      if (retarget) {
        const scopeCode =
          dto.accessScope ??
          ACCESS_SCOPE_BY_CONCEPT[assignment.accessScopeConceptId] ??
          'TENANT';
        // El cuerpo reemplaza los objetivos: lo que no viene queda en blanco.
        const resolved: ResolvedAssignmentScope = await this.scope.resolve(
          tx,
          tenantId,
          roleCode,
          scopeCode,
          {
            practiceId: dto.practiceId,
            practiceSiteId: dto.practiceSiteId,
            clinicalUnitId: dto.clinicalUnitId,
            careSpaceId: dto.careSpaceId,
            diagnosticUnitId: assignment.diagnosticUnitId,
            pharmacyId: assignment.pharmacyId,
          },
        );
        // …y sobre lo que va a cubrir.
        this.scope.assertCanManage(access, resolved, membership, actor);
        if (roleCode === 'UNIT_HEAD' && resolved.targets.clinicalUnitId) {
          await this.scope.assertNoUnitHeadOverlap(
            tx,
            resolved.targets.clinicalUnitId,
            {
              from: assignment.validFrom ?? null,
              to: assignment.validTo ?? null,
            },
            assignment.id,
          );
        }
        const duplicate = await this.assignmentsRepo.findActiveOverlap(
          tx,
          assignment.tenantMembershipId,
          assignment.assignmentRoleConceptId,
          ACCESS_SCOPE_CONCEPT[scopeCode],
          STATUS.ACTIVE,
          resolved.targets,
          assignment.id,
        );
        if (duplicate) {
          throw new ConflictException(
            'Ya existe una asignación activa con ese rol y alcance',
            { tenantMembershipId: assignment.tenantMembershipId },
          );
        }
        assignment.accessScopeConceptId = ACCESS_SCOPE_CONCEPT[scopeCode];
        // `Object.assign`: las columnas se vacían con `null`, que el tipo de la entidad no admite.
        Object.assign(assignment, {
          practiceId: resolved.targets.practiceId,
          practiceSiteId: resolved.targets.practiceSiteId,
          clinicalUnitId: resolved.targets.clinicalUnitId,
          careSpaceId: resolved.targets.careSpaceId,
        });
        change = 'RETARGETED';
      }
      if (dto.suspend) {
        assignment.statusConceptId = STATUS.SUSPENDED;
        // Cascada: suspende las delegaciones ACTIVAS que dependen de este org user.
        await this.delegatesRepo.suspendByDelegateAssignment(
          tx,
          id,
          STATUS.ACTIVE,
          STATUS.SUSPENDED,
          new Date(),
          actor.id,
        );
        change = 'SUSPENDED';
      }
      touch(assignment, actor.id);
      await tx.flush();
      await this.publish(
        tx,
        tenantId,
        actor,
        change,
        assignment,
        roleCode,
        before,
      );

      this.logger.info(
        {
          operation: 'delegated_access.org_assignment.update',
          assignmentId: id,
          suspended: !!dto.suspend,
        },
        'Organization user assignment updated',
      );
      return { ok: true };
    });
  }

  /** Encola `scope_changed` en la transacción de la mutación. */
  private publish(
    tx: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    change: AssignmentChange,
    assignment: OrganizationUserAssignments,
    roleCode: string,
    from: AssignmentScopeSnapshot | null,
  ): Promise<void> {
    return this.events.scopeChanged(tx, {
      tenantId,
      assignmentId: assignment.id,
      actorUserId: actor.id,
      change,
      rowVersion: assignment.rowVersion,
      roleCode,
      from,
      to: snapshotOf(assignment),
    });
  }
}
