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
import { ResearchReleaseService } from '../services';
import {
  DefineCohortDto,
  CohortResponseDto,
  RequestDatasetReleaseDto,
  ReleaseRequestResponseDto,
  ApproveDatasetReleaseDto,
  ReleaseManifestResponseDto,
  RevokeDatasetReleaseDto,
  RevokeReleaseResponseDto,
} from '../dto';

/**
 * Investigación (UC-63-09 … 12): proyectos, cohortes y releases de-identificados
 * con caducidad.
 *
 * Cuelga de `/research` y no de `/lakehouse` porque así lo declara el caso de uso:
 * lo que gobierna aquí no es el almacenamiento sino el acceso a datos de pacientes
 * con fines de investigación.
 */
@ApiTags('lakehouse')
@ApiBearerAuth()
@Controller('research')
export class ResearchController {
  constructor(private readonly releaseService: ResearchReleaseService) {}

  /** UC-63-09. */
  @Post('projects/:id/cohorts')
  @Roles('PRINCIPAL_INVESTIGATOR', 'RESEARCH_GOVERNANCE', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir el proyecto de investigación y su cohorte',
    description:
      'Upsert del proyecto y alta de la cohorte; la ventana de aprobación ética tiene que estar vigente.',
  })
  defineCohort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefineCohortDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CohortResponseDto> {
    return this.releaseService.defineCohort(id, dto, actor);
  }

  /** UC-63-10. */
  @Post('dataset-releases')
  @Roles('PRINCIPAL_INVESTIGATOR', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar el release de un dataset para investigación',
    description:
      'Se comprueba la ventana ética al solicitar; un producto con PHI exige que la cohorte declare perfil de de-identificación.',
  })
  requestRelease(
    @Body() dto: RequestDatasetReleaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReleaseRequestResponseDto> {
    return this.releaseService.requestRelease(dto, actor);
  }

  /** UC-63-11. */
  @Post('dataset-releases/:id/approve')
  @Roles('RESEARCH_GOVERNANCE', 'DPO', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aprobar y materializar el manifiesto de-identificado',
    description:
      'Corrida de de-identificación, manifiesto y cambio de estado en la misma transacción. El acceso caduca, y nunca sobrevive a la aprobación ética.',
  })
  approveRelease(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDatasetReleaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReleaseManifestResponseDto> {
    return this.releaseService.approveRelease(id, dto, actor);
  }

  /** UC-63-12. */
  @Post('dataset-releases/:id/revoke')
  @Roles('RESEARCH_GOVERNANCE', 'DPO', 'SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expirar o revocar el release',
    description:
      'Los dos cierres se distinguen: uno es el fin del plazo y el otro una decisión.',
  })
  revokeRelease(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeDatasetReleaseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RevokeReleaseResponseDto> {
    return this.releaseService.revokeRelease(id, dto, actor);
  }
}
