import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CONCEPTS } from '../../../common';
import { LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE } from '../../../common/constants/legal-entity-types';
import { Addresses } from '../../common/entities/addresses.entity';
import { PracticeSites } from '../../practice/entities/practice_sites.entity';
import { Pharmacies } from '../../pharmacy/entities/pharmacies.entity';
import { DiagnosticUnits } from '../../diagnostic_units/entities/diagnostic_units.entity';
import {
  PharmacyOperatingRequirementsService,
  requiredLaboratoryDocuments,
  requiredOperatingDocuments,
  requiredPharmacyDocuments,
} from './pharmacy-operating-requirements.service';

/** Tipo de documento → concepto, como lo resuelve el catálogo sembrado. */
const DOC_TYPES = new Map([
  ['ESCRITURA_CONSTITUCION', 'dt-constitution'],
  ['NIT_EXHIBICION', 'dt-nit'],
  ['MATRICULA_SEPREC', 'dt-seprec'],
  ['LICENCIA_FUNCIONAMIENTO', 'dt-license'],
  ['CERTIFICADO_SEDES', 'dt-sedes'],
  ['PODER_REPRESENTANTE_LEGAL', 'dt-poder'],
]);
const STATUSES = new Map([
  ['PENDIENTE', 'vs-pending'],
  ['VERIFICADO', 'vs-verified'],
  ['RECHAZADO', 'vs-rejected'],
  ['VENCIDO', 'vs-expired'],
]);

/** Un documento vivo del tipo indicado. */
function doc(id: string, type: string, status = 'vs-pending') {
  return {
    id,
    documentTypeConceptId: type,
    verificationStatusConceptId: status,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
  };
}

const ALL_SIX = [
  doc('d1', 'dt-constitution'),
  doc('d2', 'dt-nit'),
  doc('d3', 'dt-seprec'),
  doc('d4', 'dt-license'),
  doc('d5', 'dt-sedes'),
  doc('d6', 'dt-poder'),
];

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @param docs - Documentos del tenant.
 * @param rows - Farmacia, sede y dirección que devuelve `em.findOne`.
 * @returns Resultado de build.
 */
function build(
  docs: unknown[],
  rows: {
    pharmacy?: unknown;
    site?: unknown;
    address?: unknown;
    labUnit?: unknown;
  } = {
    pharmacy: { primaryPracticeSiteId: 'ps-1' },
    site: { addressId: 'a-1' },
    address: { latitude: '-17.78', longitude: '-63.18' },
  },
) {
  const em = {
    findOne: fn(async (entity: unknown) => {
      if (entity === Pharmacies) return rows.pharmacy ?? null;
      if (entity === PracticeSites) return rows.site ?? null;
      if (entity === Addresses) return rows.address ?? null;
      if (entity === DiagnosticUnits) return rows.labUnit ?? null;
      return null;
    }),
    find: fn(async () => docs),
  };
  const legalRepo = { listAffiliationDocsByTenant: fn(async () => docs) };
  const concepts = {
    resolve: fn(async () => ({
      documentType: DOC_TYPES,
      verificationStatus: STATUSES,
    })),
    conceptIdOf: fn((map: Map<string, string>, _vs: string, code: string) =>
      map.get(code)!,
    ),
  };
  const service = new PharmacyOperatingRequirementsService(
    legalRepo as never,
    concepts as never,
  );
  return { service, em };
}

const TENANT = { id: 't-1', legalEntityTypeConceptId: 'le-srl' };

describe('requiredPharmacyDocuments', () => {
  it('exige los seis papeles a una SRL', () => {
    expect(requiredPharmacyDocuments('le-srl')).toEqual([
      'CONSTITUTION_DOC',
      'TAX_IDENTIFIER_DOC',
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
      'POWER_OF_ATTORNEY_DOC',
    ]);
  });

  it('una unipersonal no tiene constitución ni poder (CL-43), pero sí SEDES', () => {
    expect(
      requiredPharmacyDocuments(LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE.UNIPERSONAL),
    ).toEqual([
      'TAX_IDENTIFIER_DOC',
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
    ]);
  });
});

