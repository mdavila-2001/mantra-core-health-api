import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FederatedLoginService } from './federated-login.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['IDENTITY_ADMIN'] };
const PROVIDER = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const IDENTITY = '33333333-3333-3333-3333-333333333333';
const USER = '44444444-4444-4444-4444-444444444444';
const ATTEMPT = '55555555-5555-5555-5555-555555555555';
const REQUEST = '66666666-6666-6666-6666-666666666666';
const SUBJECT = 'ext-subject-1';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const providersRepo = {
    findProviderById: mockFn(),
    findProviderByCode: mockFn(),
    findProtocolConfig: mockFn(),
    findMappingsByProvider: mockFn(() => Promise.resolve([])),
    findBinding: mockFn(),
    findActiveRules: mockFn(() => Promise.resolve([])),
    createFederatedIdentity: mockFn(),
    findIdentityById: mockFn(),
    findIdentityForUpdate: mockFn(),
    findIdentityBySubject: mockFn(),
    findIdentityBySubjectForUpdate: mockFn(),
    createLoginAttempt: mockFn(() => ({ id: ATTEMPT })),
    findAttemptByRequestId: mockFn(),
    createLinkRequest: mockFn(() => ({ id: REQUEST })),
    findLinkRequestByTokenHashForUpdate: mockFn(),
    findPendingLinkRequest: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FederatedLoginService(
    em as any,
    providersRepo as any,
    logger as any,
  );
  return { service, tx, providersRepo, logger };
}

/**
 * Ejecuta la operación active provider.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active provider conforme al contrato `any`.
 */
function activeProvider(overrides: Record<string, unknown> = {}): any {
  return {
    id: PROVIDER,
    code: 'acme-oidc',
    stateConceptId: CONCEPTS.IDP_ACTIVE,
    isGlobal: false,
    ...overrides,
  };
}

/**
 * Ejecuta la operación active config.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active config conforme al contrato `any`.
 */
function activeConfig(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'config-1',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    authorizeUrl: 'https://idp.example/authorize',
    clientId: 'client-1',
    scopes: 'openid email',
    pkceRequired: true,
    ...overrides,
  };
}

