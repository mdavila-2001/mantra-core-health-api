import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { CatalogRepository } from '../../insurance/repositories';
import { INS } from '../../insurance/insurance.concepts';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import {
  TERRITORIAL_TENANT_TYPES,
  type TenantTypeCode,
} from '../directory.concepts';
import type { BrokerProfileDto, PayerProfileDto } from '../dto';

/** Datos por tipo que acompañan al alta de un tenant. */
export interface TenantTypeProfileInput {
  /**
   * Tipo elegido para el tenant. Es obligatorio en el alta.
   */
  tenantType: TenantTypeCode;
  /**
   * Razón social, que se replica en la fila del tipo.
   */
  legalName: string;
  /**
   * País declarado; obligatorio para `PROVIDER`.
   */
  countryConceptId?: string;
  /**
   * Jurisdicción declarada; obligatoria para `PROVIDER`.
   */
  jurisdictionConceptId?: string;
  /**
   * Datos de aseguradora; obligatorios para `PAYER`.
   */
  payer?: PayerProfileDto;
  /**
   * Datos de corredor; obligatorios para `BROKER`.
   */
  broker?: BrokerProfileDto;
}

/**
 * Hace cumplir el contrato "un tenant declara su tipo y aporta lo que ese tipo
 * exige", y materializa la fila específica del tipo.
 *
 * Sin esto, elegir `PAYER` no producía ninguna aseguradora ni `BROKER` ningún
 * corredor: el tenant quedaba etiquetado con un tipo que no se sostenía en
 * ninguna parte del modelo, y el primer siniestro o la primera comisión
 * fallaban por una fila que nadie llegó a crear. Un `PROVIDER` no tiene tabla
 * propia —opera a través de sus sedes y servicios— pero sí necesita país y
 * jurisdicción, que es lo que determina bajo qué regulador presta atención.
 *
 * La validación va aquí y no sólo en los DTO porque las tres puertas de alta
 * (auto-registro público, aprovisionamiento administrativo y sub-tenant)
 * comparten la regla: dejarla en cada DTO invitaría a que una de ellas se
 * quedase atrás.
 */
