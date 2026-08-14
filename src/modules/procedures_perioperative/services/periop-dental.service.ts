import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services';
import { CLIN } from '../../clinical/clinical.concepts';
import { PeriopDentalRepository } from '../repositories';
import {
  DENTAL_PROCEDURE_CODE_KEYS,
  DENTAL_QUADRANT_KEYS,
  DENTAL_SITE_CONCEPT_IDS,
  DENTAL_TOOTH_KEYS,
  PERIOP,
  PROCEDURES_PERIOPERATIVE_CONCEPT_SEEDS,
} from '../procedures_perioperative.concepts';
import {
  CreateDentalProcedureDto,
  DentalCatalogDto,
  DentalCatalogEntryDto,
  DentalProcedureDto,
  DentalProcedureListDto,
  DentalProcedureResponseDto,
  ListDentalProceduresQueryDto,
} from '../dto';

/** Tope por defecto del histórico, el mismo que usa la agenda quirúrgica. */
const DEFAULT_LIMIT = 50;

/**
 * Histórico odontológico: alta y lectura (punto 7 del reclamo).
 *
 * ## Un procedimiento odontológico es un procedimiento clínico
 *
 * No hay tabla propia y no hace falta: se escribe en `clinical.procedures` con
 * `category_concept_id = PERIOP.DENTAL_PROCEDURE_CATEGORY`, y la pieza tratada
 * va en `procedures_perioperative.procedure_body_sites`, que ya cuelga de esa
 * tabla. La categoría es lo que separa el histórico odontológico del resto de
 * los procedimientos de la persona, y es un filtro indexable, no una convención
 * de texto.
 *
 * Lo que esto **no** es: un odontograma. No hay estado por pieza ni evolución
 * de superficies; hay un histórico de qué se hizo, sobre qué pieza, quién y
 * cuándo, que es lo que el punto pedía. Un odontograma se construye encima de
 * esto sin migrar nada, porque la pieza ya es un concepto y no un texto.
 *
 * ## La escritura se vuelve a leer
 *
 * Es la condición que este repositorio le exige a un formulario: `record()`
 * escribe lo que `listByPatient()` devuelve, y la pantalla que registra es la
 * misma que muestra el histórico. No se agregó ningún alta cuyo resultado no se
 * pueda ver después.
 */
