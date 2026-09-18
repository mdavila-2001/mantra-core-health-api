import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import {
  armarReceta,
  dibujar,
  PrescriptionPdfService,
  type DatosDeLaReceta,
} from './prescription-pdf.service';
import { ResourceNotFoundException } from '../../../common';
import { CLIN } from '../clinical.concepts';
import { PROF } from '../../profiles/profiles.concepts';

const actor = { id: 'user-1', roles: ['PRACTITIONER'] } as any;

const recetaEmitida = () => ({
  id: 'req-1',
  patientProfileId: 'pat-1',
  prescriberProfileId: 'prac-1',
  medicationConceptId: 'med-1',
  statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
  doseText: '500 mg',
  frequencyText: 'cada 8 horas',
  createdAt: new Date('2026-09-01T10:00:00.000Z'),
  issuedAt: new Date('2026-09-01T10:05:00.000Z'),
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * `patientProfilesRepo`/`practitionerProfilesRepo` devuelven un perfil cuyo
 * `profileId` es FK directa a `persons.id` (CTI), igual que
 * `EncounterPdfService`.
 *
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => em) };
  const requestsRepo = { findById: mockFn() };
  const clinicalRead = { assertPuedeLeerHistoria: mockFn() };
  const conditionsRepo = { findById: mockFn() };
  const catalogConceptsRepo = {
    findByIds: mockFn().mockResolvedValue(new Map()),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'person-pat' }),
  };
  const practitionerProfilesRepo = {
    findById: mockFn().mockResolvedValue({
      profileId: 'person-prac',
      professionalTitle: undefined,
    }),
  };
  const personsRepo = {
    findById: mockFn((_em: unknown, id: string) =>
      Promise.resolve(
        id === 'person-pat'
          ? {
              displayName: 'Paciente de Prueba',
              birthDate: new Date('1990-01-01'),
            }
          : { displayName: 'Profesional de Prueba' },
      ),
    ),
  };
  const specialtiesRepo = {
    findAllByPractitioner: mockFn().mockResolvedValue([]),
  };
  const jurisdictionAuthorizationsRepo = {
    findByPractitioner: mockFn().mockResolvedValue([]),
  };
  const identifiersRepo = {
    findCurrentByOwner: mockFn().mockResolvedValue([]),
  };
  const declaredCoverages = { read: mockFn().mockResolvedValue([]) };

  const service = new PrescriptionPdfService(
    em as any,
    requestsRepo as any,
    clinicalRead as any,
    conditionsRepo as any,
    catalogConceptsRepo as any,
    patientProfilesRepo as any,
    practitionerProfilesRepo as any,
    personsRepo as any,
    specialtiesRepo as any,
    jurisdictionAuthorizationsRepo as any,
    identifiersRepo as any,
    declaredCoverages as any,
  );

  return {
    service,
    requestsRepo,
    clinicalRead,
    conditionsRepo,
    catalogConceptsRepo,
    patientProfilesRepo,
    practitionerProfilesRepo,
    personsRepo,
    specialtiesRepo,
    jurisdictionAuthorizationsRepo,
    identifiersRepo,
    declaredCoverages,
  };
}

describe('PrescriptionPdfService.render', () => {
  it('404 si la receta no existe', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(null);

    await expect(d.service.render('missing', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
  });

  it('403 si el actor no es el prescriptor y no puede leer la historia (delegado)', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());
    d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
      new ForbiddenException('no'),
    );

    await expect(
      d.service.render('req-1', { id: 'otro', roles: [] } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el prescriptor pasa sin consultar assertPuedeLeerHistoria', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());

    await d.service.render('req-1', {
      id: 'user-1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'prac-1',
    } as any);

    expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
  });

  it('quien no es el prescriptor sí pasa por assertPuedeLeerHistoria', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());

    await d.service.render('req-1', actor);

    expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
      'pat-1',
      actor,
    );
  });

  it('un PDF de una receta DRAFT sale %PDF con marca de agua de copia de trabajo', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue({
      ...recetaEmitida(),
      statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      issuedAt: undefined,
    });

    const { buffer, fileName } = await d.service.render('req-1', actor);

    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
    expect(fileName).toBe('receta-req-1.pdf');
  });

  it('un PDF de una receta ISSUED no lleva marca de agua', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());

    const { buffer } = await d.service.render('req-1', actor);

    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });
});

describe('PrescriptionPdfService.verify', () => {
  it('404 si la receta no existe', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(null);

    await expect(d.service.verify('missing')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('sin PHI: el resultado no trae nombre de paciente ni de medicamento', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());

    const res = await d.service.verify('req-1');

    expect(res).not.toHaveProperty('patientName');
    expect(res).not.toHaveProperty('medicationConceptId');
    expect(res.status).toBe('ISSUED');
    expect(res.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('DRAFT no expone el hash', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue({
      ...recetaEmitida(),
      statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
    });

    const res = await d.service.verify('req-1');

    expect(res.status).toBe('DRAFT');
    expect(res.contentHash).toBeNull();
  });

  it('sin matrícula nacional, prescriberLicense es null', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());

    const res = await d.service.verify('req-1');

    expect(res.prescriberLicense).toBeNull();
  });

  it('con matrícula nacional activa, prescriberLicense la refleja', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue(recetaEmitida());
    d.jurisdictionAuthorizationsRepo.findByPractitioner.mockResolvedValue([
      {
        jurisdictionConceptId: PROF.JURISDICTION_NATIONAL,
        licenseNumber: 'LIC-123',
        regulatoryAuthority: 'Ministerio de Salud',
        stateConceptId: PROF.AUTH_ACTIVE,
      },
    ]);

    const res = await d.service.verify('req-1');

    expect(res.prescriberLicense).toEqual({
      number: 'LIC-123',
      authority: 'Ministerio de Salud',
      state: 'ACTIVE',
    });
  });
});

