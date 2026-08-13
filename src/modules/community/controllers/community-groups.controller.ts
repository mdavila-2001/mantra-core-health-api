import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  type AuthenticatedUser,
} from '../../../common';
import {
  CommunityGroupsService,
  CommunityGroupsReadService,
} from '../services';
import {
  CreateGroupDto,
  JoinGroupDto,
  IdResponseDto,
  GroupMembershipResponseDto,
  GroupPageDto,
  GroupMemberPageDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Endpoints de grupos/comunidades. */
@ApiTags('community-groups')
@ApiBearerAuth()
@Controller('community/groups')
export class CommunityGroupsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de grupos.
   * @param readService - Lecturas de grupos.
   */
  constructor(
    private readonly service: CommunityGroupsService,
    private readonly readService: CommunityGroupsReadService,
  ) {}

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

  // --- Lecturas (UC-19-12, cara de lectura) ---

  /**
   * Directorio de grupos de una organización.
   *
   * `tenantId` es obligatorio: `groups` lleva `tenant_id`, y un listado sin
   * acotarlo mostraría los grupos de una organización a otra.
   */
  @Get()
  @ApiOperation({ summary: 'Grupos de una organización' })
  listGroups(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<GroupPageDto> {
    return this.readService.listGroups(tenantId, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }

  /** Integrantes de un grupo. */
  @Get(':groupId/members')
  @ApiOperation({ summary: 'Integrantes de un grupo' })
  listMembers(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('actorProfileId') actorProfileId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<GroupMemberPageDto> {
    return this.readService.listMembers(groupId, actorProfileId, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }
}
