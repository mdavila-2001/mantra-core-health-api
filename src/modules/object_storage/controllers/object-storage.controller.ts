import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  ObjectStorageService,
  DicomCatalogService,
  ObjectGovernanceService,
} from '../services';
import {
  InitiateUploadDto,
  UploadResponseDto,
  CompleteUploadDto,
  ObjectVersionResponseDto,
  CreateVersionDto,
  CatalogDicomStudyDto,
  CatalogDicomStudyResponseDto,
  RegisterLargePayloadDto,
  LargePayloadResponseDto,
  ApplyRetentionLockDto,
  RetentionLockResponseDto,
  PlaceLegalHoldDto,
  LegalHoldResponseDto,
  IssueSignedUrlDto,
  SignedUrlResponseDto,
  RecordIntegrityCheckDto,
  IntegrityCheckResponseDto,
  BuildArchiveJobDto,
  ArchiveJobResponseDto,
  RequestDeletionDto,
  DeletionMarkerResponseDto,
} from '../dto';

/**
 * Endpoints de almacenamiento de objetos.
 *
 * Los casos de uso escriben `uploads:initiate`, `{id}:complete`,
 * `studies:catalog`, `archive-jobs:build` y `{manifestId}:request-deletion`;
 * Nest 11 trata `:` como inicio de parámetro en cualquier punto del segmento,
 * así que las rutas publicadas usan segmentos planos, como en el resto del
 * proyecto.
 */
@ApiTags('object-storage')
@ApiBearerAuth()
@Controller('object-storage')
export class ObjectStorageController {
  constructor(
    private readonly storageService: ObjectStorageService,
    private readonly dicomService: DicomCatalogService,
    private readonly governanceService: ObjectGovernanceService,
  ) {}

  /** UC-60-01. */
  @Post('namespaces/:code/uploads/initiate')
  @Roles('STORAGE_CLIENT', 'SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar una carga multiparte',
    description:
      'La clave de destino es opaca: no debe llevar datos del paciente.',
  })
  initiateUpload(
    @Param('code') code: string,
    @Body() dto: InitiateUploadDto,
  ): Promise<UploadResponseDto> {
    return this.storageService.initiateUpload(code, dto);
  }

  /** UC-60-02. */
  @Post('uploads/:id/complete')
  @Roles('STORAGE_CLIENT', 'SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Completar la carga y materializar la versión del objeto',
    description: 'El tamaño recibido debe cuadrar con el declarado al iniciar.',
  })
  completeUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteUploadDto,
  ): Promise<ObjectVersionResponseDto> {
    return this.storageService.completeUpload(id, dto);
  }

  /** UC-60-03. */
  @Post('objects/:manifestId/versions')
  @Roles('SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una versión nueva del objeto',
    description: 'Exige versionado habilitado y contenido distinto al vigente.',
  })
  createVersion(
    @Param('manifestId', ParseUUIDPipe) manifestId: string,
    @Body() dto: CreateVersionDto,
  ): Promise<ObjectVersionResponseDto> {
    return this.storageService.createVersion(manifestId, dto);
  }

  /** UC-60-04. */
  @Post('dicom/studies/catalog')
  @Roles('PACS_GATEWAY', 'SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Catalogar la jerarquía DICOM estudio/serie/instancia',
    description: 'Reentrante: reenviar el mismo estudio no duplica nada.',
  })
  catalogDicomStudy(
    @Body() dto: CatalogDicomStudyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CatalogDicomStudyResponseDto> {
    return this.dicomService.catalogStudy(dto, actor);
  }

  /** UC-60-06. */
  @Post('large-payloads')
  @Roles('SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un payload grande y vincularlo a su entidad de origen',
    description: 'Un payload por origen y tipo.',
  })
  registerLargePayload(
    @Body() dto: RegisterLargePayloadDto,
  ): Promise<LargePayloadResponseDto> {
    return this.storageService.registerLargePayload(dto);
  }

  /** UC-60-07. */
  @Post('versions/:versionId/retention-lock')
  @Roles('COMPLIANCE_OFFICER', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aplicar retención WORM sobre la versión',
    description:
      'El modo `compliance` no se acorta ni se libera antes de tiempo.',
  })
  applyRetentionLock(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ApplyRetentionLockDto,
  ): Promise<RetentionLockResponseDto> {
    return this.governanceService.applyRetentionLock(versionId, dto);
  }

  /** UC-60-08. */
  @Post('versions/:versionId/legal-holds')
  @Roles('LEGAL_COUNSEL', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Colocar una retención legal',
    description: 'Anula cualquier borrado, incluso con la retención vencida.',
  })
  placeLegalHold(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: PlaceLegalHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LegalHoldResponseDto> {
    return this.governanceService.placeLegalHold(versionId, dto, actor);
  }

  /** UC-60-08. */
  @Delete('versions/:versionId/legal-holds/:holdId')
  @Roles('LEGAL_COUNSEL', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liberar una retención legal',
    description:
      'El objeto vuelve a su estado anterior sólo si no queda ninguna viva.',
  })
  releaseLegalHold(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Param('holdId', ParseUUIDPipe) holdId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LegalHoldResponseDto> {
    return this.governanceService.releaseLegalHold(versionId, holdId, actor);
  }

  /** UC-60-09. */
  @Post('versions/:versionId/signed-url')
  @Roles('DICOM_VIEWER', 'CLINICIAN', 'SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir acceso firmado a una versión',
    description:
      'Lo frío exige rehidratación previa; el acceso queda registrado.',
  })
  issueSignedUrl(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: IssueSignedUrlDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SignedUrlResponseDto> {
    return this.storageService.issueSignedUrl(versionId, dto, actor);
  }

  /** UC-60-10. */
  @Post('versions/:versionId/integrity-checks')
  @Roles('SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la verificación de integridad',
    description:
      'El resultado se deriva del hash; no cuadrar marca el objeto corrupto.',
  })
  recordIntegrityCheck(
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: RecordIntegrityCheckDto,
  ): Promise<IntegrityCheckResponseDto> {
    return this.governanceService.recordIntegrityCheck(versionId, dto);
  }

  /** UC-60-11. */
  @Post('archive-jobs/build')
  @Roles('SYSTEM', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Archivar el objeto a almacenamiento frío',
    description: 'Una retención legal viva impide degradar la clase.',
  })
  buildArchiveJob(
    @Body() dto: BuildArchiveJobDto,
  ): Promise<ArchiveJobResponseDto> {
    return this.governanceService.buildArchiveJob(dto);
  }

  /** UC-60-12. */
  @Post('objects/:manifestId/request-deletion')
  @Roles('COMPLIANCE_OFFICER', 'STORAGE_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar el borrado gobernado',
    description:
      'Retención legal y retención de cumplimiento vigente lo abortan.',
  })
  requestDeletion(
    @Param('manifestId', ParseUUIDPipe) manifestId: string,
    @Body() dto: RequestDeletionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DeletionMarkerResponseDto> {
    return this.governanceService.requestDeletion(manifestId, dto, actor);
  }
}
