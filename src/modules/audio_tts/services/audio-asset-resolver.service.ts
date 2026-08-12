import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { getCurrentTenantId } from '../../../common';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type {
  AudioTemplateRecord,
  ResolveAudioRequest,
  ResolveAudioResult,
} from '../domain/audio.types';
import {
  AUDIO_ERROR,
  AudioDomainError,
  AudioTemplateNotFoundError,
} from '../domain/audio.errors';
import { AudioAssetsRepository, AudioQuotaRepository } from '../repositories';
import {
  AudioBudgetPolicy,
  type GenerationPurpose,
} from '../application/audio-budget.policy';
import {
  buildAudioCipher,
  type AudioValueCipher,
} from '../application/audio-value-cipher';
import {
  renderIdentityOf,
  resolveAudioIdentity,
  shouldScopeByTenant,
} from '../application/audio-identity';
import { parseResolveAudioRequest } from '../application/resolve-audio.validator';
import {
  hasTemplateTokens,
  renderTemplate,
} from '../application/template-renderer';

/**
 * Punto de entrada del dominio de audio para el resto del backend.
 *
 * Dos garantías gobiernan todo lo que hay aquí:
 *
 *   1. **Un acierto de caché no cuesta nada.** Ni cuota, ni llamada al proveedor,
 *      ni fila nueva. Es lo que hace viable poner audio en un flujo que se repite
 *      miles de veces al día.
 *   2. **La falta de audio nunca rompe al llamador.** Presupuesto agotado,
 *      proveedor caído, plantilla sin pre-generar: la respuesta es `FALLBACK` o
 *      `UNAVAILABLE`, nunca una excepción. Solo se lanza cuando el problema es de
 *      quien llama (plantilla inexistente, solicitud inválida).
 *
 * Lo inyectan otros módulos (onboarding, mensajería) por su tipo. No expone
 * `EntityManager` en la firma a propósito: quien pide un audio no debería tener
 * que saber que esto toca la base.
 */
