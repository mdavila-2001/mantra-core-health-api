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
  armarPapel,
  dibujar,
  EncounterPdfService,
  type DatosDelPapel,
} from './encounter-pdf.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { CHART } from '../chart.concepts';

const actor = { id: 'user-1', roles: ['PRACTITIONER'] } as any;

const encounterFinished = () => ({
  id: 'enc1',
  patientProfileId: 'pat-1',
  primaryPractitionerId: 'prac-1',
  statusConceptId: CLIN.ENCOUNTER_FINISHED,
  contentHash: 'a'.repeat(64),
  sealedAt: new Date('2026-09-15T12:00:00.000Z'),
  startAt: new Date('2026-09-15T11:00:00.000Z'),
  endAt: new Date('2026-09-15T12:00:00.000Z'),
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * `patientProfilesRepo`/`practitionerProfilesRepo` devuelven un perfil cuyo
 * `profileId` es FK directa a `persons.id` (CTI) — la cadena real que el
 * servicio recorre, sin paso intermedio por `person_profiles`.
 *
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => em), flush: mockFn() };
  const encountersRepo = { findById: mockFn() };
  const clinicalRead = { assertPuedeLeerHistoria: mockFn() };
  const notesRepo = {
    findHeadersByEncounter: mockFn().mockResolvedValue([]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
  };
  const carePlansRepo = { findByEncounter: mockFn().mockResolvedValue([]) };
  const documentsRepo = { findByEncounter: mockFn().mockResolvedValue([]) };
  const conditionsRepo = { findByEncounter: mockFn().mockResolvedValue([]) };
  const medicationRequestsRepo = {
    findByEncounter: mockFn().mockResolvedValue([]),
  };
  const catalogConceptsRepo = {
    findByIds: mockFn().mockResolvedValue(new Map()),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'person-pat' }),
  };
  const practitionerProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'person-prac' }),
  };
  const personsRepo = {
    findById: mockFn((_em: unknown, id: string) =>
      Promise.resolve(
        id === 'person-pat'
          ? { displayName: 'Paciente de Prueba' }
          : { displayName: 'Profesional de Prueba' },
      ),
    ),
  };
  const filesRepo = { findById: mockFn() };
  const dataAccessLogRepo = { record: mockFn() };

  const service = new EncounterPdfService(
    em as any,
    encountersRepo as any,
    clinicalRead as any,
    notesRepo as any,
    carePlansRepo as any,
    documentsRepo as any,
    conditionsRepo as any,
    medicationRequestsRepo as any,
    catalogConceptsRepo as any,
    patientProfilesRepo as any,
    practitionerProfilesRepo as any,
    personsRepo as any,
    filesRepo as any,
    dataAccessLogRepo as any,
  );

  return {
    service,
    dataAccessLogRepo,
    encountersRepo,
    clinicalRead,
    patientProfilesRepo,
    personsRepo,
  };
}

describe('EncounterPdfService', () => {
  it('404 si el encuentro no existe', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);

    await expect(d.service.render('missing', actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
  });

  it('403 si el actor no puede leer la historia (delegado, se comprueba antes que el 422)', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...encounterFinished(),
      statusConceptId: 'en-curso', // ni siquiera finalizado: el 403 igual va primero
    });
    d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
      new ForbiddenException('nope'),
    );

    await expect(d.service.render('enc1', actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('422 si el encuentro no está cerrado', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...encounterFinished(),
      statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
      contentHash: undefined,
    });

    await expect(d.service.render('enc1', actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('produce un buffer que empieza en %PDF y contiene el hash del sello en los metadatos', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(encounterFinished());

    const { buffer, fileName } = await d.service.render('enc1', actor);

    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(buffer.includes(Buffer.from('a'.repeat(64)))).toBe(true);
    expect(fileName).toBe('encuentro-enc1.pdf');
  });

  it('resuelve el nombre por profile.profileId → persons directo (FK del CTI), sin pasar por person_profiles', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(encounterFinished());

    await d.service.render('enc1', actor);

    // `patient_profiles.profile_id` es FK directa a `persons.id`.
    expect(d.patientProfilesRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      'pat-1',
    );
    expect(d.personsRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      'person-pat',
    );
  });
});

