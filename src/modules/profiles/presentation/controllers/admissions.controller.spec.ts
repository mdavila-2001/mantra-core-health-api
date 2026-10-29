import 'reflect-metadata';
import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import {
  ACCESS_LOGGED_KEY,
  AUDITED_KEY,
} from '../../../../common/audit-trail/audit-trail.decorators';
import { IS_PUBLIC_KEY } from '../../../../common/auth/public.decorator';
import { AdmissionsController } from './admissions.controller';
import { OwnAdmissionController } from './own-admission.controller';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const proto = AdmissionsController.prototype as unknown as Record<
  string,
  (...a: never[]) => unknown
>;
const ownProto = OwnAdmissionController.prototype as unknown as Record<
  string,
  (...a: never[]) => unknown
>;

const roles = (name: string) =>
  Reflect.getMetadata(ROLES_KEY, proto[name]) as string[] | undefined;
const audited = (name: string) =>
  Reflect.getMetadata(AUDITED_KEY, proto[name]) as
    { action: string; entity: string } | undefined;

describe('AdmissionsController · la API autoriza cada ruta', () => {
  it('ninguna ruta de admisiones es pública', () => {
    for (const name of Object.getOwnPropertyNames(proto).filter(
      (n) => n !== 'constructor' && n !== 'caller',
    )) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto[name])).toBeUndefined();
    }
  });

  it.each([
    ['list', ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN']],
    [
      'search',
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    ],
    [
      'detail',
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    ],
    ['claim', ['ADMISSIONS_REVIEWER', 'SECURITY_ADMIN']],
    ['requestInfo', ['ADMISSIONS_REVIEWER', 'SECURITY_ADMIN']],
    ['reviewItem', ['ADMISSIONS_REVIEWER', 'SECURITY_ADMIN']],
    [
      'release',
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    ],
    ['reassign', ['ADMISSIONS_APPROVER', 'SECURITY_ADMIN']],
    ['decide', ['ADMISSIONS_APPROVER', 'SECURITY_ADMIN']],
    ['suspend', ['ADMISSIONS_APPROVER', 'SECURITY_ADMIN']],
    ['reinstate', ['ADMISSIONS_APPROVER', 'SECURITY_ADMIN']],
    [
      'documentUrl',
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    ],
    [
      'documentContent',
      ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    ],
    ['expireSweep', ['SYSTEM', 'SECURITY_ADMIN']],
  ])('%s exige %j', (name, expected) => {
    expect(roles(name)).toEqual(expected);
  });

  it('resolver, suspender, reponer y reasignar nunca los puede un revisor sin más', () => {
    for (const name of ['decide', 'suspend', 'reinstate', 'reassign']) {
      expect(roles(name)).not.toContain('ADMISSIONS_REVIEWER');
    }
  });

  it('todas las escrituras están auditadas con un verbo de negocio', () => {
    for (const name of [
      'search',
      'expireSweep',
      'claim',
      'release',
      'reassign',
      'requestInfo',
      'reviewItem',
      'decide',
      'suspend',
      'reinstate',
      'documentUrl',
    ]) {
      const meta = audited(name);
      expect(meta).toBeDefined();
      expect(meta!.action).toMatch(/^[A-Z_]+$/);
    }
    expect(audited('documentUrl')).toMatchObject({
      action: 'FILE_DOWNLOAD_URL_ISSUED',
      entity: 'file',
    });
  });

  it('las lecturas de detalle y de documento dejan rastro de ACCESO (PII)', () => {
    for (const name of ['detail', 'documentContent']) {
      expect(Reflect.getMetadata(ACCESS_LOGGED_KEY, proto[name])).toMatchObject(
        { purpose: 'ADMISSION_REVIEW' },
      );
    }
  });
});

