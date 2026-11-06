import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { BULK_IMPORT_LIMITS, RowOutcome } from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import type { ParsedSource } from '../parsing/source-parser';
import {
  BULK_IMPORT_CODE_RESOLVER,
  BULK_IMPORT_PATIENT_RESOLVER,
  type CodeResolverPort,
  type PatientResolution,
  type PatientResolverPort,
  type ReportRow,
  type RowIssue,
  type StoredRow,
} from '../ports/bulk-import.ports';
import { codedPairs } from '../schema/clinical-kinds';
import {
  uniqueKeyValue,
  validateRowAgainstSchema,
  type FieldIssue,
  type KindSchema,
  type NormalizedRow,
} from '../schema/field-schema';
import { REASON_MESSAGES } from './row-messages';

/** Caché de pacientes dentro de un lote. */
export type PatientCache = Map<string, PatientResolution | 'ERROR'>;

/** Resultado de validar un archivo entero. */
export interface ValidationOutcome {
  readonly fileIssues: readonly FieldIssue[];
  /** Filas que pasaron todo; las únicas que se procesan. */
  readonly validRows: readonly StoredRow[];
  /** Primeros hallazgos (tope de vista previa). */
  readonly previewIssues: readonly RowIssue[];
  /** Total de hallazgos. */
  readonly issuesTotal: number;
  /** Filas rechazadas, para el informe. */
  readonly rejectedRows: readonly ReportRow[];
  readonly total: number;
}

/** Hash SHA-256 en hexadecimal. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Clave estable de una fila: tenant + tipo + primera clave única. */
export function rowKeyOf(
  tenantId: string,
  schema: KindSchema,
  row: NormalizedRow,
): string {
  const key = uniqueKeyValue(row, schema.uniqueKeys[0] ?? []) ?? '';
  return sha256Hex(`${tenantId}\u0000${schema.kind}\u0000${key}`);
}

function issueFor(field: string, code: BulkImportReason): FieldIssue {
  return { field, code, message: REASON_MESSAGES[code] };
}

/**
 * Valida un archivo contra el esquema de su tipo: estructura de cada fila
 * (lista blanca, obligatorias, formato), unicidad dentro del archivo y, en
 * historia clínica, la resolución referencial (paciente y códigos).
 *
 * Dos capas, a propósito:
 * 1. **Estructural** — sólo depende del esquema; es determinista y es la que
 *    garantiza que «una fila de la plantilla siempre pasa».
 * 2. **Referencial** — consulta colaboradores (padrón de pacientes,
 *    terminología). Depende del estado de esos datos, así que se repite al
 *    procesar y no se hereda de la vista previa.
 */
@Injectable()
export class BulkImportValidationService {
  constructor(
    @Inject(BULK_IMPORT_PATIENT_RESOLVER)
    private readonly patients: PatientResolverPort,
    @Inject(BULK_IMPORT_CODE_RESOLVER)
    private readonly codes: CodeResolverPort,
  ) {}

  async validate(
    tenantId: string,
    schema: KindSchema,
    parsed: ParsedSource,
  ): Promise<ValidationOutcome> {
    if (parsed.fileIssues.length > 0) {
      return {
        fileIssues: parsed.fileIssues,
        validRows: [],
        previewIssues: [],
        issuesTotal: parsed.fileIssues.length,
        rejectedRows: [],
        total: parsed.rows.length,
      };
    }

    const seen = schema.uniqueKeys.map(() => new Set<string>());
    const validRows: StoredRow[] = [];
    const rejectedRows: ReportRow[] = [];
    const previewIssues: RowIssue[] = [];
    let issuesTotal = 0;
    const patientCache: PatientCache = new Map();
    const codeCache = new Map<string, string>();

    const reject = (row: number, issues: FieldIssue[]): void => {
      issuesTotal += issues.length;
      for (const found of issues) {
        if (previewIssues.length < BULK_IMPORT_LIMITS.maxPreviewIssues) {
          previewIssues.push({ row, ...found });
        }
      }
      rejectedRows.push({
        row,
        outcome: RowOutcome.REJECTED,
        reason: issues[0].code,
        field: issues[0].field,
      });
    };

    for (const raw of parsed.rows) {
      if (raw.shapeIssue) {
        reject(raw.row, [raw.shapeIssue]);
        continue;
      }
      const { row, issues } = validateRowAgainstSchema(schema, raw.values);
      if (issues.length === 0) {
        schema.uniqueKeys.forEach((columns, index) => {
          const key = uniqueKeyValue(row, columns);
          if (key === null) return;
          if (seen[index].has(key)) {
            issues.push(
              issueFor(columns[0], BulkImportReason.DUPLICATE_IN_FILE),
            );
          } else {
            seen[index].add(key);
          }
        });
      }
      if (issues.length === 0 && schema.group === 'CLINICAL') {
        issues.push(
          ...(await this.resolveReferences(
            tenantId,
            schema,
            row,
            patientCache,
            codeCache,
          )),
        );
      }
      if (issues.length > 0) {
        reject(raw.row, issues);
        continue;
      }
      validRows.push({
        row: raw.row,
        data: row,
        rowKey: rowKeyOf(tenantId, schema, row),
      });
    }

    return {
      fileIssues: [],
      validRows,
      previewIssues,
      issuesTotal,
      rejectedRows,
      total: parsed.rows.length,
    };
  }

