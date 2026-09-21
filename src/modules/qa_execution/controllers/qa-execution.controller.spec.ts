import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import {
  QA_APPROVE_ROLES,
  QA_PLAN_ROLES,
  QA_TARGET_ROLES,
  QaExecutionController,
  QaExecutionInternalController,
} from './qa-execution.controller';
import {
  QA_LAB_READ_ROLES,
  QaLabReadController,
} from '../../qa_lab/controllers/qa-lab-read.controller';

function rolesOf(controller: { prototype: object }) {
  const proto = controller.prototype as Record<string, object>;
  return Object.fromEntries(
    Object.getOwnPropertyNames(proto)
      .filter((name) => name !== 'constructor')
      .map((name) => [
        name,
        Reflect.getMetadata(ROLES_KEY, proto[name]) as string[] | undefined,
      ]),
  );
}

describe('autorización del plano de ejecución de QA', () => {
  const admin = rolesOf(QaExecutionController);

  it('ningún handler queda sin rol', () => {
    for (const roles of [admin, rolesOf(QaLabReadController)]) {
      expect(Object.entries(roles).filter(([, r]) => !r?.length)).toEqual([]);
    }
  });

  it('configurar destinos, pedir planes y aprobarlos son permisos distintos', () => {
    expect(admin.upsertTarget).toEqual([...QA_TARGET_ROLES]);
    expect(admin.createPlan).toEqual([...QA_PLAN_ROLES]);
    expect(admin.approve).toEqual([...QA_APPROVE_ROLES]);
    // Un QA_ENGINEER puede pedir, pero no aprobar ni abrir destinos.
    expect(QA_APPROVE_ROLES).not.toContain('QA_ENGINEER');
    expect(QA_TARGET_ROLES).not.toContain('QA_ENGINEER');
  });

  it('el runner sólo lo alcanza la identidad de servicio', () => {
    expect(rolesOf(QaExecutionInternalController)).toEqual({
      runNext: ['SYSTEM'],
    });
  });

  it('la lectura del laboratorio no incluye roles de escritura ajenos', () => {
    expect(rolesOf(QaLabReadController).run).toEqual([...QA_LAB_READ_ROLES]);
  });
});
