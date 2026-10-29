import { jest } from '@jest/globals';
import { PROF } from '../../profiles/profiles.concepts';
import { DIR } from '../../directory/directory.concepts';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import {
  PractitionerScopeService,
  collectPractitionerRefs,
} from './practitioner-scope.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const PROPIO = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const AJENO = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PACIENTE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('collectPractitionerRefs', () => {
  it('reúne los campos …ProfileId de profesional, anidados y en listas, y deja fuera al paciente', () => {
    const refs = collectPractitionerRefs({
      patientProfileId: PACIENTE,
      primarySurgeonProfileId: PROPIO,
      airwayAssessment: { assessedByProfileId: AJENO },
      steps: [{ performedByProfileId: PROPIO }, { description: 'x' }],
      respondedByProfileId: AJENO,
    });
    expect(refs).toEqual([
      { field: 'primarySurgeonProfileId', profileId: PROPIO },
      { field: 'airwayAssessment.assessedByProfileId', profileId: AJENO },
      { field: 'steps[0].performedByProfileId', profileId: PROPIO },
      { field: 'respondedByProfileId', profileId: AJENO },
    ]);
  });

  it('ignora lo que no es un UUID (lo rechaza después la validación del DTO) y los cuerpos que no son objetos', () => {
    expect(
      collectPractitionerRefs({ coordinatorProfileId: 'no-es-uuid' }),
    ).toEqual([]);
    expect(collectPractitionerRefs({ coordinatorProfileId: 42 })).toEqual([]);
    expect(collectPractitionerRefs(undefined)).toEqual([]);
    expect(collectPractitionerRefs('texto')).toEqual([]);
  });

  it('un campo de profesional que se agregue mañana queda cubierto por su nombre', () => {
    expect(collectPractitionerRefs({ nuevoCampoProfileId: PROPIO })).toEqual([
      { field: 'nuevoCampoProfileId', profileId: PROPIO },
    ]);
  });
});

describe('PractitionerScopeService · IDOR de perfiles entre tenants', () => {
  function build(linked: string[]) {
    const tx = {
      execute: mockFn().mockResolvedValue(
        linked.map((profile_id) => ({ profile_id })),
      ),
    };
    return { tx, service: new PractitionerScopeService() };
  }

  it('un profesional propio pasa', async () => {
    const d = build([PROPIO]);
    await expect(
      d.service.assertInTenant(d.tx as any, TENANT, [
        { field: 'coordinatorProfileId', profileId: PROPIO },
      ]),
    ).resolves.toBeUndefined();
  });

  it('uno de otro tenant y uno inexistente responden EXACTAMENTE lo mismo (no se revela si existe)', async () => {
    const ajeno = build([]); // la consulta no lo encuentra vinculado
    const inexistente = build([]);
    const error = async (d: ReturnType<typeof build>, id: string) => {
      try {
        await d.service.assertInTenant(d.tx as any, TENANT, [
          { field: 'coordinatorProfileId', profileId: id },
        ]);
      } catch (e) {
        return e as any;
      }
      throw new Error('debía fallar');
    };
    const a = await error(ajeno, AJENO);
    const b = await error(inexistente, '99999999-9999-4999-8999-999999999999');
    expect(a.getStatus()).toBe(422);
    expect(a.reason).toBe(Reason.PRACTITIONER_NOT_IN_TENANT);
    expect(a.getResponse()).toMatchObject({
      reason: b.reason,
      message: b.message,
      details: b.details,
    });
    // El id no viaja en la respuesta.
    expect(JSON.stringify(a.getResponse())).not.toContain(AJENO);
  });

  it('con varios campos falla si alguno es ajeno y nombra todos los ajenos', async () => {
    const d = build([PROPIO]);
    await expect(
      d.service.assertInTenant(d.tx as any, TENANT, [
        { field: 'primarySurgeonProfileId', profileId: PROPIO },
        { field: 'requestedByProfileId', profileId: AJENO },
        { field: 'anesthesiologistProfileId', profileId: AJENO },
      ]),
    ).rejects.toMatchObject({
      reason: Reason.PRACTITIONER_NOT_IN_TENANT,
      details: {
        fields: ['requestedByProfileId', 'anesthesiologistProfileId'],
      },
    });
  });

  it('consulta una vez por lote, con el tenant, la membresía vigente y la afiliación APROBADA (no la declarada)', async () => {
    const d = build([PROPIO, AJENO]);
    await d.service.assertInTenant(d.tx as any, TENANT, [
      { field: 'a', profileId: PROPIO },
      { field: 'b', profileId: AJENO },
      { field: 'c', profileId: PROPIO },
    ]);
    expect(d.tx.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = d.tx.execute.mock.calls[0];
    expect(sql).toContain('directory.tenant_memberships');
    expect(sql).toContain('practitioner_affiliations');
    expect(params).toEqual([
      PROPIO,
      AJENO,
      PROF.ACCOUNT_LINK_ACTIVE,
      TENANT,
      DIR.MEMBERSHIP_ACTIVE,
      PROF.AFFILIATION_APPROVED,
      PROF.AFFILIATION_ACTIVE,
      TENANT,
    ]);
    expect(params).not.toContain(PROF.AFFILIATION_DECLARED);
  });

  it('sin referencias no consulta nada', async () => {
    const d = build([]);
    await d.service.assertInTenant(d.tx as any, TENANT, []);
    expect(d.tx.execute).not.toHaveBeenCalled();
  });
});
