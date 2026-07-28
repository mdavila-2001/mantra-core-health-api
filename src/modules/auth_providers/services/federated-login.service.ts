import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuthProvidersRepository } from '../repositories';
import type { ProviderAttributeMappings, ProvisioningRules } from '../entities';
import { ENVIRONMENT_CONCEPT } from './auth-providers-config.service';
import {
  StartLoginDto,
  StartLoginResponseDto,
  ProcessCallbackDto,
  CallbackResponseDto,
  RequestAccountLinkDto,
  AccountLinkRequestResponseDto,
  CompleteAccountLinkDto,
  CompleteAccountLinkResponseDto,
  UnlinkIdentityDto,
  UnlinkIdentityResponseDto,
} from '../dto';

const DEFAULT_LINK_EXPIRY_MINUTES = 30;

/** Resultado interno de la evaluación de reglas de aprovisionamiento. */
interface ProvisioningDecision {
  /**
   * Valor de allowed mantenido por la instancia.
   */
  allowed: boolean;
  /**
   * Identificador asociado a matched rule.
   */
  matchedRuleId?: string;
}

/**
 * Login federado: inicio, callback, vinculación y desvinculación de cuentas
 * (UC-40-07 … 10, UC-40-12).
 *
 * El módulo no crea usuarios locales: eso vive en `iam` y escribir allí
 * cruzaría la frontera del esquema. Cuando el sujeto externo no tiene todavía
 * identidad federada, el callback devuelve un token de vinculación en lugar de
 * inventar el usuario.
 */
