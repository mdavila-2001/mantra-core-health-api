import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deterministicId } from '../constants/concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';

/**
 * El SQL del modelo escribe estos conceptos como **literales UUID** dentro de
 * EXCLUDE, CHECK, índices parciales y triggers (uuid5 con el namespace de la
 * plataforma sobre «módulo:CLAVE»). Si la API declara la clave con otro nombre u
 * otro prefijo, el id que siembra no es el del literal y la restricción deja de
 * proteger **sin avisar** (p. ej. los tres EXCLUDE de camas de F3).
 *
 * Esta prueba ata las dos puntas: cada clave tiene que (1) estar declarada por su
 * módulo en `MODULE_CONCEPT_SEEDS`, (2) calcular el UUID que el modelo escribió y
 * (3) ese UUID tiene que aparecer de verdad en el SQL vendoreado (`database/SQL`).
 * Fuente de la lista: REPORTE de integración del modelo, §3.
 */
const KEYS: Record<string, string> = {
  // Ausentes en `dev` antes de F1–F5: la API los declara con estos nombres.
  'practice:LOC_FORM_BED': '63ef5a86-740b-5fc6-8b93-3010ed5067a8',
  'practice:HYG_CLEAN': '7874b037-177f-5cac-adad-e7ba679d9ad3',
  'practice:ISO_NONE': 'f2ead1d9-06f7-59a3-b26f-a3642a164f47',
  'practice:BLOCK_MAINTENANCE': 'b0516b50-47c6-5fdb-b1e7-6ae060fbb4c0',
  'practice:CLN_PENDING': 'c0c5918f-cf97-51e1-9ede-72d856e61c93',
  'practice:CLN_IN_PROGRESS': '60ff8df8-4ba5-591c-b092-e8da81187539',
  'practice:CLN_DONE': '334b9e1f-b123-5477-a22e-2dd1b838c2fa',
  'clinical:LOCATION_RESERVED': 'cdd86257-4297-5941-8ae8-b95e11439a48',
  'procedures_perioperative:ORB_ACTIVE': '762dc30b-3e3c-5e1e-8504-5c511fd1d4a8',
  'procedures_perioperative:ORB_RELEASED':
    'c3225706-ef13-5cbe-af6d-caaf25437458',
  'procedures_perioperative:ORB_CANCELLED':
    'e420cc84-8fd2-5887-a9bd-faf77d561508',
  'procedures_perioperative:ORB_OWNER_SERVICE':
    '6b4fd1e9-892f-572b-9e9b-96b321ecdc26',
  'procedures_perioperative:ORB_OWNER_SURGEON':
    '48a989b7-6300-516d-9982-8f741aaf0758',
  'billing:TARIFF_BED_DAY': '1ae01bf6-a061-52ed-aa26-590705cb2202',
  'billing:TARIFF_OR_TIME': '25eb53f6-8006-5959-bee9-65b16117bc9b',
  'billing:CHG_SRC_BED_DAY': '5f84ea44-b0d3-582c-86c1-32c81e422d30',
  'billing:CHG_SRC_OR_TIME': 'a79361f6-8787-56a5-9a90-a9436d02e217',
  'billing:CHG_PENDING': '17def99a-0cb5-586c-a440-59d809709c0d',
  'billing:CHG_INVOICED': '9af061be-6a80-51ed-bcbd-52533037c272',
  'billing:CHG_VOIDED': 'f2f59654-d912-5eeb-b619-814e50a3c4d0',
  'delegated_access:SCOPE_SPACE': '4df1a147-cb37-55ba-94e8-ab469e9cccb0',
  'delegated_access:ASSIGN_ROLE_UNIT_HEAD':
    'ce54425b-5479-57f1-8bb2-274a8617723c',
  'pharmacy_inventory:LOCATION_TYPE_WARD_STOCK':
    '51dd3c8b-d630-5f5a-8bf4-2b9366752a73',
  // Ya declarados en `dev`: se fijan para que nadie los renombre.
  'practice:SPACE_OP_AVAILABLE': '7ce5a926-1c46-56d4-8ca8-679e7429fa1d',
  'clinical:LOCATION_ACTIVE': '809db700-0627-5fe3-8278-4f038f4475b3',
  'clinical:LOCATION_COMPLETED': '8cf00069-81ca-56e1-8e71-9e16333a1f6c',
  'clinical:APPOINTMENT_BOOKED': '51530fd7-05b1-5c29-80c4-da740ede4d27',
  'clinical:APPOINTMENT_CHECKED_IN': '37dded87-7a7a-5a24-86f6-0ef48cccb482',
  'delegated_access:SCOPE_SITE': 'e69a4c95-fe59-5c3e-b826-222af123adb9',
  'delegated_access:SCOPE_UNIT': '928c884d-ff91-584c-8aa6-68535085e078',
  'pharmacy_inventory:LOCATION_ACTIVE': '4e556b5a-7ee6-5c64-abf9-f7e32bf83115',
};

function sqlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sqlFiles(path);
    return name.endsWith('.sql') ? [path] : [];
  });
}

describe('claves de concepto que el SQL del modelo escribe como literal UUID', () => {
  const sql = sqlFiles(resolve(process.cwd(), 'database/SQL'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  const declared = new Map(
    MODULE_CONCEPT_SEEDS.map((seed) => [seed.key, seed]),
  );

  it.each(Object.entries(KEYS))(
    '%s está declarada y calcula %s',
    (key, literal) => {
      expect(declared.has(key)).toBe(true);
      expect(deterministicId(key)).toBe(literal);
    },
  );

  it.each(Object.entries(KEYS))(
    '%s: su UUID aparece en el SQL vendoreado (no es un literal huérfano)',
    (_key, literal) => {
      expect(sql).toContain(literal);
    },
  );

  it('ningún código nuevo choca con otro concepto declarado (el id lo fija la clave; el código visible, no)', () => {
    const codes = new Map<string, string>();
    for (const key of Object.keys(KEYS)) {
      const seed = declared.get(key)!;
      const other = codes.get(seed.code);
      expect(other).toBeUndefined();
      codes.set(seed.code, key);
    }
    const byCode = new Map<string, string[]>();
    for (const seed of MODULE_CONCEPT_SEEDS) {
      byCode.set(seed.code, [...(byCode.get(seed.code) ?? []), seed.key]);
    }
    for (const key of Object.keys(KEYS)) {
      const seed = declared.get(key)!;
      const sameModule = key.split(':')[0];
      const clashes = (byCode.get(seed.code) ?? []).filter(
        (other) => other !== key && other.startsWith(`${sameModule}:`),
      );
      expect(clashes).toEqual([]);
    }
  });

  it('el namespace y el prefijo siguen siendo los del modelo: una clave inventada no calcula ningún literal conocido', () => {
    expect(Object.values(KEYS)).not.toContain(
      deterministicId('practice:LOC_FORM_bed'),
    );
    expect(deterministicId('practice:LOC_FORM_BED')).toBe(
      '63ef5a86-740b-5fc6-8b93-3010ed5067a8',
    );
  });
});
