import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateServiceRequestDto } from './service-request.dto';
import { CreateRequisitionDto } from './requisition.dto';

const ID = (n: number) =>
  `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const TENANT = ID(1);
const PATIENT = ID(2);
const STUDY = ID(3);
const OPTS = { whitelist: true, forbidNonWhitelisted: true } as const;

/** Rutas de propiedad con error (anidadas con punto). */
async function paths(
  cls: any,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain) as object, OPTS);
  const out: string[] = [];
  const walk = (list: any[], prefix: string) => {
    for (const e of list) {
      const p = prefix ? `${prefix}.${e.property}` : e.property;
      if (e.constraints) out.push(p);
      if (e.children?.length) walk(e.children, p);
    }
  };
  walk(errors, '');
  return out.sort();
}

const head = { custodianTenantId: TENANT, patientProfileId: PATIENT };

describe('CreateServiceRequestDto — detalle v4.2.80 (aditivo)', () => {
  const base = { ...head, codeConceptId: STUDY };

  it('el cuerpo anterior, sin campos nuevos, sigue siendo válido', async () => {
    expect(await paths(CreateServiceRequestDto, base)).toEqual([]);
  });

  it('acepta muestra, componentes e imagen', async () => {
    expect(
      await paths(CreateServiceRequestDto, {
        ...base,
        specimenTypeConceptId: ID(4),
        componentConceptIds: [ID(5), ID(6)],
        imaging: {
          modalityConceptId: ID(7),
          bodySiteConceptId: ID(8),
          lateralityConceptId: ID(9),
          contrastConceptId: ID(1),
        },
      }),
    ).toEqual([]);
  });

  it('rechaza componentes repetidos, no uuid, y claves desconocidas dentro de imaging', async () => {
    expect(
      await paths(CreateServiceRequestDto, {
        ...base,
        componentConceptIds: [ID(5), ID(5)],
      }),
    ).toEqual(['componentConceptIds']);
    expect(
      await paths(CreateServiceRequestDto, {
        ...base,
        componentConceptIds: ['no-uuid'],
      }),
    ).toEqual(['componentConceptIds']);
    expect(
      await paths(CreateServiceRequestDto, {
        ...base,
        imaging: { regionLibre: 'mano' },
      }),
    ).toEqual(['imaging.regionLibre']);
  });

  it('la lista vacía pasa el DTO: es el servicio quien responde 422 COMPONENTS_EMPTY', async () => {
    expect(
      await paths(CreateServiceRequestDto, {
        ...base,
        componentConceptIds: [],
      }),
    ).toEqual([]);
  });
});

describe('CreateRequisitionDto', () => {
  const item = { codeConceptId: STUDY };

  it('válido: un renglón mínimo', async () => {
    expect(
      await paths(CreateRequisitionDto, { ...head, items: [item] }),
    ).toEqual([]);
  });

  it('exige al menos un renglón', async () => {
    expect(await paths(CreateRequisitionDto, { ...head, items: [] })).toEqual([
      'items',
    ]);
    expect(await paths(CreateRequisitionDto, head)).toEqual(['items']);
  });

  it('tope de 30 renglones', async () => {
    const items = Array.from({ length: 31 }, () => item);
    expect(await paths(CreateRequisitionDto, { ...head, items })).toEqual([
      'items',
    ]);
  });

  it('valida cada renglón por dentro (ruta con índice)', async () => {
    const out = await paths(CreateRequisitionDto, {
      ...head,
      items: [item, { codeConceptId: 'no-uuid' }],
    });
    expect(out).toEqual(['items.1.codeConceptId']);
  });

  it('rechaza claves desconocidas en la cabecera y en el renglón', async () => {
    expect(
      await paths(CreateRequisitionDto, { ...head, items: [item], extra: 1 }),
    ).toEqual(['extra']);
    expect(
      await paths(CreateRequisitionDto, {
        ...head,
        items: [{ ...item, requisitionId: ID(4) }],
      }),
    ).toEqual(['items.0.requisitionId']);
  });

  it('la decisión de duplicado exige justificación de al menos 20 caracteres', async () => {
    const out = await paths(CreateRequisitionDto, {
      ...head,
      items: [
        {
          ...item,
          duplicateDecision: {
            previousDiagnosticReportId: ID(5),
            duplicateOverrideReason: 'corta',
          },
        },
      ],
    });
    expect(out).toEqual(['items.0.duplicateDecision.duplicateOverrideReason']);
  });
});
