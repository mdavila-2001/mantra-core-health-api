import {
  boliviaTime,
  buildSimulatedInvoice,
  cents,
  importe,
  lineSubtotal,
  simulatedCredentials,
  simulatedIssuer,
} from './siat-simulated.engine';

const PRACTICE = 'ae4165cb-0529-44bd-a4f3-1f7e2747c7a2';

function build(extra: { forceMessageCode?: number; numero?: number } = {}) {
  const emisor = simulatedIssuer({
    practiceId: PRACTICE,
    legalName: 'Clínica Redesa',
  });
  const ahora = new Date('2026-10-11T15:00:00.000Z');
  return buildSimulatedInvoice({
    emisor,
    credenciales: simulatedCredentials(emisor, ahora),
    numeroFactura: extra.numero ?? 1,
    fechaEmision: boliviaTime(ahora),
    patientProfileId: 'd753b999-6c08-48f9-95a4-656598b14606',
    paymentMethodCode: 1,
    lines: [
      {
        productCode: 'CITA_MEDICA',
        description: 'Cita médica · 2026-10-11',
        quantity: '1',
        unitOfMeasure: 58,
        unitPrice: '150.00',
        discount: null,
        subtotal: lineSubtotal('1', '150.00', null),
      },
    ],
    buyer: {
      name: 'Paciente Prueba',
      documentTypeCode: 1,
      documentNumber: '1234567',
    },
    additionalDiscount: null,
    usuario: 'usr-1',
    forceMessageCode: extra.forceMessageCode,
  });
}

describe('siat-simulated.engine', () => {
  it('el emisor es ficticio, determinista y marcado como simulado', () => {
    const a = simulatedIssuer({
      practiceId: PRACTICE,
      legalName: 'Clínica Redesa',
    });
    const b = simulatedIssuer({
      practiceId: PRACTICE,
      legalName: 'Clínica Redesa',
    });
    expect(a).toEqual(b);
    expect(a.nit).toMatch(/^99\d{10}$/);
    expect(a.legalName).toContain('(SIMULADO)');
    expect(a.simulated).toBe(true);
  });

  it('CUIS estable; CUFD cambia por día; ambos sintéticos', () => {
    const e = simulatedIssuer({ practiceId: PRACTICE, legalName: 'X' });
    const hoy = simulatedCredentials(e, new Date('2026-10-11T15:00:00.000Z'));
    const mismoDia = simulatedCredentials(
      e,
      new Date('2026-10-11T20:00:00.000Z'),
    );
    const manana = simulatedCredentials(
      e,
      new Date('2026-10-12T15:00:00.000Z'),
    );
    expect(mismoDia.cufd).toBe(hoy.cufd);
    expect(manana.cufd).not.toBe(hoy.cufd);
    expect(manana.cuis).toBe(hoy.cuis);
    expect(hoy.cufd.startsWith('SIMCUFD')).toBe(true);
    expect(hoy.codigoControl).toHaveLength(15);
  });

  it('emite una factura VALIDADA (908) idéntica en cada corrida', () => {
    const a = build();
    const b = build();
    expect(a.cuf).toBe(b.cuf);
    expect(a.hashArchivo).toBe(b.hashArchivo);
    expect(a.status).toBe('VALIDATED');
    expect(a.response.codigoEstado).toBe(908);
    expect(a.response.simulated).toBe(true);
    expect(a.total).toBe('150.00');
    expect(a.xml).toContain('<montoTotal>150.00</montoTotal>');
    expect(a.xml).toContain('facturaComputarizadaCompraVenta');
    expect(a.cabecera['cuf']).toBe(a.cuf);
  });

  it('el correlativo cambia el CUF', () => {
    expect(build({ numero: 2 }).cuf).not.toBe(build({ numero: 1 }).cuf);
  });

  it('una advertencia forzada deja la recepción OBSERVADA y un error la RECHAZA', () => {
    const obs = build({ forceMessageCode: 2000 });
    expect(obs.status).toBe('OBSERVED');
    expect(obs.response.mensajesList[0]).toMatchObject({
      codigo: 2000,
      forzadoPorSimulacion: true,
    });
    const rej = build({ forceMessageCode: 1013 });
    expect(rej.status).toBe('REJECTED');
    expect(rej.response.transaccion).toBe(false);
  });

  it('el dinero se calcula en centavos', () => {
    expect(cents('150.5')).toBe(15050);
    expect(importe(15050)).toBe('150.50');
    expect(lineSubtotal('2', '10.10', '0.20')).toBe('20.00');
  });
});
