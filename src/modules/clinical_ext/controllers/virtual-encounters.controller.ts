import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { VirtualEncountersService } from '../services';
import {
  CreateVirtualEncounterDto,
  EndVirtualEncounterDto,
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
   */
  constructor(
    private readonly virtualEncountersService: VirtualEncountersService,
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
}
