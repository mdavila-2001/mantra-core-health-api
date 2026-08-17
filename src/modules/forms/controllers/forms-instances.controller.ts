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
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  FormsInstancesService,
  FormsReadService,
  FormsValuesService,
} from '../services';
import {
  OpenInstanceDto,
  CaptureValuesDto,
  FormInstanceResponseDto,
  FormInstanceDetailResponseDto,
  FormInstanceListResponseDto,
  IdListResponseDto,
  OkResultDto,
} from '../dto';

/**
 * Instancias de formulario sobre `/forms/instances`. Apertura, captura de
 * valores, cierre y lectura por parte del clínico. Capa fina que delega en los
 * servicios de instancias, de valores y de lectura.
 *
 * Las lecturas anclan la propiedad en el encuentro que la instancia referencia
 * (el frontend abre instancias con `resourceId` = encuentro): el service exige
 * que ese encuentro pertenezca al tenant del contexto y responde 404 ante lo
 * ajeno o lo que no pueda anclarse.
 */
@ApiTags('forms-instances')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('forms/instances')
export class FormsInstancesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param instancesService - Valor de instances service requerido por la operación.
   * @param valuesService - Valor de values service requerido por la operación.
   * @param readService - Lecturas de instancias y valores.
   */
  constructor(
    private readonly instancesService: FormsInstancesService,
    private readonly valuesService: FormsValuesService,
    private readonly readService: FormsReadService,
  ) {}

  /** Fase 1 de lecturas: los formularios de un encuentro. */
  @Get()
  @ApiOperation({
    summary: 'Listar las instancias de formulario de un encuentro',
  })
  @ApiQuery({
    name: 'encounter',
    required: true,
    description: 'Encuentro cuyos formularios se listan',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  listInstances(
    @Query('encounter', ParseUUIDPipe) encounterId: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<FormInstanceListResponseDto> {
    return this.readService.listInstancesByEncounter(encounterId, limit ?? 50);
  }

  /** Fase 1 de lecturas: la instancia con sus valores vigentes. */
  @Get(':id')
  @ApiOperation({
    summary: 'Leer una instancia con sus valores vigentes, por tipo resuelto',
  })
  getInstance(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormInstanceDetailResponseDto> {
    return this.readService.getInstance(id);
  }

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
