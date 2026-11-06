import 'reflect-metadata';
import { ACCESS_LOGGED_KEY } from '../../../common';
import { SupportStaffController } from './support-staff.controller';

/*
 * `GET /me/support-agenda` devuelve el nombre de los pacientes de un doctor:
 * es una lectura de PHI y deja rastro en `audit.data_access_log` (regla 90.2.7).
 * La prueba lee la METADATA del controlador REAL; el interceptor que la ejecuta
 * tiene su spec en `audit/`. Las demás lecturas de `/me/*` (vínculos, catálogo,
 * alcance) no devuelven datos de pacientes y no la llevan.
 */
// La prueba lee la metadata de los métodos del prototipo; nunca los invoca sueltos.
/* eslint-disable @typescript-eslint/unbound-method */
const proto = SupportStaffController.prototype;
const handler = (name: keyof SupportStaffController) =>
  proto[name] as unknown as (...args: unknown[]) => unknown;

type Meta = { resourceType: string; patient?: string; resourceId?: string };

describe('@AccessLogged en la agenda de apoyo', () => {
  it('agenda lleva @AccessLogged como lectura de la agenda de apoyo', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('agenda')) as
      Meta | undefined;
    expect(meta).toBeDefined();
    expect(meta?.resourceType).toBe('SUPPORT_AGENDA');
  });

  it('el asiento no lleva identificadores de paciente: los pacientes salen en la respuesta, no en el asiento', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('agenda')) as
      Meta | undefined;
    expect(meta?.patient).toBeUndefined();
  });

  it.each([['mine'], ['catalog'], ['access']] as const)(
    '%s no devuelve datos de pacientes y no lleva @AccessLogged',
    (nombre) => {
      expect(
        Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)),
      ).toBeUndefined();
    },
  );
});
