import { Global, Module } from '@nestjs/common';
import { loadEnv } from './env';

export const MOCK_ENV = Symbol('MOCK_ENV');

/** Expone el entorno leído una vez al arrancar, inyectable en cualquier módulo. */
@Global()
@Module({
  providers: [{ provide: MOCK_ENV, useValue: loadEnv() }],
  exports: [MOCK_ENV],
})
export class EnvModule {}
