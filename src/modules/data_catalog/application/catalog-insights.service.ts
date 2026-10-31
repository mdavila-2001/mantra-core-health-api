import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  SENSITIVITY_RANK,
  type Sensitivity,
} from '../domain/catalog/catalog.constants';
import {
  DEFAULT_MIN_PII_SENSITIVITY,
  QUALITY_RULES,
  QUALITY_SEVERITIES,
} from '../domain/catalog/governance-insights';
import { DEFAULT_PAGE_SIZE } from '../data_catalog.constants';
import { CatalogInsightsRepository } from '../infrastructure/repositories/catalog-insights.repository';
import type {
  PiiColumnsQueryDto,
  QualityIssuesQueryDto,
} from '../presentation/dto/insights.dto';

const CURSOR_INVALIDO = 'El cursor de paginación no es válido';

const esTexto = (v: unknown): v is string => typeof v === 'string';

/**
 * Lecturas de gobierno sobre el catálogo vivo: datos personales (por la clasificación del propio
 * catálogo, contrastada con el registro de `system_ops`) y calidad del catálogo. Ninguna escribe, y
 * ninguna devuelve valores de datos ni texto libre de las fichas: sólo nombres, tipos y estados.
 */
@Injectable()
export class CatalogInsightsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogInsightsRepository,
  ) {}

  private db(): EntityManager {
    return this.em.fork();
  }

  // ---- datos personales ------------------------------------------------------------------

  async piiSummary() {
    const em = this.db();
    const [niveles, totales, registro] = await Promise.all([
      this.repo.piiBySensitivity(em),
      this.repo.piiTotals(em),
      this.repo.registryTotals(em),
    ]);
    const notMeasured: { field: string; reason: string }[] = [];
    if (totales.observed_columns === 0)
      notMeasured.push({
        field: 'catalog',
        reason:
          'El catálogo no tiene columnas observadas: falta un escaneo (POST /admin/catalog/scans)',
      });
    if (registro.fields === 0)
      notMeasured.push({
        field: 'declaredRegistry.fields',
        reason:
          'system_ops.field_registry está vacío: ningún campo se declaró con POST /admin/governance/entity-registry; sólo existe la clasificación del catálogo',
      });
    notMeasured.push({
      field: 'dataValues',
      reason:
        'El catálogo clasifica por nombre y tipo de columna, sin leer valores: una columna sin clasificar no está garantizada libre de datos personales',
    });
    return {
      source:
        'data_catalog.catalog_annotations (clasificación automática y fichas curadas) y system_ops.entity_registry/field_registry (declarado)',
      observedColumns: totales.observed_columns,
      classifiedColumns: totales.classified_columns,
      personalColumns: totales.personal_columns,
      objectsWithPersonalColumns: totales.objects_with_personal,
      bySensitivity: [...niveles]
        .sort(
          (a, b) =>
            SENSITIVITY_RANK[b.sensitivity] - SENSITIVITY_RANK[a.sensitivity],
        )
        .map((n) => ({
          sensitivity: n.sensitivity,
          columns: n.columns,
          approved: n.approved,
          needsReview: n.needs_review,
          autoDetected: n.auto_detected,
          other: n.other,
        })),
      declaredRegistry: {
        entities: registro.entities,
        entitiesPersonal: registro.entities_personal,
        fields: registro.fields,
        fieldsPersonal: registro.fields_personal,
      },
      notMeasured,
    };
  }

  async piiColumns(q: PiiColumnsQueryDto) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const sort = q.sort ?? 'name';
    const minimo: Sensitivity = q.minSensitivity ?? DEFAULT_MIN_PII_SENSITIVITY;
    const filas = await this.repo.piiColumns(this.db(), {
      schema: q.schema,
      minRank: SENSITIVITY_RANK[minimo],
      sensitivity: q.sensitivity,
      reviewStatus: q.reviewStatus,
      q: q.q,
      sort,
      cursor: this.piiCursor(q.cursor, sort),
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => ({
        columnId: f.column_id,
        objectId: f.object_id,
        schemaName: f.schema_name,
        objectName: f.object_name,
        columnName: f.column_name,
        nativeType: f.native_type,
        sensitivity: f.sensitivity,
        reviewStatus: f.review_status,
        origin: f.origin,
        approved: f.approved === true,
        registryMarksPersonal: f.registry_marks_personal ?? null,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor(
              sort === 'sensitivity'
                ? {
                    m: 's',
                    rk: ultima.rk,
                    s: ultima.schema_name,
                    o: ultima.object_name,
                    c: ultima.column_name,
                  }
                : {
                    m: 'n',
                    s: ultima.schema_name,
                    o: ultima.object_name,
                    c: ultima.column_name,
                  },
            )
          : null,
      limit,
      sort,
    };
  }

  /** El cursor de un orden no sirve para el otro: se rechaza en vez de saltar filas en silencio. */
  private piiCursor(cursor: string | undefined, sort: 'name' | 'sensitivity') {
    if (!cursor) return undefined;
    const k = decodeKeysetCursor(cursor);
    const modo = sort === 'sensitivity' ? 's' : 'n';
    if (
      k.m !== modo ||
      !esTexto(k.s) ||
      !esTexto(k.o) ||
      !esTexto(k.c) ||
      (modo === 's' && typeof k.rk !== 'number')
    )
      throw new BadRequestException(CURSOR_INVALIDO);
    return {
      rk: modo === 's' ? (k.rk as number) : undefined,
      s: k.s,
      o: k.o,
      c: k.c,
    };
  }

  // ---- calidad del catálogo --------------------------------------------------------------

  async qualityRules() {
    const conteos = await this.repo.qualityCounts(this.db(), {});
    const abiertas = new Map(conteos.map((c) => [c.rule_code, c.issues]));
    return {
      rules: QUALITY_RULES.map((r) => ({
        ...r,
        openIssues: abiertas.get(r.code) ?? 0,
      })),
      notMeasured: [
        {
          field: 'dataValueQuality',
          reason:
            'Estas reglas miden la documentación y la clasificación del catálogo. No hay reglas sobre los valores (nulos, duplicados, formatos): el catálogo no lee filas y no existe una tabla de reglas de calidad de datos de plataforma',
        },
      ],
    };
  }

  async qualityIssues(q: QualityIssuesQueryDto) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const filtros = {
      rule: q.rule,
      severity: q.severity,
      schema: q.schema,
      q: q.q,
    };
    const em = this.db();
    const [filas, conteos] = await Promise.all([
      this.repo.qualityIssues(em, {
        ...filtros,
        cursor: this.qualityCursor(q.cursor),
        limit,
      }),
      this.repo.qualityCounts(em, filtros),
    ]);
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    const bySeverity: Record<string, number> = Object.fromEntries(
      QUALITY_SEVERITIES.map((s) => [s, 0]),
    );
    const byRule: Record<string, number> = Object.fromEntries(
      QUALITY_RULES.map((r) => [r.code, 0]),
    );
    for (const c of conteos) {
      bySeverity[c.severity] = (bySeverity[c.severity] ?? 0) + c.issues;
      byRule[c.rule_code] = (byRule[c.rule_code] ?? 0) + c.issues;
    }
    return {
      items: pagina.map((f) => ({
        ruleCode: f.rule_code,
        severity: f.severity,
        schemaName: f.schema_name,
        objectName: f.object_name,
        columnName: f.column_name,
        objectId: f.object_id,
        columnId: f.column_id,
        sensitivity: f.sensitivity,
        reviewStatus: f.review_status,
        affected: f.affected,
      })),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({
              r: ultima.rule_code,
              s: ultima.schema_name,
              o: ultima.object_name,
              c: ultima.column_name ?? '',
            })
          : null,
      limit,
      summary: {
        total: Object.values(bySeverity).reduce((a, b) => a + b, 0),
        bySeverity,
        byRule,
      },
      derived: true as const,
      notMeasured: [
        {
          field: 'resolutionState',
          reason:
            'Las incidencias se derivan al leer: no hay estado de resolución ni acción de cierre; desaparecen al corregir la ficha',
        },
      ],
    };
  }

  private qualityCursor(cursor: string | undefined) {
    if (!cursor) return undefined;
    const k = decodeKeysetCursor(cursor);
    if (!esTexto(k.r) || !esTexto(k.s) || !esTexto(k.o) || !esTexto(k.c))
      throw new BadRequestException(CURSOR_INVALIDO);
    return { r: k.r, s: k.s, o: k.o, c: k.c };
  }
}
