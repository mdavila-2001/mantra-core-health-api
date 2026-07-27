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
import { AppealsService } from '../services';
import { CreateAppealDecisionDto, CreatedResourceDto } from '../dto';

/**
 * Decisiones de apelación sobre disputas (UC-26-12). Capa fina que delega en
 * `AppealsService`.
 */
@ApiTags('insurance-appeals')
@ApiBearerAuth()
@Controller('claim-disputes')
export class AppealsController {
  constructor(private readonly service: AppealsService) {}

  /** UC-26-12. */
  @Post(':id/appeal-decisions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir decisión de apelación (inmutable)' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAppealDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.decide(id, dto, actor);
  }
}
