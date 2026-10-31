/**
 * Hechos de código sobre retención y legal hold que ninguna otra fuente captura: quién purga qué y
 * quién consulta los holds. Cada hecho cita el archivo y la línea, y `verifyCodeFact` comprueba que
 * esa línea sigue diciendo lo que se afirma: si el código se mueve, la prueba falla en vez de dejar
 * un hecho viejo presentado como vigente.
 */
import type { Disposition, LegalHoldState } from '../mutability.types';

export interface CodeFact {
  schema: string;
  table: string;
  /** Qué afirma el hecho. */
  kind: 'PURGE_PATH' | 'HOLD_RESOLVER' | 'DELETE_PATH';
  disposition?: Disposition;
  legalHold?: LegalHoldState;
  claim: string;
  /** Ruta relativa a la raíz de la API. */
  file: string;
  line: number;
  /** Texto que tiene que seguir apareciendo en esa línea. */
  contains: string;
}

/** Hechos curados. Se amplían leyendo el código, no por analogía. */
export const CODE_FACTS: CodeFact[] = [
  {
    schema: 'audit',
    table: 'data_access_log',
    kind: 'PURGE_PATH',
    disposition: 'PURGE_BY_RETENTION',
    claim:
      'El repositorio borra filas anteriores a una fecha de corte (purga por retención, UC-10-09); no hay UPDATE.',
    file: 'src/modules/audit/repositories/data-access-log.repository.ts',
    line: 163,
    contains: 'nativeDelete(DataAccessLog',
  },
  {
    schema: 'identity_assurance',
    table: 'identity_evidence_records',
    kind: 'DELETE_PATH',
    disposition: 'PURGE_BY_RETENTION',
    claim:
      'La disposición de evidencia de identidad borra la fila con SQL directo dentro de su ciclo RETENTION/PURGE.',
    file: 'src/modules/identity_assurance/repositories/identity-evidence-disposition.repository.ts',
    line: 124,
    contains: 'DELETE FROM identity_assurance.identity_evidence_records',
  },
  {
    schema: 'identity_assurance',
    table: 'identity_evidence_records',
    kind: 'HOLD_RESOLVER',
    legalHold: 'HOLD_AWARE',
    claim:
      'Un resolvedor único combina holds de sujeto, caso, evidencia, archivo, tabla y objeto antes de disponer.',
    file: 'src/modules/system_ops/services/identity-evidence-hold-resolver.service.ts',
    line: 30,
    contains:
      'One resolver combines subject/case/evidence/file/table/object holds',
  },
];

/**
 * Comprueba un hecho contra el archivo real.
 * @param readLine - Devuelve la línea `n` (1-based) de un archivo relativo a la raíz de la API, o `null`.
 */
export function verifyCodeFact(
  fact: CodeFact,
  readLine: (file: string, line: number) => string | null,
): { ok: boolean; found: string | null } {
  const found = readLine(fact.file, fact.line);
  return { ok: found !== null && found.includes(fact.contains), found };
}
