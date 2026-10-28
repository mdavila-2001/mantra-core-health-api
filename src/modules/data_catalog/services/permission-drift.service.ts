import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SYSTEM_ROLE_SEED } from '../../../common/seed/authz-clinical-roles-seed.service';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
import { ROLE_CONCEPT_BY_CODE } from '../../iam/domain/role-mapping';
import {
  computePermissionDrift,
  type DriftRoute,
  type PermissionDriftReport,
  type RouteRef,
} from '../permission-drift/permission-drift';

/** Cuántas rutas sin `@Roles` devuelve la consola; el total va aparte y completo. */
export const DRIFT_ROUTES_LIST_CAP = 200;

/**
 * Rol de la cuenta de servicio de los workers: lo firma el worker, no se asigna ni se siembra
 * (ver `RoleCode`), y las rutas `/internal/*` lo exigen.
 */
const SYSTEM_ROLE = 'SYSTEM';

/**
 * Roles que el login deriva de una membresía y que por eso no se asignan ni se siembran:
 * `PHARMACY_STAFF` se agrega al token de quien tiene una membresía activa en un tenant de tipo
 * `PHARMACY` (`withPharmacyStaffRole` en `iam-auth.service.ts`). Sembrarlo permitiría asignarlo a
 * mano a alguien sin esa membresía.
 */
const DERIVED_RUNTIME_ROLES: readonly string[] = ['PHARMACY_STAFF'];

/**
 * Roles que existen sin sembrarse en `authz.roles`: los globales de `iam`, la cuenta de servicio y
 * los que el login deriva de una membresía.
 */
export const PLATFORM_ROLE_CODES: readonly string[] = [
  ...Object.keys(ROLE_CONCEPT_BY_CODE),
  SYSTEM_ROLE,
  ...DERIVED_RUNTIME_ROLES,
];

export interface PermissionDriftView extends PermissionDriftReport {
  generatedAt: string;
  /** `true` si `routesWithoutRoles` se recortó a {@link DRIFT_ROUTES_LIST_CAP}; el total está en `routes.withoutRoles`. */
  routesWithoutRolesTruncated: boolean;
}

/**
 * Deriva de permisos en tiempo de ejecución: arma las entradas de {@link computePermissionDrift}
 * con las rutas que Nest registró, los roles que la API siembra y los que hay en `authz.roles`.
 * Sólo lee.
 */
@Injectable()
export class PermissionDriftService {
  constructor(
    private readonly em: EntityManager,
    private readonly routes: RouteMetadataService,
  ) {}

  async report(now: Date = new Date()): Promise<PermissionDriftView> {
    const informe = computePermissionDrift({
      routes: this.routes.all().map((r): DriftRoute => ({
        method: r.method,
        template: r.template,
        controller: r.controller,
        handler: r.handler,
        roles: r.roles,
        isPublic: r.isPublic,
      })),
      seededRoleCodes: SYSTEM_ROLE_SEED.map((role) => role.code),
      platformRoleCodes: PLATFORM_ROLE_CODES,
      databaseRoleCodes: await this.databaseRoleCodes(),
    });
    const truncada = informe.routesWithoutRoles.length > DRIFT_ROUTES_LIST_CAP;
    const recorte: RouteRef[] = informe.routesWithoutRoles.slice(
      0,
      DRIFT_ROUTES_LIST_CAP,
    );
    return {
      ...informe,
      routesWithoutRoles: recorte,
      routesWithoutRolesTruncated: truncada,
      generatedAt: now.toISOString(),
    };
  }

  /** Códigos de los roles activos de `authz.roles`. */
  private async databaseRoleCodes(): Promise<string[]> {
    const filas = await this.em
      .fork()
      .getConnection()
      .execute<{ code: string }[]>(
        'select distinct code from authz.roles where state_concept_id = ?',
        [CONCEPTS.STATE_ACTIVE],
      );
    return filas.map((f) => f.code);
  }
}
