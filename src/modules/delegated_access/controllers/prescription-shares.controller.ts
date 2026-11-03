import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PrescriptionSharesService } from '../services/prescription-shares.service';
import {
  CreatePrescriptionShareDto,
  ListPrescriptionSharesQueryDto,
  PrescriptionShareCreatedDto,
  PrescriptionShareOwnershipDto,
  PrescriptionShareSummaryDto,
} from '../dto/prescription-shares.dto';

/**
 * Enlaces compartidos de una receta (FAR-01), con sesión. Los crea, lista y
 * revoca el paciente dueño o la médica que emitió la receta (S-3). La
 * autorización por recurso la hace el servicio: un enlace o una receta ajenos
 * responden 404, igual que uno inexistente.
 *
 * El token en claro viaja en la ruta de `by-token`: `pino-options.ts` la
 * redacta en el log, y el registro de acceso no lo guarda.
 */
@ApiTags('clinical-prescription-shares')
@ApiBearerAuth()
@Roles('PATIENT', 'PRACTITIONER')
@Controller('clinical/prescription-shares')
export class PrescriptionSharesController {
  constructor(private readonly service: PrescriptionSharesService) {}

  @Post()
  @Audited({
    action: 'PRESCRIPTION_SHARE_CREATED',
    entity: 'shared_access_link',
    entityId: 'result.shareId',
  })
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Compartir una receta con un enlace',
    description:
      'Exactamente uno de `encounterId` o `medicationRequestId`. Devuelve el token en claro una sola vez.',
  })
  @ApiCreatedResponse({ type: PrescriptionShareCreatedDto })
  @ApiBadRequestResponse({
    description: 'No vino exactamente uno de los dos ids',
  })
  @ApiForbiddenResponse({ description: 'Una médica que no emitió la receta' })
  @ApiNotFoundResponse({
    description: 'La receta no existe o es de otro paciente',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Sin ítems emitidos y vigentes (PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS)',
  })
  create(
    @Body() dto: CreatePrescriptionShareDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionShareCreatedDto> {
    return this.service.create(dto, actor);
  }

  @Get()
  @AccessLogged({ resourceType: 'PRESCRIPTION_SHARE' })
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Enlaces de receta de un paciente',
    description:
      'El paciente ve los suyos; una médica, los que creó para ese paciente. Sin token.',
  })
  @ApiOkResponse({ type: PrescriptionShareSummaryDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Es otro paciente' })
  list(
    @Query() query: ListPrescriptionSharesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionShareSummaryDto[]> {
    return this.service.listForPatient(query.patientProfileId, actor);
  }

  @Get('by-token/:token')
  @AccessLogged({ resourceType: 'PRESCRIPTION_SHARE' })
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Saber si un enlace es de la sesión',
    description:
      '200 solo para el paciente dueño o quien lo creó; 404 para cualquier otro. No registra uso.',
  })
  @ApiOkResponse({ type: PrescriptionShareOwnershipDto })
  @ApiNotFoundResponse({ description: 'El enlace no existe o no es suyo' })
  resolveOwnership(
    @Param('token') token: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionShareOwnershipDto> {
    return this.service.resolveOwnership(token, actor);
  }

  @Post(':shareId/revoke')
  @Audited({
    action: 'PRESCRIPTION_SHARE_REVOKED',
    entity: 'shared_access_link',
    entityId: 'param:shareId',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revocar un enlace de receta',
    description:
      'Solo el paciente dueño o quien lo creó. Revocar uno ya revocado no cambia nada.',
  })
  @ApiNoContentResponse({ description: 'Revocado' })
  @ApiNotFoundResponse({ description: 'El enlace no existe o no es suyo' })
  revoke(
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.service.revoke(shareId, actor);
  }
}
