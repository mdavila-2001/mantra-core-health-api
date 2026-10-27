import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ReverseGeocodingRequestDto } from './reverse-geocoding.controller';
import {
  OSM_ATTRIBUTION,
  ReverseGeocodingService,
  loadReverseGeocodingConfig,
  photonToResult,
  toResult,
  type ReverseGeocodingHttp,
} from './reverse-geocoding.service';

/**
 * La geocodificación inversa contra un DOBLE del proveedor (Nominatim).
 *
 * Tres niveles del contrato: la respuesta correcta con calle y número, los
 * bordes (sin número, sin calle, el mismo punto dos veces, la cadencia de una
 * consulta por segundo) y lo inválido (proveedor caído, punto fuera de
 * Bolivia). La prueba contra el servidor real de Nominatim no se corre acá: el
 * entorno de pruebas no sale a internet.
 */
const SCZ = { lat: -17.7833, lng: -63.1821 };
const config = { ...loadReverseGeocodingConfig({}), minIntervalMs: 1000 };

function crear(http: ReverseGeocodingHttp) {
  let reloj = 10_000;
  const esperas: number[] = [];
  const logger = { warn: jest.fn() };
  const service = new ReverseGeocodingService(
    logger as never,
    config,
    http,
    () => reloj,
    (ms) => {
      esperas.push(ms);
      reloj += ms;
      return Promise.resolve();
    },
  );
  const avanzar = (ms: number) => {
    reloj += ms;
  };
  return { service, esperas, logger, avanzar };
}

const responde =
  (
    address: Record<string, string> | undefined,
    error?: string,
  ): ReverseGeocodingHttp =>
  () =>
    Promise.resolve({ address, error });

