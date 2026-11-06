import { describe, expect, it, jest } from '@jest/globals';
import { PreconditionFailedException, runWithTenant } from '../../../common';
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
// Doble: el value set `bone-type` lo materializa la API desde DYNAMIC_ENUM_CATALOG; acá se declara con un miembro.
const HUESO_LARGO = 'bone-long';
const UBERON_MANO = 'UBERON:0002398';

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
  'bone-type': [HUESO_LARGO],
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

  describe('región marcada en el modelo 3D (Uberon, malla, tipo de hueso)', () => {
    it('correcto: estructura, malla y tipo de hueso viajan hasta lo preparado', async () => {
      const { service } = build();
      const out = await service.prepare(em, {
        codeConceptId: RX_MANO,
        imaging: {
          bodySiteConceptId: MANO,
          bodyStructureUberon: UBERON_MANO,
          bodyMeshId: 'BP44',
          boneTypeConceptId: HUESO_LARGO,
        },
      });
      expect(out).toMatchObject({
        bodyStructureUberon: UBERON_MANO,
        bodyMeshId: 'BP44',
        boneTypeConceptId: HUESO_LARGO,
        bodySiteConceptId: MANO,
      });
    });

    it('la estructura UBERON no reemplaza a la región: sigue siendo BODY_SITE_REQUIRED y la lateralidad exige región', async () => {
      const { service } = build();
      const sinRegion = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodyStructureUberon: UBERON_MANO },
        }),
      );
      expect(sinRegion.reason).toBe(StudyDetailReason.BODY_SITE_REQUIRED);
      const lateralidad = await failure(
        service.prepare(
          em,
          {
            codeConceptId: 'rx-heredado',
            categoryConceptId: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
            imaging: {
              bodyStructureUberon: UBERON_MANO,
              lateralityConceptId: IZQ,
            },
          },
          { catalog: 'skip' },
        ),
      );
      expect(lateralidad.reason).toBe(
        StudyDetailReason.LATERALITY_REQUIRES_BODY_SITE,
      );
    });

    it('los campos planos del alta se unen a imaging y valen igual', async () => {
      const { service } = build();
      const out = await service.prepare(em, {
        codeConceptId: RX_MANO,
        flat: {
          bodyStructureUberon: UBERON_MANO,
          boneTypeConceptId: HUESO_LARGO,
        },
        imaging: { bodySiteConceptId: MANO },
      });
      expect(out).toMatchObject({
        bodySiteConceptId: MANO,
        bodyStructureUberon: UBERON_MANO,
        boneTypeConceptId: HUESO_LARGO,
      });
    });

    it('un campo plano que contradice el de imaging: 422 IMAGING_FIELD_CONFLICT', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          flat: { bodySiteConceptId: TORAX },
          imaging: { bodySiteConceptId: MANO },
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.IMAGING_FIELD_CONFLICT,
        field: 'bodySiteConceptId',
      });
    });

    it('muestra más campos planos de imagen también son excluyentes', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: GLICEMIA,
          specimenTypeConceptId: TUBO,
          flat: { bodyMeshId: 'BP44' },
        }),
      );
      expect(d.reason).toBe(
        StudyDetailReason.SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE,
      );
    });

    it('límite: 12 dígitos pasan, 13 no', async () => {
      const { service } = build();
      await expect(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: {
            bodySiteConceptId: MANO,
            bodyStructureUberon: 'UBERON:123456789012',
          },
        }),
      ).resolves.toBeDefined();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: {
            bodySiteConceptId: MANO,
            bodyStructureUberon: 'UBERON:1234567890123',
          },
        }),
      );
      expect(d.reason).toBe(StudyDetailReason.BODY_STRUCTURE_FORMAT_INVALID);
    });

    it.each([
      'uberon:1',
      'UBERON:',
      'UBERON:abc',
      'BP3D:44',
      'FMA:37463',
      'UBERON:1 ',
      '',
    ])('inválido: estructura %p', async (bad) => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodySiteConceptId: MANO, bodyStructureUberon: bad },
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.BODY_STRUCTURE_FORMAT_INVALID,
        field: 'imaging.bodyStructureUberon',
      });
    });

    it.each(['BP 44', '', 'BP44;drop', 'x'.repeat(65)])(
      'inválido: malla %p',
      async (bad) => {
        const { service } = build();
        const d = await failure(
          service.prepare(em, {
            codeConceptId: RX_MANO,
            imaging: { bodySiteConceptId: MANO, bodyMeshId: bad },
          }),
        );
        expect(d.reason).toBe(StudyDetailReason.BODY_MESH_ID_FORMAT_INVALID);
      },
    );

    it('límite: malla de 64 caracteres pasa', async () => {
      const { service } = build();
      await expect(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { bodySiteConceptId: MANO, bodyMeshId: 'a'.repeat(64) },
        }),
      ).resolves.toBeDefined();
    });

    it('el tipo de hueso exige región o estructura UBERON', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: { boneTypeConceptId: HUESO_LARGO },
        }),
      );
      // Un estudio de imagen del catálogo exige la región antes que el hueso.
      expect(d.reason).toBe(StudyDetailReason.BODY_SITE_REQUIRED);
      const sinCatalogo = await failure(
        service.prepare(
          em,
          {
            codeConceptId: 'rx-heredado',
            categoryConceptId: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
            imaging: { boneTypeConceptId: HUESO_LARGO },
          },
          { catalog: 'skip' },
        ),
      );
      expect(sinCatalogo.reason).toBe(
        StudyDetailReason.BONE_TYPE_REQUIRES_BODY_STRUCTURE,
      );
    });

    it('la estructura UBERON alcanza como ubicación para el tipo de hueso; la malla sola no', async () => {
      const { service } = build();
      const base = {
        codeConceptId: 'rx-heredado',
        categoryConceptId: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
      };
      const out = await service.prepare(
        em,
        {
          ...base,
          imaging: {
            bodyStructureUberon: UBERON_MANO,
            boneTypeConceptId: HUESO_LARGO,
          },
        },
        { catalog: 'skip' },
      );
      expect(out.boneTypeConceptId).toBe(HUESO_LARGO);
      const d = await failure(
        service.prepare(
          em,
          {
            ...base,
            imaging: { bodyMeshId: 'BP44', boneTypeConceptId: HUESO_LARGO },
          },
          { catalog: 'skip' },
        ),
      );
      expect(d.reason).toBe(
        StudyDetailReason.BONE_TYPE_REQUIRES_BODY_STRUCTURE,
      );
    });

    it('el tipo de hueso debe ser del value set bone-type', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          imaging: {
            bodySiteConceptId: MANO,
            boneTypeConceptId: 'no-es-un-hueso',
          },
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.BONE_TYPE_NOT_IN_CATALOG,
        field: 'imaging.boneTypeConceptId',
        catalog: 'bone-type',
      });
    });

    it('en laboratorio, la estructura o el hueso son campos de imagen no permitidos', async () => {
      const { service } = build();
      for (const imaging of [
        { bodyStructureUberon: UBERON_MANO },
        { bodyMeshId: 'BP44' },
        { boneTypeConceptId: HUESO_LARGO },
      ]) {
        const d = await failure(
          service.prepare(em, { codeConceptId: GLICEMIA, imaging }),
        );
        expect(d.reason).toBe(StudyDetailReason.IMAGING_FIELDS_NOT_ALLOWED);
      }
    });

    it('laboratorio con muestra y datos de imagen: 422 SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: GLICEMIA,
          specimenTypeConceptId: TUBO,
          imaging: { bodyMeshId: 'BP44' },
        }),
      );
      expect(d).toMatchObject({
        reason: StudyDetailReason.SPECIMEN_AND_IMAGING_FIELDS_EXCLUSIVE,
        field: 'specimenTypeConceptId',
      });
    });

    it('imagen con muestra: sigue siendo SPECIMEN_NOT_ALLOWED_FOR_CATEGORY (motivo existente, sin cambio)', async () => {
      const { service } = build();
      const d = await failure(
        service.prepare(em, {
          codeConceptId: RX_MANO,
          specimenTypeConceptId: TUBO,
          imaging: { bodyMeshId: 'BP44' },
        }),
      );
      expect(d.reason).toBe(
        StudyDetailReason.SPECIMEN_NOT_ALLOWED_FOR_CATEGORY,
      );
    });

    it('un imaging vacío no choca con la muestra', async () => {
      const { service } = build();
      const out = await service.prepare(em, {
        codeConceptId: GLICEMIA,
        specimenTypeConceptId: TUBO,
        imaging: {},
      });
      expect(out.specimenTypeConceptId).toBe(TUBO);
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
  it('copia el custodio de la orden, numera desde 1 y fija el tenant activo en la transacción', async () => {
    const { service } = build();
    const created: any[] = [];
    const execute = mockFn(async () => undefined);
    const tx = {
      create: (_e: any, data: any) => created.push(data),
      execute,
    } as any;
    await runWithTenant('tenant-1', () =>
      service.writeComponents(
        tx,
        { id: 'sr-1', custodianTenantId: 'tenant-1' },
        [PLAQ, HB],
        'user-1',
      ),
    );
    expect(execute).toHaveBeenCalledWith(
      "select set_config('app.current_tenant_id', ?, true)",
      ['tenant-1'],
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

describe('ServiceRequestDetailService.describe (RLS de los componentes)', () => {
  /** El servicio con un lector de designaciones vacío (los nombres caen al `display`). */
  const build = () => ({
    service: new ServiceRequestDetailService(
      {} as any,
      {
        findPreferredByLanguageForConcepts: mockFn(async () => new Map()),
      } as any,
    ),
  });

  const requests = [
    {
      id: 'sr-1',
      codeConceptId: HEMOGRAMA,
      custodianTenantId: 'tenant-1',
    },
  ] as any;
  const row = { serviceRequestId: 'sr-1', componentConceptId: HB, ordinal: 1 };

  /** Un `em` que sólo sabe leer componentes; los conceptos nombrados salen vacíos. */
  function emWith(inTransaction: boolean) {
    const find = mockFn(async (entity: any) =>
      entity.name === 'ServiceRequestComponents' ? [row] : [],
    );
    const execute = mockFn(async () => undefined);
    const tx = { find, execute };
    const transactional = mockFn(async (cb: any) => cb(tx));
    const em = {
      isInTransaction: () => inTransaction,
      find,
      fork: () => ({ transactional }),
    } as any;
    return { em, execute, transactional, find };
  }

  it('sobre un fork (sin transacción) abre la suya y fija el tenant ACTIVO antes de leer', async () => {
    const { service } = build();
    const { em, execute, transactional } = emWith(false);
    const views = await runWithTenant('tenant-1', () =>
      service.describe(em, requests),
    );
    expect(transactional).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      "select set_config('app.current_tenant_id', ?, true)",
      ['tenant-1'],
    );
    expect(views.get('sr-1')?.componentsSpecified).toBe(true);
  });

  it('dentro de la transacción del alta lee con la misma conexión (ve lo recién escrito)', async () => {
    const { service } = build();
    const { em, transactional } = emWith(true);
    const views = await service.describe(em, requests);
    expect(transactional).not.toHaveBeenCalled();
    expect(views.get('sr-1')?.components).toHaveLength(1);
  });
});
