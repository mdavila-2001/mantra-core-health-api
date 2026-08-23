import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../common';
import { BoGeographySeedService } from '../../common/seed/bo-geography-seed.service';
import { BoliviaFacilitiesSeedService } from '../../common/seed/bolivia-facilities-seed.service';
import { BoliviaFeeScheduleSeedService } from '../../common/seed/bolivia-fee-schedule-seed.service';
import { BoliviaInsuranceSeedService } from '../../common/seed/bolivia-insurance-seed.service';
import { ClinicalFormsSeedService } from '../../common/seed/clinical-forms-seed.service';
import { GlossarySeedService } from '../../common/seed/glossary-seed.service';
import { ProviderAccountsSeedService } from '../../common/seed/provider-accounts-seed.service';
import { contarInsertados } from '../../common/seed/seed-bootstrap.service';
import { VademecumSeedService } from '../../common/seed/vademecum-seed.service';
import {
  buscarPaquete,
  CONTENT_PACKS,
  type ContentPackCode,
  type ContentPackDefinition,
} from './content-packs.catalog';

/** Lo que dejó una aplicación de paquete. */
export interface ContentPackResult {
  readonly code: ContentPackCode;
  /** Filas nuevas, o `null` si el paquete no reporta contadores. */
  readonly inserted: number | null;
  /** Cuánto tardó, en milisegundos. */
  readonly tookMs: number;
  /** Los contadores tal como los devolvió el seed, sin agregar. */
  readonly counters: unknown;
}

/**
 * Aplica los paquetes de contenido a demanda.
 *
 * ## Por qué reutiliza los servicios de siembra en vez de reimplementarlos
 *
 * Porque son los mismos datos y las mismas reglas. Cada uno ya es idempotente,
 * ya resuelve sus dependencias contra el catálogo y ya está probado por el
 * arranque; escribir un importador paralelo daría dos fuentes del mismo
 * contenido que se separarían en cuanto una cambiara.
 *
 * Lo que este servicio agrega es **cuándo**: antes el contenido llegaba solo, en
 * cada arranque, hubiera sido pedido o no. Ahora lo pide quien administra la
 * plataforma, cuando decide que lo quiere.
 *
 * ## Re-aplicar no es un error
 *
 * Los seeds convergen: aplicar dos veces el mismo paquete devuelve cero filas
 * nuevas la segunda. Ese cero es la respuesta —«ya estaba»— y no hace falta
 * guardar ninguna marca aparte para saberlo.
 */
@Injectable()
export class ContentPacksService {
  /**
   * Inicializa el servicio.
   *
   * @param glossary - Glosario médico.
   * @param facilities - Establecimientos de salud de Bolivia.
   * @param insurance - Aseguradoras bolivianas con sus planes.
   * @param feeSchedule - Nomenclador de procedimientos.
   * @param vademecum - Catálogo de medicamentos.
   * @param clinicalForms - Plantillas de ficha clínica.
   * @param providerAccounts - Cuentas de demostración.
   * @param geography - Departamentos de Bolivia, dependencia de las aseguradoras.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly glossary: GlossarySeedService,
    private readonly facilities: BoliviaFacilitiesSeedService,
    private readonly insurance: BoliviaInsuranceSeedService,
    private readonly feeSchedule: BoliviaFeeScheduleSeedService,
    private readonly vademecum: VademecumSeedService,
    private readonly clinicalForms: ClinicalFormsSeedService,
    private readonly providerAccounts: ProviderAccountsSeedService,
    private readonly geography: BoGeographySeedService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ContentPacksService.name);
  }

  /** El catálogo completo, para que la pantalla ofrezca qué aplicar. */
  listar(): readonly ContentPackDefinition[] {
    return CONTENT_PACKS;
  }

  /**
   * Aplica un paquete y devuelve qué dejó.
   *
   * @param code - Código del paquete.
   * @param demoPassword - Contraseña para las cuentas de demostración; se
   *   ignora en los demás paquetes.
   * @returns Los contadores de la aplicación.
   * @throws ResourceNotFoundException Si el código no existe.
   * @throws PreconditionFailedException Si el paquete necesita una contraseña
   *   que no se declaró por ningún lado.
   */
  async aplicar(
    code: string,
    demoPassword?: string,
  ): Promise<ContentPackResult> {
    const paquete = buscarPaquete(code);
    if (paquete === undefined) {
      throw new ResourceNotFoundException(
        'Paquete de contenido no encontrado',
        {
          code,
        },
      );
    }

    const desde = Date.now();
    const counters = await this.correr(paquete.code, demoPassword);
    const resultado: ContentPackResult = {
      code: paquete.code,
      inserted: contarInsertados(counters),
      tookMs: Date.now() - desde,
      counters,
    };

    this.logger.info(
      { event: 'content-pack.applied', ...resultado },
      'Paquete aplicado: ' + paquete.name,
    );
    return resultado;
  }

  /**
   * Corre el seed que corresponde al paquete.
   *
   * @param code - Código ya validado.
   * @param demoPassword - Contraseña declarada en la petición, si vino.
   * @returns Los contadores crudos del seed.
   */
  private async correr(
    code: ContentPackCode,
    demoPassword?: string,
  ): Promise<unknown> {
    switch (code) {
      case 'GLOSARIO':
        return this.glossary.run();
      case 'ESTABLECIMIENTOS_BO':
        return this.facilities.run();
      case 'ASEGURADORAS_BO':
        // Los departamentos son núcleo y ya están sembrados, pero las
        // aseguradoras declaran domicilio con uno de ellos: correrlo antes es
        // barato —converge sin insertar nada— y evita que este paquete dependa
        // de un orden que nadie escribió.
        await this.geography.run();
        return this.insurance.run();
      case 'ARANCEL_BO':
        return this.feeSchedule.run();
      case 'VADEMECUM':
        return this.vademecum.run();
      case 'FORMULARIOS_CLINICOS':
        return this.clinicalForms.run();
      case 'CUENTAS_DEMO':
        return this.correrCuentasDemo(demoPassword);
    }
  }

  /**
   * Crea las cuentas de demostración.
   *
   * La contraseña puede venir en la petición o del entorno. Sin ninguna de las
   * dos el seed no haría nada y devolvería un cero indistinguible de «ya
   * estaban»: mejor decir qué falta.
   *
   * @param demoPassword - Contraseña declarada en la petición, si vino.
   * @returns Los contadores del seed.
   */
  private async correrCuentasDemo(demoPassword?: string): Promise<unknown> {
    const password = demoPassword ?? process.env.SEED_DEMO_PASSWORD;
    if (!password) {
      throw new PreconditionFailedException(
        'Las cuentas de demostración necesitan una contraseña: declarala en la ' +
          'petición o en SEED_DEMO_PASSWORD.',
        { code: 'CUENTAS_DEMO' },
      );
    }
    return this.providerAccounts.run(password);
  }
}
