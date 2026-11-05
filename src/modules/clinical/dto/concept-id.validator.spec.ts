import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHash } from 'node:crypto';
import { CreateRequisitionDto } from './requisition.dto';
import { CreateServiceRequestDto } from './service-request.dto';
import { CheckDuplicateStudyDto } from './duplicate-study.dto';
import { ParseConceptIdPipe } from './concept-id.validator';

/** Id como los del cargador: md5, SIN bits de versión/variante. */
function md5Id(seed: string): string {
  const h = createHash('md5').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-0${h.slice(13, 16)}-f${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const V4 = (n: number) =>
  `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const OPTS = { whitelist: true, forbidNonWhitelisted: true } as const;

async function fields(cls: any, plain: object): Promise<string[]> {
  const out: string[] = [];
  const walk = (list: any[], pre: string) => {
    for (const e of list) {
      const p = pre ? `${pre}.${e.property}` : e.property;
      if (e.constraints) out.push(p);
      walk(e.children ?? [], p);
    }
  };
  walk(await validate(plainToInstance(cls, plain) as object, OPTS), '');
  return out.sort();
}

describe('ids de concepto con formato UUID genérico', () => {
  const code = md5Id('mantra:loinc:57021-8');
  const comp = md5Id('mantra:loinc:718-7');
  const head = { custodianTenantId: V4(1), patientProfileId: V4(2) };

  it('el id md5 de ejemplo realmente no trae versión ni variante', () => {
    expect(code[14]).toBe('0');
    expect(code[19]).toBe('f');
  });

  it('requisición: acepta código, categoría, muestra, componentes e imagen con ids md5', async () => {
    expect(
      await fields(CreateRequisitionDto, {
        ...head,
        items: [
          {
            codeConceptId: code,
            categoryConceptId: md5Id('c'),
            specimenTypeConceptId: md5Id('s'),
            componentConceptIds: [comp, md5Id('x')],
          },
          {
            codeConceptId: md5Id('img'),
            imaging: {
              modalityConceptId: md5Id('m'),
              bodySiteConceptId: md5Id('b'),
              lateralityConceptId: md5Id('l'),
              contrastConceptId: md5Id('k'),
            },
          },
        ],
      }),
    ).toEqual([]);
  });

  it('requisición: basura en un id de concepto sigue siendo 400 (con su ruta)', async () => {
    expect(
      await fields(CreateRequisitionDto, {
        ...head,
        items: [{ codeConceptId: code, componentConceptIds: [comp, 'basura'] }],
      }),
    ).toEqual(['items.0.componentConceptIds']);
    expect(
      await fields(CreateRequisitionDto, {
        ...head,
        items: [{ codeConceptId: 'no-uuid' }],
      }),
    ).toEqual(['items.0.codeConceptId']);
    expect(
      await fields(CreateRequisitionDto, {
        ...head,
        items: [{ codeConceptId: code, imaging: { bodySiteConceptId: 'x' } }],
      }),
    ).toEqual(['items.0.imaging.bodySiteConceptId']);
  });

  it('los ids de entidades de negocio siguen estrictos: un md5 sin bits en patientProfileId es 400', async () => {
    expect(
      await fields(CreateRequisitionDto, {
        custodianTenantId: V4(1),
        patientProfileId: md5Id('paciente'),
        items: [{ codeConceptId: code }],
      }),
    ).toEqual(['patientProfileId']);
  });

  it('alta individual y duplicate-check aceptan ids md5 de concepto', async () => {
    expect(
      await fields(CreateServiceRequestDto, {
        ...head,
        codeConceptId: code,
        specimenTypeConceptId: md5Id('s'),
        componentConceptIds: [comp],
        imaging: {
          bodySiteConceptId: md5Id('b'),
          lateralityConceptId: md5Id('l'),
        },
      }),
    ).toEqual([]);
    expect(
      await fields(CheckDuplicateStudyDto, {
        patientProfileId: V4(2),
        encounterId: V4(3),
        codeConceptId: code,
        bodySiteConceptId: md5Id('b'),
        lateralityConceptId: md5Id('l'),
        componentConceptIds: [comp],
      }),
    ).toEqual([]);
    expect(
      await fields(CheckDuplicateStudyDto, {
        patientProfileId: V4(2),
        encounterId: V4(3),
        codeConceptId: 'basura',
      }),
    ).toEqual(['codeConceptId']);
  });

  it('ParseConceptIdPipe: md5 pasa, basura es 400', () => {
    const pipe = new ParseConceptIdPipe();
    expect(pipe.transform(code)).toBe(code);
    expect(() => pipe.transform('basura')).toThrow(BadRequestException);
  });
});