@Injectable()
export class PeriopDentalService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dentalRepo - Valor de dental repo requerido por la operación.
   * @param auditTrail - Valor de audit trail requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly dentalRepo: PeriopDentalRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PeriopDentalService.name);
  }

  /**
   * Registra un procedimiento odontológico ya realizado.
   *
   * El estado es «completado» y no se pide: este endpoint registra lo que se
   * hizo, no lo que se planifica. Planificar un tratamiento es una orden
   * (`clinical.service_requests`) y tiene su propio flujo.
   *
   * @param dto - Cuerpo validado de la petición.
   * @param tenantId - Organización que custodia el registro.
   * @param actor - Sujeto autenticado que ejecuta la operación.
   * @returns El procedimiento creado.
   */
  async record(
    dto: CreateDentalProcedureDto,
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<DentalProcedureResponseDto> {
    // El sitio se valida contra el catálogo sembrado y no sólo contra la clave
    // foránea: sin esto, cualquier concepto del catálogo transversal —un estado
    // de usuario, un tipo de evento— entraría como «pieza tratada» y la base lo
    // aceptaría, porque la FK sólo exige que el concepto exista.
    if (
      dto.toothSiteConceptId !== undefined &&
      !DENTAL_SITE_CONCEPT_IDS.has(dto.toothSiteConceptId)
    ) {
      throw new PreconditionFailedException(
        'El sitio tiene que ser una pieza dentaria o un cuadrante del catálogo odontológico',
        { toothSiteConceptId: dto.toothSiteConceptId },
      );
    }

    // Sin pieza no hay detalle de pieza que registrar: aceptarlo dejaría una
    // cara tratada colgando de ningún diente.
    if (dto.siteDetail !== undefined && dto.toothSiteConceptId === undefined) {
      throw new PreconditionFailedException(
        'No se puede precisar la cara tratada sin decir sobre qué pieza',
        { siteDetail: dto.siteDetail },
      );
    }

    const performerProfileId =
      dto.performerProfileId ?? actor.practitionerProfileId;

    this.logger.info(
      {
        operation: 'periop.dental.record',
        patientProfileId: dto.patientProfileId,
      },
      'Recording dental procedure',
    );

    return this.em.transactional(async (tx) => {
      const procedure = this.dentalRepo.createProcedure(tx, {
        custodianTenantId: tenantId,
        patientProfileId: dto.patientProfileId,
        codeConceptId: dto.procedureCodeConceptId,
        categoryConceptId: PERIOP.DENTAL_PROCEDURE_CATEGORY,
        statusConceptId: CLIN.PROCEDURE_COMPLETED,
        performerProfileId,
        encounterId: dto.encounterId,
        noteText: dto.noteText,
        performedAt:
          dto.performedAt === undefined
            ? new Date()
            : new Date(dto.performedAt),
        actorUserId: actor.id,
      });
      // El sitio se crea tras flushear el procedimiento: `procedure_id` es una
      // clave foránea y las columnas uuid planas de este modelo no le dicen a
      // MikroORM en qué orden insertar.
      await tx.flush();

      if (dto.toothSiteConceptId !== undefined) {
        this.dentalRepo.createSite(tx, {
          procedureId: procedure.id,
          bodySiteConceptId: dto.toothSiteConceptId,
          roleConceptId: PERIOP.DENTAL_SITE_ROLE,
          description: dto.siteDetail,
        });
        await tx.flush();
      }

      await this.auditTrail.record(tx, actor, {
        action: 'DENTAL_PROCEDURE_RECORDED',
        entity: 'procedure',
        entityId: procedure.id,
        tenantId,
      });

      this.logger.info(
        { operation: 'periop.dental.record', procedureId: procedure.id },
        'Dental procedure recorded',
      );

      return {
        id: procedure.id,
        patientProfileId: procedure.patientProfileId,
        statusConceptId: procedure.statusConceptId,
        createdAt: procedure.createdAt,
      };
    });
  }

  /**
   * Histórico odontológico de una persona, del tratamiento más reciente al más
   * antiguo.
   *
   * Devuelve `total` además de la página porque un histórico clínico recortado
   * en silencio se lee como «no hay más antecedentes», que es lo contrario de
   * lo que pasó.
   *
   * @param query - Filtros validados de la petición.
   * @returns La página del histórico y el total sin paginar.
   */
  async listByPatient(
    query: ListDentalProceduresQueryDto,
  ): Promise<DentalProcedureListDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const category = PERIOP.DENTAL_PROCEDURE_CATEGORY;

    const [procedures, total] = await Promise.all([
      this.dentalRepo.findByPatient(
        this.em,
        query.patientProfileId,
        category,
        limit,
      ),
      this.dentalRepo.countByPatient(this.em, query.patientProfileId, category),
    ]);

    const sites = await this.dentalRepo.findSitesByProcedures(
      this.em,
      procedures.map((procedure) => procedure.id),
    );
    const sitesByProcedure = new Map<string, DentalProcedureDto['sites']>();
    for (const site of sites) {
      const row = {
        id: site.id,
        bodySiteConceptId: site.bodySiteConceptId,
        description: site.description,
      };
      const group = sitesByProcedure.get(site.procedureId);
      if (group) {
        group.push(row);
      } else {
        sitesByProcedure.set(site.procedureId, [row]);
      }
    }

    return {
      items: procedures.map((procedure) => ({
        id: procedure.id,
        patientProfileId: procedure.patientProfileId,
        procedureCodeConceptId: procedure.codeConceptId,
        statusConceptId: procedure.statusConceptId,
        performerProfileId: procedure.performerProfileId,
        encounterId: procedure.encounterId,
        noteText: procedure.noteText,
        performedAt: procedure.performedAt,
        createdAt: procedure.createdAt,
        sites: sitesByProcedure.get(procedure.id) ?? [],
      })),
      total,
    };
  }

  /**
   * El catálogo odontológico: qué se puede registrar y sobre qué pieza.
   *
   * Se sirve desde el seed y no desde la base porque es exactamente el seed: son
   * conceptos con identificador determinista, y leerlos de
   * `terminology.catalog_concepts` daría lo mismo a cambio de una consulta. La
   * alternativa que esto evita es peor: que el frontend lleve los UUID escritos
   * a mano y quede desincronizado del día que se agregue un código.
   *
   * @returns Códigos de procedimiento, piezas y cuadrantes con su etiqueta.
   */
  catalog(): DentalCatalogDto {
    return {
      procedureCodes: DENTAL_PROCEDURE_CODE_KEYS.map(entradaDelCatalogo),
      teeth: DENTAL_TOOTH_KEYS.map(entradaDelCatalogo),
      quadrants: DENTAL_QUADRANT_KEYS.map(entradaDelCatalogo),
    };
  }
}

/**
 * Los códigos y etiquetas del seed, indexados por su clave lógica.
 *
 * `defineModuleConcepts` devuelve los identificadores por clave y las etiquetas
 * por posición en `seeds`; este índice une las dos mitades una sola vez, en
 * carga, en vez de recorrer el arreglo por cada entrada del catálogo.
 */
const SEED_BY_KEY = new Map(
  PROCEDURES_PERIOPERATIVE_CONCEPT_SEEDS.map((seed) => [seed.key, seed]),
);

/** Una entrada del catálogo a partir de su clave lógica. */
function entradaDelCatalogo(key: keyof typeof PERIOP): DentalCatalogEntryDto {
  const seed = SEED_BY_KEY.get(`procedures_perioperative:${String(key)}`);
  return {
    conceptId: PERIOP[key],
    code: seed?.code ?? String(key),
    display: seed?.display ?? String(key),
  };
}
