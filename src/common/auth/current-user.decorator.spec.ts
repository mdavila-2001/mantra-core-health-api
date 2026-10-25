import 'reflect-metadata';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

/** Saca la función que Nest ejecuta para resolver el parámetro decorado. */
function factoryOf(): (data: unknown, ctx: ExecutionContext) => unknown {
  class Controller {
    handler(@CurrentUser() _user: unknown): void {
      void _user;
    }
  }
  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Controller,
    'handler',
  ) as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >;
  return args[Object.keys(args)[0]].factory;
}

function contextWith(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('CurrentUser', () => {
  it('entrega el usuario que dejó la autenticación en la petición', () => {
    const user = { id: 'u1', roles: ['USER'] };

    expect(factoryOf()(undefined, contextWith({ user }))).toBe(user);
  });

  it('sin usuario es un error de programación: 500 INTERNAL con reason AUTHENTICATION_NOT_APPLIED', () => {
    let error: unknown;
    try {
      factoryOf()(undefined, contextWith({}));
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(InternalServerErrorException);
    expect((error as InternalServerErrorException).getResponse()).toMatchObject(
      {
        code: 'INTERNAL',
        reason: 'AUTHENTICATION_NOT_APPLIED',
      },
    );
  });
});
