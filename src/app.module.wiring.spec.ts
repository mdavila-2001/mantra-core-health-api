import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MODULE_METADATA } from '@nestjs/common/constants';
import type { DynamicModule, ForwardReference, Type } from '@nestjs/common';

/**
 * MCH-012 · un módulo funcional que nadie importa no publica sus rutas.
 *
 * `MedicalGroupsModule` estuvo escrito entero —controlador, servicio,
 * repositorios— sin que ningún módulo lo importara: Nest nunca lo instanció y
 * sus ocho rutas respondían 404. Ni el typecheck ni las pruebas del servicio
 * lo delatan, porque todo compila y cada pieza funciona suelta.
 *
 * Este spec lee la misma metadata que Nest recorre al arrancar
 * (`MODULE_METADATA.IMPORTS`, que deja `@Module`) partiendo de `AppModule`, y
 * exige que todo módulo declarado en `src/modules/<dominio>/*.module.ts`
 * aparezca en ese grafo. No levanta la aplicación ni toca la base: detecta el
 * olvido antes de que llegue a integración.
 */
type Importable = Type | DynamicModule | ForwardReference | Promise<unknown>;

/**
 * Importar `AppModule` evalúa `MikroOrmModule.forRoot(buildOrmConfig())`, que
 * valida las variables de la base al cargar el módulo aunque nadie se conecte.
 * En local las pone el `.env`; en CI no hay `.env` y la suite ni arrancaba.
 * Sólo se completan las que falten: este spec lee metadata, no abre conexiones.
 */
const PLACEHOLDER_DB_ENV: Record<string, string> = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'wiring_spec',
  DB_PASSWORD: 'wiring_spec',
  DB_NAME: 'wiring_spec',
};

// Ruta desde la raíz del repo: jest corre desde ahí y el runner es ESM (sin
// `__dirname`).
const MODULES_DIR = join(process.cwd(), 'src', 'modules');

function isDynamic(value: object): value is DynamicModule {
  return 'module' in value;
}

function isForwardRef(value: object): value is ForwardReference {
  return 'forwardRef' in value;
}

/** Normaliza lo que puede aparecer en `imports` a la clase del módulo. */
function moduleClassOf(entry: Importable): Type | undefined {
  if (!entry || entry instanceof Promise) return undefined;
  if (typeof entry === 'function') return entry;
  if (isForwardRef(entry)) return entry.forwardRef() as Type;
  if (isDynamic(entry)) return entry.module;
  return undefined;
}

function reachableFrom(root: Type): Set<Type> {
  const seen = new Set<Type>();
  const pending: Type[] = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    const imports = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, current) ??
      []) as Importable[];
    for (const entry of imports) {
      const next = moduleClassOf(entry);
      if (next && !seen.has(next)) pending.push(next);
    }
  }
  return seen;
}

/** Cada clase exportada por un `*.module.ts` de dominio que sea un `@Module`. */
async function declaredDomainModules(): Promise<Array<[string, Type]>> {
  const declared: Array<[string, Type]> = [];
  for (const domain of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!domain.isDirectory()) continue;
    const dir = join(MODULES_DIR, domain.name);
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.module.ts')) continue;
      const exported = (await import(join(dir, file))) as Record<
        string,
        unknown
      >;
      for (const [name, value] of Object.entries(exported)) {
        if (
          typeof value === 'function' &&
          Reflect.hasMetadata(MODULE_METADATA.IMPORTS, value)
        ) {
          declared.push([`${domain.name}/${file} · ${name}`, value as Type]);
        }
      }
    }
  }
  return declared;
}

describe('MCH-012 · todo módulo de dominio está conectado al arranque', () => {
  let declared: Array<[string, Type]>;
  let AppModule: Type;

  beforeAll(async () => {
    for (const [key, value] of Object.entries(PLACEHOLDER_DB_ENV))
      process.env[key] ??= value;
    // Por ruta absoluta, como los módulos de dominio más abajo: un `import()`
    // relativo sin extensión no resuelve con `moduleResolution: nodenext`.
    ({ AppModule } = (await import(
      join(process.cwd(), 'src', 'app.module.ts')
    )) as { AppModule: Type });
    declared = await declaredDomainModules();
  });

  it('encuentra los módulos de dominio (el inventario no quedó vacío)', () => {
    // Si la lectura del directorio dejara de ver archivos, la comprobación de
    // abajo pasaría sin haber mirado nada.
    expect(declared.length).toBeGreaterThan(60);
  });

  it('ningún módulo de dominio queda fuera del grafo de AppModule', () => {
    const reachable = reachableFrom(AppModule);
    const orphans = declared
      .filter(([, module]) => !reachable.has(module))
      .map(([label]) => label);
    expect(orphans).toEqual([]);
  });
});
