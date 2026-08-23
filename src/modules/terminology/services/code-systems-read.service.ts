import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { CONCEPTS } from '../../../common';
import { CodeSystems, CodeSystemVersions } from '../entities';
import type {
  CodeSystemListItemDto,
  CodeSystemVersionListItemDto,
} from '../dto/code-systems-read.dto';

/**
 * Tope de sistemas y de versiones que se devuelven.
 *
 * No es paginación: es un catálogo de administración con decenas de filas, no
 * miles. Si algún día crece, el tope avisa antes de que la pantalla empiece a
 * mentir por omisión.
 */
const TOPE = 200;

/**
 * Lectura de sistemas de codificación y sus versiones.
 *
 * ## Por qué existe
 *
 * Porque no se podían leer. `terminology/code-systems` sólo tenía dos altas, así
 * que cualquier pantalla que quisiera importar conceptos no tenía forma de
 * ofrecer a qué versión — el identificador había que sacarlo de la respuesta del
 * alta y anotarlo a mano.
 *
 * ## Por qué es un servicio aparte del de escritura
 *
 * `CodeSystemsService` es dueño de transacciones: crea sistemas, versiones y sus
 * fuentes. Esto no escribe nada. Mezclarlos daría una clase que cambia por dos
 * motivos distintos.
 */
@Injectable()
export class CodeSystemsReadService {
  /**
   * Inicializa el servicio.
   *
   * @param em - Contexto de persistencia.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CodeSystemsReadService.name);
  }

  /**
   * Los sistemas de codificación registrados.
   *
   * @returns Los sistemas, por su código interno.
   */
  async listCodeSystems(): Promise<CodeSystemListItemDto[]> {
    const filas = await this.em
      .fork()
      .find(CodeSystems, {}, { orderBy: { internalCode: 'asc' }, limit: TOPE });

    return filas.map((sistema) => ({
      id: sistema.id,
      internalCode: sistema.internalCode,
      name: sistema.name,
      canonicalUrl: sistema.canonicalUrl,
    }));
  }

  /**
   * Las versiones de un sistema de codificación.
   *
   * El estado viaja traducido a una palabra —`DRAFT`, `ACTIVE`, `UNKNOWN`— y no
   * como uuid: quien elige una versión para importar necesita saber si la
   * admite, y un identificador no responde eso. `UNKNOWN` es el caso real de las
   * versiones que dejaron los importadores externos sin fijar estado.
   *
   * @param codeSystemId - Sistema cuyas versiones se listan.
   * @returns Las versiones, de la más nueva a la más vieja.
   */
  async listVersions(
    codeSystemId: string,
  ): Promise<CodeSystemVersionListItemDto[]> {
    const filas = await this.em.fork().find(
      CodeSystemVersions,
      { codeSystemId },
      {
        // Se ordena por fecha de alta y NO por `version`, que es texto libre:
        // ordenarlo alfabéticamente pone «10» antes que «9» y «2026-01» antes
        // que «2026», así que la más nueva no quedaba arriba justo en los
        // sistemas que numeran en vez de fechar. `version` queda de desempate
        // para que el orden sea estable entre corridas.
        orderBy: { createdAt: 'desc', version: 'desc' },
        limit: TOPE,
      },
    );

    if (filas.length === TOPE) {
      // El tope existe para que esto no se convierta en una consulta sin
      // límite, pero recortar en silencio es la forma en que una lista de
      // administración empieza a mentir por omisión.
      this.logger.warn(
        { operation: 'terminology.versions.list', codeSystemId, tope: TOPE },
        'El listado de versiones llegó al tope: puede haber más sin mostrar',
      );
    }

    return filas.map((version) => ({
      id: version.id,
      version: version.version,
      state: estadoLegible(version.stateConceptId),
      isDefault: version.isDefault === true,
      publishedAt: version.publishedAt ?? null,
      acceptsConcepts: admiteConceptos(version.stateConceptId),
    }));
  }
}

/**
 * Traduce el concepto de estado a una palabra.
 *
 * `RETIRED` y `DEPRECATED` se nombran: caían en `UNKNOWN`, que acá significa
 * «versión sin estado» —el hueco que dejan los ETL— y por eso pasaban por
 * versiones abiertas cuando son exactamente lo contrario.
 *
 * @param stateConceptId - El estado tal como está guardado.
 * @returns La palabra que la pantalla puede mostrar.
 */
function estadoLegible(
  stateConceptId: string | null | undefined,
): 'DRAFT' | 'ACTIVE' | 'RETIRED' | 'DEPRECATED' | 'UNKNOWN' {
  if (stateConceptId === CONCEPTS.TERM_ACTIVE) return 'ACTIVE';
  if (stateConceptId === CONCEPTS.TERM_DRAFT) return 'DRAFT';
  if (stateConceptId === CONCEPTS.TERM_RETIRED) return 'RETIRED';
  if (stateConceptId === CONCEPTS.TERM_DEPRECATED) return 'DEPRECATED';
  return 'UNKNOWN';
}

/**
 * Si a esa versión se le pueden importar conceptos.
 *
 * Es **el mismo criterio** que aplica el importador
 * (`ConceptFileImportService`): sólo borrador o sin estado. Decía
 * `!== TERM_ACTIVE`, que dejaba pasar retiradas y obsoletas — el desplegable las
 * ofrecía y el 422 llegaba recién al enviar el archivo, que es justo el modo de
 * fallo que esta lista existe para evitar.
 *
 * @param stateConceptId - El estado tal como está guardado.
 */
function admiteConceptos(stateConceptId: string | null | undefined): boolean {
  return stateConceptId == null || stateConceptId === CONCEPTS.TERM_DRAFT;
}
