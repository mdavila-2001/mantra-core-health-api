import {
  avisoDeSolicitudAlPaciente,
  avisoDeSolicitudAlProfesional,
  avisoDeCambioDeCita,
  avisoDeCupoLiberado,
  avisoDeDemora,
  avisoDeRecordatorio,
  RECURSO_CITA,
  RECURSO_CUPO,
  rutaDelTurno,
} from './agenda-notices';
import type {
  BookingNoticeSnapshot,
  SlotNoticeSnapshot,
} from '../repositories';

const CITA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CUPO = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PACIENTE = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const RECURSO = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TENANT = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const cita: BookingNoticeSnapshot = {
  bookingId: CITA,
  tenantId: TENANT,
  patientProfileId: PACIENTE,
  resourceId: RECURSO,
  slotId: CUPO,
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  endAt: new Date('2026-08-20T14:30:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

const cupo: SlotNoticeSnapshot = {
  slotId: CUPO,
  resourceId: RECURSO,
  startAt: new Date('2026-08-20T14:00:00.000Z'),
  endAt: new Date('2026-08-20T14:30:00.000Z'),
  resourceLabel: 'Dra. Rivas',
};

/**
 * El texto **es** el entregable de este carril: lo que el paciente lee en la
 * campana es todo lo que hay. Por eso se comprueba el contenido y no sólo que
 * se haya emitido algo.
 */
describe('redacción de los avisos de agenda (P8)', () => {
  describe('cupo liberado', () => {
    it('nombra al profesional y manda a reservarlo', () => {
      const aviso = avisoDeCupoLiberado(cupo, PACIENTE, TENANT);

      expect(aviso.kind).toBe('SLOT_RELEASED');
      expect(aviso.recipient).toEqual({ patientProfileId: PACIENTE });
      expect(aviso.bodyText).toContain('Dra. Rivas');
      expect(aviso.bodyText).toContain('Reservalo');
      expect(aviso.relatedResourceType).toBe(RECURSO_CUPO);
      expect(aviso.relatedResourceId).toBe(CUPO);
    });

    it('rebota por cupo y persona: un worker que reintenta no avisa dos veces', () => {
      const primero = avisoDeCupoLiberado(cupo, PACIENTE, TENANT);
      const segundo = avisoDeCupoLiberado(cupo, PACIENTE, TENANT);
      const otraPersona = avisoDeCupoLiberado(cupo, 'otro-perfil', TENANT);

      expect(primero.debounceKey).toBe(segundo.debounceKey);
      expect(primero.debounceKey).not.toBe(otraPersona.debounceKey);
    });
  });

  describe('demora del profesional', () => {
    it('dice los minutos y la hora estimada, que es lo que permite decidir', () => {
      const aviso = avisoDeDemora(cita, 20, undefined);

      expect(aviso.kind).toBe('PRACTITIONER_DELAY');
      expect(aviso.subject).toContain('20 minutos');
      expect(aviso.bodyText).toContain('20 minutos');
      expect(aviso.payload?.delayMinutes).toBe(20);
      // 14:00 + 20' = 14:20 en la hora de referencia del snapshot.
      expect(aviso.payload?.estimatedStartAt).toBe('2026-08-20T14:20:00.000Z');
    });

    it('incluye el mensaje del profesional cuando lo escribió', () => {
      const aviso = avisoDeDemora(cita, 15, '  Estoy en una urgencia  ');
      expect(aviso.bodyText).toContain('Estoy en una urgencia');
    });

    it('sin mensaje no deja la frase colgando', () => {
      const aviso = avisoDeDemora(cita, 15, '   ');
      expect(aviso.bodyText).toContain('Mis turnos');
      expect(aviso.bodyText).not.toContain('undefined');
    });

    it('lleva al turno concreto', () => {
      const aviso = avisoDeDemora(cita, 10, undefined);
      expect(aviso.payload?.route).toBe(rutaDelTurno(CITA));
      expect(aviso.relatedResourceType).toBe(RECURSO_CITA);
    });
  });

  describe('recordatorio', () => {
    it('la víspera habla de mañana', () => {
      const aviso = avisoDeRecordatorio(cita, 24 * 60);
      expect(aviso.subject).toBe('Mañana tenés turno');
      expect(aviso.bodyText).toContain('Mañana');
    });

    it('el del mismo día habla de hoy', () => {
      const aviso = avisoDeRecordatorio(cita, 120);
      expect(aviso.subject).toBe('Tu turno es hoy');
      expect(aviso.bodyText).toContain('Hoy');
    });

    it('rebota por cita y antelación: los dos recordatorios conviven', () => {
      const vispera = avisoDeRecordatorio(cita, 24 * 60);
      const mismoDia = avisoDeRecordatorio(cita, 120);
      expect(vispera.debounceKey).not.toBe(mismoDia.debounceKey);
      expect(avisoDeRecordatorio(cita, 120).debounceKey).toBe(
        mismoDia.debounceKey,
      );
    });
  });

  describe('cambio de estado', () => {
    it('rechazar no se anuncia con el texto de cancelar', () => {
      const rechazo = avisoDeCambioDeCita(cita, 'REJECTED', 'Sin cupo', {
        patientProfileId: PACIENTE,
      });
      const cancelacion = avisoDeCambioDeCita(cita, 'CANCELLED', 'Sin cupo', {
        patientProfileId: PACIENTE,
      });

      expect(rechazo.subject).not.toBe(cancelacion.subject);
      expect(rechazo.subject).toContain('No se pudo tomar');
      expect(cancelacion.subject).toContain('canceló');
    });

    it('el motivo viaja en el cuerpo: media noticia obliga a abrir la app', () => {
      const aviso = avisoDeCambioDeCita(
        cita,
        'CANCELLED',
        'El profesional se enfermó',
        { patientProfileId: PACIENTE },
      );
      expect(aviso.bodyText).toContain('Motivo: El profesional se enfermó');
    });

    it('sin motivo no inventa la frase', () => {
      const aviso = avisoDeCambioDeCita(cita, 'ACCEPTED', undefined, {
        patientProfileId: PACIENTE,
      });
      expect(aviso.bodyText).not.toContain('Motivo:');
    });

    it('puede dirigirse a una cuenta concreta: el profesional cuando cancela el paciente', () => {
      const aviso = avisoDeCambioDeCita(cita, 'CANCELLED', 'No puedo ir', {
        userId: 'user-1',
      });
      expect(aviso.recipient).toEqual({ userId: 'user-1' });
    });
  });
});

/**
 * «EN TAL LUGAR» — lo que el propietario pidió y el aviso no decía.
 *
 * El pedido es «tenés una nueva solicitud de consulta en tal horario **en tal
 * lugar**». El horario estaba desde el principio; el lugar no viajaba en el
 * snapshot, y el comentario del módulo decía que faltaba exponer la sede en la
 * lectura de agenda. Ya estaba expuesta: lo único que faltaba era traerla.
 */
describe('el lugar en los avisos de solicitud', () => {
  const USUARIO = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const conSede: BookingNoticeSnapshot = {
    ...cita,
    siteLabel: 'Consultorio del Sur',
  };

  it('el aviso al profesional dice dónde', () => {
    const aviso = avisoDeSolicitudAlProfesional(conSede, 'Ana Quispe', USUARIO);
    expect(aviso.bodyText).toContain('en Consultorio del Sur');
  });

  it('el aviso al paciente dice dónde', () => {
    const aviso = avisoDeSolicitudAlPaciente(conSede);
    expect(aviso.bodyText).toContain('en Consultorio del Sur');
  });

  it('sin sede la frase se omite ENTERA, no queda un hueco', () => {
    // «pidió turno para el jueves en .» se lee peor que sin el dato. Un recurso
    // sin sede declarada es corriente, no un error.
    const aviso = avisoDeSolicitudAlProfesional(cita, 'Ana Quispe', USUARIO);
    expect(aviso.bodyText).not.toContain(' en .');
    expect(aviso.bodyText).not.toContain('undefined');
    expect(aviso.bodyText).toContain('pidió turno para el');
  });
});
