import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotAudited, Roles } from '../../../common';
import { PeriopBlocksService } from '../services';

/**
 * Endpoints internos de quirófanos que dispara el worker, no la interfaz (mismo patrón que
 * `scheduling-internal.controller.ts`). Exigen `SYSTEM` o `SYSTEM_WORKER` y son idempotentes.
 */
@ApiTags('periop-or-internal')
@ApiBearerAuth()
@Controller('internal/periop')
export class PeriopOrInternalController {
  /** @param blocks - Bloques de quirófano. */
  constructor(private readonly blocks: PeriopBlocksService) {}

  /** Libera los bloques vencidos sin casos ligados (`released_by_user_id` nulo). */
  @NotAudited(
    'Barrido del sistema sin actor humano: cada liberación deja su historia en audit.operating_room_blocks_history y su evento periop.or_block.released en el outbox',
  )
  @Post('or-blocks-release-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liberar los bloques de quirófano cuyo plazo venció',
    description:
      'Libera los bloques activos con release_at ≤ ahora y sin casos ligados. Idempotente.',
  })
  releaseTick() {
    return this.blocks.releaseTick();
  }
}
