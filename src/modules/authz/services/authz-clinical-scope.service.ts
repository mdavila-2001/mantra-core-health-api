import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  getCurrentTenantId,
  requireTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import {
  assertResourceInTenant,
  type ResourceScopeFailure,
} from '../../../common/tenant/resource-scope';
import {
  AuthzClinicalScopeRepository,
  type ClinicalResourceScope,
} from '../repositories';
import { AuthzErrorReason } from '../authz.error-reasons';

/** Cómo se informa un paciente inexistente o sin vínculo con el tenant activo. */
export const PATIENT_OUT_OF_SCOPE: ResourceScopeFailure = {
  message: 'Paciente no encontrado',
  reason: AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE,
};

/** Cómo se informa un encuentro inexistente, ajeno al tenant o de otro paciente. */
export const ENCOUNTER_PATIENT_MISMATCH: ResourceScopeFailure = {
  message: 'Encuentro no encontrado',
  reason: AuthzErrorReason.AUTHZ_ENCOUNTER_PATIENT_MISMATCH,
};

/** Cómo se informa un consentimiento inexistente, ajeno al tenant o de otro paciente. */
export const CONSENT_PATIENT_MISMATCH: ResourceScopeFailure = {
  message: 'Consentimiento no encontrado',
  reason: AuthzErrorReason.AUTHZ_CONSENT_PATIENT_MISMATCH,
};

/**
 * Política común de alcance de las bases de acceso clínico (accesos con propósito
 * de uso, break-the-glass, relaciones asistenciales y representación legal): de
 * dónde sale el tenant y qué referencias hay que probar **antes** de persistir.
 *
 * - El tenant sale del contexto verificado (`requireTenantId()`); el del cuerpo
 *   sólo se contrasta, nunca se persiste por su cuenta.
 * - El paciente tiene que existir y tener un vínculo comprobable con el tenant.
 * - El encuentro y el consentimiento, si vienen, tienen que ser del tenant y del
 *   mismo paciente.
 * - Todo lo ajeno responde igual que lo inexistente (404, mismo mensaje y
 *   `reason`, sin `details`).
 */
