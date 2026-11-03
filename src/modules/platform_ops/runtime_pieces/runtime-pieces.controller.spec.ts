import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AUDITED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { OPS_READ_ROLES } from '../../ops_console/presentation/controllers/ops-console.controller';
import {
  RUNTIME_PIECES_WRITE_ROLES,
  RuntimePiecesController,
} from './runtime-pieces.controller';

type Handlers = Record<string, object>;
const proto = RuntimePiecesController.prototype as unknown as Handlers;

describe('autorización y auditoría de /admin/ops/runtime-pieces', () => {
  it('las lecturas exigen los roles de operación de la consola', () => {
    for (const name of ['list', 'detail']) {
      expect(Reflect.getMetadata(ROLES_KEY, proto[name])).toEqual([
        ...OPS_READ_ROLES,
      ]);
    }
  });

  it('descubrir exige un rol de escritura y deja sello de auditoría', () => {
    expect(Reflect.getMetadata(ROLES_KEY, proto.discover)).toEqual([
      ...RUNTIME_PIECES_WRITE_ROLES,
    ]);
    expect(Reflect.getMetadata(AUDITED_KEY, proto.discover)).toMatchObject({
      action: 'RUNTIME_PIECES_DISCOVERED',
      entity: 'tool_registry',
    });
  });

  it('el rol de escritura es más estrecho que el de lectura', () => {
    expect(
      RUNTIME_PIECES_WRITE_ROLES.every((r) =>
        (OPS_READ_ROLES as readonly string[]).includes(r),
      ),
    ).toBe(true);
    expect(RUNTIME_PIECES_WRITE_ROLES.length).toBeLessThan(
      OPS_READ_ROLES.length,
    );
  });
});
