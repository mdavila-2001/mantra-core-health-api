import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { PharmaLabNotices } from '../entities';
import { PharmaLabNotificationsService } from '../services';

/**
 * Buzón de avisos del carril 17 (spec 5667-5702).
 *
 * Sin roles a propósito: cada quien lee **lo suyo**, y el servicio acota por la
 * cuenta autenticada. Un aviso de visita le llega tanto al doctor como al
 * visitador como al personal regulatorio, y exigir un rol concreto dejaría a
 * alguno de los tres sin poder ver el suyo.
 */
@ApiTags('pharma-lab-notices')
@ApiBearerAuth()
@Controller('pharma-labs/notices')
export class PharmaLabNoticesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Buzón de avisos del carril.
   */
  constructor(private readonly service: PharmaLabNotificationsService) {}

  /** Avisos de la persona autenticada. */
  @Get('mine')
  @ApiOperation({ summary: 'Avisos del laboratorio dirigidos a mi cuenta' })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PharmaLabNotices[]> {
    return this.service.listOwn(actor);
  }

  /** Marca un aviso propio como leído. */
  @Post(':noticeId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar un aviso como leído' })
  async markRead(
    @Param('noticeId', ParseUUIDPipe) noticeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    const marked = await this.service.markRead(noticeId, actor);
    if (!marked) {
      throw new ResourceNotFoundException('Aviso no encontrado', { noticeId });
    }
  }
}
