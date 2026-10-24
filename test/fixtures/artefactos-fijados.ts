/**
 * Los dos extremos de la relación `agenda → mensajería`, **fijados por
 * versión** (carril B, H2.S1.M1 / H2.S2.M1 / H2.S3.M1).
 *
 * ## Por qué un archivo y no una constante suelta en la suite
 *
 * Porque «fijar por versión» sólo significa algo si la versión es **un dato
 * comparable**: un identificador, un hash y un commit de origen que otra
 * persona pueda volver a calcular. Una cadena embebida en un `expect` no se
 * puede auditar; esto sí.
 *
 * ## Lo que estas fichas NO son
 *
 * No son el contrato del piloto. El contrato es de Ender y **no existe**: su
 * daily del 2026-09-19 quedó en 0/50 microtareas. Lo que hay acá son los dos
 * artefactos que sí se publicaron, declarados como lo que son — un sustituto
 * nombrado, no el original.
 */

/** Un extremo de la relación, con todo lo que hace falta para volver a armarlo. */
export interface ArtefactoFijado {
  /** Cómo se llama en su manifiesto de origen. */
  readonly nombre: string;
  /** La versión, que es lo que se fija. Nunca una rama. */
  readonly version: string;
  /** Hash del contenido publicado, para detectar que cambió sin avisar. */
  readonly sha256: string;
  /** Commit del que salió, que es lo que lo vuelve reproducible. */
  readonly commitDeOrigen: string;
  /** Dónde vive el manifiesto que declara todo esto. */
  readonly procedencia: string;
  /** Qué lado de la relación ocupa. */
  readonly rol: 'consumidor' | 'proveedor';
  /** Estado con el que su autor lo entregó. Se copia, no se reinterpreta. */
  readonly estadoDeEntrega: string;
  /** Lo que este artefacto NO acredita, en palabras de su autor. */
  readonly limites: readonly string[];
}

/**
 * **Consumidor** — el módulo `scheduling` empaquetado por Itzan (carril C).
 *
 * Su autor lo entregó como `TRANSITIONAL_ISOLATION` y declaró `FAIL` en la
 * microtarea del mapa de resolución: el paquete **sí** resuelve a `messaging`
 * y `community`, porque la versión «limpia» no compila (143 errores de
 * `tsc --noEmit` contra una línea base de 0 en la misma copia). Se fija tal
 * cual lo entregó: fijar una ficción sería peor que no fijar nada.
 *
 * Los 117 archivos **no viajan en este repo** (son código de producto y su
 * casa es la API), así que el `sha256` no se puede recalcular acá. Lo que sí
 * se verifica es que su `commitDeOrigen` sea alcanzable desde el corte: eso
 * es lo que lo hace reproducible.
 */
export const ARTEFACTO_CONSUMIDOR: ArtefactoFijado = {
  nombre: 'scheduling-module',
  version: 'v0.1.0-transitional',
  sha256: '6d4e53d2d0bf12f7dc166b079929e833f1233556fe2eef7ae0f325e2a47f05c8',
  commitDeOrigen: '5d5007fbdb7916b124010bbfbb560b7bb3aabc06',
  procedencia:
    'AlovidaPromptManager@origin/itzan/daily-noche-2026-09-19 · docs/trabajo/2026-09-20-aislamiento-scheduling/MANIFEST-artefacto-h3.md',
  rol: 'consumidor',
  estadoDeEntrega: 'TRANSITIONAL_ISOLATION',
  limites: [
    'El paquete resuelve a messaging y community: la capacidad NO está aislada (H3.S1.M3 = FAIL en su manifiesto).',
    'Los 117 archivos no viajan en este repo; el sha256 se declara, no se recalcula acá.',
    'Su H4/H5/H6 quedaron BLOQUEADOS, así que no hay baseline estabilizado río arriba.',
  ],
};

/**
 * **Proveedor** — el laboratorio de la capacidad de avisos que publicó Pablo
 * (carril A), ya mergeado en `dev`.
 *
 * A diferencia del consumidor, éste **sí vive en el repo**, así que su hash se
 * recalcula en cada corrida y la suite falla si alguien lo movió sin avisar.
 * Eso es exactamente lo que «fijado» tiene que significar.
 */
export const DOBLE_PROVEEDOR: ArtefactoFijado = {
  nombre: 'agenda-notice-capability.lab',
  version: 'cd1889bfee085b3aef6052e58c83844bfd80597f',
  sha256: '81b641f52dc4c46fd9499f8b44f87e320676e9c178405a843e6a42a340d9d09f',
  commitDeOrigen: 'cd1889bfee085b3aef6052e58c83844bfd80597f',
  procedencia:
    'mantra-core-health-api@dev · test/lab/agenda-notice-capability.lab.ts (PR #444)',
  rol: 'proveedor',
  estadoDeEntrega: 'LAB_VERIFIED_CONTRA_POSTGRES',
  limites: [
    'Es un doble: persiste en Postgres real pero no habla con ningún proveedor de transporte.',
    'Su regla ADV-02 (un kind no registrado falla el cierre, no la llamada) es del laboratorio, no del contrato.',
  ],
};

/** Ruta del archivo del proveedor, relativa a la raíz del repo. */
export const RUTA_DOBLE_PROVEEDOR = 'test/lab/agenda-notice-capability.lab.ts';

/**
 * Una celda de la matriz de compatibilidad: qué par se probó y con qué
 * resultado. `motivo` es obligatorio también cuando pasa — un PASS sin motivo
 * no dice contra qué pasó.
 */
export interface CombinacionDeVersiones {
  readonly consumidor: string;
  readonly proveedor: string;
  readonly veredicto: 'PASA' | 'FALLA' | 'NO_APLICA';
  readonly motivo: string;
}

/**
 * Las combinaciones que el producto va a seguir usando.
 *
 * Son **dos**, no las N que pediría una matriz de compatibilidad de verdad:
 * cada artefacto tiene hoy **una sola versión publicada**. Una matriz con una
 * fila por eje es una matriz honesta cuando eso es lo que existe; inventarle
 * versiones históricas para llenarla sería declarar compatibilidad con algo
 * que nadie publicó.
 */
export const COMBINACIONES: readonly CombinacionDeVersiones[] = [
  {
    consumidor: `${ARTEFACTO_CONSUMIDOR.nombre}@${ARTEFACTO_CONSUMIDOR.version}`,
    proveedor: `${DOBLE_PROVEEDOR.nombre}@${DOBLE_PROVEEDOR.version.slice(0, 8)}`,
    veredicto: 'PASA',
    motivo:
      'Ambos salen de commits alcanzables desde el corte 4cc5ea1f; el adaptador real compone contra el puerto que los dos declaran.',
  },
  {
    consumidor: `${ARTEFACTO_CONSUMIDOR.nombre}@${ARTEFACTO_CONSUMIDOR.version}`,
    proveedor: 'contrato-del-piloto@(sin publicar)',
    veredicto: 'NO_APLICA',
    motivo:
      'El contrato versionado de Ender no existe: su daily del 2026-09-19 está en 0/50. No hay artefacto contra el cual combinar.',
  },
];
