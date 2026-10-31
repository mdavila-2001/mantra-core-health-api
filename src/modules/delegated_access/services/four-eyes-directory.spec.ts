import { jest } from '@jest/globals';
import { ApproverDirectoryBuilder } from './four-eyes-directory';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('ApproverDirectoryBuilder · jefes de servicio (SEG A-A5)', () => {
  const build = (admins?: any) => {
    const queries = {
      securityAdminUserIds: mockFn().mockResolvedValue(['gonzalo']),
    };
    const access = {
      findEngagements: mockFn().mockResolvedValue([]),
      findGrantsWithActions: mockFn().mockResolvedValue([]),
      findRoleAssignments: mockFn().mockResolvedValue(new Map()),
    };
    return {
      queries,
      access,
      builder: new ApproverDirectoryBuilder(
        queries as any,
        access as any,
        admins,
      ),
    };
  };

  it('el alcance de los jefes de servicio sale de la función común: solo vínculo vivo, sin DENY ni regla L1', async () => {
    const scopes = [
      {
        adminUserId: 'sofia',
        target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
      },
    ];
    const admins = { adminScopes: mockFn().mockResolvedValue(scopes) };
    const d = build(admins);
    const out = await d.builder.build({} as any, 'tenant-1', {
      wantServiceHeads: true,
    });
    expect(out.serviceHeadScopes).toEqual(scopes);
    expect(admins.adminScopes).toHaveBeenCalledWith(
      {},
      'tenant-1',
      'team.grants.assign',
      expect.any(Date),
    );
    expect(d.access.findEngagements).not.toHaveBeenCalled();
  });

  it('sin pedirlos no consulta jefes de servicio', async () => {
    const admins = { adminScopes: mockFn() };
    const out = await build(admins).builder.build({} as any, 'tenant-1', {});
    expect(out.serviceHeadScopes).toEqual([]);
    expect(admins.adminScopes).not.toHaveBeenCalled();
  });
});
