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
import { AccessRequestsService } from '../services';
import { DecideAccessRequestDto, DecisionResultDto } from '../dto';

/** Decisión sobre solicitudes de acceso delegado (UC-29-05). */
@ApiTags('delegated-access-requests')
@ApiBearerAuth()
@Controller('access-requests')
export class AccessRequestsController {
  constructor(private readonly service: AccessRequestsService) {}

  /** UC-29-05. */
  @Post(':id/decision')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar/Denegar solicitud y emitir grant scoped' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideAccessRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DecisionResultDto> {
    return this.service.decide(id, dto, actor);
  }
}
