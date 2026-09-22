import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import {
  ANALYTICS_RAW_ROLES,
  ANALYTICS_READ_ROLES,
  TelemetryAnalyticsController,
} from './telemetry-analytics.controller';

describe('autorización de /admin/analytics', () => {
  const proto = TelemetryAnalyticsController.prototype as unknown as Record<
    string,
    object
  >;
  const roles = (handler: string) =>
    Reflect.getMetadata(ROLES_KEY, proto[handler]) as string[] | undefined;

  it('ningún handler queda sin rol', () => {
    const handlers = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor',
    );
    expect(handlers.filter((name) => !roles(name)?.length)).toEqual([]);
  });

  it('el timeline de sesión exige más que los agregados', () => {
    expect(roles('overview')).toEqual([...ANALYTICS_READ_ROLES]);
    expect(roles('getSession')).toEqual([...ANALYTICS_RAW_ROLES]);
    expect(roles('listSessions')).toEqual([...ANALYTICS_RAW_ROLES]);
    // Marketing ve agregados, no recorridos individuales.
    expect(ANALYTICS_RAW_ROLES).not.toContain('MARKETING_MANAGER');
  });
});
