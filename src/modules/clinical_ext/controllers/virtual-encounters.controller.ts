import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { TeleconsultIceService, VirtualEncountersService } from '../services';
import {
  CreateVirtualEncounterDto,
  EndVirtualEncounterDto,
  IceServersResponseDto,
  VirtualEncounterResponseDto,
} from '../dto';

/**
 * Endpoints de telesalud (`/virtual-encounters`, UC-18-12): alta, unión y cierre
 * de la sesión virtual. Capa fina sobre `VirtualEncountersService`.
 */
@ApiTags('clinical-ext-virtual-encounters')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('virtual-encounters')
export class VirtualEncountersController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param virtualEncountersService - Valor de virtual encounters service requerido por la operación.
   * @param iceService - Servidores ICE de la teleconsulta (STUN/TURN por entorno).
   */
  constructor(
    private readonly virtualEncountersService: VirtualEncountersService,
    private readonly iceService: TeleconsultIceService,
  ) {}

  /** UC-18-12 (alta). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar una sesión de telesalud' })
  create(
    @Body() dto: CreateVirtualEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    return this.virtualEncountersService.create(dto, actor);
  }

  /** UC-18-12 (join). */
  @Patch(':id/join')
  @Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unirse a una sesión de telesalud' })
  join(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    return this.virtualEncountersService.join(id, actor);
  }

  /** UC-18-12 (end). */
  @Patch(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalizar una sesión de telesalud' })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndVirtualEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VirtualEncounterResponseDto> {
    return this.virtualEncountersService.end(id, dto, actor);
  }

  /**
   * Servidores ICE para la señalización WebRTC (`/teleconsult`). Misma
   * autorización que la señalización: sólo participantes del encuentro, y no
   * sobre una sesión terminada. La credencial TURN (si la hay) es de este
   * usuario y no se cachea.
   */
  @Get(':id/ice-servers')
  @Roles('CLINICIAN', 'PRACTITIONER', 'PATIENT')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Servidores ICE de una sesión de telesalud' })
  async iceServers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IceServersResponseDto> {
    await this.virtualEncountersService.assertSignalingParticipant(id, actor);
    return this.iceService.iceServersFor(actor.id);
  }
}
