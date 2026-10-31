import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  assertResourceInTenant,
  type ResourceScopeFailure,
} from '../../../common/tenant/resource-scope';
import type {
  DelegatedPermissionSets,
  OrganizationUserAssignments,
  PractitionerDelegateAssignments,
} from '../entities';
import {
  DelegatedPermissionSetsRepository,
  DelegationScopeRepository,
  OrganizationUserAssignmentsRepository,
  PractitionerDelegateAssignmentsRepository,
  type MembershipScope,
  type ScopeNodeKind,
} from '../repositories';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';

/** Cómo se informa un set de permisos inexistente o ajeno. */
export const PERMISSION_SET_NOT_FOUND: ResourceScopeFailure = {
  message: 'Set de permisos no encontrado',
  reason: DelegatedAccessErrorReason.DELEGATED_PERMISSION_SET_NOT_FOUND,
};

/** Cómo se informa una delegación inexistente o ajena. */
export const DELEGATION_NOT_FOUND: ResourceScopeFailure = {
  message: 'Delegación no encontrada',
  reason: DelegatedAccessErrorReason.DELEGATED_DELEGATION_NOT_FOUND,
};

/** Cómo se informa una asignación de usuario de organización inexistente o ajena. */
export const ORG_ASSIGNMENT_NOT_FOUND: ResourceScopeFailure = {
  message: 'Asignación de usuario de organización no encontrada',
  reason: DelegatedAccessErrorReason.DELEGATED_ORG_ASSIGNMENT_NOT_FOUND,
};

/** Cómo se informa una membresía o persona inexistente o ajena. */
export const MEMBERSHIP_NOT_FOUND: ResourceScopeFailure = {
  message: 'Persona de la organización no encontrada',
  reason: DelegatedAccessErrorReason.DELEGATED_MEMBERSHIP_NOT_FOUND,
};

/** Cómo se informa un nodo de alcance inexistente o ajeno. */
export const SCOPE_NODE_NOT_FOUND: ResourceScopeFailure = {
  message: 'Nodo de alcance no encontrado',
  reason: DelegatedAccessErrorReason.DELEGATED_SCOPE_NODE_NOT_FOUND,
};

/** Nodos de alcance que puede traer una asignación de usuario de organización, por campo del cuerpo. */
export interface ScopeNodeRefs {
  /** Práctica. */
  practiceId?: string;
  /** Sede de práctica. */
  practiceSiteId?: string;
  /** Unidad clínica. */
  clinicalUnitId?: string;
  /** Espacio de atención. */
  careSpaceId?: string;
  /** Unidad de diagnóstico. */
  diagnosticUnitId?: string;
  /** Farmacia. */
  pharmacyId?: string;
}

const NODE_FIELDS: ReadonlyArray<
  readonly [keyof ScopeNodeRefs, ScopeNodeKind]
> = [
  ['practiceId', 'practice'],
  ['practiceSiteId', 'practice_site'],
  ['clinicalUnitId', 'clinical_unit'],
  ['careSpaceId', 'care_space'],
  ['diagnosticUnitId', 'diagnostic_unit'],
  ['pharmacyId', 'pharmacy'],
];

/** Una delegación cargada con el set que la ancla a su tenant. */
export interface ScopedDelegation {
  /** La delegación. */
  delegate: PractitionerDelegateAssignments;
  /** El set de permisos de la delegación. */
  set: DelegatedPermissionSets;
}

/**
 * Política común de alcance de la delegación de acceso: de dónde sale el tenant
 * y cómo se prueba que la cadena actor → membresía → asignación → set →
 * delegación → paciente/encuentro es del mismo tenant antes de escribir.
 *
 * - El tenant sale del contexto verificado (`requireTenantId()`); el del cuerpo
 *   sólo se contrasta.
 * - La delegación no tiene `tenant_id`: su tenant es el de su set de permisos.
 * - Un recurso ajeno responde igual que uno inexistente (404, mismo mensaje y
 *   `reason`, sin `details`).
 */
