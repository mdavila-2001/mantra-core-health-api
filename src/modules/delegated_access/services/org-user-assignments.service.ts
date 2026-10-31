import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
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
import { DelegationScopeService } from './delegation-scope.service';

/**
 * UC-29-01 (asignar usuario de organización con alcance/vigencia) y UC-29-10
 * (reasignar supervisor / suspender). El servicio posee la unidad de trabajo:
 * `em.transactional` + `flush` del padre antes de los hijos (las FK son columnas
 * uuid planas, MikroORM no ordena inserts entre entidades no relacionadas).
 *
 * Aislamiento entre organizaciones (A-M1): el tenant sale del contexto verificado
 * (`DelegationScopeService`), nunca del cuerpo ni de la ruta. La membresía de la
 * ruta, cada nodo de alcance del cuerpo y el supervisor se prueban dentro de la
 * organización ANTES de escribir, y la asignación que se modifica debe ser de
 * su membresía; un id ajeno responde igual que uno inexistente (404 uniforme).
 */
@Injectable()
export class OrgUserAssignmentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentsRepo - Valor de assignments repo requerido por la operación.
   * @param delegatesRepo - Valor de delegates repo requerido por la operación.
   * @param scope - Política común de tenant y alcance de la delegación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly scope: DelegationScopeService,
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
    const tenantId = this.scope.resolveTenant();

    return this.em.transactional(async (tx) => {
      // Todo lo que el cuerpo y la ruta referencian se prueba en la organización
      // activa antes de escribir: un eslabón ajeno responde como uno inexistente.
      await this.scope.loadMembershipInTenant(tx, tenantMembershipId, tenantId);
      await this.scope.assertScopeNodesInTenant(tx, tenantId, dto);
      if (dto.supervisorUserId) {
        await this.scope.assertUserInTenant(tx, dto.supervisorUserId, tenantId);
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
        tenantId,
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

    const tenantId = this.scope.resolveTenant();

    return this.em.transactional(async (tx) => {
      // La asignación debe ser de la organización activa (su membresía lo dice):
      // inexistente y ajena responden igual (404 uniforme, sin `details`).
      const assignment = await this.scope.loadOrgAssignmentInTenant(
        tx,
        id,
        tenantId,
      );
      if (dto.supervisorUserId) {
        await this.scope.assertUserInTenant(tx, dto.supervisorUserId, tenantId);
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