describe('ReverseGeocodingService', () => {
  it('correcto: calle, número y barrio en una línea, con la atribución de OSM', async () => {
    const http = jest.fn(
      responde({
        road: 'Calle Guapay',
        house_number: '3861',
        suburb: 'Equipetrol',
        city: 'Santa Cruz de la Sierra',
      }),
    );
    const { service } = crear(http as unknown as ReverseGeocodingHttp);

    const r = await service.reverse(SCZ.lat, SCZ.lng);

    expect(r).toEqual({
      found: true,
      line: 'Calle Guapay 3861, Equipetrol',
      road: 'Calle Guapay',
      houseNumber: '3861',
      neighbourhood: 'Equipetrol',
      city: 'Santa Cruz de la Sierra',
      adminAreas: { level3: 'Santa Cruz de la Sierra', district: 'Equipetrol' },
      attribution: OSM_ATTRIBUTION,
    });
    const [url, params, headers] = http.mock.calls[0] as unknown as [
      string,
      Record<string, string>,
      Record<string, string>,
    ];
    expect(url).toBe('https://nominatim.openstreetmap.org/reverse');
    expect(params).toMatchObject({
      format: 'jsonv2',
      lat: '-17.7833',
      lon: '-63.1821',
      'accept-language': 'es',
    });
    expect(headers['User-Agent']).toContain('AloVida');
    expect(params).not.toHaveProperty('email');
  });

  it('correcto: con GEOCODING_CONTACT_EMAIL, Nominatim recibe el correo de contacto', async () => {
    const http = jest.fn(responde({ road: 'Calle 1' }));
    const logger = { warn: jest.fn() };
    const service = new ReverseGeocodingService(
      logger as never,
      { ...config, contactEmail: 'soporte@alovida.bo' },
      http as unknown as ReverseGeocodingHttp,
    );

    await service.reverse(SCZ.lat, SCZ.lng);

    const [, params] = http.mock.calls[0] as unknown as [
      string,
      Record<string, string>,
    ];
    expect(params.email).toBe('soporte@alovida.bo');
  });

  it('correcto: la respuesta REAL de Nominatim para la plaza 24 de Septiembre', () => {
    // Capturada el 2026-10-26 con `curl .../reverse?format=jsonv2&lat=-17.7833&lon=-63.1821`.
    const capturada = {
      address: {
        tourism: 'Coronel Ignacio Warnes',
        road: 'Calle 24 de Septiembre',
        neighbourhood: 'Bartos',
        suburb: 'Centro',
        city: 'Santa Cruz de la Sierra',
        county: 'Provincia Andrés Ibáñez',
        state: 'Santa Cruz',
        country: 'Bolivia',
        country_code: 'bo',
      },
    };
    expect(toResult(capturada)).toMatchObject({
      found: true,
      line: 'Calle 24 de Septiembre, Bartos',
      city: 'Santa Cruz de la Sierra',
      countryCode: 'BO',
      adminAreas: {
        level1: 'Santa Cruz',
        level2: 'Provincia Andrés Ibáñez',
        level3: 'Santa Cruz de la Sierra',
        district: 'Centro',
      },
    });
  });

  it('correcto: otro país usa los mismos niveles (Argentina: provincia, departamento, ciudad, barrio)', () => {
    // Forma de la respuesta de Nominatim para Córdoba (AR); valores sintéticos.
    expect(
      toResult({
        address: {
          road: 'Avenida Colón',
          house_number: '500',
          suburb: 'Centro',
          city: 'Córdoba',
          state_district: 'Departamento Capital',
          state: 'Córdoba',
          country_code: 'ar',
        },
      }),
    ).toMatchObject({
      found: true,
      countryCode: 'AR',
      adminAreas: {
        level1: 'Córdoba',
        level2: 'Departamento Capital',
        level3: 'Córdoba',
        district: 'Centro',
      },
    });
  });

  it('límite: un país que sólo informa región y pueblo deja vacíos los niveles que no conoce', () => {
    expect(
      toResult({
        address: {
          road: 'Jirón Lima',
          region: 'Cusco',
          town: 'Urubamba',
          country_code: 'pe',
        },
      }),
    ).toMatchObject({
      countryCode: 'PE',
      adminAreas: { level1: 'Cusco', level3: 'Urubamba' },
    });
    expect(
      toResult({ address: { road: 'Calle 1', state: '  ' } }).adminAreas,
    ).toBeUndefined();
  });

  it('límite: sin número de casa, la línea es la calle y el barrio', async () => {
    const { service } = crear(
      responde({ road: 'Av. Banzer', neighbourhood: 'Norte' }),
    );
    expect((await service.reverse(SCZ.lat, SCZ.lng)).line).toBe(
      'Av. Banzer, Norte',
    );
  });

  it('límite: sin calle ni barrio no hay línea, y no se inventa', async () => {
    const { service } = crear(responde({ city: 'Cobija' }));
    expect(await service.reverse(-11.03, -68.76)).toEqual({
      found: false,
      city: 'Cobija',
      adminAreas: { level3: 'Cobija' },
      attribution: OSM_ATTRIBUTION,
    });
  });

  it('límite: «Unable to geocode» de Nominatim es «no encontrado», no un error', async () => {
    const { service } = crear(responde(undefined, 'Unable to geocode'));
    expect((await service.reverse(SCZ.lat, SCZ.lng)).found).toBe(false);
  });

  it('límite: el mismo punto (a ~11 m) sale de la caché y no vuelve a la red', async () => {
    const http = jest.fn(responde({ road: 'Calle 1' }));
    const { service } = crear(http as unknown as ReverseGeocodingHttp);

    await service.reverse(-17.78331, -63.18211);
    await service.reverse(-17.78334, -63.18214);

    expect(http).toHaveBeenCalledTimes(1);
  });

  it('límite: dos puntos seguidos respetan una consulta por segundo', async () => {
    const { service, esperas } = crear(responde({ road: 'Calle 1' }));

    await Promise.all([
      service.reverse(-17.7, -63.1),
      service.reverse(-17.8, -63.2),
    ]);

    expect(esperas).toEqual([1000]);
  });

  it('inválido: proveedor caído o lento → 503 con mensaje, sin coordenadas en el log', async () => {
    const { service, logger } = crear(() =>
      Promise.reject(new Error('timeout of 4000ms exceeded')),
    );

    await expect(service.reverse(SCZ.lat, SCZ.lng)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    const registro = JSON.stringify(logger.warn.mock.calls);
    expect(registro).not.toContain('17.78');
    expect(registro).not.toContain('63.18');
  });

  it('inválido: tras una caída, la cola sigue atendiendo', async () => {
    // Las dos primeras llamadas son el proveedor y su respaldo: caen las dos.
    // Después, Nominatim queda en pausa y responde el respaldo.
    let caidas = 2;
    const { service } = crear((url) => {
      if (caidas > 0) {
        caidas -= 1;
        return Promise.reject(new Error('ECONNRESET'));
      }
      return Promise.resolve(
        url.includes('photon')
          ? { features: [{ properties: { street: 'Calle 2' } }] }
          : { address: { road: 'Calle 2' } },
      );
    });

    await expect(service.reverse(-17.7, -63.1)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect((await service.reverse(-17.8, -63.2)).line).toBe('Calle 2');
  });

  it('inválido: con la cola llena responde 503 al instante, sin salir a la red', async () => {
    let soltar: () => void = () => undefined;
    const http = jest.fn(
      () =>
        new Promise<{ address: Record<string, string> }>((resolve) => {
          soltar = () => resolve({ address: { road: 'Calle 1' } });
        }),
    );
    const { service } = crear(http as unknown as ReverseGeocodingHttp);

    const enCurso = Array.from({ length: config.maxQueued }, (_, i) =>
      service.reverse(-17 - i / 100, -63),
    );
    await expect(service.reverse(-18.5, -64)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    // Los que ya esperaban se atienden; al vaciarse, la cola vuelve a aceptar.
    for (let i = 0; i < config.maxQueued; i += 1) {
      await new Promise((r) => setImmediate(r));
      soltar();
    }
    await Promise.all(enCurso);
    soltar = () => undefined;
    const despues = service.reverse(-19, -65);
    await new Promise((r) => setImmediate(r));
    soltar();
    expect((await despues).found).toBe(true);
    expect(http).toHaveBeenCalledTimes(config.maxQueued + 1);
  });

  it('correcto/límite/inválido: el cuerpo acepta cualquier punto del planeta y nada más', () => {
    const valida = (cuerpo: object) =>
      validateSync(plainToInstance(ReverseGeocodingRequestDto, cuerpo))
        .map((e) => e.property)
        .sort();

    // Correcto: Bolivia y el exterior (antes Madrid daba 400).
    expect(valida({ latitude: SCZ.lat, longitude: SCZ.lng })).toEqual([]);
    expect(valida({ latitude: 40.41, longitude: -3.7 })).toEqual([]);
    // Límite: los bordes exactos del planeta.
    expect(valida({ latitude: -90, longitude: 180 })).toEqual([]);
    expect(valida({ latitude: 90, longitude: -180 })).toEqual([]);
    // Inválido: fuera del planeta o texto.
    expect(valida({ latitude: 90.1, longitude: -180.1 })).toEqual([
      'latitude',
      'longitude',
    ]);
    expect(
      valida({ latitude: '-17', longitude: '-63' }).length,
    ).toBeGreaterThan(0);
  });

  describe('respaldo (Photon) cuando Nominatim falla', () => {
    it('correcto: Nominatim cae y la calle sale del segundo proveedor', async () => {
      const http = jest.fn((url: string) =>
        url.includes('photon')
          ? Promise.resolve({
              features: [
                {
                  properties: {
                    street: 'Calle 24 de Septiembre',
                    housenumber: '12',
                    district: 'Centro',
                    city: 'Santa Cruz de la Sierra',
                  },
                },
              ],
            })
          : Promise.reject(new Error('403 Forbidden')),
      );
      const { service } = crear(http as unknown as ReverseGeocodingHttp);

      const r = await service.reverse(SCZ.lat, SCZ.lng);

      expect(r.line).toBe('Calle 24 de Septiembre 12, Centro');
      expect(r.adminAreas?.district).toBe('Centro');
      expect(http).toHaveBeenCalledTimes(2);
    });

    it('borde: una plaza sin calle usa su nombre como calle', () => {
      expect(
        photonToResult({
          features: [
            {
              properties: {
                name: 'Plaza 24 de Septiembre',
                osm_key: 'place',
                osm_value: 'square',
                district: 'Centro',
              },
            },
          ],
        }).line,
      ).toBe('Plaza 24 de Septiembre, Centro');
      expect(photonToResult({ features: [] }).found).toBe(false);
    });

    it('correcto: tras una caída de Nominatim, los pedidos siguientes van directo al respaldo', async () => {
      const http = jest.fn((url: string) =>
        url.includes('photon')
          ? Promise.resolve({
              features: [{ properties: { street: 'Calle 1' } }],
            })
          : Promise.reject(new Error('Request failed with status code 403')),
      );
      const { service } = crear(http as unknown as ReverseGeocodingHttp);

      await service.reverse(-17.7, -63.1);
      const r = await service.reverse(-17.8, -63.2);

      expect(r.line).toBe('Calle 1');
      const urls = http.mock.calls.map(([url]) => url);
      expect(urls.filter((u) => u.includes('nominatim'))).toHaveLength(1);
      expect(urls.filter((u) => u.includes('photon'))).toHaveLength(2);
    });

    it('límite: pasada la pausa, se vuelve a preguntar a Nominatim', async () => {
      let nominatimCae = true;
      const http = jest.fn((url: string) =>
        url.includes('photon')
          ? Promise.resolve({
              features: [{ properties: { street: 'Calle 1' } }],
            })
          : nominatimCae
            ? Promise.reject(new Error('timeout'))
            : Promise.resolve({ address: { road: 'Calle Nominatim' } }),
      );
      const { service, avanzar } = crear(
        http as unknown as ReverseGeocodingHttp,
      );

      await service.reverse(-17.7, -63.1);
      nominatimCae = false;
      avanzar(config.primaryCooldownMs);

      expect((await service.reverse(-17.8, -63.2)).line).toBe(
        'Calle Nominatim',
      );
    });

    it('inválido: si los dos caen, 503', async () => {
      const http = jest.fn(() => Promise.reject(new Error('timeout')));
      const { service } = crear(http as unknown as ReverseGeocodingHttp);

      await expect(service.reverse(SCZ.lat, SCZ.lng)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(http).toHaveBeenCalledTimes(2);
    });
  });
});
