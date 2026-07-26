import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { VirtualEncountersController } from './virtual-encounters.controller';

const actor = { id: 'md-1', roles: ['USER'] } as any;

function build() {
  const virtualEncountersService = { create: mockFn(), join: mockFn(), end: mockFn() };
  const controller = new VirtualEncountersController(virtualEncountersService as any);
  return { controller, virtualEncountersService };
}

describe('VirtualEncountersController (UC-18-12)', () => {
  it('delegates create', async () => {
    const d = build();
    const dto = { encounterId: 'e1' };
    await d.controller.create(dto as any, actor);
    expect(d.virtualEncountersService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates join', async () => {
    const d = build();
    await d.controller.join('ve1', actor);
    expect(d.virtualEncountersService.join).toHaveBeenCalledWith('ve1', actor);
  });

  it('delegates end', async () => {
    const d = build();
    const dto = { recordingFileId: 'f1' };
    await d.controller.end('ve1', dto as any, actor);
    expect(d.virtualEncountersService.end).toHaveBeenCalledWith('ve1', dto, actor);
  });
});
