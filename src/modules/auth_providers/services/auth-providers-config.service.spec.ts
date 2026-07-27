import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AuthProvidersConfigService } from './auth-providers-config.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['IDENTITY_ADMIN'] };
const PROVIDER = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const ROLE = '33333333-3333-3333-3333-333333333333';
const CONFIG = '44444444-4444-4444-4444-444444444444';
const KEY = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const providersRepo = {
    createProvider: mockFn(),
    findProviderById: mockFn(),
    findProviderForUpdate: mockFn(),
    findProviderByCode: mockFn(),
    createProtocolConfig: mockFn(),
    findProtocolConfig: mockFn(),
    findProtocolConfigForUpdate: mockFn(),
    createSigningKey: mockFn(),
    findSigningKey: mockFn(),
    findActiveKeysForUpdate: mockFn(),
    createAttributeMapping: mockFn(),
    findMappingsForUpdate: mockFn(),
    findMappingsByProvider: mockFn(),
    removeMappings: mockFn(),
    createBinding: mockFn(),
    findBinding: mockFn(),
    findBindingForUpdate: mockFn(),
    countBindings: mockFn(),
    createProvisioningRule: mockFn(),
    findActiveRules: mockFn(),
    findRuleByPriority: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthProvidersConfigService(
    em as any,
    providersRepo as any,
    logger as any,
  );
  return { service, tx, providersRepo, logger };
}

function oidcProvider(overrides: Record<string, unknown> = {}): any {
  return {
    id: PROVIDER,
    code: 'acme-oidc',
    protocolConceptId: CONCEPTS.IDP_PROTOCOL_OIDC,
    stateConceptId: CONCEPTS.IDP_ACTIVE,
    isGlobal: false,
    ...overrides,
  };
}