@Injectable()
export class AudioAssetResolver {
  private readonly cipher: AudioValueCipher;
  private readonly policy: AudioBudgetPolicy;

  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly em: EntityManager,
    private readonly assets: AudioAssetsRepository,
    quota: AudioQuotaRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AudioAssetResolver.name);
    this.cipher = buildAudioCipher(config);
    this.policy = new AudioBudgetPolicy(quota, config);
  }

  /**
   * Resuelve el audio de una plantilla para el flujo de un usuario.
   *
   * @param request plantilla, variables y actor. Se valida siempre: este método lo
   *        llaman otros servicios por inyección, donde no hay `ValidationPipe`.
   */
  async resolve(request: ResolveAudioRequest): Promise<ResolveAudioResult> {
    return this.resolveInternal(parseResolveAudioRequest(request), 'runtime');
  }

  /**
   * Pre-genera una plantilla sin variables.
   *
   * Conserva las puertas de proveedor, licencia y presupuesto y solo omite la de
   * generación runtime: pre-calentar el catálogo es una operación de despliegue, y
   * tener que abrir la generación en caliente para poder hacerla obligaría a
   * exponerse a gasto no acotado durante la ventana del despliegue.
   *
   * @throws AudioDomainError si la plantilla lleva variables: pre-generar una
   *         plantilla dinámica exigiría inventar valores, y el audio resultante
   *         quedaría cacheado con un nombre que no es de nadie.
   */
  async prewarm(templateCode: string): Promise<ResolveAudioResult> {
    const request = parseResolveAudioRequest({ templateCode });
    const template = await this.requireTemplate(request.templateCode);
    if (hasTemplateTokens(template.templateText)) {
      throw new AudioDomainError(
        'prewarm solo admite plantillas sin variables',
        AUDIO_ERROR.prewarmDynamic,
      );
    }
    return this.resolveInternal(request, 'prewarm');
  }

  /** Estado de un asset ya conocido, para que el cliente vuelva a consultarlo. */
  async findAsset(assetId: string): Promise<{
    assetId: string;
    status: string;
    storageUri?: string;
    templateCode: string;
    lastErrorCode?: string;
  }> {
    const asset = await this.assets.findById(this.em, assetId);
    if (!asset) {
      throw new AudioDomainError(
        `Asset de audio no encontrado: ${assetId}`,
        AUDIO_ERROR.assetNotFound,
      );
    }
    // Un asset de otro tenant no existe para quien pregunta. Devolver 404 y no
    // 403 es deliberado: un 403 confirmaría que el identificador es válido.
    const tenantId = getCurrentTenantId();
    if (asset.tenantId && tenantId && asset.tenantId !== tenantId) {
      throw new AudioDomainError(
        `Asset de audio no encontrado: ${assetId}`,
        AUDIO_ERROR.assetNotFound,
      );
    }
    return {
      assetId: asset.id,
      status: asset.status,
      storageUri: asset.storageUri,
      templateCode: asset.templateCode,
      lastErrorCode: asset.lastErrorCode,
    };
  }

  private async resolveInternal(
    request: ResolveAudioRequest,
    purpose: GenerationPurpose,
  ): Promise<ResolveAudioResult> {
    const correlationId = request.correlationId ?? randomUUID();
    const template = await this.requireTemplate(request.templateCode);
    const renderedText = renderTemplate(
      template.templateText,
      request.variables,
      this.config.maxTextLength,
    );
    const tenantId = this.resolveOwnerTenant(template);
    const identity = resolveAudioIdentity(
      this.config,
      template,
      renderedText,
      request.language,
      tenantId,
    );

    const ready = await this.assets.findReadyByAssetKey(
      this.em,
      identity.assetKey,
    );
    if (ready?.storageUri) {
      return {
        status: 'READY',
        assetId: ready.id,
        storageUri: ready.storageUri,
        cacheHit: true,
      };
    }

    // Unidades = caracteres del texto ya normalizado. Es la métrica con la que
    // factura el proveedor, y se cuenta con el iterador de puntos de código
    // (`[...texto]`) y no con `.length`, que cuenta unidades UTF-16 y contaría de
    // más cualquier carácter fuera del plano básico.
    const units = [...renderedText].length;

    const reservation = await this.policy.reserve(
      this.em,
      units,
      purpose,
      request.actorId,
    );
    if (!reservation.allowed) {
      const reason = reservation.reason ?? 'GENERATION_DENIED';
      this.logger.info(
        {
          event: 'audio.generation.denied',
          correlationId,
          code: reason,
          templateCode: template.code,
        },
        'Generación de audio denegada',
      );
      return this.degrade(template, request, reason, correlationId, tenantId);
    }

    const { asset, created } = await this.assets.createPendingIfMissing(
      this.em,
      {
        id: randomUUID(),
        assetKey: identity.assetKey,
        tenantId,
        templateCode: template.code,
        templateVersion: template.version,
        renderedTextEncrypted: this.cipher.encrypt(
          renderedText,
          identity.assetKey,
        ),
        providerModel: identity.providerModel,
        reservedUnits: units,
        correlationId,
        language: identity.language,
        provider: identity.provider,
        model: identity.model,
        providerVoiceRef: identity.providerVoiceRef,
        voiceProfile: identity.voiceProfile,
        voiceVersion: identity.voiceVersion,
        outputFormat: identity.outputFormat,
        sampleRate: identity.sampleRate,
      },
    );

    if (!created) {
      // Otra petición ganó la carrera y ya tiene la reserva de este asset: la
      // nuestra no llegará a gastarse nunca, así que se devuelve. Sin esto, cada
      // petición concurrente del mismo audio dejaría unidades apartadas del
      // presupuesto que nada volvería a liberar.
      await this.policy.release(this.em, reservation, request.actorId);
      if (asset.status === 'READY' && asset.storageUri) {
        return {
          status: 'READY',
          assetId: asset.id,
          storageUri: asset.storageUri,
          cacheHit: true,
        };
      }
    }

    this.logger.debug(
      {
        event: 'audio.generation.queued',
        correlationId,
        assetId: asset.id,
        created,
      },
      'Asset de audio encolado',
    );
    return { status: 'QUEUED', assetId: asset.id, cacheHit: false };
  }

  /**
   * Degradación en dos escalones: fallback pre-generado y, si tampoco existe,
   * `UNAVAILABLE`.
   *
   * Todo el método corre dentro de un `try`: un fallo al buscar la degradación
   * —una plantilla de fallback mal configurada, una consulta que revienta— no
   * puede convertirse en la excepción que este camino existe para evitar.
   */
  private async degrade(
    template: AudioTemplateRecord,
    request: ResolveAudioRequest,
    reason: string,
    correlationId: string,
    tenantId?: string,
  ): Promise<ResolveAudioResult> {
    const code =
      template.fallbackTemplateCode ?? this.config.globalFallbackTemplate;
    try {
      const fallbackTemplate = await this.assets.findTemplate(this.em, code);
      if (!fallbackTemplate?.isActive) {
        this.logger.error(
          {
            event: 'audio.fallback.template_missing',
            correlationId,
            templateCode: code,
            code: reason,
          },
          'La plantilla de degradación no existe o está inactiva',
        );
        return { status: 'UNAVAILABLE', reason };
      }
      if (fallbackTemplate.strategy !== 'FALLBACK') {
        // Una plantilla que no se declaró como degradación puede llevar variables,
        // y servirla aquí produciría un texto a medio renderizar.
        this.logger.error(
          {
            event: 'audio.fallback.strategy_invalid',
            correlationId,
            templateCode: code,
          },
          'La plantilla de degradación no tiene estrategia FALLBACK',
        );
        return { status: 'UNAVAILABLE', reason };
      }

      const identity = renderIdentityOf(
        this.config,
        fallbackTemplate,
        request.language,
      );
      const ready = await this.assets.findReadyFallback(
        this.em,
        code,
        identity,
        tenantId,
      );
      if (!ready?.storageUri) {
        this.logger.warn(
          {
            event: 'audio.fallback.not_ready',
            correlationId,
            templateCode: code,
            code: reason,
          },
          'No hay fallback pre-generado para esta identidad de voz',
        );
        return { status: 'UNAVAILABLE', reason };
      }
      return {
        status: 'FALLBACK',
        assetId: ready.id,
        storageUri: ready.storageUri,
        reason,
      };
    } catch (error) {
      this.logger.error(
        {
          event: 'audio.fallback.failed',
          correlationId,
          templateCode: code,
          err: error,
        },
        'Fallo al resolver la degradación de audio',
      );
      return { status: 'UNAVAILABLE', reason };
    }
  }

  /**
   * Tenant dueño del asset, o `undefined` si se comparte.
   *
   * @throws AudioDomainError si la plantilla es dinámica y no hay tenant en el
   *         contexto. Compartir el audio de un nombre propio entre tenants sería
   *         una filtración silenciosa, así que se prefiere fallar de forma visible
   *         a cachearlo en el ámbito equivocado.
   */
  private resolveOwnerTenant(
    template: AudioTemplateRecord,
  ): string | undefined {
    if (!shouldScopeByTenant(template)) return undefined;
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new AudioDomainError(
        `La plantilla ${template.code} es DYNAMIC y requiere un tenant en contexto: ` +
          'su audio no puede cachearse en el ámbito compartido.',
        AUDIO_ERROR.tenantRequired,
      );
    }
    return tenantId;
  }

  private async requireTemplate(code: string): Promise<AudioTemplateRecord> {
    const template = await this.assets.findTemplate(this.em, code);
    if (!template?.isActive) throw new AudioTemplateNotFoundError(code);
    return template;
  }
}
