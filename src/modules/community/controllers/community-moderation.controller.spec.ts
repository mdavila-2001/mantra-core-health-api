import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityModerationController } from './community-moderation.controller';

const actor = { id: 'mod-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { report: mockFn(), decide: mockFn(), appeal: mockFn() };
  return {
    controller: new CommunityModerationController(service as any),
    service,
  };
}

describe('CommunityModerationController', () => {
  it('delegates report (UC-19-08)', async () => {
    const d = build();
    const dto = { targetType: 'POST', targetId: 'r', reason: 'SPAM' };
    await d.controller.report(dto as any, actor);
    expect(d.service.report).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates decide (UC-19-09)', async () => {
    const d = build();
    const dto = { decision: 'REMOVED' };
    await d.controller.decide('q1', dto as any, actor);
    expect(d.service.decide).toHaveBeenCalledWith('q1', dto, actor);
  });

  it('delegates appeal (UC-19-10)', async () => {
    const d = build();
    const dto = { appellantProfileId: 'p1', reasonText: 'x' };
    await d.controller.appeal('dec1', dto, actor);
    expect(d.service.appeal).toHaveBeenCalledWith('dec1', dto, actor);
  });
});
