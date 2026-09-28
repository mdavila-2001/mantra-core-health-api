import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { EncounterInformedConsentsService } from './encounter-informed-consents.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'm1', roles: ['CLINICIAN'] } as any;

/**
 * CL-77: el médico registra el consentimiento informado desde su consulta. El
 * paciente y el tenant salen del encuentro, y sin poder escribir la historia no
 * se firma nada.
 */
function build(opts: { encounter?: any; allowed?: boolean } = {}) {
  const {
    encounter = { id: 'e1', patientProfileId: 'p1', tenantId: 't1' },
    allowed = true,
  } = opts;
  const em: any = { fork: () => em, find: mockFn().mockResolvedValue([]) };
  const encounters = { findById: mockFn().mockResolvedValue(encounter) };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn(async () => {
      if (!allowed) throw new ForbiddenException('sin acceso');
    }),
    assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
  };
  const treatment = {
    sign: mockFn().mockResolvedValue({ id: 'tic1', status: 'signed' }),
  };
  const service = new EncounterInformedConsentsService(
    em,
    encounters as any,
    clinicalRead as any,
    treatment as any,
  );
  return { service, encounters, clinicalRead, treatment, em };
}

describe('EncounterInformedConsentsService (CL-77)', () => {
  it('aceptado: toma paciente y tenant del encuentro y firma', async () => {
    const d = build();
    await d.service.register('e1', { decision: 'ACCEPTED' } as any, ACTOR);
    expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
      'p1',
      ACTOR,
    );
    expect(d.treatment.sign).toHaveBeenCalledWith(
      {
        decision: 'ACCEPTED',
        patientProfileId: 'p1',
        encounterId: 'e1',
        tenantId: 't1',
      },
      ACTOR,
    );
  });

  it('límite: un cuerpo con otro paciente no lo cambia (el encuentro manda)', async () => {
    const d = build();
    await d.service.register(
      'e1',
      {
        decision: 'DECLINED',
        patientProfileId: 'otro',
        tenantId: 'otro',
      } as any,
      ACTOR,
    );
    const firmado = d.treatment.sign.mock.calls[0][0];
    expect(firmado.patientProfileId).toBe('p1');
    expect(firmado.tenantId).toBe('t1');
  });

  it('inválido: encuentro inexistente es 404; sin acceso a la historia es 403 y no firma', async () => {
    const sinEncuentro = build({ encounter: null });
    await expect(
      sinEncuentro.service.register(
        'e1',
        { decision: 'ACCEPTED' } as any,
        ACTOR,
      ),
    ).rejects.toMatchObject({ status: 404 });

    const sinAcceso = build({ allowed: false });
    await expect(
      sinAcceso.service.register('e1', { decision: 'ACCEPTED' } as any, ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sinAcceso.treatment.sign).not.toHaveBeenCalled();
  });

  it('la lectura exige poder leer la historia del paciente del encuentro', async () => {
    const d = build();
    await d.service.listForEncounter('e1', ACTOR);
    expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
      'p1',
      ACTOR,
    );
    expect(d.em.find.mock.calls[0][1]).toEqual({
      encounterId: 'e1',
      patientProfileId: 'p1',
    });
  });
});
