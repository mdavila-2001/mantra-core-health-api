import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SOURCE_CODE } from '../catalog/catalog.constants';
import {
  NOT_OBSERVED,
  OBSERVED,
  type ImpactRow,
  type KnownInventory,
  type KnownOperation,
  type KnownProcess,
  type OperationRow,
  type ProcessRow,
  type StepOperationRow,
  type StepRow,
} from '../catalog/import-plan';

/** Filas por sentencia: un único parámetro JSON de este tamaño cabe de sobra y no alarga el plan. */
const LOTE = 2000;

const ahora = (): Date => new Date();

/** Parte `filas` en lotes de {@link LOTE}. */
function lotes<T>(filas: readonly T[]): T[][] {
  const salida: T[][] = [];
  for (let i = 0; i < filas.length; i += LOTE)
    salida.push(filas.slice(i, i + LOTE));
  return salida;
}

/**
 * Acceso a las cinco tablas del mapa operaciones ↔ datos (`catalog_operations`,
 * `catalog_operation_impacts`, `catalog_processes`, `catalog_process_steps`,
 * `catalog_process_step_operations`). Como `CatalogRepository`, ningún método abre su propia
 * transacción: todos corren en la del `em` que reciben.
 */
@Injectable()
export class CatalogInventoryRepository {
  private q<T = unknown>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  /**
   * Una importación a la vez. El candado es transaccional: se suelta al cerrar la transacción, y
   * quien llegó segundo espera, ve lo que dejó el primero y no tiene nada que cambiar.
   */
  async lock(em: EntityManager): Promise<void> {
    await this.q(
      em,
      `select pg_advisory_xact_lock(hashtextextended('data_catalog.inventory_import', 0))`,
    );
  }

  /** Todo lo que la base ya sabe, para que `planImport` lo compare con los archivos. */
  async known(em: EntityManager): Promise<KnownInventory> {
    const operaciones = await this.q<
      {
        id: string;
        operation_key: string;
        observation_status: string;
        technical_hash: string | null;
      }[]
    >(
      em,
      'select id, operation_key, observation_status, technical_hash from data_catalog.catalog_operations',
    );
    const objetos = await this.q<
      { id: string; schema_name: string; object_name: string }[]
    >(
      em,
      'select id, schema_name, object_name from data_catalog.catalog_objects where source_code = ?',
      [SOURCE_CODE],
    );
    const procesos = await this.q<
      {
        id: string;
        process_code: string;
        kind: string;
        name: string;
        module_code: string | null;
        purpose: string | null;
      }[]
    >(
      em,
      'select id, process_code, kind, name, module_code, purpose from data_catalog.catalog_processes',
    );
    const etapas = await this.q<
      {
        id: string;
        process_id: string;
        ordinal: number;
        step_code: string;
        name: string;
      }[]
    >(
      em,
      'select id, process_id, ordinal, step_code, name from data_catalog.catalog_process_steps order by process_id, ordinal',
    );
    const puentes = await this.q<{ step_id: string; operation_id: string }[]>(
      em,
      'select step_id, operation_id from data_catalog.catalog_process_step_operations order by step_id, ordinal',
    );

    const operacionesPorId = new Map<string, KnownOperation>(
      operaciones.map((o) => [
        o.operation_key,
        {
          id: o.id,
          observationStatus: o.observation_status,
          technicalHash: o.technical_hash,
        },
      ]),
    );
    const idsPorEtapa = new Map<string, string[]>();
    for (const p of puentes)
      idsPorEtapa.set(p.step_id, [
        ...(idsPorEtapa.get(p.step_id) ?? []),
        p.operation_id,
      ]);
    const procesosPorCodigo = new Map<string, KnownProcess>(
      procesos.map((p) => [
        p.process_code,
        {
          id: p.id,
          kind: p.kind,
          name: p.name,
          moduleCode: p.module_code,
          purpose: p.purpose,
          steps: [],
        },
      ]),
    );
    const procesoPorId = new Map(
      [...procesosPorCodigo.values()].map((p) => [p.id, p]),
    );
    for (const e of etapas)
      procesoPorId.get(e.process_id)?.steps.push({
        ordinal: e.ordinal,
        stepCode: e.step_code,
        name: e.name,
        operationIds: idsPorEtapa.get(e.id) ?? [],
      });
    return {
      operations: operacionesPorId,
      objects: new Map(
        objetos.map((o) => [`${o.schema_name}.${o.object_name}`, o.id]),
      ),
      processes: procesosPorCodigo,
    };
  }