describe('AuthProvidersConfigService', () => {
  describe('createProvider (UC-40-01)', () => {
    const dto: any = {
      tenantId: TENANT,
      code: 'acme-oidc',
      name: 'ACME',
      protocol: 'OIDC',
      category: 'ENTERPRISE',
    };

    it('registers the provider in draft', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(null);
      d.providersRepo.createProvider.mockReturnValue({ id: PROVIDER });

      const res = await d.service.createProvider(dto, actor);

      expect(res).toEqual({
        id: PROVIDER,
        code: 'acme-oidc',
        stateConceptId: CONCEPTS.IDP_DRAFT,
        isGlobal: false,
      });
      expect(d.providersRepo.createProvider).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          protocolConceptId: CONCEPTS.IDP_PROTOCOL_OIDC,
          providerCategoryConceptId: CONCEPTS.IDP_CATEGORY_ENTERPRISE,
        }),
      );
    });

    it('rejects a duplicate code', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createProvider(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a non-global provider with no owning tenant', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(null);

      await expect(
        d.service.createProvider({ ...dto, tenantId: undefined }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('allows a global provider with no tenant', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(null);
      d.providersRepo.createProvider.mockReturnValue({ id: PROVIDER });

      const res = await d.service.createProvider(
        { ...dto, tenantId: undefined, isGlobal: true },
        actor,
      );

      expect(res.isGlobal).toBe(true);
    });
  });

  describe('configureProtocol (UC-40-02)', () => {
    const dto: any = {
      environment: 'PRODUCTION',
      clientId: 'client-1',
      authorizeUrl: 'https://idp.example/authorize',
      tokenUrl: 'https://idp.example/token',
      jwksUri: 'https://idp.example/jwks',
    };

    function wire(d: ReturnType<typeof build>, provider = oidcProvider()) {
      d.providersRepo.findProviderForUpdate.mockResolvedValue(provider);
      d.providersRepo.findProtocolConfigForUpdate.mockResolvedValue(null);
      d.providersRepo.createProtocolConfig.mockReturnValue({ id: CONFIG });
      d.providersRepo.findSigningKey.mockResolvedValue(null);
      d.providersRepo.createSigningKey.mockReturnValue({ id: KEY });
      return provider;
    }

    it('configures the environment and activates the draft provider', async () => {
      const d = build();
      const provider = wire(
        d,
        oidcProvider({ stateConceptId: CONCEPTS.IDP_DRAFT }),
      );

      const res = await d.service.configureProtocol(PROVIDER, dto, actor);

      expect(res).toMatchObject({
        id: CONFIG,
        environmentConceptId: CONCEPTS.IDP_ENV_PRODUCTION,
        replaced: false,
        importedKeyIds: [],
      });
      expect(provider.stateConceptId).toBe(CONCEPTS.IDP_ACTIVE);
    });

    it('disables the previous configuration of the same environment', async () => {
      const d = build();
      wire(d);
      const previous = {
        id: 'config-prev',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.providersRepo.findProtocolConfigForUpdate.mockResolvedValue(previous);

      const res = await d.service.configureProtocol(PROVIDER, dto, actor);

      expect(res.replaced).toBe(true);
      expect(previous.stateConceptId).toBe(CONCEPTS.IDP_DISABLED);
    });

    it('imports the discovered keys and skips the ones already known', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findSigningKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'key-known' });

      const res = await d.service.configureProtocol(
        PROVIDER,
        {
          ...dto,
          discoveredKeys: [
            { keyId: 'kid-new', algorithm: 'RS256', publicKey: 'pem-1' },
            { keyId: 'kid-known', algorithm: 'RS256', publicKey: 'pem-2' },
          ],
        },
        actor,
      );

      expect(res.importedKeyIds).toEqual([KEY]);
      expect(d.providersRepo.createSigningKey).toHaveBeenCalledTimes(1);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderForUpdate.mockResolvedValue(null);

      await expect(
        d.service.configureProtocol(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('demands the authorization endpoints', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.configureProtocol(
          PROVIDER,
          { ...dto, tokenUrl: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('demands the client id', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.configureProtocol(
          PROVIDER,
          { ...dto, clientId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('demands JWKS or discovery for OIDC', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.configureProtocol(
          PROVIDER,
          { ...dto, jwksUri: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts OAuth2 without JWKS', async () => {
      const d = build();
      wire(
        d,
        oidcProvider({ protocolConceptId: CONCEPTS.IDP_PROTOCOL_OAUTH2 }),
      );

      const res = await d.service.configureProtocol(
        PROVIDER,
        { ...dto, jwksUri: undefined },
        actor,
      );

      expect(res.id).toBe(CONFIG);
    });

    it('demands entity id and ACS url for SAML', async () => {
      const d = build();
      wire(d, oidcProvider({ protocolConceptId: CONCEPTS.IDP_PROTOCOL_SAML }));

      await expect(
        d.service.configureProtocol(
          PROVIDER,
          { environment: 'PRODUCTION' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a SAML configuration with its endpoints', async () => {
      const d = build();
      wire(d, oidcProvider({ protocolConceptId: CONCEPTS.IDP_PROTOCOL_SAML }));

      const res = await d.service.configureProtocol(
        PROVIDER,
        {
          environment: 'STAGING',
          samlEntityId: 'urn:acme',
          samlAcsUrl: 'https://app.example/acs',
        } as any,
        actor,
      );

      expect(res.environmentConceptId).toBe(CONCEPTS.IDP_ENV_STAGING);
    });
  });

  describe('publishSigningKey (UC-40-03)', () => {
    const dto: any = { keyId: 'kid-1', algorithm: 'RS256', publicKey: 'pem' };

    it('publishes the key as active', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findSigningKey.mockResolvedValue(null);
      d.providersRepo.createSigningKey.mockReturnValue({ id: KEY });

      const res = await d.service.publishSigningKey(PROVIDER, dto, actor);

      expect(res).toEqual({
        id: KEY,
        keyId: 'kid-1',
        stateConceptId: CONCEPTS.KEY_ACTIVE,
      });
      expect(d.providersRepo.createSigningKey).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ keyUseConceptId: CONCEPTS.KEY_USE_SIGNING }),
      );
    });

    it('rejects a duplicate key id', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findSigningKey.mockResolvedValue({ id: 'key-prev' });

      await expect(
        d.service.publishSigningKey(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an inverted validity window', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findSigningKey.mockResolvedValue(null);

      await expect(
        d.service.publishSigningKey(
          PROVIDER,
          {
            ...dto,
            validFrom: '2026-03-01T00:00:00.000Z',
            validTo: '2026-02-01T00:00:00.000Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(null);

      await expect(
        d.service.publishSigningKey(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rotateSigningKey (UC-40-11)', () => {
    const dto: any = { keyId: 'kid-2', algorithm: 'RS256', publicKey: 'pem-2' };

    function wire(d: ReturnType<typeof build>, active: any[]) {
      d.providersRepo.findProviderForUpdate.mockResolvedValue(oidcProvider());
      d.providersRepo.findSigningKey.mockResolvedValue(null);
      d.providersRepo.findActiveKeysForUpdate.mockResolvedValue(active);
      d.providersRepo.createSigningKey.mockReturnValue({ id: KEY });
    }

    it('publishes the new key and leaves the outgoing ones retiring', async () => {
      const d = build();
      const outgoing = {
        id: 'key-old',
        stateConceptId: CONCEPTS.KEY_ACTIVE,
        validTo: undefined,
      };
      wire(d, [outgoing]);

      const res = await d.service.rotateSigningKey(PROVIDER, dto, actor);

      expect(res.newKeyId).toBe(KEY);
      expect(res.retiringCount).toBe(1);
      expect(res.graceUntil).toBeDefined();
      expect(outgoing.stateConceptId).toBe(CONCEPTS.KEY_RETIRING);
      expect(outgoing.validTo).toBeInstanceOf(Date);
    });

    it('retires the outgoing keys at once when the grace is zero', async () => {
      const d = build();
      const outgoing = {
        id: 'key-old',
        stateConceptId: CONCEPTS.KEY_ACTIVE,
        validTo: undefined,
      };
      wire(d, [outgoing]);

      const res = await d.service.rotateSigningKey(
        PROVIDER,
        { ...dto, graceHours: 0 },
        actor,
      );

      expect(res.graceUntil).toBeUndefined();
      expect(outgoing.stateConceptId).toBe(CONCEPTS.KEY_RETIRED);
    });

    it('rotates the first key with nothing to retire', async () => {
      const d = build();
      wire(d, []);

      const res = await d.service.rotateSigningKey(PROVIDER, dto, actor);

      expect(res.retiringCount).toBe(0);
    });

    it('rejects reusing an existing key id', async () => {
      const d = build();
      wire(d, []);
      d.providersRepo.findSigningKey.mockResolvedValue({ id: 'key-prev' });

      await expect(
        d.service.rotateSigningKey(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderForUpdate.mockResolvedValue(null);

      await expect(
        d.service.rotateSigningKey(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('setAttributeMappings (UC-40-04)', () => {
    const mappings = [
      {
        sourceClaim: 'sub',
        targetAttribute: 'externalSubject',
        isIdentifier: true,
      },
      { sourceClaim: 'email', targetAttribute: 'email', required: true },
    ];

    function wire(d: ReturnType<typeof build>, previous: any[] = []) {
      d.providersRepo.findProviderForUpdate.mockResolvedValue(oidcProvider());
      d.providersRepo.findMappingsForUpdate.mockResolvedValue(previous);
      let seq = 0;
      d.providersRepo.createAttributeMapping.mockImplementation(() => ({
        id: `mapping-${++seq}`,
      }));
    }

    it('replaces the whole mapping', async () => {
      const d = build();
      wire(d, [{ id: 'mapping-old' }]);

      const res = await d.service.setAttributeMappings(
        PROVIDER,
        { mappings },
        actor,
      );

      expect(res).toEqual({
        providerId: PROVIDER,
        mappingIds: ['mapping-1', 'mapping-2'],
        removed: 1,
        identifierClaim: 'sub',
      });
      expect(d.providersRepo.removeMappings).toHaveBeenCalled();
    });

    it('does not remove anything when there was no previous mapping', async () => {
      const d = build();
      wire(d);

      const res = await d.service.setAttributeMappings(
        PROVIDER,
        { mappings },
        actor,
      );

      expect(res.removed).toBe(0);
      expect(d.providersRepo.removeMappings).not.toHaveBeenCalled();
    });

    it('demands exactly one identifier claim', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.setAttributeMappings(
          PROVIDER,
          {
            mappings: [{ sourceClaim: 'email', targetAttribute: 'email' }],
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects two identifier claims', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.setAttributeMappings(
          PROVIDER,
          {
            mappings: [
              {
                sourceClaim: 'sub',
                targetAttribute: 'externalSubject',
                isIdentifier: true,
              },
              {
                sourceClaim: 'oid',
                targetAttribute: 'externalSubject',
                isIdentifier: true,
              },
            ],
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a repeated source claim', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.setAttributeMappings(
          PROVIDER,
          {
            mappings: [
              {
                sourceClaim: 'sub',
                targetAttribute: 'externalSubject',
                isIdentifier: true,
              },
              { sourceClaim: 'sub', targetAttribute: 'displayName' },
            ],
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderForUpdate.mockResolvedValue(null);

      await expect(
        d.service.setAttributeMappings(
          PROVIDER,
          { mappings } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('bindTenant (UC-40-05)', () => {
    const dto: any = { providerId: PROVIDER, tenantId: TENANT };

    it('creates the binding with its ordinal', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findBindingForUpdate.mockResolvedValue(null);
      d.providersRepo.countBindings.mockResolvedValue(2);
      d.providersRepo.createBinding.mockReturnValue({ id: 'binding-1' });

      const res = await d.service.bindTenant(dto, actor);

      expect(res).toEqual({
        id: 'binding-1',
        providerId: PROVIDER,
        tenantId: TENANT,
        isEnabled: true,
        updated: false,
      });
      expect(d.providersRepo.createBinding).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ ordinal: 3 }),
      );
    });

    it('updates the existing binding instead of duplicating it', async () => {
      const d = build();
      const existing: any = { id: 'binding-1', isEnabled: true };
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findBindingForUpdate.mockResolvedValue(existing);

      const res = await d.service.bindTenant(
        { ...dto, isEnabled: false },
        actor,
      );

      expect(res.updated).toBe(true);
      expect(existing.isEnabled).toBe(false);
      expect(d.providersRepo.createBinding).not.toHaveBeenCalled();
    });

    it('demands the default role when it provisions automatically', async () => {
      const d = build();

      await expect(
        d.service.bindTenant({ ...dto, autoProvision: true }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts JIT provisioning with a default role', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findBindingForUpdate.mockResolvedValue(null);
      d.providersRepo.countBindings.mockResolvedValue(0);
      d.providersRepo.createBinding.mockReturnValue({ id: 'binding-1' });

      const res = await d.service.bindTenant(
        { ...dto, justInTimeProvisioning: true, defaultRoleConceptId: ROLE },
        actor,
      );

      expect(res.id).toBe('binding-1');
    });

    it('refuses to bind a disabled provider', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(
        oidcProvider({ stateConceptId: CONCEPTS.IDP_DISABLED }),
      );

      await expect(
        d.service.bindTenant(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(null);

      await expect(
        d.service.bindTenant(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createProvisioningRule (UC-40-06)', () => {
    const dto: any = {
      priority: 10,
      effect: 'ALLOW',
      assignRoleConceptId: ROLE,
    };

    it('creates the rule as active', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findRuleByPriority.mockResolvedValue(null);
      d.providersRepo.createProvisioningRule.mockReturnValue({ id: 'rule-1' });

      const res = await d.service.createProvisioningRule(PROVIDER, dto, actor);

      expect(res).toEqual({
        id: 'rule-1',
        priority: 10,
        effectConceptId: CONCEPTS.PROVISION_EFFECT_ALLOW,
        isActive: true,
      });
    });

    it('rejects a repeated priority', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findRuleByPriority.mockResolvedValue({ id: 'rule-prev' });

      await expect(
        d.service.createProvisioningRule(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a DENY rule that assigns a role', async () => {
      const d = build();

      await expect(
        d.service.createProvisioningRule(
          PROVIDER,
          { priority: 5, effect: 'DENY', assignRoleConceptId: ROLE } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a plain DENY rule', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(oidcProvider());
      d.providersRepo.findRuleByPriority.mockResolvedValue(null);
      d.providersRepo.createProvisioningRule.mockReturnValue({ id: 'rule-2' });

      const res = await d.service.createProvisioningRule(
        PROVIDER,
        { priority: 1, effect: 'DENY' } as any,
        actor,
      );

      expect(res.effectConceptId).toBe(CONCEPTS.PROVISION_EFFECT_DENY);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(null);

      await expect(
        d.service.createProvisioningRule(PROVIDER, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
