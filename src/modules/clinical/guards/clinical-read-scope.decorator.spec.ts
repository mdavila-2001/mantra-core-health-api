import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import {
  IPS_ONLY_READ_SCOPE,
  type ClinicalReadScope,
} from '../domain/clinical-read-scope';
import { ClinicalReadScopeParam } from './clinical-read-scope.decorator';

class Handler {
  read(@ClinicalReadScopeParam() _scope: ClinicalReadScope): void {}
}

/** Extrae la fábrica que Nest ejecuta al resolver el parámetro. */
function factory(): (
  data: unknown,
  ctx: ExecutionContext,
) => ClinicalReadScope {
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Handler, 'read');
  return args[Object.keys(args)[0]].factory;
}

const contextOf = (request: unknown): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;

describe('ClinicalReadScopeParam', () => {
  it('entrega el alcance que dejó el guard en la petición', () => {
    const scope: ClinicalReadScope = {
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-1'],
    };

    expect(factory()(undefined, contextOf({ clinicalReadScope: scope }))).toBe(
      scope,
    );
  });

  it('si el guard no dejó alcance entrega el más restrictivo, nunca el completo', () => {
    const result = factory()(undefined, contextOf({}));

    expect(result).toBe(IPS_ONLY_READ_SCOPE);
    expect(result.kind).toBe('SPECIALTIES');
  });
});
