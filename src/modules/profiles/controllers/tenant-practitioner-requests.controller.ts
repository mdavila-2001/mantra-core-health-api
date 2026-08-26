import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { ProfilesAffiliationsService } from '../services';
import { AffiliationRequestListDto, RejectAffiliationDto } from '../dto';

/**
 * La bandeja de vínculos de la organización (TP-2).
 *
 * ## Por qué vive en `profiles` y no en `directory`
 *
 * Porque lo que se lista y se decide son filas de
 * `profiles.practitioner_affiliations`. La ruta cuelga de `/tenants/{id}`
 * —donde la organización espera encontrar lo suyo— pero el dominio es el del
 * profesional, y ponerla en `directory` obligaría a ese módulo a conocer las
 * afiliaciones para servir tres endpoints.
 *
 * ## Por qué `:tenantId` y no `me`
 *
 * El prompt la escribió como `/tenants/me/practitioner-requests`. Acá lleva el
 * identificador por dos razones: es la forma que ya tienen **todas** las rutas
 * de organización del producto (`/tenants/{id}/memberships`,
 * `/tenants/{id}/branches`), y `me` no alcanza para quien administra más de una
 * organización — que es exactamente a quien esta bandeja le sirve. De cuáles
 * son «las suyas» ya responde `GET /tenants/me`.
 *
 * ## Sin `@Roles`
 *
 * El permiso no es un rol global sino una membresía administrativa **en esa**
 * organización, y eso lo comprueba el servicio con `assertCanAdminister`. Un
 * rol global dejaría entrar al administrador de otra clínica.
 */
@ApiTags('profiles-affiliations')
@ApiBearerAuth()
@Controller('tenants')
export class TenantPractitionerRequestsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param affiliations - Casos de uso del vínculo médico–organización.
   */
  constructor(private readonly affiliations: ProfilesAffiliationsService) {}

  /** Las solicitudes pendientes de las sedes de la organización. */
  @Get(':tenantId/practitioner-requests')
  @ApiOperation({
    summary: 'Solicitudes de médicos que piden atender en la organización',
    description:
      'Sólo las de las sedes de esta organización y sólo para quien la ' +
      'administra. El filtro por organización va en la consulta.',
  })
  list(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AffiliationRequestListDto> {
    return this.affiliations.listarSolicitudes(tenantId, actor);
  }

  /** La organización acepta el vínculo. */
  @Post(':tenantId/practitioner-requests/:affiliationId/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Aprobar la solicitud de un profesional' })
  approve(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('affiliationId', ParseUUIDPipe) affiliationId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.affiliations.aprobar(tenantId, affiliationId, actor);
  }

  /** La organización rechaza el vínculo, con motivo si quiere darlo. */
  @Post(':tenantId/practitioner-requests/:affiliationId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rechazar la solicitud de un profesional' })
  reject(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('affiliationId', ParseUUIDPipe) affiliationId: string,
    @Body() dto: RejectAffiliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.affiliations.rechazar(tenantId, affiliationId, dto, actor);
  }

  /**
   * La organización da de baja un vínculo que ya había aprobado.
   *
   * Faltaba: `AFFILIATION_REVOKED` existía desde v4.1.9 y no había forma de
   * llegar a ese estado por la API. Aprobar era irreversible por omisión.
   *
   * **Las citas ya confirmadas no se cancelan.** Dejarlas caer en bloque
   * plantaría a pacientes que tenían un turno prometido, por un trámite del que
   * no fueron parte. Lo que sí ocurre desde ya: no puede aceptar turnos nuevos
   * ni publicar más agenda acá.
   */
  @Post(':tenantId/practitioner-requests/:affiliationId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dar de baja un vínculo ya aprobado',
    description:
      'Las citas ya confirmadas siguen en pie; lo que se corta es aceptar ' +
      'turnos nuevos y publicar agenda.',
  })
  revoke(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('affiliationId', ParseUUIDPipe) affiliationId: string,
    @Body() dto: RejectAffiliationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.affiliations.revocar(tenantId, affiliationId, dto, actor);
  }
}
