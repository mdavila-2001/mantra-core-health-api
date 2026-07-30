import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DicomCatalogService } from '../services';
import { DicomInstanceAccessResponseDto } from '../dto';

/**
 * Superficie DICOMweb del módulo.
 *
 * Va aparte porque su prefijo (`/dicomweb`) y su forma son las que espera un
 * visor DICOM estándar; meterlas bajo `/object-storage` las volvería inservibles
 * para ese cliente.
 *
 * **Este endpoint no devuelve el píxel**: resuelve la jerarquía, autoriza y
 * registra el acceso, y entrega la referencia del objeto. El binario se obtiene
 * después con la URL firmada (UC-60-09), que es quien tiene la credencial del
 * proveedor.
 */
@ApiTags('dicomweb')
@ApiBearerAuth()
@Controller('dicomweb')
export class DicomWebController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param dicomService - Valor de dicom service requerido por la operación.
   */
  constructor(private readonly dicomService: DicomCatalogService) {}

  /** UC-60-05. */
  @Get('studies/:studyUid/series/:seriesUid/instances/:sopUid')
  @Roles('DICOM_VIEWER', 'CLINICIAN', 'STORAGE_ADMIN')
  @ApiOperation({
    summary: 'Resolver una instancia DICOM y registrar el acceso (WADO-RS)',
    description:
      'El intento denegado también se registra: un log que sólo guarda los accesos correctos no sirve para vigilar los indebidos.',
  })
  @ApiQuery({
    name: 'purposeOfUse',
    required: false,
    description:
      'Propósito de uso; sin él el acceso se deniega y queda registrado',
  })
  resolveInstance(
    @Param('studyUid') studyUid: string,
    @Param('seriesUid') seriesUid: string,
    @Param('sopUid') sopUid: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('purposeOfUse') purposeOfUse?: string,
  ): Promise<DicomInstanceAccessResponseDto> {
    return this.dicomService.resolveInstance(
      studyUid,
      seriesUid,
      sopUid,
      purposeOfUse,
      actor,
    );
  }
}