describe('FederatedLoginService', () => {
  describe('startLogin (UC-40-07)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.providersRepo.findProviderByCode.mockResolvedValue(activeProvider());
      d.providersRepo.findProtocolConfig.mockResolvedValue(activeConfig());
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
      });
    }

    it('registers the attempt and builds the authorize url', async () => {
      const d = build();
      wire(d);

      const res = await d.service.startLogin(
        'acme-oidc',
        { tenantId: TENANT },
        actor,
      );

      expect(res.attemptId).toBe(ATTEMPT);
      expect(res.pkceRequired).toBe(true);
      expect(res.authorizeUrl).toContain(`state=${res.state}`);
      expect(res.authorizeUrl).toContain(`nonce=${res.nonce}`);
      expect(res.authorizeUrl).toContain('client_id=client-1');
      expect(d.providersRepo.createLoginAttempt).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          outcomeConceptId: CONCEPTS.LOGIN_INITIATED,
          requestId: res.state,
        }),
      );
    });

    it('appends the query when the authorize url already has one', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findProtocolConfig.mockResolvedValue(
        activeConfig({
          authorizeUrl: 'https://idp.example/authorize?realm=acme',
        }),
      );

      const res = await d.service.startLogin('acme-oidc', {}, actor);

      expect(res.authorizeUrl).toContain('realm=acme&');
    });

    it('gives a different state and nonce on every start', async () => {
      const d = build();
      wire(d);

      const first = await d.service.startLogin('acme-oidc', {}, actor);
      const second = await d.service.startLogin('acme-oidc', {}, actor);

      expect(first.state).not.toBe(second.state);
      expect(first.nonce).not.toBe(second.nonce);
    });

    it('uses production when the environment is not given', async () => {
      const d = build();
      wire(d);

      await d.service.startLogin('acme-oidc', {}, actor);

      expect(d.providersRepo.findProtocolConfig).toHaveBeenCalledWith(
        d.tx,
        PROVIDER,
        CONCEPTS.IDP_ENV_PRODUCTION,
      );
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(null);

      await expect(
        d.service.startLogin('nope', {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses a provider that is not active', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(
        activeProvider({ stateConceptId: CONCEPTS.IDP_DRAFT }),
      );

      await expect(
        d.service.startLogin('acme-oidc', {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an environment with no active configuration', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findProtocolConfig.mockResolvedValue(null);

      await expect(
        d.service.startLogin(
          'acme-oidc',
          { environment: 'STAGING' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a configuration with no authorize endpoint', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findProtocolConfig.mockResolvedValue(
        activeConfig({ authorizeUrl: undefined }),
      );

      await expect(
        d.service.startLogin('acme-oidc', {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a tenant with no enabled binding', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: false,
      });

      await expect(
        d.service.startLogin('acme-oidc', { tenantId: TENANT }, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('does not demand a binding for a global provider', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findProviderByCode.mockResolvedValue(
        activeProvider({ isGlobal: true }),
      );

      const res = await d.service.startLogin(
        'acme-oidc',
        { tenantId: TENANT },
        actor,
      );

      expect(res.attemptId).toBe(ATTEMPT);
      expect(d.providersRepo.findBinding).not.toHaveBeenCalled();
    });
  });

  describe('processCallback (UC-40-08)', () => {
    const dto: any = {
      state: 'state-1',
      externalSubject: SUBJECT,
      claims: { sub: SUBJECT, email: 'ana@acme.com' },
      tenantId: TENANT,
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.providersRepo.findProviderByCode.mockResolvedValue(activeProvider());
      d.providersRepo.findAttemptByRequestId.mockResolvedValue({
        id: 'attempt-init',
        outcomeConceptId: CONCEPTS.LOGIN_INITIATED,
        tenantId: TENANT,
      });
      d.providersRepo.findMappingsByProvider.mockResolvedValue([
        {
          sourceClaim: 'sub',
          targetAttribute: 'externalSubject',
          isIdentifier: true,
        },
        { sourceClaim: 'email', targetAttribute: 'email', required: true },
      ]);
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue(null);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
        justInTimeProvisioning: true,
      });
    }

    it('resolves the existing identity and records the success', async () => {
      const d = build();
      wire(d);
      const identity: any = {
        id: IDENTITY,
        userId: USER,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
      };
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue(
        identity,
      );

      const res = await d.service.processCallback('acme-oidc', dto, actor);

      expect(res).toEqual({
        federatedIdentityId: IDENTITY,
        userId: USER,
        outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
        provisioned: false,
        attemptId: ATTEMPT,
      });
      expect(identity.lastLoginAt).toBeInstanceOf(Date);
      expect(identity.externalEmail).toBe('ana@acme.com');
    });

    it('rejects a revoked identity', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue({
        id: IDENTITY,
        userId: USER,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
      });

      const res = await d.service.processCallback('acme-oidc', dto, actor);

      expect(res.outcomeConceptId).toBe(CONCEPTS.LOGIN_FAILURE);
      expect(res.failureReasonConceptId).toBe(
        CONCEPTS.LOGIN_FAIL_IDENTITY_REVOKED,
      );
    });

    it('provisions just in time when the local user comes resolved', async () => {
      const d = build();
      wire(d);
      d.providersRepo.createFederatedIdentity.mockReturnValue({ id: IDENTITY });

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res).toMatchObject({
        federatedIdentityId: IDENTITY,
        userId: USER,
        outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
        provisioned: true,
      });
    });

    it('hands back a link token instead of inventing the local user', async () => {
      const d = build();
      wire(d);

      const res = await d.service.processCallback('acme-oidc', dto, actor);

      expect(res.outcomeConceptId).toBe(CONCEPTS.LOGIN_FAILURE);
      expect(res.failureReasonConceptId).toBe(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
      expect(res.linkToken).toEqual(expect.any(String));
      expect(d.providersRepo.createFederatedIdentity).not.toHaveBeenCalled();
      // Sólo se guarda el hash del token.
      const stored = d.providersRepo.createLinkRequest.mock.calls[0][1];
      expect(stored.linkTokenHash).not.toBe(res.linkToken);
      expect(stored.statusConceptId).toBe(CONCEPTS.LINK_REQUEST_PENDING);
    });

    it('links instead of provisioning when the binding has no JIT', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
        justInTimeProvisioning: false,
      });

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.provisioned).toBe(false);
      expect(res.linkToken).toEqual(expect.any(String));
    });

    it('rejects a disabled provider', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findProviderByCode.mockResolvedValue(
        activeProvider({ stateConceptId: CONCEPTS.IDP_DISABLED }),
      );

      const res = await d.service.processCallback('acme-oidc', dto, actor);

      expect(res.failureReasonConceptId).toBe(
        CONCEPTS.LOGIN_FAIL_PROVIDER_DISABLED,
      );
    });

    it('rejects a missing required claim', async () => {
      const d = build();
      wire(d);

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, claims: { sub: SUBJECT } },
        actor,
      );

      expect(res.failureReasonConceptId).toBe(
        CONCEPTS.LOGIN_FAIL_MISSING_CLAIM,
      );
    });

    it('rejects an email outside the allowed domains', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
        justInTimeProvisioning: true,
        allowedEmailDomains: 'acme.org, acme.net',
      });

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.failureReasonConceptId).toBe(
        CONCEPTS.LOGIN_FAIL_DOMAIN_NOT_ALLOWED,
      );
    });

    it('accepts an email inside the allowed domains', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
        justInTimeProvisioning: true,
        allowedEmailDomains: 'acme.com',
      });
      d.providersRepo.createFederatedIdentity.mockReturnValue({ id: IDENTITY });

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.outcomeConceptId).toBe(CONCEPTS.LOGIN_SUCCESS);
    });

    it('rejects a domain restriction with no email received', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findMappingsByProvider.mockResolvedValue([
        {
          sourceClaim: 'sub',
          targetAttribute: 'externalSubject',
          isIdentifier: true,
        },
      ]);
      d.providersRepo.findBinding.mockResolvedValue({
        id: 'binding-1',
        isEnabled: true,
        justInTimeProvisioning: true,
        allowedEmailDomains: 'acme.com',
      });

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, claims: { sub: SUBJECT }, userId: USER },
        actor,
      );

      expect(res.failureReasonConceptId).toBe(
        CONCEPTS.LOGIN_FAIL_DOMAIN_NOT_ALLOWED,
      );
    });

    it('rejects when the tenant has no enabled binding', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findBinding.mockResolvedValue(null);

      const res = await d.service.processCallback('acme-oidc', dto, actor);

      expect(res.failureReasonConceptId).toBe(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
    });

    it('honours the first matching rule and denies', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findActiveRules.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 1,
          conditionJson: { email: 'ana@acme.com' },
          effectConceptId: CONCEPTS.PROVISION_EFFECT_DENY,
        },
        {
          id: 'rule-2',
          priority: 2,
          conditionJson: null,
          effectConceptId: CONCEPTS.PROVISION_EFFECT_ALLOW,
        },
      ]);

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.failureReasonConceptId).toBe(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
    });

    it('skips rules bound to another tenant', async () => {
      const d = build();
      wire(d);
      d.providersRepo.createFederatedIdentity.mockReturnValue({ id: IDENTITY });
      d.providersRepo.findActiveRules.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 1,
          tenantId: 'other-tenant',
          conditionJson: null,
          effectConceptId: CONCEPTS.PROVISION_EFFECT_DENY,
        },
        {
          id: 'rule-2',
          priority: 2,
          conditionJson: null,
          effectConceptId: CONCEPTS.PROVISION_EFFECT_ALLOW,
        },
      ]);

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.outcomeConceptId).toBe(CONCEPTS.LOGIN_SUCCESS);
    });

    it('denies when rules exist and none of them matches', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findActiveRules.mockResolvedValue([
        {
          id: 'rule-1',
          priority: 1,
          conditionJson: { department: 'cardiology' },
          effectConceptId: CONCEPTS.PROVISION_EFFECT_ALLOW,
        },
      ]);

      const res = await d.service.processCallback(
        'acme-oidc',
        { ...dto, userId: USER },
        actor,
      );

      expect(res.failureReasonConceptId).toBe(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderByCode.mockResolvedValue(null);

      await expect(
        d.service.processCallback('nope', dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses a state that does not match an initiated login', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findAttemptByRequestId.mockResolvedValue(null);

      await expect(
        d.service.processCallback('acme-oidc', dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses to reuse a state that was already resolved', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findAttemptByRequestId.mockResolvedValue({
        id: 'attempt-init',
        outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
      });

      await expect(
        d.service.processCallback('acme-oidc', dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('requestAccountLink (UC-40-09)', () => {
    const dto: any = { providerId: PROVIDER, externalSubject: SUBJECT };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>) {
      d.providersRepo.findProviderById.mockResolvedValue(activeProvider());
      d.providersRepo.findIdentityBySubject.mockResolvedValue(null);
      d.providersRepo.findPendingLinkRequest.mockResolvedValue(null);
    }

    it('returns the token once and stores only its hash', async () => {
      const d = build();
      wire(d);

      const res = await d.service.requestAccountLink(dto, actor);

      expect(res).toMatchObject({
        id: REQUEST,
        statusConceptId: CONCEPTS.LINK_REQUEST_PENDING,
      });
      const stored = d.providersRepo.createLinkRequest.mock.calls[0][1];
      expect(stored.linkTokenHash).toHaveLength(64);
      expect(stored.linkTokenHash).not.toBe(res.linkToken);
    });

    it('honours the requested expiry', async () => {
      const d = build();
      wire(d);

      const res = await d.service.requestAccountLink(
        { ...dto, expiresInMinutes: 5 },
        actor,
      );

      const minutes = (new Date(res.expiresAt).getTime() - Date.now()) / 60000;
      expect(minutes).toBeGreaterThan(4);
      expect(minutes).toBeLessThanOrEqual(5);
    });

    it('rejects a subject that is already linked', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findIdentityBySubject.mockResolvedValue({
        id: IDENTITY,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
      });

      await expect(
        d.service.requestAccountLink(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows relinking a revoked identity', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findIdentityBySubject.mockResolvedValue({
        id: IDENTITY,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
      });

      const res = await d.service.requestAccountLink(dto, actor);

      expect(res.id).toBe(REQUEST);
    });

    it('rejects a second pending request', async () => {
      const d = build();
      wire(d);
      d.providersRepo.findPendingLinkRequest.mockResolvedValue({
        id: 'request-prev',
      });

      await expect(
        d.service.requestAccountLink(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a disabled provider', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(
        activeProvider({ stateConceptId: CONCEPTS.IDP_DISABLED }),
      );

      await expect(
        d.service.requestAccountLink(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findProviderById.mockResolvedValue(null);

      await expect(
        d.service.requestAccountLink(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('completeAccountLink (UC-40-10)', () => {
    /**
     * Ejecuta la operación pending request.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de pending request conforme al contrato `any`.
     */
    function pendingRequest(overrides: Record<string, unknown> = {}): any {
      return {
        id: REQUEST,
        providerId: PROVIDER,
        userId: USER,
        externalSubject: SUBJECT,
        statusConceptId: CONCEPTS.LINK_REQUEST_PENDING,
        expiresAt: new Date(Date.now() + 600_000),
        ...overrides,
      };
    }

    it('creates the identity and closes the request', async () => {
      const d = build();
      const request = pendingRequest();
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        request,
      );
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue(null);
      d.providersRepo.createFederatedIdentity.mockReturnValue({ id: IDENTITY });

      const res = await d.service.completeAccountLink(
        { linkToken: 'token-1', externalEmail: 'ana@acme.com' },
        actor,
      );

      expect(res).toEqual({
        requestId: REQUEST,
        federatedIdentityId: IDENTITY,
        userId: USER,
        statusConceptId: CONCEPTS.LINK_REQUEST_COMPLETED,
      });
      expect(request.statusConceptId).toBe(CONCEPTS.LINK_REQUEST_COMPLETED);
      expect(request.completedAt).toBeInstanceOf(Date);
    });

    it('links to whoever completes it when the request has no user', async () => {
      const d = build();
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        pendingRequest({ userId: undefined }),
      );
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue(null);
      d.providersRepo.createFederatedIdentity.mockReturnValue({ id: IDENTITY });

      const res = await d.service.completeAccountLink(
        { linkToken: 'token-1' },
        actor,
      );

      expect(res.userId).toBe(actor.id);
    });

    it('reactivates a revoked identity instead of duplicating it', async () => {
      const d = build();
      const identity: any = {
        id: IDENTITY,
        userId: 'user-old',
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
      };
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        pendingRequest(),
      );
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue(
        identity,
      );

      const res = await d.service.completeAccountLink(
        { linkToken: 'token-1' },
        actor,
      );

      expect(res.federatedIdentityId).toBe(IDENTITY);
      expect(identity.stateConceptId).toBe(CONCEPTS.FEDERATED_IDENTITY_ACTIVE);
      expect(identity.userId).toBe(USER);
      expect(d.providersRepo.createFederatedIdentity).not.toHaveBeenCalled();
    });

    it('rejects a subject already linked and active', async () => {
      const d = build();
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        pendingRequest(),
      );
      d.providersRepo.findIdentityBySubjectForUpdate.mockResolvedValue({
        id: IDENTITY,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
      });

      await expect(
        d.service.completeAccountLink(
          { linkToken: 'token-1' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the token matches nothing', async () => {
      const d = build();
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        null,
      );

      await expect(
        d.service.completeAccountLink(
          { linkToken: 'token-x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses a request that is no longer pending', async () => {
      const d = build();
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        pendingRequest({ statusConceptId: CONCEPTS.LINK_REQUEST_COMPLETED }),
      );

      await expect(
        d.service.completeAccountLink(
          { linkToken: 'token-1' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('marks an expired request as expired', async () => {
      const d = build();
      const request = pendingRequest({
        expiresAt: new Date(Date.now() - 1000),
      });
      d.providersRepo.findLinkRequestByTokenHashForUpdate.mockResolvedValue(
        request,
      );

      await expect(
        d.service.completeAccountLink(
          { linkToken: 'token-1' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(request.statusConceptId).toBe(CONCEPTS.LINK_REQUEST_EXPIRED);
    });
  });

  describe('unlinkIdentity (UC-40-12)', () => {
    it('revokes the identity and records the outcome', async () => {
      const d = build();
      const identity: any = {
        id: IDENTITY,
        providerId: PROVIDER,
        userId: USER,
        externalSubject: SUBJECT,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
      };
      d.providersRepo.findIdentityForUpdate.mockResolvedValue(identity);

      const res = await d.service.unlinkIdentity(
        IDENTITY,
        { reason: 'baja del empleado' },
        actor,
      );

      expect(res).toEqual({
        id: IDENTITY,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
        attemptId: ATTEMPT,
      });
      expect(identity.stateConceptId).toBe(CONCEPTS.FEDERATED_IDENTITY_REVOKED);
      expect(d.providersRepo.createLoginAttempt).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ outcomeConceptId: CONCEPTS.LOGIN_UNLINKED }),
      );
    });

    it('refuses to revoke twice', async () => {
      const d = build();
      d.providersRepo.findIdentityForUpdate.mockResolvedValue({
        id: IDENTITY,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
      });

      await expect(
        d.service.unlinkIdentity(
          IDENTITY,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the identity does not exist', async () => {
      const d = build();
      d.providersRepo.findIdentityForUpdate.mockResolvedValue(null);

      await expect(
        d.service.unlinkIdentity(
          IDENTITY,
          { reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
