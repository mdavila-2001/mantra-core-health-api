import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  PractitionerSitesService,
  PracticeWorkforceService,
} from '../services';
import {
  CreateOwnSiteDto,
  PractitionerSiteDto,
  PractitionerSitesResponseDto,
  MyRoleAssignmentResponseDto,
} from '../dto';

/**
 * Dónde atiende un profesional (`/practitioners/:profileId/sites`).
 *
 * ## Por qué cuelga de `/practitioners` y no de `/practices`
 *
 * La pregunta que responde es «¿dónde atiende este médico?», no «¿qué sedes
 * tiene esta organización?». Colgarla de la práctica obligaría a saber primero
 * en qué práctica trabaja, que es justo lo que se está preguntando.
 *
 * ## Los roles son los de quien pregunta, no los de quien administra
 *
 * `GET /practices/:id/sites` es una lectura administrativa y sus roles lo
 * reflejan. Ésta la consultan la agenda y el portal: si `PATIENT` no puede
 * leerla, un paciente ve la hora de su turno y no la dirección, que es
 * exactamente el hueco que este endpoint viene a tapar.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('practitioners')
export class PractitionerSitesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param sitesService - Resolución de sedes de un profesional.
   */
  constructor(
    private readonly sitesService: PractitionerSitesService,
    private readonly workforceService: PracticeWorkforceService,
  ) {}

  /**
   * Carril 18 — «mis organizaciones»: todas las vinculaciones del profesional
   * autenticado (cualquier estado, cualquier organización). Cuelga de `me` y
   * no de un `:profileId` porque es autoservicio: cada profesional ve las
   * suyas, no las de otro.
   */
  @Get('me/role-assignments')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Mis vinculaciones con organizaciones',
    description:
      'Incluye pendientes, activas, suspendidas, rechazadas y finalizadas. No implica acceso a pacientes de esas organizaciones.',
  })
  listMyAssignments(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyRoleAssignmentResponseDto[]> {
    return this.workforceService.listMyAssignments(actor);
  }

  /** UC-14-15. */
  @Get(':profileId/sites')
  @Roles(
    'SECURITY_ADMIN',
    'SCHEDULING_ADMIN',
    'SCHEDULING_AGENT',
    'PRACTITIONER',
    'CLINICIAN',
    'PATIENT',
  )
  @ApiOperation({
    summary: 'Consultorios donde atiende el profesional',
    description:
      'Sale de sus asignaciones de rol vigentes con sede. Una lista vacía significa que no tiene ninguna, no que el profesional no exista.',
  })
  async listSites(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PractitionerSitesResponseDto> {
    const items = await this.sitesService.listSitesOfPractitioner(
      profileId,
      requireTenantId(),
    );
    return { items, count: items.length };
  }

  /**
   * ALV-005/006 — autoservicio: el profesional da de alta su propio
   * consultorio, sin depender de que una organización lo afilie primero.
   */
  @Post('me/sites')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un consultorio propio',
    description:
      'Crea (o reutiliza) la práctica personal del profesional, la sede y la vinculación que la conecta con su agenda.',
  })
  createOwnSite(
    @Body() dto: CreateOwnSiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSiteDto> {
    return this.sitesService.createOwnSite(actor, dto);
  }

  /**
   * ALV-005 — retira un consultorio propio (no lo borra: cierra la
   * vinculación vigente con esa sede).
   */
  @Delete('me/sites/:siteId')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirar un consultorio propio' })
  deleteOwnSite(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.sitesService.deleteOwnSite(actor, siteId);
  }
}