describe('PharmacyOperatingRequirementsService.evaluate', () => {
  it('con los seis papeles y la central con punto, puede operar', async () => {
    const d = build(ALL_SIX);

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res).toEqual({
      ready: true,
      missing: [],
      documentIds: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'],
    });
  });

  it('sin el certificado del SEDES no opera, y lo nombra', async () => {
    const d = build(ALL_SIX.filter((x) => x.id !== 'd5'));

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.ready).toBe(false);
    expect(res.missing).toEqual(['HEALTH_AUTHORITY_CERT_DOC']);
  });

  it('un papel rechazado o vencido no cuenta como presentado', async () => {
    const d = build([
      ...ALL_SIX.filter((x) => x.id !== 'd2' && x.id !== 'd4'),
      doc('d2', 'dt-nit', 'vs-rejected'),
      doc('d4', 'dt-license', 'vs-expired'),
    ]);

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.missing).toEqual([
      'TAX_IDENTIFIER_DOC',
      'OPERATING_LICENSE_DOC',
    ]);
  });

  it('sin punto en la casa central no opera', async () => {
    const d = build(ALL_SIX, {
      pharmacy: { primaryPracticeSiteId: 'ps-1' },
      site: { addressId: 'a-1' },
      address: { latitude: null, longitude: null },
    });

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.missing).toEqual(['HEADQUARTERS_LOCATION']);
  });

  it('una farmacia sin central enlazada (anterior a P50) tampoco', async () => {
    const d = build(ALL_SIX, { pharmacy: {} });

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.missing).toEqual(['HEADQUARTERS_LOCATION']);
  });

  it('un tenant de farmacia sin fila de farmacia lo informa', async () => {
    const d = build(ALL_SIX, {});

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.missing).toEqual(['PHARMACY_RECORD']);
  });

  it('sin ningún papel nombra los seis y el punto', async () => {
    const d = build([], { pharmacy: {} });

    const res = await d.service.evaluate(d.em as never, TENANT);

    expect(res.missing).toEqual([
      'CONSTITUTION_DOC',
      'TAX_IDENTIFIER_DOC',
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
      'POWER_OF_ATTORNEY_DOC',
      'HEADQUARTERS_LOCATION',
    ]);
  });
});

describe('PharmacyOperatingRequirementsService.markDocumentsVerified', () => {
  it('marca VERIFICADO con quién y cuándo', async () => {
    const rows = [doc('d1', 'dt-nit')] as Record<string, unknown>[];
    const d = build(rows);

    await d.service.markDocumentsVerified(d.em as never, ['d1'], 'admin-1');

    expect(rows[0]).toEqual(
      expect.objectContaining({
        verificationStatusConceptId: 'vs-verified',
        verifiedByUserId: 'admin-1',
        verifiedAt: expect.any(Date),
      }),
    );
  });

  it('sin documentos no consulta nada', async () => {
    const d = build([]);

    await d.service.markDocumentsVerified(d.em as never, [], 'admin-1');

    expect(d.em.find).not.toHaveBeenCalled();
  });
});

describe('requisitos del laboratorio (P51)', () => {
  it('exige SEPREC, licencia de funcionamiento y SEDES, sea cual sea el tipo societario', () => {
    expect(requiredLaboratoryDocuments()).toEqual([
      'COMMERCE_REGISTRY_DOC',
      'OPERATING_LICENSE_DOC',
      'HEALTH_AUTHORITY_CERT_DOC',
    ]);
    expect(requiredOperatingDocuments('LABORATORY', 'le-srl')).toEqual(
      requiredLaboratoryDocuments(),
    );
  });

  it('la farmacia sigue exigiendo sus propios papeles', () => {
    expect(requiredOperatingDocuments('PHARMACY', 'le-srl')).toEqual(
      requiredPharmacyDocuments('le-srl'),
    );
  });

  it('con los tres papeles el laboratorio puede operar, sin mirar farmacia ni central', async () => {
    const d = build(
      [doc('d3', 'dt-seprec'), doc('d4', 'dt-license'), doc('d5', 'dt-sedes')],
      {},
    );

    const r = await d.service.evaluate(d.em as never, TENANT, 'LABORATORY');

    expect(r).toEqual({
      ready: true,
      missing: [],
      documentIds: ['d3', 'd4', 'd5'],
    });
  });

  it('un SEDES vencido no cuenta y el laboratorio no opera', async () => {
    const d = build(
      [
        doc('d3', 'dt-seprec'),
        doc('d4', 'dt-license'),
        doc('d5', 'dt-sedes', 'vs-expired'),
      ],
      {},
    );

    const r = await d.service.evaluate(d.em as never, TENANT, 'LABORATORY');

    expect(r.ready).toBe(false);
    expect(r.missing).toEqual(['HEALTH_AUTHORITY_CERT_DOC']);
  });

  it('kindOf: farmacia, laboratorio con unidad de laboratorio, y nada para lo demás', async () => {
    const conLab = build([], { labUnit: { id: 'u-1' } });
    const sinLab = build([], {});

    expect(
      await conLab.service.kindOf(conLab.em as never, {
        id: 't',
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PHARMACY,
      }),
    ).toBe('PHARMACY');
    expect(
      await conLab.service.kindOf(conLab.em as never, {
        id: 't',
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
      }),
    ).toBe('LABORATORY');
    // Centro de imágenes o sin unidad: sin requisitos.
    expect(
      await sinLab.service.kindOf(sinLab.em as never, {
        id: 't',
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
      }),
    ).toBeUndefined();
    expect(
      await sinLab.service.kindOf(sinLab.em as never, {
        id: 't',
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_HOSPITAL,
      }),
    ).toBeUndefined();
  });
});
