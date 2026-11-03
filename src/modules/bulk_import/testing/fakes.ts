import { randomUUID } from 'node:crypto';
import { BulkImportReason } from '../bulk-import.error-reasons';
import type {
  AppendClinicalInput,
  AppendClinicalResult,
  BulkImportAccessPolicyPort,
  BulkImportAuditEvent,
  BulkImportAuditPort,
  ClinicalRecordWriterPort,
  CodeResolution,
  CodeResolverPort,
  PatientResolution,
  PatientResolverPort,
  ProvisionUserInput,
  ProvisionUserResult,
  UserProvisionerPort,
} from '../ports/bulk-import.ports';
import type { BulkImportPermission } from '../bulk-import.constants';
import type { AuthenticatedUser } from '../../../common';

/**
 * ⚠️ DOBLES DECLARADOS de los colaboradores del motor (regla 65).
 *
 * Sirven para ejercitar el motor en los tres niveles del contrato (correcto,
 * límite, inválido) sin esperar a los adaptadores reales. **Nada de lo que pasa
 * contra estos dobles es evidencia del colaborador real.** Los datos son
 * sintéticos y los dobles viven en `testing/`, fuera del grafo de inyección del
 * módulo.
 */

/** Padrón de pacientes en memoria: documento + nacimiento → perfiles. */
export class FakePatientResolver implements PatientResolverPort {
  private readonly patients = new Map<
    string,
    { id: string; revoked: boolean }[]
  >();
  public calls = 0;
  public failWith: Error | null = null;

  add(nationalId: string, birthDate: string, revoked = false): string {
    const id = randomUUID();
    const key = `${nationalId}|${birthDate}`;
    this.patients.set(key, [
      ...(this.patients.get(key) ?? []),
      { id, revoked },
    ]);
    return id;
  }

  resolve(
    _tenantId: string,
    nationalId: string,
    birthDate: string,
  ): Promise<PatientResolution> {
    this.calls += 1;
    if (this.failWith) return Promise.reject(this.failWith);
    const found = this.patients.get(`${nationalId}|${birthDate}`) ?? [];
    if (found.length === 0) return Promise.resolve({ status: 'NOT_FOUND' });
    if (found.length > 1) return Promise.resolve({ status: 'AMBIGUOUS' });
    return Promise.resolve({
      status: 'FOUND',
      patientProfileId: found[0].id,
      consentRevoked: found[0].revoked,
    });
  }
}

/** Terminología en memoria: `(sistema, código)` → conceptos. */
export class FakeCodeResolver implements CodeResolverPort {
  private readonly concepts = new Map<string, string[]>();
  public failWith: Error | null = null;

  add(system: string, code: string, copies = 1): void {
    this.concepts.set(
      `${system}|${code}`,
      Array.from({ length: copies }, () => randomUUID()),
    );
  }

  resolve(system: string, code: string): Promise<CodeResolution> {
    if (this.failWith) return Promise.reject(this.failWith);
    const found = this.concepts.get(`${system}|${code}`) ?? [];
    if (found.length === 0) return Promise.resolve({ status: 'NOT_FOUND' });
    if (found.length > 1) return Promise.resolve({ status: 'AMBIGUOUS' });
    return Promise.resolve({ status: 'FOUND', conceptId: found[0] });
  }
}

/** Alta de usuarios en memoria: idempotente por correo y por `rowKey`. */
export class FakeUserProvisioner implements UserProvisionerPort {
  public readonly created: ProvisionUserInput[] = [];
  private readonly emails = new Set<string>();
  private readonly rowKeys = new Set<string>();
  public failOnEmails = new Set<string>();
  public hangOnEmails = new Set<string>();
  public delayMs = 0;

  async provision(input: ProvisionUserInput): Promise<ProvisionUserResult> {
    const email = (input.row.email ?? '').toLowerCase();
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.hangOnEmails.has(email)) await new Promise<void>(() => undefined);
    if (this.failOnEmails.has(email))
      throw new Error('fallo simulado del colaborador');
    if (this.rowKeys.has(input.rowKey) || this.emails.has(email)) {
      return { status: 'EXISTS' };
    }
    this.rowKeys.add(input.rowKey);
    this.emails.add(email);
    this.created.push(input);
    return { status: 'CREATED', userId: randomUUID() };
  }

  /** Simula un usuario que ya estaba registrado antes del lote. */
  preexisting(email: string): void {
    this.emails.add(email.toLowerCase());
  }
}

/** Escritor clínico en memoria con el contrato «sólo agrega». */
export class FakeClinicalWriter implements ClinicalRecordWriterPort {
  public readonly appended: AppendClinicalInput[] = [];
  private readonly store = new Map<string, string>();
  public failOnSourceIds = new Set<string>();

  /** Simula un registro ya cargado antes (`contentHash` decide duplicado vs. conflicto). */
  preexisting(
    patientProfileId: string,
    kind: string,
    sourceRecordId: string,
    contentHash: string,
  ): void {
    this.store.set(
      `${patientProfileId}|${kind}|${sourceRecordId}`,
      contentHash,
    );
  }

  append(input: AppendClinicalInput): Promise<AppendClinicalResult> {
    const sourceId = input.provenance.sourceRecordId;
    if (this.failOnSourceIds.has(sourceId)) {
      return Promise.reject(new Error('fallo simulado del colaborador'));
    }
    const key = `${input.patientProfileId}|${input.kind}|${sourceId}`;
    const existing = this.store.get(key);
    if (existing === undefined) {
      this.store.set(key, input.contentHash);
      this.appended.push(input);
      return Promise.resolve({ status: 'CREATED', recordId: randomUUID() });
    }
    return Promise.resolve({
      status: existing === input.contentHash ? 'DUPLICATE' : 'CONFLICT',
    });
  }
}

/** Política de acceso en memoria: permisos concedidos por usuario. */
export class FakeAccessPolicy implements BulkImportAccessPolicyPort {
  private readonly grants = new Set<string>();

  grant(userId: string, permission: BulkImportPermission): void {
    this.grants.add(`${userId}|${permission}`);
  }

  isAllowed(
    actor: AuthenticatedUser,
    _tenantId: string,
    permission: BulkImportPermission,
  ): Promise<boolean> {
    return Promise.resolve(this.grants.has(`${actor.id}|${permission}`));
  }
}

/** Auditoría en memoria. */
export class FakeAudit implements BulkImportAuditPort {
  public readonly events: BulkImportAuditEvent[] = [];

  record(event: BulkImportAuditEvent): Promise<void> {
    this.events.push(event);
    return Promise.resolve();
  }
}

/** Ejecutor que nunca escribe: lo que cablea el módulo mientras no haya adaptador real. */
export const NOT_CONNECTED = BulkImportReason.EXECUTOR_NOT_CONNECTED;
