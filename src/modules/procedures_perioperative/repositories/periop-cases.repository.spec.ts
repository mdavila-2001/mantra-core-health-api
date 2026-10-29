import { jest } from '@jest/globals';
import { PeriopCasesRepository } from './periop-cases.repository';
import {
  Appointments,
  CareEpisodes,
  Encounters,
  ServiceRequests,
} from '../../clinical/entities';
import { PatientProfiles } from '../../profiles/entities';
import { AppointmentBookings } from '../../scheduling/entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

type Rows = Map<unknown, Array<Record<string, string>>>;

/**
 * `EntityManager` en doble: cuenta las filas sembradas en `rows` que cumplen
 * el filtro (paciente y tenant, o la alternativa `$or` de la solicitud).
 */
function build(rows: Rows) {
  const em = {
    count: mockFn((entity: unknown, where: Record<string, any>) => {
      const matches = (rows.get(entity) ?? []).filter((row) => {
        if (entity === PatientProfiles) {
          return row.profileId === where.profileId;
        }
        if (row.patientProfileId !== where.patientProfileId) return false;
        if (where.$or) {
          return where.$or.some((alt: Record<string, string>) =>
            Object.entries(alt).every(([k, v]) => row[k] === v),
          );
        }
        return row.tenantId === where.tenantId;
      });
      return Promise.resolve(matches.length);
    }),
  };
  return { em, repo: new PeriopCasesRepository() };
}

const PAT = 'pat-1';
const PATIENT_ROW: [unknown, Array<Record<string, string>>] = [
  PatientProfiles,
  [{ profileId: PAT }],
];

describe('PeriopCasesRepository.patientHasCareInTenant (#893)', () => {
  it('un paciente inexistente no tiene atención en ningún tenant', async () => {
    const d = build(new Map());
    await expect(
      d.repo.patientHasCareInTenant(d.em as any, PAT, 't1'),
    ).resolves.toBe(false);
    // Sin perfil no se pregunta por huellas: no hay a quién atribuírselas.
    expect(d.em.count).toHaveBeenCalledTimes(1);
  });

  it('un paciente atendido sólo en otro tenant responde igual que uno inexistente', async () => {
    const d = build(
      new Map([
        PATIENT_ROW,
        [Encounters, [{ patientProfileId: PAT, tenantId: 't2' }]],
        [AppointmentBookings, [{ patientProfileId: PAT, tenantId: 't2' }]],
        [
          ServiceRequests,
          [
            {
              patientProfileId: PAT,
              custodianTenantId: 't2',
              performerTenantId: 't3',
            },
          ],
        ],
      ]) as Rows,
    );
    await expect(
      d.repo.patientHasCareInTenant(d.em as any, PAT, 't1'),
    ).resolves.toBe(false);
  });

  it.each([
    ['un encuentro', Encounters],
    ['un episodio de atención', CareEpisodes],
    ['un turno', Appointments],
    ['una reserva', AppointmentBookings],
  ])('reconoce %s del paciente en el tenant', async (_label, entity) => {
    const d = build(
      new Map([
        PATIENT_ROW,
        [entity, [{ patientProfileId: PAT, tenantId: 't1' }]],
      ]) as Rows,
    );
    await expect(
      d.repo.patientHasCareInTenant(d.em as any, PAT, 't1'),
    ).resolves.toBe(true);
  });

  it('reconoce una solicitud de servicio del tenant, como custodio o como ejecutor', async () => {
    for (const row of [
      {
        patientProfileId: PAT,
        custodianTenantId: 't1',
        performerTenantId: 'x',
      },
      {
        patientProfileId: PAT,
        custodianTenantId: 'x',
        performerTenantId: 't1',
      },
    ]) {
      const d = build(new Map([PATIENT_ROW, [ServiceRequests, [row]]]) as Rows);
      await expect(
        d.repo.patientHasCareInTenant(d.em as any, PAT, 't1'),
      ).resolves.toBe(true);
    }
  });
});
