import { describe, expect, it } from '@jest/globals';
import { EntityManager } from '@mikro-orm/postgresql';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AuditTrailService } from '../audit/services/audit-trail.service';
import { AuthzPdpService } from '../authz/services/authz-pdp.service';
import { NotConnectedUserProvisioner } from './adapters/not-connected.adapters';
import { BulkImportModule } from './bulk-import.module';
import { BulkImportController } from './controllers/bulk-import.controller';
import {
  BULK_IMPORT_BATCH_REPOSITORY,
  BULK_IMPORT_USER_PROVISIONER,
  type BulkImportBatchRepository,
  type UserProvisionerPort,
} from './ports/bulk-import.ports';
import { BulkImportService } from './services/bulk-import.service';
import { BulkImportProcessor } from './services/bulk-import.processor';
import { exampleRow } from './schema/field-schema';
import { findKindSchema } from './schema/registry';
import { actor, TENANT_A } from './testing/harness';

/**
 * Nest resuelve las dependencias al arrancar, no al compilar: un servicio que un
 * proveedor inyecta y que no figura en `providers` pasa `tsc` y los tests que
 * construyen todo a mano, y recién revienta con «Nest can't resolve
 * dependencies». Esta prueba arma el grafo de inyección REAL del módulo (sus
 * `controllers` y `providers` tal como los declara) y sólo sustituye lo que
 * viene de otros módulos (PDP, auditoría, EntityManager, logger).
 */
describe('BulkImportModule · grafo de inyección', () => {
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };

  async function build() {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      BulkImportModule,
    );
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      BulkImportModule,
    );
    return Test.createTestingModule({
      controllers,
      providers: [
        ...providers,
        { provide: PinoLogger, useValue: logger },
        {
          provide: AuthzPdpService,
          useValue: { evaluate: async () => ({ decision: 'DENY' }) },
        },
        {
          provide: AuditTrailService,
          useValue: { record: async () => undefined },
        },
        {
          provide: EntityManager,
          useValue: { fork: () => ({ transactional: async () => undefined }) },
        },
      ],
    }).compile();
  }

  it('resuelve controlador, servicios y los siete puertos', async () => {
    const module = await build();
    expect(module.get(BulkImportController)).toBeInstanceOf(
      BulkImportController,
    );
    expect(module.get(BulkImportService)).toBeInstanceOf(BulkImportService);
    expect(module.get(BulkImportProcessor)).toBeInstanceOf(BulkImportProcessor);
  });

  it('importa authz y audit (el PDP y la cadena de auditoría que usan los adaptadores)', () => {
    const imports: unknown[] = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      BulkImportModule,
    );
    expect(imports.map((i) => (i as { name: string }).name).sort()).toEqual([
      'AuditModule',
      'AuthzModule',
    ]);
  });

  it('sin colaboradores reales conectados, el catálogo lo dice y el alta NO finge éxito', async () => {
    const module = await build();
    const service = module.get(BulkImportService);
    expect(service.catalog().engine).toMatchObject({
      persistence: { durable: false },
      executors: {
        users: { connected: false },
        clinical: { connected: false },
      },
      resolvers: {
        patients: { connected: false },
        codes: { connected: false },
      },
    });
    const provisioner = module.get<UserProvisionerPort>(
      BULK_IMPORT_USER_PROVISIONER,
    );
    expect(provisioner).toBeInstanceOf(NotConnectedUserProvisioner);
    await expect(
      provisioner.provision({
        tenantId: TENANT_A,
        actor: actor('a'),
        kind: 'x',
        row: {},
        reason: 'r',
        batchId: 'b',
        rowKey: 'k',
      }),
    ).resolves.toEqual({
      status: 'REJECTED',
      reason: 'EXECUTOR_NOT_CONNECTED',
    });
  });

  it('el repositorio por defecto es el doble en memoria, declarado', async () => {
    const module = await build();
    const repo = module.get<BulkImportBatchRepository>(
      BULK_IMPORT_BATCH_REPOSITORY,
    );
    expect(repo.constructor.name).toBe('InMemoryBatchRepository');
  });

  it('de punta a punta con los adaptadores «no conectado»: el lote termina y el informe no dice CREADA', async () => {
    const module = await build();
    const service = module.get(BulkImportService);
    const processor = module.get(BulkImportProcessor);
    // El PDP de la prueba deniega: se concede con un doble sólo para esta prueba.
    const pdp = module.get(AuthzPdpService) as unknown as {
      evaluate: () => Promise<{ decision: string }>;
    };
    pdp.evaluate = async () => ({ decision: 'PERMIT' });
    const admin = actor('admin-1');
    const schema = findKindSchema('usuario-personal-organizacion');
    if (!schema) throw new Error('falta el tipo');
    const view = await service.create(admin, TENANT_A, {
      kind: schema.kind,
      declaration: { reason: 'prueba' },
      source: { rows: [exampleRow(schema)] },
    });
    await service.confirm(admin, TENANT_A, view.id, 'wiring-1');
    await processor.drain();
    const report = await service.report(admin, TENANT_A, view.id);
    expect(report.totals).toMatchObject({ CREADA: 0, RECHAZADA: 1 });
    expect(report.rows[0].reason).toBe('EXECUTOR_NOT_CONNECTED');
  });
});
