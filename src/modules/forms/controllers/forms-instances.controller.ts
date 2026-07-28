import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { FormsInstancesService, FormsValuesService } from '../services';
import {
  OpenInstanceDto,
  CaptureValuesDto,
  FormInstanceResponseDto,
  IdListResponseDto,
  OkResultDto,
} from '../dto';

/**
 * Instancias de formulario sobre `/forms/instances`. Apertura, captura de
 * valores y cierre por parte del clínico. Capa fina que delega en los servicios
 * de instancias y de valores.
 */
@ApiTags('forms-instances')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('forms/instances')
export class FormsInstancesController {
  constructor(
    private readonly instancesService: FormsInstancesService,
    private readonly valuesService: FormsValuesService,
  ) {}

  /** UC-09-07. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir una instancia de formulario para un recurso',
  })
  openInstance(
    @Body() dto: OpenInstanceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FormInstanceResponseDto> {
    return this.instancesService.openInstance(dto, actor);
  }

  /** UC-09-08. */
  @Post(':id/values')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Capturar valores de formulario (value[x] exclusivo)',
  })
  captureValues(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CaptureValuesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdListResponseDto> {
    return this.valuesService.captureValues(id, dto, actor);
  }

  /** UC-09-11. */
  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar formulario y proyectar vista de recurso' })
  closeInstance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.instancesService.closeInstance(id, actor);
  }
}
