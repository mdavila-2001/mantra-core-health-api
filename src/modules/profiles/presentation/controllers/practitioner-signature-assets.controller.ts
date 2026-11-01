import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  type AuthenticatedUser,
  Roles,
} from '../../../../common';
import { PractitionerSignatureAssetsService } from '../../application/services/practitioner-signature-assets.service';
import {
  PractitionerSignatureAssetsDto,
  SetPractitionerSignatureAssetsDto,
} from '../dto/practitioner-signature-assets.dto';

/**
 * Las imágenes de firma y sello del propio profesional. `@Roles()` vacío
 * (O3-3): el perfil sale de la sesión (`requireOwnPractitionerProfileId`), así
 * que nadie lee ni cambia las de otro.
 */
@ApiTags('profiles-practitioners')
@ApiBearerAuth()
@Controller('profiles/practitioners/me/signature-assets')
export class PractitionerSignatureAssetsController {
  constructor(private readonly assets: PractitionerSignatureAssetsService) {}

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Consultar las imágenes de firma y sello propias' })
  @ApiOkResponse({ type: PractitionerSignatureAssetsDto })
  getOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSignatureAssetsDto> {
    return this.assets.getOwn(actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIGNATURE_ASSETS_SET',
    entity: 'file',
    entityId: 'result.id',
  })
  @Put()
  @Roles()
  @ApiOperation({
    summary: 'Guardar o quitar las imágenes de firma y sello propias',
  })
  @ApiOkResponse({ type: PractitionerSignatureAssetsDto })
  setOwn(
    @Body() dto: SetPractitionerSignatureAssetsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSignatureAssetsDto> {
    return this.assets.setOwn(dto, actor);
  }
}
