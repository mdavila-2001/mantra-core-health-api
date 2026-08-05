import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityPollsController } from './community-polls.controller';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { createPoll: mockFn(), vote: mockFn() };
  return { controller: new CommunityPollsController(service as any), service };
}

describe('CommunityPollsController', () => {
  it('delegates createPoll', async () => {
    const d = build();
    const dto = { question: 'q', options: ['a', 'b'] };
    await d.controller.createPoll('post1', dto, actor);
    expect(d.service.createPoll).toHaveBeenCalledWith('post1', dto, actor);
  });

  it('delegates vote (UC-19-12)', async () => {
    const d = build();
    const dto = { pollOptionId: 'o1', voterProfileId: 'p1' };
    await d.controller.vote('poll1', dto, actor);
    expect(d.service.vote).toHaveBeenCalledWith('poll1', dto, actor);
  });
});
