import { IdentifiersRepository } from './identifiers.repository';

/**
 * El repositorio de identificadores — que lo que se le pasa, llegue.
 *
 * `create()` **no reenvía el objeto que recibe**: arma uno nuevo campo por
 * campo, así que cualquier dato que el llamador agregue y este método no nombre
 * **se descarta en silencio**. No falla, no avisa: la fila se escribe sin él.
 *
 * Es el mismo defecto que ya costó una verificación en `AppointmentsRepository`
 * con el canal de teleconsulta y otra en `ProfessionalCredentialsRepository` con
 * el archivo del diploma. Volvió a asomar al sumar la razón social: las pruebas
 * del servicio pasaban —aseveran sobre el mock del repositorio, y el mock sí
 * recibía `holderName`— y borrar la línea de acá no ponía nada en rojo.
 *
 * Acá se prueba el borde que faltaba: que cada campo sobrevive el traspaso a
 * `em.create`. Sólo vale si se agrega una línea por cada campo nuevo, y por eso
 * el fallo dice cuál se perdió.
 */
describe('IdentifiersRepository', () => {
  /** Un `EntityManager` que sólo recuerda con qué lo llamaron. */
  function emQueRecuerda() {
    const llamadas: Record<string, unknown>[] = [];
    return {
      llamadas,
      em: {
        create: (_entidad: unknown, datos: Record<string, unknown>) => {
          llamadas.push(datos);
          return datos;
        },
      } as never,
    };
  }

  const base = {
    ownerId: 'per-1',
    ownerTypeConceptId: 'owner-patient',
    typeConceptId: 'id-type-tax',
    value: '1234567',
    stateConceptId: 'state-active',
  };

  it('la razón social llega a la fila', () => {
    const { em, llamadas } = emQueRecuerda();

    new IdentifiersRepository().create(em, {
      ...base,
      holderName: 'Comercial Rojas S.R.L.',
    });

    expect(llamadas[0].holderName).toBe('Comercial Rojas S.R.L.');
  });

  /** Un CI no tiene razón social: la fila no puede inventarle una. */
  it('sin razón social la fila no la inventa', () => {
    const { em, llamadas } = emQueRecuerda();

    new IdentifiersRepository().create(em, base);

    expect(llamadas[0].holderName).toBeUndefined();
  });

  it('los campos que ya existían siguen llegando', () => {
    const { em, llamadas } = emQueRecuerda();

    new IdentifiersRepository().create(em, {
      ...base,
      issuerAdministrativeAreaConceptId: 'depto-sc',
    });

    const fila = llamadas[0];
    expect(fila.ownerId).toBe('per-1');
    expect(fila.typeConceptId).toBe('id-type-tax');
    expect(fila.value).toBe('1234567');
    expect(fila.issuerAdministrativeAreaConceptId).toBe('depto-sc');
  });
});
