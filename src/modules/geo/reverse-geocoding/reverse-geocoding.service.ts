import { Injectable, Optional } from '@nestjs/common';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';

import { serviceUnavailableWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';

/**
 * Lo que el alta necesita de un punto del mapa: una línea de dirección
 * escribible en un sobre, y de dónde salió.
 */
export interface ReverseGeocodingResult {
  /** `false` si el proveedor no conoce ninguna calle en ese punto. */
  readonly found: boolean;
  /** «Calle Guapay 3861, Equipetrol» — calle, número y barrio, lo que haya. */
  readonly line?: string;
  readonly road?: string;
  readonly houseNumber?: string;
  readonly neighbourhood?: string;
  readonly city?: string;
  /** La atribución que exige la licencia ODbL de OpenStreetMap. */
  readonly attribution: string;
}

/** Configuración, desde el entorno; todo tiene un valor por defecto seguro. */
export interface ReverseGeocodingConfig {
  /** Endpoint `reverse` compatible con Nominatim. */
  readonly url: string;
  /** Nominatim exige un User-Agent que identifique a la aplicación. */
  readonly userAgent: string;
  readonly timeoutMs: number;
  /** Separación mínima entre consultas: la política pública es 1 por segundo. */
  readonly minIntervalMs: number;
  readonly cacheSize: number;
}

export function loadReverseGeocodingConfig(
  env: NodeJS.ProcessEnv = process.env,
): ReverseGeocodingConfig {
  const entero = (valor: string | undefined, porDefecto: number) => {
    const n = Number(valor);
    return Number.isInteger(n) && n >= 0 ? n : porDefecto;
  };
  return {
    url:
      env.GEOCODING_REVERSE_URL ||
      'https://nominatim.openstreetmap.org/reverse',
    userAgent:
      env.GEOCODING_USER_AGENT ||
      'AloVida/1.0 (registro de pacientes; contacto: soporte)',
    timeoutMs: entero(env.GEOCODING_TIMEOUT_MS, 4000),
    minIntervalMs: entero(env.GEOCODING_MIN_INTERVAL_MS, 1100),
    cacheSize: entero(env.GEOCODING_CACHE_SIZE, 2000),
  };
}

/** Lo que se lee de la respuesta `jsonv2` de Nominatim. */
interface NominatimReverse {
  readonly error?: string;
  readonly address?: Readonly<Record<string, string | undefined>>;
}

/** Quien hace el pedido HTTP; se inyecta en las pruebas. */
export type ReverseGeocodingHttp = (
  url: string,
  params: Record<string, string>,
  headers: Record<string, string>,
  timeoutMs: number,
) => Promise<NominatimReverse>;

const httpConAxios: ReverseGeocodingHttp = async (
  url,
  params,
  headers,
  timeoutMs,
) =>
  (
    await axios.get<NominatimReverse>(url, {
      params,
      headers,
      timeout: timeoutMs,
    })
  ).data;

export const OSM_ATTRIBUTION = '© colaboradores de OpenStreetMap (ODbL)';

/**
 * Convierte el punto del mapa en una línea de dirección (pedido del cliente del
 * 26/10/2026: «llene la línea de dirección»).
 *
 * ## Por qué vive en la API y no en el front
 *
 * La política de seguridad del front deja `connect-src` en `'self'`, con una
 * prueba que lo fija. En vez de abrirla a un tercero, el navegador le pregunta
 * a la API y la API al proveedor: el tercero no ve la IP ni la sesión de la
 * persona, y el proveedor se cambia acá sin tocar el front.
 *
 * ## Cuidados
 *
 * - **Una consulta por segundo**, como pide la política de uso del servidor
 *   público de Nominatim, serializando los pedidos. Con un servidor propio se
 *   baja `GEOCODING_MIN_INTERVAL_MS`.
 * - **Caché** por punto redondeado a ~11 m (4 decimales): quien corrige el pin
 *   un par de veces no vuelve a salir a la red, y el redondeo no cambia la calle.
 * - **Timeout** corto. Si el proveedor falla, 503: el alta lo dice y sigue con
 *   la calle a mano. Nunca se inventa una dirección.
 * - **Las coordenadas no se registran** en el log: son el domicilio de alguien.
 */
@Injectable()
export class ReverseGeocodingService {
  private readonly config: ReverseGeocodingConfig;
  private readonly http: ReverseGeocodingHttp;
  private readonly cache = new Map<string, ReverseGeocodingResult>();
  private cola: Promise<unknown> = Promise.resolve();
  private ultimaConsulta = 0;

  constructor(
    private readonly logger: PinoLogger,
    @Optional() config?: ReverseGeocodingConfig,
    @Optional() http?: ReverseGeocodingHttp,
    @Optional() private readonly ahora: () => number = Date.now,
    @Optional()
    private readonly esperar: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.config = config ?? loadReverseGeocodingConfig();
    this.http = http ?? httpConAxios;
  }

  async reverse(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodingResult> {
    const clave = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const guardado = this.cache.get(clave);
    if (guardado) return guardado;

    const resultado = await this.enCola(() =>
      this.consultar(latitude, longitude),
    );
    this.recordar(clave, resultado);
    return resultado;
  }

  private enCola<T>(tarea: () => Promise<T>): Promise<T> {
    const siguiente = this.cola.then(async () => {
      const falta =
        this.ultimaConsulta + this.config.minIntervalMs - this.ahora();
      if (falta > 0) await this.esperar(falta);
      this.ultimaConsulta = this.ahora();
      return tarea();
    });
    // La cola sigue aunque una consulta falle.
    this.cola = siguiente.catch(() => undefined);
    return siguiente;
  }

  private async consultar(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodingResult> {
    let respuesta: NominatimReverse;
    try {
      respuesta = await this.http(
        this.config.url,
        {
          format: 'jsonv2',
          lat: String(latitude),
          lon: String(longitude),
          zoom: '18',
          addressdetails: '1',
          'accept-language': 'es',
        },
        { 'User-Agent': this.config.userAgent },
        this.config.timeoutMs,
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'geo.reverseGeocoding', error: (error as Error)?.message },
        'Reverse geocoding provider unavailable',
      );
      throw serviceUnavailableWithReason(
        'No pudimos traer el nombre de la calle. Puede escribirla a mano.',
        SystemErrorReason.GEOCODING_PROVIDER_UNAVAILABLE,
      );
    }
    return toResult(respuesta);
  }

  private recordar(clave: string, resultado: ReverseGeocodingResult): void {
    if (this.cache.size >= this.config.cacheSize) {
      const masVieja = this.cache.keys().next().value;
      if (masVieja !== undefined) this.cache.delete(masVieja);
    }
    this.cache.set(clave, resultado);
  }
}

/** Traduce la respuesta de Nominatim a la línea que se escribe en el alta. */
export function toResult(respuesta: NominatimReverse): ReverseGeocodingResult {
  const a = respuesta.address;
  if (respuesta.error || !a)
    return { found: false, attribution: OSM_ATTRIBUTION };

  const road = a.road ?? a.pedestrian ?? a.footway ?? a.path ?? a.residential;
  const houseNumber = a.house_number;
  const neighbourhood =
    a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district;
  const city = a.city ?? a.town ?? a.village ?? a.municipality;

  const calle = [road, houseNumber].filter(Boolean).join(' ');
  const line = [calle, neighbourhood].filter(Boolean).join(', ');
  if (line === '') return { found: false, city, attribution: OSM_ATTRIBUTION };

  return {
    found: true,
    line,
    ...(road ? { road } : {}),
    ...(houseNumber ? { houseNumber } : {}),
    ...(neighbourhood ? { neighbourhood } : {}),
    ...(city ? { city } : {}),
    attribution: OSM_ATTRIBUTION,
  };
}
