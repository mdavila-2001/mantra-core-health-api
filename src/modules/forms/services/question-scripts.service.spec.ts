import { jest } from '@jest/globals';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { QuestionScriptsService } from './question-scripts.service';
import { FormsErrorReason } from '../forms.error-reasons';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const doctor = {
  id: 'u-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;
const noProfile = { id: 'u-9', roles: ['PRACTITIONER'] } as any;
const UPDATED = new Date('2026-11-06T12:00:00.000Z');
const row = (over: Record<string, unknown> = {}) => ({
  id: 's-1',
  title: 'Primera consulta',
  description: null,
  specialtyCode: null,
  status: 'active',
  version: 2,
  updatedAt: UPDATED,
  ...over,
});

function build() {
  const tx = {};
  const em = { fork: () => tx, transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    listActive: mockFn().mockResolvedValue([]),
    findActiveOwned: mockFn().mockResolvedValue(row()),
    listItems: mockFn().mockResolvedValue([]),
    insertScript: mockFn().mockResolvedValue('s-1'),
    touchScript: mockFn(),
    replaceItems: mockFn(),
    archive: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new QuestionScriptsService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo, tx };
}

describe('QuestionScriptsService', () => {
  it('lists with the session practitioner as owner and ISO dates', async () => {
    const { service, repo, tx } = build();
    repo.listActive.mockResolvedValue([{ ...row(), itemCount: 3 }]);
    const out = await service.list(doctor);
    expect(repo.listActive).toHaveBeenCalledWith(tx, 'hp-1');
    expect(out.items[0]).toEqual({
      id: 's-1',
      title: 'Primera consulta',
      description: null,
      specialtyCode: null,
      status: 'active',
      itemCount: 3,
      updatedAt: '2026-11-06T12:00:00.000Z',
    });
  });

  it('a session without practitioner profile is a 422', async () => {
    const { service } = build();
    await expect(service.list(noProfile)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it("another practitioner's (or a missing) script is a 404 on every route", async () => {
    const { service, repo } = build();
    repo.findActiveOwned.mockResolvedValue(null);
    for (const call of [
      () => service.get('s-x', doctor),
      () => service.update('s-x', { version: 1 }, doctor),
      () => service.archive('s-x', doctor),
    ]) {
      await expect(call()).rejects.toMatchObject({
        constructor: ResourceNotFoundException,
        reason: FormsErrorReason.QUESTION_SCRIPT_OUT_OF_SCOPE,
      });
    }
    expect(repo.findActiveOwned).toHaveBeenCalledWith(
      expect.anything(),
      's-x',
      'hp-1',
    );
    expect(repo.touchScript).not.toHaveBeenCalled();
    expect(repo.archive).not.toHaveBeenCalled();
  });

  it('creates header and items in the order received, trimmed', async () => {
    const { service, repo, tx } = build();
    await service.create(
      {
        title: 'T',
        items: [
          { questionText: ' A ', answerType: 'free_text', required: false },
          {
            questionText: 'B',
            answerType: 'single_choice',
            options: [' x ', 'y'],
            required: true,
          },
        ],
      },
      doctor,
    );
    expect(repo.insertScript).toHaveBeenCalledWith(
      tx,
      'hp-1',
      {
        title: 'T',
        description: null,
        specialtyCode: null,
      },
      'u-1',
    );
    expect(repo.replaceItems).toHaveBeenCalledWith(
      tx,
      's-1',
      [
        {
          questionText: 'A',
          helpText: null,
          answerType: 'free_text',
          options: null,
          required: false,
        },
        {
          questionText: 'B',
          helpText: null,
          answerType: 'single_choice',
          options: ['x', 'y'],
          required: true,
        },
      ],
      'u-1',
    );
  });

  it('a stale version is a 409 and writes nothing', async () => {
    const { service, repo } = build();
    await expect(
      service.update('s-1', { version: 1, title: 'N' }, doctor),
    ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    expect(repo.findActiveOwned).toHaveBeenCalledWith(
      expect.anything(),
      's-1',
      'hp-1',
      true,
    );
    expect(repo.touchScript).not.toHaveBeenCalled();
    expect(repo.replaceItems).not.toHaveBeenCalled();
  });

  it('PATCH without items keeps them; with items replaces them', async () => {
    const { service, repo } = build();
    await service.update('s-1', { version: 2, title: 'N' }, doctor);
    expect(repo.touchScript).toHaveBeenCalled();
    expect(repo.replaceItems).not.toHaveBeenCalled();
    await service.update(
      's-1',
      {
        version: 2,
        items: [{ questionText: 'Q', answerType: 'date', required: true }],
      },
      doctor,
    );
    expect(repo.replaceItems).toHaveBeenCalledTimes(1);
  });

  it('archive marks the owned script archived', async () => {
    const { service, repo } = build();
    await service.archive('s-1', doctor);
    expect(repo.archive).toHaveBeenCalledWith(expect.anything(), 's-1', 'u-1');
  });
});
