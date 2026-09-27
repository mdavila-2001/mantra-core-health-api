import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import { FormsReadService } from '../services';
import {
  FormInstanceDetailResponseDto,
  MyFormInstanceListResponseDto,
} from '../dto';

/**
 * Autoservicio del paciente sobre `/forms/me/instances` (Fase 3 del carril de
 * consulta de formularios).
 *
 * **Sin `@Roles` a propósito**, igual que `surveys/me`: el filtro real no es un
 * rol —todas las cuentas de paciente comparten el mismo— sino tener perfil de
 * paciente, y el servidor lo toma del claim de la sesión. El identificador del
 * paciente **no se acepta por parámetro** en ninguna de estas rutas: si se
 * aceptara, cualquiera podría pedir los formularios de otro.
 *
 * La propiedad se demuestra en el servicio con el mismo ancla que las lecturas
 * clínicas: la instancia referencia un encuentro, y el encuentro debe ser del
 * paciente de la sesión y del tenant activo. Todo lo demás —inexistente, de
 * otro paciente, de otro tenant, sin ancla— responde el mismo 404.
 */
@ApiTags('forms-me')
@ApiBearerAuth()
@Controller('forms/me/instances')
export class FormsMeController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Lecturas de instancias y valores.
   */
  constructor(private readonly readService: FormsReadService) {}

  /** Los formularios respondidos del paciente de la sesión. */
  @Get()
  @ApiOperation({ summary: 'Ver mis formularios clínicos' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    enum: ['values'],
    description:
      'Con `values` cada instancia trae sus valores vigentes (lectura en lote, TX-27)',
  })
  listMyInstances(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
    @Query('include') include?: string,
  ): Promise<MyFormInstanceListResponseDto> {
    if (include !== undefined && include !== 'values') {
      throw new BadRequestException('include admite sólo: values');
    }
    return this.readService.listMyInstances(
      actor,
      limit ?? 50,
      include === 'values',
    );
  }

  /** Un formulario propio, con sus valores vigentes. */
  @Get(':id')
  @ApiOperation({ summary: 'Leer un formulario propio con sus respuestas' })
  getMyInstance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FormInstanceDetailResponseDto> {
    return this.readService.getMyInstance(id, actor);
  }
}
