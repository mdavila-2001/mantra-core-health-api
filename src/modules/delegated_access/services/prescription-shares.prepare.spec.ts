import { jest } from '@jest/globals';
import { GoneException } from '@nestjs/common';
import { DELEG } from '../delegated_access.concepts';
import { issueShareToken } from './prescription-share-token';
import {
  DAY,
  SHARE,
  build,
  item,
  link,
  thrown,
} from './prescription-shares.testing';

/**
 * `openForPharmacy` con `prepare` (FAR-02): la farmacia arma su respuesta
 * antes de que se escriba el `OPENED`, para que un error al armarla no deje
 * una apertura que no se sirvió.
 */
describe('PrescriptionSharesService.openForPharmacy with prepare', () => {
  const context = { sourceIp: '203.0.113.7', userAgent: 'agente-prueba' };

  it('returns what prepare built and only then records OPENED', async () => {
    const { service, repo, committedUses } = build();
    const { token } = issueShareToken();
    repo.findByTokenHash.mockResolvedValue(link());
    repo.findItemsByEncounter.mockResolvedValue([item()]);
    const seenUsesWhilePreparing: number[] = [];
    const prepare = jest.fn(async (share: { shareId: string }) => {
      seenUsesWhilePreparing.push(committedUses.length);
      return { view: share.shareId };
    });

    const result = await service.openForPharmacy(token, context, prepare);

    expect(result).toEqual({ view: SHARE });
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(seenUsesWhilePreparing).toEqual([0]);
    expect(committedUses).toEqual([
      expect.objectContaining({
        sharedAccessLinkId: SHARE,
        outcomeConceptId: DELEG.SHARE_OUTCOME_OPENED,
      }),
    ]);
  });

  it('if prepare fails, the error propagates and no use is recorded', async () => {
    const { service, repo, committedUses } = build();
    const { token } = issueShareToken();
    repo.findByTokenHash.mockResolvedValue(link());
    repo.findItemsByEncounter.mockResolvedValue([item()]);
    const failure = new Error('vista caída');

    await expect(
      service.openForPharmacy(token, context, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(committedUses).toEqual([]);
    expect(repo.appendUse).not.toHaveBeenCalled();
  });

  it('an expired link still records DENIED and never calls prepare', async () => {
    const { service, repo, committedUses } = build();
    const { token } = issueShareToken();
    repo.findByTokenHash.mockResolvedValue(
      link({ expiresAt: new Date(Date.now() - DAY) }),
    );
    repo.findItemsByEncounter.mockResolvedValue([item()]);
    const prepare = jest.fn(async () => 'no se llama');

    const error = await thrown(
      service.openForPharmacy(token, context, prepare),
    );

    expect(error).toBeInstanceOf(GoneException);
    expect(prepare).not.toHaveBeenCalled();
    expect(committedUses).toEqual([
      expect.objectContaining({
        outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
      }),
    ]);
  });
});
