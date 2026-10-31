import { Body, Controller, HttpStatus, Ip, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Audited,
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../common';
import { SupportPatientRegistrationService } from '../services';
import {
  RegisterSupportPatientDto,
  SupportPatientRegistrationResponseDto,
} from '../dto';

/**
 * Alta rápida de pacientes por la persona de apoyo. La organización viene en el
 * cuerpo (`tenantId` u `org`) y la política la contrasta con los vínculos de la
 * persona: puede asistir a varias organizaciones, así que no hay tenant activo.
 */
@ApiTags('delegated-access-support-patients')
@ApiBearerAuth()
@Controller()
export class SupportPatientsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param registration - Alta de pacientes del personal de apoyo.
   */
  constructor(
    private readonly registration: SupportPatientRegistrationService,
  ) {}

  /**
   * Registra a un paciente nuevo. Responde 201 `CREATED` con el paciente, o 200
   * `POSSIBLE_DUPLICATES` con los parecidos y sin crear nada; con
   * `acknowledgeDuplicates` crea igual (salvo que el documento ya esté registrado).
   * El paciente nace sin verificar y un representante de menor queda pendiente
   * de verificación (`guardian`): el mostrador no crea representaciones legales.
   */
  @Audited({ action: 'SUPPORT_PATIENT_REGISTERED', entity: 'patient' })
  @Post('me/support-patients')
  @TenantAgnostic()
  @ApiOperation({
    summary: 'Registrar un paciente nuevo (con aviso de posibles duplicados)',
  })
  async register(
    @Body() dto: RegisterSupportPatientDto,
    @CurrentUser() actor: AuthenticatedUser,
    // `@Ip()` ya respeta `TRUST_PROXY_HOPS`: cuenta para el tope por IP.
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SupportPatientRegistrationResponseDto> {
    const body = await this.registration.register(dto, actor, ip);
    res.status(body.outcome === 'CREATED' ? HttpStatus.CREATED : HttpStatus.OK);
    return body;
  }
}
