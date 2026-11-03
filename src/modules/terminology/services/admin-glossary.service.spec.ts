import { describe, expect, it, jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { glossaryCodeSystemVersionId } from '../../../common/seed/glossary-taxonomy';
import {
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SLUG_PROPERTY_CODE,
} from '../glossary.constants';
import { TerminologyErrorReason } from '../terminology.error-reasons';
import { AdminGlossaryService } from './admin-glossary.service';

/**
 * Pruebas del editor del glosario con DOBLES declarados (EntityManager y
 * repositorios en memoria). Verifican versión, idempotencia, audiencia y
 * retiro; no la persistencia real (BLOQUEADO contra PostgreSQL real aquí).
 */
const actor = { id: 'root-1', roles: ['SUPERADMIN'] } as never;

type Concept = {
  id: string;
  codeSystemVersionId: string;
  code: string;
  display: string;
  stateConceptId: string;
  validTo?: Date | null;
  rowVersion: number;
  updatedAt: Date;
  updatedByUserId?: string | null;
};
type Prop = { conceptId: string; propertyCode: string; valueJson: unknown };

const concept = (over: Partial<Concept> = {}): Concept => ({
  id: 'c1',
  codeSystemVersionId: glossaryCodeSystemVersionId,
  code: 'GLOSSARY_ANEMIA',
  display: 'Anemia',
  stateConceptId: CONCEPTS.TERM_ACTIVE,
  rowVersion: 2,
  updatedAt: new Date('2026-10-31T00:00:00Z'),
  ...over,
});

function build(
  opts: { concepts?: Concept[]; props?: Prop[]; umbrella?: boolean } = {},
) {
  const concepts = opts.concepts ?? [];
  const props = opts.props ?? [];
  const names = new Map<string, { value: string; preferred: boolean }>();
  const members: Array<{ included: boolean; conceptId: string }> = [];
  const created: unknown[] = [];

  const em: Record<string, unknown> = {};
  em.fork = () => em;
  em.transactional = (cb: (tx: unknown) => unknown) => cb(em);
  em.flush = jest.fn(async () => undefined);
  em.find = jest.fn(async () => concepts);
  em.create = jest.fn((_e: unknown, data: Concept) => {
    const c = { ...data, rowVersion: 1 } as Concept;
    concepts.push(c);
    return c;
  });

  const conceptsRepo = {
    findById: jest.fn(
      async (_e: unknown, id: string) =>
        concepts.find((c) => c.id === id) ?? null,
    ),
    findByIdForUpdate: jest.fn(
      async (_e: unknown, id: string) =>
        concepts.find((c) => c.id === id) ?? null,
    ),
  };
  const designationsRepo = {
    findPropertiesForConcepts: jest.fn(async (_e: unknown, ids: string[]) => {
      const m = new Map<string, Record<string, unknown>>();
      for (const p of props.filter((x) => ids.includes(x.conceptId))) {
        m.set(p.conceptId, {
          ...(m.get(p.conceptId) ?? {}),
          [p.propertyCode]: p.valueJson,
        });
      }
      return m;
    }),
    findPreferredByLanguageForConcepts: jest.fn(
      async (_e: unknown, ids: string[]) => {
        const m = new Map<string, { value: string }>();
        for (const id of ids) {
          const n = names.get(id);
          if (n?.preferred) m.set(id, { value: n.value });
        }
        return m;
      },
    ),
    findProperty: jest.fn(
      async (_e: unknown, conceptId: string, code: string) =>
        props.find(
          (p) => p.conceptId === conceptId && p.propertyCode === code,
        ) ?? null,
    ),
    createProperty: jest.fn((_e: unknown, d: Prop) => {
      props.push({
        conceptId: d.conceptId,
        propertyCode: d.propertyCode,
        valueJson: d.valueJson,
      });
      created.push(d);
    }),
    createDesignation: jest.fn(
      (_e: unknown, d: { conceptId: string; value: string }) => {
        names.set(d.conceptId, { value: d.value, preferred: true });
        created.push(d);
      },
    ),
    findByLanguageForUpdate: jest.fn(async (_e: unknown, id: string) => {
      const n = names.get(id);
      return n ? [n] : [];
    }),
  };
  const valueSetsRepo = {
    findByInternalCode: jest.fn(async () =>
      opts.umbrella === false ? null : { id: 'vs-all' },
    ),
    findDefaultVersion: jest.fn(async () => ({ id: 'vsv-all' })),
    countMembersByVersionIds: jest.fn(async () => new Map([['vsv-all', 80]])),
    createMember: jest.fn(
      (_e: unknown, d: { conceptId: string; included: boolean }) => {
        members.push({ included: d.included, conceptId: d.conceptId });
      },
    ),
    findMembersByConceptForUpdate: jest.fn(async (_e: unknown, id: string) =>
      members.filter((m) => m.conceptId === id),
    ),
  };
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const service = new AdminGlossaryService(
    em as never,
    conceptsRepo as never,
    designationsRepo as never,
    valueSetsRepo as never,
    logger as never,
  );
  return {
    service,
    em,
    concepts,
    props,
    names,
    members,
    conceptsRepo,
    designationsRepo,
    valueSetsRepo,
    created,
  };
}

const createDto = {
  slug: 'anemia',
  display: 'Anemia',
  nameEs: 'Anemia',
  audience: 'patient' as const,
  text: { es: 'Pocos glóbulos rojos.' },
};

describe('AdminGlossaryService', () => {
  describe('list / get', () => {
    it('devuelve el texto del tipo de usuario pedido y sólo ese', async () => {
      const d = build({
        concepts: [concept()],
        props: [
          {
            conceptId: 'c1',
            propertyCode: GLOSSARY_SLUG_PROPERTY_CODE,
            valueJson: 'anemia',
          },
          {
            conceptId: 'c1',
            propertyCode: GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
            valueJson: { es: 'llano' },
          },
          {
            conceptId: 'c1',
            propertyCode: GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
            valueJson: { es: 'clínico', en: 'clinical' },
          },
        ],
      });
      const patient = await d.service.list({ audience: 'patient' });
      const pro = await d.service.list({ audience: 'professional' });
      expect(patient.items[0]).toMatchObject({
        slug: 'anemia',
        text: { es: 'llano' },
        rowVersion: 2,
        state: 'active',
      });
      expect(pro.items[0].text).toEqual({ es: 'clínico', en: 'clinical' });
    });

    it('término sin texto para esa audiencia => text null (no inventa)', async () => {
      const d = build({ concepts: [concept()] });
      const res = await d.service.get('c1', 'patient');
      expect(res.text).toBeNull();
      expect(res.nameEs).toBe('Anemia');
    });

    it('valor guardado con forma inesperada => null, no revienta', async () => {
      const d = build({
        concepts: [concept()],
        props: [
          {
            conceptId: 'c1',
            propertyCode: GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
            valueJson: [1, 2],
          },
        ],
      });
      expect((await d.service.get('c1', 'patient')).text).toBeNull();
    });

    it('un concepto de otro catálogo se trata como inexistente (404 uniforme)', async () => {
      const d = build({
        concepts: [
          concept({ id: 'x', codeSystemVersionId: 'otro-code-system' }),
        ],
      });
      const foreign = await d.service.get('x', 'patient').catch((e) => e);
      const missing = await d.service.get('nada', 'patient').catch((e) => e);
      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.message).toBe(missing.message);
      expect(foreign.reason).toBe(
        TerminologyErrorReason.GLOSSARY_TERM_NOT_FOUND,
      );
    });

    it('limit+1 y cursor (code,id) cuando hay más páginas; cursor corrupto => 400', async () => {
      const d = build({
        concepts: [
          concept({ id: 'a', code: 'A' }),
          concept({ id: 'b', code: 'B' }),
          concept({ id: 'c', code: 'C' }),
        ],
      });
      (d.em.find as jest.Mock).mockImplementation(async () => d.concepts);
      const res = await d.service.list({ audience: 'patient', limit: 2 });
      expect(res.count).toBe(2);
      expect(res.nextCursor).toEqual(expect.any(String));
      await expect(
        d.service.list({ audience: 'patient', cursor: '%%%' }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('create (idempotente por slug)', () => {
    it('crea concepto, designación ES, slug, texto y membresía en el paraguas', async () => {
      const d = build();
      const res = await d.service.create(createDto, actor);
      expect(res.created).toBe(true);
      expect(res.term).toMatchObject({
        slug: 'anemia',
        state: 'active',
        text: createDto.text,
        nameEs: 'Anemia',
      });
      expect(d.designationsRepo.createDesignation).toHaveBeenCalledTimes(1);
      expect(d.designationsRepo.createProperty).toHaveBeenCalledTimes(2);
      expect(d.valueSetsRepo.createMember).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          valueSetVersionId: 'vsv-all',
          included: true,
          ordinal: 80,
        }),
      );
      expect(d.concepts[0]).toMatchObject({
        code: 'GLOSSARY_ANEMIA',
        codeSystemVersionId: glossaryCodeSystemVersionId,
        stateConceptId: CONCEPTS.TERM_ACTIVE,
      });
    });

    it('segunda vez con el mismo cuerpo no escribe nada más', async () => {
      const d = build();
      const first = await d.service.create(createDto, actor);
      const props = d.designationsRepo.createProperty.mock.calls.length;
      const second = await d.service.create(createDto, actor);
      expect(second.created).toBe(false);
      expect(second.term.conceptId).toBe(first.term.conceptId);
      expect(d.designationsRepo.createProperty.mock.calls.length).toBe(props);
      expect(d.concepts).toHaveLength(1);
    });

    it('mismo slug con texto distinto => 409 GLOSSARY_TERM_ALREADY_EXISTS', async () => {
      const d = build();
      await d.service.create(createDto, actor);
      await expect(
        d.service.create({ ...createDto, text: { es: 'otro texto' } }, actor),
      ).rejects.toMatchObject({
        status: 409,
        reason: TerminologyErrorReason.GLOSSARY_TERM_ALREADY_EXISTS,
      });
    });

    it('sin conjunto «todos los términos» sembrado => 422 y nada se escribe', async () => {
      const d = build({ umbrella: false });
      await expect(d.service.create(createDto, actor)).rejects.toMatchObject({
        status: 422,
        reason: TerminologyErrorReason.GLOSSARY_UMBRELLA_MISSING,
      });
      expect(d.em.create).not.toHaveBeenCalled();
    });
  });

  describe('update (precondición de versión)', () => {
    it('con la versión correcta crea o actualiza la propiedad de la audiencia y toca el concepto', async () => {
      const c = concept({ rowVersion: 2 });
      const d = build({ concepts: [c] });
      const before = c.updatedAt;
      const res = await d.service.update(
        'c1',
        {
          expectedRowVersion: 2,
          audience: 'professional',
          text: { es: 'definición' },
        },
        actor,
      );
      expect(res.text).toEqual({ es: 'definición' });
      expect(c.updatedAt.getTime()).toBeGreaterThan(before.getTime());
      expect(c.updatedByUserId).toBe('root-1');
      expect(
        d.props.find(
          (p) => p.propertyCode === GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
        )?.valueJson,
      ).toEqual({ es: 'definición' });
      // La otra audiencia no se toca.
      expect(
        d.props.some(
          (p) => p.propertyCode === GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
        ),
      ).toBe(false);
    });

    it('versión desfasada => 409 GLOSSARY_TERM_VERSION_MISMATCH y no escribe', async () => {
      const d = build({ concepts: [concept({ rowVersion: 5 })] });
      await expect(
        d.service.update(
          'c1',
          { expectedRowVersion: 4, audience: 'patient', text: { es: 'x' } },
          actor,
        ),
      ).rejects.toMatchObject({
        status: 409,
        reason: TerminologyErrorReason.GLOSSARY_TERM_VERSION_MISMATCH,
        details: { expected: 4, actual: 5 },
      });
      expect(d.props).toHaveLength(0);
      expect(d.em.flush).not.toHaveBeenCalled();
    });

    it('sin text ni nameEs => 400', async () => {
      const d = build({ concepts: [concept()] });
      await expect(
        d.service.update(
          'c1',
          { expectedRowVersion: 2, audience: 'patient' },
          actor,
        ),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('término inexistente => 404 antes de mirar la versión', async () => {
      const d = build();
      await expect(
        d.service.update(
          'nada',
          { expectedRowVersion: 1, audience: 'patient', text: { es: 'x' } },
          actor,
        ),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('nameEs reemplaza la designación preferida en español', async () => {
      const d = build({ concepts: [concept()] });
      d.names.set('c1', { value: 'Anemia', preferred: true });
      const res = await d.service.update(
        'c1',
        {
          expectedRowVersion: 2,
          audience: 'patient',
          nameEs: 'Anemia ferropénica',
        },
        actor,
      );
      expect(res.nameEs).toBe('Anemia ferropénica');
      expect(d.designationsRepo.createDesignation).not.toHaveBeenCalled();
    });
  });

  describe('setActive (retirar sin borrar)', () => {
    it('retirar excluye sus membresías y fija validTo; reactivar las vuelve a incluir', async () => {
      const c = concept({ rowVersion: 2 });
      const d = build({ concepts: [c] });
      d.members.push(
        { included: true, conceptId: 'c1' },
        { included: true, conceptId: 'c1' },
      );
      const off = await d.service.setActive('c1', false, 2, 'patient', actor);
      expect(off.state).toBe('retired');
      expect(c.validTo).toBeInstanceOf(Date);
      expect(d.members.every((m) => !m.included)).toBe(true);
      const on = await d.service.setActive('c1', true, 2, 'patient', actor);
      expect(on.state).toBe('active');
      expect(c.validTo).toBeNull();
      expect(d.members.every((m) => m.included)).toBe(true);
    });

    it('idempotente: ya retirado => no escribe ni exige versión', async () => {
      const d = build({
        concepts: [
          concept({ stateConceptId: CONCEPTS.TERM_RETIRED, rowVersion: 9 }),
        ],
      });
      const res = await d.service.setActive('c1', false, 1, 'patient', actor);
      expect(res).toMatchObject({ state: 'retired', rowVersion: 9 });
      expect(d.em.flush).not.toHaveBeenCalled();
    });

    it('versión desfasada al cambiar de estado => 409', async () => {
      const d = build({ concepts: [concept({ rowVersion: 5 })] });
      await expect(
        d.service.setActive('c1', false, 2, 'patient', actor),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('término inexistente => 404', async () => {
      const d = build();
      await expect(
        d.service.setActive('nada', false, 1, 'patient', actor),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
