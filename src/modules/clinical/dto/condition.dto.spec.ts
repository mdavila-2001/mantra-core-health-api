import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateConditionDto, VerifyConditionDto } from './condition.dto';

const ID = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

/**
 * Los errores de validación, como los vería el `ValidationPipe` global de
 * `main.ts` (`whitelist` y `forbidNonWhitelisted`).
 *
 * @param classKey - El DTO.
 * @param body - Lo que mandaría el cliente.
 * @returns Las propiedades que no pasaron, en orden.
 */
async function errors<T extends object>(
  classKey: new () => T,
  body: unknown,
): Promise<string[]> {
  const dto = plainToInstance(classKey, body);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errores.map((e) => e.property).sort();
}

describe('CreateConditionDto · estado de verificación del alta (Hito 4 §B)', () => {
  const base = {
    custodianTenantId: ID,
    patientProfileId: ID,
    codeConceptId: ID,
  };

  it('el alta de siempre, sin el campo, sigue siendo válida', async () => {
    expect(await errors(CreateConditionDto, base)).toEqual([]);
  });

  it('acepta el estado de verificación como uuid', async () => {
    expect(
      await errors(CreateConditionDto, {
        ...base,
        verificationStatusConceptId: OTHER,
      }),
    ).toEqual([]);
  });

  it('rechaza un estado de verificación que no es uuid', async () => {
    expect(
      await errors(CreateConditionDto, {
        ...base,
        verificationStatusConceptId: 'COND_PROVISIONAL',
      }),
    ).toEqual(['verificationStatusConceptId']);
    expect(
      await errors(CreateConditionDto, {
        ...base,
        verificationStatusConceptId: '',
      }),
    ).toEqual(['verificationStatusConceptId']);
  });

  it('sigue rechazando claves que el contrato no declara', async () => {
    expect(
      await errors(CreateConditionDto, { ...base, status: 'ACTIVE' }),
    ).toEqual(['status']);
  });
});

describe('VerifyConditionDto · cuerpo de la verificación (C3 / P41)', () => {
  it('acepta un motivo solo, para confirmar o refutar', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'REFUTED',
        reasonText: 'Descartado por estudio',
      }),
    ).toEqual([]);
  });

  it('acepta una evidencia de nota o de análisis, sola', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        basedOn: { kind: 'NOTE', noteId: ID },
      }),
    ).toEqual([]);
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        basedOn: { kind: 'ANALYSIS', diagnosticReportId: ID },
      }),
    ).toEqual([]);
  });

  it('acepta las fechas y el curso al confirmar', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        reasonText: 'Cuadro compatible',
        onsetAt: '2026-09-01T00:00:00.000Z',
        expectedResolutionAt: '2026-12-01T00:00:00.000Z',
        clinicalCourseConceptId: ID,
      }),
    ).toEqual([]);
  });

  it('acepta el límite: un motivo de exactamente 500 caracteres', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        reasonText: 'a'.repeat(500),
      }),
    ).toEqual([]);
  });

  it('rechaza un resultado fuera de CONFIRMED y REFUTED, o ausente', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'PROVISIONAL',
        reasonText: 'x',
      }),
    ).toEqual(['outcome']);
    expect(await errors(VerifyConditionDto, { reasonText: 'x' })).toEqual([
      'outcome',
    ]);
  });

  it('rechaza un motivo de más de 500 caracteres', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        reasonText: 'a'.repeat(501),
      }),
    ).toEqual(['reasonText']);
  });

  it('rechaza una evidencia de clase desconocida o con un id que no es uuid', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        basedOn: { kind: 'OTRA', noteId: ID },
      }),
    ).toEqual(['basedOn']);
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        basedOn: { kind: 'NOTE', noteId: 'no-es-uuid' },
      }),
    ).toEqual(['basedOn']);
  });

  it('rechaza fechas que no son fechas y un curso que no es uuid', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        reasonText: 'x',
        onsetAt: 'ayer',
        expectedResolutionAt: 'pronto',
        clinicalCourseConceptId: 'COND_COURSE_CHRONIC',
      }),
    ).toEqual(['clinicalCourseConceptId', 'expectedResolutionAt', 'onsetAt']);
  });

  it('rechaza claves que el contrato no declara: no se cuela un estado ni un autor', async () => {
    expect(
      await errors(VerifyConditionDto, {
        outcome: 'CONFIRMED',
        reasonText: 'x',
        verificationStatusConceptId: ID,
        decidedByProfileId: ID,
      }),
    ).toEqual(['decidedByProfileId', 'verificationStatusConceptId']);
  });
});