  // ---- operaciones -----------------------------------------------------------------------

  async insertOperations(
    em: EntityManager,
    filas: readonly OperationRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `insert into data_catalog.catalog_operations (id, source_code, operation_key, http_method, route_template, module_code,
           controller_name, handler_name, source_ref, is_public, required_roles, risk_level, observation_status, technical_hash,
           first_seen_at, last_seen_at, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         select r.id, r.source_code, r.operation_key, r.http_method, r.route_template, r.module_code, r.controller_name,
                r.handler_name, r.source_ref, r.is_public, r.required_roles, r.risk_level, '${OBSERVED}', r.hash, ?, ?, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, source_code text, operation_key text, http_method text, route_template text,
                module_code text, controller_name text, handler_name text, source_ref text, is_public boolean, required_roles jsonb,
                risk_level text, hash text)`,
        [t, t, t, t, userId, userId, JSON.stringify(lote.map(operacion))],
      );
  }

  /** Cambia una operación ya conocida; la reaparecida vuelve a `OBSERVED`. Sube `row_version`. */
  async updateOperations(
    em: EntityManager,
    filas: readonly OperationRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `update data_catalog.catalog_operations o set source_code = r.source_code, http_method = r.http_method,
                route_template = r.route_template, module_code = r.module_code, controller_name = r.controller_name,
                handler_name = r.handler_name, source_ref = r.source_ref, is_public = r.is_public, required_roles = r.required_roles,
                risk_level = r.risk_level, observation_status = '${OBSERVED}', technical_hash = r.hash, last_seen_at = ?,
                updated_at = ?, updated_by_user_id = ?, row_version = o.row_version + 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, source_code text, operation_key text, http_method text, route_template text,
                module_code text, controller_name text, handler_name text, source_ref text, is_public boolean, required_roles jsonb,
                risk_level text, hash text)
          where o.id = r.id`,
        [t, t, userId, JSON.stringify(lote.map(operacion))],
      );
  }

  /** Una operación que dejó de aparecer queda `NOT_OBSERVED`; no se borra, para no perder su historia. */
  async retireOperations(
    em: EntityManager,
    ids: readonly string[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(ids))
      await this.q(
        em,
        `update data_catalog.catalog_operations set observation_status = '${NOT_OBSERVED}', updated_at = ?, updated_by_user_id = ?,
                row_version = row_version + 1
          where id in (select jsonb_array_elements_text(?::jsonb)::uuid)`,
        [t, userId, JSON.stringify(lote)],
      );
  }

  // ---- impactos --------------------------------------------------------------------------

  async deleteImpactsOf(
    em: EntityManager,
    operationIds: readonly string[],
  ): Promise<void> {
    for (const lote of lotes(operationIds))
      await this.q(
        em,
        `delete from data_catalog.catalog_operation_impacts
          where operation_id in (select jsonb_array_elements_text(?::jsonb)::uuid)`,
        [JSON.stringify(lote)],
      );
  }

  async insertImpacts(
    em: EntityManager,
    filas: readonly ImpactRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `insert into data_catalog.catalog_operation_impacts (id, operation_id, object_id, access_kind, access_detail, confidence,
           call_path, source_ref, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         select gen_random_uuid(), r.operation_id, r.object_id, r.access_kind, r.access_detail, r.confidence, r.call_path,
                r.source_ref, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(operation_id uuid, object_id uuid, access_kind text, access_detail text,
                confidence text, call_path jsonb, source_ref text)`,
        [
          t,
          t,
          userId,
          userId,
          JSON.stringify(
            lote.map((i) => ({
              operation_id: i.operationId,
              object_id: i.objectId,
              access_kind: i.accessKind,
              access_detail: i.accessDetail,
              confidence: i.confidence,
              call_path: i.callPath,
              source_ref: i.sourceRef,
            })),
          ),
        ],
      );
  }

  // ---- procesos, etapas y puente ---------------------------------------------------------

  async insertProcesses(
    em: EntityManager,
    filas: readonly ProcessRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `insert into data_catalog.catalog_processes (id, process_code, kind, name, module_code, purpose, created_at, updated_at,
           created_by_user_id, updated_by_user_id, row_version)
         select r.id, r.process_code, r.kind, r.name, r.module_code, r.purpose, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, process_code text, kind text, name text, module_code text, purpose text)`,
        [t, t, userId, userId, JSON.stringify(lote.map(proceso))],
      );
  }

  async updateProcesses(
    em: EntityManager,
    filas: readonly ProcessRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `update data_catalog.catalog_processes p set kind = r.kind, name = r.name, module_code = r.module_code, purpose = r.purpose,
                updated_at = ?, updated_by_user_id = ?, row_version = p.row_version + 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, process_code text, kind text, name text, module_code text, purpose text)
          where p.id = r.id`,
        [t, userId, JSON.stringify(lote.map(proceso))],
      );
  }

  /** Borra las etapas de estos procesos y, antes, su puente: la FK no tiene CASCADE. */
  async deleteStepsOf(
    em: EntityManager,
    processIds: readonly string[],
  ): Promise<void> {
    for (const lote of lotes(processIds)) {
      const ids = JSON.stringify(lote);
      await this.q(
        em,
        `delete from data_catalog.catalog_process_step_operations
          where step_id in (select s.id from data_catalog.catalog_process_steps s
                             where s.process_id in (select jsonb_array_elements_text(?::jsonb)::uuid))`,
        [ids],
      );
      await this.q(
        em,
        `delete from data_catalog.catalog_process_steps
          where process_id in (select jsonb_array_elements_text(?::jsonb)::uuid)`,
        [ids],
      );
    }
  }

  async insertSteps(
    em: EntityManager,
    filas: readonly StepRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `insert into data_catalog.catalog_process_steps (id, process_id, ordinal, step_code, name, created_at, updated_at,
           created_by_user_id, updated_by_user_id, row_version)
         select r.id, r.process_id, r.ordinal, r.step_code, r.name, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, process_id uuid, ordinal int, step_code text, name text)`,
        [
          t,
          t,
          userId,
          userId,
          JSON.stringify(
            lote.map((s) => ({
              id: s.id,
              process_id: s.processId,
              ordinal: s.ordinal,
              step_code: s.stepCode,
              name: s.name,
            })),
          ),
        ],
      );
  }

  async insertStepOperations(
    em: EntityManager,
    filas: readonly StepOperationRow[],
    userId: string | null,
  ): Promise<void> {
    const t = ahora();
    for (const lote of lotes(filas))
      await this.q(
        em,
        `insert into data_catalog.catalog_process_step_operations (id, step_id, operation_id, ordinal, created_at, updated_at,
           created_by_user_id, updated_by_user_id, row_version)
         select r.id, r.step_id, r.operation_id, r.ordinal, ?, ?, ?, ?, 1
           from jsonb_to_recordset(?::jsonb) as r(id uuid, step_id uuid, operation_id uuid, ordinal int)`,
        [
          t,
          t,
          userId,
          userId,
          JSON.stringify(
            lote.map((o) => ({
              id: o.id,
              step_id: o.stepId,
              operation_id: o.operationId,
              ordinal: o.ordinal,
            })),
          ),
        ],
      );
  }
}

const operacion = (o: OperationRow) => ({
  id: o.id,
  source_code: o.sourceCode,
  operation_key: o.operationKey,
  http_method: o.httpMethod,
  route_template: o.routeTemplate,
  module_code: o.moduleCode,
  controller_name: o.controllerName,
  handler_name: o.handlerName,
  source_ref: o.sourceRef,
  is_public: o.isPublic,
  required_roles: o.requiredRoles,
  risk_level: o.riskLevel,
  hash: o.technicalHash,
});

const proceso = (p: ProcessRow) => ({
  id: p.id,
  process_code: p.processCode,
  kind: p.kind,
  name: p.name,
  module_code: p.moduleCode,
  purpose: p.purpose,
});
