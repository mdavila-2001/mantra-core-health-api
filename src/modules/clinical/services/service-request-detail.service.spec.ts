import { describe, expect, it, jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { CLIN } from '../clinical.concepts';
import { DIAG } from '../../diagnostics/diagnostics.concepts';
import { StudyDetailReason } from '../clinical.error-reasons';
import type {
  StudyCatalogEntry,
  StudyCatalogPort,
  StudyValueSetCode,
} from '../study-catalog.port';
import { ServiceRequestDetailService } from './service-request-detail.service';

/** Doble simple de `jest.fn` sin tipos genéricos. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const HEMOGRAMA = 'study-hemograma';
const GLICEMIA = 'study-glicemia';
const RX_MANO = 'study-rx-mano';
const RX_TORAX = 'study-rx-torax';
const HB = 'comp-hb';
const HTO = 'comp-hto';
const PLAQ = 'comp-plaq';
const TUBO = 'specimen-edta';
const MOD_RX = 'mod-rx';
const MOD_TC = 'mod-tc';
const MANO = 'site-mano';
const TORAX = 'site-torax';
const IZQ = 'lat-izq';
const CONTRASTE = 'contrast-iv';

const STUDIES: Record<string, StudyCatalogEntry> = {
  [HEMOGRAMA]: {
    conceptId: HEMOGRAMA,
    family: 'LAB',
    componentsSelectable: true,
    modalityConceptId: null,
  },
  [GLICEMIA]: {
    conceptId: GLICEMIA,
    family: 'LAB',
    componentsSelectable: false,
    modalityConceptId: null,
  },
  [RX_MANO]: {
    conceptId: RX_MANO,
    family: 'IMAGING',
    componentsSelectable: false,
    modalityConceptId: MOD_RX,
  },
  [RX_TORAX]: {
    conceptId: RX_TORAX,
    family: 'IMAGING',
    componentsSelectable: false,
    modalityConceptId: null,
  },
};
const SETS: Record<StudyValueSetCode, string[]> = {
  'service-request-code': [],
  'service-request-imaging-modality': [MOD_RX, MOD_TC],
  'imaging-body-structure': [MANO, TORAX],
  'imaging-contrast': [CONTRASTE],
  'specimen-type': [TUBO],
  'condition-laterality': [IZQ],
};

function build() {
  const port: StudyCatalogPort = {
    findStudy: mockFn(async (_em: any, id: string) => STUDIES[id] ?? null),
    panelComponentIds: mockFn(async () => new Set([HB, HTO, PLAQ])),
    isInValueSet: mockFn(async (_em: any, set: StudyValueSetCode, id: string) =>
      SETS[set].includes(id),
    ),
    findBodySite: mockFn(async (_em: any, id: string) =>
      id === MANO
        ? { conceptId: MANO, lateralizable: true }
        : id === TORAX
          ? { conceptId: TORAX, lateralizable: false }
          : null,
    ),
  };
  const service = new ServiceRequestDetailService(port, {} as any);
  return { service, port };
}

/** Captura el 422 y devuelve sus detalles. */
async function failure(p: Promise<unknown>): Promise<Record<string, any>> {
  try {
    await p;
  } catch (error) {
    expect(error).toBeInstanceOf(PreconditionFailedException);
    return (error as PreconditionFailedException).details ?? {};
  }
  throw new Error('se esperaba un 422');
}

const em = {} as any;

describe('ServiceRequestDetailService.prepare', () => {
  describe('correcto', () => {
    it('hemograma con tres componentes marcados y muestra: los conserva en orden', async () => {
      const { service } = build();
      const out = await service.prepare(em, {
        codeConceptId: HEMOGRAMA,
        specimenTypeConceptId: TUBO,
        componentConceptIds: [PLAQ, HB, HTO],
      });
      expect(out.componentConceptIds).toEqual([PLAQ, HB, HTO]);
      expect(out.specimenTypeConceptId).toBe(TUBO);
      // Sin categoría en el alta: la que el catálogo da al estudio.
      expect(out.categoryConceptId).toBe(CLIN.SERVICE_REQUEST_CATEGORY_LAB);
    });

    it('RX de mano izquierda: toma la modalidad del estudio si el alta no la trae', async () => {
      const { service } = build();
      const out = await service.prepare(em, {
        codeConceptId: RX_MANO,
        imaging: { bodySiteConceptId: MANO, lateralityConceptId: IZQ },
      });
      expect(out).toMatchObject({
        modalityConceptId: MOD_RX,
        bodySiteConceptId: MANO,
        lateralityConceptId: IZQ,
      });
      expect(out.categoryConceptId).toBe(DIAG.SERVICE_REQUEST_CATEGORY_IMAGING);
    });

    it('catalog skip: un código fuera de service-request-code pasa (llamadores internos)', async () => {
      const { service } = build();
      const out = await service.prepare(
        em,
        { codeConceptId: 'procedimiento-x' },
        { catalog: 'skip' },
      );
      expect(out.componentConceptIds).toEqual([]);
    });
  });

  describe('V1 y V2', () => {
    it('V1: estudio fuera del catálogo', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, { codeConceptId: 'cualquier-uuid' }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.STUDY_NOT_IN_CATALOG,
        field: 'codeConceptId',
      });
    });

    it('V2: categoría LAB para un estudio de imagen (la familia sale del catálogo, no del prefijo)', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.SERVICE_REQUEST_CATEGORY_STUDY_MISMATCH,
        studyFamily: 'IMAGING',
      });
    });
  });

  describe('V3', () => {
    it('muestra en una orden de imagen', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_TORAX,
          specimenTypeConceptId: TUBO,
          imaging: { bodySiteConceptId: TORAX },
        }),
      );
      expect(d.reason).toBe(
        StudyDetailReason.SPECIMEN_NOT_ALLOWED_FOR_CATEGORY,
      );
    });

    it('muestra que no es de specimen-type', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: GLICEMIA,
          specimenTypeConceptId: 'estado-activo',
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.SPECIMEN_TYPE_NOT_IN_CATALOG);
    });
  });

  describe('V4 (D3: los marcados; vacío = 422)', () => {
    it('panel desplegable sin componentConceptIds', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, { codeConceptId: HEMOGRAMA }),
      );
      expect(d.reason).toBe(StudyDetailReason.COMPONENTS_EMPTY);
    });

    it('panel desplegable con lista vacía', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: HEMOGRAMA,
          componentConceptIds: [],
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.COMPONENTS_EMPTY);
    });

    it('estudio que no es panel con componentes', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: GLICEMIA,
          componentConceptIds: [HB],
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.COMPONENTS_NOT_SELECTABLE);
    });

    it('componente ajeno al panel: lista cuáles', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: HEMOGRAMA,
          componentConceptIds: [HB, 'ajeno'],
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.COMPONENT_NOT_IN_PANEL,
        componentConceptIds: ['ajeno'],
      });
    });
  });

  describe('V5 a V9 (imagen)', () => {
    it('V5: campos de imagen en laboratorio', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: GLICEMIA,
          imaging: { bodySiteConceptId: MANO },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.IMAGING_FIELDS_NOT_ALLOWED);
    });

    it('V5: estudio de imagen sin modalidad en el catálogo ni en el alta', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_TORAX,
          imaging: { bodySiteConceptId: TORAX },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.MODALITY_REQUIRED);
    });

    it('V6: modalidad fuera de catálogo', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_TORAX,
          imaging: { modalityConceptId: 'otra', bodySiteConceptId: TORAX },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.MODALITY_NOT_IN_CATALOG);
    });

    it('V6: modalidad distinta de la del estudio', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { modalityConceptId: MOD_TC, bodySiteConceptId: MANO },
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.MODALITY_STUDY_MISMATCH,
        studyModalityConceptId: MOD_RX,
      });
    });

    it('V7: sin región', async () => {
      const { service } = build();
      const d = await failure(service.prepare(em, { codeConceptId: RX_MANO }));
      expect(d.reason).toBe(StudyDetailReason.BODY_SITE_REQUIRED);
    });

    it('V7: región fuera de catálogo', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodySiteConceptId: 'cualquiera' },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.BODY_SITE_NOT_IN_CATALOG);
    });

    it('V8: lateralidad fuera de catálogo', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodySiteConceptId: MANO, lateralityConceptId: 'x' },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.LATERALITY_NOT_IN_CATALOG);
    });

    it('V8: lateralidad en una región impar (tórax)', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_TORAX,
          imaging: {
            modalityConceptId: MOD_RX,
            bodySiteConceptId: TORAX,
            lateralityConceptId: IZQ,
          },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.LATERALITY_NOT_APPLICABLE);
    });

    it('V9: contraste fuera de catálogo', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodySiteConceptId: MANO, contrastConceptId: 'x' },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.CONTRAST_NOT_IN_CATALOG);
    });

    it('V9: contraste sin modalidad (estudio sin modalidad fija)', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_TORAX,
          imaging: { bodySiteConceptId: TORAX, contrastConceptId: CONTRASTE },
        }),
      );
      // La modalidad obligatoria se evalúa antes que el contraste.
      expect(d.reason).toBe(StudyDetailReason.MODALITY_REQUIRED);
    });
  });

  it('todo 422 nuevo lleva reason y field en details, no como tercer argumento', async () => {
    const { service } = build();
    try {
      await service.prepare(em, { codeConceptId: 'nope' });
    } catch (error) {
      const e = error as PreconditionFailedException;
      expect(e.reason).toBeUndefined();
      expect(e.details).toMatchObject({
        reason: expect.any(String),
        field: expect.any(String),
      });
    }
  });
});

describe('ServiceRequestDetailService.writeComponents', () => {
  it('copia el custodio de la orden y numera desde 1 en el orden recibido', () => {
    const { service } = build();
    const created: any[] = [];
    const tx = { create: (_e: any, data: any) => created.push(data) } as any;
    service.writeComponents(
      tx,
      { id: 'sr-1', custodianTenantId: 'tenant-1' },
      [PLAQ, HB],
      'user-1',
    );
    expect(created).toEqual([
      expect.objectContaining({
        serviceRequestId: 'sr-1',
        custodianTenantId: 'tenant-1',
        componentConceptId: PLAQ,
        ordinal: 1,
        createdByUserId: 'user-1',
      }),
      expect.objectContaining({ componentConceptId: HB, ordinal: 2 }),
    ]);
  });
});
