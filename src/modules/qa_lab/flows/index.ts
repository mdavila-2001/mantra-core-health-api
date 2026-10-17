import type { FlowDefinition } from '../domain/flow-catalog';
import flow13 from './catalog/1.3.flow.json';
import flow26 from './catalog/2.6.flow.json';
import flow27 from './catalog/2.7.flow.json';

/**
 * Los flujos declarados. Cada artefacto se importa de forma estática: así
 * `tsc` los copia a `dist` y no depende de leer el disco en producción.
 * Un flujo nuevo se agrega acá y en `flow-catalog.spec.ts` lo verifica.
 */
export const FLOW_CATALOG: readonly FlowDefinition[] = [
  flow13,
  flow26,
  flow27,
] as unknown as readonly FlowDefinition[];
