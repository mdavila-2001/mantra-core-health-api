import { describe, expect, it, jest } from '@jest/globals';

import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../common';
import { CONTENT_PACKS } from './content-packs.catalog';
import { ContentPacksService } from './content-packs.service';

/**
 * Aplicar un paquete es correr el seed que le corresponde, ni más ni menos.
 *
 * Lo que estas pruebas fijan: que cada código llegue a **su** seed y no al de al
 * lado —un `switch` mal cableado siembra otra cosa sin fallar—, que las cuentas
 * de demostración no se creen sin contraseña, y que el cero de una segunda
 * aplicación se reporte como lo que es.
 */
function armar() {
  const seed = (resultado: unknown = { inserted: 0 }) => ({
    run: jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue(resultado),
  });

  const dobles = {
    glossary: seed(),
    facilities: seed(),
    insurance: seed(),
    feeSchedule: seed(),
    vademecum: seed(),
    clinicalForms: seed(),
    providerAccounts: seed(),
    geography: seed(),
  };

  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const service = new ContentPacksService(
    dobles.glossary as never,
    dobles.facilities as never,
    dobles.insurance as never,
    dobles.feeSchedule as never,
    dobles.vademecum as never,
    dobles.clinicalForms as never,
    dobles.providerAccounts as never,
    dobles.geography as never,
    logger as never,
  );

  return { service, dobles, logger };
}

describe('ContentPacksService', () => {
  const passwordOriginal = process.env.SEED_DEMO_PASSWORD;

  afterEach(() => {
    if (passwordOriginal === undefined) delete process.env.SEED_DEMO_PASSWORD;
    else process.env.SEED_DEMO_PASSWORD = passwordOriginal;
  });

  it('ofrece el catálogo completo', () => {
    const { service } = armar();
    expect(service.listar()).toHaveLength(CONTENT_PACKS.length);
  });

  it.each([
    ['GLOSARIO', 'glossary'],
    ['ESTABLECIMIENTOS_BO', 'facilities'],
    ['ASEGURADORAS_BO', 'insurance'],
    ['ARANCEL_BO', 'feeSchedule'],
    ['VADEMECUM', 'vademecum'],
    ['FORMULARIOS_CLINICOS', 'clinicalForms'],
  ])('%s corre su propio seed y ninguno más', async (code, esperado) => {
    const { service, dobles } = armar();

    await service.aplicar(code);

    for (const [nombre, doble] of Object.entries(dobles)) {
      // Las aseguradoras arrastran los departamentos a propósito: declaran
      // domicilio con uno de ellos.
      const deberiaCorrer =
        nombre === esperado ||
        (code === 'ASEGURADORAS_BO' && nombre === 'geography');
      expect(doble.run).toHaveBeenCalledTimes(deberiaCorrer ? 1 : 0);
    }
  });

  it('un código desconocido es 404, no un paquete vacío', async () => {
    const { service } = armar();

    await expect(service.aplicar('NO_EXISTE')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('las cuentas de demostración no se crean sin contraseña', async () => {
    // Sin contraseña el seed no haría nada y devolvería un cero indistinguible
    // de «ya estaban». Decir qué falta es más útil que un cero mudo.
    delete process.env.SEED_DEMO_PASSWORD;
    const { service, dobles } = armar();

    await expect(service.aplicar('CUENTAS_DEMO')).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(dobles.providerAccounts.run).not.toHaveBeenCalled();
  });

  it('la contraseña de la petición gana sobre la del entorno', async () => {
    // Quien aplica el paquete desde la pantalla no puede tocar las variables
    // del servidor.
    process.env.SEED_DEMO_PASSWORD = 'la-del-entorno';
    const { service, dobles } = armar();

    await service.aplicar('CUENTAS_DEMO', 'la-de-la-peticion');

    expect(dobles.providerAccounts.run).toHaveBeenCalledWith(
      'la-de-la-peticion',
    );
  });

  it('sin contraseña en la petición cae a la del entorno', async () => {
    process.env.SEED_DEMO_PASSWORD = 'la-del-entorno';
    const { service, dobles } = armar();

    await service.aplicar('CUENTAS_DEMO');

    expect(dobles.providerAccounts.run).toHaveBeenCalledWith('la-del-entorno');
  });

  it('suma los contadores del seed y conserva su forma cruda', async () => {
    const { service, dobles } = armar();
    dobles.clinicalForms.run.mockResolvedValue({
      templates: 43,
      specialties: 36,
    });

    const resultado = await service.aplicar('FORMULARIOS_CLINICOS');

    expect(resultado.inserted).toBe(79);
    // Y el detalle no se pierde: el agregado es para leer de un vistazo.
    expect(resultado.counters).toEqual({ templates: 43, specialties: 36 });
    expect(resultado.tookMs).toBeGreaterThanOrEqual(0);
  });

  it('re-aplicar devuelve cero filas, que es «ya estaba»', async () => {
    // Los seeds convergen: no hace falta guardar ninguna marca de aplicado.
    const { service, dobles } = armar();
    dobles.vademecum.run.mockResolvedValue({ inserted: 0 });

    const resultado = await service.aplicar('VADEMECUM');

    expect(resultado.inserted).toBe(0);
  });
});
