import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateCarePlanDto } from './care-plans.dto';

/**
 * `reasonText` en el alta del plan de cuidados (patch v4.2.24).
 *
 * El bloque del expediente (`care-plan-block.ts`) manda el motivo escrito a
 * mano cuando el plan no cuelga de un diagnóstico. Hasta este cambio el DTO no
 * lo declaraba y, con `whitelist + forbidNonWhitelisted`, cada alta con motivo
 * respondía 400. Se valida con las mismas opciones que el `ValidationPipe`
 * global.
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

const PATIENT = '22222222-2222-4222-8222-222222222222';

async function validarAlta(alta: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateCarePlanDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propiedadesConError(errores);
}

describe('CreateCarePlanDto — motivo escrito (reasonText)', () => {
  it('acepta el cuerpo del front con reasonText y sin diagnóstico', async () => {
    expect(
      await validarAlta({
        patientProfileId: PATIENT,
        reasonText: 'Control de peso tras el alta',
        goalText: 'Bajar 3 kg en dos meses',
      }),
    ).toEqual([]);
  });

  it('acepta un motivo de exactamente 2000 caracteres (el tope)', async () => {
    expect(
      await validarAlta({
        patientProfileId: PATIENT,
        reasonText: 'x'.repeat(2000),
      }),
    ).toEqual([]);
  });

  it('rechaza un motivo de 2001 caracteres', async () => {
    expect(
      await validarAlta({
        patientProfileId: PATIENT,
        reasonText: 'x'.repeat(2001),
      }),
    ).toEqual(['reasonText']);
  });

  it('rechaza un motivo vacío o que no es texto', async () => {
    expect(
      await validarAlta({ patientProfileId: PATIENT, reasonText: '' }),
    ).toEqual(['reasonText']);
    expect(
      await validarAlta({ patientProfileId: PATIENT, reasonText: 42 }),
    ).toEqual(['reasonText']);
  });
});
