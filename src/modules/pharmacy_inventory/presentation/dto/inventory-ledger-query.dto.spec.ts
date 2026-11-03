import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PHARMACY_INVENTORY_CONCEPT_SEEDS } from '../../domain/pharmacy_inventory.concepts';
import {
  InventoryLedgerQueryDto,
  MOVEMENT_TYPE_CODES,
} from './inventory-ledger-query.dto';

const errorsFor = (movementType: string) =>
  validateSync(plainToInstance(InventoryLedgerQueryDto, { movementType }));

describe('InventoryLedgerQueryDto.movementType', () => {
  it('lists every movement type of the module in the stored catalog form', () => {
    const expected = PHARMACY_INVENTORY_CONCEPT_SEEDS.filter((s) =>
      s.code.startsWith('PINV_MV_'),
    ).map((s) => `pharmacy_inventory:${s.key.split(':')[1]}`);
    expect(MOVEMENT_TYPE_CODES).toEqual(expected);
    expect(MOVEMENT_TYPE_CODES).toContain('pharmacy_inventory:MV_RECEIPT');
    expect(MOVEMENT_TYPE_CODES).toHaveLength(12);
  });

  it('accepts the value the response returns in movementType.code', () => {
    for (const code of MOVEMENT_TYPE_CODES) expect(errorsFor(code)).toEqual([]);
  });

  it('rejects the display code and unknown values', () => {
    for (const code of ['PINV_MV_RECEIPT', 'pharmacy_inventory:MV_NOPE', 'x']) {
      expect(errorsFor(code)).toHaveLength(1);
    }
  });
});
