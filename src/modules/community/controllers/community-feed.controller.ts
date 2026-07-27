import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CommunityFeedService } from '../services';
import { RebuildFeedDto, FeedRebuildResponseDto } from '../dto';

/**
 * Endpoint interno del worker de feed (UC-19-15). No expuesto al usuario final:
 * exige rol de servicio (SECURITY_ADMIN) y ejecuta el fan-out de un post.
 */
@ApiTags('community-feed')
@ApiBearerAuth()
@Controller('internal/community/feed')
export class CommunityFeedController {
  constructor(private readonly service: CommunityFeedService) {}

  /** UC-19-15. */
  @Post('rebuild')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar feed (fan-out y ranking)' })
  rebuild(
    @Body() dto: RebuildFeedDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FeedRebuildResponseDto> {
    return this.service.rebuild(dto, actor);
  }
}
