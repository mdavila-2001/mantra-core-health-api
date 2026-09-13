import {
  BOLIVIA_CARRIERS,
  contactChannelsOf,
} from './bolivia-insurance.catalog';

/**
 * El sidecar de canales de contacto (subtarea 2.3) tiene reglas propias de
 * procedencia (regla 70) que no dependen de correr el generador: cada código
 * apunta a una aseguradora real que ofrece salud, y ningún WhatsApp queda sin
 * el signo `+` que la API exige.
 */
describe('contactChannelsOf', () => {
  const codigosDeSalud = new Set(
    BOLIVIA_CARRIERS.filter((c) => c.ofreceSalud).map((c) => c.code),
  );

  it('devuelve null en los tres canales para un código sin fila en el sidecar', () => {
    expect(contactChannelsOf('CODIGO_QUE_NO_EXISTE')).toEqual({
      whatsapp: null,
      callCenter: null,
      supportEmail: null,
    });
  });

  it('todo WhatsApp confirmado empieza con el signo +', () => {
    for (const code of codigosDeSalud) {
      const canales = contactChannelsOf(code);
      if (canales.whatsapp !== null) {
        expect(canales.whatsapp.startsWith('+')).toBe(true);
      }
    }
  });

  it('las aseguradoras confirmadas con fuente traen al menos un canal', () => {
    // Constatado a mano el 2026-09-13 contra el dominio oficial de cada
    // compañía: 7 de las 9 tienen algún canal, 2 quedan sin confirmar.
    const conAlgunCanal = [...codigosDeSalud].filter((code) => {
      const c = contactChannelsOf(code);
      return (
        c.whatsapp !== null || c.callCenter !== null || c.supportEmail !== null
      );
    });
    expect(conAlgunCanal).toHaveLength(7);
  });
});
