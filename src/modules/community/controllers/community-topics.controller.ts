import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { CommunityGroupsReadService } from '../services';
import type { TopicPageDto } from '../dto';

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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Lecturas de grupos y temas.
   */
  constructor(private readonly readService: CommunityGroupsReadService) {}

  /** Temas activos con los que se clasifican grupos y publicaciones. */
  @Get()
  @Roles()
  @ApiOperation({ summary: 'Temas de la comunidad' })
  listTopics(): Promise<TopicPageDto> {
    return this.readService.listTopics();
  }
}
