import 'reflect-metadata';
import { HttpStatus, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ACCESS_LOGGED_KEY,
  AUDITED_KEY,
  DomainException,
  RolesGuard,
  runWithTenant,
} from '../../common';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { ClinicalImportController } from './clinical-import.controller';
import {
  ImportError,
  type ClinicalImportService,
} from './clinical-import.service';

/*
 * Matriz de autorización negativa y contrato de errores del controlador.
 * Usa el RolesGuard REAL de la API y el controlador REAL con un servicio
 * sustituido (doble declarado): no prueba el servicio, que tiene sus specs.
 */

const TENANT = '11111111-1111-4111-8111-111111111111';
// La prueba lee la METADATA de los métodos del prototipo; nunca los invoca sueltos.
/* eslint-disable @typescript-eslint/unbound-method */
const proto = ClinicalImportController.prototype;
const handler = (name: keyof ClinicalImportController) =>
  proto[name] as unknown as (...args: unknown[]) => unknown;

function contexto(
  roles: string[] | undefined,
  tenantId = TENANT,
): ExecutionContext {
  const request = {
    user: roles === undefined ? undefined : { id: 'u1', roles },
    resolvedTenantId: tenantId,
  };
  return {
    getHandler: () => proto.catalog,
    getClass: () => ClinicalImportController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('autorización de /admin/clinical-imports', () => {
  const guard = new RolesGuard(new Reflector());

  it('toda la clase exige SECURITY_ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ClinicalImportController)).toEqual([
      'SECURITY_ADMIN',
    ]);
  });

  it.each([['SECURITY_ADMIN'], ['SUPERADMIN']])('%s entra', (rol) => {
    expect(guard.canActivate(contexto([rol]))).toBe(true);
  });

  it.each([
    ['PATIENT'],
    ['CLINICIAN'],
    ['PRACTITIONER'],
    ['USER'],
    ['PLATFORM_ADMIN'],
    ['PHARMACIST'],
  ])('%s recibe 403: rol insuficiente', (rol) => {
    expect(() => guard.canActivate(contexto([rol]))).toThrow(
      expect.objectContaining({ status: HttpStatus.FORBIDDEN }),
    );
  });

  it('un SECURITY_ADMIN con ámbito en OTRA organización no entra en ésta', () => {
    const contextoAjeno = contexto(['SECURITY_ADMIN'], TENANT);
    const request = contextoAjeno
      .switchToHttp()
      .getRequest<{ user: { scopedRoles?: Record<string, string[]> } }>();
    request.user.scopedRoles = {
      '99999999-9999-4999-8999-999999999999': ['SECURITY_ADMIN'],
    };
    expect(() => guard.canActivate(contextoAjeno)).toThrow(
      expect.objectContaining({ status: HttpStatus.FORBIDDEN }),
    );
  });
});

describe('auditoría declarada en las rutas', () => {
  it.each([['create'], ['confirm']] as const)(
    '%s (muta) lleva @Audited con acción de negocio',
    (nombre) => {
      const meta = Reflect.getMetadata(AUDITED_KEY, handler(nombre)) as {
        action: string;
        entity: string;
      };
      expect(meta.action).toMatch(/^CLINICAL_IMPORT_BATCH_/);
      expect(meta.entity).toBe('clinical_import_batch');
    },
  );

  it.each([['report'], ['loaded']] as const)(
    '%s (lee lo cargado) lleva @AccessLogged con el lote',
    (nombre) => {
      const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)) as {
        resourceType: string;
        resourceId: string;
      };
      expect(meta.resourceType).toMatch(/^CLINICAL_IMPORT_/);
      expect(meta.resourceId).toBe('param:id');
    },
  );
});

describe('contrato de errores', () => {
  function controlador(falla: ImportError) {
    const lanza = () => {
      throw falla;
    };
    const servicio = {
      get: lanza,
      confirm: lanza,
      loaded: lanza,
      report: lanza,
    } as unknown as ClinicalImportService;
    return new ClinicalImportController(servicio);
  }
  const intentar = async (accion: () => unknown) => {
    try {
      await accion();
    } catch (e) {
      return e as DomainException;
    }
    throw new Error('no falló');
  };

  it.each([
    ['NOT_FOUND', 'BATCH_NOT_AVAILABLE', HttpStatus.NOT_FOUND],
    ['CONFLICT', 'BATCH_NOT_CONFIRMABLE', HttpStatus.CONFLICT],
    ['BAD_REQUEST', 'IDEMPOTENCY_KEY_REQUIRED', HttpStatus.BAD_REQUEST],
    ['PAYLOAD_TOO_LARGE', 'FILE_TOO_LARGE', HttpStatus.PAYLOAD_TOO_LARGE],
  ] as const)(
    '%s → %s con su estado HTTP y su reason',
    async (kind, reason, status) => {
      const c = controlador(new ImportError(kind, reason));
      const e = await runWithTenant(TENANT, () =>
        intentar(() => c.get('22222222-2222-4222-8222-222222222222')),
      );
      expect(e.getStatus()).toBe(status);
      expect(e.reason).toBe(reason);
    },
  );

  it('sin organización activa no se sirve nada (en vez de una lista vacía que miente)', async () => {
    const c = controlador(new ImportError('NOT_FOUND', 'BATCH_NOT_AVAILABLE'));
    const e = await intentar(() =>
      c.get('22222222-2222-4222-8222-222222222222'),
    );
    expect(e.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('limit fuera de 1–100: 400', async () => {
    const c = controlador(new ImportError('NOT_FOUND', 'BATCH_NOT_AVAILABLE'));
    for (const limite of ['0', '101', 'x', '1.5']) {
      const e = await runWithTenant(TENANT, () =>
        intentar(() => c.list(limite)),
      );
      expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('el mensaje del error no contiene datos: es el estático del motivo', async () => {
    const c = controlador(new ImportError('NOT_FOUND', 'BATCH_NOT_AVAILABLE'));
    const e = await runWithTenant(TENANT, () =>
      intentar(() => c.get('22222222-2222-4222-8222-222222222222')),
    );
    expect(JSON.stringify(e.getResponse())).not.toMatch(/SINT-|1990/);
  });
});
