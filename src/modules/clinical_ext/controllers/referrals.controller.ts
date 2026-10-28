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
import {
  CreateReferralDto,
  ListReferralTargetServicesQueryDto,
  RespondReferralDto,
  ReferralListItemDto,
  ReferralResponseDto,
  ReferralTargetListDto,
  ReferralTargetServiceListDto,
  SearchReferralTargetsQueryDto,
  StatusResultDto,
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
  @ApiOperation({ summary: 'Buscar destinos de derivación' })
  @ApiOkResponse({ type: ReferralTargetListDto })
  searchTargets(
    @Query() query: SearchReferralTargetsQueryDto,
  ): Promise<ReferralTargetListDto> {
    return this.referralsService.searchTargets(query);
  }

  /** Servicios activos de un profesional u organización destino. */
  @Get('target-services')
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
  ): Promise<StatusResultDto> {
    return this.referralsService.respond(id, dto, actor);
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
}
