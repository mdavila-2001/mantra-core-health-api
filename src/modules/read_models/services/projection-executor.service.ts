import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../common';
import { loadAuthEnv } from '../../../common/auth/auth.env';
import { ReadModelsErrorReason } from '../read_models.error-reasons';
import { RM } from '../read_models.concepts';
import type {
  FrontendViewFields,
  FrontendViewFilters,
  FrontendViewSortOptions,
  ReadModelDefinitions,
} from '../entities';

/** Página por defecto cuando ni la petición ni la definición declaran una. */
const FALLBACK_PAGE_SIZE = 50;
/** Tope duro cuando la definición no declara `maximum_page_size`. */
const FALLBACK_MAXIMUM_PAGE_SIZE = 100;
/**
 * Identificador SQL permitido para esquema, objeto y columnas. Se compara contra
 * esta lista blanca antes de interpolar: nada de lo que llega de la petición se
 * concatena al SQL, sólo columnas del contrato que pasaron este patrón.
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;
/** Columna del tenant en una proyección acotada por tenant. */
const TENANT_COLUMN = 'tenant_id';
/** Columna del paciente en una proyección acotada por paciente. */
const PATIENT_COLUMN = 'patient_profile_id';

/** Un filtro pedido por el cliente: código declarado en el contrato y su valor. */
export type RequestedFilters = Readonly<Record<string, string>>;

/** Todo lo que el ejecutor necesita para servir una página de la proyección. */
export interface ProjectionRequest {
  /** Definición del read model (esquema, objeto, límites, aislamiento). */
  readonly definition: ReadModelDefinitions;
  /** Identificador de la vista (ata el cursor a esta consulta). */
  readonly viewId: string;
  /** Campos que el actor puede recibir (ya autorizados y activos). */
  readonly fields: readonly FrontendViewFields[];
  /** Opciones de orden declaradas por el contrato. */
  readonly sortOptions: readonly FrontendViewSortOptions[];
  /** Filtros declarados por el contrato. */
  readonly filters: readonly FrontendViewFilters[];
  /** Código de orden por defecto de la vista. */
  readonly defaultSortCode?: string;
  /** La proyección se acota por el tenant activo. */
  readonly tenantScoped: boolean;
  /** Tenant activo (obligatorio si `tenantScoped`). */
  readonly tenantId?: string;
  /** La proyección se acota por un paciente. */
  readonly patientScoped: boolean;
  /** Paciente autorizado (obligatorio si `patientScoped`). */
  readonly patientProfileId?: string;
  /** Orden pedido por el cliente (código de `sortOptions`). */
  readonly sortCode?: string;
  /** Valores de filtro pedidos por el cliente, por código de filtro. */
  readonly requestedFilters: RequestedFilters;
  /** Tamaño de página pedido por el cliente. */
  readonly requestedLimit?: number;
  /** Cursor de la página anterior. */
  readonly cursor?: string;
  /** Instante de la última materialización (ata el cursor a esa foto de la MV). */
  readonly refreshedAt: Date | null;
  /** La última corrida de refresh terminó con éxito. */
  readonly materialized: boolean;
}

/** Una página de la proyección: filas por código de campo y el cursor siguiente. */
export interface ProjectionPage {
  /** Filas con las claves del contrato (`fieldCode`), sólo campos autorizados. */
  readonly rows: Record<string, unknown>[];
  /** Cursor firmado de la página siguiente, o `null` en la última. */
  readonly nextCursor: string | null;
}

/** Contenido firmado del cursor: posición y la consulta a la que pertenece. */
interface CursorPayload {
  /** Filas ya entregadas. */
  readonly o: number;
  /** Vista. */
  readonly v: string;
  /** Huella del orden, filtros y foto de la MV. */
  readonly q: string;
}