describe('armarReceta', () => {
  const conceptsById = new Map([
    ['med-1', { code: 'N02BE01', display: 'Paracetamol' }],
    ['unit-1', { code: 'UNIT_{tablet}', display: 'Tablet' }],
  ]) as any;

  function datosBase(
    overrides: Partial<DatosDeLaReceta> = {},
  ): DatosDeLaReceta {
    return {
      requestId: 'req-1',
      status: CLIN.MEDICATION_REQUEST_ISSUED,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      issuedAt: new Date('2026-09-01T10:05:00.000Z'),
      patientName: 'Ana Pérez',
      patientBirthDate: new Date('1990-05-05'),
      practitionerName: 'Juan López',
      hasLicense: false,
      licenseVerified: false,
      medicationConceptId: 'med-1',
      quantityDecimal: '21',
      unitConceptId: 'unit-1',
      coverages: [],
      conceptsById,
      contentHash: 'a'.repeat(64),
      qrUrl: 'https://alovida.bo/verify/rx/req-1',
      ahora: new Date('2026-09-16T00:00:00.000Z'),
      ...overrides,
    };
  }

  it('sin cobertura declarada, la sección lo dice explícito', () => {
    const papel = armarReceta(datosBase());
    const seccion = papel.secciones.find(
      (s) => s.titulo === 'Cobertura de seguro',
    );

    expect(seccion?.lineas).toEqual(['Sin seguro vinculado en AloVida']);
  });

  it('con un beneficio vigente, imprime cobertura y copago', () => {
    const papel = armarReceta(
      datosBase({
        coverages: [
          {
            id: 'cov-1',
            carrierName: 'Alianza Vida',
            planName: 'AFI Gold',
            isPublic: false,
            verified: false,
            validityStatus: 'CURRENT',
            referenceDate: '2026-09-16',
            currencyCode: 'BOB',
            coverageOrder: 1,
            benefits: [
              {
                id: 'ben-1',
                categoryName: 'Consulta',
                coveragePercent: '80.00',
                copayAmount: '20.00',
                validityStatus: 'CURRENT',
              },
            ],
          } as any,
        ],
      }),
    );
    const seccion = papel.secciones.find(
      (s) => s.titulo === 'Cobertura de seguro',
    );
    const texto = seccion?.lineas.join(' ') ?? '';

    expect(texto).toContain('Alianza Vida');
    expect(texto).toContain('cobertura 80.00 %');
    expect(texto).toContain('copago 20.00 BOB');
  });

  it('DRAFT trae marca de agua y el asunto de copia de trabajo', () => {
    const papel = armarReceta(
      datosBase({ status: CLIN.MEDICATION_REQUEST_DRAFT, issuedAt: undefined }),
    );

    expect(papel.marcaDeAgua).toContain('COPIA DE TRABAJO');
    expect(papel.subject).toBe('Copia de trabajo — sin validez farmacéutica');
  });

  it('ISSUED no trae marca de agua y el asunto es oficial', () => {
    const papel = armarReceta(datosBase());

    expect(papel.marcaDeAgua).toBeUndefined();
    expect(papel.subject).toBe('Receta médica oficial');
  });

  it('INVALIDATED trae el motivo en la marca de agua', () => {
    const papel = armarReceta(
      datosBase({
        status: CLIN.MEDICATION_REQUEST_INVALIDATED,
        statusReasonText: 'Error de dosis',
      }),
    );

    expect(papel.marcaDeAgua).toBe('SIN VALIDEZ FARMACÉUTICA — Error de dosis');
  });

  it('el documento de identidad sale con su sigla de departamento', () => {
    const papel = armarReceta(
      datosBase({ patientDocument: '1234567', patientDocumentArea: 'LP' }),
    );
    const seccion = papel.secciones.find((s) => s.titulo === 'Paciente');

    expect(seccion?.lineas).toContain('Documento: 1234567 LP');
  });

  it('sin matrícula, lo dice explícito', () => {
    const papel = armarReceta(datosBase({ hasLicense: false }));
    const seccion = papel.secciones.find((s) => s.titulo === 'Profesional');

    expect(seccion?.lineas).toContain('Matrícula: sin registrar');
  });

  it('con matrícula pendiente de verificación, lo dice explícito', () => {
    const papel = armarReceta(
      datosBase({
        hasLicense: true,
        licenseVerified: false,
        licenseNumber: 'LIC-9',
      }),
    );
    const seccion = papel.secciones.find((s) => s.titulo === 'Profesional');

    expect(seccion?.lineas.join(' ')).toContain(
      'declarada, pendiente de verificación',
    );
  });
});

describe('dibujar', () => {
  it('produce %PDF y el hash en los metadatos', async () => {
    const papel = armarReceta({
      requestId: 'req-1',
      status: CLIN.MEDICATION_REQUEST_ISSUED,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      patientName: 'Ana Pérez',
      practitionerName: 'Juan López',
      hasLicense: false,
      licenseVerified: false,
      medicationConceptId: 'med-1',
      coverages: [],
      conceptsById: new Map() as any,
      contentHash: 'b'.repeat(64),
      qrUrl: 'https://alovida.bo/verify/rx/req-1',
      ahora: new Date('2026-09-16T00:00:00.000Z'),
    });

    const buffer = await dibujar(papel);

    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
