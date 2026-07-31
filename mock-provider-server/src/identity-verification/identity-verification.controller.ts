import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/api-key.guard';
import { IdentityVerificationService } from './identity-verification.service';
import {
  ExecuteIdentityVerificationDto,
  ExecuteIdentityVerificationResponseDto,
  VerifyIdentityVerificationDto,
  VerifyIdentityVerificationResponseDto,
} from './identity-verification.dto';

@ApiTags('identity-verification')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly service: IdentityVerificationService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encolar una verificación de identidad ante la autoridad (emulado)',
    description:
      'Acepta la solicitud al instante y NO devuelve el veredicto: hay que consultarlo en /verify, que responde PENDING hasta que pasa IDENTITY_VERIFICATION_DELAY_MS.',
  })
  execute(
    @Body() dto: ExecuteIdentityVerificationDto,
  ): Promise<ExecuteIdentityVerificationResponseDto> {
    return this.service.execute(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar el veredicto de una verificación encolada (emulado)',
    description:
      'PENDING mientras la autoridad resuelve; después ACCEPTED o REJECTED, siempre el mismo para la misma solicitud.',
  })
  verify(
    @Body() dto: VerifyIdentityVerificationDto,
  ): Promise<VerifyIdentityVerificationResponseDto> {
    return this.service.verify(dto);
  }
}
