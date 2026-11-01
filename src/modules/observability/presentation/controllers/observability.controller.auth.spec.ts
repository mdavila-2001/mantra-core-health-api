import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AUDITED_KEY } from '../../../../common/audit-trail/audit-trail.decorators';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { PLATFORM_SCOPE_OPTIONAL_KEY } from '../../../../common/tenant/platform-scope';
import { OPS_READ_ROLES } from '../../../ops_console/presentation/controllers/ops-console.controller';
import { SystemObservabilityModule } from '../../observability.module';
import { ObservabilityController } from './observability.controller';
import { ObservabilitySelftestController } from './observability-selftest.controller';

const proto = ObservabilityController.prototype as unknown as Record<
  string,
  (...args: never[]) => unknown
>;
const handlers = Object.getOwnPropertyNames(proto).filter(
  (name) => name !== 'constructor',
);

const metaOf = (key: string, name: string): unknown =>
  Reflect.getMetadata(key, proto[name]);

describe('autorización de /admin/observability (el API autoriza)', () => {
  it('@PlatformScopeOptional NO está en la clase (advertencia del README)', () => {
    expect(
      Reflect.getMetadata(PLATFORM_SCOPE_OPTIONAL_KEY, ObservabilityController),
    ).toBeUndefined();
  });

  it('todo GET lleva OPS_READ_ROLES y @PlatformScopeOptional por método', () => {
    const gets = handlers.filter((n) => n !== 'changeErrorGroupState');
    expect(gets).toHaveLength(12);
    for (const name of gets) {
      expect(metaOf(ROLES_KEY, name)).toEqual([...OPS_READ_ROLES]);
      expect(metaOf(PLATFORM_SCOPE_OPTIONAL_KEY, name)).toBe(true);
    }
  });

  it('el PATCH de estado NO es de alcance plataforma, exige PLATFORM_ADMIN|SRE y está auditado', () => {
    expect(
      metaOf(PLATFORM_SCOPE_OPTIONAL_KEY, 'changeErrorGroupState'),
    ).toBeUndefined();
    expect(metaOf(ROLES_KEY, 'changeErrorGroupState')).toEqual([
      'PLATFORM_ADMIN',
      'SRE',
    ]);
    expect(metaOf(AUDITED_KEY, 'changeErrorGroupState')).toMatchObject({
      action: 'ERROR_GROUP_STATE_CHANGED',
      entity: 'error_group',
      entityId: 'param:id',
    });
  });

  it('OPS_READ_ROLES no se amplió', () => {
    expect([...OPS_READ_ROLES]).toEqual([
      'PLATFORM_ADMIN',
      'SRE',
      'SECURITY_ADMIN',
      'RELEASE_MANAGER',
      'GOVERNANCE_ADMIN',
    ]);
  });

  it('la ruta de falla es SYSTEM y sólo se registra fuera de producción', () => {
    const handler: unknown = Reflect.get(
      ObservabilitySelftestController.prototype,
      'fail',
    );
    expect(Reflect.getMetadata(ROLES_KEY, handler as object)).toEqual([
      'SYSTEM',
    ]);
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      SystemObservabilityModule,
    ) as unknown[];
    // Jest corre con NODE_ENV=test: está registrada.
    expect(controllers).toContain(ObservabilitySelftestController);
  });

  it('el handler de la ruta de falla responde 404 con NODE_ENV=production', () => {
    const saved = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => new ObservabilitySelftestController().fail({})).toThrow(
        'Not Found',
      );
    } finally {
      process.env.NODE_ENV = saved;
    }
  });
});
