import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { VirtualEncountersService } from './virtual-encounters.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ForbiddenException } from '@nestjs/common';
import { CEXT } from '../clinical_ext.concepts';

const actor = {
  id: 'md-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pr-1',
  tenantIds: ['ten-1'],
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const encountersRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findByEncounter: mockFn(),
    create: mockFn(),
  };
  const clinicalEncountersRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'e1',
      tenantId: 'ten-1',
      patientProfileId: 'pat-1',
      primaryPractitionerId: 'pr-1',
    }),
    findActiveParticipants: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new VirtualEncountersService(
    em as any,
    encountersRepo,
    clinicalEncountersRepo as any,
    logger as any,
  );
  return { service, encountersRepo, clinicalEncountersRepo };
}

describe('VirtualEncountersService (UC-18-12)', () => {
  it('creates a scheduled session', async () => {
    const d = build();
    d.encountersRepo.findByEncounter.mockResolvedValue(null);
    d.encountersRepo.create.mockReturnValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
    });
    const res = await d.service.create({ encounterId: 'e1' }, actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_SCHEDULED);
  });

  it('rejects a second session for the same encounter (conflict)', async () => {
    const d = build();
    d.encountersRepo.findByEncounter.mockResolvedValue({ id: 've0' });
    await expect(
      d.service.create({ encounterId: 'e1' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('un tercero no crea una sesión sobre un encuentro ajeno', async () => {
    const d = build();

    await expect(
      d.service.create(
        { encounterId: 'e1' },
        {
          id: 'intruso',
          roles: ['PRACTITIONER'],
          practitionerProfileId: 'pr-intruso',
          tenantIds: ['ten-1'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.encountersRepo.findByEncounter).not.toHaveBeenCalled();
    expect(d.encountersRepo.create).not.toHaveBeenCalled();
  });

  it('rechaza el encuentro de otro tenant aunque el perfil profesional coincida', async () => {
    const d = build();
    d.clinicalEncountersRepo.findById.mockResolvedValue({
      id: 'e1',
      tenantId: 'ten-B',
      patientProfileId: 'pat-1',
      primaryPractitionerId: 'pr-1',
    });

    await expect(
      runWithTenant('ten-A', () =>
        d.service.create({ encounterId: 'e1' }, actor),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(d.encountersRepo.create).not.toHaveBeenCalled();
  });

  it('joins a scheduled session (scheduled -> in-progress)', async () => {
    const d = build();
    const venc = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);
    const res = await d.service.join('ve1', actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS);
  });

  it('el paciente titular se une a su sesión', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    });

    await expect(
      d.service.join('ve1', {
        id: 'patient-user',
        roles: ['PATIENT'],
        patientProfileId: 'pat-1',
        tenantIds: ['ten-1'],
      }),
    ).resolves.toMatchObject({
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
    });
  });

  it('rechaza a un tercero aunque conozca el id de la sesión', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    });

    await expect(
      d.service.join('ve1', {
        id: 'intruso',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'pr-intruso',
        tenantIds: ['ten-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza a un paciente que no es el titular sin cambiar el estado', async () => {
    const d = build();
    const venc = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);

    await expect(
      d.service.join('ve1', {
        id: 'otro-patient-user',
        roles: ['PATIENT'],
        patientProfileId: 'pat-otro',
        tenantIds: ['ten-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(venc.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_SCHEDULED);
  });

  it('rejects joining a non-scheduled session (precondition)', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_COMPLETED,
    });
    await expect(d.service.join('ve1', actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('throws when ending a missing session', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);
    await expect(d.service.end('ve1', {} as any, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('ends an in-progress session (in-progress -> completed)', async () => {
    const d = build();
    const venc: any = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);
    const res = await d.service.end('ve1', { recordingFileId: 'f1' }, actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_COMPLETED);
    expect(venc.recordingFileId).toBe('f1');
  });

  it('el paciente no puede finalizar la sesión', async () => {
    const d = build();
    const venc: any = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);

    await expect(
      d.service.end(
        've1',
        {},
        {
          id: 'patient-user',
          roles: ['PATIENT'],
          patientProfileId: 'pat-1',
          tenantIds: ['ten-1'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(venc.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS);
  });

  it('un profesional ajeno no finaliza ni escribe datos de cierre', async () => {
    const d = build();
    const venc: any = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);

    await expect(
      d.service.end(
        've1',
        { recordingFileId: 'recording-ajeno' },
        {
          id: 'intruso',
          roles: ['PRACTITIONER'],
          practitionerProfileId: 'pr-intruso',
          tenantIds: ['ten-1'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(venc).toMatchObject({
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
    });
    expect(venc.endedAt).toBeUndefined();
    expect(venc.recordingFileId).toBeUndefined();
  });

  it('un profesional participante activo puede unirse aunque no sea el principal', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    });
    d.clinicalEncountersRepo.findActiveParticipants.mockResolvedValue([
      { practitionerProfileId: 'pr-invitado' },
    ]);

    await expect(
      d.service.join('ve1', {
        id: 'guest-user',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'pr-invitado',
        tenantIds: ['ten-1'],
      }),
    ).resolves.toMatchObject({
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
    });
  });
});
