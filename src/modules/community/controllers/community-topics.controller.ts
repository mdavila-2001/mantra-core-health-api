import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CommunityTopicsService } from '../services';
import {
  CreateTopicDto,
  type TopicListItemDto,
  type TopicPageDto,
} from '../dto';

/**
 * Temas del árbol de la plataforma (P7).
 *
 * Vive en su propio controlador y no colgando de `community/groups` para no
 * disputarle la ruta a `GET /community/groups/:groupId`: `groups/topics`
 * entraría por el comodín del id y sólo funcionaría mientras estuviera
 * declarado antes, que es la clase de detalle que se rompe al reordenar
 * métodos.
 *
 * `@Roles()` vacío (O3-3): el árbol de temas es un catálogo sin datos
 * personales; alcanza con la sesión.
 */
@ApiTags('community-groups')
@ApiBearerAuth()
@Controller('community/topics')
export class CommunityTopicsController {
  constructor(private readonly topics: CommunityTopicsService) {}

  /** Temas activos (categorías y temas) con los que se clasifican grupos y publicaciones. */
  @Get()
  @Roles()
  @ApiOperation({ summary: 'Temas de la comunidad' })
  listTopics(): Promise<TopicPageDto> {
    return this.topics.listTopics();
  }

  /** Crea un tema propio bajo «Temas propios»; si ya existe con ese nombre, lo devuelve. */
  @Audited({
    action: 'COMMUNITY_TOPIC_CREATED',
    entity: 'topic',
    entityId: 'result.id',
  })
  @Post()
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un tema propio' })
  createTopic(
    @Body() dto: CreateTopicDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TopicListItemDto> {
    return this.topics.createTopic(dto.name, actor);
  }
}
