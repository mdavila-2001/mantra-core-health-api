import { jest } from '@jest/globals';
import { ObjectId } from 'mongodb';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DocumentStoreService } from './document-store.service';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DocumentStoreErrorReason } from '../document_store.error-reasons';

const actor = { id: 'admin-1', roles: ['STORAGE_ADMIN'] } as any;
const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '22222222-2222-2222-2222-222222222222';
const DOC_ID = '507f1f77bcf86cd799439011';

/**
 * Devuelve el servicio con cada método ejecutándose dentro del contexto de
 * `tenantId`, como lo deja el interceptor de tenant en una petición real.
 */
function inTenant<T extends object>(service: T, tenantId: string = TENANT): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/** Exige el 404 uniforme del módulo: `DOCUMENT_NOT_AVAILABLE`, sin `details`. */
async function expectNotAvailable(promise: Promise<unknown>) {
  const error: any = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.reason).toBe(DocumentStoreErrorReason.DOCUMENT_NOT_AVAILABLE);
  expect(error.details).toBeUndefined();
  return error;
}

/**
 * Ejecuta la operación stored doc.
 *
 * @param over - Valor de over requerido por la operación.
 * @returns Resultado de stored doc conforme al contrato `any`.
 */
function storedDoc(over: Partial<any> = {}): any {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    tenantId: TENANT,
    documentType: 'draft',
    payload: { a: 1 },
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...over,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const repo = {
    insert: mockFn(),
    findById: mockFn(),
    list: mockFn(),
    updateWithVersion: mockFn(),
    softDelete: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new DocumentStoreService(repo as any, logger as any);
  return { raw, service: inTenant(raw), repo };
}

describe('DocumentStoreService', () => {
  describe('create', () => {
    it('inserta y mapea a la respuesta con id hex', async () => {
      const d = build();
      d.repo.insert.mockResolvedValue(storedDoc());
      const res = await d.service.create(
        'clinical_drafts',
        { tenantId: TENANT, documentType: 'draft', payload: { a: 1 } },
        actor,
      );
      expect(d.repo.insert).toHaveBeenCalledWith('clinical_drafts', {
        tenantId: TENANT,
        documentType: 'draft',
        payload: { a: 1 },
      });
      expect(res.id).toBe('507f1f77bcf86cd799439011');
      expect(res.version).toBe(1);
    });
  });

  describe('findOne', () => {
    it('lanza NotFound con un id malformado sin tocar el repo', async () => {
      const d = build();
      await expect(
        d.service.findOne('c', 'no-es-objectid', TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.findById).not.toHaveBeenCalled();
    });

    it('lanza NotFound cuando el documento no existe', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(null);
      await expect(
        d.service.findOne('c', '507f1f77bcf86cd799439011', TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('devuelve el documento vivo', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc());
      const res = await d.service.findOne(
        'c',
        '507f1f77bcf86cd799439011',
        TENANT,
      );
      expect(res.tenantId).toBe(TENANT);
    });
  });

  describe('list', () => {
    it('pagina y envuelve en PageResponseDto', async () => {
      const d = build();
      d.repo.list.mockResolvedValue({ items: [storedDoc()], total: 1 });
      const res = await d.service.list('c', {
        tenantId: TENANT,
        offset: 0,
        page: 1,
        pageSize: 20,
        order: 'DESC',
        sortBy: 'createdAt',
      } as any);
      expect(res.data).toHaveLength(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe('update', () => {
    it('exige al menos un campo a cambiar (precondición)', async () => {
      const d = build();
      await expect(
        d.service.update(
          'c',
          '507f1f77bcf86cd799439011',
          { tenantId: TENANT, expectedVersion: 1 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('lanza NotFound cuando el documento no existe', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(null);
      await expect(
        d.service.update(
          'c',
          '507f1f77bcf86cd799439011',
          { tenantId: TENANT, expectedVersion: 1, payload: { b: 2 } } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('lanza ConcurrencyConflict si la versión no coincide', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc({ version: 3 }));
      await expect(
        d.service.update(
          'c',
          '507f1f77bcf86cd799439011',
          { tenantId: TENANT, expectedVersion: 2, payload: { b: 2 } } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
      expect(d.repo.updateWithVersion).not.toHaveBeenCalled();
    });

    it('actualiza cuando la versión coincide', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc({ version: 1 }));
      d.repo.updateWithVersion.mockResolvedValue(
        storedDoc({ version: 2, payload: { b: 2 } }),
      );
      const res = await d.service.update(
        'c',
        '507f1f77bcf86cd799439011',
        { tenantId: TENANT, expectedVersion: 1, payload: { b: 2 } },
        actor,
      );
      expect(res.version).toBe(2);
      expect(d.repo.updateWithVersion).toHaveBeenCalledWith(
        'c',
        expect.any(ObjectId),
        TENANT,
        1,
        { payload: { b: 2 }, documentType: undefined },
      );
    });

    it('convierte una carrera (update null) en ConcurrencyConflict', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc({ version: 1 }));
      d.repo.updateWithVersion.mockResolvedValue(null);
      await expect(
        d.service.update(
          'c',
          '507f1f77bcf86cd799439011',
          { tenantId: TENANT, expectedVersion: 1, payload: { b: 2 } } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });

  describe('softDelete', () => {
    it('marca el borrado lógico y devuelve el documento', async () => {
      const d = build();
      d.repo.softDelete.mockResolvedValue(
        storedDoc({ deletedAt: new Date('2026-02-01') }),
      );
      const res = await d.service.softDelete(
        'c',
        '507f1f77bcf86cd799439011',
        TENANT,
        actor,
      );
      expect(res.deletedAt).toBeInstanceOf(Date);
    });

    it('lanza NotFound cuando no hay nada que borrar', async () => {
      const d = build();
      d.repo.softDelete.mockResolvedValue(null);
      await expect(
        d.service.softDelete('c', '507f1f77bcf86cd799439011', TENANT, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance de tenant (DOCSTORE-01)', () => {
    it('crea en el tenant del contexto aunque el cuerpo no lo declare', async () => {
      const d = build();
      d.repo.insert.mockResolvedValue(storedDoc());
      await d.service.create(
        'clinical_drafts',
        { documentType: 'draft', payload: { a: 1 } } as any,
        actor,
      );
      expect(d.repo.insert).toHaveBeenCalledWith(
        'clinical_drafts',
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('rechaza un tenantId del cuerpo ajeno al activo y no inserta', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.create(
          'c',
          { tenantId: OTHER_TENANT, documentType: 'draft', payload: {} },
          actor,
        ),
      );
      expect(d.repo.insert).not.toHaveBeenCalled();
    });

    it('lee con el tenant del contexto cuando la query no lo trae', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc());
      await d.service.findOne('c', DOC_ID);
      expect(d.repo.findById).toHaveBeenCalledWith(
        'c',
        expect.any(ObjectId),
        TENANT,
      );
    });

    it('un tenantId de la query distinto del activo responde 404 sin consultar la base', async () => {
      const d = build();
      await expectNotAvailable(d.service.findOne('c', DOC_ID, OTHER_TENANT));
      expect(d.repo.findById).not.toHaveBeenCalled();
    });

    it('un documento de otro tenant responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.repo.findById.mockResolvedValue(null);
      const inexistente = build();
      inexistente.repo.findById.mockResolvedValue(null);
      const a = await expectNotAvailable(
        ajeno.service.findOne('c', DOC_ID, OTHER_TENANT),
      );
      const b = await expectNotAvailable(
        inexistente.service.findOne('c', DOC_ID, TENANT),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un id malformado usa el mismo 404 catalogado', async () => {
      const d = build();
      await expectNotAvailable(d.service.findOne('c', 'no-es-objectid'));
    });

    it('el listado se acota al tenant del contexto, no al de la query', async () => {
      const d = build();
      d.repo.list.mockResolvedValue({ items: [], total: 0 });
      await d.service.list('c', {
        offset: 0,
        page: 1,
        pageSize: 20,
        order: 'DESC',
        sortBy: 'createdAt',
      } as any);
      expect(d.repo.list).toHaveBeenCalledWith(
        'c',
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('listar con el tenantId de otra organización responde 404 sin consultar', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.list('c', {
          tenantId: OTHER_TENANT,
          offset: 0,
          page: 1,
          pageSize: 20,
        } as any),
      );
      expect(d.repo.list).not.toHaveBeenCalled();
    });

    it('actualizar con un tenantId ajeno no toca la base', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.update(
          'c',
          DOC_ID,
          { tenantId: OTHER_TENANT, expectedVersion: 1, payload: { b: 2 } },
          actor,
        ),
      );
      expect(d.repo.findById).not.toHaveBeenCalled();
      expect(d.repo.updateWithVersion).not.toHaveBeenCalled();
    });

    it('borrar con un tenantId ajeno no marca el documento', async () => {
      const d = build();
      await expectNotAvailable(
        d.service.softDelete('c', DOC_ID, OTHER_TENANT, actor),
      );
      expect(d.repo.softDelete).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no se lee ni se escribe nada', async () => {
      const d = build();
      await expect(d.raw.findOne('c', DOC_ID)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.repo.findById).not.toHaveBeenCalled();
    });

    it('el mismo documento es legible desde su propio tenant', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(storedDoc({ tenantId: OTHER_TENANT }));
      const res = await inTenant(d.raw, OTHER_TENANT).findOne('c', DOC_ID);
      expect(res.tenantId).toBe(OTHER_TENANT);
      expect(d.repo.findById).toHaveBeenCalledWith(
        'c',
        expect.any(ObjectId),
        OTHER_TENANT,
      );
    });
  });
});
