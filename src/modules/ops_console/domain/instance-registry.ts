/**
 * Registro de instancias esperadas de la sonda de vida.
 *
 * Es una lista **declarada**, no descubierta: la API sólo afirma el estado de lo
 * que está aquí. Una instancia que nadie declaró no existe para la sonda, y un
 * latido que llega con un `instanceId` fuera de esta lista se rechaza.
 *
 * Fuentes (verificadas leyendo el repositorio, ver `instance-registry.spec.ts`,
 * que falla si derivan):
 *  - Workers: un `src/worker-<dominio>.ts` por entrypoint; el `instanceId` es
 *    `worker-<dominio>` (el mismo nombre que `bootstrapWorker` recibe).
 *  - `worker-files` está bajo el perfil opt-in `malware-scan` de
 *    `docker-compose.yml`: puede no existir sin que sea una falla.
 *  - `docker-compose.coolify.yml` sólo declara 4 workers (`messaging`,
 *    `scheduling`, `workflow`, `read_models`): en ese entorno hay que declarar
 *    `OPS_LIVENESS_REQUIRED_WORKERS` (ver `instance-liveness.env.ts`).
 */

export type InstanceType = 'api' | 'worker' | 'database' | 'service';

/** De dónde sale la evidencia de vida de una instancia. */
export type InstanceSource = 'self' | 'heartbeat' | 'probe';

export interface InstanceDefinition {
  readonly id: string;
  readonly label: string;
  readonly type: InstanceType;
  readonly source: InstanceSource;
  /** Valor por defecto; `OPS_LIVENESS_REQUIRED_WORKERS` lo sobrescribe en workers. */
  readonly required: boolean;
}

/** Dominios de `src/worker-<dominio>.ts` (25 entrypoints). */
export const WORKER_DOMAINS = [
  'audio-assets',
  'automation',
  'billing',
  'community',
  'consent',
  'cross_store_consistency',
  'data_catalog',
  'delegated_access',
  'files',
  'health_context',
  'identity_assurance',
  'integrations',
  'lakehouse',
  'messaging',
  'pharmacy_inventory',
  'profiles',
  'promotions',
  'qa_lab',
  'read_models',
  'reporting',
  'scheduling',
  'time_series',
  'tracking',
  'vector_rag',
  'workflow',
] as const;

/** Workers que pueden no existir sin ser una falla (perfil opt-in del compose). */
export const OPTIONAL_WORKER_DOMAINS: readonly string[] = ['files'];

export const workerInstanceId = (domain: string): string => `worker-${domain}`;

const WORKERS: readonly InstanceDefinition[] = WORKER_DOMAINS.map((domain) => ({
  id: workerInstanceId(domain),
  label: `Worker ${domain}`,
  type: 'worker' as const,
  source: 'heartbeat' as const,
  required: !OPTIONAL_WORKER_DOMAINS.includes(domain),
}));

const INFRASTRUCTURE: readonly InstanceDefinition[] = [
  {
    id: 'api',
    label: 'API',
    type: 'api',
    source: 'self',
    required: true,
  },
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    type: 'database',
    source: 'probe',
    required: true,
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    type: 'database',
    source: 'probe',
    required: true,
  },
  {
    id: 'redis',
    label: 'Redis',
    type: 'service',
    source: 'probe',
    required: true,
  },
  {
    id: 'opensearch',
    label: 'OpenSearch',
    type: 'service',
    source: 'probe',
    required: true,
  },
];

export const INSTANCE_REGISTRY: readonly InstanceDefinition[] = [
  ...INFRASTRUCTURE,
  ...WORKERS,
];

/** Lo que existe en el despliegue pero esta sonda NO mide. Se declara, no se rellena. */
export const NOT_MEASURED: readonly { id: string; reason: string }[] = [
  {
    id: 'minio',
    reason: 'Sin sonda en esta versión: no hay evidencia de vida.',
  },
  {
    id: 'clamav',
    reason: 'Sin sonda en esta versión: no hay evidencia de vida.',
  },
  {
    id: 'mock-provider-server',
    reason: 'Sin sonda en esta versión: no hay evidencia de vida.',
  },
  {
    id: 'api-replicas',
    reason:
      'Sólo se evidencia la instancia de la API que respondió; no se detectan otras réplicas.',
  },
];

/** Definición de una instancia por id, o `undefined` si no está declarada. */
export function findInstance(id: string): InstanceDefinition | undefined {
  return INSTANCE_REGISTRY.find((instance) => instance.id === id);
}

/**
 * Aplica `OPS_LIVENESS_REQUIRED_WORKERS` (lista de dominios o ids) sobre el
 * registro. `null` = sin configurar: rigen los valores por defecto.
 *
 * Un nombre que no corresponde a ningún worker declarado **aborta**: una lista
 * mal escrita dejaría workers fuera de `overall` sin que nadie lo note.
 */
export function applyRequiredWorkers(
  registry: readonly InstanceDefinition[],
  requiredWorkers: readonly string[] | null,
): InstanceDefinition[] {
  if (requiredWorkers === null) return [...registry];
  const wanted = new Set(
    requiredWorkers.map((name) =>
      name.startsWith('worker-') ? name : workerInstanceId(name),
    ),
  );
  const known = new Set(
    registry.filter((i) => i.type === 'worker').map((i) => i.id),
  );
  for (const id of wanted) {
    if (!known.has(id)) {
      throw new Error(
        `OPS_LIVENESS_REQUIRED_WORKERS menciona "${id}", que no es un worker declarado`,
      );
    }
  }
  return registry.map((instance) =>
    instance.type === 'worker'
      ? { ...instance, required: wanted.has(instance.id) }
      : instance,
  );
}
