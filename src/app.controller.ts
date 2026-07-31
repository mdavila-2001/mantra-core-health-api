import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common';
import { AppService } from './app.service';

/**
 * Expone las operaciones HTTP de app.
 */
@Controller()
@ApiTags('app')
export class AppController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param appService - Valor de app service requerido por la operación.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Obtiene get hello.
   * @returns Resultado de get hello conforme al contrato `string`.
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Saludo raíz de verificación de despliegue' })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Sonda de liveness pública para orquestadores (k8s/ECS). No exige JWT ni toca
   * la base: responde 200 mientras el proceso esté vivo y aceptando peticiones.
   * La readiness con verificación de base de datos queda pendiente (ver roadmap).
   */
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Sonda de liveness (sin autenticación)' })
  health(): {
    /**
     * Valor de status mantenido por la instancia.
     */
    status: string;
  } {
    return { status: 'ok' };
  }
}