/**
 * BR-15 (CL-31): la variante del titular. `actor.patientProfileId` sale del
 * claim `pid` (patrón `forms-me.controller.ts`), nunca de la ruta.
 */
describe('EncounterPdfService.renderForPatient (BR-15/CL-31)', () => {
  const titular = {
    id: 'user-pat',
    roles: ['PATIENT'],
    patientProfileId: 'pat-1',
  } as any;

  it('404 si la sesión no tiene perfil de paciente', async () => {
    const d = build();
    await expect(
      d.service.renderForPatient('enc1', { id: 'x', roles: [] } as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.encountersRepo.findById).not.toHaveBeenCalled();
  });

  it('404 si el encuentro es de otro paciente (mismo mensaje que "no existe")', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...encounterFinished(),
      patientProfileId: 'otro-paciente',
    });
    await expect(
      d.service.renderForPatient('enc1', titular),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('422 si el encuentro no está cerrado', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...encounterFinished(),
      statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
      contentHash: undefined,
    });
    await expect(
      d.service.renderForPatient('enc1', titular),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('el PDF del titular pide la versión liberada, nunca la vigente en borrador', async () => {
    // pdfkit comprime el stream de contenido por defecto: no se puede buscar
    // texto plano en el buffer resultante (a diferencia del hash del sello,
    // que va sin comprimir en los metadatos del documento — ver el test de
    // `render()`). Se comprueba en el punto exacto de la diferencia: qué id
    // de versión se pide.
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(encounterFinished());
    const service: any = d.service;
    service.notesRepo = {
      findHeadersByEncounter: mockFn().mockResolvedValue([
        {
          id: 'h1',
          currentVersionId: 'draft-v2',
          currentReleasedVersionId: 'released-v1',
        },
      ]),
      findVersionsByIds: mockFn().mockResolvedValue(new Map()),
    };

    await service.renderForPatient('enc1', titular);

    expect(service.notesRepo.findVersionsByIds).toHaveBeenCalledWith(
      expect.anything(),
      ['released-v1'],
    );
  });

  it('la descarga del titular deja rastro en data_access_log (TX-32)', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(encounterFinished());

    await d.service.renderForPatient('enc1', titular);

    expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-pat',
        patientProfileId: 'pat-1',
        resourceType: 'PATIENT_ENCOUNTER_PDF',
        resourceId: 'enc1',
      }),
    );
  });

  it('un 404 o un 422 no dejan rastro de descarga', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      ...encounterFinished(),
      patientProfileId: 'otro-paciente',
    });
    await expect(
      d.service.renderForPatient('enc1', titular),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.dataAccessLogRepo.record).not.toHaveBeenCalled();
  });

  it('el PDF del titular excluye documentos sólo para el profesional', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(encounterFinished());
    const service: any = d.service;
    service.documentsRepo = {
      findByEncounter: mockFn().mockResolvedValue([
        {
          id: 'doc-visible',
          patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
          files: [{ fileId: 'f-visible' }],
        },
        {
          id: 'doc-oculto',
          patientVisibilityConceptId: CHART.VISIBILITY_PROVIDER_ONLY,
          files: [{ fileId: 'f-oculto' }],
        },
      ]),
    };
    service.filesRepo = {
      findById: mockFn((_em: unknown, id: string) =>
        Promise.resolve({ id, originalName: `${id}.pdf` }),
      ),
    };

    await service.renderForPatient('enc1', titular);

    expect(service.filesRepo.findById).toHaveBeenCalledWith(
      expect.anything(),
      'f-visible',
    );
    expect(service.filesRepo.findById).not.toHaveBeenCalledWith(
      expect.anything(),
      'f-oculto',
    );
  });
});

