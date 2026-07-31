import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

/** Sin auth a propósito: es lo primero que un orquestador (compose/k8s) pega. */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; service: string } {
    return { status: 'ok', service: 'mock-provider-server' };
  }
}
