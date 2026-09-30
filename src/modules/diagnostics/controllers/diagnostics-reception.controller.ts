import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { requireTenantId } from '../../../common';
import { LabStaffGuard } from '../guards';
import { DiagnosticsReceptionService } from '../services';
import { LabInboxPageDto, LabInboxQueryDto } from '../dto';

/**
 * Recepción de muestras del laboratorio: la bandeja de órdenes dirigidas al
 * laboratorio del tenant activo. Las acciones del mostrador —recibir la
 * muestra, registrar la acesión— son los endpoints de
 * `DiagnosticsSpecimensController`, con el mismo guard.
 */
@ApiTags('diagnostics-reception')
@ApiBearerAuth()
@UseGuards(LabStaffGuard)
@Controller('diagnostics')
export class DiagnosticsReceptionController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Lectura de la bandeja.
   */
  constructor(private readonly service: DiagnosticsReceptionService) {}

  /**
   * Bandeja de recepción, paginada por cursor.
   *
   * `POST` y no `GET`: la búsqueda por paciente es PHI y no viaja en la URL.
   */
  @Post('service-requests/inbox')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bandeja de órdenes de laboratorio por recibir',
    description:
      'Órdenes vigentes de laboratorio o anatomía patológica derivadas al ' +
      'laboratorio del tenant activo (`performer_tenant_id`) y todavía sin ' +
      'acesión, con las muestras ya recibidas. De la más vieja a la más ' +
      'nueva. Filtros en el cuerpo: la búsqueda por paciente no viaja en la URL.',
  })
  listInbox(@Body() query: LabInboxQueryDto): Promise<LabInboxPageDto> {
    return this.service.listInbox(requireTenantId(), query);
  }
}
