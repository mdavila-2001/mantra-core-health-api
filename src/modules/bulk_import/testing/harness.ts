import type { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import {
  BULK_IMPORT_PERMISSIONS,
  type BulkImportPermission,
} from '../bulk-import.constants';
import type { BulkImportEngineStatus } from '../bulk-import.engine-status';
import { InMemoryBatchRepository } from '../repositories/in-memory-batch.repository';
import {
  BulkImportProcessor,
  type ProcessorTimeouts,
} from '../services/bulk-import.processor';
import { BulkImportService } from '../services/bulk-import.service';
import { TemplateService } from '../services/template.service';
import { BulkImportValidationService } from '../services/validation.service';
import {
  FakeAccessPolicy,
  FakeAudit,
  FakeClinicalWriter,
  FakeCodeResolver,
  FakePatientResolver,
  FakeUserProvisioner,
} from './fakes';

/** Estado declarado para las pruebas: todo doble, y así se dice. */
export const TEST_ENGINE_STATUS: BulkImportEngineStatus = {
  persistence: { durable: false, adapter: 'in-memory (doble declarado)' },
  executors: {
    users: { connected: false, adapter: 'fake' },
    clinical: { connected: false, adapter: 'fake' },
  },
  resolvers: {
    patients: { connected: false, adapter: 'fake' },
    codes: { connected: false, adapter: 'fake' },
  },
};

/** Logger que guarda lo que se le pidió registrar, para comprobar que no hay PII. */
export class RecordingLogger {
  readonly lines: string[] = [];
  setContext(): void {}
  private push(args: unknown[]): void {
    this.lines.push(JSON.stringify(args));
  }
  info(...args: unknown[]): void {
    this.push(args);
  }
  warn(...args: unknown[]): void {
    this.push(args);
  }
  error(...args: unknown[]): void {
    this.push(args);
  }
  debug(...args: unknown[]): void {
    this.push(args);
  }
}

export const TENANT_A = '11111111-1111-4111-8111-111111111111';
export const TENANT_B = '22222222-2222-4222-8222-222222222222';

export function actor(
  id: string,
  roles: string[] = ['SECURITY_ADMIN'],
): AuthenticatedUser {
  return { id, roles, tenantIds: [TENANT_A] };
}

/** El motor completo armado con dobles declarados. */
export function buildEngine(
  timeouts: ProcessorTimeouts = {
    rowMs: 2_000,
    batchMs: 30_000,
    rowAttempts: 2,
  },
  granted: readonly BulkImportPermission[] = [
    BULK_IMPORT_PERMISSIONS.users,
    BULK_IMPORT_PERMISSIONS.clinical,
  ],
) {
  const repo = new InMemoryBatchRepository();
  const patients = new FakePatientResolver();
  const codes = new FakeCodeResolver();
  const users = new FakeUserProvisioner();
  const clinical = new FakeClinicalWriter();
  const policy = new FakeAccessPolicy();
  const audit = new FakeAudit();
  const logger = new RecordingLogger();
  const log = logger as unknown as PinoLogger;
  const admin = actor('admin-1');
  for (const permission of granted) policy.grant(admin.id, permission);
  const validation = new BulkImportValidationService(patients, codes);
  const processor = new BulkImportProcessor(
    repo,
    users,
    clinical,
    audit,
    validation,
    log,
    timeouts,
  );
  const service = new BulkImportService(
    repo,
    policy,
    audit,
    TEST_ENGINE_STATUS,
    new TemplateService(),
    validation,
    processor,
    log,
  );
  return {
    repo,
    patients,
    codes,
    users,
    clinical,
    policy,
    audit,
    logger,
    processor,
    service,
    admin,
  };
}
