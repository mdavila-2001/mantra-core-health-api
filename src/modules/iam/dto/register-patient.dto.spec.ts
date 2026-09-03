import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterPatientDto } from './register-patient.dto';
import { PROF } from '../../profiles/profiles.concepts';

/**
 * El parentesco del contacto de emergencia, comprobado en el borde.
 *
 * El servicio da por buenos los datos que recibe —es el pipe de validación
 * quien los filtra—, así que «el campo acepta cualquier cosa» no se ve en las
 * pruebas del servicio: se ve acá o en producción. Un `relationship_concept_id`
 * que no sea un uuid rompe la clave foránea al escribir, y el error que llega a
 * la persona es un 500 en vez del 400 que le diría qué corregir.
 */

/**
 * El alta mínima que el DTO exige, para no repetirla en cada caso.
 *
 * Son los obligatorios de AC-03-3 más los tres del contrato del servidor
 * (nombre, apellido paterno y contraseña). Se declaran completos a propósito:
 * un caso que llegara inválido por otro campo dejaría de decir nada sobre el
 * parentesco, que es lo único que estas pruebas afirman.
 */
const ALTA_MINIMA = {
  nationalId: '1234567',
  residenceMunicipalityConceptId: '11111111-1111-4111-8111-111111111111',
  password: 'secreto12',
  name: 'Ana',
  lastName: 'Paz',
  email: 'ana@ejemplo.test',
  birthDate: '1990-05-17',
  phone: '+591 70012345',
  sexAtBirth: 'FEMALE',
};

/**
 * Valida un alta y devuelve las propiedades que quedaron mal.
 *
 * @param alta - El cuerpo del alta, tal como llegaría del cliente.
 * @returns Los nombres de las propiedades con error, sin el detalle.
 */
async function propiedadesConError(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(RegisterPatientDto, alta);
  const errores = await validate(dto);
  return errores.map((error) => error.property);
}

describe('RegisterPatientDto · parentesco del contacto de emergencia', () => {
  it('acepta el alta sin parentesco declarado: el campo es opcional', async () => {
    expect(await propiedadesConError(ALTA_MINIMA)).toEqual([]);
  });

  it('acepta un concepto del catálogo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        guardianName: 'Rosa Quispe',
        guardianRelationshipConceptId: PROF.RELATIONSHIP_MOTHER,
      }),
    ).toEqual([]);
  });

  it('rechaza lo que no es un uuid', async () => {
    // El caso real es un cliente que manda el código del concepto —«MOTHER»— en
    // vez del identificador que la lectura del catálogo le dio.
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        guardianName: 'Rosa Quispe',
        guardianRelationshipConceptId: 'RELATIONSHIP_MOTHER',
      }),
    ).toEqual(['guardianRelationshipConceptId']);
  });

  it('rechaza la cadena vacía: ausente y vacío no son lo mismo', async () => {
    expect(
      await propiedadesConError({
        ...ALTA_MINIMA,
        guardianRelationshipConceptId: '',
      }),
    ).toEqual(['guardianRelationshipConceptId']);
  });
});