@Injectable()
export class TenantTypeProfileService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogRepo - Repositorio del catálogo de seguros (carriers/brokers).
   * @param conceptsRepo - Catálogo de terminología, para validar los `*ConceptId` declarados.
   */
  constructor(
    private readonly catalogRepo: CatalogRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
  ) {}

  /**
   * Verifica que el bloque aportado corresponda al tipo declarado.
   *
   * Se comprueba antes de escribir nada: un alta a la que le falta el bloque de
   * su tipo, o que trae el de otro, es un error del cliente, no un tenant a
   * medias que alguien tendrá que reparar después.
   *
   * @param input - Tipo declarado y datos que lo acompañan.
   * @throws PreconditionFailedException si falta el bloque del tipo o sobra otro.
   */
  assertProfileMatchesType(input: TenantTypeProfileInput): void {
    const { tenantType } = input;

    if (tenantType === 'PAYER' && !input.payer) {
      throw new PreconditionFailedException(
        'Un tenant de tipo PAYER exige el bloque `payer`',
        { tenantType },
      );
    }
    if (tenantType === 'BROKER' && !input.broker) {
      throw new PreconditionFailedException(
        'Un tenant de tipo BROKER exige el bloque `broker`',
        { tenantType },
      );
    }
    // Todos los tipos territoriales —prestador, universidad, farmacia y las
    // cuatro institucionales— deben decir dónde operan: es lo que determina bajo
    // qué regulador lo hacen. Los de seguros no, porque su regulador viaja en su
    // propio bloque.
    if (TERRITORIAL_TENANT_TYPES.includes(tenantType)) {
      const missing = [
        input.countryConceptId ? undefined : 'countryConceptId',
        input.jurisdictionConceptId ? undefined : 'jurisdictionConceptId',
      ].filter(Boolean);
      if (missing.length > 0) {
        throw new PreconditionFailedException(
          `Un tenant de tipo ${tenantType} exige país y jurisdicción`,
          { tenantType, missing },
        );
      }
    }

    if (tenantType !== 'PAYER' && input.payer) {
      throw new PreconditionFailedException(
        'El bloque `payer` sólo corresponde a un tenant de tipo PAYER',
        { tenantType },
      );
    }
    if (tenantType !== 'BROKER' && input.broker) {
      throw new PreconditionFailedException(
        'El bloque `broker` sólo corresponde a un tenant de tipo BROKER',
        { tenantType },
      );
    }
  }

  /**
   * Campos `*ConceptId` que el alta declara, con el nombre que usa el cliente.
   *
   * Se devuelven etiquetados porque el error tiene que decir **cuál** de los cuatro está mal:
   * son todos uuid y a simple vista no se distinguen.
   *
   * @param input - Tipo declarado y datos que lo acompañan.
   * @returns Mapa `campo -> id declarado`, incluidos los que no vienen.
   */
  declaredConcepts(
    input: TenantTypeProfileInput,
  ): Record<string, string | undefined> {
    return {
      countryConceptId: input.countryConceptId,
      jurisdictionConceptId: input.jurisdictionConceptId,
      'payer.jurisdictionConceptId': input.payer?.jurisdictionConceptId,
      'broker.jurisdictionConceptId': input.broker?.jurisdictionConceptId,
    };
  }

  /**
   * Verifica que los conceptos declarados existan en el catálogo de terminología.
   *
   * Las columnas `*ConceptId` son FK contra `terminology.catalog_concepts`, así que un uuid
   * inexistente no se descubre hasta el INSERT: Postgres tira la violación de constraint y el
   * alta muere con un 500 «Error interno del servidor» que no nombra el campo culpable. Es el
   * mismo criterio que ya se aplicaba al código de tenant y al correo del owner —comprobar
   * antes de escribir— extendido a la otra familia de FK que el cliente puede equivocar.
   *
   * Y equivocarla es lo normal, no la excepción: el catálogo no está publicado en ninguna
   * parte, los ids se descubren con `GET /terminology/concepts?q=…`, y hay casi 300 campos
   * así en el contrato.
   *
   * Una sola query para todos los ids: pedirlos de a uno sería N+1 sobre la tabla más
   * consultada del catálogo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param declared - Mapa `campo -> id declarado`; los `undefined` se ignoran.
   * @throws PreconditionFailedException si alguno no existe, nombrando cuáles.
   */
  async assertConceptsExist(
    em: EntityManager,
    declared: Record<string, string | undefined>,
  ): Promise<void> {
    const present = Object.entries(declared).filter(
      (entry): entry is [string, string] => Boolean(entry[1]),
    );
    if (present.length === 0) return;

    const found = await this.conceptsRepo.findByIds(
      em,
      present.map(([, id]) => id),
    );
    const unknown = present
      .filter(([, id]) => !found.has(id))
      .map(([field, id]) => ({ field, conceptId: id }));

    if (unknown.length > 0) {
      throw new PreconditionFailedException(
        'Los conceptos declarados no existen en el catálogo de terminología',
        {
          unknown,
          hint: 'Descubrirlos con GET /terminology/concepts?q=…',
        },
      );
    }
  }

  /**
   * Materializa la fila propia del tipo dentro de la transacción del alta.
   *
   * Nace con `VERIFY_PENDING` por la misma razón que el tenant nace PENDIENTE:
   * declarar que se es aseguradora o corredor no equivale a estarlo; quien lo
   * contrasta es la plataforma.
   *
   * @param tx - Transacción activa del alta del tenant.
   * @param tenantId - Tenant recién creado.
   * @param input - Tipo declarado y datos que lo acompañan.
   * @param actorUserId - Actor al que se imputa la escritura.
   * @returns Id de la fila creada, o `undefined` si el tipo no tiene tabla propia.
   */
  materializeProfile(
    tx: EntityManager,
    tenantId: string,
    input: TenantTypeProfileInput,
    actorUserId: string,
  ): string | undefined {
    if (input.tenantType === 'PAYER' && input.payer) {
      const carrier = this.catalogRepo.createCarrier(tx, {
        tenantId,
        carrierCode: input.payer.carrierCode,
        legalName: input.legalName,
        sigla: input.payer.sigla,
        address: input.payer.address,
        regulatorIdentifier: input.payer.regulatorIdentifier,
        jurisdictionConceptId: input.payer.jurisdictionConceptId,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.CARRIER_ACTIVE,
        actorUserId,
      });
      return carrier.id;
    }

    if (input.tenantType === 'BROKER' && input.broker) {
      const broker = this.catalogRepo.createBroker(tx, {
        tenantId,
        brokerCode: input.broker.brokerCode,
        legalName: input.legalName,
        licenseNumber: input.broker.licenseNumber,
        jurisdictionConceptId: input.broker.jurisdictionConceptId,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.BROKER_ACTIVE,
        actorUserId,
      });
      return broker.id;
    }

    // PROVIDER no tiene fila propia: su realidad operativa son las sedes y los
    // servicios de salud, que se crean después con su propio caso de uso.
    return undefined;
  }
}