/**
 * Ejecutor de proyecciones del read model (RM-02).
 *
 * Construye un `SELECT` sobre el objeto físico de la definición con **sólo** las
 * columnas autorizadas del contrato, aplica filtros y orden de la lista blanca
 * del contrato, acota por tenant/paciente cuando el contrato lo exige y pagina
 * con un cursor firmado.
 *
 * ## Reglas
 *
 * - Definición `ACTIVE`, objeto `VIEW` o `MATERIALIZED_VIEW`; una materializada
 *   debe haberse refrescado con éxito alguna vez. Si no, `422` y no una lista
 *   vacía que se lea como «no hay datos».
 * - Esquema, objeto y columnas pasan por {@link SAFE_IDENTIFIER}; los valores
 *   siempre van como parámetros.
 * - Debe haber política de aislamiento: acotada por tenant/paciente por el
 *   contrato, o `row_level_security_required` en la definición. Sin ninguna, `422`.
 * - Límite efectivo `min(pedido ?? default, maximum_page_size)`.
 * - El orden termina siempre en columnas estables (`stable_cursor_columns_json` y
 *   el desempate de la opción de orden): sin orden total no hay página estable.
 * - El cursor lleva la posición, la vista y la huella de orden+filtros+foto de la
 *   MV, firmado con HMAC. Alterado, de otra consulta o de una foto anterior de la
 *   MV: `422 READ_MODEL_CURSOR_INVALID`.
 */
