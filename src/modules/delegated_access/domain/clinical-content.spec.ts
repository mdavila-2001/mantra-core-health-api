import {
  DEFAULT_CLINICAL_KEYWORDS,
  clinicalKeywordsFromEnv,
  looksClinical,
} from './clinical-content';

describe('looksClinical (la persona de apoyo solo atiende lo administrativo)', () => {
  it.each([
    'Doctor, tengo mucho dolor de pecho desde anoche',
    'Mi hijo tiene fiebre de 39 grados',
    '¿Puedo tomar ibuprofeno junto con mi tratamiento?',
    'Necesito que me cambie la dosis de la insulina',
    'Salió alterado el resultado de mi análisis',
    'Estoy embarazada y tengo sangrado',
    'tomo 500 mg cada 8 horas, ¿sigo igual?',
    'Me salió una ERUPCIÓN en la piel',
  ])('marca como clínico: %s', (text) => {
    const verdict = looksClinical(text);
    expect(verdict.clinical).toBe(true);
    expect(verdict.matched.length).toBeGreaterThan(0);
  });

  it.each([
    'Hola, quisiera cambiar mi cita del jueves para el viernes',
    '¿A qué hora abren el sábado?',
    'Necesito la factura de mi última consulta',
    '¿Dónde queda el consultorio 105?',
    'Gracias, confirmo que asistiré mañana a las 10',
    'Quiero saber el costo de una ecografía',
  ])('deja pasar lo administrativo: %s', (text) => {
    expect(looksClinical(text)).toEqual({ clinical: false, matched: [] });
  });

  it('ignora acentos y mayúsculas', () => {
    expect(looksClinical('DOLOR AGUDO').clinical).toBe(true);
    expect(looksClinical('Tengo vomitos').clinical).toBe(true);
    expect(looksClinical('tengo vómitos').clinical).toBe(true);
  });

  it('no confunde una palabra que solo contiene la raíz en medio', () => {
    expect(looksClinical('Pasé por la Avenida Dolorosa').clinical).toBe(false);
  });

  it('un texto vacío o sin texto no es clínico', () => {
    expect(looksClinical('').clinical).toBe(false);
    expect(looksClinical(undefined).clinical).toBe(false);
  });

  it('acepta una lista propia de palabras', () => {
    expect(looksClinical('revisión de mi tensión', ['tension']).clinical).toBe(
      true,
    );
    expect(looksClinical('me duele', ['tension']).clinical).toBe(false);
  });
});

describe('clinicalKeywordsFromEnv (configurable)', () => {
  it('sin variables usa las de por defecto', () => {
    expect(clinicalKeywordsFromEnv({})).toEqual(DEFAULT_CLINICAL_KEYWORDS);
  });

  it('SUPPORT_CLINICAL_KEYWORDS reemplaza la lista', () => {
    expect(
      clinicalKeywordsFromEnv({
        SUPPORT_CLINICAL_KEYWORDS: 'tension, Glucosa ',
      }),
    ).toEqual(['tension', 'glucosa']);
  });

  it('SUPPORT_CLINICAL_KEYWORDS_EXTRA suma a la de por defecto', () => {
    const list = clinicalKeywordsFromEnv({
      SUPPORT_CLINICAL_KEYWORDS_EXTRA: 'ansiedad',
    });
    expect(list).toEqual([...DEFAULT_CLINICAL_KEYWORDS, 'ansiedad']);
  });

  it('una variable vacía no deja la lista sin palabras', () => {
    expect(
      clinicalKeywordsFromEnv({ SUPPORT_CLINICAL_KEYWORDS: ' , ' }),
    ).toEqual(DEFAULT_CLINICAL_KEYWORDS);
  });
});

