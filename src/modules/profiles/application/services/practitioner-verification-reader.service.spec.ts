import { describe, expect, it, jest } from '@jest/globals';
import { PractitionerVerificationReader } from './practitioner-verification-reader.service';
import { ADMISSION_STATUS_CONCEPT } from '../../domain/admissions/admission-status';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const NOW = new Date('2026-10-29T12:00:00.000Z');

function build(current: Map<string, Record<string, unknown>>) {
  const repo = { findCurrentByPractitioners: fn().mockResolvedValue(current) };
  return { reader: new PractitionerVerificationReader(repo as never), repo };
}

describe('PractitionerVerificationReader', () => {
  it('lee la admisión vigente de todos los pedidos en UNA consulta', async () => {
    const d = build(
      new Map([
        [
          'a',
          {
            statusConceptId: ADMISSION_STATUS_CONCEPT.VERIFICADA,
            decidedAt: new Date('2026-09-01T10:00:00Z'),
            validUntil: new Date('2029-09-01T00:00:00Z'),
          },
        ],
      ]),
    );
    const result = await d.reader.verificationOf({} as never, ['a', 'b'], NOW);
    expect(d.repo.findCurrentByPractitioners).toHaveBeenCalledTimes(1);
    expect(result.get('a')?.status).toBe('VERIFIED');
    expect(result.get('b')?.status).toBe('UNVERIFIED');
  });

  it('una verificación cuya vigencia pasó se ve EXPIRED aunque el barrido no la haya bajado', async () => {
    const d = build(
      new Map([
        [
          'a',
          {
            statusConceptId: ADMISSION_STATUS_CONCEPT.VERIFICADA,
            decidedAt: new Date('2023-01-01T00:00:00Z'),
            validUntil: new Date('2026-01-01T00:00:00Z'),
          },
        ],
      ]),
    );
    const result = await d.reader.verificationOf({} as never, ['a'], NOW);
    expect(result.get('a')?.status).toBe('EXPIRED');
  });

  it('una suspendida se ve SUSPENDED y una abierta IN_REVIEW', async () => {
    const d = build(
      new Map([
        ['s', { statusConceptId: ADMISSION_STATUS_CONCEPT.SUSPENDIDA }],
        ['r', { statusConceptId: ADMISSION_STATUS_CONCEPT.EN_REVISION }],
      ]),
    );
    const result = await d.reader.verificationOf({} as never, ['s', 'r'], NOW);
    expect(result.get('s')?.status).toBe('SUSPENDED');
    expect(result.get('r')?.status).toBe('IN_REVIEW');
  });

  it('sin ids no consulta nada', async () => {
    const d = build(new Map());
    expect((await d.reader.verificationOf({} as never, [])).size).toBe(0);
    expect(d.repo.findCurrentByPractitioners).not.toHaveBeenCalled();
  });
});
