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
import { IdentityManualReviewService } from '../services';
import { ReviewDecisionDto, ReviewDecisionResponseDto } from '../dto';

/** Endpoint sobre `/identity/manual-review`: decisión de revisión (UC-27-09). */
@ApiTags('identity-manual-review')
@ApiBearerAuth()
@Controller('identity/manual-review')
export class IdentityManualReviewController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reviewService - Valor de review service requerido por la operación.
   */
  constructor(private readonly reviewService: IdentityManualReviewService) {}

  /** UC-27-09. */
  @Post(':id/decision')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver una revisión manual (decisión)' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReviewDecisionResponseDto> {
    return this.reviewService.decide(id, dto, actor);
  }
}
