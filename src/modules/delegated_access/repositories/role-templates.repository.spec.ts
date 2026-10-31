import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { RoleTemplatesRepository } from './role-templates.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const em: any = { create: mockFn((_e: unknown, data: unknown) => data) };
  return { repo: new RoleTemplatesRepository(), em };
}

describe('RoleTemplatesRepository: condiciones por defecto y techo (v4.2.72)', () => {
  it('una plantilla v2 guarda sus átomos, las condiciones por defecto y su techo', () => {
    const { repo, em } = build();

    const row: any = repo.create(em, {
      id: 'tpl-v2',
      code: 'SECRETARY',
      name: 'Secretaria',
      defaultActions: ['agenda.appointment.view'],
      defaultConditions: {
        'agenda.appointment.view.reason': {
          schemaVersion: 1,
          fields: { reason: { mask: 'PARTIAL' } },
        },
      },
      ceilingActions: ['agenda.*', 'patients.search.exact'],
      statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
      versionNumber: 2,
    });

    expect(row).toMatchObject({
      defaultActionsJson: ['agenda.appointment.view'],
      defaultConditionsJson: {
        'agenda.appointment.view.reason': {
          schemaVersion: 1,
          fields: { reason: { mask: 'PARTIAL' } },
        },
      },
      ceilingActionsJson: ['agenda.*', 'patients.search.exact'],
      versionNumber: 2,
    });
  });

  it('una plantilla v1 sigue naciendo sin condiciones ni techo (NULL = sin techo propio)', () => {
    const { repo, em } = build();
    const row: any = repo.create(em, {
      code: 'NURSING',
      name: 'Enfermería',
      defaultActions: ['schedule.view'],
      statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
      versionNumber: 1,
    });
    expect(row.defaultConditionsJson).toBeUndefined();
    expect(row.ceilingActionsJson).toBeUndefined();
  });
});
