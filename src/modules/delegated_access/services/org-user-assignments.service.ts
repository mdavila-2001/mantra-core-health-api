import { OutboxService } from '../../messaging/services/outbox.service';
import { translateInfraWriteError } from '../../practice/services/ops/ops-errors';
import { DELEG } from '../delegated_access.concepts';
import {
  assertAssignmentTargets,
  assertSingleUnitHead,
} from './assignment-targets';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
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
import {
  ACCESS_SCOPE_CONCEPT,
  ASSIGNMENT_ROLE_CONCEPT,
  STATUS,
} from './concept-maps';

/**
 * UC-29-01 (asignar usuario de organización con alcance/vigencia) y UC-29-10
 * (reasignar supervisor / suspender). El servicio posee la unidad de trabajo:
 * `em.transactional` + `flush` del padre antes de los hijos (las FK son columnas
 * uuid planas, MikroORM no ordena inserts entre entidades no relacionadas).
 */
/** Código de alcance por concepto (`SCOPE_UNIT` → `UNIT`). */
const SCOPE_CODE_BY_CONCEPT = new Map<string, string>(
  Object.entries(ACCESS_SCOPE_CONCEPT).map(([code, id]) => [id, code]),
);

@Injectable()
export class OrgUserAssignmentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentsRepo - Valor de assignments repo requerido por la operación.
   * @param delegatesRepo - Valor de delegates repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly logger: PinoLogger,
    private readonly outbox?: OutboxService,
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
    const roleConceptId = ASSIGNMENT_ROLE_CONCEPT[dto.role ?? 'STAFF'];
    const scopeConceptId = ACCESS_SCOPE_CONCEPT[dto.accessScope ?? 'TENANT'];

    return this.em.transactional(async (tx) => {
      // F5g (CONTRATO-F2-F5 §F5g): destino del tenant de la membresía (404),
      // coherencia de alcance (422) y jefe de unidad único (409).
      await assertAssignmentTargets(
        tx,
        tenantMembershipId,
        dto.accessScope ?? 'TENANT',
        dto,
      );
      if (roleConceptId === DELEG.ASSIGN_ROLE_UNIT_HEAD && dto.clinicalUnitId) {
        await assertSingleUnitHead(
          tx,
          dto.clinicalUnitId,
          dto.validFrom,
          dto.validTo,
        );
      }
      const overlap = await this.assignmentsRepo.findActiveOverlap(
        tx,
        tenantMembershipId,
        roleConceptId,
        scopeConceptId,
        STATUS.ACTIVE,
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
        practiceId: dto.practiceId,
        practiceSiteId: dto.practiceSiteId,
        clinicalUnitId: dto.clinicalUnitId,
        careSpaceId: dto.careSpaceId,
        diagnosticUnitId: dto.diagnosticUnitId,
        pharmacyId: dto.pharmacyId,
        assignmentRoleConceptId: roleConceptId,
        accessScopeConceptId: scopeConceptId,
        supervisorUserId: dto.supervisorUserId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: STATUS.ACTIVE,
        actorUserId: actor.id,
      });
      try {
        await tx.flush();
      } catch (error) {
        throw translateInfraWriteError(error);
      }

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

  /** UC-29-10: reasigna supervisor / cambia scope / suspende (cascada a delegaciones). */
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
    const targetsChange =
      dto.practiceSiteId !== undefined ||
      dto.clinicalUnitId !== undefined ||
      dto.careSpaceId !== undefined;
    if (
      dto.supervisorUserId === undefined &&
      dto.accessScope === undefined &&
      !targetsChange &&
      !dto.suspend
    ) {
      throw new PreconditionFailedException('No hay cambios que aplicar', {
        assignmentId: id,
      });
    }

    return this.em.transactional(async (tx) => {
      const assignment = await this.assignmentsRepo.findById(tx, id);
      if (!assignment) {
        throw new ResourceNotFoundException('Asignación no encontrada', {
          assignmentId: id,
        });
      }
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

      if (dto.supervisorUserId !== undefined)
        assignment.supervisorUserId = dto.supervisorUserId;
      // F5g (CONTRATO-F2-F5 §F5g): el alcance resultante se valida igual que
      // en el alta —destino del tenant (404), destino presente (422
      // ASSIGNMENT_SCOPE_TARGET_REQUIRED, no el 23514 del CHECK) y
      // coherente (422)— y el jefe de unidad sigue siendo único (409).
      const scopeChange = dto.accessScope !== undefined || targetsChange;
      const before = {
        accessScopeConceptId: assignment.accessScopeConceptId,
        practiceSiteId: assignment.practiceSiteId ?? null,
        clinicalUnitId: assignment.clinicalUnitId ?? null,
        careSpaceId: assignment.careSpaceId ?? null,
      };
      if (scopeChange) {
        const scope =
          dto.accessScope ??
          SCOPE_CODE_BY_CONCEPT.get(assignment.accessScopeConceptId) ??
          'TENANT';
        const targets = {
          practiceId: assignment.practiceId ?? undefined,
          practiceSiteId:
            dto.practiceSiteId ?? assignment.practiceSiteId ?? undefined,
          clinicalUnitId:
            dto.clinicalUnitId ?? assignment.clinicalUnitId ?? undefined,
          careSpaceId: dto.careSpaceId ?? assignment.careSpaceId ?? undefined,
        };
        await assertAssignmentTargets(
          tx,
          assignment.tenantMembershipId,
          scope,
          targets,
        );
        if (
          assignment.assignmentRoleConceptId === DELEG.ASSIGN_ROLE_UNIT_HEAD &&
          targets.clinicalUnitId &&
          targets.clinicalUnitId !== (assignment.clinicalUnitId ?? undefined)
        )
          await assertSingleUnitHead(
            tx,
            targets.clinicalUnitId,
            assignment.validFrom?.toISOString(),
            assignment.validTo?.toISOString(),
          );
        assignment.accessScopeConceptId = ACCESS_SCOPE_CONCEPT[scope];
        assignment.practiceSiteId = targets.practiceSiteId;
        assignment.clinicalUnitId = targets.clinicalUnitId;
        assignment.careSpaceId = targets.careSpaceId;
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
      }
      touch(assignment, actor.id);
      if (scopeChange) {
        try {
          await tx.flush();
        } catch (error) {
          throw translateInfraWriteError(error);
        }
        const [m] = await tx.execute<{ tenant_id: string }[]>(
          'SELECT tenant_id FROM directory.tenant_memberships WHERE id = ?',
          [assignment.tenantMembershipId],
          'all',
        );
        await this.outbox?.publishDomainEvent(tx, {
          tenantId: m?.tenant_id,
          eventType: 'delegated_access.assignment.scope_changed',
          aggregateType: 'delegated_access.organization_user_assignments',
          aggregateId: assignment.id,
          payloadJson: {
            assignmentId: assignment.id,
            before,
            after: {
              accessScopeConceptId: assignment.accessScopeConceptId,
              practiceSiteId: assignment.practiceSiteId ?? null,
              clinicalUnitId: assignment.clinicalUnitId ?? null,
              careSpaceId: assignment.careSpaceId ?? null,
            },
          },
          actorUserId: actor.id,
        });
      }

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
}