@Injectable()
export class ProjectionExecutor {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia (conexión de lectura).
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectionExecutor.name);
  }

  /**
   * Sirve una página de la proyección.
   *
   * @param request - Contrato, autorización y petición.
   * @returns La página y su cursor siguiente.
   * @throws PreconditionFailedException (`READ_MODEL_PROJECTION_UNAVAILABLE`,
   * `READ_MODEL_QUERY_NOT_ALLOWED`, `READ_MODEL_CURSOR_INVALID`).
   */
  async execute(request: ProjectionRequest): Promise<ProjectionPage> {
    const { definition } = request;

    if (definition.statusConceptId !== RM.DEF_ACTIVE) {
      throw this.unavailable('La definición del read model no está activa');
    }
    const isMaterialized =
      definition.objectTypeConceptId === RM.OBJECT_TYPE_MATERIALIZED_VIEW;
    if (
      !isMaterialized &&
      definition.objectTypeConceptId !== RM.OBJECT_TYPE_VIEW
    ) {
      throw this.unavailable('El tipo de objeto del read model no es servible');
    }
    if (isMaterialized && !request.materialized) {
      throw this.unavailable('El read model aún no se materializó');
    }
    if (
      !SAFE_IDENTIFIER.test(definition.schemaName) ||
      !SAFE_IDENTIFIER.test(definition.objectName)
    ) {
      throw this.unavailable('El nombre físico del read model no es válido');
    }
    if (request.tenantScoped && !request.tenantId) {
      throw this.unavailable(
        'La proyección exige tenant y no hay tenant activo',
      );
    }
    if (request.patientScoped && !request.patientProfileId) {
      throw this.unavailable(
        'La proyección exige paciente y no hay paciente autorizado',
      );
    }
    if (
      !request.tenantScoped &&
      !request.patientScoped &&
      definition.rowLevelSecurityRequired !== true
    ) {
      throw this.unavailable(
        'La definición no declara una política de aislamiento',
      );
    }

    // Columnas: sólo las autorizadas del contrato.
    const columns = [...new Set(request.fields.map((f) => f.sourceColumn))];
    for (const column of columns) {
      if (!SAFE_IDENTIFIER.test(column)) {
        throw this.unavailable('El contrato declara una columna no válida');
      }
    }
    if (columns.length === 0) return { rows: [], nextCursor: null };

    const limit = this.effectiveLimit(definition, request.requestedLimit);

    // Filtros pedidos: sólo los declarados y filtrables, por igualdad.
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (request.tenantScoped) {
      clauses.push(`"${TENANT_COLUMN}" = ?`);
      params.push(request.tenantId);
    }
    if (request.patientScoped) {
      clauses.push(`"${PATIENT_COLUMN}" = ?`);
      params.push(request.patientProfileId);
    }
    const appliedFilters = this.applyFilters(request, columns, clauses, params);

    const order = this.resolveOrder(request, columns, definition);

    const fingerprint = this.fingerprint(
      request,
      order.sortCode,
      appliedFilters,
    );
    const offset = this.readCursor(request, fingerprint);

    const sql =
      `SELECT ${columns.map((c) => `"${c}"`).join(', ')} ` +
      `FROM "${definition.schemaName}"."${definition.objectName}"` +
      (clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '') +
      ` ORDER BY ${order.sql} LIMIT ? OFFSET ?`;
    params.push(limit + 1, offset);

    let records: Record<string, unknown>[];
    try {
      records =
        (await this.em
          .getConnection()
          .execute<Record<string, unknown>[]>(sql, params, 'all')) ?? [];
    } catch (error) {
      // Objeto físico ausente, columna inexistente, etc.: nunca un 200 vacío.
      this.logger.error(
        {
          operation: 'read_models.projection.execute',
          definitionId: definition.id,
          error: this.reason(error),
        },
        'Projection query failed',
      );
      throw this.unavailable('La proyección no está disponible');
    }

    const hasMore = records.length > limit;
    const page = hasMore ? records.slice(0, limit) : records;
    const fieldsByColumn = request.fields;
    const rows = page.map((record) => {
      const row: Record<string, unknown> = {};
      for (const field of fieldsByColumn) {
        row[field.fieldCode] = record[field.sourceColumn] ?? null;
      }
      return row;
    });

    return {
      rows,
      nextCursor: hasMore
        ? this.signCursor({
            o: offset + limit,
            v: request.viewId,
            q: fingerprint,
          })
        : null,
    };
  }

  /** `min(pedido ?? default, máximo)`, siempre al menos 1. */
  private effectiveLimit(
    definition: ReadModelDefinitions,
    requested: number | undefined,
  ): number {
    const maximum = Math.max(
      1,
      definition.maximumPageSize ?? FALLBACK_MAXIMUM_PAGE_SIZE,
    );
    const wanted =
      requested ?? definition.defaultPageSize ?? FALLBACK_PAGE_SIZE;
    return Math.max(1, Math.min(Math.floor(wanted), maximum));
  }

  /**
   * Filtros por igualdad sobre columnas del contrato. Un filtro no declarado, no
   * filtrable o sobre una columna no autorizada se rechaza sin ejecutar SQL.
   */
  private applyFilters(
    request: ProjectionRequest,
    authorizedColumns: readonly string[],
    clauses: string[],
    params: unknown[],
  ): string[] {
    const applied: string[] = [];
    const declared = new Map(request.filters.map((f) => [f.filterCode, f]));
    const filterable = new Set(
      request.fields.filter((f) => f.filterable).map((f) => f.sourceColumn),
    );
    for (const [code, value] of Object.entries(request.requestedFilters).sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      const filter = declared.get(code);
      const column = filter?.sourceColumn;
      if (
        !filter ||
        !column ||
        !SAFE_IDENTIFIER.test(column) ||
        !authorizedColumns.includes(column) ||
        !filterable.has(column)
      ) {
        throw this.notAllowed('El filtro no está en el contrato de la vista');
      }
      clauses.push(`"${column}" = ?`);
      params.push(value);
      applied.push(`${code}=${value}`);
    }
    return applied;
  }

  /**
   * Orden: la opción pedida (o la por defecto del contrato), sobre una columna
   * autorizada, más las columnas estables de desempate.
   */
  private resolveOrder(
    request: ProjectionRequest,
    authorizedColumns: readonly string[],
    definition: ReadModelDefinitions,
  ): { sql: string; sortCode: string } {
    const wanted =
      request.sortCode ??
      request.defaultSortCode ??
      request.sortOptions[0]?.sortCode;
    const parts: string[] = [];
    let sortCode = '';
    const used = new Set<string>();

    if (wanted !== undefined) {
      const option = request.sortOptions.find((s) => s.sortCode === wanted);
      if (
        !option ||
        !SAFE_IDENTIFIER.test(option.sortExpression) ||
        !authorizedColumns.includes(option.sortExpression)
      ) {
        throw this.notAllowed('El orden no está en el contrato de la vista');
      }
      sortCode = option.sortCode;
      const direction =
        option.directionConceptId === RM.SORT_DESC ? 'DESC' : 'ASC';
      const nulls =
        option.nullsPositionConceptId === RM.NULLS_FIRST
          ? 'NULLS FIRST'
          : 'NULLS LAST';
      parts.push(`"${option.sortExpression}" ${direction} ${nulls}`);
      used.add(option.sortExpression);
      const tieBreaker = option.stableTieBreakerExpression;
      if (
        tieBreaker !== undefined &&
        tieBreaker !== null &&
        tieBreaker !== ''
      ) {
        if (!SAFE_IDENTIFIER.test(tieBreaker)) {
          throw this.unavailable('El desempate del orden no es válido');
        }
        if (!used.has(tieBreaker)) {
          parts.push(`"${tieBreaker}" ASC`);
          used.add(tieBreaker);
        }
      }
    }

    // El orden debe ser total: termina en columnas estables (las de la definición
    // o el desempate de la opción de orden). Sin ellas, la paginación repetiría
    // o saltaría filas.
    let hasStable = parts.length > 1;
    const stable = definition.stableCursorColumnsJson;
    if (Array.isArray(stable)) {
      for (const column of stable) {
        if (typeof column !== 'string' || !SAFE_IDENTIFIER.test(column)) {
          throw this.unavailable(
            'Las columnas estables del cursor no son válidas',
          );
        }
        hasStable = true;
        if (!used.has(column)) {
          parts.push(`"${column}" ASC`);
          used.add(column);
        }
      }
    }
    if (!hasStable) {
      throw this.unavailable('La definición no declara un orden estable');
    }
    return { sql: parts.join(', '), sortCode };
  }

  /** Huella de lo que hace a dos páginas la misma consulta. */
  private fingerprint(
    request: ProjectionRequest,
    sortCode: string,
    filters: readonly string[],
  ): string {
    return createHmac('sha256', this.cursorKey())
      .update(
        JSON.stringify({
          s: sortCode,
          f: filters,
          r: request.refreshedAt?.getTime() ?? null,
          t: request.tenantId ?? null,
          p: request.patientProfileId ?? null,
        }),
      )
      .digest('base64url');
  }

  /** Cursor firmado: `payload.firma`. */
  private signCursor(payload: CursorPayload): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.cursorKey())
      .update(`cursor:${body}`)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  /**
   * Posición que codifica el cursor, tras comprobar firma, vista y huella.
   * Sin cursor, la primera página.
   */
  private readCursor(request: ProjectionRequest, fingerprint: string): number {
    if (request.cursor === undefined) return 0;
    const invalid = (): PreconditionFailedException =>
      new PreconditionFailedException(
        'El cursor no es válido para esta consulta',
        undefined,
        ReadModelsErrorReason.READ_MODEL_CURSOR_INVALID,
      );

    const [body, signature, ...rest] = request.cursor.split('.');
    if (!body || !signature || rest.length > 0) throw invalid();
    const expected = createHmac('sha256', this.cursorKey())
      .update(`cursor:${body}`)
      .digest();
    const presented = Buffer.from(signature, 'base64url');
    if (
      presented.length !== expected.length ||
      !timingSafeEqual(presented, expected)
    ) {
      throw invalid();
    }

    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }
    const { o, v, q } = (payload ?? {}) as Partial<CursorPayload>;
    if (
      typeof o !== 'number' ||
      !Number.isInteger(o) ||
      o < 0 ||
      v !== request.viewId ||
      q !== fingerprint
    ) {
      throw invalid();
    }
    return o;
  }

  /** Clave de firma: derivada del secreto de la API con separación de dominio. */
  private cursorKey(): Buffer {
    return createHmac('sha256', loadAuthEnv().secret)
      .update('read_models.projection.cursor')
      .digest();
  }

  /** 422 de proyección no servible. */
  private unavailable(message: string): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      undefined,
      ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
    );
  }

  /** 422 de filtro u orden fuera de la lista blanca del contrato. */
  private notAllowed(message: string): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      undefined,
      ReadModelsErrorReason.READ_MODEL_QUERY_NOT_ALLOWED,
    );
  }

  /** Mensaje de error acotado para la bitácora (nunca se devuelve al cliente). */
  private reason(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 300);
  }
}
