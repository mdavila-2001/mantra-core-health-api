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
import { CommunityGroupsService } from '../services';
import {
  CreateGroupDto,
  JoinGroupDto,
  IdResponseDto,
  GroupMembershipResponseDto,
} from '../dto';

/** Endpoints de grupos/comunidades. */
@ApiTags('community-groups')
@ApiBearerAuth()
@Controller('community/groups')
export class CommunityGroupsController {
  constructor(private readonly service: CommunityGroupsService) {}

  /** Bootstrap: crea un grupo. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un grupo/comunidad' })
  createGroup(
    @Body() dto: CreateGroupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.createGroup(dto, actor);
  }

  /** UC-19-13. */
  @Post(':groupId/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Unirse a un grupo / comunidad' })
  joinGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: JoinGroupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GroupMembershipResponseDto> {
    return this.service.joinGroup(groupId, dto, actor);
  }
}
