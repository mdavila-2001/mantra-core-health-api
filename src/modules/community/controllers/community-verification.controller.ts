import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EntityManager } from '@mikro-orm/postgresql';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CommunityVerificationService } from '../services';
import {
  BadgeSweepResponseDto,
  GrantBadgeDto,
  GrantBadgeResponseDto,
  RevokeBadgeDto,
} from '../dto';
import { COMM } from '../community.concepts';

/**
 * Superficie interna de los sellos de verificación (P13).
 *
 * ## Por qué no hay un endpoint público de escritura
 *
 * El camino normal del sello es **el puente**: `identity_assurance` verifica la
 * matrícula contra la autoridad y el sello se emite solo. Este controlador no
 * es una segunda puerta al mismo sitio; es la escotilla de operación, y por eso
 * pide `SECURITY_ADMIN`, marca el sello como manual y lo anota en
 * `audit.verified_badges_history`.
 *
 * Que exista el registro es lo que hace aceptable que exista la escotilla: un
 * sello manual sin rastro sería indistinguible de uno verificado.
 */
@ApiTags('community')
@ApiBearerAuth()
@Controller('internal/community/verification')
export class CommunityVerificationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param service - Emisión y baja de sellos.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly service: CommunityVerificationService,
  ) {}

  /**
   * Alta manual de un sello, sólo para `SECURITY_ADMIN` y siempre auditada.
   *
   * Existe porque una autoridad puede estar caída o no tener API. El sello
   * queda marcado como `BADGE_METHOD_MANUAL_ADMIN`, así que la ficha puede
   * decir cómo se verificó y una auditoría puede separarlos después.
   *
   * @param dto - Sujeto y evidencia.
   * @param actor - Administrador que lo registra.
   * @returns Qué pasó con el sello.
   */
  @Post('badges')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Emitir un sello a mano (auditado)',
    description:
      'Escotilla de operación: el camino normal es el puente desde ' +
      'identity_assurance. Queda marcado como manual y anotado en auditoría.',
  })
  async grant(
    @Body() dto: GrantBadgeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GrantBadgeResponseDto> {
    const result = await this.em.transactional((tx) =>
      this.service.applyVerified(tx, {
        targetId: dto.targetId,
        methodConceptId: COMM.BADGE_METHOD_MANUAL_ADMIN,
        actorUserId: actor.id,
        evidenceRef: dto.evidenceRef,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      }),
    );
    return { action: result.action };
  }

  /**
   * Baja los sellos de un sujeto a mano.
   *
   * @param targetId - Sujeto de dominio.
   * @param dto - Si fue revocación o vencimiento.
   * @param actor - Administrador que lo registra.
   * @returns Cuántos sellos cayeron.
   */
  @Post('badges/:targetId/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bajar los sellos de un sujeto (auditado)' })
  async revoke(
    @Param('targetId') targetId: string,
    @Body() dto: RevokeBadgeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ revoked: number }> {
    return this.em.transactional((tx) =>
      this.service.applyRevoked(
        tx,
        targetId,
        actor.id,
        dto.reason ?? 'REVOKED',
      ),
    );
  }

  /**
   * Barrido de sellos vencidos. Lo llama el worker.
   *
   * @param actor - Quién lo corre (el worker de sistema).
   * @returns Cuántos sellos y perfiles cayeron.
   */
  @Post('badges/expire-sweep')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bajar los sellos cuya vigencia ya venció',
    description:
      'Sin este barrido, un sello con vencimiento se seguiría mostrando ' +
      'activo hasta que alguien revocara el caso a mano.',
  })
  expireSweep(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BadgeSweepResponseDto> {
    return this.service.expireSweep(actor.id);
  }
}
