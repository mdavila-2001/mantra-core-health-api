import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { TenantTaxIdentifierService } from './tenant-tax-identifier.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

type Row = {
  id: string;
  ownerTypeConceptId: string;
  typeConceptId: string;
  value: string;
  validTo?: Date;
};

function build(rows: Row[] = []) {
  const identifiers = {
    findCurrentByOwner: fn(async () => rows),
    create: fn((_em: unknown, data: Record<string, unknown>) => ({
      id: 'identifier-new',
      ...data,
    })),
  };
  const service = new TenantTaxIdentifierService(identifiers as never);
  const tx = { flush: fn(async () => undefined) };
  return { service, identifiers, tx: tx as never, flush: tx.flush };
}

const nit = (value: string): Row => ({
  id: 'identifier-old',
  ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
  typeConceptId: CONCEPTS.ID_TYPE_TAX,
  value,
});
const input = { tenantId: 't-1', value: ' 1023456029 ', actorUserId: 'u-1' };

describe('TenantTaxIdentifierService', () => {
  it('records the NIT as a tenant tax identifier, trimmed', async () => {
    const d = build();

    const id = await d.service.register(d.tx, {
      ...input,
      holderName: 'Lab SRL',
    });

    expect(id).toBe('identifier-new');
    // Flushed before returning, so a document can reference it safely.
    expect(d.flush).toHaveBeenCalled();
    expect(d.identifiers.create).toHaveBeenCalledWith(d.tx, {
      ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
      ownerId: 't-1',
      typeConceptId: CONCEPTS.ID_TYPE_TAX,
      value: '1023456029',
      holderName: 'Lab SRL',
      useConceptId: CONCEPTS.USE_OFFICIAL,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      actorUserId: 'u-1',
    });
  });

  it('the same NIT keeps the current row', async () => {
    const d = build([nit('1023456029')]);

    expect(await d.service.register(d.tx, input)).toBe('identifier-old');
    expect(d.identifiers.create).not.toHaveBeenCalled();
    expect(d.flush).not.toHaveBeenCalled();
  });

  it('a different NIT closes the current row and opens a new one', async () => {
    const old = nit('111222333');
    const d = build([old]);

    expect(await d.service.register(d.tx, input)).toBe('identifier-new');
    expect(old.validTo).toBeInstanceOf(Date);
  });

  it('reads only the tenant tax identifier', async () => {
    const other = { ...nit('X-1'), typeConceptId: 'another-type' };
    expect(
      await build([other]).service.currentValue(build().tx, 't-1'),
    ).toBeUndefined();
    expect(
      await build([nit('1023456029')]).service.currentValue(build().tx, 't-1'),
    ).toBe('1023456029');
  });
});
