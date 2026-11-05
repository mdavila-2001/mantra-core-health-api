import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SYSTEM_ROLE_SEED } from '../../../common/seed/authz-clinical-roles-seed.service';
import { RouteMetadataService } from '../../../observability/route-index/route-metadata.service';
import {
  computePermissionDrift,
  type DriftRoute,
  type PermissionDriftReport,
  type RouteRef,
} from '../domain/permission-drift/permission-drift';
import {
  PLATFORM_ROLE_CODES_PORT,
  type PlatformRoleCodesPort,
} from './ports/platform-role-codes.port';

/** Cuántas rutas sin `@Roles` devuelve la consola; el total va aparte y completo. */
export const DRIFT_ROUTES_LIST_CAP = 200;

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
    @Inject(PLATFORM_ROLE_CODES_PORT)
    private readonly platformRoles: PlatformRoleCodesPort,
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
      platformRoleCodes: this.platformRoles.platformRoleCodes(),
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
