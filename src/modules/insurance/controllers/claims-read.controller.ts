import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClaimsReadService } from '../services';
import {
  ClaimDetailDto,
  ClaimListQueryDto,
  ClaimListResponseDto,
} from '../dto';

/**
 * Lectura de las solicitudes de seguro presentadas.
 *
 * **No exige rol de sección, y es deliberado.** Los seis endpoints de
 * escritura del ciclo del reclamo declaran `@Roles('BILLING', 'FINANCE')`, y
 * esos dos códigos **no existen** en el `RoleCode` cerrado que acepta
 * `role-mapping.ts`: `conceptIdsToRoleCodes` descarta lo desconocido, así que
 * hoy ningún JWT los puede llevar y esas escrituras sólo son alcanzables por
 * el comodín `SUPERADMIN`. Repetir aquí ese `@Roles` no protegería nada
 * distinto: dejaría la lectura fuera del alcance de todo su público legítimo
 * por un rol que la plataforma no sabe emitir.
 *
 * Lo que sí protege es el **alcance por pertenencia**, que es la barrera real:
 * la solicitud no tiene `tenant_id` —cuelga de la aseguradora— y toda consulta
 * arranca por las aseguradoras del tenant que fijó `TenantContextInterceptor`,
 * dentro de la propia consulta. Una solicitud de otra organización recibe el
 * **mismo 404, con el mismo cuerpo**, que un uuid inexistente.
 *
 * Cuál de los tres caminos de autorización se adopta —sumar `BILLING`/`FINANCE`
 * al conjunto cerrado, mover estos endpoints a `SECURITY_ADMIN`, o quedarse
 * con el alcance por pertenencia— es la P-16-1 de la ficha y **no se decidió
 * en este carril**: se implementó la barrera que no depende de esa decisión.
 */
@ApiTags('insurance-claims-read')
@ApiBearerAuth()
@Controller()
export class ClaimsReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param claimsRead - Servicio de lectura de solicitudes.
   */
  constructor(private readonly claimsRead: ClaimsReadService) {}

  /**
   * Solicitudes de seguro del tenant activo.
   *
   * @param query - Filtros y paginación por cursor.
   * @returns Página de solicitudes con el cursor de la siguiente.
   */
  @Get('insurance-claims')
  @ApiOperation({
    summary: 'Listar las solicitudes de seguro presentadas (cursor)',
  })
  @ApiOkResponse({ type: ClaimListResponseDto })
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
  @ApiNotFoundResponse({
    description:
      'La solicitud no existe o no pertenece al tenant activo. El cuerpo es ' +
      'el mismo en los dos casos: la existencia no se filtra.',
  })
  getClaim(@Param('id', ParseUUIDPipe) id: string): Promise<ClaimDetailDto> {
    return this.claimsRead.getClaim(id);
  }
}
