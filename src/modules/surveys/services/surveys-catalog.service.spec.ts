import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import { SYSTEM_BASE_SURVEY_VERSION } from '../surveys.base-definitions';
import { SurveysCatalogService } from './surveys-catalog.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'ten-1';
const actor = { id: 'usr-1', practitionerProfileId: 'hp-1' } as any;

function build() {
  const em: any = {};
  const templatesRepo: any = {
    findTemplateById: mockFn(async (_em: any, id: string) => ({
      title: `Base ${id}`,
      description: 'd',
    })),
    countQuestions: mockFn(async () => 7),
  };
  const own = {
    id: 'own-1',
    title: 'Mía',
    status: 'DRAFT',
    latestVersionNumber: 2,
    published: false,
    questionCount: 3,
  };
  const assignment = {
    id: 'a1',
    targetType: 'SERVICE',
    targetId: 's1',
    targetName: 'Ecografía',
    active: true,
  };
  const templates: any = {
    listTemplates: mockFn(async () => [own]),
    listAssignments: mockFn(async () => [assignment]),
  };
  const system: any = {
    ensureSystemTemplate: mockFn(async (_t: string, kind: string) => ({
      kind,
      templateId: `tpl-${kind}`,
      versionId: `ver-${kind}`,
    })),
  };
  const service = new SurveysCatalogService(
    em,
    templatesRepo,
    templates,
    system,
  );
  return { service, templates, system, assignment };
}

describe('SurveysCatalogService', () => {
  it('returns both base surveys first, then the own ones with their services', async () => {
    const { service, assignment } = build();
    const list = await runWithTenant(TENANT, () => service.list(actor));

    expect(list.map((e) => [e.origin, e.scope ?? null])).toEqual([
      ['SYSTEM', 'CONSULTATION'],
      ['SYSTEM', 'SERVICE'],
      ['PRACTITIONER', null],
    ]);
    expect(list[0]).toMatchObject({
      id: 'tpl-CONSULTATION',
      status: 'ACTIVE',
      published: true,
      latestVersionNumber: SYSTEM_BASE_SURVEY_VERSION,
      questionCount: 7,
      assignments: [],
    });
    expect(list[2].assignments).toEqual([assignment]);
  });

  it('materializes the base surveys of the caller tenant', async () => {
    const { service, system } = build();
    await runWithTenant(TENANT, () => service.list(actor));
    expect(system.ensureSystemTemplate).toHaveBeenCalledWith(
      TENANT,
      'CONSULTATION',
      'usr-1',
    );
    expect(system.ensureSystemTemplate).toHaveBeenCalledTimes(2);
  });
});
