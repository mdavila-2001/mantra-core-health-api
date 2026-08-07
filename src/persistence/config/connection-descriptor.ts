import { DataSourceConfigurationError } from '../errors/persistence.errors';

/**
 * Descriptor de una conexión y las utilidades para compararla y registrarla
 * sin filtrar credenciales.
 *
 * El §12 exige comparar conexiones antes de crear una nueva y el §17 y el §43
 * prohíben que una cadena de conexión completa acabe en un log. Ambas cosas se
 * resuelven con la misma pieza: una huella determinista que incluye todo lo que
 * distingue a dos conexiones y excluye la contraseña.
 */

/** Papel que una conexión desempeña. */
export type ConnectionRole = 'read' | 'write' | 'read-write' | 'admin';

/** Parámetros de conexión a PostgreSQL, ya normalizados. */
export interface PostgresConnectionConfig {
  /** Nombre lógico con el que el registro la resuelve. */
  readonly name: string;
  /** Papel declarado. */
  readonly role: ConnectionRole;
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  /** Si la conexión exige TLS. */
  readonly ssl: boolean;
  /** Límites del pool. */
  readonly pool: { readonly min: number; readonly max: number };
  /**
   * Proveedor declarado (`local`, `docker`, `neon`, `supabase`, `rds`...).
   *
   * No cambia la semántica del motor -por eso no duplica el adaptador (§5)-,
   * pero sí el pooling y los límites, y aparece en el health check para que un
   * operador sepa contra qué está hablando el proceso.
   */
  readonly provider: string;
}

/** Motor de esta familia de conexiones. */
export const POSTGRES_ENGINE = 'postgresql';

/**
 * Huella determinista y sanitizada de una conexión.
 *
 * Incluye todo lo que hace que dos conexiones NO sean intercambiables: motor,
 * host, puerto, base, usuario y TLS. Excluye la contraseña -por eso es
 * registrable- y excluye el pool y el nombre lógico, porque dos descriptores
 * que solo difieren en el tamaño del pool siguen apuntando al mismo sitio con
 * los mismos privilegios.
 *
 * El usuario SÍ entra en la huella: `app_reader` y `app_writer` contra el mismo
 * servidor y la misma base son conexiones distintas, porque tienen privilegios
 * distintos. Compartir pool entre ambos anularía el mínimo privilegio entero.
 */
export function connectionFingerprint(
  config: PostgresConnectionConfig,
): string {
  return (
    `${POSTGRES_ENGINE}://${config.user}@${config.host}:${config.port}` +
    `/${config.database}?ssl=${config.ssl ? 'on' : 'off'}`
  );
}

/**
 * Si dos conexiones son equivalentes y pueden compartir la misma instancia.
 *
 * Cuando lo son, el registro reutiliza el pool en vez de abrir uno nuevo: es el
 * escenario A del §9, que es además el predeterminado de este proyecto.
 */
export function areEquivalent(
  a: PostgresConnectionConfig,
  b: PostgresConnectionConfig,
): boolean {
  return connectionFingerprint(a) === connectionFingerprint(b);
}

/**
 * Versión registrable de una cadena de conexión.
 *
 * Se usa cuando hay que mostrar una URL en un mensaje de error de arranque. La
 * contraseña se sustituye por un marcador de longitud fija, para que el log no
 * revele siquiera cuántos caracteres tenía.
 */
export function redactConnectionUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    // Una URL que ni siquiera parsea no debe volcarse cruda: podría ser una
    // cadena con la contraseña en un formato que este código no reconoce.
    return '«cadena de conexión ilegible»';
  }
}

/** Parámetros de una URL de PostgreSQL, ya extraídos. */
export interface ParsedPostgresUrl {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  readonly ssl: boolean;
}

/** Puerto por defecto de PostgreSQL, el que aplica cuando la URL lo omite. */
const DEFAULT_POSTGRES_PORT = 5432;

/**
 * Interpreta una cadena `postgresql://usuario:clave@host:puerto/base`.
 *
 * @param url cadena a interpretar.
 * @param variable nombre de la variable de entorno de la que procede, para que
 *                 el error nombre al culpable sin volcar su contenido.
 */
export function parsePostgresUrl(
  url: string,
  variable: string,
): ParsedPostgresUrl {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new DataSourceConfigurationError(
      `${variable} no es una URL de conexión válida.`,
    );
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new DataSourceConfigurationError(
      `${variable} debe usar el esquema postgresql://, no «${parsed.protocol}».`,
    );
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (!database) {
    throw new DataSourceConfigurationError(
      `${variable} no indica ninguna base de datos.`,
    );
  }
  if (!parsed.username) {
    throw new DataSourceConfigurationError(
      `${variable} no indica ningún usuario.`,
    );
  }

  const sslmode = parsed.searchParams.get('sslmode');
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : DEFAULT_POSTGRES_PORT,
    // `decodeURIComponent` es necesario: una contraseña con `@` o `/` viaja
    // percent-encoded en la URL y usarla sin decodificar produce un fallo de
    // autenticación que parece un problema de credenciales y no de formato.
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(database),
    ssl: sslmode !== null && sslmode !== 'disable',
  };
}
