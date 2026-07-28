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
import {
  DiagnosticsImagingService,
  DiagnosticsMediaQualityService,
} from '../services';
import {
  CreateImagingEndpointDto,
  StoreImagingStudyDto,
  RecordDoseEventDto,
  AttachClinicalMediaDto,
  CreateDataQualityEventDto,
  ResourceCreatedDto,
  ImagingStudyStoredDto,
} from '../dto';

/**
 * Endpoints de imagen médica, media clínica y calidad de datos: endpoint DICOM
 * (soporte), STOW-RS (UC-20-11), media clínica (UC-20-12), dosis de radiación
 * (UC-20-13) y evento de calidad + provenance (UC-20-14). Usa rutas absolutas
 * porque STOW-RS vive bajo `/dicomweb` y el resto bajo `/diagnostics`.
 */
@ApiTags('diagnostics-imaging')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller()
export class DiagnosticsImagingController {
  constructor(
    private readonly imaging: DiagnosticsImagingService,
    private readonly mediaQuality: DiagnosticsMediaQualityService,
  ) {}

  /** Soporte: alta de endpoint DICOM. */
  @Post('diagnostics/imaging-endpoints')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un endpoint DICOM (soporte para STOW-RS)',
  })
  createEndpoint(
    @Body() dto: CreateImagingEndpointDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.imaging.createEndpoint(dto, actor);
  }

  /** UC-20-11. */
  @Post('dicomweb/studies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto',
  })
  storeStudy(
    @Body() dto: StoreImagingStudyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImagingStudyStoredDto> {
    return this.imaging.storeStudy(dto, actor);
  }

  /** UC-20-12. */
  @Post('diagnostics/clinical-media')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar media clínica / imagen al chart' })
  attachMedia(
    @Body() dto: AttachClinicalMediaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.mediaQuality.attachMedia(dto, actor);
  }

  /** UC-20-13. */
  @Post('diagnostics/imaging-studies/:id/dose-events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar evento de dosis de radiación' })
  recordDose(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordDoseEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.imaging.recordDoseEvent(id, dto, actor);
  }

  /** UC-20-14. */
  @Post('diagnostics/data-quality-events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar evento de calidad de datos + enlazar provenance',
  })
  recordDataQuality(
    @Body() dto: CreateDataQualityEventDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.mediaQuality.recordDataQualityEvent(dto, actor);
  }
}
