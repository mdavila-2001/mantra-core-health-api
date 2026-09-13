import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { DIR } from '../../modules/directory/directory.concepts';
import { Tenants } from '../../modules/directory/entities';
import {
  InsuranceCarriers,
  InsurancePlans,
  InsuranceProducts,
} from '../../modules/insurance/entities';
import { INS } from '../../modules/insurance/insurance.concepts';
import { CONCEPTS, deterministicId } from '../constants/concepts';
import {
  BOLIVIA_CARRIERS,
  BOLIVIA_HEALTH_PLANS,
  BOLIVIA_PUBLIC_INSURERS,
  carrierId,
  carrierPlanId,
  carrierProductId,
  contactChannelsOf,
} from './bolivia-insurance.catalog';

/**
 * Id determinista del tenant de una aseguradora.
 *
 * Cada compañía necesita el suyo: `insurance_carriers.tenant_id` es ÚNICO, así
 * que el modelo declara que la fila de aseguradora es la extensión aseguradora
 * de una organización, no un registro suelto. Sin tenant propio, la segunda
 * compañía que se intenta sembrar viola `uq_insurance_carriers_tenant_id`.
 */
const carrierTenantId = (code: string): string =>
  deterministicId(`seed:tenant:bo-carrier:${code}`);

/** Cuántas filas dejó cada nivel. */
export interface BoliviaInsuranceResult {
  /** Organizaciones creadas para alojar a las aseguradoras. */
  tenants: number;
  /** Aseguradoras creadas en esta pasada. */
  carriers: number;
  /** Productos de salud creados. */
  products: number;
  /** Planes creados. */
  plans: number;
}

/**
 * Materializa las aseguradoras que operan en Bolivia, con su producto de salud
 * y sus planes.
 *
 * ## Por qué existe
 *
 * El registro de procesos lo pide con estas palabras, en el alta del paciente:
 * «Cuenta con seguro salud privada… Si es si, Detalla la compañía de seguro
 * (aquí tienen que estar registrado en nuestra base de datos todas las
 * compañías de seguro que ofrecen seguro de salud, Alianza, Nacional, Bisa,
 * Fortaleza, etc.)». Y otra vez para el público: «CNS, CPS, SUS, Bancaria».
 *
 * Lo que había eran doce aseguradoras inventadas por el generador —«Aseguradora
 * Horizonte Salud Demo», «Cobertura Internacional Sandbox»— que existen para
 * que una FK tenga a dónde apuntar. Ninguna es una compañía real, así que el
 * paciente no podía declarar su seguro y el médico no podía saber con quién
 * trabaja.
 *
 * ## Por qué también siembra productos y planes
 *
 * Porque `insurance.patient_coverages.insurance_plan_id` apunta al **plan**, no
 * a la aseguradora. Cargar sólo las compañías dejaría la lista llena y la
 * cobertura igual de imposible de registrar: la cadena mínima es
 * aseguradora → producto → plan, y las tres tienen que existir.
 *
 * Los planes no se inventan: `AFI Gold`, `Oasis` y `Silver` son los que nombra
 * la propia red de Alianza, y `Salud Flexible` el de Nacional Seguros. Las
 * compañías que todavía no publicaron su red reciben un plan **base** con el
 * nombre de la compañía, que es lo honesto: existe la cobertura, no se conoce
 * su denominación comercial.
 *
 * ## Qué NO hace
 *
 * No toca las doce demo. Borrarlas rompería las filas de prueba que ya cuelgan
 * de ellas, y no es este seed quien debe decidir su destino.
 *
 * Idempotente: todo id es determinista, así que compara por id e inserta sólo
 * lo que falta. Reejecutarlo no duplica nada.
 */
