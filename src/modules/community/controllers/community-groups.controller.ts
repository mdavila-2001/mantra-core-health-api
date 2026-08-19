import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
  CommunityGroupWallService,
} from '../services';
import { COMM } from '../community.concepts';
import {
  CreateGroupDto,
  CreateGroupPostDto,
  JoinGroupDto,
  IdResponseDto,
  GroupDetailDto,
  GroupMembershipResponseDto,
  GroupMemberUpdatedDto,
  GroupPageDto,
  GroupMemberPageDto,
  GroupWallItemDto,
  GroupWallPageDto,
  UpdateGroupMemberDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Estado de membresía pedido en la consulta → concept id (P7). */
const JOIN_STATUS_BY_CODE: Record<string, string> = {
  ACTIVE: COMM.GROUP_JOIN_ACTIVE,
  PENDING: COMM.GROUP_JOIN_PENDING,
  REJECTED: COMM.GROUP_JOIN_REJECTED,
  LEFT: COMM.GROUP_JOIN_LEFT,
  REMOVED: COMM.GROUP_JOIN_REMOVED,
};

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
   * @param wallService - Muro del grupo (P7).
   */
  constructor(
    private readonly service: CommunityGroupsService,
    private readonly readService: CommunityGroupsReadService,
    private readonly wallService: CommunityGroupWallService,
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

  /** P7: resuelve un alta pendiente y/o cambia el rol de un integrante. */
  @Patch(':groupId/members/:memberId')
  @ApiOperation({ summary: 'Aprobar/rechazar un alta o cambiar el rol' })
  updateMember(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateGroupMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GroupMemberUpdatedDto> {
    return this.service.updateMember(groupId, memberId, dto, actor);
  }

  /**
   * P7: baja de un integrante.
   *
   * Lleva el **perfil** y no el id de membresía porque quien se da de baja a sí
   * mismo conoce su perfil, no el uuid de su fila en `group_members`.
   */
  @Delete(':groupId/members/:memberProfileId')
  @ApiOperation({ summary: 'Salir del grupo o dar de baja a un integrante' })
  leaveGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('memberProfileId', ParseUUIDPipe) memberProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GroupMemberUpdatedDto> {
    return this.service.leaveGroup(groupId, memberProfileId, actor);
  }

  /** P7: publica en el muro del grupo, o responde a una publicación. */
  @Post(':groupId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar en el muro del grupo' })
  createGroupPost(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateGroupPostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GroupWallItemDto> {
    return this.wallService.createPost(groupId, dto, actor);
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
    @Query('topicId') topicId?: string,
    @Query('q') query?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<GroupPageDto> {
    return this.readService.listGroups(tenantId, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
      topicId,
      query,
    });
  }

  /** P7: ficha del grupo con la posición del lector frente a él. */
  @Get(':groupId')
  @ApiOperation({ summary: 'Ficha de un grupo' })
  getGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
  ): Promise<GroupDetailDto> {
    return this.readService.getGroup(groupId, actor, actorProfileId);
  }

  /** Integrantes de un grupo. */
  @Get(':groupId/members')
  @ApiOperation({ summary: 'Integrantes de un grupo' })
  listMembers(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
    @Query('joinStatus') joinStatus?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<GroupMemberPageDto> {
    return this.readService.listMembers(groupId, actor, actorProfileId, {
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
      joinStatusConceptId: joinStatus
        ? JOIN_STATUS_BY_CODE[joinStatus]
        : undefined,
    });
  }

  /** P7: muro del grupo. */
  @Get(':groupId/posts')
  @ApiOperation({ summary: 'Muro de un grupo' })
  listWall(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('actorProfileId') actorProfileId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<GroupWallPageDto> {
    return this.wallService.listWall(groupId, actor, {
      actorProfileId,
      cursor,
      limit: limit ?? DEFAULT_PAGE_LIMIT,
    });
  }
}
