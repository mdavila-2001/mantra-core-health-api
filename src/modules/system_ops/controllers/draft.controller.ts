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
import { DraftService } from '../services';
import { CreateDraftDto, DraftResponseDto, PublishDraftDto } from '../dto';

/** Endpoints de draft records genéricos (UC-11-15). */
@ApiTags('system-ops-drafts')
@ApiBearerAuth()
@Controller('admin/governance')
export class DraftController {
  constructor(private readonly service: DraftService) {}

  /** UC-11-15. */
  @Post('drafts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guardar un draft record genérico' })
  createDraft(
    @Body() dto: CreateDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DraftResponseDto> {
    return this.service.createDraft(dto, actor);
  }

  /** UC-11-15. */
  @Post('drafts/:id/publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar un draft record y materializarlo' })
  publishDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishDraftDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DraftResponseDto> {
    return this.service.publishDraft(id, dto, actor);
  }
}
