import { jest } from '@jest/globals';

import { PreconditionFailedException } from '../../../common';
import {
  MEDICAL_SPECIALTY_VALUE_SET,
  MedicalSpecialtyCatalogService,
} from './medical-specialty-catalog.service';

/** El proyecto corre jest en ESM: los dobles se arman con este envoltorio. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Cardiología y Pediatría del catálogo `VS_MEDICAL_SPECIALTY` (patch v4.0.11). */
const CARDIO = '7218acbc-5098-56ae-980a-9345961ced89';
const PEDIATRIA = 'bd0484b1-8959-5ba5-bb65-ca9305eedb30';

/** Un concepto real del catálogo que NO es una especialidad: sirve de contraejemplo. */
const NO_ES_ESPECIALIDAD = '211c3fe3-88de-5d17-8974-ed4744e2fa03';

function build(
  overrides: {
    conjunto?: { id: string } | null;
    miembros?: string[] | null;
  } = {},
) {
  const valueSets = {
    findByInternalCode: mockFn().mockResolvedValue(
      overrides.conjunto === undefined
        ? { id: 'vs-especialidades' }
        : overrides.conjunto,
    ),
    findIncludedConceptIdsByValueSet: mockFn().mockResolvedValue(
      overrides.miembros === undefined
        ? [CARDIO, PEDIATRIA]
        : overrides.miembros,
    ),
  };
  const service = new MedicalSpecialtyCatalogService(valueSets as never);
  return { service, valueSets, em: {} as never };
}

describe('MedicalSpecialtyCatalogService', () => {
  it('acepta un concepto que es miembro vigente del catálogo', async () => {
    const d = build();
    await expect(
      d.service.assertIsMedicalSpecialty(d.em, CARDIO),
    ).resolves.toBeUndefined();
  });

  it('busca el catálogo por su código estable, no por uuid', async () => {
    const d = build();
    await d.service.assertIsMedicalSpecialty(d.em, CARDIO);
    // Un uuid pegado en el código quedaría desactualizado el día que el paquete
    // de seeds se regenere; el código interno es la clave que declara el modelo.
    expect(d.valueSets.findByInternalCode).toHaveBeenCalledWith(
      d.em,
      MEDICAL_SPECIALTY_VALUE_SET,
    );
  });

  it('rechaza con 422 un concepto que existe pero no es especialidad', async () => {
    const d = build();
    // `specialty_concept_id` es FK a TODO el catálogo: sin esta regla, un
    // concepto de otro dominio entraría y después aparecería en la Guía.
    await expect(
      d.service.assertIsMedicalSpecialty(d.em, NO_ES_ESPECIALIDAD),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('si el catálogo no está sembrado lo dice, en vez de rechazar a todos', async () => {
    const d = build({ conjunto: null });
    // Tratar «no hay catálogo» como «ninguna especialidad es válida» convertiría
    // un problema de datos en un rechazo a todos los profesionales.
    await expect(
      d.service.assertIsMedicalSpecialty(d.em, CARDIO),
    ).rejects.toThrow(/no está disponible/);
    expect(d.valueSets.findIncludedConceptIdsByValueSet).not.toHaveBeenCalled();
  });

  it('un catálogo sin versión vigente se trata igual que uno ausente', async () => {
    // El repositorio distingue `null` (sin versión vigente) de `[]` (existe y
    // no tiene miembros); acá los dos casos no pueden pasar por válidos.
    const d = build({ miembros: null });
    await expect(
      d.service.assertIsMedicalSpecialty(d.em, CARDIO),
    ).rejects.toThrow(/no está disponible/);
  });

  it('un catálogo vacío rechaza, pero no se confunde con uno ausente', async () => {
    const d = build({ miembros: [] });
    await expect(
      d.service.assertIsMedicalSpecialty(d.em, CARDIO),
    ).rejects.toThrow(/no pertenece al catálogo/);
  });
});
