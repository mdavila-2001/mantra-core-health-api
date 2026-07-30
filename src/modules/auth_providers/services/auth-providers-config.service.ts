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
import {
  CreateProviderDto,
  ProviderResponseDto,
  ConfigureProtocolDto,
  ProtocolConfigResponseDto,
  PublishSigningKeyDto,
  SigningKeyResponseDto,
  RotateSigningKeyDto,
  RotateKeyResponseDto,
  SetAttributeMappingsDto,
  AttributeMappingsResponseDto,
  BindTenantDto,
  BindingResponseDto,
  CreateProvisioningRuleDto,
  ProvisioningRuleResponseDto,
  type IdpProtocol,
  type IdpCategory,
  type IdpEnvironment,
  type TokenEndpointAuth,
  type ProvisioningEffect,
} from '../dto';

const PROTOCOL_CONCEPT: Readonly<Record<IdpProtocol, string>> = {
  OIDC: CONCEPTS.IDP_PROTOCOL_OIDC,
  SAML: CONCEPTS.IDP_PROTOCOL_SAML,
  OAUTH2: CONCEPTS.IDP_PROTOCOL_OAUTH2,
};

const CATEGORY_CONCEPT: Readonly<Record<IdpCategory, string>> = {
  ENTERPRISE: CONCEPTS.IDP_CATEGORY_ENTERPRISE,
  SOCIAL: CONCEPTS.IDP_CATEGORY_SOCIAL,
  GOVERNMENT: CONCEPTS.IDP_CATEGORY_GOVERNMENT,
};

export const ENVIRONMENT_CONCEPT: Readonly<Record<IdpEnvironment, string>> = {
  DEVELOPMENT: CONCEPTS.IDP_ENV_DEVELOPMENT,
  STAGING: CONCEPTS.IDP_ENV_STAGING,
  PRODUCTION: CONCEPTS.IDP_ENV_PRODUCTION,
};

const TOKEN_AUTH_CONCEPT: Readonly<Record<TokenEndpointAuth, string>> = {
  CLIENT_SECRET_POST: CONCEPTS.TOKEN_AUTH_CLIENT_SECRET_POST,
  CLIENT_SECRET_BASIC: CONCEPTS.TOKEN_AUTH_CLIENT_SECRET_BASIC,
  PRIVATE_KEY_JWT: CONCEPTS.TOKEN_AUTH_PRIVATE_KEY_JWT,
};

const EFFECT_CONCEPT: Readonly<Record<ProvisioningEffect, string>> = {
  ALLOW: CONCEPTS.PROVISION_EFFECT_ALLOW,
  DENY: CONCEPTS.PROVISION_EFFECT_DENY,
};

const DEFAULT_GRACE_HOURS = 24;

/**
 * Configuración del proveedor de identidad: alta, protocolo, claves de firma,
 * mapeo de atributos, vínculo por tenant y reglas de aprovisionamiento
 * (UC-40-01 … 06, UC-40-11).
 */
