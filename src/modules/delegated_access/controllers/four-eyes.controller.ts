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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  NotAudited,
  Roles,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateSupportApprovalDto,
  DecideApprovalDto,
  DecideApprovalResponseDto,
  ListPendingApprovalsQueryDto,
  ListSupportApprovalsResponseDto,
  SupportApprovalCreatedDto,
  SupportApprovalViewDto,
} from '../dto';
import { FourEyesService } from '../services/four-eyes.service';

/** Cuatro decisiones o pedidos por segundo no son humanos: 30 por minuto por persona. */
const DECISION_THROTTLE = { default: { limit: 30, ttl: 60_000 } };

/**
 * Aprobaciones de cuatro ojos (CONTRATO-GOBIERNO §6.5). La persona de apoyo pide
 * y cancela sus propias solicitudes (`/me/support-approvals`, sin organización
 * activa: la organización va en el cuerpo y el servicio la verifica contra sus
 * vínculos); el aprobador consulta y decide lo que le toca (`/approvals/*`): el
 * servicio decide por elegibilidad, no el rol. Todo asiento de auditoría lo
 * sella el servicio dentro de la misma transacción.
 */
@ApiTags('delegated-access-four-eyes')
@ApiBearerAuth()
@Controller()
export class FourEyesController {
  /** @param fourEyes - Aprobaciones de cuatro ojos. */
  constructor(private readonly fourEyes: FourEyesService) {}

  /** La persona de apoyo pide la aprobación de una acción. */
  @NotAudited(
    'El servicio sella FOUR_EYES_REQUESTED en la misma transacción, con la organización verificada contra los vínculos de la persona (no la del cuerpo).',
  )
  @TenantAgnostic()
  @Throttle(DECISION_THROTTLE)
  @Post('me/support-approvals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pedir la aprobación de una acción sensible' })
  create(
    @Body() dto: CreateSupportApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportApprovalCreatedDto> {
    return this.fourEyes.createAction(dto, actor);
  }

  /** Las solicitudes que la persona pidió. */
  @TenantAgnostic()
  @Get('me/support-approvals')
  @ApiOperation({ summary: 'Mis solicitudes de aprobación' })
  listMine(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListSupportApprovalsResponseDto> {
    return this.fourEyes.listMine(actor);
  }

  /** Cancela una solicitud propia pendiente. */
  @NotAudited(
    'El servicio sella FOUR_EYES_CANCELLED en la misma transacción, con la organización de la propia solicitud.',
  )
  @TenantAgnostic()
  @Post('me/support-approvals/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una solicitud de aprobación propia' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportApprovalViewDto> {
    return this.fourEyes.cancel(id, actor);
  }

  /** Lo que el aprobador puede decidir ahora. */
  @Get('approvals/pending')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Aprobaciones pendientes que puedo decidir' })
  @ApiOkResponse({
    type: ListSupportApprovalsResponseDto,
    description:
      'Lo que puedo decidir. Un cambio de permisos (`GRANT_CHANGE`) trae `details`: el permiso completo que se otorgaría al aprobar (todos los átomos con los críticos marcados, objetivo, vigencia y condiciones), sin datos de pacientes.',
  })
  pending(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListPendingApprovalsQueryDto,
  ): Promise<ListSupportApprovalsResponseDto> {
    return this.fourEyes.pending(actor, query);
  }

  /** Decide (aprueba o rechaza) una solicitud. */
  @NotAudited(
    'El servicio sella FOUR_EYES_APPROVED, FOUR_EYES_REJECTED y, si ejecuta un cambio, FOUR_EYES_EXECUTED según la decisión.',
  )
  @Throttle(DECISION_THROTTLE)
  @Post('approvals/:id/decision')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar o rechazar una solicitud de cuatro ojos' })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DecideApprovalResponseDto> {
    return this.fourEyes.decide(id, dto, actor);
  }
}
