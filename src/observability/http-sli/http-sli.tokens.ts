import { HttpSliAggregator } from './http-sli.aggregator';

/**
 * Tokens de inyección y agregador único del proceso.
 *
 * El middleware se instala con `app.use` en `main.ts`, **antes** de que exista el
 * contenedor de Nest, y el servicio de volcado vive dentro de él: los dos tienen
 * que ver el mismo agregador. Por eso es un singleton de módulo y no un
 * proveedor que se construye al arrancar.
 */
export const HTTP_SLI_AGGREGATOR = Symbol('HTTP_SLI_AGGREGATOR');
export const HTTP_SLI_ENV = Symbol('HTTP_SLI_ENV');

/** El agregador del proceso: lo comparten el middleware y el servicio de volcado. */
export const httpSliAggregator = new HttpSliAggregator();
