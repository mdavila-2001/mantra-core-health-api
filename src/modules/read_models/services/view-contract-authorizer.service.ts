import { Injectable } from '@nestjs/common';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ReadModelsErrorReason } from '../read_models.error-reasons';
import type {
  FrontendPageViews,
  FrontendRoutes,
  FrontendViewActions,
  FrontendViewFields,
  PortalSurfaces,
} from '../entities';
import {
  ViewAudienceGate,
  ViewFeatureFlags,
  ViewPatientAccess,
  ViewPermissionGate,
} from './view-access.ports';

/**
 * Roles con bypass **explícito** del contrato de acceso (audiencia y permiso).
 *
 * `SUPERADMIN` y `SECURITY_ADMIN` administran la plataforma y el catálogo de
 * vistas: no se les exige estar en la audiencia de un portal ni tener cada
 * permiso individual. El bypass NO alcanza a lo que no es un privilegio sino una
 * condición del dato: el contexto de tenant y de paciente que la ruta exige, el
 * feature flag y el propósito de uso se les exigen igual, y el acceso a un
 * paciente concreto sigue pasando por la política clínica.
 */
export const VIEW_BYPASS_ROLES: readonly string[] = [
  'SUPERADMIN',
  'SECURITY_ADMIN',
];

/** Lo que la petición declara y el servidor ya resolvió, para decidir el acceso. */
export interface ViewRequestContext {
  /** Quien pide la vista. */
  readonly user: AuthenticatedUser;
  /** Tenant activo del contexto verificado (`getCurrentTenantId()`). */
  readonly tenantId?: string;
  /** Paciente declarado por el cliente; sólo cuenta si se puede acceder a él. */
  readonly patientProfileId?: string;
  /** Propósito de uso declarado por el cliente (`catalog_concepts.id`). */
  readonly purposeOfUseConceptId?: string;
}

/** Contrato de la vista que se resuelve: portal, ruta y vista. */
export interface ViewContract {
  /** Superficie de portal. */
  readonly portal: PortalSurfaces;
  /** Ruta del frontend. */
  readonly route: FrontendRoutes;
  /** Vista de página. */
  readonly view: FrontendPageViews;
}

/** Resultado de autorizar el contrato: lo que la petición puede usar para filtrar. */
export interface AuthorizedView {
  /** El actor entró por el bypass explícito de administración. */
  readonly privileged: boolean;
  /** Tenant activo (presente si el contrato lo exige). */
  readonly tenantId?: string;
  /** Paciente cuyo contexto se autorizó (presente si el contrato lo exige). */
  readonly patientProfileId?: string;
}

/**
 * El 404 uniforme de las vistas: inexistente, inactiva o fuera del contrato de
 * acceso del actor. Mismo mensaje, mismo `reason`, sin `details`.
 *
 * @returns La excepción lista para lanzar.
 */
export function viewOutOfScope(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Vista no encontrada',
    undefined,
    ReadModelsErrorReason.READ_MODEL_VIEW_OUT_OF_SCOPE,
  );
}

/**
 * Autorizador del contrato de una vista (RM-01).
 *
 * Es el único punto que decide si un actor autenticado puede ver (datos,
 * acciones, campos) una vista publicada. Hasta ahora el servicio resolvía
 * portal, ruta y vista por código y servía lo que encontrara: los requisitos
 * que el contrato declara (audiencia, permiso, propósito, feature flag,
 * contextos de tenant y paciente) existían en las entidades y no se evaluaban.
 *
 * Todo fallo es el mismo `404/RESOURCE_NOT_FOUND/READ_MODEL_VIEW_OUT_OF_SCOPE`:
 * decir *qué* requisito falta confirmaría que el contrato existe a quien sólo
 * probó códigos. La decisión es deny-by-default: un requisito declarado que no se
 * puede evaluar (p. ej. un feature flag sin proveedor) deniega.
 */
@Injectable()
export class ViewContractAuthorizer {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param permissions - Permisos del usuario.
   * @param audience - Audiencia de roles del portal.
   * @param flags - Feature flags.
   * @param patients - Acceso a los datos de un paciente.
   */
  constructor(
    private readonly permissions: ViewPermissionGate,
    private readonly audience: ViewAudienceGate,
    private readonly flags: ViewFeatureFlags,
    private readonly patients: ViewPatientAccess,
  ) {}

  /**
   * Si el rol del actor entra por el bypass explícito de administración.
   *
   * @param user - Actor.
   * @returns `true` para `SUPERADMIN` y `SECURITY_ADMIN`.
   */
  isPrivileged(user: AuthenticatedUser): boolean {
    return (user.roles ?? []).some((role) => VIEW_BYPASS_ROLES.includes(role));
  }

