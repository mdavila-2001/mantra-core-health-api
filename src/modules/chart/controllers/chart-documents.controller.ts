import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ChartDocumentsService } from '../services';
import { CreateDocumentDto, DocumentResponseDto } from '../dto';

/** Endpoints de documentos gobernados del chart (`/charts/documents`). */
@ApiTags('chart-documents')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller('charts/documents')
export class ChartDocumentsController {
  constructor(private readonly documentsService: ChartDocumentsService) {}

  /** UC-15-09. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un documento con archivos gobernados' })
  createDocument(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.createDocument(dto, actor);
  }
}