describe('SEG A-A4 · barrera de PHI clínica ampliada', () => {
  // Los cinco mensajes de la PoC revision-seg-a/clin.ts que antes quedaban VISIBLES.
  it.each([
    'Doctor, mi biopsia salió con células anormales, tengo miedo del cáncer',
    'Estoy muy deprimida y pienso en quitarme la vida',
    'Quiero hablar del aborto que tuve en marzo',
    'Mi hijo tiene cirugía de apéndice mañana y ya no puede comer',
    'Siento un bulto en el seno izquierdo',
  ])('marca como clínico (PoC): %s', (text) => {
    expect(looksClinical(text).clinical).toBe(true);
  });

  it.each([
    // diagnósticos y oncología
    'Me diagnosticaron VIH positivo la semana pasada',
    'Empiezo quimioterapia el lunes',
    'Mi mamá tiene leucemia',
    'Salió positivo para hepatitis B',
    // salud mental
    'Tengo ansiedad y ataques de pánico',
    'Mi psiquiatra me cambió el antidepresivo',
    'He pensado en suicidarme',
    'Necesito una cita con el psicólogo por mi trastorno bipolar',
    // salud sexual y reproductiva
    'Quiero información sobre anticonceptivos',
    'Creo que tengo una infección de transmisión sexual',
    'Tuve un legrado el mes pasado',
    'Estamos en tratamiento de fertilidad',
    // procedimientos y medicamentos
    'Me van a operar de la vesícula',
    'Me tomo la metformina y el losartán',
    'Necesito el informe de la resonancia magnética',
    'Me recetaron clonazepam',
    // enfermedades crónicas
    'Soy hipertensa y tengo colesterol alto',
    'Mi papá tuvo un infarto',
    'Tengo epilepsia desde niña',
    // inglés
    'I was diagnosed with cancer',
    'I need to talk about my depression',
    'My HIV test came back',
  ])('marca como clínico (ampliada): %s', (text) => {
    expect(looksClinical(text).clinical).toBe(true);
  });

  it('con y sin tildes, y con sustituciones básicas (leet) o letras repetidas', () => {
    for (const text of [
      'tengo c4ncer',
      'mi biops1a salio mal',
      'estoy deprimida y quiero su1cidarme',
      'tengo caaancer',
      'DEPRESIÓN fuerte',
      'depresion fuerte',
      'tengo v1h',
      'me hicieron un 4borto',
    ]) {
      expect(looksClinical(text).clinical).toBe(true);
    }
  });

  it('lo administrativo de siempre sigue pasando', () => {
    for (const text of [
      'Hola, quisiera cambiar mi cita del jueves para el viernes',
      '¿A qué hora abren el sábado?',
      'Necesito la factura de mi última consulta',
      '¿Dónde queda el consultorio 105?',
      'Gracias, confirmo que asistiré mañana a las 10',
      'Quiero saber el costo de una ecografía',
      'Mi mamá me acompaña el jueves a las 15:30',
      'Hola, ¿tienen estacionamiento?',
      'Necesito una copia del contrato de la clínica',
    ]) {
      expect(looksClinical(text)).toEqual({ clinical: false, matched: [] });
    }
  });

  it('un número dentro de una palabra común no la vuelve clínica', () => {
    expect(
      looksClinical('Mi cita es el 10 de noviembre a las 3').clinical,
    ).toBe(false);
    expect(looksClinical('Mi teléfono es 7654321').clinical).toBe(false);
  });
});

