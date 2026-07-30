import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AdsAccountsService } from './ads-accounts.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['ADS_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const BM = '22222222-2222-2222-2222-222222222222';
const ACCOUNT = '33333333-3333-3333-3333-333333333333';
const OWNER = '44444444-4444-4444-4444-444444444444';
const PAYMENT_METHOD = '55555555-5555-5555-5555-555555555555';
const CURRENCY = '66666666-6666-6666-6666-666666666666';
const CREDENTIAL = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const accountsRepo = {
    createBusinessManager: mockFn(),
    findBusinessManagerById: mockFn(),
    findBusinessManagerByRef: mockFn(),
    createAdAccount: mockFn(),
    findAdAccountById: mockFn(),
    findAdAccountForUpdate: mockFn(),
    findAdAccountByRef: mockFn(),
    createAccountUser: mockFn(),
    createPartner: mockFn(),
    findPartnerByRef: mockFn(),
    findPartnerById: mockFn(),
    createPartnerRelationship: mockFn(),
    findActiveRelationshipForUpdate: mockFn(),
    createConnection: mockFn(),
    findConnectionById: mockFn(),
    findConnectionByExternalAccount: mockFn(),
    createIdentityAsset: mockFn(),
    findIdentityAsset: mockFn(),
    findIdentityAssetById: mockFn(),
    createIdentityAssignment: mockFn(),
    findActiveAssignmentForUpdate: mockFn(),
    upsertCheckpoint: mockFn(),
    findCheckpoint: mockFn(),
    createSyncRun: mockFn(),
  };
  const campaignsRepo = {};
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AdsAccountsService(
    em as any,
    accountsRepo as any,
    campaignsRepo as any,
    logger as any,
  );
  return { service, tx, accountsRepo };
}

