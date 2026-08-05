import { Injectable } from '@nestjs/common';

/**
 * Orquesta las reglas de negocio de app.
 */
@Injectable()
export class AppService {
  /**
   * Obtiene get hello.
   * @returns Resultado de get hello conforme al contrato `string`.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
