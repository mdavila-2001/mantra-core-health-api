import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { DiagnosticsSpecimensService } from '../services';
import {
  CreateSpecimenDto,
  CreateAccessionDto,
  RejectSpecimenDto,
  CreateContainerDto,
  ContainerCustodyEventDto,
  ResourceCreatedDto,
  AccessionCreatedDto,
  AccessionDetailDto,
  SpecimenDetailDto,
} from '../dto';

/**
 * Endpoints del agregado de especímenes: alta (soporte), acesión (UC-20-01),
 * rechazo (UC-20-02), alta de contenedor (soporte) y cadena de custodia
 * (UC-20-03). Capa fina: valida parámetros y delega en el servicio.
 */
@ApiTags('diagnostics-specimens')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('diagnostics')
export class DiagnosticsSpecimensController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: DiagnosticsSpecimensService) {}

  /** Soporte: alta de espécimen. */
  @Post('specimens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un espécimen (soporte para acesión)' })
  createSpecimen(
    @Body() dto: CreateSpecimenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createSpecimen(dto, actor);
  }

  /**
   * Lectura (CL-47): detalle de una acesión con sus especímenes, contenedores
   * y cadena de custodia. Antes de esta ruta, `diagnostics` sólo tenía `POST`
   * para el circuito de especímenes: abrir el detalle de una acesión concreta
   * no tenía dónde ir.
   */
  @Get('accessions/:id')
  @ApiOperation({
    summary: 'Detalle de una acesión (especímenes, contenedores y custodia)',
    description: 'Acotado al tenant del contexto: otro laboratorio recibe 404.',
  })
  getAccession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccessionDetailDto> {
    return this.service.getAccession(id, requireTenantId());
  }

  /** Lectura (CL-47): detalle de un espécimen con su cadena de custodia. */
  @Get('specimens/:id')
  @ApiOperation({
    summary: 'Detalle de un espécimen (con su cadena de custodia)',
    description: 'Acotado al tenant del contexto: otro laboratorio recibe 404.',
  })
  getSpecimen(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SpecimenDetailDto> {
    return this.service.getSpecimen(id, requireTenantId());
  }

  /** UC-20-01. */
  @Post('accessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Acesionar especímenes recibidos en laboratorio' })
  accession(
    @Body() dto: CreateAccessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessionCreatedDto> {
    return this.service.accession(dto, actor);
  }

  /** UC-20-02. */
  @Post('specimens/:id/rejection')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Rechazar espécimen y solicitar recolección' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectSpecimenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.reject(id, dto, actor);
  }

  /** Soporte: alta de contenedor. */
  @Post('specimens/:id/containers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un contenedor de espécimen (soporte para custodia)',
  })
  createContainer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContainerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createContainer(id, dto, actor);
  }

  /** UC-20-03. */
  @Post('containers/:id/custody-events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar cadena de custodia / traslado de contenedor',
  })
  custodyEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ContainerCustodyEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.recordCustodyEvent(id, dto, actor);
  }
}
