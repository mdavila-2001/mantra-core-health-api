import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotAudited, Public, TenantAgnostic } from '../../../../common';
import {
  IamOnboardingDraftsService,
  ONBOARDING_DRAFT_SECRET_HEADER,
  type OnboardingDraftPayload,
  type SaveOnboardingDraftResult,
} from '../../application/services/iam-onboarding-drafts.service';

const SECRET_HEADER_DOC = {
  name: 'X-Onboarding-Draft-Secret',
  required: false,
  description:
    'Secreto del borrador, devuelto una sola vez en `draftSecret` por el PUT que lo crea. Obligatorio en GET y DELETE, y en el PUT que actualiza; sin él, el PUT sólo crea.',
} as const;

const NOT_FOUND_DOC =
  'Borrador inexistente, vencido, id mal formado, o secreto ausente o erróneo (la respuesta es la misma en todos los casos).';

@ApiTags('iam-onboarding-drafts')
@Controller('iam/onboarding-drafts')
export class IamOnboardingDraftsController {
  constructor(private readonly service: IamOnboardingDraftsService) {}

  @Get(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiHeader(SECRET_HEADER_DOC)
  @ApiNotFoundResponse({ description: NOT_FOUND_DOC })
  @ApiOperation({
    summary:
      'Recupera un borrador de alta guardado por identificador y tipo de formulario',
  })
  getDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
    @Headers(ONBOARDING_DRAFT_SECRET_HEADER) secret?: string,
  ): OnboardingDraftPayload {
    return this.service.getDraft(formType, draftId, secret);
  }

  @NotAudited(
    'Pública y sin actor (audit_log.user_id es NOT NULL); el borrador de alta vive sólo en la memoria del proceso, sin fila en Postgres.',
  )
  @Put(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiHeader(SECRET_HEADER_DOC)
  @ApiNotFoundResponse({ description: NOT_FOUND_DOC })
  @ApiOperation({
    summary: 'Guarda o actualiza el avance del formulario de alta en borrador',
    description:
      'Sin cabecera de secreto crea el borrador y devuelve `draftSecret` una sola vez; con el secreto correcto lo actualiza. Cuerpo máximo 64 KiB; hay topes de borradores totales y por origen.',
  })
  saveDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
    @Body() payload: OnboardingDraftPayload,
    @Ip() ip: string,
    @Headers(ONBOARDING_DRAFT_SECRET_HEADER) secret?: string,
  ): SaveOnboardingDraftResult {
    return this.service.saveDraft(formType, draftId, payload, secret, ip);
  }

  @NotAudited(
    'Pública y sin actor (audit_log.user_id es NOT NULL); el borrador de alta vive sólo en la memoria del proceso, sin fila en Postgres.',
  )
  @Delete(':formType/:draftId')
  @Public()
  @TenantAgnostic()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiHeader(SECRET_HEADER_DOC)
  @ApiNotFoundResponse({ description: NOT_FOUND_DOC })
  @ApiOperation({
    summary:
      'Elimina el borrador al completar el alta exitosamente o por descarte del usuario',
  })
  deleteDraft(
    @Param('formType') formType: string,
    @Param('draftId') draftId: string,
    @Headers(ONBOARDING_DRAFT_SECRET_HEADER) secret?: string,
  ): { ok: boolean } {
    return this.service.deleteDraft(formType, draftId, secret);
  }
}
