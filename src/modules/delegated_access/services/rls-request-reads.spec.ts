import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Con `RLS_ENFORCE=true` el interceptor de tenant abre UNA transacción por petición y fija en ella
 * `app.current_tenant_id`. Un `this.em.fork()` sin `keepTransactionContext` abre otra conexión SIN
 * ese contexto: las políticas RLS le devuelven cero filas y la lectura sale vacía o con los valores
 * por omisión sin avisar (reglas, ajustes, catálogo, invitaciones, reglas SoD, equipo del doctor).
 * Se vio al arrancar la API real contra Postgres como `mantra_app`; con el superusuario no se nota.
 *
 * Los servicios de `delegated_access` atienden lecturas HTTP de la organización activa: su fork debe heredar la
 * transacción de la petición (el patrón que ya usan `team-admin.service` y `support-activity.service`).
 */

/** Forks que abren su propia transacción A PROPÓSITO (barridos, contadores asíncronos): no son lecturas de la petición. */
const OWN_TRANSACTION = new Set([
  // El PEP escribe (caducidad de la aprobación, asientos) por su cuenta: dentro de la transacción de la
  // petición esas escrituras se perderían con el rollback del 403 que ellas mismas anuncian.
  'support-access.policy.ts',
  'access-usage-recorder.ts',
  'governance-tenant-tx.ts',
  'tenant-context.ts',
]);

// Ruta desde la raíz del repo: jest corre desde ahí y el runner es ESM (sin `__dirname`).
const DIR = join(
  process.cwd(),
  'src',
  'modules',
  'delegated_access',
  'services',
);

const SERVICES = readdirSync(DIR).filter(
  (file) =>
    file.endsWith('.ts') &&
    !file.endsWith('.spec.ts') &&
    !OWN_TRANSACTION.has(file),
);

describe('lecturas de la petición con RLS (fork con la transacción del interceptor)', () => {
  it.each(SERVICES)(
    '%s no abre un fork sin el contexto de la petición',
    (file) => {
      const source = readFileSync(join(DIR, file), 'utf8');
      const plain = source
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /\bthis\.em\.fork\(\s*\)/.test(line));
      expect(plain).toEqual([]);
    },
  );
});
