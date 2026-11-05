import 'reflect-metadata';
import { ACCESS_LOGGED_KEY } from '../../../common';
import { BulkImportController } from './bulk-import.controller';

/*
 * Las dos lecturas que muestran lo cargado (estado/vista previa e informe del
 * lote) dejan rastro en `audit.data_access_log` (regla 90.2.7). La prueba lee la
 * METADATA del controlador REAL; el interceptor que la ejecuta tiene su spec en
 * `audit/`. Las plantillas y la lista no leen lo cargado y no la llevan.
 */
// La prueba lee la metadata de los métodos del prototipo; nunca los invoca sueltos.
/* eslint-disable @typescript-eslint/unbound-method */
const proto = BulkImportController.prototype;
const handler = (name: keyof BulkImportController) =>
  proto[name] as unknown as (...args: unknown[]) => unknown;

type Meta = { resourceType: string; resourceId: string; purpose: string };

describe('@AccessLogged en las lecturas de lotes', () => {
  it.each([
    ['get', 'BULK_IMPORT_BATCH'],
    ['report', 'BULK_IMPORT_REPORT'],
  ] as const)('%s lleva @AccessLogged con el lote', (nombre, tipo) => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)) as
      Meta | undefined;
    expect(meta).toBeDefined();
    expect(meta?.resourceType).toBe(tipo);
    expect(meta?.resourceId).toBe('param:id');
    expect(meta?.purpose).toBe('DATA_ADMINISTRATION');
  });

  it.each([['catalog'], ['template'], ['list']] as const)(
    '%s no lee lo cargado y no lleva @AccessLogged',
    (nombre) => {
      expect(
        Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)),
      ).toBeUndefined();
    },
  );
});
