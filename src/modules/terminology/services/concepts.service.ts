import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
  ConceptDesignationsRepository,
  ConceptRelationshipsRepository,
  ValueSetsRepository,
} from '../repositories';
import {
  type CreateDesignationDto,
  type DesignationResponseDto,
  type CreateRelationshipDto,
  type RelationshipResponseDto,
  type UpsertConceptPropertiesDto,
  type ConceptPropertiesResponseDto,
  type DeprecateConceptDto,
  type DeprecateConceptResponseDto,
  type DesignationLanguage,
  type LookupResponseDto,
  type ConceptDetailDto,
  type ConceptValueSetRefDto,
  type ConceptCategoryRefDto,
  type ConceptTaxonomyRefDto,
  type ConceptTextDto,
  type ConceptRelationDto,
  SearchConceptsResponseDto,
} from '../dto';
import {
  LANGUAGE_CONCEPT_BY_CODE,
  definitionPropertyCode,
} from '../terminology.constants';
import {
  GLOSSARY_CATEGORY_PREFIX,
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_RELATION_TYPE_CONCEPT_IDS,
  GLOSSARY_SLUG_PROPERTY_CODE,
  GLOSSARY_TAG_PREFIX,
  GLOSSARY_ALL_TERMS_CODE,
  glossaryRelationTypeFromConceptId,
  glossaryStatusOf,
  isGlossaryValueSetCode,
  type GlossaryBilingualText,
} from '../glossary.constants';

/** Tipo de dato por defecto para propiedades de concepto sin `dataType` explícito. */
const DEFAULT_PROPERTY_DATA_TYPE = 'string';

/** Idioma por defecto de los textos del glosario cuando no se pide uno explícito. */
const DEFAULT_GLOSSARY_LANGUAGE: DesignationLanguage = 'ES';

/** Qué se le pide de más a la búsqueda, sobre los filtros de siempre. */
export interface ConceptReadOptions {
  /**
   * Idioma preferido de `display` y `definition`.
   *
   * Ausente significa **exactamente lo de siempre**: los textos del sistema de
   * codificación, sin tocar. Es la garantía de retrocompatibilidad de esta
   * lectura, que consumen la agenda, el perfil profesional, los diagnósticos y
   * la ficha clínica.
   */
  readonly language?: DesignationLanguage;
  /** Si cada concepto debe traer los conjuntos de valores a los que pertenece. */
  readonly includeValueSets?: boolean;
  /**
   * Acota a los conceptos que pertenecen a un conjunto de valores.
   *
   * Es «navegar por categoría» dicho como filtro. La alternativa era `$expand`,
   * que devuelve los miembros crudos —sin traducir, sin sus otras etiquetas y
   * con su propia paginación—: dos lecturas distintas para la misma pantalla,
   * que se verían distinto.
   */
  readonly valueSetId?: string;
}

/**
 * Reglas de negocio sobre conceptos ya existentes: alta de designaciones (y
 * propiedades) (UC-03-05), relaciones entre conceptos (UC-03-06), retirada
 * (UC-03-10) y resolución `$lookup` (UC-03-11).
 */
