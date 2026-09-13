import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticsPatientResultsService } from '../services';
import type {
  DiagnosticResultShareDto,
  DiagnosticResultSharesResponseDto,
  PatientDiagnosticResultDto,
  PatientDiagnosticResultsResponseDto,
} from '../dto';
import { PatientOwnOrdersResponseDto, ShareDiagnosticResultDto } from '../dto';

/**
 * Los resultados diagnósticos del titular de la sesión.
 *
 * ## Por qué cuelga de `/diagnostic-results` y no de `/diagnostics`
 *
 * Porque `diagnostics` **es una ruta de la aplicación** —la cola clínica del
 * laboratorio— y el proxy del frontend compara por prefijo de primer segmento:
 * declarar `/diagnostics` como prefijo de API se comería esa pantalla entera, y
 * declarar `/diagnostics/me` no lo toma (el proxy sólo empareja el primer
 * segmento). Es la misma razón por la que M13 vive en
 * `administration/geolocation` y no en `geolocation`, y por la que este módulo
 * ya expone `/diagnostic-units` como prefijo propio.
 *
 * ## No hay identificador de paciente en la ruta
 *
 * Cuelga de `me` y no de `patients/:id` a propósito. Si lo hubiera, el endpoint tendría que decidir si el
 * de la ruta es el de quien pregunta, y esa comparación es exactamente el tipo
 * de control que se olvida un día. Sin parámetro no hay nada que comparar: la
 * persona sale del vínculo cuenta↔persona y sólo puede ser una.
 *
 * `@Roles('PATIENT')` acota quién entra; el aislamiento entre personas lo
 * resuelve el servicio, que es donde vive el vínculo.
 */
@ApiTags('diagnostics-patient-results')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('diagnostic-results')
export class DiagnosticsPatientResultsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param results - Servicio de resultados del paciente.
   */
  constructor(private readonly results: DiagnosticsPatientResultsService) {}

  /**
   * Los resultados liberados del titular.
   *
   * @param actor - Usuario autenticado.
   * @param limit - Tope de informes considerados (por defecto 50).
   * @returns Los resultados que la persona puede ver.
   */
  @Get('me')
  @ApiOperation({
    summary: 'Resultados de laboratorio, informes e imagen del titular',
    description:
      'Sólo versiones liberadas con visibilidad de paciente. Un informe ' +
      'redactado y no liberado no aparece.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de informes considerados (por defecto 50)',
  })
  listOwnResults(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientDiagnosticResultsResponseDto> {
    return this.results.listOwnResults(actor, limit ?? 50);
  }

  /**
   * Las órdenes diagnósticas del titular.
   *
   * ## Va antes de `me/:reportId` a propósito
   *
   * Nest resuelve por orden de declaración. Debajo de la ruta con parámetro,
   * `orders` entraría como `:reportId` y moriría en el `ParseUUIDPipe` con un
   * 400 que además parece un error del cliente. No es estilo: moverla rompe el
   * endpoint.
   *
   * @param actor - Usuario autenticado.
   * @param limit - Tope de órdenes (por defecto 50).
   * @returns Las órdenes de la persona, con preparación y resultado.
   */
  @Get('me/orders')
  @ApiOperation({
    summary: 'Órdenes de laboratorio e imagen del titular',
    description:
      'El pedido del médico visto por quien tiene que cumplirlo: qué le ' +
      'pidieron, cómo prepararse y si ya hay resultado para abrir.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de órdenes (por defecto 50)',
  })
  @ApiOkResponse({ type: PatientOwnOrdersResponseDto })
  listOwnOrders(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<PatientOwnOrdersResponseDto> {
    return this.results.listOwnOrders(actor, limit ?? 50);
  }

  /**
   * Un resultado concreto del titular.
   *
   * @param actor - Usuario autenticado.
   * @param reportId - Informe pedido.
   * @returns El resultado, con sus archivos descargables.
   */
  @Get('me/:reportId')
  @ApiOperation({
    summary: 'Un resultado del titular, con sus archivos',
    description:
      'Cada `fileId` se descarga por `GET /common/files/{id}/content`.',
  })
  getOwnResult(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<PatientDiagnosticResultDto> {
    return this.results.getOwnResult(actor, reportId);
  }

  /**
   * Comparte un resultado con un profesional, hasta una fecha.
   *
   * @param actor - Usuario autenticado (quien comparte).
   * @param reportId - Informe que se comparte.
   * @param dto - Con quién y hasta cuándo.
   * @returns El compartido creado.
   */
  @Post('me/:reportId/shares')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Compartir temporalmente un resultado con un profesional',
    description:
      'El acceso vence en `validUntil`; no hay forma de compartir sin plazo.',
  })
  shareOwnResult(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: ShareDiagnosticResultDto,
  ): Promise<DiagnosticResultShareDto> {
    return this.results.shareOwnResult(actor, reportId, dto);
  }

  /**
   * Con quién está compartido un resultado.
   *
   * @param actor - Usuario autenticado.
   * @param reportId - Informe consultado.
   * @returns Los compartidos, vigentes y vencidos.
   */
  @Get('me/:reportId/shares')
  @ApiOperation({ summary: 'Con quién está compartido un resultado' })
  listOwnResultShares(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<DiagnosticResultSharesResponseDto> {
    return this.results.listOwnResultShares(actor, reportId);
  }

  /**
   * Deja de compartir un resultado.
   *
   * Es `POST .../revoke` y no `DELETE` porque no se borra nada: se cierra la
   * vigencia, y quién tuvo acceso a un resultado clínico sigue siendo
   * responsable de poder responderse después.
   *
   * @param actor - Usuario autenticado.
   * @param reportId - Informe compartido.
   * @param shareId - Compartido a cerrar.
   * @returns El compartido, ya cerrado.
   */
  @Post('me/:reportId/shares/:shareId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dejar de compartir un resultado' })
  revokeOwnResultShare(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ): Promise<DiagnosticResultShareDto> {
    return this.results.revokeOwnResultShare(actor, reportId, shareId);
  }
}
