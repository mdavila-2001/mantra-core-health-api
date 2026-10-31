import { createHash } from 'node:crypto';

import { messageFor } from './clinical-import.messages';
import {
  NON_CONTENT_COLUMNS,
  conceptGroups,
  type KindSpec,
} from './clinical-import.schema';
import type {
  ConceptResolverPort,
  FieldIssue,
  ImportDeclaration,
  ParsedRow,
  PatientResolverPort,
  PractitionerResolverPort,
  ResolvedRecord,
} from './clinical-import.types';

/* ============================================================================
    Capa 2: de una fila válida de forma a un registro resuelto (o un rechazo).

    Se usa dos veces con la misma lógica: en la vista previa (para rechazar ya
    lo que no se puede enlazar) y al escribir (la autoridad: entre la vista
    previa y la confirmación el padrón y la terminología pueden haber cambiado).

    Un puerto que LANZA no es un rechazo de la fila: es un fallo del
    colaborador. La vista previa lo traduce a `RESOLUTION_UNAVAILABLE`; el
    ejecutor deja que el error suba para reintentarlo.
    ========================================================================== */

export interface EvaluatorPorts {
  readonly patients: PatientResolverPort;
  readonly codes: ConceptResolverPort;
  readonly practitioners: PractitionerResolverPort;
}

export interface EvaluationContext {
  readonly tenantId: string;
  readonly batchId: string;
  readonly importedByUserId: string;
  readonly declaration: ImportDeclaration;
}

export type Evaluation =
  | { readonly ok: true; readonly record: ResolvedRecord }
  | { readonly ok: false; readonly issues: readonly FieldIssue[] };

const issue = (field: string, code: string): FieldIssue => ({
  field,
  code,
  message: messageFor(code),
});

const sha256 = (text: string): string =>
  createHash('sha256').update(text).digest('hex');

/** Serialización canónica (claves ordenadas): la misma fila da siempre la misma huella. */
function canonical(values: Readonly<Record<string, string>>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(values).sort(([a], [b]) => (a < b ? -1 : 1)),
    ),
  );
}

export async function evaluateRow(
  spec: KindSpec,
  row: ParsedRow,
  ports: EvaluatorPorts,
  context: EvaluationContext,
): Promise<Evaluation> {
  const v = row.values;
  const issues: FieldIssue[] = [];

  const patient = await ports.patients.resolve({
    tenantId: context.tenantId,
    documentNumber: v['documentNumber'] ?? '',
    birthDate: v['birthDate'] ?? '',
  });
  let patientProfileId = '';
  if (patient.status === 'NOT_FOUND')
    issues.push(issue('documentNumber', 'PATIENT_NOT_FOUND'));
  else if (patient.status === 'AMBIGUOUS')
    issues.push(issue('documentNumber', 'PATIENT_AMBIGUOUS'));
  else if (patient.consentRevoked)
    issues.push(issue('documentNumber', 'CONSENT_REVOKED'));
  else patientProfileId = patient.patientProfileId;

  const concepts: Record<string, string> = {};
  for (const group of conceptGroups(spec)) {
    const system = v[group.systemField] ?? '';
    const code = v[group.codeField] ?? '';
    if (system === '' && code === '') continue;
    const found = await ports.codes.resolve({
      tenantId: context.tenantId,
      system,
      code,
    });
    if (found.status === 'FOUND') concepts[group.group] = found.conceptId;
    else
      issues.push(
        issue(
          group.codeField,
          found.status === 'AMBIGUOUS' ? 'CODE_AMBIGUOUS' : 'CODE_NOT_FOUND',
        ),
      );
  }

  let practitionerProfileId: string | undefined;
  const license = v['authorLicenseNumber'] ?? '';
  if (license !== '') {
    const found = await ports.practitioners.resolveByLicense({
      tenantId: context.tenantId,
      licenseNumber: license,
    });
    if (found.status === 'FOUND')
      practitionerProfileId = found.practitionerProfileId;
    else
      issues.push(
        issue(
          'authorLicenseNumber',
          found.status === 'AMBIGUOUS'
            ? 'PRACTITIONER_AMBIGUOUS'
            : 'PRACTITIONER_NOT_FOUND',
        ),
      );
  }

  if (issues.length > 0) return { ok: false, issues };

  const values = Object.fromEntries(
    Object.entries(v).filter(([name, value]) => {
      const column = spec.columns.find((c) => c.name === name);
      return (
        column !== undefined &&
        column.concept === undefined &&
        !NON_CONTENT_COLUMNS.has(name) &&
        value !== ''
      );
    }),
  );
  const sourceRecordId = v['sourceRecordId'] ?? '';
  // La identidad del registro es (tenant, tipo, paciente, origen, id en origen). El contenido no entra:
  // si cambia, es el MISMO registro con otro contenido (conflicto), no uno nuevo.
  const dedupeKey = sha256(
    [
      context.tenantId,
      spec.kind,
      patientProfileId,
      context.declaration.sourceOrganization.trim().toLowerCase(),
      sourceRecordId,
    ].join('|'),
  );
  const contentHash = sha256(
    canonical({
      ...values,
      ...Object.fromEntries(
        Object.entries(concepts).map(([g, id]) => [`#${g}`, id]),
      ),
    }),
  );

  return {
    ok: true,
    record: {
      kind: spec.kind,
      tenantId: context.tenantId,
      patientProfileId,
      concepts,
      ...(practitionerProfileId === undefined ? {} : { practitionerProfileId }),
      values,
      provenance: {
        sourceOrganization: context.declaration.sourceOrganization.trim(),
        sourceRecordId,
        batchId: context.batchId,
        legalBasis: context.declaration.legalBasis.trim(),
        loadedAt: context.declaration.loadedAt,
        importedByUserId: context.importedByUserId,
      },
      dedupeKey,
      contentHash,
    },
  };
}