@Injectable()
export class ConceptsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conceptsRepo - Valor de concepts repo requerido por la operación.
   * @param designationsRepo - Valor de designations repo requerido por la operación.
   * @param relationshipsRepo - Valor de relationships repo requerido por la operación.
   * @param valueSetsRepo - Valor de value sets repo requerido por la operación.
   * @param codeSystemsRepo - Valor de code systems repo requerido por la operación.
   * @param versionsRepo - Valor de versions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly designationsRepo: ConceptDesignationsRepository,
    private readonly relationshipsRepo: ConceptRelationshipsRepository,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly codeSystemsRepo: CodeSystemsRepository,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConceptsService.name);
  }

  /** UC-03-05: añade una designación (y opcionalmente propiedades) a un concepto. */
  async addDesignation(
    conceptId: string,
    dto: CreateDesignationDto,
    actor: AuthenticatedUser,
  ): Promise<DesignationResponseDto> {
    this.logger.info(
      { operation: 'terminology.concept.designation.create', conceptId },
      'Añadiendo designación a concepto',
    );

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findById(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      const languageConceptId =
        dto.language === 'EN' ? CONCEPTS.LANG_EN : CONCEPTS.LANG_ES;
      const designationTypeConceptId =
        dto.designationType === 'PREFERRED'
          ? CONCEPTS.DESIG_PREFERRED
          : CONCEPTS.DESIG_SYNONYM;

      // El caso de uso exige una sola designación preferida por idioma: al marcar
      // ésta hay que degradar las anteriores, con la fila bloqueada para que dos
      // altas simultáneas no dejen dos preferidas.
      if (dto.preferred) {
        const siblings = await this.designationsRepo.findByLanguageForUpdate(
          tx,
          conceptId,
          languageConceptId,
        );
        for (const sibling of siblings) {
          if (sibling.preferred) {
            sibling.preferred = false;
            touch(sibling, actor.id);
          }
        }
      }

      const designation = this.designationsRepo.createDesignation(tx, {
        conceptId,
        value: dto.value,
        languageConceptId,
        designationTypeConceptId,
        preferred: dto.preferred,
        actorUserId: actor.id,
      });

      const properties = dto.properties ?? [];
      for (const property of properties) {
        this.designationsRepo.createProperty(tx, {
          conceptId,
          propertyCode: property.propertyCode,
          valueJson: property.valueJson,
          dataType: property.dataType ?? DEFAULT_PROPERTY_DATA_TYPE,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.concept.designation.create',
          designationId: designation.id,
        },
        'Designación creada',
      );
      return {
        id: designation.id,
        conceptId,
        value: designation.value,
        languageConceptId,
        designationTypeConceptId,
        preferred: designation.preferred,
        propertiesCount: properties.length,
      };
    });
  }

  /** UC-03-06: crea una relación dirigida entre dos conceptos existentes. */
  async addRelationship(
    conceptId: string,
    dto: CreateRelationshipDto,
    actor: AuthenticatedUser,
  ): Promise<RelationshipResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.relationship.create',
        conceptId,
        targetConceptId: dto.targetConceptId,
      },
      'Creando relación entre conceptos',
    );

    if (dto.targetConceptId === conceptId) {
      this.logger.warn(
        { operation: 'terminology.concept.relationship.create', conceptId },
        'Relación rechazada: un concepto no puede relacionarse consigo mismo',
      );
      throw new ConflictException(
        'Un concepto no puede relacionarse consigo mismo',
        { conceptId },
      );
    }

    return this.em.transactional(async (tx) => {
      const source = await this.conceptsRepo.findById(tx, conceptId);
      if (!source) {
        throw new ResourceNotFoundException('Concepto origen no encontrado', {
          conceptId,
        });
      }
      const target = await this.conceptsRepo.findById(tx, dto.targetConceptId);
      if (!target) {
        throw new ResourceNotFoundException('Concepto destino no encontrado', {
          targetConceptId: dto.targetConceptId,
        });
      }

      const relationshipTypeConceptId =
        dto.relationshipType === 'PART_OF'
          ? CONCEPTS.REL_PART_OF
          : CONCEPTS.REL_IS_A;

      const duplicate = await this.relationshipsRepo.findEquivalent(
        tx,
        conceptId,
        dto.targetConceptId,
        relationshipTypeConceptId,
      );
      if (duplicate) {
        this.logger.warn(
          {
            operation: 'terminology.concept.relationship.create',
            conceptId,
            targetConceptId: dto.targetConceptId,
          },
          'Relación duplicada',
        );
        throw new ConflictException(
          'Ya existe una relación equivalente entre esos conceptos',
          {
            conceptId,
            targetConceptId: dto.targetConceptId,
          },
        );
      }

      const relationship = this.relationshipsRepo.create(tx, {
        sourceConceptId: conceptId,
        targetConceptId: dto.targetConceptId,
        relationshipTypeConceptId,
        ordinal: dto.ordinal,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.concept.relationship.create',
          relationshipId: relationship.id,
        },
        'Relación creada',
      );
      return {
        id: relationship.id,
        sourceConceptId: conceptId,
        targetConceptId: dto.targetConceptId,
        relationshipTypeConceptId,
        ordinal: relationship.ordinal,
      };
    });
  }

  /**
   * UC-03-05 (segunda mitad): alta o actualización de propiedades del concepto.
   *
   * El caso de uso declara `concept_properties — UPSERT`: reenviar la misma
   * `property_code` actualiza su valor. Insertar sin más dejaría dos filas con el
   * mismo código y el consumidor no sabría cuál vale.
   */
  async upsertProperties(
    conceptId: string,
    dto: UpsertConceptPropertiesDto,
    actor: AuthenticatedUser,
  ): Promise<ConceptPropertiesResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.properties.upsert',
        conceptId,
        count: dto.properties.length,
      },
      'Actualizando propiedades de concepto',
    );

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findById(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      let created = 0;
      let updated = 0;
      // Se recorre en serie a propósito: dos propiedades con el mismo código en el
      // mismo cuerpo tienen que colapsar en una, y para eso la segunda debe ver la
      // que acaba de registrar la primera.
      for (const property of dto.properties) {
        const existing = await this.designationsRepo.findProperty(
          tx,
          conceptId,
          property.propertyCode,
        );
        if (existing) {
          existing.valueJson = property.valueJson;
          existing.dataType = property.dataType ?? existing.dataType;
          touch(existing, actor.id);
          updated += 1;
        } else {
          this.designationsRepo.createProperty(tx, {
            conceptId,
            propertyCode: property.propertyCode,
            valueJson: property.valueJson,
            dataType: property.dataType ?? DEFAULT_PROPERTY_DATA_TYPE,
            actorUserId: actor.id,
          });
          created += 1;
        }
        await tx.flush();
      }

      this.logger.info(
        {
          operation: 'terminology.concept.properties.upsert',
          conceptId,
          created,
          updated,
        },
        'Propiedades de concepto actualizadas',
      );
      return { conceptId, created, updated };
    });
  }

  /**
   * UC-03-10: retira un concepto (soft-retire, nunca borrado) y opcionalmente
   * apunta al que lo reemplaza.
   *
   * Además excluye el concepto de las expansiones de conjuntos de valores que lo
   * referencian: dejarlo dentro haría que un value set siguiera ofreciendo un
   * código retirado.
   */
  async deprecateConcept(
    conceptId: string,
    dto: DeprecateConceptDto,
    actor: AuthenticatedUser,
  ): Promise<DeprecateConceptResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.deprecate',
        conceptId,
        replacedByConceptId: dto.replacedByConceptId,
      },
      'Retirando concepto',
    );

    if (dto.replacedByConceptId === conceptId) {
      throw new ConflictException(
        'Un concepto no puede reemplazarse a sí mismo',
        { conceptId },
      );
    }

    return this.em.transactional(async (tx) => {
      const concept = await this.conceptsRepo.findByIdForUpdate(tx, conceptId);
      if (!concept) {
        throw new ResourceNotFoundException('Concepto no encontrado', {
          conceptId,
        });
      }

      // Retirar dos veces no es un error: el estado final es el mismo. Se responde
      // sin volver a tocar la fila para no falsear la marca de modificación.
      if (concept.stateConceptId === CONCEPTS.TERM_RETIRED) {
        this.logger.warn(
          { operation: 'terminology.concept.deprecate', conceptId },
          'El concepto ya estaba retirado',
        );
        return {
          id: concept.id,
          stateConceptId: CONCEPTS.TERM_RETIRED,
          replacedByConceptId: concept.replacedByConceptId,
          excludedMembers: 0,
          alreadyRetired: true,
        };
      }

      if (dto.replacedByConceptId) {
        const replacement = await this.conceptsRepo.findById(
          tx,
          dto.replacedByConceptId,
        );
        if (!replacement) {
          throw new ResourceNotFoundException(
            'Concepto de reemplazo no encontrado',
            {
              replacedByConceptId: dto.replacedByConceptId,
            },
          );
        }
        // Reemplazar por otro concepto ya retirado dejaría al consumidor sin
        // ninguna alternativa válida a la que migrar.
        if (replacement.stateConceptId === CONCEPTS.TERM_RETIRED) {
          throw new PreconditionFailedException(
            'El concepto de reemplazo está retirado',
            {
              replacedByConceptId: dto.replacedByConceptId,
            },
          );
        }
        concept.replacedByConceptId = dto.replacedByConceptId;
      }

      concept.stateConceptId = CONCEPTS.TERM_RETIRED;
      concept.validTo = new Date();
      touch(concept, actor.id);

      const members = await this.valueSetsRepo.findMembersByConceptForUpdate(
        tx,
        conceptId,
      );
      for (const member of members) {
        member.included = false;
        touch(member, actor.id);
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.concept.deprecate',
          conceptId,
          excludedMembers: members.length,
        },
        'Concepto retirado',
      );
      return {
        id: concept.id,
        stateConceptId: CONCEPTS.TERM_RETIRED,
        replacedByConceptId: concept.replacedByConceptId,
        excludedMembers: members.length,
        alreadyRetired: false,
      };
    });
  }

  /**
   * UC-03-11 (`$lookup`): resuelve un concepto por `(system, code)` y devuelve sus
   * designaciones y propiedades.
   *
   * `system` es la URL canónica del sistema de códigos, y el concepto se resuelve
   * contra su versión vigente: una versión borrador todavía no está sellada y sus
   * códigos pueden cambiar.
   */
  async lookupConcept(
    system: string,
    code: string,
  ): Promise<LookupResponseDto> {
    this.logger.info(
      { operation: 'terminology.concept.lookup', system, code },
      'Resolviendo concepto',
    );

    const codeSystem = await this.codeSystemsRepo.findByCanonicalUrl(
      this.em,
      system,
    );
    if (!codeSystem) {
      throw new ResourceNotFoundException('Sistema de códigos no encontrado', {
        system,
      });
    }

    const version = await this.versionsRepo.findDefaultActiveVersion(
      this.em,
      codeSystem.id,
      CONCEPTS.TERM_ACTIVE,
    );
    if (!version) {
      throw new ResourceNotFoundException(
        'El sistema de códigos no tiene versión vigente publicada',
        {
          system,
        },
      );
    }

    const concept = await this.conceptsRepo.findByVersionAndCode(
      this.em,
      version.id,
      code,
    );
    if (!concept) {
      throw new ResourceNotFoundException(
        'Código no encontrado en la versión vigente',
        { system, code },
      );
    }

    const [designations, properties] = await Promise.all([
      this.designationsRepo.findByConcept(this.em, concept.id),
      this.designationsRepo.findPropertiesByConcept(this.em, concept.id),
    ]);

    this.logger.info(
      { operation: 'terminology.concept.lookup', conceptId: concept.id },
      'Concepto resuelto',
    );
    return {
      conceptId: concept.id,
      code: concept.code,
      display: concept.display,
      definition: concept.definition,
      selectable: concept.selectable,
      stateConceptId: concept.stateConceptId,
      designations: designations.map((designation) => ({
        value: designation.value,
        languageConceptId: designation.languageConceptId,
        preferred: designation.preferred,
      })),
      properties: properties.map((property) => ({
        propertyCode: property.propertyCode,
        dataType: property.dataType,
        valueJson: property.valueJson,
      })),
    };
  }

  /**
   * UC-03-13: busca conceptos por texto sobre código y denominación.
   *
   * `$lookup` sólo resuelve cuando ya se conocen sistema y código exactos, así
   * que no sirve para descubrir. Sin esta operación, los campos `*ConceptId`
   * que exige el contrato —casi trescientos— no se pueden rellenar desde fuera:
   * los códigos internos del catálogo no están publicados en ningún sitio.
   *
   * No expone datos de paciente: el catálogo de terminología es metadato
   * compartido, idéntico para todos los tenants.
   *
   * El filtro `ids` cubre el camino inverso, que es el que necesita cualquier
   * pantalla: **toda** respuesta del contrato devuelve `*ConceptId` en UUID
   * -estado de una cita, ciclo de vida de una nota, género administrativo- y no
   * había forma de traducir esos ids a una etiqueta. `$lookup` exige sistema y
   * código, que el cliente no tiene, y la búsqueda por texto tampoco resuelve un
   * id. Sin esto el front sólo puede pintar UUIDs, o mantener su propio
   * diccionario en duro y quedar desincronizado del catálogo en la primera alta.
   *
   * Se resuelve en lote a propósito: una tabla de citas trae decenas de estados
   * distintos y pedirlos de a uno sería N+1 desde el navegador.
   *
   * ## El idioma y las etiquetas, que se piden y no vienen solos
   *
   * `options` gobierna las dos capacidades que el glosario necesitaba y esta
   * lectura no tenía. **Las dos están apagadas por omisión, y eso no es una
   * comodidad sino el contrato:** sin `language` la respuesta es la de siempre,
   * campo por campo. La consumen la agenda, el perfil profesional, los
   * diagnósticos y la ficha clínica, y ninguna puede cambiar de comportamiento
   * porque una pantalla nueva necesite dos datos más.
   *
   * @param query - Texto a buscar en código o denominación.
   * @param codeSystemVersionId - Versión a la que acotar, si se indica.
   * @param limit - Tope de resultados.
   * @param ids - Ids concretos a resolver; excluyente con la búsqueda por texto
   *   en la práctica, aunque se pueden combinar.
   * @param options - Idioma preferido y si hay que resolver las etiquetas.
   * @returns Conceptos que casan, con el id que espera el resto del contrato.
   */
  async searchConcepts(
    query: string | undefined,
    codeSystemVersionId: string | undefined,
    limit: number,
    ids?: string[],
    options: ConceptReadOptions = {},
  ): Promise<SearchConceptsResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept.search',
        query,
        limit,
        idCount: ids?.length,
        language: options.language,
      },
      'Buscando conceptos',
    );

    // Una lista de ids vacía es una petición de "ninguno", no de "todos": sin
    // este corte, `?ids=` (o una lista que quedó vacía tras validar) devolvería
    // el catálogo entero bajo la apariencia de una resolución puntual.
    if (ids && ids.length === 0) {
      return { items: [], count: 0, limit };
    }

    // Filtrar por categoría se resuelve acotando la lista de ids, no con un
    // `join` en la búsqueda: así el filtro se combina con el texto y con la
    // versión sin tocar la consulta que ya existía. Un conjunto vacío —o sin
    // versión vigente— corta acá: pedir «los términos de esta categoría» y
    // recibir el catálogo entero sería lo peor que podría pasar.
    let effectiveIds = ids;
    // Si el conjunto de valores pedido es de la familia del glosario
    // (paraguas, categoría o etiqueta), el resultado es «lectura pública del
    // glosario»: sólo entonces se filtra por estado activo y se resuelven los
    // campos adicionales (slug, categoría, etiquetas, resumen corto,
    // relaciones). Fuera de esta familia, ni lo uno ni lo otro cambia —sigue
    // siendo exactamente la búsqueda histórica de siempre.
    let glossaryScoped = false;
    if (options.valueSetId !== undefined) {
      const [miembros, valueSetRow] = await Promise.all([
        this.valueSetsRepo.findIncludedConceptIdsByValueSet(
          this.em,
          options.valueSetId,
        ),
        this.valueSetsRepo.findById(this.em, options.valueSetId),
      ]);
      if (miembros === null) {
        throw new ResourceNotFoundException(
          'El conjunto de valores no existe o no tiene versión vigente',
          { valueSetId: options.valueSetId },
        );
      }
      glossaryScoped =
        valueSetRow !== null &&
        isGlossaryValueSetCode(valueSetRow.internalCode);
      effectiveIds =
        ids === undefined
          ? miembros
          : // Con las dos listas presentes vale la intersección: cada filtro
            // acota, ninguno amplía.
            miembros.filter((conceptId) => ids.includes(conceptId));
      if (effectiveIds.length === 0) {
        return { items: [], count: 0, limit };
      }
    }

    const concepts = await this.conceptsRepo.search(
      this.em,
      {
        query,
        codeSystemVersionId,
        ids: effectiveIds,
        // El glosario público nunca muestra un borrador: es el «campo de
        // estado que mantiene fuera el contenido sin revisar» que exige el
        // carril. Fuera del glosario el catálogo se ve completo, como siempre
        // —muchas otras pantallas leen conceptos en borrador a propósito.
        ...(glossaryScoped ? { stateConceptId: CONCEPTS.TERM_ACTIVE } : {}),
      },
      limit,
    );

    const conceptIds = concepts.map((concept) => concept.id);
    const [textos, etiquetas, glossaryTexts, relationsBySource] =
      await Promise.all([
        this.resolveTexts(conceptIds, options.language),
        options.includeValueSets || glossaryScoped
          ? this.valueSetsRepo.findValueSetsByConceptIds(this.em, conceptIds)
          : Promise.resolve(undefined),
        glossaryScoped
          ? this.resolveGlossaryTexts(conceptIds, options.language)
          : Promise.resolve(
              new Map<
                string,
                {
                  slug?: string;
                  clinicalDefinition?: ConceptTextDto;
                  plainSummary?: ConceptTextDto;
                }
              >(),
            ),
        glossaryScoped
          ? this.resolveGlossaryRelations(conceptIds)
          : Promise.resolve(new Map<string, ConceptRelationDto[]>()),
      ]);

    const items = concepts.map((concept) => {
      const texto = textos.get(concept.id);
      const etiquetasDelConcepto = etiquetas?.get(concept.id);
      const { category, tags } = splitCategoryAndTags(etiquetasDelConcepto);
      return {
        conceptId: concept.id,
        code: concept.code,
        // Sin idioma pedido, `texto` es `undefined` y esto es literalmente lo
        // que devolvía antes. Con idioma, cae al original cuando falta la
        // designación: un término sin traducir se muestra igual, marcado.
        display: texto?.display ?? concept.display,
        definition: texto?.definition ?? concept.definition,
        selectable: concept.selectable,
        codeSystemVersionId: concept.codeSystemVersionId,
        // Las claves ausentes no viajan en el JSON, así que sin `language` ni
        // `includeValueSets` el cuerpo es idéntico al de siempre.
        ...(options.language === undefined
          ? {}
          : { translated: texto?.translated ?? false }),
        ...(etiquetas === undefined
          ? {}
          : { valueSets: toValueSetRefs(etiquetasDelConcepto) }),
        ...(glossaryScoped
          ? {
              slug: glossaryTexts.get(concept.id)?.slug,
              category: category
                ? ({
                    internalCode: category.internalCode,
                    name: category.name,
                  } satisfies ConceptTaxonomyRefDto)
                : null,
              shortDefinition: glossaryTexts.get(concept.id)?.plainSummary
                ?.text,
              tags: tags.map((tag) => tag.name),
              relationsCount: (relationsBySource.get(concept.id) ?? []).length,
              status: glossaryStatusOf(concept.stateConceptId),
            }
          : {}),
      };
    });

    // Un glosario se lee en orden alfabético por el nombre; el catálogo viene
    // ordenado por código, que es el orden que necesita quien configura. Sólo se
    // reordena cuando se pidió idioma —o sea, cuando el llamador es una pantalla
    // de lectura—: sin `lang` el orden es el de siempre, porque el catálogo de
    // administración y los selectores lo esperan así.
    if (options.language !== undefined) {
      items.sort((a, b) => a.display.localeCompare(b.display, 'es'));
    }

    return { items, count: items.length, limit };
  }

  /**
   * La ficha completa de un término: sus textos en el idioma pedido, las
   * categorías bajo las que cae y sus otras denominaciones.
   *
   * ## Por qué no alcanzaba con `$lookup`
   *
   * `$lookup` es la única lectura que devolvía designaciones, pero se resuelve
   * por `(system, code)`: exige la URL canónica del sistema de codificación. Un
   * cliente que llegó al término desde un listado tiene su `conceptId` y nada
   * más, así que para abrir una ficha tendría que resolver antes la versión y
   * el sistema — tres llamadas, dos de ellas sólo para poder hacer la tercera.
   *
   * @param conceptId - Término a leer.
   * @param language - Idioma preferido de los textos.
   * @returns La ficha, con sus etiquetas y sinónimos.
   */
  async readConcept(
    conceptId: string,
    language?: DesignationLanguage,
  ): Promise<ConceptDetailDto> {
    this.logger.info(
      { operation: 'terminology.concept.read', conceptId, language },
      'Leyendo la ficha de un concepto',
    );

    const concept = await this.conceptsRepo.findById(this.em, conceptId);
    if (!concept) {
      throw new ResourceNotFoundException('Concepto no encontrado', {
        conceptId,
      });
    }

    const [
      textos,
      etiquetas,
      designations,
      glossaryTexts,
      relations,
      properties,
    ] = await Promise.all([
      this.resolveTexts([conceptId], language),
      this.valueSetsRepo.findValueSetsByConceptIds(this.em, [conceptId]),
      this.designationsRepo.findByConcept(this.em, conceptId),
      this.resolveGlossaryTexts([conceptId], language),
      this.resolveGlossaryRelations([conceptId]),
      this.designationsRepo.findPropertiesByConcept(this.em, conceptId),
    ]);

    const etiquetasDelConcepto = etiquetas.get(conceptId);
    const esTerminoDelGlosario = (etiquetasDelConcepto ?? []).some(
      (valueSet) => valueSet.internalCode === GLOSSARY_ALL_TERMS_CODE,
    );
    // El glosario público nunca deja pasar un borrador: es el «campo de
    // estado que mantiene fuera el contenido sin revisar» que exige el
    // carril. Se responde 404 —no una ficha a medias— para que un borrador
    // sea indistinguible de un concepto inexistente desde este endpoint.
    if (
      esTerminoDelGlosario &&
      concept.stateConceptId !== CONCEPTS.TERM_ACTIVE
    ) {
      throw new ResourceNotFoundException('Concepto no encontrado', {
        conceptId,
      });
    }

    const texto = textos.get(conceptId);
    const display = texto?.display ?? concept.display;
    const { category, tags } = splitCategoryAndTags(etiquetasDelConcepto);
    const glossaryTexto = glossaryTexts.get(conceptId);

    return {
      conceptId: concept.id,
      code: concept.code,
      display,
      definition: texto?.definition ?? concept.definition,
      selectable: concept.selectable,
      codeSystemVersionId: concept.codeSystemVersionId,
      ...(language === undefined
        ? {}
        : { translated: texto?.translated ?? false }),
      valueSets: toValueSetRefs(etiquetasDelConcepto),
      synonyms: designations
        // La que ya se está mostrando arriba no es un sinónimo de sí misma:
        // repetirla bajo «también se le dice» no informa de nada.
        .filter((designation) => designation.value !== display)
        .map((designation) => ({
          value: designation.value,
          ...(designation.languageConceptId === undefined
            ? {}
            : { language: languageCodeOf(designation.languageConceptId) }),
          ...(designation.preferred === undefined
            ? {}
            : { preferred: designation.preferred }),
        })),
      ...(glossaryTexto?.slug === undefined
        ? {}
        : { slug: glossaryTexto.slug }),
      ...(glossaryTexto?.clinicalDefinition === undefined
        ? {}
        : { clinicalDefinition: glossaryTexto.clinicalDefinition }),
      ...(glossaryTexto?.plainSummary === undefined
        ? {}
        : { plainSummary: glossaryTexto.plainSummary }),
      category,
      tags,
      relations: relations.get(conceptId) ?? [],
      // Mapa `código -> valor`: se consume por nombre (`properties.strengths`),
      // nunca recorriéndolo. Si un code system repitiera el mismo código en dos
      // filas —que el UPSERT de `upsertProperties` impide— gana la última, que
      // es la misma regla que aplica esa escritura.
      properties: Object.fromEntries(
        properties.map((property) => [
          property.propertyCode,
          property.valueJson,
        ]),
      ),
    };
  }

  /**
   * Los textos de un puñado de conceptos en el idioma pedido, en dos consultas.
   *
   * Sin idioma devuelve el mapa vacío y no consulta nada: el llamador cae al
   * `display` y la `definition` del propio concepto, que es el comportamiento
   * histórico.
   *
   * El nombre sale de `concept_designations` y la definición de
   * `concept_properties` — ver `terminology.constants.ts` para por qué están en
   * tablas distintas. Se resuelven **en lote**: traducir de a un concepto con
   * `$lookup` serían cincuenta llamadas para pintar una página de resultados.
   *
   * `translated` se decide por el **nombre**, no por la definición: es el texto
   * que la pantalla muestra siempre, mientras que la definición puede faltar
   * legítimamente en cualquier idioma —hay conceptos que no la tienen— y no
   * debería hacer que un término bien traducido se anuncie como sin traducir.
   *
   * @param conceptIds - Conceptos a resolver.
   * @param language - Idioma preferido, o `undefined` para no traducir.
   * @returns Mapa `conceptId -> textos`; vacío si no se pidió idioma.
   */
  private async resolveTexts(
    conceptIds: string[],
    language?: DesignationLanguage,
  ): Promise<
    Map<
      string,
      {
        /** El nombre en el idioma pedido, si lo hay. */
        display?: string;
        /** La definición en el idioma pedido, si la hay. */
        definition?: string;
        /** Si el nombre vino efectivamente traducido. */
        translated: boolean;
      }
    >
  > {
    if (language === undefined || conceptIds.length === 0) return new Map();

    const [designations, definitions] = await Promise.all([
      this.designationsRepo.findPreferredByLanguageForConcepts(
        this.em,
        conceptIds,
        LANGUAGE_CONCEPT_BY_CODE[language],
      ),
      this.designationsRepo.findPropertyForConcepts(
        this.em,
        conceptIds,
        definitionPropertyCode(language),
      ),
    ]);

    const definicionPorConcepto = new Map<string, string>();
    for (const property of definitions) {
      // `value_json` es jsonb: la definición se guarda como cadena JSON, pero un
      // valor cargado a mano podría ser cualquier cosa. Sólo se acepta texto —
      // pintar `[object Object]` en un glosario sería peor que no traducir.
      if (typeof property.valueJson === 'string') {
        definicionPorConcepto.set(property.conceptId, property.valueJson);
      }
    }

    const textos = new Map<
      string,
      { display?: string; definition?: string; translated: boolean }
    >();
    for (const conceptId of conceptIds) {
      const designation = designations.get(conceptId);
      const definition = definicionPorConcepto.get(conceptId);
      if (designation === undefined && definition === undefined) continue;
      textos.set(conceptId, {
        ...(designation === undefined ? {} : { display: designation.value }),
        ...(definition === undefined ? {} : { definition }),
        translated: designation !== undefined,
      });
    }
    return textos;
  }

  /**
   * El slug, la definición clínica y el resumen llano de un lote de
   * conceptos, en el idioma pedido —con el mismo respaldo a castellano que
   * `resolveTexts`, pero sin idioma es igualmente «como siempre se leyó
   * ES»: a diferencia del `display`/`definition` del sistema de
   * codificación, el contenido del glosario no tiene una forma «sin
   * idioma» que mostrar, así que la ausencia de `language` cae a `ES` en
   * vez de a un texto vacío.
   *
   * Tres consultas en lote (una por `property_code`), nunca una por
   * concepto: la búsqueda del glosario trae hasta cincuenta términos por
   * página.
   *
   * @param conceptIds - Conceptos a resolver.
   * @param language - Idioma preferido; `undefined` cae a `ES`.
   * @returns Mapa `conceptId -> { slug, clinicalDefinition, plainSummary }`;
   *   un concepto que no es del glosario no aparece con ninguno de los tres.
   */
  private async resolveGlossaryTexts(
    conceptIds: string[],
    language: DesignationLanguage | undefined,
  ): Promise<
    Map<
      string,
      {
        /** Slug kebab-case del término, si lo tiene cargado. */
        slug?: string;
        /** Definición clínica en el idioma resuelto. */
        clinicalDefinition?: ConceptTextDto;
        /** Resumen en lenguaje llano en el idioma resuelto. */
        plainSummary?: ConceptTextDto;
      }
    >
  > {
    const result = new Map<
      string,
      {
        slug?: string;
        clinicalDefinition?: ConceptTextDto;
        plainSummary?: ConceptTextDto;
      }
    >();
    if (conceptIds.length === 0) return result;

    const effectiveLanguage = language ?? DEFAULT_GLOSSARY_LANGUAGE;
    const [slugProperties, clinicalProperties, plainProperties] =
      await Promise.all([
        this.designationsRepo.findPropertyForConcepts(
          this.em,
          conceptIds,
          GLOSSARY_SLUG_PROPERTY_CODE,
        ),
        this.designationsRepo.findPropertyForConcepts(
          this.em,
          conceptIds,
          GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
        ),
        this.designationsRepo.findPropertyForConcepts(
          this.em,
          conceptIds,
          GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
        ),
      ]);

    const slugByConcept = new Map(
      slugProperties
        .filter((property) => typeof property.valueJson === 'string')
        .map((property) => [property.conceptId, property.valueJson as string]),
    );
    const clinicalByConcept = resolveBilingualByConcept(
      clinicalProperties,
      effectiveLanguage,
    );
    const plainByConcept = resolveBilingualByConcept(
      plainProperties,
      effectiveLanguage,
    );

    for (const conceptId of conceptIds) {
      result.set(conceptId, {
        slug: slugByConcept.get(conceptId),
        clinicalDefinition: clinicalByConcept.get(conceptId),
        plainSummary: plainByConcept.get(conceptId),
      });
    }
    return result;
  }

  /**
   * Las relaciones tipadas salientes de un lote de conceptos, con el término
   * destino ya resuelto (slug + denominación).
   *
   * Una aristas cuyo destino no resuelve —id sin concepto, o concepto sin
   * `glossary-slug` cargado, ambos indicio de una FK rota o un término a
   * medio sembrar— se omite en vez de devolver una fila con un slug vacío:
   * es preferible una relación de menos que una que el cliente no puede
   * navegar.
   *
   * @param sourceConceptIds - Conceptos origen cuyas relaciones se resuelven.
   * @returns Mapa `sourceConceptId -> relaciones`; un origen sin relaciones
   *   tipadas no aparece (el llamador cae a `[]`).
   */
  private async resolveGlossaryRelations(
    sourceConceptIds: string[],
  ): Promise<Map<string, ConceptRelationDto[]>> {
    const result = new Map<string, ConceptRelationDto[]>();
    if (sourceConceptIds.length === 0) return result;

    const edges = await this.relationshipsRepo.findByTypesForSources(
      this.em,
      [...GLOSSARY_RELATION_TYPE_CONCEPT_IDS],
      sourceConceptIds,
    );
    if (edges.length === 0) return result;

    const targetConceptIds = [
      ...new Set(edges.map((edge) => edge.targetConceptId)),
    ];
    const [targets, targetSlugProperties] = await Promise.all([
      this.conceptsRepo.findByIds(this.em, targetConceptIds),
      this.designationsRepo.findPropertyForConcepts(
        this.em,
        targetConceptIds,
        GLOSSARY_SLUG_PROPERTY_CODE,
      ),
    ]);
    const slugByTarget = new Map(
      targetSlugProperties
        .filter((property) => typeof property.valueJson === 'string')
        .map((property) => [property.conceptId, property.valueJson as string]),
    );

    for (const edge of edges) {
      const type = glossaryRelationTypeFromConceptId(
        edge.relationshipTypeConceptId,
      );
      // No debería ocurrir dado el filtro de tipos pedido, pero se comprueba
      // igual: una relación de un tipo desconocido no tiene forma válida de
      // publicarse.
      if (!type) continue;
      const target = targets.get(edge.targetConceptId);
      const slug = slugByTarget.get(edge.targetConceptId);
      if (!target || slug === undefined) continue;

      const list = result.get(edge.sourceConceptId) ?? [];
      list.push({ type, conceptId: target.id, slug, display: target.display });
      result.set(edge.sourceConceptId, list);
    }
    return result;
  }
}

