import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IamAuthService } from '../services';
import {
  LoginDto,
  RefreshTokenDto,
  TokenResponseDto,
  LogoutAllResultDto,
  PurgeResultDto,
} from '../dto';

/** Endpoints de sesión bajo `/iam/auth`. Capa fina sobre `IamAuthService`. */
@ApiTags('iam-auth')
@Controller('iam/auth')
export class IamAuthController {
  constructor(private readonly authService: IamAuthService) {}

  /** UC-01-04. */
  @Post('login')
  @Public()
  // Límite estricto contra fuerza bruta / credential stuffing sobre el login,
  // por encima del backstop global. El lockout por cuenta complementa este límite
  // por IP.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  login(@Body() dto: LoginDto, @Ip() ip: string): Promise<TokenResponseDto> {
    return this.authService.login(dto, ip);
  }

  /** UC-01-06. */
  @Post('token/refresh')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar el refresh token' })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto);
  }

  /** UC-01-08. */
  @Post('logout-all')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar todas las sesiones del usuario actual' })
  logoutAll(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LogoutAllResultDto> {
    return this.authService.logoutAll(actor);
  }

  /** UC-01-11. */
  @Post('sessions/purge')
  @Roles('SECURITY_ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expirar sesiones y tokens vencidos' })
  purge(@CurrentUser() actor: AuthenticatedUser): Promise<PurgeResultDto> {
    return this.authService.purgeSessions(actor);
  }
}