@Injectable()
export class DelegationScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param setsRepo - Sets de permisos delegados.
   * @param delegatesRepo - Delegaciones de profesional.
   * @param orgAssignmentsRepo - Asignaciones de usuario de organización.
   * @param scopeRepo - Lecturas de alcance de otros módulos.
   */
  constructor(
    private readonly setsRepo: DelegatedPermissionSetsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly orgAssignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly scopeRepo: DelegationScopeRepository,
  ) {}

  /**
   * Resuelve el tenant desde el contexto y contrasta el del cuerpo.
   *
   * @param bodyTenantId - Tenant enviado por el cliente, si lo hubo.
   * @returns El tenant activo del actor.
   * @throws DomainException 403 `DELEGATED_TENANT_SCOPE_REQUIRED` si el cuerpo contradice al contexto.
   */
  resolveTenant(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'El tenant indicado no es el tenant activo.',
        undefined,
        DelegatedAccessErrorReason.DELEGATED_TENANT_SCOPE_REQUIRED,
      );
    }
    return tenantId;
  }

  /**
   * Set de permisos del tenant activo.
   *
   * @param tx - Transacción activa.
   * @param setId - Identificador del set.
   * @param tenantId - Tenant activo.
   * @returns El set.
   * @throws ResourceNotFoundException 404 uniforme si no existe o es de otro tenant.
   */
  async loadSetInTenant(
    tx: EntityManager,
    setId: string,
    tenantId: string,
  ): Promise<DelegatedPermissionSets> {
    const set = await this.setsRepo.findById(tx, setId);
    return assertResourceInTenant(
      set,
      set?.tenantId,
      tenantId,
      PERMISSION_SET_NOT_FOUND,
    );
  }

  /**
   * Delegación del tenant activo: su tenant es el de su set de permisos.
   *
   * @param tx - Transacción activa.
   * @param delegateId - Identificador de la delegación.
   * @param tenantId - Tenant activo.
   * @returns La delegación y su set.
   * @throws ResourceNotFoundException 404 uniforme si no existe o es de otro tenant.
   */
  async loadDelegationInTenant(
    tx: EntityManager,
    delegateId: string,
    tenantId: string,
  ): Promise<ScopedDelegation> {
    const delegate = await this.delegatesRepo.findById(tx, delegateId);
    if (!delegate) throw this.notFound(DELEGATION_NOT_FOUND);
    const set = await this.setsRepo.findById(
      tx,
      delegate.delegatedPermissionSetId,
    );
    return {
      delegate,
      set: assertResourceInTenant(
        set,
        set?.tenantId,
        tenantId,
        DELEGATION_NOT_FOUND,
      ),
    };
  }

  /**
   * Membresía (tenant y usuario) detrás de una asignación de usuario de organización.
   *
   * @param tx - Transacción activa.
   * @param assignment - Asignación ya cargada.
   * @returns La membresía, o `null` si no existe.
   */
  membershipOfAssignment(
    tx: EntityManager,
    assignment: OrganizationUserAssignments,
  ): Promise<MembershipScope | null> {
    return this.scopeRepo.membershipOf(tx, assignment.tenantMembershipId);
  }

  /**
   * Asignación de usuario de organización del tenant activo: su tenant es el
   * de su membresía.
   *
   * @param tx - Transacción activa.
   * @param assignmentId - Identificador de la asignación.
   * @param tenantId - Tenant activo.
   * @returns La asignación.
   * @throws ResourceNotFoundException 404 uniforme si no existe o su membresía es de otro tenant.
   */
  async loadOrgAssignmentInTenant(
    tx: EntityManager,
    assignmentId: string,
    tenantId: string,
  ): Promise<OrganizationUserAssignments> {
    const assignment = await this.orgAssignmentsRepo.findById(tx, assignmentId);
    const membership = assignment
      ? await this.membershipOfAssignment(tx, assignment)
      : null;
    return assertResourceInTenant(
      assignment,
      membership?.tenantId,
      tenantId,
      ORG_ASSIGNMENT_NOT_FOUND,
    );
  }

  /**
   * Exige que la membresía sea del tenant activo (la membresía es la que ancla
   * a la persona a la organización; una ajena responde como una inexistente).
   *
   * @param tx - Transacción activa.
   * @param membershipId - Identificador de la membresía.
   * @param tenantId - Tenant activo.
   * @returns La pertenencia (tenant y usuario).
   * @throws ResourceNotFoundException 404 uniforme si no existe o es de otro tenant.
   */
  async loadMembershipInTenant(
    tx: EntityManager,
    membershipId: string,
    tenantId: string,
  ): Promise<MembershipScope> {
    const membership = await this.scopeRepo.membershipOf(tx, membershipId);
    return assertResourceInTenant(
      membership,
      membership?.tenantId,
      tenantId,
      MEMBERSHIP_NOT_FOUND,
    );
  }

  /**
   * Exige que cada nodo de alcance que trae el cuerpo (práctica, sede, unidad,
   * espacio, unidad de diagnóstico, farmacia) sea de la organización activa.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param nodes - Nodos indicados (los ausentes no se comprueban).
   * @throws ResourceNotFoundException 404 uniforme (mismo mensaje para inexistente y ajeno).
   */
  async assertScopeNodesInTenant(
    tx: EntityManager,
    tenantId: string,
    nodes: ScopeNodeRefs,
  ): Promise<void> {
    for (const [field, kind] of NODE_FIELDS) {
      const id = nodes[field];
      if (!id) continue;
      const nodeTenant = await this.scopeRepo.scopeNodeTenant(tx, kind, id);
      assertResourceInTenant(
        nodeTenant,
        nodeTenant,
        tenantId,
        SCOPE_NODE_NOT_FOUND,
      );
    }
  }

  /**
   * Exige que la persona (p. ej. el responsable de la cuenta) tenga membresía en
   * la organización activa.
   *
   * @param tx - Transacción activa.
   * @param userId - Persona.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException 404 uniforme si no es de la organización.
   */
  async assertUserInTenant(
    tx: EntityManager,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const member = await this.scopeRepo.userHasMembership(tx, userId, tenantId);
    assertResourceInTenant(
      member ? userId : null,
      member ? tenantId : null,
      tenantId,
      MEMBERSHIP_NOT_FOUND,
    );
  }

  /**
   * Exige que la asignación de rol del profesional sea del tenant activo.
   *
   * @param tx - Transacción activa.
   * @param roleAssignmentId - Identificador de la asignación de rol.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException 404 uniforme si no existe o es de otro tenant.
   */
  async assertRoleAssignmentInTenant(
    tx: EntityManager,
    roleAssignmentId: string,
    tenantId: string,
  ): Promise<void> {
    const roleTenant = await this.scopeRepo.roleAssignmentTenant(
      tx,
      roleAssignmentId,
    );
    assertResourceInTenant(roleTenant, roleTenant, tenantId, {
      message: 'Asignación de rol del profesional no encontrada',
      reason: DelegatedAccessErrorReason.DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND,
    });
  }

  /**
   * Exige que el paciente y el encuentro de un grant existan en el alcance del
   * tenant y sean coherentes entre sí.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param patientProfileId - Paciente del grant, si lo hay.
   * @param encounterId - Encuentro del grant, si lo hay.
   * @throws ResourceNotFoundException 404 uniforme si el paciente o el encuentro no existen,
   *   el encuentro es de otro tenant o no es del paciente indicado.
   */
  async assertGrantTarget(
    tx: EntityManager,
    tenantId: string,
    patientProfileId?: string,
    encounterId?: string,
  ): Promise<void> {
    if (encounterId) {
      const encounter = await this.scopeRepo.encounterScope(tx, encounterId);
      if (
        !encounter ||
        encounter.tenantId !== tenantId ||
        (patientProfileId !== undefined &&
          encounter.patientProfileId !== patientProfileId)
      ) {
        throw this.notFound({
          message: 'Encuentro no encontrado',
          reason: DelegatedAccessErrorReason.DELEGATED_ENCOUNTER_NOT_FOUND,
        });
      }
    }
    if (patientProfileId) {
      const exists = await this.scopeRepo.patientExists(tx, patientProfileId);
      if (!exists) {
        throw this.notFound({
          message: 'Paciente no encontrado',
          reason: DelegatedAccessErrorReason.DELEGATED_PATIENT_NOT_FOUND,
        });
      }
    }
  }

  /**
   * Quien revoca una delegación: la administración **de esa organización** o el
   * propio doctor de la delegación. Un doctor ajeno recibe el mismo 404
   * uniforme que una delegación inexistente. El rol de administración se
   * contrasta con el tenant de la delegación (`scopedRoles`): ser administrador
   * de otra organización no sirve aquí.
   *
   * @param tx - Transacción activa.
   * @param delegate - Delegación ya cargada en el tenant.
   * @param actor - Quien revoca.
   * @param tenantId - Organización de la delegación.
   * @throws ResourceNotFoundException 404 uniforme si no es administración ni el doctor titular.
   */
  async assertAdminOrOwningDoctor(
    tx: EntityManager,
    delegate: PractitionerDelegateAssignments,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<void> {
    if (
      roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)
    ) {
      return;
    }
    await this.assertOwningDoctor(tx, delegate, actor);
  }

  /**
   * Quien decide un acceso clínico temporal: solo el doctor titular de la
   * delegación. La administración no se auto-aprueba lo que pide ni lo que pide
   * su personal: es el doctor quien responde por la historia de sus pacientes.
   *
   * @param tx - Transacción activa.
   * @param delegate - Delegación ya cargada en el tenant.
   * @param actor - Quien decide.
   * @throws ResourceNotFoundException 404 uniforme si no es el doctor titular.
   */
  async assertOwningDoctor(
    tx: EntityManager,
    delegate: PractitionerDelegateAssignments,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const profileId = await this.scopeRepo.roleAssignmentPractitioner(
      tx,
      delegate.practitionerRoleAssignmentId,
    );
    if (
      !profileId ||
      !actor.practitionerProfileId ||
      profileId !== actor.practitionerProfileId
    ) {
      throw this.notFound(DELEGATION_NOT_FOUND);
    }
  }

  /**
   * El 404 uniforme (mismo mensaje, mismo `reason`, sin `details`).
   *
   * @param failure - Descripción de «no existe».
   * @returns La excepción lista para lanzar.
   */
  private notFound(failure: ResourceScopeFailure): ResourceNotFoundException {
    return new ResourceNotFoundException(
      failure.message,
      undefined,
      failure.reason,
    );
  }
}
