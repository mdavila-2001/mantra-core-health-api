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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  getCurrentTenantId,
  PreconditionFailedException,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PromotionsLoyaltyService } from '../services';
import {
  CreateLoyaltyProgramDto,
  LoyaltyProgramResponseDto,
  EnrollMemberDto,
  MembershipResponseDto,
  EarnPointsDto,
  RedeemPointsDto,
  PointsLedgerResponseDto,
  MyLoyaltyResponseDto,
  MyPointsLedgerQueryDto,
  MyPointsLedgerPageResponseDto,
  RecomputeBalanceResponseDto,
  ExpirePointsDto,
  ExpirePointsResponseDto,
  ListActiveLoyaltyProgramsResponseDto,
  ListActiveLoyaltyProgramsQueryDto,
  CreateReferralDto,
  ReferralResponseDto,
  QualifyReferralDto,
  QualifyReferralResponseDto,
} from '../dto';

/** Endpoints de lealtad y referidos (UC-51-01 … 06, 12, 13). */
@ApiTags('loyalty')
@ApiBearerAuth()
@Controller()
export class LoyaltyController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param loyaltyService - Valor de loyalty service requerido por la operación.
   */
  constructor(private readonly loyaltyService: PromotionsLoyaltyService) {}

  /**
   * UC-51-06 (descubrimiento). `loyalty/jobs/expire-points` exige un
   * `loyaltyProgramId` puntual y no existía forma de listar qué programas
   * activos barrer; este endpoint alimenta ese descubrimiento.
   */
  @Get('loyalty/programs')
  @Roles('SYSTEM', 'PROMOTIONS_ADMIN', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar programas de lealtad activos',
  })
  listActivePrograms(
    @Query() query: ListActiveLoyaltyProgramsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListActiveLoyaltyProgramsResponseDto> {
    // El worker SYSTEM barre todos los tenants; cualquier otro rol debe
    // acotarse al tenant del contexto (X-Tenant-Id), igual que el resto de
    // endpoints de administración de lealtad.
    if (actor.roles.includes('SYSTEM')) {
      return this.loyaltyService.listActivePrograms(query.limit);
    }
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new PreconditionFailedException(
        'Se requiere X-Tenant-Id para listar programas de lealtad',
      );
    }
    return this.loyaltyService.listActivePrograms(query.limit, tenantId);
  }

  /* ─── Autoservicio del paciente (R-T-E6B1) ─────────────────────────────
   *
   * Cuelgan de `me` y no de `memberships/:id` a propósito: si el titular
   * viajara en la ruta, el endpoint tendría que comparar el de la URL con el de
   * la sesión, y ésa es exactamente la comparación que un día se olvida. Sin
   * parámetro no hay nada que comparar — el mismo criterio que
   * `diagnostic-results/me`. El aislamiento entre personas lo resuelve el
   * servicio, que deriva el titular del token.
   *
   * El rol es `PATIENT`, el rol global real del portal. `MEMBER`, que exigen
   * las rutas de administración de abajo, **no es un rol global asignable**
   * (`GlobalRole` no lo incluye), así que ningún paciente podía usarlas.
   */

  /** R-T-E6B1: mi membresía y mi saldo. */
  @Get('loyalty/me')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mi membresía de lealtad y mi saldo de puntos',
    description:
      'El titular sale del token; no se acepta ningún identificador de miembro por la petición. No estar inscrito responde 200 con `enrolled: false`, que es un estado normal del portal y no un error.',
  })
  @ApiOkResponse({ type: MyLoyaltyResponseDto })
  myLoyalty(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyLoyaltyResponseDto> {
    return this.loyaltyService.myLoyalty(actor, this.requireTenant());
  }

  /** R-T-E6B1: mis movimientos, paginados por cursor. */
  @Get('loyalty/me/points')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mis movimientos de puntos, más nuevos primero',
    description:
      'Paginado por cursor opaco, con orden estable por fecha e id. Sólo movimientos de la membresía del titular.',
  })
  @ApiOkResponse({ type: MyPointsLedgerPageResponseDto })
  myPoints(
    @Query() query: MyPointsLedgerQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyPointsLedgerPageResponseDto> {
    return this.loyaltyService.myPointsLedger(
      actor,
      this.requireTenant(),
      query,
    );
  }

  /**
   * R-T-E6B1: canjear mis propios puntos.
   *
   * Mismo motor que `loyalty/memberships/:id/points/redeem` —saldo nunca
   * negativo, idempotencia por clave—, pero la membresía la deriva el servidor
   * del token en vez de aceptarla en la ruta.
   */
  @Post('loyalty/me/points/redeem')
  @Roles('PATIENT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Canjear puntos de mi propia membresía',
    description:
      'El titular sale del token. Idempotente por `idempotencyKey`; una clave que pertenezca a otra membresía se rechaza en vez de devolver datos ajenos.',
  })
  @ApiCreatedResponse({ type: PointsLedgerResponseDto })
  redeemOwnPoints(
    @Body() dto: RedeemPointsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PointsLedgerResponseDto> {
    return this.loyaltyService.redeemOwnPoints(
      actor,
      this.requireTenant(),
      dto,
    );
  }

  /**
   * El tenant del contexto, que acota el programa del portal.
   *
   * Mismo criterio que el listado de programas: sin `X-Tenant-Id` no se sabe de
   * qué programa se está hablando, y elegir uno por nosotros sería inventar.
   */
  private requireTenant(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new PreconditionFailedException(
        'Se requiere X-Tenant-Id para operar sobre la membresía de lealtad',
      );
    }
    return tenantId;
  }

  /** UC-51-01. */
  @Post('loyalty/programs')
  @Roles('PROMOTIONS_ADMIN', 'MARKETING_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un programa de lealtad con niveles y reglas',
  })
  createProgram(
    @Body() dto: CreateLoyaltyProgramDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LoyaltyProgramResponseDto> {
    return this.loyaltyService.createProgram(dto, actor);
  }

  /** UC-51-02. */
  @Post('loyalty/programs/:id/memberships')
  @Roles('PROMOTIONS_ADMIN', 'MEMBER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscribir a un miembro en el programa',
    description:
      'Idempotente: repetir la llamada devuelve la membresía existente.',
  })
  enrollMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnrollMemberDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    return this.loyaltyService.enrollMember(id, dto, actor);
  }

  /** UC-51-03. */
  @Post('loyalty/memberships/:id/points/earn')
  @Roles('SYSTEM', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Acumular puntos por un evento de la aplicación',
    description:
      'Idempotente por `idempotencyKey`: reentregar el evento no acumula dos veces.',
  })
  earnPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EarnPointsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PointsLedgerResponseDto> {
    return this.loyaltyService.earnPoints(id, dto, actor);
  }

  /** UC-51-04. */
  @Post('loyalty/memberships/:id/points/redeem')
  @Roles('MEMBER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Canjear puntos',
    description:
      'Idempotente por `idempotencyKey`; el saldo nunca queda negativo.',
  })
  redeemPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RedeemPointsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PointsLedgerResponseDto> {
    return this.loyaltyService.redeemPoints(id, dto, actor);
  }

  /** UC-51-05. */
  @Post('loyalty/memberships/:id/recompute')
  @Roles('SYSTEM', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reproyectar saldo y nivel desde el ledger',
    description:
      'El ledger es la fuente de verdad; el saldo de la membresía es derivado.',
  })
  recomputeBalance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RecomputeBalanceResponseDto> {
    return this.loyaltyService.recomputeBalance(id, actor);
  }

  /** UC-51-06. */
  @Post('loyalty/jobs/expire-points')
  @Roles('SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Barrer los puntos vencidos de un programa',
    description:
      'Procesa por lotes con SKIP LOCKED; expirar dos veces el mismo lote no acumula.',
  })
  expirePoints(
    @Body() dto: ExpirePointsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpirePointsResponseDto> {
    return this.loyaltyService.expirePoints(dto, actor);
  }

  /** UC-51-12. */
  @Post('referral-programs/:id/referrals')
  @Roles('MEMBER', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar el código de referido del miembro',
    description: 'El referidor es el usuario autenticado.',
  })
  createReferral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.loyaltyService.createReferral(id, dto, actor);
  }

  /** UC-51-13. */
  @Post('referrals/:id/qualify')
  @Roles('SYSTEM', 'PROMOTIONS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calificar el referido y premiar a ambas partes',
    description:
      'Idempotente por referido: reentregar el evento no duplica la recompensa.',
  })
  qualifyReferral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QualifyReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QualifyReferralResponseDto> {
    return this.loyaltyService.qualifyReferral(id, dto, actor);
  }
}
