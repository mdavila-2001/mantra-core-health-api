import { jest } from '@jest/globals';
import { ImagingStudies } from '../../diagnostics/entities';
import { PatientProfiles } from '../../profiles/entities';
import { DicomStudyManifests } from '../entities';
import { DicomRepository } from './dicom.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('DicomRepository · alcance de tenant (OBJ-01)', () => {
  const repo = new DicomRepository();

  it('findStudyByUid busca por tenant y UID: el UID de otro tenant no se encuentra', async () => {
    const em = { findOne: mockFn().mockResolvedValue(null) } as any;

    await repo.findStudyByUid(em, 'tenant-1', '1.2.3');

    expect(em.findOne).toHaveBeenCalledWith(DicomStudyManifests, {
      tenantId: 'tenant-1',
      studyInstanceUid: '1.2.3',
    });
  });

  it('patientProfileExists consulta la clave primaria del perfil', async () => {
    const em = {
      count: mockFn().mockResolvedValueOnce(1).mockResolvedValueOnce(0),
    } as any;

    await expect(repo.patientProfileExists(em, 'pat')).resolves.toBe(true);
    await expect(repo.patientProfileExists(em, 'pat-9')).resolves.toBe(false);
    expect(em.count).toHaveBeenNthCalledWith(1, PatientProfiles, {
      profileId: 'pat',
    });
  });

  it('imagingStudyInScope exige la custodia del tenant y, si se declara, el paciente', async () => {
    const em = { count: mockFn().mockResolvedValue(1) } as any;

    await expect(
      repo.imagingStudyInScope(em, 'img', 'tenant-1', 'pat'),
    ).resolves.toBe(true);
    await repo.imagingStudyInScope(em, 'img', 'tenant-1');

    expect(em.count).toHaveBeenNthCalledWith(1, ImagingStudies, {
      id: 'img',
      custodianTenantId: 'tenant-1',
      patientProfileId: 'pat',
    });
    expect(em.count).toHaveBeenNthCalledWith(2, ImagingStudies, {
      id: 'img',
      custodianTenantId: 'tenant-1',
    });
  });
});
