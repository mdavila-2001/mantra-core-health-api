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
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { PriorAuthService } from '../services';
import {
  CreatePriorAuthRequestDto,
  CreateDeterminationDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

/**
 * Autorización previa (UC-26-04, UC-26-05). Capa fina que delega en
 * `PriorAuthService`.
 */
@ApiTags('insurance-prior-auth')
@ApiBearerAuth()
@Controller()
export class PriorAuthController {
  constructor(private readonly service: PriorAuthService) {}

  /** UC-26-04. */
  @Post('prior-authorization-requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar autorización previa con items' })
  submit(
    @Body() dto: CreatePriorAuthRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.submitRequest(dto, actor);
  }

  /** UC-26-05. */
  @Post('prior-authorization-requests/:id/determinations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir determinación de autorización previa' })
  determine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeterminationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.issueDetermination(id, dto, actor);
  }
}