describe('armarPapel', () => {
  const base: DatosDelPapel = {
    encounterId: 'enc1',
    startAt: new Date('2026-09-15T11:00:00.000Z'),
    endAt: new Date('2026-09-15T12:00:00.000Z'),
    patientName: 'Paciente de Prueba',
    practitionerName: 'Profesional de Prueba',
    notas: [],
    conditions: [],
    medicationRequests: [],
    conceptsById: new Map(),
    carePlans: [],
    documents: [],
    fileNamesById: new Map(),
    contentHash: 'b'.repeat(64),
    sealedAt: new Date('2026-09-15T12:05:00.000Z'),
  };

  it('el encabezado lleva el nombre del paciente y del profesional', () => {
    const papel = armarPapel(base);
    expect(papel.encabezado).toContain('Paciente: Paciente de Prueba');
    expect(papel.encabezado).toContain('Profesional: Profesional de Prueba');
  });

  it('cada diagnóstico se imprime como CIE-10 code — display', () => {
    const conceptsById = new Map([
      ['concept-1', { code: 'J06.9', display: 'Rinofaringitis aguda' } as any],
    ]);
    const papel = armarPapel({
      ...base,
      conditions: [{ codeConceptId: 'concept-1' }],
      conceptsById,
    });
    const diagnosticos = papel.secciones.find(
      (s) => s.titulo === 'Diagnósticos',
    );
    expect(diagnosticos?.lineas).toContain(
      'CIE-10 J06.9 — Rinofaringitis aguda',
    );
  });

  it('las prescripciones incluyen medicamento, dosis y frecuencia', () => {
    const conceptsById = new Map([
      ['med-1', { code: 'AMOX-500', display: 'Amoxicilina 500mg' } as any],
    ]);
    const papel = armarPapel({
      ...base,
      medicationRequests: [
        {
          medicationConceptId: 'med-1',
          doseText: '1 comprimido',
          frequencyText: 'cada 8 horas',
        },
      ],
      conceptsById,
    });
    const prescripciones = papel.secciones.find(
      (s) => s.titulo === 'Prescripciones',
    );
    expect(prescripciones?.lineas).toContain(
      'AMOX-500 — Amoxicilina 500mg · 1 comprimido · cada 8 horas',
    );
  });

  it('el plan de cuidados incluye la meta y cada actividad', () => {
    const conceptsById = new Map([
      ['act-1', { code: 'ACT', display: 'Control de signos vitales' } as any],
    ]);
    const papel = armarPapel({
      ...base,
      carePlans: [
        {
          goalText: 'Recuperar movilidad',
          activities: [{ activityConceptId: 'act-1' }],
        },
      ],
      conceptsById,
    });
    const plan = papel.secciones.find((s) => s.titulo === 'Plan de cuidados');
    expect(plan?.lineas).toContain('Meta: Recuperar movilidad');
    expect(plan?.lineas).toContain('- ACT — Control de signos vitales');
  });

  it('los documentos listan el nombre de cada archivo', () => {
    const papel = armarPapel({
      ...base,
      documents: [{ files: [{ fileId: 'f1' }] }],
      fileNamesById: new Map([['f1', 'orden-de-laboratorio.pdf']]),
    });
    const documentos = papel.secciones.find((s) => s.titulo === 'Documentos');
    expect(documentos?.lineas).toContain('- orden-de-laboratorio.pdf');
  });

  it('el pie trae las tres partes del sello: hash, fecha y profesional', () => {
    const papel = armarPapel(base);
    expect(papel.pie).toContain(`SHA-256 ${'b'.repeat(64)}`);
    expect(papel.pie).toContain('sellado el');
    expect(papel.pie).toContain('cerrado por Profesional de Prueba');
  });

  it('una sección sin datos dice explícitamente que no hay datos', () => {
    const papel = armarPapel(base);
    const diagnosticos = papel.secciones.find(
      (s) => s.titulo === 'Diagnósticos',
    );
    expect(diagnosticos?.lineas).toEqual(['Sin datos registrados.']);
  });
});

describe('dibujar', () => {
  it('produce %PDF y el hash en los metadatos, sin `compress: false`', async () => {
    const papel = armarPapel({
      encounterId: 'enc1',
      startAt: null,
      endAt: null,
      patientName: 'Paciente de Prueba',
      practitionerName: 'Profesional de Prueba',
      notas: [],
      conditions: [],
      medicationRequests: [],
      conceptsById: new Map(),
      carePlans: [],
      documents: [],
      fileNamesById: new Map(),
      contentHash: 'c'.repeat(64),
      sealedAt: null,
    });

    const buffer = await dibujar(papel);

    expect(buffer.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(buffer.includes(Buffer.from('c'.repeat(64)))).toBe(true);
  });
});
