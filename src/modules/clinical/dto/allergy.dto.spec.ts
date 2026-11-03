import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateAllergyIntoleranceDto } from './allergy.dto';

/**
 * Kill-test de CL-01 (P26): el cuerpo que arma el front en «Atención»
 * (`allergy-block.ts:243-258`, `mockup`) lleva `encounterId`, y hasta este
 * cambio el DTO no lo declaraba. Con `whitelist + forbidNonWhitelisted` eso
 * es un 400 en cada alta hecha desde la consulta.
 *
 * Se valida contra el DTO real con las mismas opciones que el `ValidationPipe`
 * global, que es lo más cerca de la API viva que se puede llegar sin base.
 */

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
const SUBSTANCE = '33333333-3333-4333-8333-333333333333';
const ENCOUNTER = '44444444-4444-4444-8444-444444444444';
const MANIFESTATION = '55555555-5555-4555-8555-555555555555';

/** El cuerpo tal como lo manda `allergy-block.ts` dentro de «Atención». */
function bodyFront(over: Record<string, unknown> = {}) {
  return {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    substanceConceptId: SUBSTANCE,
    encounterId: ENCOUNTER,
    reactions: [{ manifestationConceptId: MANIFESTATION }],
    ...over,
  };
}

async function validateRegistration(
  registration: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateAllergyIntoleranceDto, registration);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propertiesWithError(errors);
}

describe('CreateAllergyIntoleranceDto — alergia desde la consulta (CL-01 / P26)', () => {
  it('acepta el cuerpo del front con encounterId (el 400 de la demo)', async () => {
    expect(await validateRegistration(bodyFront())).toEqual([]);
  });

  it('sigue aceptando el alta sin encuentro (desde el expediente)', async () => {
    const { encounterId: _skipped, ...withoutEncounter } = bodyFront();
    void _skipped;
    expect(await validateRegistration(withoutEncounter)).toEqual([]);
  });

  it('rechaza un encounterId que no es uuid', async () => {
    expect(
      await validateRegistration(bodyFront({ encounterId: 'cita-de-hoy' })),
    ).toEqual(['encounterId']);
  });

  it('sigue rechazando una clave que el contrato no declara', async () => {
    expect(await validateRegistration(bodyFront({ notes: 'x' }))).toEqual([
      'notes',
    ]);
  });
});
