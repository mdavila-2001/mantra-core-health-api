import { jest } from '@jest/globals';

import { CONCEPTS } from '../../../../common';
import { IamDocumentAvailabilityService } from './iam-document-availability.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const LA_PAZ = '11111111-1111-5111-8111-111111111111';

function build(opts: { holder?: unknown; credential?: unknown } = {}) {
  const fork = {};
  const em = { fork: fn(() => fork) };
  const identifiersRepo = {
    findDocumentHolder: fn(async () => opts.holder ?? null),
  };
  const credentialsRepo = {
    findLivePasswordBySubject: fn(async () => opts.credential ?? null),
  };
  const service = new IamDocumentAvailabilityService(
    em as never,
    identifiersRepo as never,
    credentialsRepo as never,
  );
  return { service, identifiersRepo, credentialsRepo, fork };
}

describe('IamDocumentAvailabilityService (C-10 / MD-01)', () => {
  it('libre cuando nadie de ese tipo tiene el documento', async () => {
    const { service } = build();
    await expect(
      service.check({
        number: '1234567',
        issuer: LA_PAZ,
        userType: 'PRACTITIONER',
      }),
    ).resolves.toEqual({ available: true });
  });

  it('tomado cuando ya hay un médico con ese documento', async () => {
    const { service, identifiersRepo, fork } = build({ holder: { id: 'x' } });
    await expect(
      service.check({
        number: '1234567',
        issuer: LA_PAZ,
        userType: 'PRACTITIONER',
      }),
    ).resolves.toEqual({ available: false });
    expect(identifiersRepo.findDocumentHolder).toHaveBeenCalledWith(fork, {
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: '1234567',
      issuerAdministrativeAreaConceptId: LA_PAZ,
      ownerKindConceptId: CONCEPTS.DOC_HOLDER_PRACTITIONER,
    });
  });

  it('para el médico no mira credenciales: su login es el correo', async () => {
    const { service, credentialsRepo } = build({ credential: { id: 'c' } });
    await expect(
      service.check({
        number: '1234567',
        issuer: LA_PAZ,
        userType: 'PRACTITIONER',
      }),
    ).resolves.toEqual({ available: true });
    expect(credentialsRepo.findLivePasswordBySubject).not.toHaveBeenCalled();
  });

  it('para el paciente, una credencial viva con ese documento también lo toma', async () => {
    const { service } = build({ credential: { id: 'c' } });
    await expect(
      service.check({
        number: '1234567',
        issuer: LA_PAZ,
        userType: 'PATIENT',
      }),
    ).resolves.toEqual({ available: false });
  });

  it('la respuesta nunca dice a quién pertenece', async () => {
    const { service } = build({ holder: { id: 'x', ownerId: 'persona' } });
    const result = await service.check({
      number: '1234567',
      issuer: LA_PAZ,
      userType: 'PATIENT',
    });
    expect(Object.keys(result)).toEqual(['available']);
  });
});
