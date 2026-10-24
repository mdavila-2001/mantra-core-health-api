// =============================================================================
// Réplicas públicas en git de datos oficiales europeos, fijadas por commit.
// Se usan solo porque los hosts oficiales no son alcanzables desde la red de
// la sesión (ver SOURCES.md). Cada fila que sale de una réplica cita la fuente
// OFICIAL (sourceUrl de EUDAMED o de la Comisión) y además, en
// `extra.mirror`, el repo, el commit, la ruta y el sha256 del archivo.
//
// Descubiertas por la sesión `master` y verificadas acá: licencia leída,
// formato inspeccionado y procedencia oficial comprobada en el código o la
// documentación de cada repo.
// =============================================================================

export const MIRRORS = Object.freeze([
  {
    id: 'batirmedical-emdn',
    repo: 'https://github.com/BatirMedical/nomenclature-emdn',
    commit: 'e0131762b3385c1085b97da9c5f74d32edb89df3',
    commitDate: '2025-04-02',
    paths: ['EMDN_BatirMedical.csv', 'README.md', 'RELEASE.md', 'LICENSE'],
    data: 'EMDN_BatirMedical.csv',
    upstream:
      'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
    upstreamVersion: 'EMDN V2 (según RELEASE.md)',
    license:
      'Estructura del repo: MIT. Datos: EMDN de la Comisión Europea, accesible a todos y sin costo; reutilización con atribución (Decisión 2011/833/UE). El README aclara que no es fuente oficial.',
  },
  {
    id: 'zdavatz-eudamed2firstbase',
    repo: 'https://github.com/zdavatz/eudamed2firstbase',
    commit: '48f93836f8ef89ba1ce8d0852de86b271d08b81b',
    commitDate: '2026-10-22',
    paths: ['firstbase_json/processed'],
    data: 'firstbase_json/processed',
    upstream:
      'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/{uuid}?languageIso2Code=en',
    upstreamVersion:
      'detalle UDI-DI + Basic UDI-DI de EUDAMED convertidos a GS1 firstbase (src/transform_detail.rs)',
    license:
      'Código GPL-3.0. Datos: registros públicos de EUDAMED (Comisión Europea), reutilización con atribución (Decisión 2011/833/UE).',
  },
  {
    id: 'dlinrt-eudamed-emdn-discovery',
    repo: 'https://github.com/DLinRT-eu/dlinrteu-website',
    commit: 'f096a477301c8c30c870f69daaedbda87c28e173',
    commitDate: '2026-10-23',
    paths: ['docs/audits/eudamed/2026-09-22-eudamed-emdn-discovery.csv'],
    data: 'docs/audits/eudamed/2026-09-22-eudamed-emdn-discovery.csv',
    upstream:
      'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?cndCode={code}',
    upstreamVersion:
      'consulta al portal de EUDAMED del 2026-09-22 (query_url por fila)',
    license:
      'Repo AGPL-3.0. Datos: registros públicos de EUDAMED, reutilización con atribución (Decisión 2011/833/UE).',
  },
  {
    id: 'longtran-eudamed-manufacturers',
    repo: 'https://github.com/longtran00/EUDAMED_ManufacturersScraper',
    commit: '44ff9f90fb70f561094f324571e0bddd7c85721c',
    commitDate: '2025-02-18',
    paths: ['Eudamed_Manufacturers.xlsx', 'Program.cs'],
    data: 'Eudamed_Manufacturers.xlsx',
    upstream:
      'https://ec.europa.eu/tools/eudamed/#/screen/search-eo?actorTypeCode=refdata.actor-type.manufacturer',
    upstreamVersion:
      'búsqueda pública de actores fabricantes de EUDAMED (Program.cs), exportada al 2025-02-18',
    license:
      'Repo sin licencia declarada (el código no se reutiliza). Datos: registro público de actores de EUDAMED, reutilización con atribución (Decisión 2011/833/UE).',
  },
]);

export const mirrorById = (id) => MIRRORS.find((m) => m.id === id);
