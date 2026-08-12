import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AUDIO_TTS_CONFIG } from '../domain/audio.tokens';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type { ResolveAudioResult } from '../domain/audio.types';
import {
  AudioAssetResolver,
  AudioPlaybackService,
  AudioReconcileService,
} from '../services';
import { AudioQuotaRepository } from '../repositories';
import { EntityManager } from '@mikro-orm/postgresql';
import { monthKeyOf } from '../application/audio-budget.policy';
import {
  AudioAssetResponseDto,
  AudioBudgetResponseDto,
  PrewarmAudioDto,
  ResolveAudioDto,
  ResolveAudioResponseDto,
} from '../dto';

/**
 * Superficie de negocio del audio sintetizado.
 *
 * Las tres rutas tienen públicos distintos y por eso sus roles no coinciden:
 * `resolve` y la consulta de un asset las usa el propio usuario en su flujo, y
 * `prewarm`/`budget` son operaciones de gasto y de contabilidad que solo debe
 * ejercer quien administra la plataforma.
 */
@ApiTags('audio-tts')
@ApiBearerAuth()
@Controller('audio-tts')
export class AudioTtsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param config - Configuración del dominio de audio ya validada.
   * @param em - Contexto de persistencia activo.
   * @param resolver - Resolutor de audio.
   * @param playback - Firma de URLs de reproducción.
   * @param quota - Contabilidad de presupuesto.
   * @param reconcile - Barrido; aquí solo se usa su recuento por estado.
   */
  constructor(
    @Inject(AUDIO_TTS_CONFIG) private readonly config: AudioTtsConfig,
    private readonly em: EntityManager,
    private readonly resolver: AudioAssetResolver,
    private readonly playback: AudioPlaybackService,
    private readonly quota: AudioQuotaRepository,
    private readonly reconcile: AudioReconcileService,
  ) {}

  /**
   * Resuelve el audio de una plantilla.
   *
   * Devuelve 200 en los cuatro estados, incluido `UNAVAILABLE`: la falta de audio
   * no es un fallo de la petición, y responder 4xx/5xx obligaría a cada cliente a
   * tratar como error una degradación prevista.
   */
  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolver el audio de una plantilla',
    description:
      'Un acierto de caché no consume cuota. Estados: READY, QUEUED, FALLBACK, UNAVAILABLE — ninguno es un error.',
  })
  async resolve(
    @Body() dto: ResolveAudioDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResolveAudioResponseDto> {
    const result = await this.resolver.resolve({
      templateCode: dto.templateCode,
      variables: dto.variables,
      language: dto.language,
      correlationId: dto.correlationId,
      // El cupo se imputa al sujeto del token, no a lo que declare el cuerpo.
      actorId: actor.id,
    });
    return this.present(result);
  }

  /** Estado de un asset ya conocido, para el cliente que recibió `QUEUED`. */
  @Get('assets/:assetId')
  @ApiOperation({
    summary: 'Consultar un asset de audio',
    description:
      'Pensado para volver tras un QUEUED. La URL de reproducción se firma en el momento y caduca.',
  })
  async findAsset(
    @Param('assetId', ParseUUIDPipe) assetId: string,
  ): Promise<AudioAssetResponseDto> {
    const asset = await this.resolver.findAsset(assetId);
    return {
      assetId: asset.assetId,
      status: asset.status,
      templateCode: asset.templateCode,
      playbackUrl: await this.playback.playbackUrl(asset.storageUri),
      lastErrorCode: asset.lastErrorCode,
    };
  }

  /**
   * Pre-genera una plantilla sin variables.
   *
   * Es la operación que hay que ejecutar **antes** de abrir tráfico: sin fallbacks
   * `READY`, toda degradación acaba en `UNAVAILABLE` y el flujo se queda sin audio
   * incluso cuando el sistema funciona.
   */
  @Post('prewarm')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pre-generar una plantilla sin variables',
    description:
      'Gasta cuota del proveedor. Solo admite plantillas sin variables y conserva las puertas de licencia y presupuesto.',
  })
  async prewarm(
    @Body() dto: PrewarmAudioDto,
  ): Promise<ResolveAudioResponseDto> {
    return this.present(await this.resolver.prewarm(dto.templateCode));
  }

  /** Estado del presupuesto y de la cola: lo que se mira antes de un despliegue. */
  @Get('budget')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @ApiOperation({
    summary: 'Consultar presupuesto del mes y estado de la cola',
  })
  async budget(): Promise<AudioBudgetResponseDto> {
    const monthKey = monthKeyOf(new Date());
    const window = { provider: this.config.provider, monthKey };
    const snapshot = await this.quota.readBudget(this.em, window);
    // El detalle por asset se lee aparte del contador agregado a propósito: es la
    // comprobación que delata una liquidación aplicada sin su registro de consumo.
    const usage = await this.quota.monthlyUsage(this.em, window);
    return {
      provider: this.config.provider,
      monthKey,
      usableUnits: Math.max(
        0,
        this.config.monthlyBudgetUnits - this.config.safetyReserveUnits,
      ),
      reservedUnits: snapshot.reservedUnits,
      settledUnits: snapshot.settledUnits,
      recordedUnits: usage.units,
      recordedGenerations: usage.records,
      assetsByStatus: await this.reconcile.statusCounts(),
    };
  }

  /**
   * Traduce el resultado del dominio al contrato HTTP.
   *
   * La URL firmada se emite aquí y no en el resolutor porque es efímera: lo que se
   * persiste es `storageUri`, y firmar dentro del dominio acabaría metiendo URLs
   * con expiración en cachés y en filas.
   */
  private async present(
    result: ResolveAudioResult,
  ): Promise<ResolveAudioResponseDto> {
    const storageUri = 'storageUri' in result ? result.storageUri : undefined;
    return {
      status: result.status,
      assetId: 'assetId' in result ? result.assetId : undefined,
      storageUri,
      playbackUrl: await this.playback.playbackUrl(storageUri),
      cacheHit: 'cacheHit' in result ? result.cacheHit : undefined,
      reason: 'reason' in result ? result.reason : undefined,
    };
  }
}
