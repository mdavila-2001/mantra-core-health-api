import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { Practices } from '../../modules/practice/entities';
import { ServiceCatalog } from '../../modules/billing/entities';
import { DEFAULT_APPOINTMENT_SERVICE } from '../../modules/billing/default-services';
import { createdBy } from '../persistence/audit-fields';

/**
 * Repone «Cita médica» en las prácticas que nacieron sin ella (FT-22-R01).
 *
 * El alta de una práctica ya crea el servicio por defecto en su misma
 * transacción, así que este paso no existe para las que vengan: existe para las
 * que ya están. Su catálogo arranca vacío y la pantalla del profesional abre sin
 * nada que mostrar, que es exactamente lo que el pedido vino a corregir.
 *
 * Es idempotente por clave natural `(practice_id, code)`: la segunda corrida
 * inserta cero. No toca el precio ni el nombre de una fila existente — si
 * alguien ya la cargó a mano o le puso precio, eso es del dueño de la práctica y
 * no del arranque.
 */
@Injectable()
export class PracticeDefaultServicesSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` raíz para abrir un fork propio.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PracticeDefaultServicesSeedService.name);
  }

  /**
   * Siembra el servicio por defecto en toda práctica que no lo tenga.
   *
   * @returns Cuántas filas se insertaron en esta corrida.
   */
  async run(): Promise<{ inserted: number }> {
    const em = this.orm.em.fork();

    const practices = await em.find(Practices, {}, { fields: ['id'] });
    if (practices.length === 0) return { inserted: 0 };

    // Una sola consulta para todas: preguntar práctica por práctica sería una
    // ida a la base por organización, y esto corre en cada arranque.
    const existentes = await em.find(
      ServiceCatalog,
      {
        practiceId: { $in: practices.map((p) => p.id) },
        code: DEFAULT_APPOINTMENT_SERVICE.code,
      },
      { fields: ['practiceId'] },
    );
    const yaTienen = new Set(existentes.map((row) => row.practiceId));
    const ahora = new Date();

    let inserted = 0;
    for (const practice of practices) {
      if (yaTienen.has(practice.id)) continue;
      em.create(
        ServiceCatalog,
        {
          practiceId: practice.id,
          code: DEFAULT_APPOINTMENT_SERVICE.code,
          name: DEFAULT_APPOINTMENT_SERVICE.name,
          defaultPrice: DEFAULT_APPOINTMENT_SERVICE.defaultPrice,
          currencyConceptId: DEFAULT_APPOINTMENT_SERVICE.currencyConceptId,
          isActive: true,
          // Sin actor: lo sembró el arranque, no una persona.
          ...createdBy(undefined, ahora),
        },
        { partial: true },
      );
      inserted += 1;
    }
    await em.flush();

    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Servicio por defecto repuesto en prácticas que no lo tenían',
      );
    }
    return { inserted };
  }
}
