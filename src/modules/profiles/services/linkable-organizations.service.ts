import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  BO_FACILITY_PROPERTY_CODES,
  BO_FACILITY_VALUE_SET,
} from '../../../common/seed/bolivia-facilities.catalog';
import {
  CatalogConceptsRepository,
  ConceptDesignationsRepository,
  ValueSetsRepository,
} from '../../terminology/repositories';
import type {
  LinkableOrganizationDto,
  ListLinkableOrganizationsResponseDto,
} from '../dto/linkable-organization.dto';

/** Tope de resultados cuando quien busca no pide otro. */
const TOPE_POR_DEFECTO = 20;

/**
 * El buscador de instituciones para el vínculo del profesional.
 *
 * ## Qué problema resuelve
 *
 * `practitioner_affiliations.organization_name` es texto libre y obligatorio, y
 * `practice_site_id` es opcional. Sin una lista de dónde elegir, cada médico
 * escribe el nombre de su hospital como se le ocurre, y el sistema termina
 * creyendo que «CLINICA FOIANINI», «Clínica Ángel Foianini» y «Centro Médico
 * Foianini» son tres instituciones. Este servicio le da al perfil la lista real
 * —el padrón oficial— para que el nombre que se guarde sea siempre el mismo.
 *
 * ## Por qué el padrón y no las sedes registradas
 *
 * Las sedes de `practice.practice_sites` son hoy andamio de pruebas —«Practice
 * sites (caso 09)»— y ninguna de las organizaciones reales cargadas tiene una.
 * Ofrecerlas sería ofrecer basura. El padrón, en cambio, son instituciones
 * verdaderas, e incluye las siete cajas de la seguridad social, que es donde
 * trabaja buena parte de los profesionales.
 *
 * ## Dos límites que conviene conocer
 *
 * El padrón cubre **sólo Santa Cruz** (55 municipios). Un profesional de otro
 * departamento no va a encontrarse acá, y por eso el texto libre sigue siendo
 * un camino válido al crear el vínculo: es la salida para lo que el padrón no
 * cubre, no la forma normal de cargarlo.
 *
 * Y la coincidencia es literal: `unaccent` está disponible en el motor pero no
 * instalado, e instalarlo es un cambio de esquema. Son 11 de 523 los nombres
 * con acento, así que quien busque «imagenologia» sin tilde no encontrará
 * «IMAGENOLOGÍA». Anotado para cuando toque el esquema.
 */