@Injectable()
export class FederatedLoginService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providersRepo - Valor de providers repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly providersRepo: AuthProvidersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FederatedLoginService.name);
  }

  /**
   * UC-40-07: iniciar el login. Devuelve `state` y `nonce` recién generados y
   * deja registrado el intento: el callback sólo se acepta si su `state`
   * corresponde a un inicio real.
   */
  async startLogin(
    providerCode: string,
    dto: StartLoginDto,
    actor: AuthenticatedUser,
  ): Promise<StartLoginResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.login.start',
        providerCode,
        tenantId: dto.tenantId,
      },
      'Starting federated login',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderByCode(
        tx,
        providerCode,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerCode,
        });
      }
      if (provider.stateConceptId !== CONCEPTS.IDP_ACTIVE) {
        throw new PreconditionFailedException('El proveedor no está activo', {
          providerCode,
        });
      }

      const environmentConceptId =
        ENVIRONMENT_CONCEPT[dto.environment ?? 'PRODUCTION'];
      const config = await this.providersRepo.findProtocolConfig(
        tx,
        provider.id,
        environmentConceptId,
      );
      if (!config || config.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El proveedor no tiene configuración activa para ese entorno',
          { providerCode, environment: dto.environment ?? 'PRODUCTION' },
        );
      }
      if (!config.authorizeUrl) {
        throw new PreconditionFailedException(
          'La configuración no declara endpoint de autorización',
          { providerCode },
        );
      }

      // Un proveedor global sirve a cualquier tenant; el resto necesita vínculo
      // habilitado, o el login acabaría en un tenant que no lo admite.
      if (dto.tenantId && !provider.isGlobal) {
        const binding = await this.providersRepo.findBinding(
          tx,
          provider.id,
          dto.tenantId,
        );
        if (!binding || !binding.isEnabled) {
          throw new PreconditionFailedException(
            'El proveedor no está habilitado para ese tenant',
            { providerCode, tenantId: dto.tenantId },
          );
        }
      }

      const state = randomUUID();
      const nonce = randomBytes(16).toString('hex');

      const attempt = this.providersRepo.createLoginAttempt(tx, {
        providerId: provider.id,
        tenantId: dto.tenantId,
        userId: actor.id,
        outcomeConceptId: CONCEPTS.LOGIN_INITIATED,
        ip: dto.ip,
        userAgent: dto.userAgent,
        requestId: state,
      });

      return {
        attemptId: attempt.id,
        state,
        nonce,
        authorizeUrl: this.buildAuthorizeUrl(
          config.authorizeUrl,
          config.clientId,
          config.scopes,
          {
            state,
            nonce,
            responseType: config.responseType,
          },
        ),
        pkceRequired: config.pkceRequired ?? true,
      };
    });
  }

  /**
   * UC-40-08: procesar el callback. Todo desenlace queda registrado como
   * intento — también el rechazo, que es justo el que hay que poder auditar.
   */
  async processCallback(
    providerCode: string,
    dto: ProcessCallbackDto,
    actor: AuthenticatedUser,
  ): Promise<CallbackResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.login.callback', providerCode },
      'Processing federated login callback',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderByCode(
        tx,
        providerCode,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerCode,
        });
      }

      // El `state` es lo único que liga el callback con un inicio nuestro: sin
      // esa comprobación cualquiera podría inyectar una respuesta.
      const initiated = await this.providersRepo.findAttemptByRequestId(
        tx,
        provider.id,
        dto.state,
      );
      if (
        !initiated ||
        initiated.outcomeConceptId !== CONCEPTS.LOGIN_INITIATED
      ) {
        throw new PreconditionFailedException(
          'El `state` no corresponde a un login iniciado',
          {
            providerCode,
          },
        );
      }

      const tenantId = dto.tenantId ?? initiated.tenantId;
      /**
       * Ejecuta la operación reject.
       *
       * @param reasonConceptId - Identificador de reason concept.
       * @returns Resultado de reject conforme al contrato `CallbackResponseDto`.
       */
      const reject = (reasonConceptId: string): CallbackResponseDto => {
        const attempt = this.providersRepo.createLoginAttempt(tx, {
          providerId: provider.id,
          tenantId,
          userId: dto.userId,
          externalSubject: dto.externalSubject,
          outcomeConceptId: CONCEPTS.LOGIN_FAILURE,
          failureReasonConceptId: reasonConceptId,
          ip: dto.ip,
          userAgent: dto.userAgent,
          requestId: dto.state,
        });
        this.logger.warn(
          {
            operation: 'auth-providers.login.callback',
            providerCode,
            reasonConceptId,
            attemptId: attempt.id,
          },
          'Federated login rejected',
        );
        return {
          outcomeConceptId: CONCEPTS.LOGIN_FAILURE,
          failureReasonConceptId: reasonConceptId,
          provisioned: false,
          attemptId: attempt.id,
        };
      };

      if (provider.stateConceptId !== CONCEPTS.IDP_ACTIVE) {
        return reject(CONCEPTS.LOGIN_FAIL_PROVIDER_DISABLED);
      }

      const mappings = await this.providersRepo.findMappingsByProvider(
        tx,
        provider.id,
      );
      const missing = mappings.find(
        (mapping) =>
          mapping.required && !this.hasClaim(dto.claims, mapping.sourceClaim),
      );
      if (missing) {
        return reject(CONCEPTS.LOGIN_FAIL_MISSING_CLAIM);
      }

      const externalEmail = this.readMapped(dto.claims, mappings, 'email');
      const displayName = this.readMapped(dto.claims, mappings, 'displayName');

      const identity = await this.providersRepo.findIdentityBySubjectForUpdate(
        tx,
        provider.id,
        dto.externalSubject,
      );

      if (identity) {
        if (identity.stateConceptId === CONCEPTS.FEDERATED_IDENTITY_REVOKED) {
          return reject(CONCEPTS.LOGIN_FAIL_IDENTITY_REVOKED);
        }

        identity.lastLoginAt = new Date();
        identity.externalEmail = externalEmail ?? identity.externalEmail;
        identity.displayName = displayName ?? identity.displayName;
        identity.rawClaimsJson = dto.claims;
        touch(identity, actor.id);

        const attempt = this.providersRepo.createLoginAttempt(tx, {
          providerId: provider.id,
          tenantId,
          userId: identity.userId,
          externalSubject: dto.externalSubject,
          outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
          ip: dto.ip,
          userAgent: dto.userAgent,
          requestId: dto.state,
        });

        return {
          federatedIdentityId: identity.id,
          userId: identity.userId,
          outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
          provisioned: false,
          attemptId: attempt.id,
        };
      }

      // Sin identidad previa el login sólo puede continuar si el tenant lo
      // permite: es la puerta por la que entraría alguien de fuera.
      const binding = tenantId
        ? await this.providersRepo.findBinding(tx, provider.id, tenantId)
        : null;
      if (tenantId && (!binding || !binding.isEnabled)) {
        return reject(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
      }
      if (
        binding?.allowedEmailDomains &&
        !this.domainAllowed(externalEmail, binding.allowedEmailDomains)
      ) {
        return reject(CONCEPTS.LOGIN_FAIL_DOMAIN_NOT_ALLOWED);
      }

      const rules = await this.providersRepo.findActiveRules(tx, provider.id);
      const decision = this.evaluateRules(rules, dto.claims, tenantId);
      if (!decision.allowed) {
        return reject(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
      }

      if (dto.userId && binding?.justInTimeProvisioning) {
        const created = this.providersRepo.createFederatedIdentity(tx, {
          providerId: provider.id,
          userId: dto.userId,
          externalSubject: dto.externalSubject,
          externalEmail,
          displayName,
          rawClaimsJson: dto.claims,
          stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
          actorUserId: actor.id,
        });

        const attempt = this.providersRepo.createLoginAttempt(tx, {
          providerId: provider.id,
          tenantId,
          userId: dto.userId,
          externalSubject: dto.externalSubject,
          outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
          ip: dto.ip,
          userAgent: dto.userAgent,
          requestId: dto.state,
        });

        return {
          federatedIdentityId: created.id,
          userId: dto.userId,
          outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
          provisioned: true,
          attemptId: attempt.id,
        };
      }

      // No se autenticó a nadie, así que el intento es un rechazo; pero el
      // sujeto sí puede vincularse, y para eso se devuelve el token.
      const { token, hash } = this.mintLinkToken();
      const request = this.providersRepo.createLinkRequest(tx, {
        providerId: provider.id,
        userId: dto.userId,
        externalSubject: dto.externalSubject,
        linkTokenHash: hash,
        statusConceptId: CONCEPTS.LINK_REQUEST_PENDING,
        expiresAt: this.expiryFromNow(DEFAULT_LINK_EXPIRY_MINUTES),
        actorUserId: actor.id,
      });

      const rejected = reject(CONCEPTS.LOGIN_FAIL_NO_PROVISION);
      this.logger.info(
        {
          operation: 'auth-providers.login.callback',
          providerCode,
          linkRequestId: request.id,
        },
        'Federated login issued account link token',
      );
      return { ...rejected, linkToken: token };
    });
  }

  /**
   * UC-40-09: pedir la vinculación de un sujeto externo a la cuenta local. El
   * token se devuelve una sola vez: en la tabla queda su hash.
   */
  async requestAccountLink(
    dto: RequestAccountLinkDto,
    actor: AuthenticatedUser,
  ): Promise<AccountLinkRequestResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.link.request', providerId: dto.providerId },
      'Requesting account link',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderById(
        tx,
        dto.providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId: dto.providerId,
        });
      }
      if (provider.stateConceptId === CONCEPTS.IDP_DISABLED) {
        throw new PreconditionFailedException(
          'El proveedor está deshabilitado',
          {
            providerId: dto.providerId,
          },
        );
      }

      const already = await this.providersRepo.findIdentityBySubject(
        tx,
        dto.providerId,
        dto.externalSubject,
      );
      if (
        already &&
        already.stateConceptId === CONCEPTS.FEDERATED_IDENTITY_ACTIVE
      ) {
        throw new ConflictException('El sujeto externo ya está vinculado', {
          providerId: dto.providerId,
          externalSubject: dto.externalSubject,
        });
      }

      const pending = await this.providersRepo.findPendingLinkRequest(
        tx,
        dto.providerId,
        actor.id,
        dto.externalSubject,
        CONCEPTS.LINK_REQUEST_PENDING,
      );
      if (pending) {
        throw new ConflictException(
          'Ya hay una solicitud de vinculación pendiente',
          {
            providerId: dto.providerId,
            requestId: pending.id,
          },
        );
      }

      const { token, hash } = this.mintLinkToken();
      const expiresAt = this.expiryFromNow(
        dto.expiresInMinutes ?? DEFAULT_LINK_EXPIRY_MINUTES,
      );
      const request = this.providersRepo.createLinkRequest(tx, {
        providerId: dto.providerId,
        userId: actor.id,
        externalSubject: dto.externalSubject,
        linkTokenHash: hash,
        statusConceptId: CONCEPTS.LINK_REQUEST_PENDING,
        expiresAt,
        actorUserId: actor.id,
      });

      return {
        id: request.id,
        linkToken: token,
        expiresAt: expiresAt.toISOString(),
        statusConceptId: CONCEPTS.LINK_REQUEST_PENDING,
      };
    });
  }

  /** UC-40-10: completar la vinculación presentando el token. */
  async completeAccountLink(
    dto: CompleteAccountLinkDto,
    actor: AuthenticatedUser,
  ): Promise<CompleteAccountLinkResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.link.complete' },
      'Completing account link',
    );

    return this.em.transactional(async (tx) => {
      const request =
        await this.providersRepo.findLinkRequestByTokenHashForUpdate(
          tx,
          this.hashToken(dto.linkToken),
        );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de vinculación no encontrada',
          {},
        );
      }
      if (request.statusConceptId !== CONCEPTS.LINK_REQUEST_PENDING) {
        throw new PreconditionFailedException(
          'La solicitud ya no está pendiente',
          {
            requestId: request.id,
          },
        );
      }
      if (request.expiresAt && request.expiresAt.getTime() <= Date.now()) {
        request.statusConceptId = CONCEPTS.LINK_REQUEST_EXPIRED;
        touch(request, actor.id);
        throw new PreconditionFailedException(
          'La solicitud de vinculación caducó',
          {
            requestId: request.id,
          },
        );
      }

      // La solicitud puede haber nacido en un callback sin usuario resuelto;
      // en ese caso vincula quien la completa.
      const userId = request.userId ?? actor.id;

      const existing = await this.providersRepo.findIdentityBySubjectForUpdate(
        tx,
        request.providerId,
        request.externalSubject,
      );
      if (
        existing &&
        existing.stateConceptId === CONCEPTS.FEDERATED_IDENTITY_ACTIVE
      ) {
        throw new ConflictException('El sujeto externo ya está vinculado', {
          requestId: request.id,
          externalSubject: request.externalSubject,
        });
      }

      let identity = existing;
      if (identity) {
        // Reactivar la identidad revocada conserva su historial.
        identity.userId = userId;
        identity.stateConceptId = CONCEPTS.FEDERATED_IDENTITY_ACTIVE;
        identity.externalEmail = dto.externalEmail ?? identity.externalEmail;
        identity.displayName = dto.displayName ?? identity.displayName;
        identity.rawClaimsJson = dto.claims ?? identity.rawClaimsJson;
        identity.linkedAt = new Date();
        identity.lastLoginAt = new Date();
        touch(identity, actor.id);
      } else {
        identity = this.providersRepo.createFederatedIdentity(tx, {
          providerId: request.providerId,
          userId,
          externalSubject: request.externalSubject,
          externalEmail: dto.externalEmail,
          displayName: dto.displayName,
          rawClaimsJson: dto.claims,
          stateConceptId: CONCEPTS.FEDERATED_IDENTITY_ACTIVE,
          actorUserId: actor.id,
        });
      }

      request.statusConceptId = CONCEPTS.LINK_REQUEST_COMPLETED;
      request.completedAt = new Date();
      request.userId = userId;
      touch(request, actor.id);

      this.providersRepo.createLoginAttempt(tx, {
        providerId: request.providerId,
        userId,
        externalSubject: request.externalSubject,
        outcomeConceptId: CONCEPTS.LOGIN_SUCCESS,
      });

      return {
        requestId: request.id,
        federatedIdentityId: identity.id,
        userId,
        statusConceptId: CONCEPTS.LINK_REQUEST_COMPLETED,
      };
    });
  }

  /**
   * UC-40-12: desvincular. La identidad se revoca, no se borra: el histórico de
   * logins apunta a ella y hay que poder explicar quién entró y con qué.
   */
  async unlinkIdentity(
    identityId: string,
    dto: UnlinkIdentityDto,
    actor: AuthenticatedUser,
  ): Promise<UnlinkIdentityResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.identity.unlink', identityId },
      'Unlinking federated identity',
    );

    return this.em.transactional(async (tx) => {
      const identity = await this.providersRepo.findIdentityForUpdate(
        tx,
        identityId,
      );
      if (!identity) {
        throw new ResourceNotFoundException(
          'Identidad federada no encontrada',
          { identityId },
        );
      }
      if (identity.stateConceptId === CONCEPTS.FEDERATED_IDENTITY_REVOKED) {
        throw new PreconditionFailedException('La identidad ya está revocada', {
          identityId,
        });
      }

      identity.stateConceptId = CONCEPTS.FEDERATED_IDENTITY_REVOKED;
      touch(identity, actor.id);

      const attempt = this.providersRepo.createLoginAttempt(tx, {
        providerId: identity.providerId,
        userId: identity.userId,
        externalSubject: identity.externalSubject,
        outcomeConceptId: CONCEPTS.LOGIN_UNLINKED,
      });

      this.logger.warn(
        {
          operation: 'auth-providers.identity.unlink',
          identityId,
          reason: dto.reason,
        },
        'Federated identity revoked',
      );

      return {
        id: identity.id,
        stateConceptId: CONCEPTS.FEDERATED_IDENTITY_REVOKED,
        attemptId: attempt.id,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Crea build authorize url.
   *
   * @param base - Valor de base requerido por la operación.
   * @param clientId - Identificador de client.
   * @param scopes - Valor de scopes requerido por la operación.
   * @param params - Valor de params requerido por la operación.
   * @returns Resultado de build authorize url conforme al contrato `string`.
   */
  private buildAuthorizeUrl(
    base: string,
    clientId: string | undefined,
    scopes: string | undefined,
    params: {
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string; /**
       * Valor de nonce mantenido por la instancia.
       */
      nonce: string; /**
       * Valor de response type mantenido por la instancia.
       */
      responseType?: string;
    },
  ): string {
    const query = new URLSearchParams({
      response_type: params.responseType ?? 'code',
      state: params.state,
      nonce: params.nonce,
    });
    if (clientId) query.set('client_id', clientId);
    if (scopes) query.set('scope', scopes);

    return `${base}${base.includes('?') ? '&' : '?'}${query.toString()}`;
  }

  /**
   * Obtiene has claim.
   *
   * @param claims - Valor de claims requerido por la operación.
   * @param claim - Valor de claim requerido por la operación.
   * @returns Resultado de has claim conforme al contrato `boolean`.
   */
  private hasClaim(claims: Record<string, unknown>, claim: string): boolean {
    const value = claims[claim];
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * Lee el claim que el proveedor mapea a un atributo del modelo. Sin mapeo no
   * se adivina el nombre del claim: se devuelve indefinido.
   */
  private readMapped(
    claims: Record<string, unknown>,
    mappings: ProviderAttributeMappings[],
    targetAttribute: string,
  ): string | undefined {
    const mapping = mappings.find((m) => m.targetAttribute === targetAttribute);
    if (!mapping) return undefined;
    const value = claims[mapping.sourceClaim];
    return typeof value === 'string' && value !== '' ? value : undefined;
  }

  /**
   * Ejecuta la operación domain allowed.
   *
   * @param email - Valor de email requerido por la operación.
   * @param allowedDomains - Valor de allowed domains requerido por la operación.
   * @returns Resultado de domain allowed conforme al contrato `boolean`.
   */
  private domainAllowed(
    email: string | undefined,
    allowedDomains: string,
  ): boolean {
    const allowed = allowedDomains
      .split(',')
      .map((domain) => domain.trim().toLowerCase())
      .filter((domain) => domain !== '');
    if (allowed.length === 0) return true;
    // Restringir por dominio y no recibir correo no es "todo permitido".
    if (!email) return false;

    const domain = email.split('@').pop()?.toLowerCase();
    return domain !== undefined && allowed.includes(domain);
  }

  /**
   * Evalúa las reglas por prioridad: decide la primera que case, y si ninguna
   * casa no se aprovisiona. Denegar por omisión es lo único seguro aquí.
   *
   * La condición es una comparación de igualdad claim a claim; nada más rico
   * está declarado en el caso de uso.
   */
  private evaluateRules(
    rules: ProvisioningRules[],
    claims: Record<string, unknown>,
    tenantId?: string,
  ): ProvisioningDecision {
    for (const rule of rules) {
      if (rule.tenantId && rule.tenantId !== tenantId) continue;
      if (!this.matchesCondition(rule.conditionJson, claims)) continue;

      return {
        allowed: rule.effectConceptId === CONCEPTS.PROVISION_EFFECT_ALLOW,
        matchedRuleId: rule.id,
      };
    }

    return { allowed: rules.length === 0 };
  }

  /**
   * Ejecuta la operación matches condition.
   *
   * @param condition - Valor de condition requerido por la operación.
   * @param claims - Valor de claims requerido por la operación.
   * @returns Resultado de matches condition conforme al contrato `boolean`.
   */
  private matchesCondition(
    condition: unknown,
    claims: Record<string, unknown>,
  ): boolean {
    if (condition === undefined || condition === null) return true;
    if (typeof condition !== 'object' || Array.isArray(condition)) return false;

    return Object.entries(condition as Record<string, unknown>).every(
      ([claim, expected]) => String(claims[claim]) === String(expected),
    );
  }

  /**
   * Ejecuta la operación mint link token.
   * @returns Resultado de mint link token conforme al contrato `{ token: string; hash: string }`.
   */
  private mintLinkToken(): {
    /**
     * Valor de token mantenido por la instancia.
     */
    token: string; /**
     * Valor de hash mantenido por la instancia.
     */
    hash: string;
  } {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hashToken(token) };
  }

  /**
   * Obtiene hash token.
   *
   * @param token - Valor de token requerido por la operación.
   * @returns Resultado de hash token conforme al contrato `string`.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Ejecuta la operación expiry from now.
   *
   * @param minutes - Valor de minutes requerido por la operación.
   * @returns Resultado de expiry from now conforme al contrato `Date`.
   */
  private expiryFromNow(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
