import 'reflect-metadata';
import { ACCESS_LOGGED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { AdminDataQualityController } from './admin-data-quality.controller';

/*
 * Las lecturas que muestran incidencias (cada una apunta a un recurso clínico) dejan rastro en
 * `audit.data_access_log` (regla 90.2.7). La prueba lee la METADATA del controlador REAL; el
 * interceptor que la ejecuta tiene su spec en `audit/`. Las reglas no identifican a nadie y no la
 * llevan; resolver ya lleva `@Audited`.
 */
// La prueba lee la metadata de los métodos del prototipo; nunca los invoca sueltos.
/* eslint-disable @typescript-eslint/unbound-method */
const proto = AdminDataQualityController.prototype;
const handler = (name: keyof AdminDataQualityController) =>
  proto[name] as unknown as (...args: unknown[]) => unknown;

type Meta = { resourceType: string; resourceId?: string; purpose: string };

describe('@AccessLogged en las lecturas de incidencias de calidad de datos clínicos', () => {
  it('la lista de incidencias deja rastro, sin id de recurso (no hay uno solo)', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('issues')) as
      Meta | undefined;
    expect(meta?.resourceType).toBe('DATA_QUALITY_ISSUE');
    expect(meta?.resourceId).toBeUndefined();
    expect(meta?.purpose).toBe('DATA_GOVERNANCE');
  });

  it('una incidencia deja rastro con su id', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('issue')) as
      Meta | undefined;
    expect(meta?.resourceType).toBe('DATA_QUALITY_ISSUE');
    expect(meta?.resourceId).toBe('param:id');
    expect(meta?.purpose).toBe('DATA_GOVERNANCE');
  });

  it.each([['rules'], ['rule']] as const)(
    '%s (definición de regla, sin personas) no lleva @AccessLogged',
    (nombre) => {
      expect(
        Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)),
      ).toBeUndefined();
    },
  );
});
