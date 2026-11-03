import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { pdpActionForCode } from '../../common/auth/permission-decision.port';
import { PLATFORM_PERMISSION_SEED } from './authz.seed';
import { PILOT_PERMISSION_DEFINITIONS } from './authz.permission-pilot.seed';
import { IAM_POLICY_ROLE_SEED } from './authz.global-role-bindings';

describe('catálogo del piloto RequirePermission', () => {
  it('los once permisos coinciden con los códigos y roles de las rutas reales', () => {
    const routes = new Map<string, string[]>();
    for (const folder of [
      'accounting/controllers',
      'authz/controllers',
      'scheduling/presentation/controllers',
    ]) {
      const root = join(process.cwd(), 'src/modules', folder);
      for (const file of readdirSync(root).filter((f) =>
        f.endsWith('.controller.ts'),
      )) {
        const tree = ts.createSourceFile(
          file,
          readFileSync(join(root, file), 'utf8'),
          ts.ScriptTarget.Latest,
          true,
        );
        const visit = (node: ts.Node) => {
          if (ts.isMethodDeclaration(node)) {
            const calls = (ts.getDecorators(node) ?? [])
              .map((d) => d.expression)
              .filter(ts.isCallExpression);
            const called = (name: string) =>
              calls.find(
                (c) =>
                  ts.isIdentifier(c.expression) && c.expression.text === name,
              );
            const permission = called('RequirePermission')?.arguments[0];
            if (permission && ts.isStringLiteral(permission)) {
              const roles =
                called('Roles')
                  ?.arguments.filter(ts.isStringLiteral)
                  .map((r) => r.text) ?? [];
              routes.set(permission.text, roles);
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(tree);
      }
    }
    expect(routes.size).toBe(11);
    expect(PILOT_PERMISSION_DEFINITIONS).toHaveLength(routes.size);
    for (const [code, , action, , roles] of PILOT_PERMISSION_DEFINITIONS) {
      expect(routes.get(code)).toEqual([...roles]);
      expect(action).toBe(pdpActionForCode(code));
      const seed = PLATFORM_PERMISSION_SEED.find((p) => p.code === code);
      expect(seed).toMatchObject({
        resource: code,
        allowDirectUserGrant: false,
        isDangerous: true,
      });
    }
  });

  it('el descriptor SECURITY_ADMIN no se concede mediante asignaciones de authz', () => {
    expect(IAM_POLICY_ROLE_SEED).toEqual([
      expect.objectContaining({
        code: 'SECURITY_ADMIN',
        scope: 'GLOBAL',
        isAssignable: false,
      }),
    ]);
  });
});
