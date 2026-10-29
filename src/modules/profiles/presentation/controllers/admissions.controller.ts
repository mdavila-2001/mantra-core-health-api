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
  Res,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AccessLogged,
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { PractitionerAdmissionDocumentsService } from '../../application/services/practitioner-admission-documents.service';
import { PractitionerAdmissionsReadService } from '../../application/services/practitioner-admissions-read.service';
import {
  PractitionerAdmissionsService,
  type AdmissionCaller,
} from '../../application/services/practitioner-admissions.service';
import {
  AdmissionDetailDto,
  AdmissionDocumentUrlDto,
  AdmissionListDto,
  AdmissionSweepResultDto,
  ClaimAdmissionDto,
  DecideAdmissionDto,
  ListAdmissionsQueryDto,
  ReassignAdmissionDto,
  RequestAdmissionInfoDto,
  ReviewAdmissionItemDto,
  SuspendAdmissionDto,
} from '../dto/admissions.dto';

/** El id de la petición HTTP (si es un uuid), para correlacionar la bitácora. */
export const RequestIdParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ id?: unknown }>();
    return typeof request.id === 'string' ? request.id : undefined;
  },
);

const READERS = [
  'ADMISSIONS_REVIEWER',
  'ADMISSIONS_APPROVER',
  'SECURITY_ADMIN',
];
const REVIEWERS = ['ADMISSIONS_REVIEWER', 'SECURITY_ADMIN'];
const APPROVERS = ['ADMISSIONS_APPROVER', 'SECURITY_ADMIN'];

/**
 * Admisiones: la bandeja del portal admin donde se revisa y resuelve el alta de
 * los profesionales (tipo `ALTA_DE_DOCTOR`).
 *
 * `@Roles` es la puerta gruesa; el servicio aplica la fina (rol explícito o
 * herencia de `SECURITY_ADMIN` según configuración, quien tomó la revisión,
 * cuatro ojos, nadie sobre su propia admisión). La API autoriza: ocultar un
 * botón en el portal no es seguridad.
 */
@ApiTags('admissions')
@ApiBearerAuth()
@Controller('admissions')
export class AdmissionsController {
  constructor(
    private readonly admissions: PractitionerAdmissionsService,
    private readonly reads: PractitionerAdmissionsReadService,
    private readonly documents: PractitionerAdmissionDocumentsService,
  ) {}

  private caller(user: AuthenticatedUser, requestId?: string): AdmissionCaller {
    return { user, requestId };
  }

