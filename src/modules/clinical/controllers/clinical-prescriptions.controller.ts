import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CLINICAL_PROXY_SCOPE,
  ClinicalReadService,
} from '../services/clinical-read.service';
import { PrescriptionDocumentsService } from '../services/prescription-documents.service';

function pageNumber(
  value: string | undefined,
  fallback: number,
  maximum: number,
  minimum = 0,
): number {
  if (value === undefined) return fallback;
  if (
    !/^\d+$/.test(value) ||
    Number(value) > maximum ||
    Number(value) < minimum
  ) {
    throw new BadRequestException('Paginación inválida');
  }
  return Number(value);
}

@ApiTags('clinical-prescriptions')
@ApiBearerAuth()
@Roles('PATIENT', 'PRACTITIONER', 'CLINICIAN')
@Controller('clinical')
export class ClinicalPrescriptionsController {
  constructor(
    private readonly read: ClinicalReadService,
    private readonly documents: PrescriptionDocumentsService,
    private readonly logger: PinoLogger,
  ) {}

  @Get('patients/:patientProfileId/prescriptions')
  async list(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Query('offset') rawOffset?: string,
    @Query('limit') rawLimit?: string,
    @Res({ passthrough: true }) response?: Response,
  ) {
    await this.read.assertPuedeLeerHistoria(
      patientProfileId,
      actor,
      CLINICAL_PROXY_SCOPE.PRESCRIPTIONS_READ,
    );
    response?.setHeader('Cache-Control', 'private, no-store');
    const page = await this.documents.list(
      patientProfileId,
      pageNumber(rawOffset, 0, 1_000_000),
      pageNumber(rawLimit, 20, 100, 1),
    );
    this.logger.info(
      {
        operation: 'clinical.prescription.list',
        actorId: actor.id,
        patientProfileId,
        count: page.items.length,
      },
      'Consulta de recetas emitidas',
    );
    return page;
  }

  @Get('patients/:patientProfileId/prescriptions/history.pdf')
  async history(
    @Param('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    await this.read.assertOwnRecord(
      patientProfileId,
      actor,
      undefined,
      CLINICAL_PROXY_SCOPE.PRESCRIPTIONS_READ,
    );
    const rows = await this.documents.all(patientProfileId);
    const buffer = await this.documents.pdf(rows, 'Historial de recetas');
    this.logger.info(
      {
        operation: 'clinical.prescription.history.download',
        actorId: actor.id,
        patientProfileId,
        count: rows.length,
      },
      'Descarga de histórico de recetas',
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="historial-recetas-${new Date().toISOString().slice(0, 10)}.pdf"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(buffer);
  }

  @Get('prescriptions/:id/pdf')
  async one(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const row = await this.documents.one(id);
    try {
      await this.read.assertPuedeLeerHistoria(
        row.patientProfileId,
        actor,
        CLINICAL_PROXY_SCOPE.PRESCRIPTIONS_READ,
      );
    } catch {
      // Un ID ajeno y uno inexistente dan la misma respuesta pública.
      throw new NotFoundException('Receta emitida no encontrada');
    }
    const buffer = await this.documents.pdf([row], 'Receta médica');
    this.logger.info(
      {
        operation: 'clinical.prescription.download',
        actorId: actor.id,
        prescriptionId: id,
      },
      'Descarga de receta',
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="receta-${row.issuedAt!.toISOString().slice(0, 10)}-${id.slice(-6)}.pdf"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(buffer);
  }
}
