import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Chequeos estáticos del manifiesto de despliegue (IC-02, HZ-05).
 *
 * No sustituyen verificar el servidor real (puerto alcanzable, rol efectivo);
 * impiden que una edición del compose reabra la configuración insegura sin que
 * ningún test lo note.
 */
const read = (file: string) =>
  readFileSync(join(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');

/** Texto de un servicio de primer nivel (hasta el siguiente al mismo nivel). */
function serviceBlock(compose: string, name: string): string {
  const start = compose.indexOf(`\n  ${name}:\n`);
  expect(start).toBeGreaterThan(-1);
  const rest = compose.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe('docker-compose.coolify.yml', () => {
  const compose = read('docker-compose.coolify.yml');

  it('IC-02 · el puerto de PostgreSQL se ata al loopback por defecto', () => {
    const ports = serviceBlock(compose, 'postgres').match(
      /ports:\n((?: {6}- .*\n)+)/,
    );
    expect(ports).not.toBeNull();
    const mappings = (ports?.[1] ?? '').trim().split('\n');
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toContain('${POSTGRES_PUBLIC_BIND:-127.0.0.1}:');
    // Ningún mapeo "puerto:puerto" sin IP de enlace.
    expect(mappings[0]).not.toMatch(
      /- "\$\{POSTGRES_PUBLIC_PORT:-5432\}:5432"/,
    );
  });

  it('HZ-05 · la API y los workers reciben el rol de runtime; la migración, no', () => {
    expect(compose).toMatch(/\n {2}DB_APP_USER: \$\{DB_APP_USER:-\}\n/);
    expect(compose).toMatch(/\n {2}DB_APP_PASSWORD: \$\{DB_APP_PASSWORD:-\}\n/);
    const migrate = serviceBlock(compose, 'api-migrate');
    expect(migrate).toContain('DB_APP_USER: ""');
    expect(migrate).toContain('DB_APP_PASSWORD: ""');
    // El dueño sigue siendo el único DB_USER del stack.
    expect(compose).toContain('DB_USER: ${POSTGRES_USER}');
  });

  it('HZ-05 · postgres-init recibe la contraseña para habilitar el LOGIN de mantra_app', () => {
    const init = serviceBlock(compose, 'postgres-init');
    expect(init).toContain('DB_APP_PASSWORD: ${DB_APP_PASSWORD:-}');
  });

  it('la guarda de destinatarios de correo existe, vacía por defecto y documentada', () => {
    expect(compose).toMatch(
      /\n {2}EMAIL_ALLOWED_RECIPIENT_DOMAINS: \$\{EMAIL_ALLOWED_RECIPIENT_DOMAINS:-\}\n/,
    );
    // Los workers (worker-messaging envía) heredan el bloque `x-app-env`.
    expect(serviceBlock(compose, 'worker-messaging')).toContain('<<: *worker');
  });

  it('el proceso que sirve HTTP no sincroniza el esquema con el rol dueño', () => {
    expect(compose).toMatch(/\n {2}ORM_SCHEMA_SYNC: "off"\n/);
  });
});

describe('plantillas de entorno', () => {
  it('IC-02 · .env.coolify.example propone el loopback', () => {
    expect(read('.env.coolify.example')).toMatch(
      /^POSTGRES_PUBLIC_BIND=127\.0\.0\.1$/m,
    );
  });

  it('HZ-05 · .env.coolify.example declara las variables del rol de runtime', () => {
    const example = read('.env.coolify.example');
    expect(example).toMatch(/^DB_APP_USER=$/m);
    expect(example).toMatch(/^DB_APP_PASSWORD=$/m);
  });
});
