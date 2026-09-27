import { CHART } from '../chart/chart.concepts';
import { PROF } from './profiles.concepts';

/**
 * Los conceptos que el paquete de seeds del modelo (v4.2.30, `M7_CATALOGS` en
 * `salud-db/gen_seeds.py`) publica para los catálogos de cuidados y las
 * jurisdicciones son **los mismos ids** que la API declara con la misma clave:
 * `deterministicId('<módulo>:<CLAVE>')`. Si alguien renombra una clave de la
 * API, el catálogo del modelo apuntaría a un concepto que la API no conoce.
 * Los ids de abajo están copiados del `03_terminology.seeds.json` del modelo.
 */
const MODEL_CHART_IDS: Record<string, string> = {
  CAREPLAN_INTENT_PLAN: 'afcb5210-52da-5e5b-b781-869c399da9c6',
  CAREPLAN_INTENT_PROPOSAL: '984cb111-50f6-509b-bf6b-62f51054f9c0',
  CAREPLAN_INTENT_ORDER: 'e12c2039-b82a-5bc7-9f76-09d53f33eee4',
  CAREPLAN_INTENT_OPTION: 'bce9856d-a3fe-50a3-8ef8-4c3bf3fcaed2',
  ACTIVITY_DEFAULT: '1720abda-98f0-5aba-909a-3ef1d06fa9dd',
  ACTIVITY_CLASS_CONTROL: '1c4183b4-29db-58a2-94da-88401aed4c91',
  ACTIVITY_CLASS_STUDY: '388ebcc0-e288-5c62-861b-bac2b436f1c0',
  ACTIVITY_CLASS_TREATMENT: 'b16c9d1b-14cb-50cc-8e8e-42d30fa762cd',
  ACTIVITY_CLASS_EDUCATION: '5221123a-ca8f-5ab8-b839-6556415947fd',
  ACTIVITY_CLASS_REFERRAL: 'fabaec2d-9b33-5ad9-b1c2-370412ad0f96',
  DOC_CATEGORY_GENERAL: 'b53e6248-fab7-5dc3-b1e6-2f7d0051ac78',
  DOC_CATEGORY_REPORT: 'f17469b2-0ffd-5b5d-a7df-af94c31cc3c4',
  DOC_CATEGORY_LAB: '0b1e27d9-d3df-5722-a5cf-6f144cde0394',
  DOC_CATEGORY_IMAGING: '75d488a2-1113-5c0d-b256-635442124015',
  DOC_CATEGORY_CONSENT: '7ea63f0b-606c-53b2-aaf3-a68e99e54a0a',
  DOC_CATEGORY_CERTIFICATE: '59fa4768-4a10-5e96-9251-9f5f85b21b03',
  DOC_CATEGORY_DISCHARGE: '4b48ee49-efd5-5c34-ab84-90a954e390fe',
};

const MODEL_PROFILES_IDS: Record<string, string> = {
  JURISDICTION_SEDES_CHUQUISACA: '5e8ff3c0-0b07-5dbf-b826-f90fa775fc8d',
  JURISDICTION_SEDES_LA_PAZ: 'a1e6e5c1-c3d3-5641-bd7a-73b1039dea19',
  JURISDICTION_SEDES_COCHABAMBA: '75b332b7-c715-51ab-a7b9-ddb92e762a52',
  JURISDICTION_SEDES_ORURO: '657d4237-462c-5894-8186-74728924c295',
  JURISDICTION_SEDES_POTOSI: '0202a60d-7e79-546d-9f2a-24ad25dd097f',
  JURISDICTION_SEDES_TARIJA: '94eaa8c6-9730-5559-9e4c-cf1e6355eaa2',
  JURISDICTION_SEDES_BENI: '1dd629d9-a138-5bee-badf-96d958167e89',
  JURISDICTION_SEDES_PANDO: 'bdeb2178-90e5-57f5-9b15-7862df198423',
};

describe('conceptos compartidos con el paquete de seeds del modelo (CL-25, ID-09)', () => {
  it.each(Object.entries(MODEL_CHART_IDS))(
    'chart:%s tiene el mismo id que en el modelo',
    (key, id) => {
      expect((CHART as Record<string, string>)[key]).toBe(id);
    },
  );

  it.each(Object.entries(MODEL_PROFILES_IDS))(
    'profiles:%s tiene el mismo id que en el modelo',
    (key, id) => {
      expect((PROF as Record<string, string>)[key]).toBe(id);
    },
  );
});
