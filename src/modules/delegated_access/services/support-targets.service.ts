import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  TARGET_CONSTRAINTS,
  snapshotRowsFor,
  validateTargetReferences,
  type FixedSnapshot,
  type SupportTargetKind,
  type TargetReferences,
} from '../domain';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import { SupportAccessRepository } from '../repositories';

/** Objetivo ya validado contra la organización, con las asignaciones de rol resueltas. */
export interface ValidatedTarget {
  /** Tipo de objetivo. */
  readonly kind: SupportTargetKind;
  /** Perfil del doctor del objetivo, si el tipo lo acota. */
  readonly practitionerProfileId?: string;
}

/**
 * Valida que cada referencia de un objetivo (doctor, servicio, espacio, sede)
 * exista y sea de la organización activa —un eslabón ajeno responde igual que
 * uno inexistente—, y arma la foto congelada de un permiso `FIXED`.
 */
@Injectable()
export class SupportTargetsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param repo - Lecturas de estructura de la organización.
   */
  constructor(private readonly repo: SupportAccessRepository) {}

  /**
   * Comprueba coherencia del tipo con sus referencias y pertenencia al tenant.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización activa.
   * @param kind - Tipo de objetivo.
   * @param refs - Referencias del objetivo.
   * @returns El tipo y el perfil del doctor, si lo hay.
   * @throws DomainException 400 `SUPPORT_TARGET_INVALID` si las referencias no cuadran con el tipo.
   * @throws ResourceNotFoundException 404 `SUPPORT_TARGET_NOT_FOUND` si algo no existe o es de otra organización.
   */
  async assertTarget(
    tx: EntityManager,
    tenantId: string,
    kind: SupportTargetKind,
    refs: TargetReferences,
  ): Promise<ValidatedTarget> {
    const problem = validateTargetReferences(kind, refs);
    if (problem) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        problem,
        undefined,
        DelegatedAccessErrorReason.SUPPORT_TARGET_INVALID,
      );
    }
    let practitionerProfileId: string | undefined;
    if (refs.practitionerRoleAssignmentId) {
      const roles = await this.repo.findRoleAssignments(tx, [
        refs.practitionerRoleAssignmentId,
      ]);
      const role = roles.get(refs.practitionerRoleAssignmentId);
      if (!role || role.tenantId !== tenantId) throw this.notFound();
      practitionerProfileId = role.practitionerProfileId;
    }
    if (refs.healthcareServiceId) {
      const services = await this.repo.findServices(tx, [
        refs.healthcareServiceId,
      ]);
      if (services.get(refs.healthcareServiceId)?.tenantId !== tenantId) {
        throw this.notFound();
      }
    }
    if (refs.careSpaceId) {
      const spaces = await this.repo.findCareSpaces(tx, [refs.careSpaceId]);
      if (spaces.get(refs.careSpaceId)?.tenantId !== tenantId) {
        throw this.notFound();
      }
    }
    if (refs.practiceSiteId) {
      const sites = await this.repo.tenantsOfSites(tx, [refs.practiceSiteId]);
      if (sites.get(refs.practiceSiteId) !== tenantId) throw this.notFound();
    }
    return { kind, practitionerProfileId };
  }

  /**
   * Foto congelada de lo que cubre hoy un permiso, con la forma del modelo
   * (`{"rows":[…]}`, NULL = cualquiera): una fila por combinación de las
   * dimensiones que el tipo acota —todas las asignaciones del doctor, el
   * servicio, cada espacio dentro de la ubicación—.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param kind - Tipo de objetivo.
   * @param refs - Referencias del objetivo.
   * @returns La foto para guardar en `fixed_snapshot_json`.
   */
  async buildSnapshot(
    tx: EntityManager,
    tenantId: string,
    kind: SupportTargetKind,
    refs: TargetReferences,
  ): Promise<FixedSnapshot> {
    const c = TARGET_CONSTRAINTS[kind];
    // Cada dimensión acotada aporta sus miembros ACTUALES: el del objetivo
    // (`SPECIFIC`) o toda la lista de la organización (`ANY`). Congelar «todos»
    // con una fila comodín lo dejaba igual que un permiso dinámico.
    let doctors: { id?: string; profileId?: string }[] = [];
    if (c.practitioner === 'SPECIFIC' && refs.practitionerRoleAssignmentId) {
      const roles = await this.repo.findRoleAssignments(tx, [
        refs.practitionerRoleAssignmentId,
      ]);
      const profileId = roles.get(
        refs.practitionerRoleAssignmentId,
      )?.practitionerProfileId;
      const siblings = profileId
        ? await this.repo.findRoleAssignmentsOfPractitioner(
            tx,
            profileId,
            tenantId,
          )
        : [];
      doctors = siblings.map((r) => ({ id: r.id, profileId }));
    } else if (c.practitioner === 'ANY') {
      const all = await this.repo.findRoleAssignmentsOfTenant(tx, tenantId);
      doctors = all.map((r) => ({
        id: r.id,
        profileId: r.practitionerProfileId,
      }));
    }
    let services: string[] = [];
    if (c.service === 'SPECIFIC' && refs.healthcareServiceId) {
      services = [refs.healthcareServiceId];
    } else if (c.service === 'ANY') {
      services = await this.repo.findServiceIdsOfTenant(tx, tenantId);
    }
    let spaces: string[] = [];
    if (c.location === 'SPECIFIC') {
      spaces = await this.repo.findCareSpaceIdsWithin(tx, refs);
    } else if (c.location === 'ANY') {
      spaces = await this.repo.findCareSpaceIdsOfTenant(tx, tenantId);
    }
    try {
      const snapshot = snapshotRowsFor(kind, { doctors, services, spaces });
      // El modelo exige al menos una fila: sin nada que congelar no hay permiso
      // FIXED que dar (uno vacío no cubriría nada).
      if (snapshot.rows.length === 0) {
        throw new Error(
          'No hay doctores, servicios ni espacios que congelar: use un permiso dinámico',
        );
      }
      return snapshot;
    } catch (error) {
      throw new PreconditionFailedException(
        error instanceof Error ? error.message : 'Foto demasiado grande',
        { kind },
        DelegatedAccessErrorReason.SUPPORT_TARGET_INVALID,
      );
    }
  }

  /** 404 uniforme: el objetivo no existe o no es de la organización. */
  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Doctor, servicio, espacio o sede no encontrado',
      undefined,
      DelegatedAccessErrorReason.SUPPORT_TARGET_NOT_FOUND,
    );
  }
}
