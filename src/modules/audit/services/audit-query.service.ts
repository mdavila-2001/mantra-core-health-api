import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { ROUTE_ACTION_PREFIX } from '../../../common/audit-trail';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { normalizeTemplate } from '../../../observability/route-index/route-index.service';
import {
  RouteMetadataService,
  type RouteSecurity,
} from '../../../observability/route-index/route-metadata.service';
import { AUD } from '../audit.concepts';
import { deriveHealthRisk, type DataOperation } from '../domain/health-risk';
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_METHODS,
  type AuditLogQueryDto,
  type AuditLogPageDto,
  type DataAccessPageDto,
  type DataAccessQueryDto,
  type MyDataAccessPageDto,
  type MyDataAccessQueryDto,
} from '../dto/audit-query.dto';
import {
  AuditQueryRepository,
  type ActionMatcher,
  type TimeCursor,
} from '../repositories/audit-query.repository';

/** Sin rango de fechas la consulta mira esta ventana: por acción no hay índice y la tabla crece sin tope. */
export const AUDIT_DEFAULT_WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `HTTP <VERBO> <plantilla>`: la acción que el interceptor deriva cuando la ruta no declara una de negocio. */
const DERIVED_ACTION = new RegExp(`^${ROUTE_ACTION_PREFIX} (\\S+) (.+)$`);

/** Operación registrada en `data_access_log` por su concepto. */
const OPERATION_BY_CONCEPT: Readonly<Record<string, DataOperation>> = {
  [AUD.ACTION_READ]: 'READ',
  [AUD.ACTION_CREATE]: 'CREATE',
  [AUD.ACTION_UPDATE]: 'UPDATE',
  [AUD.ACTION_DELETE]: 'DELETE',
  [AUD.ACTION_EXPORT]: 'EXPORT',
};

const CONCEPT_BY_OPERATION: Readonly<Record<DataOperation, string>> = {
  READ: AUD.ACTION_READ,
  CREATE: AUD.ACTION_CREATE,
  UPDATE: AUD.ACTION_UPDATE,
  DELETE: AUD.ACTION_DELETE,
  EXPORT: AUD.ACTION_EXPORT,
};

const RESULT_BY_CONCEPT: Readonly<Record<string, 'SUCCESS' | 'FAILURE'>> = {
  [CONCEPTS.OUTCOME_SUCCESS]: 'SUCCESS',
  [CONCEPTS.OUTCOME_FAILURE]: 'FAILURE',
};

/** Verbo y plantilla de la ruta que dejó un sello; `null` en lo que no se pudo derivar. */
export interface RouteOfAction {
  method: string | null;
  route: string | null;
}

/**
 * Consulta de la bitácora (`audit.audit_log`) y de las lecturas sensibles (`audit.data_access_log`).
 *
 * No toca el interceptor ni la cadena de hashes: todo lo que no está en la fila se **deriva al
 * leer**. El verbo y la ruta salen de la acción (`HTTP <VERBO> <plantilla>`); para las acciones de
 * negocio (`@Audited`) salen del mapa acción → ruta que arma {@link RouteMetadataService} al
 * arrancar. El riesgo para la seguridad de la salud sale de {@link deriveHealthRisk}.
 */
