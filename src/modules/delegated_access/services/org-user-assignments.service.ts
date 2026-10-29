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
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
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

/** Nodo que cada alcance exige y el campo del cuerpo que lo lleva. */
const SCOPE_NODE_FIELD: Readonly<
  Record<string, 'practiceSiteId' | 'clinicalUnitId' | 'careSpaceId'>
> = {
  SITE: 'practiceSiteId',
  UNIT: 'clinicalUnitId',
  SPACE: 'careSpaceId',
};

/** Tabla (con `tenant_id`) de cada nodo de alcance que acepta el cuerpo. */
const NODE_TABLE: Readonly<Record<string, string>> = {
  practiceId: 'practice.practices',
  practiceSiteId: 'practice.practice_sites',
  clinicalUnitId: 'practice.clinical_units',
  careSpaceId: 'practice.care_spaces',
  diagnosticUnitId: 'diagnostic_units.diagnostic_units',
  pharmacyId: 'pharmacy.pharmacies',
};

/**
 * UC-29-01 (asignar usuario de organización con alcance/vigencia) y UC-29-10
 * (reasignar supervisor / suspender). El servicio posee la unidad de trabajo:
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly logger: PinoLogger,
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
    const scopeNode = SCOPE_NODE_FIELD[dto.accessScope ?? 'TENANT'];
    if (scopeNode && !dto[scopeNode]) {
      throw new PreconditionFailedException(
        'El alcance pide el nodo al que se asigna',
        { accessScope: dto.accessScope, requiredField: scopeNode },
        DelegatedAccessErrorReason.DELEGATED_ASSIGNMENT_SCOPE_NODE_REQUIRED,
      );
    }

    return this.em.transactional(async (tx) => {
      await this.assertNodesInMembershipTenant(tx, tenantMembershipId, dto);
      const overlap = await this.assignmentsRepo.findActiveOverlap(
        tx,
        tenantMembershipId,
        roleConceptId,
        scopeConceptId,
        STATUS.ACTIVE,
        {
          practiceId: dto.practiceId,
          practiceSiteId: dto.practiceSiteId,
          clinicalUnitId: dto.clinicalUnitId,
          careSpaceId: dto.careSpaceId,
          diagnosticUnitId: dto.diagnosticUnitId,
          pharmacyId: dto.pharmacyId,
        },
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
      await tx.flush();

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

  /**
   * Cada nodo del alcance (práctica, sede, unidad, espacio…) tiene que ser del tenant
   * de la membresía: un id de otro tenant no es una asignación válida y responde 404,
   * sin decir si existe. Sin nodos no consulta nada.
   */
  private async assertNodesInMembershipTenant(
    tx: EntityManager,
    tenantMembershipId: string,
    dto: CreateOrgUserAssignmentDto,
  ): Promise<void> {
    const nodes = Object.keys(NODE_TABLE).filter(
      (field) => !!dto[field as keyof CreateOrgUserAssignmentDto],
    );
    if (nodes.length === 0) return;
    const [membership] = await tx.execute<{ tenant_id: string }[]>(
      'select tenant_id from directory.tenant_memberships where id = ?',
      [tenantMembershipId],
    );
    if (!membership) {
      throw new ResourceNotFoundException(
        'Membresía no encontrada',
        { tenantMembershipId },
        DelegatedAccessErrorReason.DELEGATED_MEMBERSHIP_NOT_FOUND,
      );
    }
    for (const field of nodes) {
      const id = dto[field as keyof CreateOrgUserAssignmentDto] as string;
      const rows = await tx.execute<{ id: string }[]>(
        `select id from ${NODE_TABLE[field]} where id = ? and tenant_id = ?`,
        [id, membership.tenant_id],
      );
      if (rows.length === 0) {
        throw new ResourceNotFoundException(
          'Nodo de alcance no encontrado',
          { field },
          DelegatedAccessErrorReason.DELEGATED_SCOPE_NODE_NOT_FOUND,
        );
      }
    }
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
    if (
      dto.supervisorUserId === undefined &&
      dto.accessScope === undefined &&
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
      if (dto.accessScope !== undefined) {
        assignment.accessScopeConceptId = ACCESS_SCOPE_CONCEPT[dto.accessScope];
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
