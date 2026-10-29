import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, Roles } from '../../../common';
import {
  CareSpaceBlocksTickService,
  type BlocksTickResult,
} from '../services/care-space-blocks-tick.service';

/**
 * Endpoints internos de `practice` que dispara el scheduler, no la interfaz.
 *
 * Exigen el rol `SYSTEM` o `SYSTEM_WORKER` y son idempotentes (patrón de
 * `scheduling-internal.controller.ts`): reejecutarlos es seguro.
 */
@ApiTags('practice-internal')
@ApiBearerAuth()
@Controller('internal/practice')
export class PracticeInternalController {
  /**
   * @param tick - Proceso periódico de los bloqueos.
   */
  constructor(private readonly tick: CareSpaceBlocksTickService) {}

  /** Aplica los bloqueos programados cuya hora llegó y avisa de los vencidos. */
  @Audited({
    action: 'CARE_SPACE_BLOCKS_TICKED',
    entity: 'care_space_block',
    entityId: 'result.id',
  })
  @Post('blocks-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar los bloqueos programados y avisar de los vencidos',
    description:
      'Un bloqueo está «aplicado» si el espacio ya figura no disponible; no hay columna. Idempotente.',
  })
  blocksTick(): Promise<BlocksTickResult> {
    return this.tick.run();
  }
}
