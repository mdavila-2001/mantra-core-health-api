/**
 * Registro cerrado de las instancias cuya vida mide la sonda
 * (`GET /admin/ops/instances/liveness`).
 *
 * Es una lista escrita a mano a propósito: la sonda tiene que poder decir
 * «nunca vista» de un proceso que **debería** existir, y eso exige saber de
 * antemano cuáles son. Un latido de una instancia que no está acá se rechaza
 * (`422 INSTANCE_UNKNOWN`), así que nadie puede fabricar una instancia nueva
 * desde fuera. La prueba `instance-registry.spec.ts` compara los workers con
 * los entrypoints `src/worker-*.ts` para que la lista no derive del código.
 */

export type InstanceType = 'API' | 'WORKER' | 'DATABASE' | 'SERVICE';

export interface InstanceDefinition {
  /** `worker-<dominio>` exacto del entrypoint, o el nombre del servicio de infraestructura. */
  readonly id: string;
  readonly label: string;
  readonly type: InstanceType;
  /**
   * `true` si su ausencia o caída pesa en `overall`. `false` para lo opcional
   * (`worker-files` corre bajo un perfil opt-in) y para lo que no se sonda.
   */
  readonly required: boolean;
}

/** Prefijo de los `instanceId` de worker: `worker-<dominio>`. */
export const WORKER_INSTANCE_PREFIX = 'worker-';

/** Workers opcionales por defecto: existen sólo bajo un perfil de Compose. */
export const OPTIONAL_WORKERS: readonly string[] = ['worker-files'];

/** Los 26 dominios con proceso worker propio (`src/worker-<dominio>.ts`). */
const WORKER_DOMAINS: ReadonlyArray<readonly [string, string]> = [
  ['audio-assets', 'Audio'],
  ['automation', 'Automatización'],
  ['billing', 'Facturación'],
  ['community', 'Comunidad'],
  ['consent', 'Consentimientos'],
  ['cross_store_consistency', 'Consistencia entre almacenes'],
  ['data_catalog', 'Catálogo de datos'],
  ['delegated_access', 'Acceso delegado'],
  ['files', 'Archivos'],
  ['health_context', 'Contexto clínico'],
  ['identity_assurance', 'Verificación de identidad'],
  ['integrations', 'Integraciones'],
  ['lakehouse', 'Lakehouse'],
  ['messaging', 'Mensajería'],
  ['pharmacy_inventory', 'Inventario de farmacia'],
  ['practice', 'Infraestructura hospitalaria'],
  ['profiles', 'Perfiles'],
  ['promotions', 'Promociones'],
  ['qa_lab', 'Laboratorio QA'],
  ['read_models', 'Modelos de lectura'],
  ['reporting', 'Reportería'],
  ['scheduling', 'Agenda'],
  ['time_series', 'Series de tiempo'],
  ['tracking', 'Seguimiento'],
  ['vector_rag', 'Búsqueda vectorial'],
  ['workflow', 'Flujos de trabajo'],
];

export const WORKER_INSTANCES: readonly InstanceDefinition[] =
  WORKER_DOMAINS.map(([domain, label]) => {
    const id = `${WORKER_INSTANCE_PREFIX}${domain}`;
    return {
      id,
      label,
      type: 'WORKER' as const,
      required: !OPTIONAL_WORKERS.includes(id),
    };
  });

/** Dependencias que la API sonda en la propia petición (mismo código que `/readiness`). */
export const PROBED_DEPENDENCIES: readonly string[] = [
  'postgresql',
  'mongodb',
  'redis',
  'opensearch',
];

export const INFRASTRUCTURE_INSTANCES: readonly InstanceDefinition[] = [
  { id: 'api', label: 'API', type: 'API', required: true },
  { id: 'postgresql', label: 'PostgreSQL', type: 'DATABASE', required: true },
  { id: 'mongodb', label: 'MongoDB', type: 'DATABASE', required: true },
  { id: 'redis', label: 'Redis', type: 'SERVICE', required: true },
  { id: 'opensearch', label: 'OpenSearch', type: 'SERVICE', required: true },
  // Sin sonda en esta versión: se listan para que su «sin dato» sea visible,
  // no para fingir que se miden.
  { id: 'minio', label: 'MinIO', type: 'SERVICE', required: false },
  { id: 'clamav', label: 'ClamAV', type: 'SERVICE', required: false },
  {
    id: 'mock-provider-server',
    label: 'Emulador de proveedores',
    type: 'SERVICE',
    required: false,
  },
];

/** Qué no mide esta versión de la sonda; viaja en `notMeasured`. */
export const NOT_MEASURED: readonly string[] = [
  'replicasOfApi',
  'storageObjectStore',
  'malwareScanner',
  'providerEmulator',
  'processInternals',
];

/** Ids de worker conocidos, para rechazar latidos de instancias inventadas. */
export const KNOWN_WORKER_IDS: ReadonlySet<string> = new Set(
  WORKER_INSTANCES.map((instance) => instance.id),
);

/**
 * Registro efectivo del entorno: los workers de `requiredWorkers` pesan en
 * `overall`; el resto se lista con `required:false` (Coolify arranca 4 de los
 * 26, y un worker que ese despliegue no corre no puede ser una alarma).
 */
export function buildInstanceRegistry(
  requiredWorkers: ReadonlySet<string>,
): readonly InstanceDefinition[] {
  return [
    INFRASTRUCTURE_INSTANCES[0],
    ...WORKER_INSTANCES.map((worker) => ({
      ...worker,
      required: requiredWorkers.has(worker.id),
    })),
    ...INFRASTRUCTURE_INSTANCES.slice(1),
  ];
}
