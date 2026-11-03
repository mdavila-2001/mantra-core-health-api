import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessLogged,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ProcedureCentersService } from '../services';
import { ProcedureCentersQueryDto, ProcedureCentersResponseDto } from '../dto';

/**
 * `GET /clinical/me/procedure-centers` — la pestaña «Centros médicos» de la
 * pantalla de la receta (carril 19).
 *
 * El identificador del paciente **no se acepta por parámetro**, igual que en
 * `clinical/me/medical-aspects`: el servidor lo resuelve por el vínculo de la
 * cuenta. Tampoco viajan los procedimientos: lo que le pidieron a una persona
 * es PHI y no va en la URL.
 */
@ApiTags('clinical-me')
@ApiBearerAuth()
@Roles('PATIENT')
@Controller('clinical/me/procedure-centers')
export class ClinicalProcedureCentersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param procedureCenters - Cobertura de los procedimientos del titular.
   */
  constructor(private readonly procedureCenters: ProcedureCentersService) {}

  /** Mis procedimientos pendientes y las sedes que los ofrecen. */
  @Get()
  @AccessLogged({ resourceType: 'SERVICE_REQUESTS', patient: 'actor' })
  @ApiOperation({
    summary: 'Dónde hacerme los procedimientos que me pidieron',
    description:
      'Las órdenes vigentes de procedimiento y cardiología del titular, y las ' +
      'sedes que declaran ofrecerlos: primero las que tienen todos, después ' +
      'la más cercana en línea recta al origen elegido.',
  })
  @ApiOkResponse({ type: ProcedureCentersResponseDto })
  findOwn(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ProcedureCentersQueryDto,
  ): Promise<ProcedureCentersResponseDto> {
    return this.procedureCenters.findForOwnOrders(actor, query);
  }
}
