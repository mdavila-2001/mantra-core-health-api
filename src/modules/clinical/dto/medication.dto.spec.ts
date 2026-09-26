import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateMedicationRequestDto } from './medication.dto';

/**
 * P43: `formInstanceId` viaja en el alta de la receta. Se valida contra el DTO
 * real con las opciones del `ValidationPipe` global (`whitelist` +
 * `forbidNonWhitelisted`), que es lo que antes lo rechazaba con 400.
 */

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
const MEDICATION = '33333333-3333-4333-8333-333333333333';

/**
 * Cuerpo mínimo válido del alta de receta.
 *
 * @param over - Campos que se agregan o reemplazan.
 * @returns El cuerpo plano.
 */
function cuerpoDelFront(over: Record<string, unknown> = {}) {
  return {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    medicationConceptId: MEDICATION,
    ...over,
  };
}

/**
 * Valida un cuerpo plano contra el DTO con las opciones del pipe global.
 *
 * @param cuerpo - Cuerpo plano.
 * @returns Las propiedades con error.
 */
async function validar(cuerpo: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateMedicationRequestDto, cuerpo);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propiedadesConError(errores);
}

describe('CreateMedicationRequestDto — formInstanceId (P43)', () => {
  const FORM = '44444444-4444-4444-8444-444444444444';

  it('acepta formInstanceId uuid (ya no es 400 por forbidNonWhitelisted)', async () => {
    expect(await validar(cuerpoDelFront({ formInstanceId: FORM }))).toEqual([]);
  });

  it('sigue siendo opcional: sin formInstanceId también valida', async () => {
    expect(await validar(cuerpoDelFront())).toEqual([]);
  });

  it('rechaza un formInstanceId que no es uuid', async () => {
    expect(
      await validar(cuerpoDelFront({ formInstanceId: 'no-es-uuid' })),
    ).toEqual(['formInstanceId']);
  });
});
