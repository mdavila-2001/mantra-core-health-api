// =============================================================================
// Fuentes propias de `master/` (las de las regiones vienen por git, ver
// `regions.mjs`). Cada una fija repositorio, commit y sha256 de cada archivo:
// `fetch-sources.mjs` se niega a usar un archivo cuyo hash no coincide.
//
// Por qué copias en git: desde este entorno la FDA, la Comisión Europea, la NLM,
// GLEIF y Wikidata responden 403 al proxy (ver SOURCES.md, «Huecos»). Solo se
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

/** `sourceVersion` de un archivo espejo: sha del commit + fecha del commit. */
export const mirrorVersion = (mirrorKey) => {
  const m = MIRRORS[mirrorKey];
  return `git:${m.repo.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '')}@${m.commit.slice(0, 12)} (${m.commitDate.slice(0, 10)})`;
};

export const mirrorFilePath = (mirrorKey, fileKey) =>
  resolve(CACHE_DIR, mirrorKey, MIRRORS[mirrorKey].files[fileKey].path);
