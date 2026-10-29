import { PreconditionFailedException } from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';
import { assertNoAutomaticRoomCharge } from './room-charge-guard';

describe('assertNoAutomaticRoomCharge', () => {
  it('deja pasar los cargos que no son de sala', () => {
    expect(() =>
      assertNoAutomaticRoomCharge([
        { chargeType: 'PROCEDURE' },
        { chargeType: 'IMPLANT' },
        { chargeType: 'SUPPLY' },
      ]),
    ).not.toThrow();
  });

  it('un cargo de tiempo de quirófano es 422 ROOM_CHARGE_IS_AUTOMATIC (evita el doble cobro)', () => {
    let error: unknown;
    try {
      assertNoAutomaticRoomCharge([
        { chargeType: 'PROCEDURE' },
        { chargeType: 'OR_TIME' },
      ]);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error).toMatchObject({
      reason: BillingErrorReason.ROOM_CHARGE_IS_AUTOMATIC,
    });
  });
});
