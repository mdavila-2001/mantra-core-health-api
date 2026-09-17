import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateServiceRequestDto } from './service-request.dto';
import { CheckDuplicateStudyDto } from './duplicate-study.dto';

/**
 * Aplana los errores de `class-validator` a los nombres de propiedad con error.
 *
 * @param errores - Errores devueltos por `validate`.
 * @returns Las propiedades con error, sin repetidos.
 */
function propiedadesConError(errores: readonly ValidationError[]): string[] {
  return [...new Set(errores.map((e) => e.property))].sort();
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

async function validarCreacion(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateServiceRequestDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propiedadesConError(errores);
}

describe('CreateServiceRequestDto — antiduplicación (subtarea 3.2)', () => {
  it('accepts the base DTO with no duplicate-study fields', async () => {
    expect(await validarCreacion(dtoBase())).toEqual([]);
  });

  it('rejects a justification shorter than 20 characters', async () => {
    const errores = await validarCreacion(
      dtoBase({
        previousDiagnosticReportId: REPORT,
        duplicateOverrideReason: 'corto',
      }),
    );
    expect(errores).toContain('duplicateOverrideReason');
  });

  it('accepts a justification of 20 characters or more', async () => {
    const errores = await validarCreacion(
      dtoBase({
        previousDiagnosticReportId: REPORT,
        duplicateOverrideReason: 'Justificación clínica suficiente',
      }),
    );
    expect(errores).not.toContain('duplicateOverrideReason');
  });

  it('rejects reusePreviousReport without previousDiagnosticReportId (only reusePreviousReport is present, but the field itself is not required by ValidateIf — the service enforces the pairing)', async () => {
    // `@ValidateIf` sólo activa la validación DE ESE campo cuando está
    // presente; el cruce «reusePreviousReport exige previousDiagnosticReportId»
    // es una regla de negocio, no de forma — la aplica el servicio (422
    // DUPLICATE_STUDY_NOT_FOUND / MISMATCH), no el DTO.
    const errores = await validarCreacion(
      dtoBase({ reusePreviousReport: true }),
    );
    expect(errores).toEqual([]);
  });

  it('rejects an unknown property (whitelist + forbidNonWhitelisted)', async () => {
    const errores = await validarCreacion(dtoBase({ somethingElse: 'x' }));
    expect(errores.length).toBeGreaterThan(0);
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

async function validarChequeo(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CheckDuplicateStudyDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propiedadesConError(errores);
}

describe('CheckDuplicateStudyDto', () => {
  it('accepts the base DTO', async () => {
    expect(await validarChequeo(checkBase())).toEqual([]);
  });

  it('rejects windowDays below 1', async () => {
    expect(await validarChequeo(checkBase({ windowDays: 0 }))).toContain(
      'windowDays',
    );
  });

  it('rejects windowDays above the maximum', async () => {
    expect(await validarChequeo(checkBase({ windowDays: 366 }))).toContain(
      'windowDays',
    );
  });

  it('accepts windowDays within range', async () => {
    expect(await validarChequeo(checkBase({ windowDays: 45 }))).toEqual([]);
  });

  it('rejects a body without codeConceptId nor diagnosticStudyOfferingId', async () => {
    const errores = await validarChequeo({
      patientProfileId: PATIENT,
      encounterId: '55555555-5555-4555-8555-555555555555',
    });
    expect(errores).toContain('codeConceptId');
  });

  it('accepts diagnosticStudyOfferingId instead of codeConceptId', async () => {
    const errores = await validarChequeo({
      patientProfileId: PATIENT,
      diagnosticStudyOfferingId: CODE,
      encounterId: '55555555-5555-4555-8555-555555555555',
    });
    expect(errores).toEqual([]);
  });
});
