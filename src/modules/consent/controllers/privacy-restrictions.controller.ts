import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PrivacyRestrictionsService } from '../services';
import { CreatePrivacyRestrictionDto, PrivacyRestrictionResponseDto } from '../dto';

/** Endpoints sobre `/consent/privacy-restrictions`. */
@ApiTags('consent-privacy-restrictions')
@ApiBearerAuth()
@Controller('consent/privacy-restrictions')
export class PrivacyRestrictionsController {
  constructor(private readonly restrictionsService: PrivacyRestrictionsService) {}

  /** UC-07-07. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Aplicar restricción de privacidad que afecta RLS clínico' })
  apply(
    @Body() dto: CreatePrivacyRestrictionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrivacyRestrictionResponseDto> {
    return this.restrictionsService.apply(dto, actor);
  }
}
