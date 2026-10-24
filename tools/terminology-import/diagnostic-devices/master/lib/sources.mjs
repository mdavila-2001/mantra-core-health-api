// =============================================================================
// Fuentes propias de `master/` (las de las regiones vienen por git, ver
// `regions.mjs`). Cada una fija repositorio, commit y sha256 de cada archivo:
// `fetch-sources.mjs` se niega a usar un archivo cuyo hash no coincide.
//
// Por qué copias en git: hasta la pasada 10 la FDA, la Comisión Europea, la NLM,
// GLEIF y Wikidata respondían 403 al proxy (ver SOURCES.md, «Huecos»); desde
// la pasada 11 hay descargas oficiales en `OFFICIAL`. Solo se
// usan copias que reproducen el archivo oficial con su cabecera original; la
// URL oficial queda en `officialUrl` y es la que se cita en cada fila.
// =============================================================================

import { resolve } from 'node:path';
import { BUILD_DIR } from '../../../lib/glossary-es/common.mjs';

export const CACHE_DIR = resolve(
  BUILD_DIR,
  'diagnostic-devices-master',
  'cache',
);

export const MIRRORS = Object.freeze({
  'ej86-fda-ai': {
    repo: 'https://github.com/ej86/fda-ai-medical-device-analytics.git',
    commit: '8840a03632ffdc346a8bf05a459236c913b9198c',
    commitDate: '2026-08-28T23:08:44+09:00',
    license:
      'Sin licencia declarada en el repositorio; el contenido son datos públicos de la FDA (obra del Gobierno de EE. UU., dominio público, 17 U.S.C. § 105).',
    files: {
      foiclass: {
        path: 'foiclass.csv',
        sha256:
          'ed54a12fe6ff0a5208146f1ec5829d248eac9b1dfec231db9677cc633d5b13de',
        source: 'fda-pcd',
        name: 'FDA Product Classification Database (foiclass)',
        officialUrl:
          'https://www.fda.gov/medical-devices/classify-your-medical-device/download-product-code-classification-files',
        rows: 7088,
      },
      aiml: {
        path: 'aiml-devices-csv.csv',
        sha256:
          '4da0d15a1dcc7b6a7d45364f243e85aa4407ba3b63b6922a16fdbf96fea0d41d',
        source: 'fda-ai-enabled-devices',
        name: 'FDA Artificial Intelligence-Enabled Medical Devices list',
        officialUrl:
          'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices',
        rows: 1524,
      },
    },
  },
  'batirmedical-emdn': {
    repo: 'https://github.com/BatirMedical/nomenclature-emdn.git',
    commit: 'e0131762b3385c1085b97da9c5f74d32edb89df3',
    commitDate: '2025-04-02T22:15:06+02:00',
    license:
      'Repositorio MIT; los datos son la EMDN de la Comisión Europea («EMDN Version 2, as published by the European Commission», RELEASE.md), de libre acceso y reutilización.',
    files: {
      emdn: {
        path: 'EMDN_BatirMedical.csv',
        sha256:
          '7972865360a3d8d61dcf6b2e4969e107a0413768febfd3f24ec00302d954e379',
        source: 'ec-emdn',
        name: 'European Medical Device Nomenclature (EMDN), versión 2',
        officialUrl:
          'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
        rows: 8453,
      },
    },
  },
  // Segunda copia independiente de la misma EMDN V2: solo se usa para verificar
  // que la primera reproduce el archivo (mismos códigos, términos y niveles).
  'lisadonlon-emdn': {
    repo: 'https://github.com/lisadonlon/GMDNEMDN.git',
    commit: 'ef6086489b942d96ff0d2e18f9f1f8434a94f954',
    commitDate: '2025-10-30T21:33:12+00:00',
    license: 'Repositorio MIT; datos EMDN de la Comisión Europea.',
    files: {
      emdn: {
        path: 'data/EMDN.txt',
        sha256:
          '033572eb47bb3f595c3fd9b1e8494680fd2dd189c4ee21261b4d64e3cab26f3f',
        source: 'ec-emdn',
        name: 'EMDN V2 (copia de verificación, separada por tabuladores)',
        officialUrl:
          'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
        rows: 8453,
      },
    },
  },
});

/**
 * Descargas oficiales fijadas por sha256 (desde la pasada 11 la red del entorno
 * llega a openFDA). La URL siempre sirve la última exportación: si cambia el
 * hash, `fetch-sources.mjs` avisa y no la usa, y `build.mjs` vuelve a la copia
 * en git. Para adoptar una exportación nueva se actualiza el pin.
 */
export const OFFICIAL = Object.freeze({
  'openfda-device-classification': {
    url: 'https://download.open.fda.gov/device/classification/device-classification-0001-of-0001.json.zip',
    index: 'https://api.fda.gov/download.json',
    exportDate: '2026-10-21',
    extract: 'unzip',
    downloadSha256:
      '0141400f49b9f2e8f075eabb8d0a841123e5904be061fab8addb42229b6bfa3d',
    path: 'device-classification-0001-of-0001.json',
    sha256: '36518da242de3d516c2a3de7ba35bc1a1f97f5d3160740b42e3c072e181c04e4',
    records: 7096,
    source: 'fda-pcd',
    name: 'FDA Product Classification Database (openFDA device/classification)',
    officialUrl:
      'https://www.fda.gov/medical-devices/classify-your-medical-device/download-product-code-classification-files',
    license:
      'openFDA: dominio público, dedicación CC0 1.0 (https://open.fda.gov/license/).',
  },
  // El Excel se pasa a CSV con `extract-emdn-xlsx.py` (solo cambia el nombre
  // de las columnas; los valores van verbatim).
  'ec-emdn-2026': {
    url: 'https://webgate.ec.europa.eu/dyna2/emdn/build/EMDN%20v2026_EN..xlsx',
    index: 'https://webgate.ec.europa.eu/dyna2/emdn/M90',
    exportDate: 'v2026',
    extract: 'emdn-xlsx',
    downloadSha256:
      'a973dcdd8ae291248c9d06d355d3cc859d89a5584004db9354721c9c596bc1bd',
    path: 'emdn-v2026.csv',
    sha256: 'd6f512dc26230c0867e670646ba62d19eca12acca04b0600e1b7ca47ffd659c6',
    records: 8516,
    source: 'ec-emdn',
    name: 'European Medical Device Nomenclature (EMDN), versión 2026',
    officialUrl:
      'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
    license:
      '© Unión Europea; CC BY 4.0 (aviso legal de la Comisión, https://commission.europa.eu/legal-notice_en, Decisión 2011/833/UE). Cambio: Excel → CSV con las columnas renombradas.',
  },
});

export const officialFilePath = (key) =>
  resolve(CACHE_DIR, key, OFFICIAL[key].path);

/** `sourceVersion` de un archivo espejo: sha del commit + fecha del commit. */
export const mirrorVersion = (mirrorKey) => {
  const m = MIRRORS[mirrorKey];
  return `git:${m.repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')}@${m.commit.slice(0, 12)} (${m.commitDate.slice(0, 10)})`;
};

export const mirrorFilePath = (mirrorKey, fileKey) =>
  resolve(CACHE_DIR, mirrorKey, MIRRORS[mirrorKey].files[fileKey].path);
