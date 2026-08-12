import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AudioGenerationService, AudioReconcileService } from '../services';
import {
  AudioAssetOutcomeResponseDto,
  AudioReconcileResponseDto,
  ClaimAudioJobsDto,
  ClaimAudioJobsResponseDto,
  CompleteAudioAssetDto,
  FailAudioAssetDto,
} from '../dto';

/**
 * Superficie interna del audio: la opera el worker, no los clientes.
 *
 * Va en un controlador aparte —con prefijo `/internal` y rol `SYSTEM`— por la
 * misma razón que `MessagingInternalController`: su público y su contrato son
 * distintos. Mezclarla con las rutas de negocio invitaría a llamarla desde fuera,
 * y son operaciones que asumen un proceso con lease, reintentos y ciclo de vida
 * propios.
 *
 * Aquí está la frontera que mantiene la arquitectura de este backend intacta: el
 * worker de audio **no** abre conexiones a PostgreSQL. Reclama trabajo, sintetiza
 * y reporta por HTTP autenticado, de modo que sigue pasando por `JwtAuthGuard`,
 * `RolesGuard`, el contexto de tenant y la `ValidationPipe` como cualquier otro
 * cliente. El reparto de secretos cae solo: la clave de cifrado del texto vive en
 * la API y la credencial del proveedor en el worker.
 */
@ApiTags('audio-tts-internal')
@ApiBearerAuth()
@Controller('internal/audio-tts')
export class AudioTtsInternalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param generation - Ciclo de vida de la generación.
   * @param reconcile - Barrido de agotados y retención.
   */
  constructor(
    private readonly generation: AudioGenerationService,
    private readonly reconcile: AudioReconcileService,
  ) {}

  /**
   * Reclama un lote de trabajos con lease.
   *
   * Idempotente por construcción, no por clave: el `UPDATE … FOR UPDATE SKIP
   * LOCKED` hace que dos llamadas simultáneas nunca reciban el mismo asset, así
   * que reintentar esta llamada no puede duplicar una generación.
   */
  @Post('jobs/claim')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reclamar un lote de trabajos de generación',
    description:
      'Toma el lease, incrementa el intento y devuelve el texto ya descifrado. Revalida el presupuesto antes de entregar cada trabajo.',
  })
  claim(@Body() dto: ClaimAudioJobsDto): Promise<ClaimAudioJobsResponseDto> {
    return this.generation.claim(dto.workerId, dto.limit);
  }

  /** Registra el audio generado, liquida la reserva e imputa el consumo. */
  @Post('assets/:assetId/complete')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reportar una generación correcta',
    description:
      'Idempotente: un segundo reporte del mismo asset responde applied=false y no vuelve a imputar consumo.',
  })
  async complete(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: CompleteAudioAssetDto,
  ): Promise<AudioAssetOutcomeResponseDto> {
    const { applied } = await this.generation.complete(assetId, dto);
    return { assetId, status: 'READY', applied };
  }

  /** Registra un fallo; programa el reintento o cierra y devuelve la reserva. */
  @Post('assets/:assetId/fail')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reportar una generación fallida',
    description:
      'Un fallo transitorio programa el siguiente intento; uno permanente cierra el asset y devuelve su reserva de presupuesto.',
  })
  async fail(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: FailAudioAssetDto,
  ): Promise<AudioAssetOutcomeResponseDto> {
    const { status } = await this.generation.fail(assetId, dto);
    return { assetId, status, applied: true };
  }

  /**
   * Barrido: cierra agotados, aplica retención y publica los encallados.
   *
   * Es la operación que evita que las reservas de los assets que murieron con su
   * worker queden apartadas del presupuesto para siempre.
   */
  @Post('reconcile')
  @Roles('SYSTEM', 'AUDIO_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Barrido de assets agotados y retención del cupo por actor',
  })
  reconcileOnce(): Promise<AudioReconcileResponseDto> {
    return this.reconcile.runOnce();
  }
}
