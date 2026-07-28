import { Controller, Get } from '@nestjs/common';
import { Public } from './common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
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
  health(): { status: string } {
    return { status: 'ok' };
  }
}