@Injectable()
export class LinkableOrganizationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param valueSetsRepo - Acceso a conjuntos de valores y sus miembros.
   * @param conceptsRepo - Búsqueda de conceptos por texto.
   * @param propertiesRepo - Lectura de propiedades de concepto.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly propertiesRepo: ConceptDesignationsRepository,
  ) {}

  /**
   * Busca establecimientos del padrón por nombre, opcionalmente acotando a un
   * municipio.
   *
   * Devuelve una lista vacía —y no un error— cuando el padrón no está sembrado:
   * un catálogo ausente deja al buscador sin nada que ofrecer, pero no es una
   * falla de quien busca, y el formulario debe poder seguir por texto libre.
   *
   * @param opciones - Texto a buscar, municipio y tope de resultados.
   * @returns Los establecimientos que coinciden.
   */
  async buscar(opciones: {
    query?: string;
    municipality?: string;
    limit?: number;
  }): Promise<ListLinkableOrganizationsResponseDto> {
    const limit = opciones.limit ?? TOPE_POR_DEFECTO;

    const miembros = await this.miembrosDelPadron();
    if (miembros.length === 0) return { items: [], count: 0, limit };

    const candidatos = await this.acotarPorMunicipio(
      miembros,
      opciones.municipality,
    );
    if (candidatos.length === 0) return { items: [], count: 0, limit };

    const conceptos = await this.conceptsRepo.search(
      this.em,
      opciones.query === undefined
        ? { ids: candidatos }
        : { query: opciones.query, ids: candidatos },
      limit,
    );
    if (conceptos.length === 0) return { items: [], count: 0, limit };

    const items = await this.conFichaDelPadron(
      conceptos.map((concepto) => ({
        conceptId: concepto.id,
        code: concepto.code,
        display: concepto.display,
      })),
    );
    return { items, count: items.length, limit };
  }

  /**
   * Los conceptos que integran el padrón vigente.
   *
   * @returns Sus ids, o lista vacía si el catálogo no está sembrado.
   */
  private async miembrosDelPadron(): Promise<string[]> {
    const valueSet = await this.valueSetsRepo.findByInternalCode(
      this.em,
      BO_FACILITY_VALUE_SET,
    );
    if (valueSet === null) return [];

    const miembros = await this.valueSetsRepo.findIncludedConceptIdsByValueSet(
      this.em,
      valueSet.id,
    );
    return miembros ?? [];
  }

  /**
   * Deja sólo los establecimientos de un municipio, si se pidió uno.
   *
   * @param candidatos - Ids a filtrar.
   * @param municipality - Municipio exacto, o `undefined` para no filtrar.
   * @returns Los ids que quedan.
   */
  private async acotarPorMunicipio(
    candidatos: string[],
    municipality: string | undefined,
  ): Promise<string[]> {
    if (municipality === undefined) return candidatos;

    const buscado = municipality.trim().toLowerCase();
    const filas = await this.propertiesRepo.findPropertyForConcepts(
      this.em,
      candidatos,
      BO_FACILITY_PROPERTY_CODES.municipio,
    );
    return filas
      .filter(
        (fila) =>
          typeof fila.valueJson === 'string' &&
          fila.valueJson.trim().toLowerCase() === buscado,
      )
      .map((fila) => fila.conceptId);
  }

  /**
   * Completa cada establecimiento con municipio, tipo y dirección.
   *
   * Las tres propiedades se piden en lote y en paralelo —una consulta por
   * código, no una por establecimiento—, que es el patrón del módulo de
   * terminología para enriquecer un listado.
   *
   * @param conceptos - Los conceptos ya filtrados.
   * @returns Las filas listas para el cliente.
   */
  private async conFichaDelPadron(
    conceptos: { conceptId: string; code: string; display: string }[],
  ): Promise<LinkableOrganizationDto[]> {
    const ids = conceptos.map((concepto) => concepto.conceptId);
    const [municipios, tipos, direcciones] = await Promise.all([
      this.propiedadPorConcepto(ids, BO_FACILITY_PROPERTY_CODES.municipio),
      this.propiedadPorConcepto(ids, BO_FACILITY_PROPERTY_CODES.tipo),
      this.propiedadPorConcepto(ids, BO_FACILITY_PROPERTY_CODES.direccion),
    ]);

    return conceptos.map((concepto) => ({
      facilityConceptId: concepto.conceptId,
      // El código viaja con prefijo de dominio (`facility:bo:BO_EST_…`); al
      // cliente le sirve el del padrón, que es el que figura en el listado
      // oficial y el que un humano puede cotejar.
      code: concepto.code.replace(/^facility:bo:/, ''),
      name: concepto.display,
      municipality: municipios.get(concepto.conceptId) ?? null,
      type: tipos.get(concepto.conceptId) ?? null,
      address: direcciones.get(concepto.conceptId) ?? null,
    }));
  }

  /**
   * Una propiedad de varios conceptos, indexada por concepto.
   *
   * @param ids - Conceptos a consultar.
   * @param propertyCode - Código de la propiedad.
   * @returns Mapa `conceptId -> valor`, sin las filas que no son texto.
   */
  private async propiedadPorConcepto(
    ids: string[],
    propertyCode: string,
  ): Promise<Map<string, string>> {
    const filas = await this.propertiesRepo.findPropertyForConcepts(
      this.em,
      ids,
      propertyCode,
    );
    return new Map(
      filas
        .filter((fila) => typeof fila.valueJson === 'string')
        .map((fila) => [fila.conceptId, fila.valueJson as string]),
    );
  }
}
