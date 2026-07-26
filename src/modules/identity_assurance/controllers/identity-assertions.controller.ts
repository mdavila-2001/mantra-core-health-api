import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { IdentityAssertionsService } from '../services';
import { RevokeAssertionDto, AssertionRevokedResponseDto } from '../dto';

/** Endpoint sobre `/identity/assertions`: revocación (UC-27-11). */
@ApiTags('identity-assertions')
@ApiBearerAuth()
@Controller('identity/assertions')
export class IdentityAssertionsController {
  constructor(private readonly assertionsService: IdentityAssertionsService) {}

  /** UC-27-11. */
  @Post(':id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una aserción de identidad' })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeAssertionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssertionRevokedResponseDto> {
    return this.assertionsService.revoke(id, dto, actor);
  }
}