/** Los conjuntos de valores de un concepto, reducidos a lo que pinta una etiqueta. */
function toValueSetRefs(
  valueSets: readonly { id: string; internalCode: string; name: string }[] = [],
): ConceptValueSetRefDto[] {
  return valueSets.map((valueSet) => ({
    id: valueSet.id,
    internalCode: valueSet.internalCode,
    name: valueSet.name,
  }));
}

/**
 * Separa los conjuntos de valores de un término en «su categoría» (a lo sumo
 * una, `glossary-category-*`) y «sus etiquetas» (`glossary-tag-*`). El value
 * set paraguas (`glossary-all-terms`) no es ni una ni otra: sólo marca
 * pertenencia al glosario, no se muestra como clasificación.
 */
function splitCategoryAndTags(
  valueSets: readonly { id: string; internalCode: string; name: string }[] = [],
): {
  /** La categoría del término, o `null` si no tiene ninguna (no es del glosario). */
  category: ConceptCategoryRefDto | null;
  /** Las etiquetas del término. */
  tags: ConceptCategoryRefDto[];
} {
  let category: ConceptCategoryRefDto | null = null;
  const tags: ConceptCategoryRefDto[] = [];
  for (const valueSet of valueSets) {
    if (valueSet.internalCode.startsWith(GLOSSARY_CATEGORY_PREFIX)) {
      category = {
        valueSetId: valueSet.id,
        internalCode: valueSet.internalCode,
        name: valueSet.name,
      };
    } else if (valueSet.internalCode.startsWith(GLOSSARY_TAG_PREFIX)) {
      tags.push({
        valueSetId: valueSet.id,
        internalCode: valueSet.internalCode,
        name: valueSet.name,
      });
    }
  }
  return { category, tags };
}

