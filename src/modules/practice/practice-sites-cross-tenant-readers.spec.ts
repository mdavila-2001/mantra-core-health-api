import { describe, expect, it } from '@jest/globals';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Lecturas de `practice.practice_sites` fuera de `practice` (F1, riesgo del
 * modelo en «Desvíos»: con `RLS_ENFORCE=true` la tabla se filtra por
 * `tenant_id` desde v4.2.67).
 *
 * Verificado contra la base local con el rol `mantra_app` (evidencia
 * `rls-practice-sites-mantra_app.txt`, en el historial de git: commit
 * e1805fa8, `docs/trabajo/2026-10-29-f1-api-infraestructura/evidencia/`):
 * sin `app.current_tenant_id` —una ruta
 * `@Public`— se ven 0 sedes; con el tenant A, sólo las de A; con
 * `app.system_context`, todas.
 *
 * Cada lector queda acá con su análisis. Este spec **no** arregla nada: fija
 * el inventario para que un lector nuevo no aparezca sin que alguien decida
 * su contexto (SYSTEM, política propia o lectura acotada al tenant). Las
 * decisiones las toma el orquestador: ver
 * mdavila-2001/mantra-core-health-api#1167.
 */
const KNOWN_READERS: Record<string, string> = {
  'community/repositories/public-search.repository.ts':
    'Búsqueda pública de profesionales: une practice_sites con practices, que ya tenía RLS forzada desde 2026-08-05; ' +
    'en ruta pública devuelve 0 sedes. Riesgo previo a F1; necesita contexto SYSTEM o vista pública.',
  'scheduling/infrastructure/adapters/profiles-affiliations.adapter.ts':
    'tenantsOfSites: resuelve el tenant de sedes de otras organizaciones (vínculo médico↔hospital); también une practices. Cruza tenants por diseño.',
  'profiles/infrastructure/adapters/affiliation-organizations.adapter.ts':
    'Busca sedes por managing_tenant_id; el RLS filtra por tenant_id (dueño). Una sede operada por otro tenant queda invisible. Cruza tenants por diseño.',
  'profiles/infrastructure/adapters/practitioner-context.adapter.ts':
    'Lee managing_tenant_id de la sede del profesional; misma observación que el adaptador anterior.',
  'profiles/application/services/linkable-organizations.service.ts':
    'Sólo comentario/documentación sobre las sedes (no consulta la tabla).',
  'diagnostic_units/repositories/diagnostic-units-read.repository.ts':
    'Sedes de unidades diagnósticas para el directorio (lectura de paciente, cruza tenants).',
  'diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts':
    'Sedes de las unidades del propio tenant (admin): dentro del tenant, sin riesgo nuevo.',
  'diagnostic_units/services/diagnostic-units-read.service.ts':
    'Usa diagnostic-units-read.repository.',
  'diagnostic_units/services/diagnostic-units-admin-read.service.ts':
    'Usa diagnostic-units-admin-read.repository.',
  'diagnostic_units/services/diagnostic-units-search.service.ts':
    'Búsqueda de centros de diagnóstico (cruza tenants).',
  'diagnostic_units/services/diagnostic-unit-provisioning.service.ts':
    'Escritura en el alta del propio tenant (escribe tenant_id = el de la práctica). Sin riesgo de lectura.',
  'diagnostic_units/diagnostic_units.module.ts': 'Registro del repositorio.',
  'pharmacy/repositories/pharmacy-read.repository.ts':
    'findPracticeSites para la dirección de farmacias del marketplace (paciente, cruza tenants).',
  'pharmacy/services/pharmacy-read.service.ts': 'Usa pharmacy-read.repository.',
  'pharmacy_inventory/infrastructure/adapters/pharmacy-directory.adapter.ts':
    'Delega en pharmacy-read.repository (directorio de farmacias).',
  'pharmacy_inventory/application/ports/pharmacy-directory.port.ts':
    'Puerto del adaptador anterior (tipos).',
  'pharmacy_inventory/application/pharmacy-inventory-read/read-pharmacy-inventory.use-case.ts':
    'Consume el puerto de directorio de farmacias.',
};

const MODULES = join(process.cwd(), 'src', 'modules');
const PATTERN =
  /PracticeSites\b|practice\.practice_sites|PracticeSitesRepository/;
const SKIP = /\.spec\.ts$|\/entities\/|\/dto\/|error-reasons|generated/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe('lectores de practice.practice_sites fuera de practice (RLS)', () => {
  const found = walk(MODULES)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => relative(MODULES, f).split(sep).join('/'))
    .filter((f) => !f.startsWith('practice/') && !SKIP.test(`/${f}`))
    .filter((f) => PATTERN.test(readFileSync(join(MODULES, f), 'utf8')))
    .sort();

  it('no aparece un lector nuevo sin decidir su contexto de RLS', () => {
    expect(found.filter((f) => !(f in KNOWN_READERS))).toEqual([]);
  });

  it('el inventario no nombra archivos que ya no leen la tabla', () => {
    expect(
      Object.keys(KNOWN_READERS).filter((f) => !found.includes(f)),
    ).toEqual([]);
  });
});