  /**
   * Autoriza el acceso del actor al contrato de la vista, antes de listar hijos.
   *
   * Orden: estados activos → contextos exigidos → feature flag → (salvo bypass)
   * audiencia y permiso → propósito.
   *
   * @param contract - Portal, ruta y vista resueltos por código.
   * @param request - Actor y contexto de la petición.
   * @returns Lo autorizado, para filtrar la proyección por tenant y paciente.
   * @throws ResourceNotFoundException (`READ_MODEL_VIEW_OUT_OF_SCOPE`) si falla cualquier requisito.
   */
  async authorizeView(
    contract: ViewContract,
    request: ViewRequestContext,
  ): Promise<AuthorizedView> {
    const { portal, route, view } = contract;
    const { user } = request;

    if (
      portal.statusConceptId !== CONCEPTS.STATE_ACTIVE ||
      route.statusConceptId !== CONCEPTS.STATE_ACTIVE ||
      view.statusConceptId !== CONCEPTS.STATE_ACTIVE
    ) {
      throw viewOutOfScope();
    }

    // Contextos que el contrato exige: son condición del dato, no privilegio.
    const needsTenant =
      route.requiresTenantContext === true || portal.tenantScoped === true;
    if (needsTenant && !request.tenantId) throw viewOutOfScope();

    const needsPatient =
      route.requiresPatientContext === true || portal.patientScoped === true;
    let patientProfileId: string | undefined;
    if (needsPatient) {
      patientProfileId = request.patientProfileId ?? user.patientProfileId;
      if (!patientProfileId) throw viewOutOfScope();
      // El propio paciente ve lo suyo; cualquier otro necesita base clínica.
      if (
        patientProfileId !== user.patientProfileId &&
        !(await this.patients.canAccess(user, patientProfileId))
      ) {
        throw viewOutOfScope();
      }
    }

    if (
      route.featureFlagCode &&
      !(await this.flags.isEnabled(route.featureFlagCode, request.tenantId))
    ) {
      throw viewOutOfScope();
    }

    const privileged = this.isPrivileged(user);
    if (!privileged) {
      if (
        portal.audienceRoleValueSetId &&
        !(await this.audience.isInAudience(user, portal.audienceRoleValueSetId))
      ) {
        throw viewOutOfScope();
      }
      if (
        route.requiredPermissionId &&
        !(await this.permissions.holds(
          user,
          request.tenantId,
          route.requiredPermissionId,
        ))
      ) {
        throw viewOutOfScope();
      }
    }

    // El propósito de uso se declara y se compara con el que la ruta exige: lo
    // mismo para todos, incluidos los roles con bypass.
    if (
      route.purposeOfUseConceptId &&
      request.purposeOfUseConceptId !== route.purposeOfUseConceptId
    ) {
      throw viewOutOfScope();
    }

    return { privileged, tenantId: request.tenantId, patientProfileId };
  }

  /**
   * Campos que el actor puede recibir: los activos del contrato cuyo
   * `permission_id` (si lo declaran) el actor tiene. Un campo sin permiso
   * declarado lo recibe quien llegó a la vista; el bypass cubre a la administración.
   *
   * @param fields - Campos del contrato.
   * @param authorized - Resultado de {@link authorizeView}.
   * @param user - Actor.
   * @returns Los campos servibles, en el orden del contrato.
   */
  async authorizedFields(
    fields: readonly FrontendViewFields[],
    authorized: AuthorizedView,
    user: AuthenticatedUser,
  ): Promise<FrontendViewFields[]> {
    const decisions = new Map<string, boolean>();
    const served: FrontendViewFields[] = [];
    for (const field of fields) {
      if (field.statusConceptId !== CONCEPTS.STATE_ACTIVE) continue;
      if (field.permissionId && !authorized.privileged) {
        let allowed = decisions.get(field.permissionId);
        if (allowed === undefined) {
          allowed = await this.permissions.holds(
            user,
            authorized.tenantId,
            field.permissionId,
          );
          decisions.set(field.permissionId, allowed);
        }
        if (!allowed) continue;
      }
      served.push(field);
    }
    return served;
  }

  /**
   * Si el actor tiene el permiso que la acción exige (si declara alguno).
   *
   * @param action - Acción del contrato.
   * @param authorized - Resultado de {@link authorizeView}.
   * @param user - Actor.
   * @returns `true` si la acción puede ofrecérsele.
   */
  async actionPermitted(
    action: FrontendViewActions,
    authorized: AuthorizedView,
    user: AuthenticatedUser,
  ): Promise<boolean> {
    if (!action.requiredPermissionId || authorized.privileged) return true;
    return this.permissions.holds(
      user,
      authorized.tenantId,
      action.requiredPermissionId,
    );
  }
}
