import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ClaimsReadService } from '../services';
import {
  ClaimDetailDto,
  ClaimListQueryDto,
  ClaimListResponseDto,
} from '../dto';

/**
 * Lectura de las solicitudes de seguro que **envió** la organización activa.
 *
 * **Es la cara del prestador**, no la del pagador (TAREA-16 · D1.a, decisión de
 * Justin del 2026-09-04): el consultorio o la clínica que le presenta el
 * reclamo a la aseguradora. La primera versión de estas dos rutas acotaba por
 * las aseguradoras del tenant, que es el lado contrario del mismo dato.
 *
 * **Dos barreras, y ninguna sustituye a la otra:**
 *
 * - **Rol** (`@Roles`): `BILLING_OPERATOR` es quien factura y cobra del lado
 *   del prestador, y es el rol que Justin eligió para ver y reclamar (D1.b).
 *   `SECURITY_ADMIN` conserva el acceso administrativo de siempre y
 *   `SUPERADMIN` entra por el comodín del `RolesGuard`. Los `@Roles` de las
 *   escrituras del ciclo —adjudicar, EOB, revertir, apelar— **no** se tocan:
 *   son decisiones de quien paga, y mezclarlas acá volvería a juntar los dos
 *   lados en la misma pantalla.
 * - **Alcance por pertenencia**: la solicitud no tiene `tenant_id`, así que
 *   toda consulta arranca por las prácticas activas de la organización que fijó
 *   `TenantContextInterceptor` y filtra por `billing_provider_entity_id`
 *   **dentro de la consulta**. Una solicitud que envió otra organización recibe
 *   el **mismo 403, con el mismo cuerpo**, que un uuid inexistente (AC-16-14).
 *
 * El 403 de acá es una decisión **de esta tarea**, no una regla nueva de la
 * API: el resto del módulo 26 y los módulos que ocultan existencia con 404
 * (comunidad, encuestas, audio) siguen igual hasta que alguien unifique el
 * patrón en su propio carril.
 */
@ApiTags('insurance-claims-read')
@ApiBearerAuth()
@Roles('BILLING_OPERATOR', 'SECURITY_ADMIN')
@Controller()
export class ClaimsReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param claimsRead - Servicio de lectura de solicitudes.
   */
  constructor(private readonly claimsRead: ClaimsReadService) {}

  /**
   * Solicitudes de seguro que envió la organización activa.
   *
   * @param query - Filtros y paginación por cursor.
   * @returns Página de solicitudes con el cursor de la siguiente.
   */
  @Get('insurance-claims')
  @ApiOperation({
    summary: 'Listar las solicitudes de seguro presentadas (cursor)',
  })
  @ApiOkResponse({ type: ClaimListResponseDto })
  @ApiForbiddenResponse({
    description:
      'La organización activa no tiene prácticas activas: no envió ninguna ' +
      'solicitud y esta pantalla no es suya.',
  })
  listClaims(@Query() query: ClaimListQueryDto): Promise<ClaimListResponseDto> {
    return this.claimsRead.listClaims(query);
  }

  /**
   * Detalle de una solicitud: cabecera, ítems, dictámenes y disputas.
   *
   * @param id - Solicitud consultada.
   * @returns El detalle completo.
   */
  @Get('insurance-claims/:id')
  @ApiOperation({
    summary: 'Consultar una solicitud de seguro con sus ítems y su dictamen',
  })
  @ApiOkResponse({ type: ClaimDetailDto })
  @ApiForbiddenResponse({
    description:
      'La solicitud no existe o la envió otra organización. El cuerpo es el ' +
      'mismo en los dos casos: la existencia no se filtra (AC-16-14).',
  })
  getClaim(@Param('id', ParseUUIDPipe) id: string): Promise<ClaimDetailDto> {
    return this.claimsRead.getClaim(id);
  }
}