describe('AdmissionsController · S-4 ninguna ruta queda sin la puerta de «su propia admisión»', () => {
  /** Dónde se aplica la puerta de cada ruta; una ruta nueva sin entrada acá hace fallar la prueba. */
  const GATE: Record<string, string> = {
    list: 'PractitionerAdmissionsReadService.list (excluye la propia de filas y conteos)',
    search:
      'PractitionerAdmissionsReadService.list (excluye la propia de filas y conteos)',
    detail: 'PractitionerAdmissionsReadService.detail → assertNotSelfAccess',
    claim: 'PractitionerAdmissionsService.claim → assertNotOwnAdmission',
    release: 'PractitionerAdmissionsService.release → assertNotOwnAdmission',
    reassign: 'PractitionerAdmissionsService.reassign → assertNotOwnAdmission',
    requestInfo:
      'PractitionerAdmissionsService.requestInfo → assertNotOwnAdmission',
    reviewItem:
      'PractitionerAdmissionsService.reviewItem → assertNotOwnAdmission',
    decide: 'PractitionerAdmissionsService.decide → assertNotOwnAdmission',
    suspend: 'PractitionerAdmissionsService.suspend → assertNotOwnAdmission',
    reinstate:
      'PractitionerAdmissionsService.reinstate → assertNotOwnAdmission',
    documentUrl:
      'PractitionerAdmissionDocumentsService.issueUrl → assertNotSelfAccess',
    documentContent:
      'PractitionerAdmissionDocumentsService.open → assertNotSelfAccess',
    expireSweep:
      'sin admisión concreta: recorre vencidas, no es una lectura ni una decisión del personal',
  };

  it('cada handler HTTP del controlador está en el mapa de puertas, y el mapa no tiene fantasmas', () => {
    const handlers = Object.getOwnPropertyNames(proto).filter(
      (n) =>
        n !== 'constructor' &&
        Reflect.getMetadata('path', proto[n]) !== undefined,
    );
    expect(handlers.sort()).toEqual(Object.keys(GATE).sort());
  });
});

describe('AdmissionsController.detail · S-3', () => {
  it('pasa al servicio quién consulta, para que el profesional no vea su propia admisión', async () => {
    const reads = { detail: fn().mockResolvedValue({ id: 'adm-1' }) };
    const controller = new AdmissionsController(
      {} as never,
      reads as never,
      {} as never,
    );
    const actor = { id: 'u-doctor', roles: ['ADMISSIONS_REVIEWER'] } as never;
    await controller.detail('adm-1', actor);
    expect(reads.detail).toHaveBeenCalledWith('adm-1', actor);
  });
});

describe('OwnAdmissionController · el sujeto sale de la sesión', () => {
  it('las rutas me/* no declaran roles y están auditadas las que escriben', () => {
    for (const name of ['get', 'resubmit', 'withdraw']) {
      expect(Reflect.getMetadata(ROLES_KEY, ownProto[name])).toBeUndefined();
    }
    for (const name of ['resubmit', 'withdraw']) {
      expect(Reflect.getMetadata(AUDITED_KEY, ownProto[name])).toBeDefined();
    }
  });

  it('delega con el actor de la sesión; no hay parámetro de ruta ni de cuerpo con el sujeto', async () => {
    const reads = { own: fn().mockResolvedValue({ id: 'a' }) };
    const admissions = {
      resubmit: fn().mockResolvedValue({}),
      withdraw: fn().mockResolvedValue({}),
    };
    const controller = new OwnAdmissionController(
      reads as never,
      admissions as never,
    );
    const actor = { id: 'u-me', roles: [] } as never;
    await controller.get(actor);
    await controller.resubmit(actor, 'req-1');
    await controller.withdraw(actor, 'req-2');
    expect(reads.own).toHaveBeenCalledWith(actor);
    expect(admissions.resubmit).toHaveBeenCalledWith(actor, 'req-1');
    expect(admissions.withdraw).toHaveBeenCalledWith(actor, 'req-2');
    expect(OwnAdmissionController.prototype.get.length).toBe(1);
  });
});

describe('AdmissionsController.documentContent · cabeceras seguras', () => {
  it('sirve con nosniff, sin caché, en sandbox y con Content-Disposition con el nombre codificado', async () => {
    const documents = {
      open: fn().mockResolvedValue({
        buffer: Buffer.from('x'),
        mimeType: 'application/pdf',
        disposition: 'inline',
        fileName: 'título "a"; b.pdf',
      }),
    };
    const controller = new AdmissionsController(
      {} as never,
      {} as never,
      documents as never,
    );
    const headers = new Map<string, string>();
    const res = {
      setHeader: (k: string, v: string) => headers.set(k, v),
      send: fn(),
    };
    await controller.documentContent(
      'adm-1',
      'f1',
      '123',
      'sig',
      { id: 'u', roles: ['ADMISSIONS_REVIEWER'] } as never,
      res as never,
    );
    expect(documents.open).toHaveBeenCalledWith(
      'adm-1',
      'f1',
      { expires: '123', signature: 'sig' },
      expect.anything(),
    );
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Cache-Control')).toBe('private, no-store');
    expect(headers.get('Content-Security-Policy')).toContain('sandbox');
    expect(headers.get('Content-Type')).toBe('application/pdf');
    expect(headers.get('Content-Disposition')).toBe(
      `inline; filename*=UTF-8''${encodeURIComponent('título "a"; b.pdf')}`,
    );
    // El nombre no puede inyectar cabeceras ni comillas.
    expect(headers.get('Content-Disposition')).not.toMatch(/["\r\n]/);
    expect(res.send).toHaveBeenCalledWith(Buffer.from('x'));
  });
});