@Injectable()
export class AuthProvidersConfigService {
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
    this.logger.setContext(AuthProvidersConfigService.name);
  }

  /**
   * UC-40-01: registrar el proveedor. Nace en borrador: configurar el protocolo
   * y publicar su clave es lo que lo activa, y sin eso no puede autenticar a
   * nadie.
   */
  async createProvider(
    dto: CreateProviderDto,
    actor: AuthenticatedUser,
  ): Promise<ProviderResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.provider.create',
        code: dto.code,
        protocol: dto.protocol,
      },
      'Registering identity provider',
    );

    const duplicate = await this.providersRepo.findProviderByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un proveedor con ese código', {
        code: dto.code,
      });
    }
    // Un proveedor no global sin tenant dueño no lo podría usar nadie.
    if (!dto.isGlobal && !dto.tenantId) {
      throw new PreconditionFailedException(
        'Un proveedor no global necesita el tenant al que pertenece',
        { code: dto.code },
      );
    }

    return this.em.transactional(async (tx) => {
      const provider = this.providersRepo.createProvider(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        protocolConceptId: PROTOCOL_CONCEPT[dto.protocol],
        providerCategoryConceptId: CATEGORY_CONCEPT[dto.category],
        issuer: dto.issuer,
        isGlobal: dto.isGlobal ?? false,
        stateConceptId: CONCEPTS.IDP_DRAFT,
        actorUserId: actor.id,
      });

      return {
        id: provider.id,
        code: dto.code,
        stateConceptId: CONCEPTS.IDP_DRAFT,
        isGlobal: dto.isGlobal ?? false,
      };
    });
  }

  /**
   * UC-40-02: configurar el protocolo del entorno e importar el JWKS. Al quedar
   * configurado, el proveedor pasa a activo: ya puede autenticar.
   */
  async configureProtocol(
    providerId: string,
    dto: ConfigureProtocolDto,
    actor: AuthenticatedUser,
  ): Promise<ProtocolConfigResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.protocol.configure',
        providerId,
        environment: dto.environment,
      },
      'Configuring provider protocol',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderForUpdate(
        tx,
        providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      }

      this.assertProtocolShape(provider.protocolConceptId, dto, providerId);

      const environmentConceptId = ENVIRONMENT_CONCEPT[dto.environment];
      const previous = await this.providersRepo.findProtocolConfigForUpdate(
        tx,
        providerId,
        environmentConceptId,
      );
      if (previous) {
        // Reconfigurar es reemplazar: dos configuraciones del mismo entorno
        // dejarían sin decidir con cuál se autentica.
        previous.stateConceptId = CONCEPTS.IDP_DISABLED;
        touch(previous, actor.id);
      }

      const config = this.providersRepo.createProtocolConfig(tx, {
        providerId,
        environmentConceptId,
        clientId: dto.clientId,
        clientSecretRef: dto.clientSecretRef,
        authorizeUrl: dto.authorizeUrl,
        tokenUrl: dto.tokenUrl,
        userinfoUrl: dto.userinfoUrl,
        jwksUri: dto.jwksUri,
        metadataUrl: dto.metadataUrl,
        samlEntityId: dto.samlEntityId,
        samlAcsUrl: dto.samlAcsUrl,
        scopes: dto.scopes,
        responseType: dto.responseType,
        tokenEndpointAuthConceptId: dto.tokenEndpointAuth
          ? TOKEN_AUTH_CONCEPT[dto.tokenEndpointAuth]
          : undefined,
        pkceRequired: dto.pkceRequired ?? true,
        extraConfigJson: dto.extraConfigJson,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      const importedKeyIds: string[] = [];
      for (const key of dto.discoveredKeys ?? []) {
        const existing = await this.providersRepo.findSigningKey(
          tx,
          providerId,
          key.keyId,
        );
        if (existing) continue;
        const created = this.providersRepo.createSigningKey(tx, {
          providerId,
          keyId: key.keyId,
          keyUseConceptId: CONCEPTS.KEY_USE_SIGNING,
          algorithm: key.algorithm,
          publicKey: key.publicKey,
          certificate: key.certificate,
          validFrom: new Date(),
          stateConceptId: CONCEPTS.KEY_ACTIVE,
          actorUserId: actor.id,
        });
        importedKeyIds.push(created.id);
      }

      if (provider.stateConceptId === CONCEPTS.IDP_DRAFT) {
        provider.stateConceptId = CONCEPTS.IDP_ACTIVE;
      }
      touch(provider, actor.id);

      return {
        id: config.id,
        providerId,
        environmentConceptId,
        replaced: previous !== null,
        importedKeyIds,
      };
    });
  }

  /** UC-40-03: publicar una clave de firma del proveedor. */
  async publishSigningKey(
    providerId: string,
    dto: PublishSigningKeyDto,
    actor: AuthenticatedUser,
  ): Promise<SigningKeyResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.key.publish', providerId, keyId: dto.keyId },
      'Publishing provider signing key',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderById(
        tx,
        providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      }

      const duplicate = await this.providersRepo.findSigningKey(
        tx,
        providerId,
        dto.keyId,
      );
      if (duplicate) {
        throw new ConflictException(
          'El proveedor ya tiene una clave con ese identificador',
          {
            providerId,
            keyId: dto.keyId,
          },
        );
      }

      const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
      const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
      if (validTo && validTo <= validFrom) {
        throw new PreconditionFailedException(
          'La vigencia de la clave está invertida',
          {
            validFrom: dto.validFrom,
            validTo: dto.validTo,
          },
        );
      }

      const key = this.providersRepo.createSigningKey(tx, {
        providerId,
        keyId: dto.keyId,
        keyUseConceptId: CONCEPTS.KEY_USE_SIGNING,
        algorithm: dto.algorithm,
        publicKey: dto.publicKey,
        certificate: dto.certificate,
        validFrom,
        validTo,
        stateConceptId: CONCEPTS.KEY_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: key.id,
        keyId: dto.keyId,
        stateConceptId: CONCEPTS.KEY_ACTIVE,
      };
    });
  }

  /**
   * UC-40-11: rotar la clave. Las salientes pasan a retirándose con un periodo
   * de gracia, no se eliminan: retirarlas de golpe invalidaría los tokens que
   * ya están en vuelo, firmados con la clave anterior.
   */
  async rotateSigningKey(
    providerId: string,
    dto: RotateSigningKeyDto,
    actor: AuthenticatedUser,
  ): Promise<RotateKeyResponseDto> {
    this.logger.info(
      { operation: 'auth-providers.key.rotate', providerId, keyId: dto.keyId },
      'Rotating provider signing key',
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderForUpdate(
        tx,
        providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      }

      const duplicate = await this.providersRepo.findSigningKey(
        tx,
        providerId,
        dto.keyId,
      );
      if (duplicate) {
        throw new ConflictException(
          'El proveedor ya tiene una clave con ese identificador',
          {
            providerId,
            keyId: dto.keyId,
          },
        );
      }

      const active = await this.providersRepo.findActiveKeysForUpdate(
        tx,
        providerId,
        CONCEPTS.KEY_ACTIVE,
      );

      const now = new Date();
      const graceHours = dto.graceHours ?? DEFAULT_GRACE_HOURS;
      const graceUntil = new Date(now.getTime() + graceHours * 60 * 60 * 1000);

      const created = this.providersRepo.createSigningKey(tx, {
        providerId,
        keyId: dto.keyId,
        keyUseConceptId: CONCEPTS.KEY_USE_SIGNING,
        algorithm: dto.algorithm,
        publicKey: dto.publicKey,
        certificate: dto.certificate,
        validFrom: now,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        stateConceptId: CONCEPTS.KEY_ACTIVE,
        actorUserId: actor.id,
      });

      let retiringCount = 0;
      for (const key of active) {
        key.stateConceptId =
          graceHours > 0 ? CONCEPTS.KEY_RETIRING : CONCEPTS.KEY_RETIRED;
        key.validTo = graceHours > 0 ? graceUntil : now;
        touch(key, actor.id);
        retiringCount += 1;
      }

      this.logger.warn(
        {
          operation: 'auth-providers.key.rotate',
          providerId,
          retiringCount,
          graceHours,
        },
        'Provider signing key rotated',
      );

      return {
        newKeyId: created.id,
        retiringCount,
        graceUntil: graceHours > 0 ? graceUntil.toISOString() : undefined,
      };
    });
  }

  /**
   * UC-40-04: fijar el mapeo de atributos. Se reemplaza en bloque y exige
   * exactamente un claim identificador: sin él no se sabría qué distingue a un
   * sujeto de otro, y con dos el login sería ambiguo.
   */
  async setAttributeMappings(
    providerId: string,
    dto: SetAttributeMappingsDto,
    actor: AuthenticatedUser,
  ): Promise<AttributeMappingsResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.mappings.set',
        providerId,
        count: dto.mappings.length,
      },
      'Setting provider attribute mappings',
    );

    const identifiers = dto.mappings.filter((m) => m.isIdentifier);
    if (identifiers.length !== 1) {
      throw new PreconditionFailedException(
        'El mapeo necesita exactamente un claim identificador',
        { providerId, identifiers: identifiers.length },
      );
    }
    this.assertUniqueClaims(
      dto.mappings.map((m) => m.sourceClaim),
      providerId,
    );

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderForUpdate(
        tx,
        providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      }

      const previous = await this.providersRepo.findMappingsForUpdate(
        tx,
        providerId,
      );
      if (previous.length > 0) {
        this.providersRepo.removeMappings(tx, previous);
      }

      const mappingIds = dto.mappings.map(
        (mapping) =>
          this.providersRepo.createAttributeMapping(tx, {
            providerId,
            sourceClaim: mapping.sourceClaim,
            targetAttribute: mapping.targetAttribute,
            isIdentifier: mapping.isIdentifier ?? false,
            required: mapping.required ?? false,
            transformJson: mapping.transformJson,
            actorUserId: actor.id,
          }).id,
      );

      touch(provider, actor.id);

      return {
        providerId,
        mappingIds,
        removed: previous.length,
        identifierClaim: identifiers[0].sourceClaim,
      };
    });
  }

  /** UC-40-05: vincular el proveedor a un tenant con sus reglas de alta. */
  async bindTenant(
    dto: BindTenantDto,
    actor: AuthenticatedUser,
  ): Promise<BindingResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.binding.set',
        providerId: dto.providerId,
        tenantId: dto.tenantId,
      },
      'Binding provider to tenant',
    );

    // Aprovisionar sin rol por defecto crearía usuarios sin permisos, que es
    // tan inútil como peligroso de corregir después a mano.
    const provisions =
      (dto.autoProvision ?? false) || (dto.justInTimeProvisioning ?? false);
    if (provisions && !dto.defaultRoleConceptId) {
      throw new PreconditionFailedException(
        'Aprovisionar automáticamente exige declarar el rol por defecto',
        { providerId: dto.providerId, tenantId: dto.tenantId },
      );
    }

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

      const existing = await this.providersRepo.findBindingForUpdate(
        tx,
        dto.providerId,
        dto.tenantId,
      );
      if (existing) {
        existing.isEnabled = dto.isEnabled ?? true;
        existing.autoProvision = dto.autoProvision ?? false;
        existing.justInTimeProvisioning = dto.justInTimeProvisioning ?? false;
        existing.defaultRoleConceptId = dto.defaultRoleConceptId;
        existing.allowedEmailDomains = dto.allowedEmailDomains;
        touch(existing, actor.id);

        return {
          id: existing.id,
          providerId: dto.providerId,
          tenantId: dto.tenantId,
          isEnabled: existing.isEnabled,
          updated: true,
        };
      }

      const ordinal =
        (await this.providersRepo.countBindings(tx, dto.providerId)) + 1;
      const binding = this.providersRepo.createBinding(tx, {
        providerId: dto.providerId,
        tenantId: dto.tenantId,
        isEnabled: dto.isEnabled ?? true,
        autoProvision: dto.autoProvision ?? false,
        justInTimeProvisioning: dto.justInTimeProvisioning ?? false,
        defaultRoleConceptId: dto.defaultRoleConceptId,
        allowedEmailDomains: dto.allowedEmailDomains,
        ordinal,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: binding.id,
        providerId: dto.providerId,
        tenantId: dto.tenantId,
        isEnabled: dto.isEnabled ?? true,
        updated: false,
      };
    });
  }

  /**
   * UC-40-06: definir una regla de aprovisionamiento. La prioridad es única:
   * dos reglas empatadas dejarían el resultado a merced del orden de lectura.
   */
  async createProvisioningRule(
    providerId: string,
    dto: CreateProvisioningRuleDto,
    actor: AuthenticatedUser,
  ): Promise<ProvisioningRuleResponseDto> {
    this.logger.info(
      {
        operation: 'auth-providers.rule.create',
        providerId,
        priority: dto.priority,
      },
      'Creating provisioning rule',
    );

    // Una regla que deniega no asigna nada: declarar rol o tenant con DENY es
    // una contradicción que después nadie sabría leer.
    if (
      dto.effect === 'DENY' &&
      (dto.assignRoleConceptId || dto.assignTenantId)
    ) {
      throw new PreconditionFailedException(
        'Una regla DENY no asigna rol ni tenant',
        {
          providerId,
          priority: dto.priority,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const provider = await this.providersRepo.findProviderById(
        tx,
        providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerId,
        });
      }

      const duplicate = await this.providersRepo.findRuleByPriority(
        tx,
        providerId,
        dto.priority,
      );
      if (duplicate) {
        throw new ConflictException('Ya existe una regla con esa prioridad', {
          providerId,
          priority: dto.priority,
        });
      }

      const rule = this.providersRepo.createProvisioningRule(tx, {
        providerId,
        tenantId: dto.tenantId,
        priority: dto.priority,
        conditionJson: dto.conditionJson,
        assignRoleConceptId: dto.assignRoleConceptId,
        assignTenantId: dto.assignTenantId,
        effectConceptId: EFFECT_CONCEPT[dto.effect],
        isActive: true,
        actorUserId: actor.id,
      });

      return {
        id: rule.id,
        priority: dto.priority,
        effectConceptId: EFFECT_CONCEPT[dto.effect],
        isActive: true,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Cada protocolo exige lo suyo: sin sus endpoints, el proveedor quedaría
   * configurado a medias y el fallo aparecería al primer login real.
   */
  private assertProtocolShape(
    protocolConceptId: string,
    dto: ConfigureProtocolDto,
    providerId: string,
  ): void {
    if (protocolConceptId === CONCEPTS.IDP_PROTOCOL_SAML) {
      if (!dto.samlEntityId || !dto.samlAcsUrl) {
        throw new PreconditionFailedException(
          'Una configuración SAML necesita entity ID y ACS URL',
          { providerId },
        );
      }
      return;
    }

    // OIDC y OAuth2 comparten el flujo de código de autorización.
    if (!dto.clientId) {
      throw new PreconditionFailedException(
        'La configuración necesita el identificador de cliente',
        {
          providerId,
        },
      );
    }
    if (!dto.authorizeUrl || !dto.tokenUrl) {
      throw new PreconditionFailedException(
        'La configuración necesita los endpoints de autorización y token',
        { providerId },
      );
    }
    if (
      protocolConceptId === CONCEPTS.IDP_PROTOCOL_OIDC &&
      !dto.jwksUri &&
      !dto.metadataUrl
    ) {
      throw new PreconditionFailedException(
        'Una configuración OIDC necesita JWKS o documento de descubrimiento',
        { providerId },
      );
    }
  }

  /**
   * Valida assert unique claims.
   *
   * @param claims - Valor de claims requerido por la operación.
   * @param providerId - Identificador de provider.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private assertUniqueClaims(claims: string[], providerId: string): void {
    const seen = new Set<string>();
    for (const claim of claims) {
      if (seen.has(claim)) {
        throw new PreconditionFailedException(
          'El claim de origen está repetido en el mapeo',
          {
            providerId,
            claim,
          },
        );
      }
      seen.add(claim);
    }
  }
}