describe('AdsAccountsService', () => {
  describe('provisionAdAccount (UC-43-01)', () => {
    const dto = {
      name: 'Cuenta Salud',
      externalAccountRef: 'act_123',
      currencyConceptId: CURRENCY,
      fundingPaymentMethodId: PAYMENT_METHOD,
      ownerUserId: OWNER,
    };

    it('creates the account active with the owner as admin', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue(null);
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.createAdAccount.mockReturnValue({ id: ACCOUNT });
      d.accountsRepo.createAccountUser.mockReturnValue({ id: 'role-1' });

      const res = await d.service.provisionAdAccount(BM, dto, actor);

      expect(res).toMatchObject({
        id: ACCOUNT,
        accountStatusConceptId: CONCEPTS.AD_ACCOUNT_ACTIVE,
        ownerRoleId: 'role-1',
      });
      expect(d.accountsRepo.createAccountUser).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          roleConceptId: CONCEPTS.AD_ROLE_ADMIN,
          userId: OWNER,
        }),
      );
    });

    it('starts the spend counter at zero', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue(null);
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.createAdAccount.mockReturnValue({ id: ACCOUNT });
      d.accountsRepo.createAccountUser.mockReturnValue({ id: 'role-1' });

      await d.service.provisionAdAccount(BM, dto, actor);

      expect(d.accountsRepo.createAdAccount).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ businessManagerId: BM }),
      );
    });

    it('rejects an external account reference already in use', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.provisionAdAccount(BM, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the business manager when none is given', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue(null);
      d.accountsRepo.findBusinessManagerByRef.mockResolvedValue(null);
      d.accountsRepo.createBusinessManager.mockReturnValue({ id: 'bm-new' });
      d.accountsRepo.createAdAccount.mockReturnValue({ id: ACCOUNT });
      d.accountsRepo.createAccountUser.mockReturnValue({ id: 'role-1' });

      const res = await d.service.provisionAdAccount(
        undefined,
        {
          ...dto,
          tenantId: TENANT,
          businessManagerName: 'Salud BM',
          externalBusinessRef: 'bm_123',
        },
        actor,
      );

      expect(res.businessManagerId).toBe('bm-new');
    });

    it('refuses to create a business manager without its identifying data', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue(null);

      await expect(
        d.service.provisionAdAccount(undefined, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the business manager does not exist', async () => {
      const d = build();
      d.accountsRepo.findAdAccountByRef.mockResolvedValue(null);
      d.accountsRepo.findBusinessManagerById.mockResolvedValue(null);

      await expect(
        d.service.provisionAdAccount(BM, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('linkPartner (UC-43-02)', () => {
    const dto = {
      partnerName: 'Agencia X',
      externalPartnerRef: 'partner_1',
      partnerType: 'AGENCY' as const,
      relationshipType: 'SHARE' as const,
    };

    it('creates the partner and the relationship', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({
        id: BM,
        tenantId: TENANT,
      });
      d.accountsRepo.findPartnerByRef.mockResolvedValue(null);
      d.accountsRepo.createPartner.mockReturnValue({ id: 'partner-1' });
      d.accountsRepo.findActiveRelationshipForUpdate.mockResolvedValue(null);
      d.accountsRepo.createPartnerRelationship.mockReturnValue({ id: 'rel-1' });

      const res = await d.service.linkPartner(BM, dto, actor);

      expect(res).toMatchObject({
        partnerId: 'partner-1',
        relationshipId: 'rel-1',
        partnerExisted: false,
      });
    });

    it('reuses an existing partner instead of duplicating it', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findPartnerByRef.mockResolvedValue({
        id: 'partner-existing',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.accountsRepo.findActiveRelationshipForUpdate.mockResolvedValue(null);
      d.accountsRepo.createPartnerRelationship.mockReturnValue({ id: 'rel-1' });

      const res = await d.service.linkPartner(BM, dto, actor);

      expect(res.partnerExisted).toBe(true);
      expect(d.accountsRepo.createPartner).not.toHaveBeenCalled();
    });

    it('closes the previous relationship before opening a new one', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findPartnerByRef.mockResolvedValue({
        id: 'partner-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const previous: any = { id: 'rel-old', validTo: undefined };
      d.accountsRepo.findActiveRelationshipForUpdate.mockResolvedValue(
        previous,
      );
      d.accountsRepo.createPartnerRelationship.mockReturnValue({ id: 'rel-1' });

      await d.service.linkPartner(BM, dto, actor);

      expect(previous.validTo).toBeInstanceOf(Date);
    });

    it('grants delegated access to the account when asked', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findPartnerByRef.mockResolvedValue(null);
      d.accountsRepo.createPartner.mockReturnValue({ id: 'partner-1' });
      d.accountsRepo.findActiveRelationshipForUpdate.mockResolvedValue(null);
      d.accountsRepo.createPartnerRelationship.mockReturnValue({ id: 'rel-1' });
      d.accountsRepo.findAdAccountById.mockResolvedValue({
        id: ACCOUNT,
        businessManagerId: BM,
      });
      d.accountsRepo.createAccountUser.mockReturnValue({ id: 'access-1' });

      const res = await d.service.linkPartner(
        BM,
        { ...dto, delegatedAdAccountId: ACCOUNT },
        actor,
      );

      expect(res.delegatedAccessId).toBe('access-1');
    });

    it('refuses to delegate an account of another business manager', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findPartnerByRef.mockResolvedValue(null);
      d.accountsRepo.createPartner.mockReturnValue({ id: 'partner-1' });
      d.accountsRepo.findActiveRelationshipForUpdate.mockResolvedValue(null);
      d.accountsRepo.createPartnerRelationship.mockReturnValue({ id: 'rel-1' });
      d.accountsRepo.findAdAccountById.mockResolvedValue({
        id: ACCOUNT,
        businessManagerId: 'other-bm',
      });

      await expect(
        d.service.linkPartner(
          BM,
          { ...dto, delegatedAdAccountId: ACCOUNT },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an inactive partner', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findPartnerByRef.mockResolvedValue({
        id: 'partner-1',
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.linkPartner(BM, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('connectPlatform (UC-43-03)', () => {
    const dto = {
      tenantId: TENANT,
      businessManagerId: BM,
      platform: 'META' as const,
      connectionName: 'Meta principal',
      credentialId: CREDENTIAL,
      externalAdAccountId: 'act_ext_1',
    };

    it('connects and imports the identities', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findConnectionByExternalAccount.mockResolvedValue(null);
      d.accountsRepo.createConnection.mockReturnValue({ id: 'conn-1' });
      d.accountsRepo.findIdentityAsset.mockResolvedValue(null);
      d.accountsRepo.createSyncRun.mockReturnValue({ id: 'sync-1' });

      const res = await d.service.connectPlatform(
        {
          ...dto,
          identities: [
            {
              identityType: 'PAGE' as const,
              externalIdentityId: 'page_1',
              displayName: 'Clínica',
            },
          ],
        },
        actor,
      );

      expect(res).toMatchObject({
        id: 'conn-1',
        statusConceptId: CONCEPTS.CONNECTION_CONNECTED,
        identitiesImported: 1,
        identitiesUpdated: 0,
        syncRunId: 'sync-1',
      });
    });

    it('updates an identity that was already imported instead of duplicating it', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findConnectionByExternalAccount.mockResolvedValue(null);
      d.accountsRepo.createConnection.mockReturnValue({ id: 'conn-1' });
      const existing: any = { id: 'identity-1', displayName: 'Antiguo' };
      d.accountsRepo.findIdentityAsset.mockResolvedValue(existing);
      d.accountsRepo.createSyncRun.mockReturnValue({ id: 'sync-1' });

      const res = await d.service.connectPlatform(
        {
          ...dto,
          identities: [
            {
              identityType: 'PAGE' as const,
              externalIdentityId: 'page_1',
              displayName: 'Nuevo',
            },
          ],
        },
        actor,
      );

      expect(res).toMatchObject({
        identitiesImported: 0,
        identitiesUpdated: 1,
      });
      expect(existing.displayName).toBe('Nuevo');
      expect(d.accountsRepo.createIdentityAsset).not.toHaveBeenCalled();
    });

    it('rejects connecting the same platform account twice', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findConnectionByExternalAccount.mockResolvedValue({
        id: 'conn-existing',
      });

      await expect(
        d.service.connectPlatform(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the sync checkpoint when the platform returns a cursor', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue({ id: BM });
      d.accountsRepo.findConnectionByExternalAccount.mockResolvedValue(null);
      d.accountsRepo.createConnection.mockReturnValue({ id: 'conn-1' });
      d.accountsRepo.findCheckpoint.mockResolvedValue(null);
      d.accountsRepo.createSyncRun.mockReturnValue({ id: 'sync-1' });

      await d.service.connectPlatform(
        { ...dto, checkpointValue: 'cursor-abc' },
        actor,
      );

      expect(d.accountsRepo.upsertCheckpoint).toHaveBeenCalledWith(
        d.tx,
        null,
        expect.objectContaining({ checkpointValueEncrypted: 'cursor-abc' }),
      );
    });

    it('fails when the business manager does not exist', async () => {
      const d = build();
      d.accountsRepo.findBusinessManagerById.mockResolvedValue(null);

      await expect(
        d.service.connectPlatform(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
