import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { SiteLicensesService, type SiteLicenseView } from '../services';
import { UpdateSiteLicenseDto } from '../dto';
import { CorrelationId, IfMatch } from '../http/request-decorators';

/** Habilitaciones por id (`/site-licenses/:id`). No hay `DELETE`: se cambia el estado. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('site-licenses')
export class SiteLicensesController {
  /**
   * @param licenses - Casos de uso de habilitaciones.
   */
  constructor(private readonly licenses: SiteLicensesService) {}

  /** Edita una habilitación. */
  @Audited({
    action: 'SITE_LICENSE_UPDATED',
    entity: 'facility_license',
    entityId: 'param:id',
  })
  @Patch(':id')
  @ApiHeader({ name: 'If-Match', required: true })
  @ApiOperation({ summary: 'Editar una habilitación (If-Match)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteLicenseDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SiteLicenseView> {
    return this.licenses.update(id, dto, expectedVersion, actor, correlationId);
  }
}
