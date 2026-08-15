import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CreateVisitBlockDto,
  CreatedResourceDto,
  PutVisitPolicyDto,
  TransitionResultDto,
} from '../dto';
import type { DoctorVisitBlocks } from '../entities';
import { VisitAgendaService, type PublishedAgenda } from '../services';

/**
 * Agenda de visitas del doctor y bloqueos (UC-17-11, UC-17-12).
 * Capa fina que delega en `VisitAgendaService`.
 */
@ApiTags('pharma-lab-visit-agenda')
@ApiBearerAuth()
@Controller('visit-agenda')
export class VisitAgendaController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso de la agenda de visitas.
   */
  constructor(private readonly service: VisitAgendaService) {}

  /** UC-17-11. */
  @Put('me')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Configurar la agenda de visitas del doctor' })
  putPolicy(
    @Body() dto: PutVisitPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.putPolicy(dto, actor);
  }

  /** Agenda propia del doctor autenticado. */
  @Get('me')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Consultar la propia agenda de visitas' })
  getOwn(@CurrentUser() actor: AuthenticatedUser): Promise<PublishedAgenda> {
    return this.service.getPublishedAgenda(actor.id);
  }

  /**
   * Agenda publicada de un doctor, para que el visitador sepa cuándo puede
   * solicitar. Devuelve horarios, no pacientes.
   */
  @Get('doctors/:doctorUserId')
  @Roles('MEDICAL_VISITOR', 'PHARMA_LAB_ADMIN', 'PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Consultar la agenda de visitas de un doctor' })
  getDoctorAgenda(
    @Param('doctorUserId', ParseUUIDPipe) doctorUserId: string,
  ): Promise<PublishedAgenda> {
    return this.service.getPublishedAgenda(doctorUserId);
  }

  /** UC-17-12. */
  @Post('blocks')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Bloquear un laboratorio o un visitador' })
  createBlock(
    @Body() dto: CreateVisitBlockDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createBlock(dto, actor);
  }

  /** Bloqueos vigentes del doctor. */
  @Get('blocks')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Listar los bloqueos vigentes' })
  listBlocks(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DoctorVisitBlocks[]> {
    return this.service.listBlocks(actor);
  }

  /** Levantar un bloqueo. */
  @Post('blocks/:blockId/lift')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @ApiOperation({ summary: 'Levantar un bloqueo' })
  liftBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.liftBlock(blockId, actor);
  }
}
