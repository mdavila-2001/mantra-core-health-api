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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import type { FileLinkResponseDto } from '../../common/dto';
import { CareEpisodesService, EncountersService } from '../services';
import {
  AttachFileToEncounterDto,
  CreateCareEpisodeDto,
  CareEpisodeResponseDto,
  CheckInEncounterDto,
  CloseEncounterDto,
  EncounterResponseDto,
} from '../dto';

/**
 * Endpoints de logística de encuentros: episodios de cuidado y ciclo de vida del
 * encuentro (check-in y cierre). Capa fina que delega en los servicios de dominio.
 *
 * SEC-01 lo dejó **entero fuera** de su alcance, y conviene explicar por qué: no
 * es que aquí no haya nada que proteger.
 *
 * Abrir el episodio y hacer el check-in traen `patientProfileId` en el cuerpo,
 * así que técnicamente `ClinicalRecordAccessGuard` podría evaluarlos. Pero la
 * política que ese guard delega —`assertPuedeLeerHistoria`— abre por un turno de
 * HOY en estado habilitante o por una relación asistencial vigente, y estas dos
 * operaciones son parte del **inicio** de la atención: exigirles autorización
 * previa cierra un círculo —«necesito acceso para ejecutar la operación que crea
 * el acceso»—, y el check-in es justamente la transición hacia el estado
 * `CHECKED_IN` que la política mira. Reutilizar una política con semántica
 * equivocada no es «Existing Capability First»: es aplicar la regla de lectura
 * del expediente a un acto que no es de lectura.
 *
 * Queda como residual de seguridad **abierto y propio**
 * (`BOOTSTRAP_ACCESS_RESIDUAL`), no como parte cerrada de SEC-01: estas rutas
 * **no están protegidas** por paciente. Resolverlo pide decidir antes qué acto
 * funda la relación asistencial, y eso no lo define ninguna fuente vigente.
 * `encounters/:id/close` sigue fuera del guard por el otro motivo de siempre:
 * su paciente sale del encuentro ya cargado, y lo autoriza el servicio
 * (MCH-007).
 */
@ApiTags('clinical-encounters')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('clinical')
export class ClinicalEncountersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param episodesService - Valor de episodes service requerido por la operación.
   * @param encountersService - Valor de encounters service requerido por la operación.
   */
  constructor(
    private readonly episodesService: CareEpisodesService,
    private readonly encountersService: EncountersService,
  ) {}

  /** UC-08-01. */
  @Post('care-episodes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir un episodio de cuidado' })
  openEpisode(
    @Body() dto: CreateCareEpisodeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareEpisodeResponseDto> {
    return this.episodesService.open(dto, actor);
  }

  /** UC-08-02. */
  @Post('encounters/check-in')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Check-in de un encuentro con participantes y ubicación',
  })
  checkIn(
    @Body() dto: CheckInEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    return this.encountersService.checkIn(dto, actor);
  }

  /** UC-08-14. */
  @Post('encounters/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar un encuentro en curso (gatilla facturación)',
  })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EncounterResponseDto> {
    return this.encountersService.close(id, dto, actor);
  }

  /**
   * P25 (BR-11): liga un archivo ya subido a este encuentro. Subí el archivo
   * antes con `POST /common/files/upload`. Reemplaza, para el encuentro, al
   * genérico `POST /common/files/:id/links`: acá el paciente sale de la fila y
   * la escritura pasa por la política de la historia (MCH-007).
   */
  @Post('encounters/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un archivo ya subido a un encuentro' })
  attachFileToEncounter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileToEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    return this.encountersService.attachFile(id, dto, actor);
  }
}
