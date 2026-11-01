import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../../common';
import {
  coincide,
  compararClaves,
  paginar,
} from '../../../data_catalog/application/paginacion';
import { DEFAULT_PAGE_SIZE } from '../../../data_catalog/data_catalog.constants';
import type {
  ListMutabilityQueryDto,
  MutabilityDetailDto,
  MutabilityItemDto,
  MutabilityPageDto,
  MutabilitySummaryDto,
} from '../dto/mutability.dto';
import catalogJson from '../data/mutability.catalog.json';
import {
  DISPOSITIONS,
  EVIDENCE_LEVELS,
  LEGAL_HOLD_STATES,
  WRITE_MODES,
  tableKey,
  type MutabilityCatalog,
  type MutabilityRecord,
} from '../mutability.types';
import { MutabilityRegistryReader } from './mutability-registry.reader';

/**
 * Lectura del catálogo de mutabilidad generado por el extractor. El catálogo es un dato versionado
 * en el repositorio (no se lee el repo del modelo en ejecución); el estado del registro en base
 * (`system_ops.entity_registry`) se consulta aparte para decir si cada tabla ya está registrada.
 */
@Injectable()
export class MutabilityCatalogService {
  private readonly catalog = catalogJson as unknown as MutabilityCatalog;
  private readonly byKey = new Map<string, MutabilityRecord>(
    this.catalog.records.map((r) => [tableKey(r.schema, r.table), r]),
  );

  constructor(private readonly registry: MutabilityRegistryReader) {}

  /** Registro de una tabla, o `undefined` si el catálogo no la conoce. */
  find(schema: string, table: string): MutabilityRecord | undefined {
    return this.byKey.get(tableKey(schema, table));
  }

  /** Todos los registros (sólo lectura). */
  all(): readonly MutabilityRecord[] {
    return this.catalog.records;
  }

  async list(query: ListMutabilityQueryDto): Promise<MutabilityPageDto> {
    const registered = await this.registeredKeys();
    const filtered = this.catalog.records
      .filter((r) => !query.schema || r.schema === query.schema)
      .filter((r) => !query.writeMode || r.writeMode === query.writeMode)
      .filter((r) => !query.evidence || r.writeModeLevel === query.evidence)
      .filter((r) => !query.disposition || r.disposition === query.disposition)
      .filter((r) => !query.legalHold || r.legalHold === query.legalHold)
      .filter((r) => !query.database || r.database === query.database)
      .filter((r) => matchesFinding(r, query.finding))
      .filter((r) => coincide(query.q, r.schema, r.table));
    const page = paginar(filtered, (r) => tableKey(r.schema, r.table), {
      cursor: query.cursor,
      limit: query.limit ?? DEFAULT_PAGE_SIZE,
    });
    return {
      items: page.items.map((r) => toItem(r, registered)),
      nextCursor: page.nextCursor,
      limit: page.limit,
      total: page.total,
    };
  }

  async detail(schema: string, table: string): Promise<MutabilityDetailDto> {
    const record = this.find(schema, table);
    if (!record)
      throw new ResourceNotFoundException(
        'La tabla no está en el catálogo de mutabilidad',
        { schema, table },
      );
    const registered = await this.registeredKeys();
    return {
      ...toItem(record, registered),
      evidence: record.evidence,
      findings: record.findings,
    };
  }

  async summary(): Promise<MutabilitySummaryDto> {
    const records = this.catalog.records;
    const total = records.length;
    const registered = await this.registeredKeys();
    const ratio = (numerator: number) => ({ numerator, denominator: total });
    const count = (pred: (r: MutabilityRecord) => boolean) =>
      records.filter(pred).length;

    const codes = new Map<
      string,
      { kind: 'CONTRADICTION' | 'GAP'; findings: number; tables: Set<string> }
    >();
    for (const r of records)
      for (const f of r.findings) {
        const entry = codes.get(f.code) ?? {
          kind: f.kind,
          findings: 0,
          tables: new Set<string>(),
        };
        entry.findings += 1;
        entry.tables.add(tableKey(r.schema, r.table));
        codes.set(f.code, entry);
      }

    return {
      totalTables: total,
      byWriteMode: WRITE_MODES.map((writeMode) => {
        const rows = records.filter((r) => r.writeMode === writeMode);
        const byEvidence: Record<string, number> = {};
        for (const level of EVIDENCE_LEVELS) {
          const n = rows.filter((r) => r.writeModeLevel === level).length;
          if (n > 0) byEvidence[level] = n;
        }
        return { writeMode, ...ratio(rows.length), byEvidence };
      }),
      byEvidence: EVIDENCE_LEVELS.map((level) => ({
        level,
        ...ratio(count((r) => r.writeModeLevel === level)),
      })),
      decided: ratio(count((r) => r.writeMode !== 'UNKNOWN')),
      enforcedByDatabase: ratio(
        count((r) => r.writeModeLevel === 'ENFORCED_DB'),
      ),
      withContradictions: ratio(
        count((r) => r.findings.some((f) => f.kind === 'CONTRADICTION')),
      ),
      withGaps: ratio(count((r) => r.findings.some((f) => f.kind === 'GAP'))),
      findingCodes: [...codes.entries()]
        .map(([code, v]) => ({
          code,
          kind: v.kind,
          findings: v.findings,
          tables: v.tables.size,
        }))
        .sort(
          (a, b) =>
            (a.kind === b.kind ? 0 : a.kind === 'CONTRADICTION' ? -1 : 1) ||
            b.tables - a.tables ||
            compararClaves(a.code, b.code),
        ),
      disposition: DISPOSITIONS.map((disposition) => ({
        disposition,
        ...ratio(count((r) => r.disposition === disposition)),
      })),
      legalHold: LEGAL_HOLD_STATES.map((legalHold) => ({
        legalHold,
        ...ratio(count((r) => r.legalHold === legalHold)),
      })),
      withDeclaredPeriod: count((r) => r.retention?.days != null),
      pendingCompliance: count((r) => r.retention !== null),
      registered: registered
        ? ratio(count((r) => registered.has(tableKey(r.schema, r.table))))
        : null,
      sources: this.catalog.sources,
      generatedFrom: this.catalog.generatedFrom,
    };
  }

  /** Claves registradas, o `null` si no se pudo consultar (la lectura no falla por eso). */
  private async registeredKeys(): Promise<Set<string> | null> {
    return this.registry.registeredKeys();
  }
}

function matchesFinding(
  r: MutabilityRecord,
  filter: ListMutabilityQueryDto['finding'],
): boolean {
  if (!filter) return true;
  if (filter === 'NONE') return r.findings.length === 0;
  if (filter === 'ANY') return r.findings.length > 0;
  return r.findings.some((f) => f.kind === filter);
}

function toItem(
  r: MutabilityRecord,
  registered: Set<string> | null,
): MutabilityItemDto {
  return {
    schema: r.schema,
    table: r.table,
    database: r.database,
    writeMode: r.writeMode,
    writeModeLevel: r.writeModeLevel,
    disposition: r.disposition,
    dispositionLevel: r.dispositionLevel,
    retention: r.retention,
    legalHold: r.legalHold,
    legalHoldLevel: r.legalHoldLevel,
    contradictions: r.findings.filter((f) => f.kind === 'CONTRADICTION').length,
    gaps: r.findings.filter((f) => f.kind === 'GAP').length,
    registered: registered ? registered.has(tableKey(r.schema, r.table)) : null,
  };
}