@Injectable()
export class AuditQueryService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AuditQueryRepository,
    private readonly routes: RouteMetadataService,
  ) {}

  async log(
    q: AuditLogQueryDto,
    now: Date = new Date(),
  ): Promise<AuditLogPageDto> {
    const limit = q.limit ?? AUDIT_DEFAULT_PAGE_SIZE;
    const filas = await this.repo.auditLog(this.em.fork(), {
      ...rango(q, now),
      userId: q.userId,
      tenantId: q.tenantId,
      outcomeConceptId: q.result ? conceptoDeResultado(q.result) : undefined,
      action: q.action,
      entity: q.entity,
      matcher: this.matcher(q.method, q.route),
      cursor: cursorDe(q.cursor),
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => {
        const { method, route } = this.routeOfAction(f.action);
        return {
          id: f.id,
          userId: f.user_id,
          tenantId: f.tenant_id,
          action: f.action,
          entity: f.entity,
          entityId: f.entity_id,
          result: RESULT_BY_CONCEPT[f.outcome_concept_id] ?? 'UNKNOWN',
          ip: f.ip,
          method,
          route,
          healthRisk: deriveHealthRisk({
            kind: 'MUTATION',
            action: f.action,
            entity: f.entity,
            route,
            method,
          }),
          recordedAt: f.recorded_at,
        };
      }),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({ t: ultimo.recorded_at, i: ultimo.id })
          : null,
      limit,
    };
  }

  async dataAccess(
    q: DataAccessQueryDto,
    now: Date = new Date(),
  ): Promise<DataAccessPageDto> {
    const limit = q.limit ?? AUDIT_DEFAULT_PAGE_SIZE;
    const filas = await this.repo.dataAccess(this.em.fork(), {
      ...rango(q, now),
      userId: q.userId,
      tenantId: q.tenantId,
      patientProfileId: q.patientProfileId,
      resourceType: q.resourceType,
      actionConceptId: q.operation
        ? CONCEPT_BY_OPERATION[q.operation]
        : undefined,
      cursor: cursorDe(q.cursor),
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => {
        const operation = OPERATION_BY_CONCEPT[f.action_concept_id] ?? 'READ';
        return {
          id: f.id,
          userId: f.user_id,
          tenantId: f.tenant_id,
          patientProfileId: f.patient_profile_id,
          operation,
          resourceType: f.resource_type,
          resourceId: f.resource_id,
          purpose: f.purpose,
          healthRisk: deriveHealthRisk({
            kind: 'DATA_ACCESS',
            action: f.purpose ?? '',
            entity: f.resource_type ?? '',
            route: null,
            method: null,
            operation,
            hasPatient: f.patient_profile_id !== null,
          }),
          recordedAt: f.recorded_at,
        };
      }),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({ t: ultimo.recorded_at, i: ultimo.id })
          : null,
      limit,
    };
  }

  /**
   * Autoservicio del titular (PAC-HIST-004/005): quién accedió a sus datos, a qué, para qué y
   * cuándo. Lee `audit.data_access_log` acotado **siempre** por el perfil de paciente de la sesión
   * (`actor.patientProfileId`): el paciente nunca viene de un parámetro, así que nadie puede pedir
   * los accesos de otro. No filtra por tenant —el titular ve los accesos a su historia en cualquier
   * organización—, y no expone el riesgo derivado ni el tenant, que son de la vista de plataforma.
   *
   * @throws PreconditionFailedException si la sesión no tiene perfil de paciente.
   */
  async myDataAccess(
    actor: AuthenticatedUser,
    q: MyDataAccessQueryDto,
    now: Date = new Date(),
  ): Promise<MyDataAccessPageDto> {
    const patientProfileId = actor.patientProfileId;
    if (!patientProfileId) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil de paciente asociado',
        { userId: actor.id },
      );
    }
    const limit = q.limit ?? AUDIT_DEFAULT_PAGE_SIZE;
    const filas = await this.repo.dataAccess(this.em.fork(), {
      ...rango(q, now),
      patientProfileId,
      cursor: cursorDe(q.cursor),
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        id: f.id,
        userId: f.user_id,
        operation: OPERATION_BY_CONCEPT[f.action_concept_id] ?? 'READ',
        resourceType: f.resource_type,
        resourceId: f.resource_id,
        purpose: f.purpose,
        recordedAt: f.recorded_at,
      })),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({ t: ultimo.recorded_at, i: ultimo.id })
          : null,
      limit,
    };
  }

  /**
   * Verbo y ruta de un sello. Una acción derivada lo trae escrito; una de negocio se busca en el
   * mapa de rutas. Si la misma acción sella varias rutas, el verbo se informa sólo si coincide en
   * todas y la ruta queda en `null`: no se elige una al azar.
   */
  routeOfAction(action: string): RouteOfAction {
    const derivada = DERIVED_ACTION.exec(action);
    if (derivada) return { method: derivada[1], route: derivada[2] };
    const rutas = this.routes.routesByAuditedAction().get(action);
    if (!rutas?.length) return { method: null, route: null };
    return {
      method: unico(rutas.map((r) => r.method)),
      route: unico(rutas.map((r) => r.template)),
    };
  }

  /**
   * Qué acciones de la bitácora cumplen el filtro de verbo y ruta. `undefined` si el cliente no
   * filtró por ninguno de los dos.
   */
  private matcher(
    method: string | undefined,
    route: string | undefined,
  ): ActionMatcher | undefined {
    if (!method && !route) return undefined;
    const verbos: readonly string[] = method ? [method] : AUDIT_METHODS;
    const plantilla = route ? normalizeTemplate(route) : null;
    const rutaCumple = (r: RouteSecurity): boolean =>
      verbos.includes(r.method) &&
      (plantilla === null || r.template === plantilla);
    const deNegocio = [...this.routes.routesByAuditedAction()]
      .filter(([, rutas]) => rutas.some(rutaCumple))
      .map(([accion]) => accion);
    return plantilla
      ? {
          exact: [
            ...verbos.map((v) => `${ROUTE_ACTION_PREFIX} ${v} ${plantilla}`),
            ...deNegocio,
          ],
          prefixes: [],
        }
      : {
          exact: deNegocio,
          prefixes: verbos.map((v) => `${ROUTE_ACTION_PREFIX} ${v} `),
        };
  }
}

/** El valor si todos coinciden; `null` si difieren. */
function unico(valores: readonly string[]): string | null {
  return new Set(valores).size === 1 ? valores[0] : null;
}

function conceptoDeResultado(resultado: 'SUCCESS' | 'FAILURE'): string {
  return resultado === 'SUCCESS'
    ? CONCEPTS.OUTCOME_SUCCESS
    : CONCEPTS.OUTCOME_FAILURE;
}

/** Rango pedido; sin él, la ventana por omisión. Un rango invertido es un error del cliente. */
function rango(
  q: { from?: string; to?: string },
  now: Date,
): { from: Date; to?: Date } {
  const from = q.from
    ? new Date(q.from)
    : new Date(now.getTime() - AUDIT_DEFAULT_WINDOW_DAYS * MS_PER_DAY);
  const to = q.to ? new Date(q.to) : undefined;
  if (to && to <= from)
    throw new BadRequestException('«to» debe ser posterior a «from»');
  return { from, to };
}

function cursorDe(cursor: string | undefined): TimeCursor | undefined {
  if (!cursor) return undefined;
  const k = decodeKeysetCursor(cursor);
  if (typeof k.t !== 'string' || typeof k.i !== 'string')
    throw new BadRequestException('El cursor de paginación no es válido');
  return { t: k.t, i: k.i };
}