@Injectable()
export class AuthzClinicalScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param scopeRepo - Lecturas de alcance de otros módulos.
   */
  constructor(private readonly scopeRepo: AuthzClinicalScopeRepository) {}

  /**
   * Resuelve el tenant desde el contexto y contrasta el del cuerpo.
   *
   * @param bodyTenantId - Tenant enviado por el cliente, si lo hubo.
   * @returns El tenant activo del actor.
   * @throws DomainException 403 `AUTHZ_TENANT_SCOPE_REQUIRED` si el cuerpo contradice al contexto.
   */
  resolveTenant(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'El tenant indicado no es el tenant activo.',
        undefined,
        AuthzErrorReason.AUTHZ_TENANT_SCOPE_REQUIRED,
      );
    }
    return tenantId;
  }

  /**
   * Exige que el paciente exista y tenga vínculo con el tenant activo.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Paciente de la base de acceso.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException 404 uniforme si no existe o no tiene vínculo con el tenant.
   */
  async assertPatientInTenant(
    tx: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<void> {
    // Sin vínculo no se distingue «no existe» de «es de otra organización»: es el mismo 404.
    if (!(await this.isPatientInTenant(tx, patientProfileId, tenantId))) {
      throw this.notFound(PATIENT_OUT_OF_SCOPE);
    }
  }

  /**
   * ¿El paciente existe y tiene vínculo comprobable con el tenant? Es la misma
   * prueba de `assertPatientInTenant`, para quien debe decidir en vez de fallar.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Paciente de la base de acceso.
   * @param tenantId - Tenant activo.
   * @returns `true` si el perfil de paciente existe y deja huella propia en el tenant.
   */
  async isPatientInTenant(
    tx: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    // La huella puede ser de una persona que no es paciente (una cuenta de personal
    // con membresía): el perfil de paciente tiene que existir además.
    return (
      (await this.scopeRepo.patientExists(tx, patientProfileId)) &&
      (await this.scopeRepo.patientHasFootprintInTenant(
        tx,
        patientProfileId,
        tenantId,
      ))
    );
  }

  /**
   * «Admisión crea el vínculo»: ¿se puede internar a este paciente creándole
   * la huella en el tenant? Sólo si el perfil existe, NO tiene huella en el
   * tenant y NO tiene huella propia en otro tenant (un paciente de otra
   * organización no se adopta internándolo). La búsqueda en otros tenants
   * corre en una transacción aparte con contexto de sistema y devuelve sólo
   * el booleano; la del llamador no cambia.
   *
   * @param patientProfileId - Paciente.
   * @param tenantId - Tenant activo.
   */
  async canAdmitWithoutFootprint(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<boolean> {
    if (!(await this.scopeRepo.patientExists(em, patientProfileId)))
      return false;
    return em.fork().transactional(async (sys) => {
      await sys.execute(
        "select set_config('app.system_context', 'true', true)",
      );
      return !(await this.scopeRepo.hasFootprintElsewhere(
        sys,
        patientProfileId,
        tenantId,
      ));
    });
  }

  /**
   * Exige sólo que el paciente exista. Es para la solicitud de relación que un
   * profesional le hace a un paciente encontrado en el padrón: el paciente aún no
   * tiene vínculo con el tenant y la relación nace `PENDING`, sin conceder nada
   * hasta que el propio paciente la acepte.
   *
   * @param tx - Transacción activa.
   * @param patientProfileId - Paciente al que se le pide autorización.
   * @throws ResourceNotFoundException 404 `AUTHZ_PATIENT_OUT_OF_SCOPE` si no existe.
   */
  async assertPatientExists(
    tx: EntityManager,
    patientProfileId: string,
  ): Promise<void> {
    if (!(await this.scopeRepo.patientExists(tx, patientProfileId))) {
      throw this.notFound(PATIENT_OUT_OF_SCOPE);
    }
  }

  /**
   * Exige que el encuentro sea del tenant activo y del paciente indicado.
   *
   * @param tx - Transacción activa.
   * @param encounterId - Encuentro citado.
   * @param patientProfileId - Paciente de la base de acceso.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException 404 `AUTHZ_ENCOUNTER_PATIENT_MISMATCH` si no cumple.
   */
  async assertEncounterOfPatient(
    tx: EntityManager,
    encounterId: string,
    patientProfileId: string,
    tenantId: string,
  ): Promise<void> {
    const scope = await this.scopeRepo.encounterScope(tx, encounterId);
    this.assertSamePatientAndTenant(
      scope,
      patientProfileId,
      tenantId,
      ENCOUNTER_PATIENT_MISMATCH,
    );
  }

  /**
   * Exige que el consentimiento sea del tenant activo y del paciente indicado.
   *
   * @param tx - Transacción activa.
   * @param consentId - Consentimiento citado.
   * @param patientProfileId - Paciente de la base de acceso.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException 404 `AUTHZ_CONSENT_PATIENT_MISMATCH` si no cumple.
   */
  async assertConsentOfPatient(
    tx: EntityManager,
    consentId: string,
    patientProfileId: string,
    tenantId: string,
  ): Promise<void> {
    const scope = await this.scopeRepo.consentScope(tx, consentId);
    this.assertSamePatientAndTenant(
      scope,
      patientProfileId,
      tenantId,
      CONSENT_PATIENT_MISMATCH,
    );
  }

  /**
   * Acota por tenant la base de acceso que se va a revocar por id.
   *
   * - El titular del expediente revoca lo suyo en cualquier organización: es su
   *   historia y no hay otro tenant que lo limite.
   * - Cualquier otro actor revoca sólo en el tenant activo: una base de otro tenant
   *   responde igual que una inexistente.
   * - Un actor de plataforma (`SUPERADMIN` o `SYSTEM`) que no fija tenant revoca
   *   por id sin acotar; revocar sólo reduce acceso y esos roles ya autorizan en
   *   toda la API. Cualquier otro actor sin tenant recibe `TENANT_REQUIRED`.
   *
   * @param resource - Base de acceso ya cargada por id, o `null` si no existe.
   * @param actor - Quien revoca.
   * @param failure - Descripción de «no existe».
   * @returns La misma base, ya acotada.
   * @throws ResourceNotFoundException 404 uniforme si no existe o es de otro tenant.
   * @throws PreconditionFailedException 412 `TENANT_REQUIRED` si el actor ordinario no tiene tenant activo.
   */
  scopeRevocation<T extends { tenantId: string; patientProfileId: string }>(
    resource: T | null | undefined,
    actor: AuthenticatedUser,
    failure: ResourceScopeFailure,
  ): T {
    if (
      resource &&
      actor.patientProfileId !== undefined &&
      resource.patientProfileId === actor.patientProfileId
    ) {
      return resource;
    }
    const activeTenantId = getCurrentTenantId();
    if (activeTenantId === undefined) {
      const isPlatformActor =
        actor.roles.includes('SUPERADMIN') ||
        roleAuthorizesInTenant(actor, 'SYSTEM', undefined);
      if (!isPlatformActor) requireTenantId();
      if (!resource) throw this.notFound(failure);
      return resource;
    }
    return assertResourceInTenant(
      resource,
      resource?.tenantId,
      activeTenantId,
      failure,
    );
  }

  /**
   * Comprueba que un recurso clínico sea del tenant y del paciente esperados.
   *
   * @param scope - Alcance del recurso, o `null` si no existe.
   * @param patientProfileId - Paciente esperado.
   * @param tenantId - Tenant activo.
   * @param failure - Descripción de «no existe».
   * @throws ResourceNotFoundException 404 uniforme si no cumple.
   */
  private assertSamePatientAndTenant(
    scope: ClinicalResourceScope | null,
    patientProfileId: string,
    tenantId: string,
    failure: ResourceScopeFailure,
  ): void {
    const samePatient = scope?.patientProfileId === patientProfileId;
    assertResourceInTenant(
      samePatient ? scope : null,
      scope?.tenantId,
      tenantId,
      failure,
    );
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
