import { describe, expect, it, jest } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IS_PUBLIC_KEY } from '../../../../common/auth/public.decorator';
import { IdentifierExistsQueryDto } from '../dto/identifier-exists.dto';
import { IamIdentifierExistsController } from './iam-identifier-exists.controller';

const errorsOf = (plain: object) =>
  validate(plainToInstance(IdentifierExistsQueryDto, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('IamIdentifierExistsController', () => {
  const handler = (IamIdentifierExistsController.prototype as any).check;

  it('is public and throttled like login (10 per minute per IP)', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(10);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60_000);
  });

  it('delegates kind and value and returns only the boolean', async () => {
    const execute = (jest.fn as any)(async () => ({ exists: true }));
    const controller = new IamIdentifierExistsController({ execute } as any);
    await expect(
      controller.check({ kind: 'ORG_NAME', value: 'Lab Central' }),
    ).resolves.toEqual({ exists: true });
    expect(execute).toHaveBeenCalledWith('ORG_NAME', 'Lab Central');
  });

  it('accepts only organization names on this public route', async () => {
    expect(await errorsOf({ kind: 'ORG_NAME', value: 'x' })).toHaveLength(0);
    // A national id or email would be an unauthenticated existence oracle.
    for (const kind of ['NATIONAL_ID', 'EMAIL']) {
      expect(await errorsOf({ kind, value: 'x' })).not.toHaveLength(0);
    }
  });

  it('rejects an unknown kind, an empty value and extra query keys', async () => {
    expect(await errorsOf({ kind: 'PHONE', value: 'x' })).not.toHaveLength(0);
    expect(await errorsOf({ kind: 'ORG_NAME', value: '' })).not.toHaveLength(0);
    expect(
      await errorsOf({ kind: 'ORG_NAME', value: 'x', tenantId: 'y' }),
    ).not.toHaveLength(0);
  });
});
