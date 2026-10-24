import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, TenantAgnostic } from '../../../../common';
import {
  IamOnboardingDraftsService,
  type OnboardingDraftPayload,
} from '../../application/services/iam-onboarding-drafts.service';

@ApiTags('iam-onboarding-drafts')
@Controller('iam/onboarding-drafts')
export class IamOnboardingDraftsController {
  constructor(private readonly service: IamOnboardingDraftsService) {}

  @Get(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @ApiOperation({
    summary: 'Recupera un borrador de alta guardado por identificador y tipo de formulario',
  })
  getDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
  ): OnboardingDraftPayload | null {
    return this.service.getDraft(formType, draftId);
  }

  @Put(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guarda o actualiza el avance del formulario de alta en borrador',
  })
  saveDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
    @Body() payload: OnboardingDraftPayload,
  ): { ok: boolean; savedAt: string } {
    return this.service.saveDraft(formType, draftId, payload);
  }

  @Delete(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Elimina el borrador al completar el alta exitosamente o por descarte del usuario',
  })
  deleteDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
  ): { ok: boolean } {
    return this.service.deleteDraft(formType, draftId);
  }
}
