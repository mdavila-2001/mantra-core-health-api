import { ProfessionalCredentialsRepository } from './professional-credentials.repository';

/**
 * El repositorio de credenciales profesionales — que lo que se le pasa, llegue.
 *
 * ## Por qué existe este archivo
 *
 * `create()` **no reenvía el objeto que recibe**: arma uno nuevo campo por
 * campo, así que cualquier dato que el llamador agregue y este método no nombre
 * **se descarta en silencio**. No falla, no avisa: la fila se escribe sin él.
 *
 * Es el mismo defecto que costó una verificación en `AppointmentsRepository`
 * con el canal de teleconsulta, y volvió a asomar acá al sumar el archivo del
 * diploma: el spec del servicio pasaba —asevera sobre el mock del repositorio,
 * y el mock sí recibía `fileId`— pero borrar la línea del repositorio no ponía
 * nada en rojo. La prueba miraba el borde equivocado.
 *
 * Acá se prueba el borde que faltaba: que cada campo del contrato sobrevive el
 * traspaso a `em.create`. Sólo vale si se agrega una línea por cada campo
 * nuevo, y por eso el fallo dice cuál se perdió.
 */
describe('ProfessionalCredentialsRepository', () => {
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
    practitionerProfileId: 'pp-1',
    credentialTypeConceptId: 'cred-type-diploma',
    number: 'DIP-2024-17',
    stateConceptId: 'cred-pending',
  };

  it('el archivo del diploma llega a la fila', () => {
    const { em, llamadas } = emQueRecuerda();

    new ProfessionalCredentialsRepository().create(em, {
      ...base,
      fileId: 'file-1',
    });

    expect(llamadas[0].fileId).toBe('file-1');
  });

  it('sin archivo la fila no lo inventa', () => {
    const { em, llamadas } = emQueRecuerda();

    new ProfessionalCredentialsRepository().create(em, base);

    expect(llamadas[0].fileId).toBeUndefined();
  });

  it('los campos que ya existían siguen llegando', () => {
    const { em, llamadas } = emQueRecuerda();
    const emision = new Date('2024-03-15');

    new ProfessionalCredentialsRepository().create(em, {
      ...base,
      issuingInstitutionText: 'Universidad Gabriel René Moreno',
      issueDate: emision,
      verificationSourceUri: 'https://registro.test/dip/17',
    });

    const fila = llamadas[0];
    expect(fila.practitionerProfileId).toBe('pp-1');
    expect(fila.credentialTypeConceptId).toBe('cred-type-diploma');
    expect(fila.number).toBe('DIP-2024-17');
    expect(fila.issuingInstitutionText).toBe('Universidad Gabriel René Moreno');
    expect(fila.issueDate).toBe(emision);
    expect(fila.verificationSourceUri).toBe('https://registro.test/dip/17');
    expect(fila.stateConceptId).toBe('cred-pending');
  });
});