describe('SEG V-2 · la heurística no se evade por formato (PoC clin.ts / clin2.ts)', () => {
  // Cada caso es una forma de escribir «cáncer», «falta de aire»… que antes
  // pasaba como administrativa. Se escriben con escapes para que el archivo
  // conserve los caracteres invisibles y los homoglifos tal cual.
  const ZWSP = '\u200b';
  const ZWJ = '\u200d';
  const SHY = '\u00ad';
  const NBSP = '\u00a0';

  it.each([
    [
      'espacio de ancho cero dentro de la palabra',
      `Tengo cán${ZWSP}cer de mama`,
    ],
    ['unión de ancho cero', `Tengo cá${ZWJ}ncer`],
    ['guion blando', `Tengo cán${SHY}cer`],
    ['«\u0441» cirílica', 'Tengo cán\u0441er'],
    ['«\u0430» cirílica', 'Tengo c\u0430ncer'],
    ['«\u0456» cirílica en diabetes', 'Tengo d\u0456abetes'],
    ['«\u03bf» griega', 'Mi tum\u03bfr creció'],
    ['ancho completo', 'Tengo \uff43áncer'],
    [
      'negritas matemáticas',
      'Tengo \ud835\udc1c\ud835\udc1a\ud835\udc27\ud835\udc1c\ud835\udc1e\ud835\udc2b',
    ],
    ['letras separadas por espacios', 'Tengo c a n c e r'],
    ['letras separadas por puntos', 'Tengo c.a.n.c.e.r'],
    ['letras separadas por puntos tras una letra suelta', 'y c.a.n.c.e.r'],
    ['letras separadas tras la palabra «a»', 'tengo a c a n c e r'],
    ['guion dentro de la palabra', 'Tengo can-cer'],
    ['guion bajo dentro de la palabra', 'Tengo can_cer'],
    ['asterisco dentro de la palabra', 'Tengo can*cer'],
    ['espacio no separable en una frase', `Tengo falta${NBSP}de${NBSP}aire`],
    ['doble espacio en una frase', 'Tengo falta  de aire'],
    ['salto de línea en una frase', 'Tengo falta\nde aire'],
    ['tabulación en una frase', 'Tengo\tpresion arterial alta'],
    [
      'espacios mixtos en «quitarme la vida»',
      `Me quiero quitar${NBSP}${NBSP}la vida`,
    ],
    ['guiones entre las palabras de la frase', 'Tengo falta-de-aire'],
    ['puntos entre las palabras de la frase', 'Tengo falta.de.aire'],
    ['combinante extra', 'Tengo ca\u0301\u0302ncer'],
    [
      'mayúsculas de ancho completo',
      'Tengo \uff23\uff21\uff2e\uff23\uff25\uff32',
    ],
    ['«k» por «c»', 'Tengo kancer'],
    ['«s» por «c»', 'Tengo canser'],
    ['portugués', 'estou grávida de dois meses'],
    ['texto invertido con marca RTL', 'Tengo \u202erecnac\u202c'],
    [
      'mezcla: ancho cero + cirílico + espacio no separable',
      `Mi biops${ZWSP}\u0456a dio mal${NBSP}y tengo falta${NBSP}de${NBSP}aire`,
    ],
  ])('se detecta: %s', (_label, text) => {
    expect(looksClinical(text).clinical).toBe(true);
  });

  it('las variantes de PoC siguen detectando lo que ya detectaban', () => {
    for (const text of [
      'Tengo cáncer de mama',
      'I am HIV positive',
      'I have cancer',
      'my tumor grew',
      'Tuve un aborto',
      'mi biopsia dio mal',
      'estoy en tratamiento oncologico',
      'me diagnosticaron VIH',
      'Me quiero quitar  la vida',
    ]) {
      expect(looksClinical(text).clinical).toBe(true);
    }
  });

  it('la normalización no vuelve clínico lo administrativo con espacios, guiones o símbolos', () => {
    for (const text of [
      'Hola, quiero confirmar mi turno de mañana',
      'Buenos días, ¿a qué hora atienden?',
      'Estos días no puedo ir, ¿puedo pasar el jueves?',
      `Gracias${NBSP}doctor${ZWSP}, nos vemos`,
      'Mi número es 7-6-5-4-3-2-1',
      'Mi cita: 10 - 11 - 2026, sala A-B',
      'a b c d e f',
      '\uff28\uff4f\uff4c\uff41, ¿tienen estacionamiento?',
      '\u041f\u0440\u0438\u0432\u0435\u0442, confirmo mi cita',
    ]) {
      expect(looksClinical(text)).toEqual({ clinical: false, matched: [] });
    }
  });

  it('un texto muy largo de letras sueltas no degrada el procesado', () => {
    const t0 = Date.now();
    const long = 'a '.repeat(5000) + 'z';
    looksClinical(long);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});