  /** Resolución referencial de una fila clínica (vista previa): sólo los hallazgos. */
  async resolveReferences(
    tenantId: string,
    schema: KindSchema,
    row: NormalizedRow,
    patientCache: PatientCache = new Map(),
    codeCache: Map<string, string> = new Map(),
  ): Promise<FieldIssue[]> {
    return (
      await this.resolveForWrite(tenantId, schema, row, patientCache, codeCache)
    ).issues;
  }

  /**
   * Resuelve paciente, consentimiento y códigos de una fila clínica, y entrega
   * lo que el escritor necesita (`patientProfileId`, `concepts`). La usan la
   * vista previa (sólo mira `issues`) y el procesamiento (que no hereda nada de
   * la vista previa: el padrón y la terminología pueden haber cambiado).
   */
  async resolveForWrite(
    tenantId: string,
    schema: KindSchema,
    row: NormalizedRow,
    patientCache: PatientCache = new Map(),
    codeCache: Map<string, string> = new Map(),
  ): Promise<{
    issues: FieldIssue[];
    patientProfileId?: string;
    concepts: Record<string, string>;
  }> {
    const issues: FieldIssue[] = [];
    const concepts: Record<string, string> = {};
    let patientProfileId: string | undefined;
    const patient = await this.resolvePatient(tenantId, row, patientCache);
    if (patient === 'ERROR') {
      issues.push(
        issueFor('nationalId', BulkImportReason.RESOLUTION_UNAVAILABLE),
      );
    } else if (patient.status === 'NOT_FOUND') {
      issues.push(issueFor('nationalId', BulkImportReason.PATIENT_NOT_FOUND));
    } else if (patient.status === 'AMBIGUOUS') {
      issues.push(issueFor('nationalId', BulkImportReason.PATIENT_AMBIGUOUS));
    } else if (patient.consentRevoked) {
      issues.push(issueFor('nationalId', BulkImportReason.CONSENT_REVOKED));
    } else {
      patientProfileId = patient.patientProfileId;
    }

    for (const pair of codedPairs(schema)) {
      const system = row[pair.system];
      const code = row[pair.code];
      if (system === undefined || code === undefined) continue;
      const key = `${system}\u0001${code}`;
      let verdict = codeCache.get(key);
      if (verdict === undefined) {
        verdict = await this.resolveCode(system, code);
        codeCache.set(key, verdict);
      }
      if (verdict === 'NOT_FOUND') {
        issues.push(issueFor(pair.code, BulkImportReason.CODE_NOT_FOUND));
      } else if (verdict === 'AMBIGUOUS') {
        issues.push(issueFor(pair.code, BulkImportReason.CODE_AMBIGUOUS));
      } else if (verdict === 'ERROR') {
        issues.push(
          issueFor(pair.code, BulkImportReason.RESOLUTION_UNAVAILABLE),
        );
      } else {
        concepts[pair.label] = verdict;
      }
    }
    return { issues, patientProfileId, concepts };
  }

  /** Paciente de una fila, con caché por documento + fecha dentro del lote. */
  async resolvePatient(
    tenantId: string,
    row: NormalizedRow,
    cache: PatientCache = new Map(),
  ): Promise<PatientResolution | 'ERROR'> {
    const key = `${row.nationalId}\u0001${row.birthDate}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    let result: PatientResolution | 'ERROR';
    try {
      result = await this.patients.resolve(
        tenantId,
        row.nationalId,
        row.birthDate,
      );
    } catch {
      result = 'ERROR';
    }
    cache.set(key, result);
    return result;
  }

  /** `conceptId` si resuelve; `NOT_FOUND`/`AMBIGUOUS`/`ERROR` si no. */
  private async resolveCode(system: string, code: string): Promise<string> {
    try {
      const found = await this.codes.resolve(system, code);
      return found.status === 'FOUND' ? found.conceptId : found.status;
    } catch {
      return 'ERROR';
    }
  }
}
