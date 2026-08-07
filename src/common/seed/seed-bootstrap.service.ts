import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { BootstrapAdminSeedService } from './bootstrap-admin-seed.service';
import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { MessagingSeedService } from './messaging-seed.service';
import { TerminologySeedService } from './terminology-seed.service';

/** Ejecuta los seeds estructurales en un orden explícito y determinista. */
@Injectable()
export class SeedBootstrapService implements OnApplicationBootstrap {
  /**
   * Inicializa el orquestador.
   *
   * @param terminology - Catálogo padre de todos los conceptos.
   * @param dynamicEnums - Conjuntos de valores y amarres campo -> enumeración.
   * @param messaging - Datos estructurales de mensajería.
   * @param identityVerification - Datos estructurales de identidad.
   * @param bootstrapAdmin - Primer `SECURITY_ADMIN`, si el entorno lo pide.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly terminology: TerminologySeedService,
    private readonly dynamicEnums: DynamicEnumSeedService,
    private readonly messaging: MessagingSeedService,
    private readonly identityVerification: IdentityVerificationSeedService,
    private readonly bootstrapAdmin: BootstrapAdminSeedService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeedBootstrapService.name);
  }

  /** Materializa primero los conceptos y luego los dominios dependientes. */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.terminology.run();
    } catch (error) {
      this.logger.warn(
        { err: error },
        'Seeds estructurales omitidos: catálogo de terminología no disponible',
      );
      return;
    }

    // Va inmediatamente después del catálogo porque sus miembros y opciones son
    // FK a los conceptos que aquél acaba de materializar, y porque sin él ningún
    // formulario puede poblar sus campos de catálogo.
    await this.runDependent(
      'enumeraciones dinámicas',
      this.dynamicEnums.run.bind(this.dynamicEnums),
    );
    await this.runDependent(
      'mensajería',
      this.messaging.run.bind(this.messaging),
    );
    await this.runDependent(
      'verificación de identidad',
      this.identityVerification.run.bind(this.identityVerification),
    );
    // Va el último a propósito: el alta del administrador referencia conceptos
    // de estado y el tenant por defecto, que los sembra el catálogo.
    await this.runDependent(
      'administrador de arranque',
      this.bootstrapAdmin.run.bind(this.bootstrapAdmin),
    );
  }

  /** Ejecuta un seed dependiente sin ocultar el fallo en observabilidad. */
  private async runDependent(
    name: string,
    run: () => Promise<unknown>,
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.logger.warn({ err: error, seed: name }, 'Seed dependiente omitido');
    }
  }
}
