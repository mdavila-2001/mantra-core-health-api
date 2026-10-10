import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  CreateMedicationRequestDto,
  EditMedicationRequestDraftDto,
  INDICATION_TEXT_MAX_LENGTH,
} from './medication.dto';

/**
 * Kill-test de CL-03 (P24): el «otro motivo» escrito a mano viaja como
 * `indicationText` (`medication-block.ts:936-941`, `mockup`) y hasta este
 * cambio el DTO no lo declaraba → 400. Se valida contra el DTO real con las
 * opciones del `ValidationPipe` global.
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
const MEDICATION = '33333333-3333-4333-8333-333333333333';

/** El cuerpo del front sin `prescriberProfileId`: lo pone el servidor. */
function bodyFront(over: Record<string, unknown> = {}) {
  return {
    custodianTenantId: TENANT,
    patientProfileId: PATIENT,
    medicationConceptId: MEDICATION,
    indicationText: 'control de ansiedad',
    ...over,
  };
}

async function validateDto(
  classKey:
    typeof CreateMedicationRequestDto | typeof EditMedicationRequestDraftDto,
  body: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(classKey, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return propertiesWithError(errors);
}

describe('CreateMedicationRequestDto — motivo escrito a mano (CL-03 / P24)', () => {
  it('acepta el cuerpo del front con indicationText y sin prescriptor', async () => {
    expect(await validateDto(CreateMedicationRequestDto, bodyFront())).toEqual([]);
  });

  it(`acepta exactamente ${INDICATION_TEXT_MAX_LENGTH} caracteres`, async () => {
    expect(
      await validateDto(
        CreateMedicationRequestDto,
        bodyFront({
          indicationText: 'a'.repeat(INDICATION_TEXT_MAX_LENGTH),
        }),
      ),
    ).toEqual([]);
  });

  it(`rechaza ${INDICATION_TEXT_MAX_LENGTH + 1} caracteres (400)`, async () => {
    expect(
      await validateDto(
        CreateMedicationRequestDto,
        bodyFront({
          indicationText: 'a'.repeat(INDICATION_TEXT_MAX_LENGTH + 1),
        }),
      ),
    ).toEqual(['indicationText']);
  });

  it('sigue rechazando una clave que el contrato no declara', async () => {
    expect(
      await validateDto(
        CreateMedicationRequestDto,
        bodyFront({ otherReason: 'x' }),
      ),
    ).toEqual(['otherReason']);
  });
});

describe('EditMedicationRequestDraftDto — motivo escrito a mano (P24)', () => {
  it('acepta indicationText en la edición del borrador', async () => {
    expect(
      await validateDto(EditMedicationRequestDraftDto, {
        indicationText: 'dolor lumbar',
      }),
    ).toEqual([]);
  });

  it(`rechaza ${INDICATION_TEXT_MAX_LENGTH + 1} caracteres en la edición`, async () => {
    expect(
      await validateDto(EditMedicationRequestDraftDto, {
        indicationText: 'a'.repeat(INDICATION_TEXT_MAX_LENGTH + 1),
      }),
    ).toEqual(['indicationText']);
  });
});

describe('CreateMedicationRequestDto — formInstanceId (P43)', () => {
  const FORM = '44444444-4444-4444-8444-444444444444';

  it('acepta formInstanceId uuid (ya no es 400 por forbidNonWhitelisted)', async () => {
    expect(
      await validateDto(
        CreateMedicationRequestDto,
        bodyFront({ formInstanceId: FORM }),
      ),
    ).toEqual([]);
  });

  it('sigue siendo opcional: sin formInstanceId también valida', async () => {
    expect(await validateDto(CreateMedicationRequestDto, bodyFront())).toEqual([]);
  });

  it('rechaza un formInstanceId que no es uuid', async () => {
    expect(
      await validateDto(
        CreateMedicationRequestDto,
        bodyFront({ formInstanceId: 'no-es-uuid' }),
      ),
    ).toEqual(['formInstanceId']);
  });
});
