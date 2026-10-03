import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { PractitionerSignatureAssetsService } from '../services/practitioner-signature-assets.service';
import {
  PractitionerSignatureAssetsDto,
  SetPractitionerSignatureAssetsDto,
} from '../dto/practitioner-signature-assets.dto';

@ApiTags('profiles-practitioners')
@ApiBearerAuth()
@Controller('profiles/practitioners/me/signature-assets')
export class PractitionerSignatureAssetsController {
  constructor(private readonly assets: PractitionerSignatureAssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar las imágenes de firma y sello propias' })
  @ApiOkResponse({ type: PractitionerSignatureAssetsDto })
  getOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerSignatureAssetsDto> {
    return this.assets.getOwn(actor);
  }

  @Put()
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
