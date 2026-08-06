import type { AdapterCapabilities } from '../capabilities/adapter-capabilities';
import type { ConnectionRole } from '../config/connection-descriptor';

/**
 * Contrato de una conexión registrada, sea cual sea su motor.
 *
 * Es lo que el registro almacena y lo que el health check interroga. No expone
 * el cliente nativo: quien necesite hablar con PostgreSQL pide un adaptador, no
 * la conexión. Si el contrato devolviera el `EntityManager`, cualquier servicio
 * podría saltarse los puertos con una línea, y la separación duraría lo que
 * tarde alguien en tener prisa.
 */
export interface DataConnection {
  /** Nombre lógico con el que el enrutado la resuelve. */
  readonly name: string;
  /** Motor (`postgresql`, `mongodb`, ...). */
  readonly engine: string;
  /** Proveedor del despliegue (`local`, `neon`, `rds`, ...). */
  readonly provider: string;
  /** Papel declarado. */
  readonly role: ConnectionRole;
  /** Capacidades del motor tal y como está desplegado. */
  readonly capabilities: AdapterCapabilities;
  /**
   * Huella sanitizada, sin contraseña.
   *
   * Dos conexiones con la misma huella apuntan al mismo sitio con la misma
   * credencial, y el registro las colapsa en una sola instancia.
   */
  readonly fingerprint: string;

  /** Comprueba que la conexión responde. */
  healthCheck(): Promise<ConnectionHealth>;
  /** Cierra el pool de forma ordenada. */
  close(): Promise<void>;
}

/** Resultado de un health check, ya sanitizado para exponerlo por HTTP. */
export interface ConnectionHealth {
  /** Estado observado. */
  readonly status: 'up' | 'down';
  /** Papel de la conexión. */
  readonly role: ConnectionRole;
  /** Motor. */
  readonly engine: string;
  /** Latencia de la comprobación, en milisegundos. */
  readonly latencyMs: number;
  /**
   * Motivo del fallo, ya normalizado.
   *
   * Nunca incluye host, usuario ni cadena de conexión: este objeto se sirve por
   * HTTP y el §44 prohíbe exponer topología interna en el health check.
   */
  readonly reason?: string;
}