@Injectable()
export class BoliviaInsuranceSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` de la aplicación.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BoliviaInsuranceSeedService.name);
  }

  /**
   * Ejecuta el seed.
   *
   * @returns Cuántas filas se insertaron en cada nivel.
   */
  async run(): Promise<BoliviaInsuranceResult> {
    this.assertUniqueCodes();

    const em = this.orm.em.fork();
    const now = new Date();

    const tenants = await this.seedTenants(em, now);
    const carriers = await this.seedCarriers(em, now);
    const products = await this.seedProducts(em, now);
    const plans = await this.seedPlans(em, now);

    const total = tenants + carriers + products + plans;
    if (total > 0) {
      this.logger.info(
        {
          operation: 'seed.bolivia-insurance',
          tenants,
          carriers,
          products,
          plans,
        },
        'Aseguradoras de Bolivia materializadas',
      );
    }
    return { tenants, carriers, products, plans };
  }

  /**
   * Rompe si dos entradas comparten código.
   *
   * Colapsarían en el mismo id determinista y una taparía a la otra sin ruido.
   * Mismo criterio que el catálogo geográfico.
   */
  private assertUniqueCodes(): void {
    const vistos = new Set<string>();
    for (const code of this.allCarriers().map((c) => c.code)) {
      if (vistos.has(code)) {
        throw new Error(
          `El catálogo de aseguradoras declara el código "${code}" más de una vez`,
        );
      }
      vistos.add(code);
    }
  }

  /** Privadas y públicas en una sola lista, que es como se siembran. */
  private allCarriers(): {
    code: string;
    legalName: string;
    sigla: string;
    address?: string;
    nit?: string;
  }[] {
    return [
      ...BOLIVIA_CARRIERS.map((c) => ({
        code: c.code,
        legalName: c.razonSocial,
        sigla: c.sigla,
        address: c.direccion,
        nit: c.nit,
      })),
      ...BOLIVIA_PUBLIC_INSURERS.map((c) => ({
        code: c.code,
        legalName: c.razonSocial,
        sigla: c.sigla,
      })),
    ];
  }

  /**
   * La organización que aloja a cada aseguradora.
   *
   * **Por qué se crean.** No es una decisión de este seed: `tenant_id` es único
   * en `insurance_carriers`, o sea que el modelo no admite dos aseguradoras en
   * la misma organización. Una compañía sin tenant sencillamente no se puede
   * representar.
   *
   * **Qué significa que existan.** No son organizaciones dadas de alta: no
   * tienen usuarios, ni sedes, ni documentación, y su estado de verificación
   * queda **pendiente** a propósito. Son el sitio donde la compañía va a
   * aterrizar el día que recorra el alta que describe el registro de procesos
   * —constitución, NIT, SEPREC, licencia, SEDES, representante legal—. Que el
   * tenant exista antes hace que ese alta *reclame* el registro en vez de crear
   * un duplicado del mismo seguro.
   *
   * La forma societaria se lee de la razón social —las nueve privadas del
   * listado terminan en «S.A.»— y no se adivina para las cajas públicas, que no
   * son sociedades comerciales y se quedan con el tipo genérico.
   */
  private async seedTenants(em: EntityManager, now: Date): Promise<number> {
    const todas = this.allCarriers();
    const existentes = await this.existingIds(
      em,
      Tenants,
      todas.map((c) => carrierTenantId(c.code)),
    );

    let creados = 0;
    for (const carrier of todas) {
      const id = carrierTenantId(carrier.code);
      if (existentes.has(id)) continue;
      em.create(
        Tenants,
        {
          id,
          code: carrier.code,
          tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PAYER,
          legalName: carrier.legalName,
          tradeName: carrier.sigla,
          legalEntityTypeConceptId: /\bS\.?A\.?$/i.test(carrier.legalName)
            ? CONCEPTS.LEGAL_ENTITY_SA
            : CONCEPTS.LEGAL_ENTITY_COMPANY,
          statusConceptId: CONCEPTS.TENANT_ACTIVE,
          // Sin verificar: nadie presentó documentación todavía. Marcarla
          // verificada sería afirmar una comprobación que no ocurrió.
          verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
          timeZone: 'America/La_Paz',
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /** Las aseguradoras. */
  private async seedCarriers(em: EntityManager, now: Date): Promise<number> {
    const todas = this.allCarriers();
    const existentes = await this.existingIds(
      em,
      InsuranceCarriers,
      todas.map((c) => carrierId(c.code)),
    );

    let creados = 0;
    for (const carrier of todas) {
      const id = carrierId(carrier.code);
      if (existentes.has(id)) continue;
      // Canales de contacto (subtarea 2.3): con fuente pública, curados a
      // mano en un dataset aparte (`contactChannelsOf`); `null` para la
      // compañía sin canal confirmado en su dominio oficial. Este seed es
      // ADD-only: no reescribe las 9 filas que ya existan en una base viva
      // — el backfill sourced de esas filas va en el patch v4.2.10.
      const canales = contactChannelsOf(carrier.code);
      em.create(
        InsuranceCarriers,
        {
          id,
          tenantId: carrierTenantId(carrier.code),
          carrierCode: carrier.code,
          legalName: carrier.legalName,
          sigla: carrier.sigla,
          address: carrier.address,
          whatsappNumber: canales.whatsapp ?? undefined,
          callCenterPhone: canales.callCenter ?? undefined,
          supportEmail: canales.supportEmail ?? undefined,
          // El NIT es el identificador con el que el regulador y la facturación
          // la reconocen; las cajas públicas no lo traen en el listado y quedan
          // sin él en vez de con uno inventado.
          regulatorIdentifier: carrier.nit,
          // Pendiente, por lo mismo que el tenant: los datos salen de un
          // listado público, no de documentación presentada por la compañía.
          verificationStatusConceptId: INS.VERIFY_PENDING,
          statusConceptId: INS.CARRIER_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /** Un producto de salud por aseguradora: es el envase que exige el plan. */
  private async seedProducts(em: EntityManager, now: Date): Promise<number> {
    const todas = this.allCarriers();
    const existentes = await this.existingIds(
      em,
      InsuranceProducts,
      todas.map((c) => carrierProductId(c.code)),
    );

    let creados = 0;
    for (const carrier of todas) {
      const id = carrierProductId(carrier.code);
      if (existentes.has(id)) continue;
      em.create(
        InsuranceProducts,
        {
          id,
          insuranceCarrierId: carrierId(carrier.code),
          productCode: `${carrier.code}_SALUD`,
          name: `Salud — ${carrier.sigla || carrier.legalName}`,
          productTypeConceptId: INS.PRODUCT_TYPE_HEALTH,
          statusConceptId: INS.PRODUCT_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /** Los planes: los que la red nombra, y uno base para todas. */
  private async seedPlans(em: EntityManager, now: Date): Promise<number> {
    // El plan BASE lo tienen **todas** las aseguradoras, también las que
    // publican planes con nombre: es la opción «no sé cuál tengo» del alta.
    // Quien está afiliado a BISA pero no recuerda si es Advance o Red Max
    // igual puede declarar su cobertura en vez de quedarse sin declararla.
    const declarados = [
      ...BOLIVIA_HEALTH_PLANS,
      ...this.allCarriers().map((c) => ({
        carrierCode: c.code,
        code: 'BASE',
        name: `Plan de salud — ${c.sigla || c.legalName}`,
      })),
    ];

    const existentes = await this.existingIds(
      em,
      InsurancePlans,
      declarados.map((p) => carrierPlanId(p.carrierCode, p.code)),
    );

    let creados = 0;
    for (const plan of declarados) {
      const id = carrierPlanId(plan.carrierCode, plan.code);
      if (existentes.has(id)) continue;
      em.create(
        InsurancePlans,
        {
          id,
          insuranceProductId: carrierProductId(plan.carrierCode),
          planCode: `${plan.carrierCode}_${plan.code}`,
          name: plan.name,
          statusConceptId: INS.PLAN_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      creados += 1;
    }
    await em.flush();
    return creados;
  }

  /**
   * Qué ids de los pedidos ya están en la base.
   *
   * Una sola consulta por nivel en vez de una por fila: el catálogo son
   * veinticinco aseguradoras y sería un ida y vuelta por cada una.
   */
  private async existingIds<T extends object>(
    em: EntityManager,
    entidad: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const filas = await em.find(
      entidad,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return new Set(filas.map((fila) => (fila as { id: string }).id));
  }
}
