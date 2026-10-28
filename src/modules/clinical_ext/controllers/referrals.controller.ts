import {
  Body,
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  AccessLogged,
  type AuthenticatedUser,
} from '../../../common';
import { ReferralsService } from '../services';

/**
 * Tope de las búsquedas de destino: el mismo que el directorio público
 * (`community-public.controller.ts`). Son lecturas de directorio, no de
 * historia clínica —no llevan `@AccessLogged`, que es para datos de paciente—,
 * pero sí un techo para que no se usen para volcar el padrón.
 */
const REFERRAL_TARGETS_RATE_LIMIT = { default: { limit: 60, ttl: 60_000 } };
import {
  CounterReferralDto,
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
  RespondReferralDto,
  RespondReferralResultDto,
  ReferralListItemDto,
  ReferralResponseDto,
  ReferralTargetListDto,
  ReferralTargetServiceListDto,
  SearchReferralTargetsQueryDto,
} from '../dto';

/**
 * Endpoints de referencias clínicas (`/referrals`): emisión (UC-18-07) y respuesta
 * del tenant destino (UC-18-08). Capa fina sobre `ReferralsService`.
 */
@ApiTags('clinical-ext-referrals')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('referrals')
export class ReferralsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param referralsService - Valor de referrals service requerido por la operación.
   */
  constructor(private readonly referralsService: ReferralsService) {}

  /** UC-18-07. */
  @Audited({
    action: 'REFERRAL_CREATED',
    entity: 'referral',
    entityId: 'result.id',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir una referencia desde un encuentro' })
  create(
    @Body() dto: CreateReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.referralsService.create(dto, actor);
  }

  /**
   * Destinos posibles de una derivación (profesionales y organizaciones).
   *
   * Va antes de cualquier ruta con `:id` para que `targets` no se lea como id.
   */
  @Get('targets')
  @Throttle(REFERRAL_TARGETS_RATE_LIMIT)
  @ApiOperation({ summary: 'Buscar destinos de derivación' })
  @ApiOkResponse({ type: ReferralTargetListDto })
  searchTargets(
    @Query() query: SearchReferralTargetsQueryDto,
  ): Promise<ReferralTargetListDto> {
    return this.referralsService.searchTargets(query);
  }

  /** Servicios activos de un profesional u organización destino. */
  @Get('target-services')
  @Throttle(REFERRAL_TARGETS_RATE_LIMIT)
  @ApiOperation({ summary: 'Servicios activos de un destino de derivación' })
  @ApiOkResponse({ type: ReferralTargetServiceListDto })
  listTargetServices(
    @Query() query: ListReferralTargetServicesQueryDto,
  ): Promise<ReferralTargetServiceListDto> {
    return this.referralsService.listTargetServices(query);
  }

  /** UC-18-08. */
  @Audited({
    action: 'REFERRAL_RESPONDED',
    entity: 'referral',
    entityId: 'param:id',
  })
  @Patch(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Responder / aceptar una referencia inter-tenant' })
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RespondReferralResultDto> {
    return this.referralsService.respond(id, dto, actor);
  }

  /** v4266: contrarreferencia del destino; cierra la derivación. */
  @Audited({
    action: 'REFERRAL_COUNTER_REFERRAL_RECORDED',
    entity: 'referral',
    entityId: 'param:id',
  })
  @Patch(':id/counter-referral')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar la contrarreferencia de una derivación' })
  counterReferral(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CounterReferralDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.referralsService.counterReferral(id, dto, actor);
  }

  /** v4266: anula una derivación pendiente o aceptada. */
  @Audited({
    action: 'REFERRAL_CANCELLED',
    entity: 'referral',
    entityId: 'param:id',
  })
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anular una derivación' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.referralsService.cancel(id, actor);
  }
  /**
   * La lectura que faltaba: derivaciones de un paciente.
   *
   * El módulo tenía escrituras y ninguna lectura, así que lo que se registraba
   * no se podía volver a mirar — y ninguna pantalla podía mostrarlo.
   */
  @Get()
  @AccessLogged({ resourceType: 'REFERRALS' })
  @ApiOperation({ summary: 'Listar derivaciones de un paciente' })
  @ApiOkResponse({ type: [ReferralListItemDto] })
  listByPatient(
    @Query('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralListItemDto[]> {
    return this.referralsService.listByPatient(patientProfileId, actor);
  }

  /**
   * CV-10 — el paciente lee sus propias derivaciones. La persona sale de la
   * cuenta, nunca de un id que el cliente pudiera manipular; por eso pisa el
   * `@Roles` de clase con uno propio en vez de reutilizar `listByPatient`.
   */
  @Get('me')
  @AccessLogged({ resourceType: 'REFERRALS', patient: 'actor' })
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Mis derivaciones' })
  @ApiOkResponse({ type: [ReferralListItemDto] })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralListItemDto[]> {
    return this.referralsService.listMine(actor);
  }

  /**
   * v4266: una derivación por id. Declarada después de `me` para que esa ruta
   * no caiga acá. La lee quien puede leer la historia o el destino.
   */
  @Get(':id')
  @AccessLogged({ resourceType: 'REFERRALS', resourceId: 'param:id' })
  @ApiOperation({ summary: 'Leer una derivación' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReferralResponseDto> {
    return this.referralsService.get(id, actor);
  }
}