/**
 * Resuelve el texto bilingüe (`{ es, en? }`) de un lote de propiedades en el
 * idioma pedido, con el mismo respaldo a castellano que el resto del módulo:
 * `EN` sin traducción cargada cae a `ES` y se marca `translated: false`.
 */
function resolveBilingualByConcept(
  properties: readonly { conceptId: string; valueJson: unknown }[],
  language: DesignationLanguage,
): Map<string, ConceptTextDto> {
  const result = new Map<string, ConceptTextDto>();
  for (const property of properties) {
    const value = property.valueJson as Partial<GlossaryBilingualText> | null;
    if (!value || typeof value !== 'object' || typeof value.es !== 'string') {
      // Un `value_json` que no tiene la forma `{ es, en? }` no es un texto
      // bilingüe válido: se descarta en vez de pintarse crudo, igual que
      // `resolveTexts` con una definición que no es texto.
      continue;
    }
    const hasEnglish = typeof value.en === 'string';
    const text = language === 'EN' && hasEnglish ? value.en : value.es;
    const translated = language === 'EN' ? hasEnglish : true;
    result.set(property.conceptId, { text, translated });
  }
  return result;
}

/**
 * El código de idioma de una designación, a partir del concepto que lo
 * representa.
 *
 * Devuelve `undefined` para un idioma que no esté entre los admitidos, en vez de
 * inventar un código: una designación cargada con un idioma desconocido se
 * muestra igual, sin etiqueta de idioma, que es más honesto que llamarla `ES`.
 */
function languageCodeOf(languageConceptId: string): string | undefined {
  return Object.entries(LANGUAGE_CONCEPT_BY_CODE).find(
    ([, conceptId]) => conceptId === languageConceptId,
  )?.[0];
}
