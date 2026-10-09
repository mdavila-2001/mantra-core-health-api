import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateServiceRequestDto } from './service-request.dto';
import { CheckDuplicateStudyDto } from './duplicate-study.dto';

/**
 * Aplana los errores de `class-validator` a los nombres de propiedad con error.
 *
 * @param errors - Errores devueltos por `validate`.
 * @returns Las propiedades con error, sin repetidos.
 */
function propertiesWithError(errors: readonly ValidationError[]): string[] {
  return [...new Set(errors.map((e) => e.property))].sort();
}

const TENANT = '11111111-1111-4111-8111-111111111111';
const PATIENT = '22222222-2222-4222-8222-222222222222';
const CODE = '33333333-3333-4333-8333-333333333333';
const REPORT = '44444444-4444-4444-8444-444444444444';

/** Un `CreateServiceRequestDto` mínimo, obligatorio. */
function dtoBase(over: Record<string, unknown> = {}) {
  return {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    codeConceptId: CODE,
    ...over,
  };
}

async function validateCreation(
  registration: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateServiceRequestDto, registration);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propertiesWithError(errors);
}

describe('CreateServiceRequestDto — antiduplicación (subtarea 3.2)', () => {
  it('accepts the base DTO with no duplicate-study fields', async () => {
    expect(await validateCreation(dtoBase())).toEqual([]);
  });

  it('rejects a justification shorter than 20 characters', async () => {
    const errors = await validateCreation(
      dtoBase({
        previousDiagnosticReportId: REPORT,
        duplicateOverrideReason: 'corto',
      }),
    );
    expect(errors).toContain('duplicateOverrideReason');
  });

  it('accepts a justification of 20 characters or more', async () => {
    const errors = await validateCreation(
      dtoBase({
        previousDiagnosticReportId: REPORT,
        duplicateOverrideReason: 'Justificación clínica suficiente',
      }),
    );
    expect(errors).not.toContain('duplicateOverrideReason');
  });

  it('rejects reusePreviousReport without previousDiagnosticReportId (only reusePreviousReport is present, but the field itself is not required by ValidateIf — the service enforces the pairing)', async () => {
    // `@ValidateIf` sólo activa la validación DE ESE campo cuando está
    // presente; el cruce «reusePreviousReport exige previousDiagnosticReportId»
    // es una regla de negocio, no de forma — la aplica el servicio (422
    // DUPLICATE_STUDY_NOT_FOUND / MISMATCH), no el DTO.
    const errors = await validateCreation(
      dtoBase({ reusePreviousReport: true }),
    );
    expect(errors).toEqual([]);
  });

  it('rejects an unknown property (whitelist + forbidNonWhitelisted)', async () => {
    const errors = await validateCreation(dtoBase({ somethingElse: 'x' }));
    expect(errors.length).toBeGreaterThan(0);
  });
});

/** Un `CheckDuplicateStudyDto` mínimo, obligatorio. */
function checkBase(over: Record<string, unknown> = {}) {
  return {
    patientProfileId: PATIENT,
    codeConceptId: CODE,
    encounterId: '55555555-5555-4555-8555-555555555555',
    ...over,
  };
}

async function validateCheck(
  registration: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CheckDuplicateStudyDto, registration);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propertiesWithError(errors);
}

describe('CheckDuplicateStudyDto', () => {
  it('accepts the base DTO', async () => {
    expect(await validateCheck(checkBase())).toEqual([]);
  });

  it('rejects windowDays below 1', async () => {
    expect(await validateCheck(checkBase({ windowDays: 0 }))).toContain(
      'windowDays',
    );
  });

  it('rejects windowDays above the maximum', async () => {
    expect(await validateCheck(checkBase({ windowDays: 366 }))).toContain(
      'windowDays',
    );
  });

  it('accepts windowDays within range', async () => {
    expect(await validateCheck(checkBase({ windowDays: 45 }))).toEqual([]);
  });

  it('rejects a body without codeConceptId nor diagnosticStudyOfferingId', async () => {
    const errors = await validateCheck({
      patientProfileId: PATIENT,
      encounterId: '55555555-5555-4555-8555-555555555555',
    });
    expect(errors).toContain('codeConceptId');
  });

  it('accepts diagnosticStudyOfferingId instead of codeConceptId', async () => {
    const errors = await validateCheck({
      patientProfileId: PATIENT,
      diagnosticStudyOfferingId: CODE,
      encounterId: '55555555-5555-4555-8555-555555555555',
    });
    expect(errors).toEqual([]);
  });
});

describe('CreateServiceRequestDto — formInstanceId (P43)', () => {
  const FORM = '66666666-6666-4666-8666-666666666666';

  it('acepta formInstanceId uuid (ya no es 400 por forbidNonWhitelisted)', async () => {
    expect(await validateCreation(dtoBase({ formInstanceId: FORM }))).toEqual(
      [],
    );
  });

  it('rechaza un formInstanceId que no es uuid', async () => {
    expect(
      await validateCreation(dtoBase({ formInstanceId: 'no-es-uuid' })),
    ).toEqual(['formInstanceId']);
  });
});
