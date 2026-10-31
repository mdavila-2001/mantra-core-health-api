import { describe, expect, it } from '@jest/globals';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Lecturas de `practice.practice_sites` fuera de `practice` (F1, riesgo del
 * modelo en «Desvíos»: con `RLS_ENFORCE=true` la tabla se filtra por
 * `tenant_id` desde v4.2.67).
 *
 * Verificado contra la base local con el rol `mantra_app` (evidencia en la
 * descripción del PR de F1): sin `app.current_tenant_id` —una ruta
 * `@Public`— se ven 0 sedes; con el tenant A, sólo las de A; con
 * `app.system_context`, todas.
 *
 * Cada lector queda acá con su análisis. Este spec **no** arregla nada: fija
 * el inventario para que un lector nuevo no aparezca sin que alguien decida
 * su contexto (SYSTEM, política propia o lectura acotada al tenant). Las
 * decisiones están pendientes del orquestador (REPORTE de F1, «Riesgos»).
 */
const KNOWN_READERS: Record<string, string> = {
  'billing/services/space-charges.service.ts':
    'F5e: zona horaria y práctica de la sede del encuentro, dentro del tenant (las sedes se autorizan antes con scopeFilter); en el worker, con app.system_context en su transacción.',
  'accounting/services/space-accounting.service.ts':
    'F5f: práctica del espacio o de la unidad que se liga (JOIN por practice_site_id), comparada con el tenant activo y la práctica del activo o del centro de costo (404 / 422).',
  'diagnostic_units/services/equipment-f5a.service.ts':
    'F5a: sede de práctica y zona horaria de la sede de la unidad de un equipo ya acotado al tenant (DiagnosticUnitScopeService); la sede se autoriza enseguida con assertCan.',
  'scheduling/infrastructure/adapters/practice-care-space-directory.adapter.ts':
    'R0/F5d: práctica de la sede de un espacio (LEFT JOIN por practice_site_id) para comparar con la práctica del recurso; el tenant del espacio se compara con el del recurso antes (404).',
  'delegated_access/services/assignment-targets.ts':
    'F5g: comprueba que la sede de una asignación sea del tenant de la membresía (compara tenant_id; 404 si no).',
  'clinical/services/inpatient/inpatient-read.use-cases.ts':
    'F3: sede de la sucursal de un encuentro sin movimientos (filtra por tenant_id del tenant activo) para autorizar la ficha de estancia.',
  'clinical/repositories/inpatient.repository.ts':
    'F3: sitesWithBeds para el tick del censo (worker, abre app.system_context dentro de su transacción: ve todas las sedes a propósito).',
  'clinical/services/inpatient/census.use-cases.ts':
    'F3: lee tenant_id y time_zone de la sede en el cierre del worker (contexto SYSTEM en la transacción); en la ruta HTTP la sede se resuelve por el evaluador de §0.3, dentro del tenant.',
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
  'billing/repositories/patient-spending.repository.ts':
    'SQL: une practice_sites con directory.tenants por managing_tenant_id para el gasto del paciente (cruza tenants). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'clinical/repositories/procedure-centers-read.repository.ts':
    'em.find(PracticeSites) para los centros de procedimientos. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'clinical/repositories/received-services.repository.ts':
    'em.find(PracticeSites) por lista de ids de sede, sin filtro de tenant propio. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'clinical/services/performer-site-db.reader.ts':
    'Lee la sede ejecutora de un procedimiento. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'clinical/services/procedure-centers.service.ts':
    'Consume sedes de procedure-centers-read.repository (tipos y armado de la respuesta). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'clinical/services/suggested-site-names.reader.ts':
    'Lee nombres de sede para sugerir. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'directory/services/pharmacy-operating-requirements.service.ts':
    'Consulta sedes al evaluar requisitos de operación de una farmacia. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'medical_centers/repositories/medical-center-offers.repository.ts':
    'em.find(PracticeSites) para la oferta de un centro médico. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'organization_extensions/repositories/orgext-references.repository.ts':
    'Comprueba que la sede pertenece a alguno de los tenants indicados (hereda el tenant de su práctica). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/repositories/pharmacy-on-call-shifts.repository.ts':
    'SQL: LEFT JOIN practice_sites (time_zone) en la búsqueda de farmacias de turno, que cruza tenants a propósito. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/repositories/pharmacy-references.repository.ts':
    'Comprueba que la sede pertenece a una práctica del tenant (la sede sólo lleva practice_id). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/services/bulk/sites.bulk-handler.ts':
    'Carga masiva de sedes de farmacia vía PracticeSitesRepository, con el tenant de la farmacia. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/services/opening-hours.time.ts':
    'Sólo documenta/usa practice_sites.time_zone para el huso horario (no consulta la tabla). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/services/pharmacy-opening-hours.service.ts':
    'Usa readRepo.findPracticeSites para el horario de apertura. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'pharmacy/services/pharmacy-provisioning.service.ts':
    'Alta de la sede dispensadora: usa PracticeSitesRepository dentro de la transacción del llamador. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'profiles/infrastructure/adapters/admission-foreign-reads.adapter.ts':
    'em.find(PracticeSites) por lista de ids para la admisión (sedes que pueden ser de otro tenant). Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
  'public/infrastructure/repositories/public-pharmacy-branches.repository.ts':
    'SQL público: sedes activas de farmacias verificadas de un tenant; en ruta pública sin contexto de tenant el RLS devuelve 0 sedes. Llegó con la fusión de origin/test; contexto de RLS pendiente de decidir.',
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
