import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthzModule } from '../authz/authz.module';
import {
  NotConnectedClinicalWriter,
  NotConnectedCodeResolver,
  NotConnectedPatientResolver,
  NotConnectedUserProvisioner,
} from './adapters/not-connected.adapters';
import { PdpAccessPolicyAdapter } from './adapters/pdp-access-policy.adapter';
import { TrailAuditAdapter } from './adapters/trail-audit.adapter';
import { BULK_IMPORT_TIMEOUTS } from './bulk-import.constants';
import {
  BULK_IMPORT_ENGINE_STATUS,
  type BulkImportEngineStatus,
} from './bulk-import.engine-status';
import { BulkImportController } from './controllers/bulk-import.controller';
import {
  BULK_IMPORT_ACCESS_POLICY,
  BULK_IMPORT_AUDIT,
  BULK_IMPORT_BATCH_REPOSITORY,
  BULK_IMPORT_CLINICAL_WRITER,
  BULK_IMPORT_CODE_RESOLVER,
  BULK_IMPORT_PATIENT_RESOLVER,
  BULK_IMPORT_USER_PROVISIONER,
} from './ports/bulk-import.ports';
import {
  BULK_IMPORT_SQL_RUNNER,
  MikroBulkImportSqlRunner,
} from './repositories/bulk-import-sql.port';
import { PostgresBatchRepository } from './repositories/postgres-batch.repository';
import {
  BULK_IMPORT_TIMEOUTS_TOKEN,
  BulkImportProcessor,
} from './services/bulk-import.processor';
import { BulkImportService } from './services/bulk-import.service';
import { TemplateService } from './services/template.service';
import { BulkImportValidationService } from './services/validation.service';

/**
 * Qué hay conectado de verdad en esta instalación. Se publica en
 * `GET /admin/bulk-imports/templates` (`engine`) para que ningún informe se lea
 * sin saber contra qué se escribió. Al conectar un adaptador real se cambia acá
 * y en su `useClass`.
 */
const ENGINE_STATUS: BulkImportEngineStatus = {
  persistence: {
    durable: true,
    adapter: 'postgres (system_ops.bulk_import_batches)',
    note: 'Los lotes se guardan en Postgres y se comparten entre réplicas. El procesamiento corre en el proceso que confirma: un lote EN_COLA o PROCESANDO no se reanuda solo tras un reinicio.',
  },
  executors: {
    users: { connected: false, adapter: 'not-connected' },
    clinical: { connected: false, adapter: 'not-connected' },
  },
  resolvers: {
    patients: { connected: false, adapter: 'not-connected' },
    codes: { connected: false, adapter: 'not-connected' },
  },
};

/**
 * Módulo de cargas masivas (`bulk_import`): altas de usuarios y carga de
 * historias clínicas, con plantilla CSV y JSON generada del mismo esquema que
 * valida (regla T1), vista previa por fila y campo, confirmación idempotente,
 * procesamiento asíncrono con plazos e informe.
 *
 * Los colaboradores (persistencia del lote, alta de usuarios, escritura clínica,
 * resolución de pacientes y de códigos) son puertos; ver `README.md` para el
 * estado de cada adaptador. Persiste en `system_ops.bulk_import_batches` y
 * `bulk_import_batch_rows` (creadas por el modelo, parche v4.2.81).
 */
@Module({
  imports: [
    // `AuthzPdpService`: el permiso fino se modela con el authz existente.
    AuthzModule,
    // `AuditTrailService`: auditoría de lo cargado y de quién lo leyó.
    AuditModule,
  ],
  controllers: [BulkImportController],
  providers: [
    BulkImportService,
    BulkImportProcessor,
    BulkImportValidationService,
    TemplateService,
    { provide: BULK_IMPORT_TIMEOUTS_TOKEN, useValue: BULK_IMPORT_TIMEOUTS },
    { provide: BULK_IMPORT_ENGINE_STATUS, useValue: ENGINE_STATUS },
    { provide: BULK_IMPORT_SQL_RUNNER, useClass: MikroBulkImportSqlRunner },
    {
      provide: BULK_IMPORT_BATCH_REPOSITORY,
      useClass: PostgresBatchRepository,
    },
    {
      provide: BULK_IMPORT_USER_PROVISIONER,
      useClass: NotConnectedUserProvisioner,
    },
    {
      provide: BULK_IMPORT_CLINICAL_WRITER,
      useClass: NotConnectedClinicalWriter,
    },
    {
      provide: BULK_IMPORT_PATIENT_RESOLVER,
      useClass: NotConnectedPatientResolver,
    },
    { provide: BULK_IMPORT_CODE_RESOLVER, useClass: NotConnectedCodeResolver },
    { provide: BULK_IMPORT_ACCESS_POLICY, useClass: PdpAccessPolicyAdapter },
    { provide: BULK_IMPORT_AUDIT, useClass: TrailAuditAdapter },
  ],
})
export class BulkImportModule {}
