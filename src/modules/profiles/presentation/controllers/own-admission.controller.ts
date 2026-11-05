import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  type AuthenticatedUser,
  Roles,
} from '../../../../common';
import { PractitionerAdmissionSubmitService } from '../../application/services/practitioner-admission-submit.service';
import { PractitionerAdmissionsReadService } from '../../application/services/practitioner-admissions-read.service';
import {
  attestationOf,
  PractitionerAdmissionsService,
} from '../../application/services/practitioner-admissions.service';
import { OwnAdmissionDto, ResubmitAdmissionDto } from '../dto/admissions.dto';
import { RequestIdParam } from './admissions.controller';

/**
 * La verificación del propio médico: ve su estado y qué falta, reenvía o retira.
 *
 * Todas las rutas son `me`: el sujeto sale de la sesión, nunca del cuerpo ni de
 * la URL, así que nadie lee ni mueve la admisión de otro. **`@Roles()` vacío**
 * —sin rol global—, como el resto de las rutas `me` del módulo; el filtro real
 * es tener perfil profesional, que el servicio comprueba.
 */
@ApiTags('profiles-practitioner-admission')
@ApiBearerAuth()
@Controller('profiles/practitioners/me/admission')
export class OwnAdmissionController {
  constructor(
    private readonly reads: PractitionerAdmissionsReadService,
    private readonly admissions: PractitionerAdmissionsService,
    private readonly submission: PractitionerAdmissionSubmitService,
  ) {}

  @Get()
  @Roles()
  @ApiOperation({
    summary: 'Estado de mi verificación',
    description:
      'Estados, qué falta y los mensajes dirigidos al médico. Nada del personal.',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  get(@CurrentUser() actor: AuthenticatedUser): Promise<OwnAdmissionDto> {
    return this.reads.own(actor);
  }

  @Post('submit')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @Audited({ action: 'ADMISSION_SUBMITTED', entity: 'practitioner_admission' })
  @ApiOperation({
    summary: 'Enviarme a verificación',
    description:
      'Abre la solicitud de quien tiene el perfil profesional pendiente y aún no tiene ninguna. ' +
      'El cuerpo lleva la declaración: `{ attested: true, attestationVersion }`; sin ella, ' +
      '422 ADMISSION_ATTESTATION_REQUIRED. Si ya tiene solicitud: 409 ADMISSION_ALREADY_EXISTS ' +
      '(se reenvía con `resubmit`). Si el perfil no está pendiente: 422 ADMISSION_NOT_PENDING. ' +
      'Sin perfil profesional: 404 ADMISSION_NOT_FOUND.',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  submit(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: ResubmitAdmissionDto,
  ): Promise<OwnAdmissionDto> {
    return this.submission.submitOwn(actor, attestationOf(body));
  }

  @Post('resubmit')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @Audited({
    action: 'ADMISSION_RESUBMITTED',
    entity: 'practitioner_admission',
  })
  @ApiOperation({
    summary: 'Reenviar mi solicitud',
    description:
      'Sólo desde INFORMACION_REQUERIDA, RECHAZADA, EXPIRADA o ABANDONADA, con tope de reenvíos. ' +
      'El cuerpo lleva la declaración: `{ attested: true, attestationVersion }`; sin ella, ' +
      '412 ADMISSION_ATTESTATION_REQUIRED. El servidor guarda cuándo se aceptó y qué versión del texto.',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  resubmit(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: ResubmitAdmissionDto,
    @RequestIdParam() requestId?: string,
  ): Promise<OwnAdmissionDto> {
    return this.admissions.resubmit(actor, requestId, attestationOf(body));
  }

  @Post('withdraw')
  @Roles()
  @HttpCode(HttpStatus.OK)
  @Audited({ action: 'ADMISSION_WITHDRAWN', entity: 'practitioner_admission' })
  @ApiOperation({
    summary: 'Retirar mi solicitud (ENVIADA o INFORMACION_REQUERIDA)',
  })
  @ApiOkResponse({ type: OwnAdmissionDto })
  withdraw(
    @CurrentUser() actor: AuthenticatedUser,
    @RequestIdParam() requestId?: string,
  ): Promise<OwnAdmissionDto> {
    return this.admissions.withdraw(actor, requestId);
  }
}
