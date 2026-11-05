import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DicomCatalogService } from './dicom-catalog.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DICOMWEB_OUTCOME, OBJECT_LIFECYCLE } from '../constants';
import { ObjectStorageErrorReason } from '../object_storage.error-reasons';

const T1 = '00000000-0000-4000-8000-0000000000a1';
const T2 = '00000000-0000-4000-8000-0000000000b2';
const PATIENT = '00000000-0000-4000-8000-0000000000c3';
const DENIED = ObjectStorageErrorReason.DICOM_ACCESS_DENIED;
const OUT_OF_SCOPE = ObjectStorageErrorReason.DICOM_CATALOG_OUT_OF_SCOPE;

/** Miembro de T1: el tenant activo de los tests. */
const actor = { id: 'user-1', roles: ['PACS_GATEWAY'], tenantIds: [T1] };

/** Ejecuta `fn` con T1 como tenant activo del request. */
const inTenant = <T>(fn: () => Promise<T>, tenantId = T1): Promise<T> =>
  runWithTenant(tenantId, fn);

/** Captura el rechazo de una promesa para comparar su respuesta HTTP. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}
const STUDY = '11111111-1111-1111-1111-111111111111';
const SERIES = '22222222-2222-2222-2222-222222222222';
const MANIFEST = '33333333-3333-3333-3333-333333333333';
const VERSION = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dicomRepo = {
    createStudy: mockFn(() => ({ id: STUDY })),
    findStudyByUidForUpdate: mockFn(() => Promise.resolve(null)),
    findStudyByUid: mockFn(),
    patientProfileExists: mockFn(() => Promise.resolve(true)),
    imagingStudyInScope: mockFn(() => Promise.resolve(true)),
    imagingStudyPatientId: mockFn(() => Promise.resolve(undefined)),
    createSeries: mockFn(() => ({ id: SERIES })),
    findSeriesByUidForUpdate: mockFn(() => Promise.resolve(null)),
    findSeriesByUid: mockFn(),
    findSeriesByStudy: mockFn(() => Promise.resolve([{ id: SERIES }])),
    createInstance: mockFn(() => ({ id: 'instance-1' })),
    findInstanceByUid: mockFn(() => Promise.resolve(null)),
    countInstancesBySeries: mockFn(() => Promise.resolve(1)),
    createAccessLog: mockFn(() => ({ id: 'access-1' })),
    // MCH-020: el catálogo no la usa, pero el doble tiene que cubrir el
    // contrato del repositorio para que el tipo siga siendo el real.
    findDicomCoordinates: mockFn(() => Promise.resolve(null)),
  };
  const storageRepo = {
    findManifestById: mockFn(() =>
      Promise.resolve({ id: MANIFEST, tenantId: T1 }),
    ),
  };
  const clinicalAccess = { assertCanReadHistory: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DicomCatalogService(
    em as any,
    dicomRepo,
    storageRepo as any,
    clinicalAccess as any,
    logger as any,
  );
  return { service, tx, dicomRepo, storageRepo, clinicalAccess, logger };
}

const CATALOG: any = {
  studyInstanceUid: '1.2.840.1',
  series: [
    {
      seriesInstanceUid: '1.2.840.1.1',
      modality: 'CT',
      instances: [
        { sopInstanceUid: '1.2.840.1.1.1', objectManifestId: MANIFEST },
      ],
    },
  ],
};

describe('DicomCatalogService', () => {
  describe('catalogStudy (UC-60-04)', () => {
    it('catalogues the hierarchy and counts what it wrote', async () => {
      const d = build();

      const res = await inTenant(() => d.service.catalogStudy(CATALOG, actor));

      expect(res).toMatchObject({
        studyId: STUDY,
        seriesCount: 1,
        instanceCount: 1,
        instancesAdded: 1,
        instancesSkipped: 0,
        studyCreated: true,
      });
    });

    it('collects the distinct modalities of the study', async () => {
      const d = build();

      await inTenant(() =>
        d.service.catalogStudy(
          {
            ...CATALOG,
            series: [
              { ...CATALOG.series[0], modality: 'CT' },
              {
                ...CATALOG.series[0],
                seriesInstanceUid: '1.2.840.1.2',
                modality: 'MR',
              },
            ],
          },
          actor,
        ),
      );

      expect(d.dicomRepo.createStudy).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ modalityCodes: ['CT', 'MR'] }),
      );
    });

    it('does not re-add an instance that is already catalogued', async () => {
      const d = build();
      d.dicomRepo.findInstanceByUid.mockResolvedValue({ id: 'instance-prev' });

      const res = await inTenant(() => d.service.catalogStudy(CATALOG, actor));

      expect(res).toMatchObject({ instancesAdded: 0, instancesSkipped: 1 });
      expect(d.dicomRepo.createInstance).not.toHaveBeenCalled();
    });

    it('reuses an existing study instead of creating a second one', async () => {
      const d = build();
      d.dicomRepo.findStudyByUidForUpdate.mockResolvedValue({ id: STUDY });

      const res = await inTenant(() => d.service.catalogStudy(CATALOG, actor));

      expect(res.studyCreated).toBe(false);
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
    });

    it('fails when the instance references an object that does not exist', async () => {
      const d = build();
      d.storageRepo.findManifestById.mockResolvedValue(null);

      await expect(
        inTenant(() => d.service.catalogStudy(CATALOG, actor as any)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('resolveInstance (UC-60-05)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param manifestOverrides - Valor de manifest overrides requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      manifestOverrides: Record<string, unknown> = {},
    ) {
      d.dicomRepo.findStudyByUid.mockResolvedValue({
        id: STUDY,
        tenantId: T1,
        patientProfileId: PATIENT,
      });
      d.dicomRepo.findSeriesByUid.mockResolvedValue({ id: SERIES });
      d.dicomRepo.findInstanceByUid.mockResolvedValue({
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        tenantId: T1,
        currentVersionId: VERSION,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
        ...manifestOverrides,
      });
    }

    it('resolves the instance and records the access', async () => {
      const d = build();
      wire(d);

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.1',
          '1.2.3.1.1',
          'TREATMENT',
          actor,
        ),
      );

      expect(res).toMatchObject({
        outcome: DICOMWEB_OUTCOME.ALLOWED,
        objectManifestId: MANIFEST,
        currentVersionId: VERSION,
      });
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('denies and records when no purpose of use is declared', async () => {
      const d = build();
      wire(d);

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.1',
          '1.2.3.1.1',
          undefined,
          actor,
        ),
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
      expect(res.denialReason).toBeDefined();
      // El intento denegado se registra igual: es lo que hay que poder auditar.
      expect(d.dicomRepo.createAccessLog).toHaveBeenCalled();
      expect(res.objectManifestId).toBeUndefined();
    });

    it('denies when the study does not exist', async () => {
      const d = build();
      d.dicomRepo.findStudyByUid.mockResolvedValue(null);

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.1',
          '1.2.3.1.1',
          'TREATMENT',
          actor,
        ),
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the series is not part of the study', async () => {
      const d = build();
      wire(d);
      d.dicomRepo.findSeriesByUid.mockResolvedValue(null);

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.9',
          '1.2.3.1.1',
          'TREATMENT',
          actor,
        ),
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the object is pending deletion', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION });

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.1',
          '1.2.3.1.1',
          'TREATMENT',
          actor,
        ),
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the object is corrupt', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.CORRUPT });

      const res = await inTenant(() =>
        d.service.resolveInstance(
          '1.2.3',
          '1.2.3.1',
          '1.2.3.1.1',
          'TREATMENT',
          actor,
        ),
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });
  });

  describe('alcance de tenant en el catálogo (OBJ-01)', () => {
    it('catalogStudy persiste el tenant del contexto y lo usa para buscar el estudio', async () => {
      const d = build();

      await inTenant(() => d.service.catalogStudy(CATALOG, actor));

      expect(d.dicomRepo.findStudyByUidForUpdate).toHaveBeenCalledWith(
        d.tx,
        T1,
        CATALOG.studyInstanceUid,
      );
      expect(d.dicomRepo.createStudy).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('rechaza un cuerpo que declara el tenant de otra organización o a un actor que no es miembro', async () => {
      const d = build();

      const foreignBody = await rejection(
        inTenant(() =>
          d.service.catalogStudy({ ...CATALOG, tenantId: T2 }, actor),
        ),
      );
      const outsider = await rejection(
        inTenant(() =>
          d.service.catalogStudy(CATALOG, { ...actor, tenantIds: [T2] }),
        ),
      );

      for (const error of [foreignBody, outsider]) {
        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(error.getStatus()).toBe(404);
        expect(error.reason).toBe(OUT_OF_SCOPE);
      }
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
      expect(d.dicomRepo.createInstance).not.toHaveBeenCalled();
    });

    it('un objeto de otro tenant responde igual que uno inexistente y no se cataloga', async () => {
      const d = build();
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        tenantId: T2,
      });
      const foreign = await rejection(
        inTenant(() => d.service.catalogStudy(CATALOG, actor)),
      );
      d.storageRepo.findManifestById.mockResolvedValue(null);
      const missing = await rejection(
        inTenant(() => d.service.catalogStudy(CATALOG, actor)),
      );

      expect(foreign.reason).toBe(OUT_OF_SCOPE);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.dicomRepo.createInstance).not.toHaveBeenCalled();
    });

    it('una miniatura de otro tenant no se admite', async () => {
      const d = build();
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        tenantId: T2,
      });

      const error = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            {
              ...CATALOG,
              series: [
                { ...CATALOG.series[0], thumbnailObjectManifestId: MANIFEST },
              ],
            },
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(d.dicomRepo.createSeries).not.toHaveBeenCalled();
    });

    it('valida el paciente y el estudio de imagen que cita al crear el estudio', async () => {
      const d = build();

      await inTenant(() =>
        d.service.catalogStudy(
          { ...CATALOG, patientProfileId: PATIENT, imagingStudyId: 'img-1' },
          actor,
        ),
      );
      expect(d.dicomRepo.patientProfileExists).toHaveBeenCalledWith(
        d.tx,
        PATIENT,
      );
      expect(d.dicomRepo.imagingStudyInScope).toHaveBeenCalledWith(
        d.tx,
        'img-1',
        T1,
        PATIENT,
      );

      d.dicomRepo.patientProfileExists.mockResolvedValue(false);
      const missingPatient = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            { ...CATALOG, patientProfileId: PATIENT, imagingStudyId: 'img-1' },
            actor,
          ),
        ),
      );
      d.dicomRepo.patientProfileExists.mockResolvedValue(true);
      d.dicomRepo.imagingStudyInScope.mockResolvedValue(false);
      const foreignImaging = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            { ...CATALOG, imagingStudyId: 'img-t2' },
            actor,
          ),
        ),
      );

      expect(missingPatient.reason).toBe(OUT_OF_SCOPE);
      expect(foreignImaging.reason).toBe(OUT_OF_SCOPE);
    });

    it('si el cuerpo omite el paciente pero cita el estudio de imagen, el paciente se deriva del estudio', async () => {
      const d = build();
      d.dicomRepo.imagingStudyPatientId.mockResolvedValue(PATIENT);

      await inTenant(() =>
        d.service.catalogStudy({ ...CATALOG, imagingStudyId: 'img-1' }, actor),
      );

      expect(d.dicomRepo.imagingStudyPatientId).toHaveBeenCalledWith(
        d.tx,
        'img-1',
        T1,
      );
      expect(d.dicomRepo.createStudy).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: PATIENT,
          imagingStudyId: 'img-1',
        }),
      );
    });

    it('un estudio de imagen de otro tenant sin paciente en el cuerpo no deriva paciente ni crea el estudio', async () => {
      const d = build();
      d.dicomRepo.imagingStudyInScope.mockResolvedValue(false);
      d.dicomRepo.imagingStudyPatientId.mockResolvedValue(PATIENT);

      const error = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            { ...CATALOG, imagingStudyId: 'img-t2' },
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(d.dicomRepo.imagingStudyPatientId).not.toHaveBeenCalled();
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
    });

    it('un paciente sin estudio de imagen que lo respalde no se ata al estudio DICOM', async () => {
      const d = build();

      const error = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            { ...CATALOG, patientProfileId: PATIENT },
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
      expect(d.dicomRepo.createInstance).not.toHaveBeenCalled();
    });

    it('un estudio de imagen ajeno o de otro paciente no ata el paciente al estudio DICOM', async () => {
      const d = build();
      d.dicomRepo.imagingStudyInScope.mockResolvedValue(false);

      const error = await rejection(
        inTenant(() =>
          d.service.catalogStudy(
            {
              ...CATALOG,
              patientProfileId: PATIENT,
              imagingStudyId: 'img-de-otro-paciente',
            },
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(d.dicomRepo.imagingStudyInScope).toHaveBeenCalledWith(
        d.tx,
        'img-de-otro-paciente',
        T1,
        PATIENT,
      );
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto catalogStudy no llega a la base', async () => {
      const d = build();

      await expect(
        d.service.catalogStudy(CATALOG, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.dicomRepo.findStudyByUidForUpdate).not.toHaveBeenCalled();
    });
  });

  describe('resolveInstance · política de acceso (OBJ-01)', () => {
    /** Estudio de T1 de un paciente, con la jerarquía y el objeto íntegros. */
    function wireStudy(d: ReturnType<typeof build>) {
      d.dicomRepo.findStudyByUid.mockResolvedValue({
        id: STUDY,
        tenantId: T1,
        patientProfileId: PATIENT,
      });
      d.dicomRepo.findSeriesByUid.mockResolvedValue({ id: SERIES });
      d.dicomRepo.findInstanceByUid.mockResolvedValue({
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        tenantId: T1,
        currentVersionId: VERSION,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
      });
    }
    const clinician = {
      id: 'clinician-1',
      roles: ['CLINICIAN'],
      tenantIds: [T1],
    };
    const resolve = (
      d: ReturnType<typeof build>,
      purpose?: string,
      who = clinician,
      tenantId = T1,
    ) =>
      inTenant(
        () =>
          d.service.resolveInstance(
            '1.2.3',
            '1.2.3.1',
            '1.2.3.1.1',
            purpose,
            who,
          ),
        tenantId,
      );

    it('Correcto: un clínico con acceso al paciente y finalidad permitida recibe la referencia y queda ALLOWED con las coordenadas reales', async () => {
      const d = build();
      wireStudy(d);
      d.clinicalAccess.assertCanReadHistory.mockResolvedValue(undefined);

      const res = await resolve(d, 'TREATMENT');

      expect(res).toMatchObject({
        outcome: DICOMWEB_OUTCOME.ALLOWED,
        objectManifestId: MANIFEST,
        currentVersionId: VERSION,
      });
      expect(d.dicomRepo.findStudyByUid).toHaveBeenCalledWith(
        d.tx,
        T1,
        '1.2.3',
      );
      expect(d.clinicalAccess.assertCanReadHistory).toHaveBeenCalledWith(
        PATIENT,
        clinician,
      );
      expect(d.dicomRepo.createAccessLog).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: T1,
          principalId: clinician.id,
          studyInstanceUid: '1.2.3',
          seriesInstanceUid: '1.2.3.1',
          sopInstanceUid: '1.2.3.1.1',
          purposeOfUseCode: 'TREATMENT',
          outcome: DICOMWEB_OUTCOME.ALLOWED,
        }),
      );
    });

    it('Límite: un viewer del mismo tenant sin relación clínica recibe la denegación uniforme, queda DENIED y no se resuelve la jerarquía', async () => {
      const d = build();
      wireStudy(d);
      d.clinicalAccess.assertCanReadHistory.mockRejectedValue(
        new Error('Sólo puede consultar su propia historia clínica.'),
      );

      const res = await resolve(d, 'TREATMENT');

      expect(res).toEqual({
        accessLogId: 'access-1',
        outcome: DICOMWEB_OUTCOME.DENIED,
        denialReason: DENIED,
      });
      expect(res.objectManifestId).toBeUndefined();
      expect(res.currentVersionId).toBeUndefined();
      expect(d.dicomRepo.createAccessLog).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ outcome: DICOMWEB_OUTCOME.DENIED }),
      );
      expect(d.dicomRepo.findSeriesByUid).not.toHaveBeenCalled();
      expect(d.storageRepo.findManifestById).not.toHaveBeenCalled();
    });

    it('Error: un actor de otro tenant que consulta un UID real recibe lo mismo que ante un UID ausente', async () => {
      const d = build();
      wireStudy(d);
      // El estudio es de T1; el actor opera en T2: la búsqueda acotada no lo ve.
      d.dicomRepo.findStudyByUid.mockResolvedValue(null);
      const foreignActor = { ...clinician, tenantIds: [T2] };
      const foreign = await resolve(d, 'TREATMENT', foreignActor, T2);
      const absent = await resolve(d, 'TREATMENT');

      expect(foreign).toEqual(absent);
      expect(foreign.denialReason).toBe(DENIED);
      expect(foreign.objectManifestId).toBeUndefined();
      expect(foreign.currentVersionId).toBeUndefined();
      expect(d.dicomRepo.findStudyByUid).toHaveBeenCalledWith(
        d.tx,
        T2,
        '1.2.3',
      );
      expect(d.clinicalAccess.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it('Error: aunque la búsqueda devolviera un estudio de otro tenant, quien no es miembro de él queda denegado igual', async () => {
      const d = build();
      wireStudy(d);
      const outsider = { ...clinician, tenantIds: [T2] };

      const res = await resolve(d, 'TREATMENT', outsider, T1);

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
      expect(res.denialReason).toBe(DENIED);
      expect(res.objectManifestId).toBeUndefined();
      expect(d.clinicalAccess.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it.each([
      ['omitida', undefined],
      ['vacía', ''],
      ['no permitida', 'MARKETING'],
    ])(
      'Falla catalogada: finalidad %s queda DENIED con DICOM_ACCESS_DENIED y no consulta el estudio',
      async (_name, purpose) => {
        const d = build();
        wireStudy(d);

        const res = await resolve(d, purpose);

        expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
        expect(res.denialReason).toBe(DENIED);
        expect(d.dicomRepo.createAccessLog).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ outcome: DICOMWEB_OUTCOME.DENIED }),
        );
        expect(d.dicomRepo.findStudyByUid).not.toHaveBeenCalled();
      },
    );

    it('un objeto de otro tenant colgando del estudio se deniega sin entregar la referencia', async () => {
      const d = build();
      wireStudy(d);
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        tenantId: T2,
        currentVersionId: VERSION,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
      });

      const res = await resolve(d, 'TREATMENT');

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
      expect(res.denialReason).toBe(DENIED);
      expect(res.objectManifestId).toBeUndefined();
    });

    it('sin tenant en el contexto se deniega y se registra sin consultar el estudio', async () => {
      const d = build();
      wireStudy(d);

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        'TREATMENT',
        clinician,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
      expect(res.denialReason).toBe(DENIED);
      expect(d.dicomRepo.findStudyByUid).not.toHaveBeenCalled();
    });

    it('los tres motivos de denegación fuera de alcance son indistinguibles para el cliente', async () => {
      const d = build();
      wireStudy(d);
      const byPolicy = await (async () => {
        d.clinicalAccess.assertCanReadHistory.mockRejectedValue(new Error('x'));
        return resolve(d, 'TREATMENT');
      })();
      d.dicomRepo.findStudyByUid.mockResolvedValue(null);
      const byAbsence = await resolve(d, 'TREATMENT');
      const byPurpose = await resolve(d, 'MARKETING');

      expect(byPolicy).toEqual(byAbsence);
      expect(byPurpose).toEqual(byAbsence);
    });
  });
});