  @Get()
  @Roles(...READERS)
  @ApiOperation({
    summary: 'Bandeja de admisiones',
    description:
      'Orden por vencimiento (`due_at`) con paginación por cursor y conteos por estado. ' +
      'La cédula va enmascarada. Para buscar por cédula, preferir `POST /admissions/search`: ' +
      'una query string queda en los logs del proxy.',
  })
  @ApiOkResponse({ type: AdmissionListDto })
  list(
    @Query() query: ListAdmissionsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdmissionListDto> {
    return this.reads.list(query, actor);
  }

  @Post('search')
  @Roles(...READERS)
  @HttpCode(HttpStatus.OK)
  @Audited({ action: 'ADMISSIONS_SEARCHED', entity: 'practitioner_admission' })
  @ApiOperation({
    summary: 'Bandeja de admisiones con los filtros en el cuerpo',
    description:
      'Igual que `GET /admissions`, pero el texto buscado (nombre, cédula, matrícula) no viaja en la URL.',
  })
  @ApiOkResponse({ type: AdmissionListDto })
  search(
    @Body() body: ListAdmissionsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdmissionListDto> {
    return this.reads.list(body, actor);
  }

  /** Declarada antes de `:id` para que `expire-sweep` no se lea como un id. */
  @Post('expire-sweep')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSIONS_EXPIRY_SWEPT',
    entity: 'practitioner_admission',
  })
  @ApiOperation({
    summary: 'Barrido de vencimientos',
    description:
      'Baja las verificaciones vencidas (y con ellas el check) y cierra por abandono las ' +
      'solicitudes sin respuesta del solicitante. Idempotente.',
  })
  @ApiOkResponse({ type: AdmissionSweepResultDto })
  expireSweep(
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionSweepResultDto> {
    return this.admissions.expireSweep(this.caller(actor, requestId));
  }

  @Get(':id')
  @Roles(...READERS)
  @AccessLogged({
    resourceType: 'PRACTITIONER_ADMISSION',
    resourceId: 'param:id',
    purpose: 'ADMISSION_REVIEW',
  })
  @ApiOperation({
    summary: 'Detalle de una admisión',
    description:
      'Datos completos del profesional (con cédula), checklist de requisitos, documentos, ' +
      'formulario enviado y bitácora. La lectura queda registrada.',
  })
  @ApiOkResponse({ type: AdmissionDetailDto })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdmissionDetailDto> {
    return this.reads.detail(id, actor);
  }

  @Post(':id/claim')
  @Roles(...REVIEWERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_CLAIMED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({ summary: 'Tomar la admisión para revisarla' })
  @ApiOkResponse({ type: AdmissionDetailDto })
  claim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClaimAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.claim(
      id,
      dto.expectedRowVersion,
      this.caller(actor, requestId),
    );
  }

  @Post(':id/release')
  @Roles(...READERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_RELEASED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({ summary: 'Soltar una revisión tomada para que otro la tome' })
  @ApiOkResponse({ type: AdmissionDetailDto })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClaimAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.release(
      id,
      dto.expectedRowVersion,
      this.caller(actor, requestId),
    );
  }

  @Post(':id/reassign')
  @Roles(...APPROVERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_REASSIGNED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({ summary: 'Pasar la revisión a otro revisor' })
  @ApiOkResponse({ type: AdmissionDetailDto })
  reassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReassignAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.reassign(
      id,
      dto.toUserId,
      dto.expectedRowVersion,
      this.caller(actor, requestId),
    );
  }

  @Post(':id/request-info')
  @Roles(...REVIEWERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_INFO_REQUESTED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({ summary: 'Pedir información al médico' })
  @ApiOkResponse({ type: AdmissionDetailDto })
  requestInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestAdmissionInfoDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.requestInfo(id, dto, this.caller(actor, requestId));
  }

  @Post(':id/items/:itemId/review')
  @Roles(...REVIEWERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_ITEM_REVIEWED',
    entity: 'practitioner_admission_review',
    entityId: 'param:itemId',
  })
  @ApiOperation({
    summary: 'Revisar un ítem del checklist',
    description:
      '`itemId` es el `id` del ítem del checklist (la revisión). VERIFIED exige la fuente ' +
      'consultada; REJECTED e INFO_REQUIRED exigen motivo. Concurrencia por ítem.',
  })
  @ApiOkResponse({ type: AdmissionDetailDto })
  reviewItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ReviewAdmissionItemDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.reviewItem(
      id,
      itemId,
      dto,
      this.caller(actor, requestId),
    );
  }

  @Post(':id/decision')
  @Roles(...APPROVERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_DECIDED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({
    summary: 'Resolver la admisión: VERIFIED o REJECTED',
    description:
      'No recibe ítems: el servidor los deriva de las revisiones. VERIFIED exige el checklist ' +
      'completo (422 ADMISSION_CHECKLIST_INCOMPLETE); REJECTED exige motivo.',
  })
  @ApiOkResponse({ type: AdmissionDetailDto })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.decide(id, dto, this.caller(actor, requestId));
  }

  @Post(':id/suspend')
  @Roles(...APPROVERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_SUSPENDED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({ summary: 'Suspender una verificación (quita el check)' })
  @ApiOkResponse({ type: AdmissionDetailDto })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.suspend(id, dto, this.caller(actor, requestId));
  }

  @Post(':id/reinstate')
  @Roles(...APPROVERS)
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_REINSTATED',
    entity: 'practitioner_admission',
    entityId: 'param:id',
  })
  @ApiOperation({
    summary: 'Reponer una verificación suspendida (devuelve el check)',
  })
  @ApiOkResponse({ type: AdmissionDetailDto })
  reinstate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendAdmissionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<AdmissionDetailDto> {
    return this.admissions.reinstate(id, dto, this.caller(actor, requestId));
  }

  @Post(':id/documents/:fileId/download-url')
  @Roles(...READERS)
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'private, no-store')
  @Audited({
    action: 'ADMISSION_DOCUMENT_URL_ISSUED',
    entity: 'file',
    entityId: 'param:fileId',
  })
  @ApiOperation({
    summary: 'URL firmada para abrir un documento de la admisión',
    description:
      'Vida de 2 minutos, atada a quien la pide y a la admisión. El archivo debe ser de ESA admisión.',
  })
  @ApiCreatedResponse({ type: AdmissionDocumentUrlDto })
  documentUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdmissionDocumentUrlDto> {
    return this.documents.issueUrl(id, fileId, actor);
  }

  @Get(':id/documents/:fileId/content')
  @Roles(...READERS)
  @AccessLogged({
    resourceType: 'PRACTITIONER_ADMISSION_DOCUMENT',
    resourceId: 'param:fileId',
    purpose: 'ADMISSION_REVIEW',
  })
  @ApiOperation({
    summary: 'Contenido de un documento de la admisión (URL firmada)',
    description:
      'Sin `Content-Type` sniffing, sin caché y con sandbox: el documento no puede ejecutar nada.',
  })
  async documentContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query('expires') expires: string | undefined,
    @Query('signature') signature: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const content = await this.documents.open(
      id,
      fileId,
      { expires, signature },
      actor,
    );
    res.setHeader('Content-Type', content.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader(
      'Content-Disposition',
      `${content.disposition}; filename*=UTF-8''${encodeURIComponent(content.fileName)}`,
    );
    res.send(content.buffer);
  }
}
