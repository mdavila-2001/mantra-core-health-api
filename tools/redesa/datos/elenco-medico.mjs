/**
 * elenco-medico.mjs — Los profesionales que siembra `seed-vitrina-publica.mjs`,
 * con su **trayectoria completa**: dónde estudiaron, dónde hicieron el
 * internado, dónde cumplieron el servicio social rural, dónde se formaron como
 * especialistas y dónde ejercen hoy.
 *
 * ## Por qué la trayectoria se escribe entera y a mano
 *
 * El modelo no tiene «formación académica»: no existe una tabla de títulos, ni
 * un endpoint para declarar universidad, carrera y año de egreso —lo más
 * parecido, `profiles.professional_credentials`, es un documento con número, no
 * una formación—. Lo que sí existe es
 * `profiles.practitioner_affiliations`, que la ficha pública muestra como
 * «Trayectoria», y que admite institución, cargo, área y fechas.
 *
 * Así que **la formación se siembra como etapas de la trayectoria**: la
 * universidad es la institución, el título es el cargo y las fechas son las de
 * la carrera. No es un atajo cosmético: es exactamente lo que un currículum
 * médico dice de sí mismo, y es lo único que el contrato de hoy sabe guardar.
 * El día que exista un modelo de formación, estas mismas filas son las que hay
 * que migrar.
 *
 * ## Por qué son universidades y hospitales reales de Bolivia
 *
 * Una pantalla sembrada con «Universidad 1» y «Hospital 2» no deja juzgar nada
 * de lo que se mira cuando se mira una trayectoria: ni cómo recorta un nombre
 * institucional largo —y los de acá lo son: «Universidad Mayor, Real y
 * Pontificia de San Francisco Xavier de Chuquisaca» son 63 caracteres—, ni cómo
 * se ordena una línea de tiempo con etapas superpuestas, ni si la jerarquía
 * visual distingue un título de un cargo. Los nombres son los reales del
 * sistema universitario y hospitalario boliviano; **las personas no**: son
 * ficticias, y el correo `@alovida.test` lo deja dicho.
 *
 * ## La forma de una carrera médica boliviana
 *
 * Las etapas siguen el recorrido real, que es el que hace verosímil la ficha:
 *
 *  1. **Pregrado** — seis años de la carrera de Medicina en una universidad del
 *     sistema (pública del CEUB o privada).
 *  2. **Internado rotatorio** — el último año, en un hospital de tercer nivel.
 *  3. **SSSRO** — el Servicio Social de Salud Rural Obligatorio, un año en un
 *     establecimiento de primer nivel del área rural. Es requisito legal para
 *     ejercer en Bolivia y aparece en todos los currículums de verdad.
 *  4. **Residencia médica** — tres o cuatro años en un hospital acreditado,
 *     casi siempre de la Caja Nacional de Salud o universitario.
 *  5. **Subespecialidad o formación de posgrado** — no todos la tienen, y por
 *     eso no todos la tienen acá tampoco.
 *  6. **Ejercicio actual** — el cargo vigente, sin fecha de fin, que es lo que
 *     la pantalla lee como «actividad actual». Varios tienen dos a la vez:
 *     el hospital y la docencia universitaria, que es lo habitual.
 */

/**
 * Las universidades del sistema boliviano que aparecen en las trayectorias,
 * con su nombre completo y la ciudad de la facultad de medicina.
 *
 * El nombre va **entero**, con la facultad cuando la tiene: es el que se lee en
 * un título y el que tiene que caber en la tarjeta. Abreviarlo acá sería
 * sembrar el caso fácil y descubrir el difícil en producción.
 */
export const UNIVERSIDADES = {
  UMSA: {
    nombre:
      'Universidad Mayor de San Andrés — Facultad de Medicina, Enfermería, Nutrición y Tecnología Médica',
    ciudad: 'La Paz',
    sigla: 'UMSA',
  },
  UMSS: {
    nombre: 'Universidad Mayor de San Simón — Facultad de Medicina «Dr. Aurelio Melean»',
    ciudad: 'Cochabamba',
    sigla: 'UMSS',
  },
  UAGRM: {
    nombre:
      'Universidad Autónoma Gabriel René Moreno — Facultad de Ciencias de la Salud Humana',
    ciudad: 'Santa Cruz de la Sierra',
    sigla: 'UAGRM',
  },
  USFX: {
    nombre:
      'Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca — Facultad de Medicina',
    ciudad: 'Sucre',
    sigla: 'USFX',
  },
  UAJMS: {
    nombre:
      'Universidad Autónoma Juan Misael Saracho — Facultad de Ciencias de la Salud',
    ciudad: 'Tarija',
    sigla: 'UAJMS',
  },
  UTO: {
    nombre: 'Universidad Técnica de Oruro — Facultad de Ciencias de la Salud',
    ciudad: 'Oruro',
    sigla: 'UTO',
  },
  UATF: {
    nombre: 'Universidad Autónoma Tomás Frías — Facultad de Medicina',
    ciudad: 'Potosí',
    sigla: 'UATF',
  },
  UCB: {
    nombre: 'Universidad Católica Boliviana San Pablo — Facultad de Medicina',
    ciudad: 'La Paz',
    sigla: 'UCB',
  },
  UNIVALLE: {
    nombre: 'Universidad Privada del Valle — Facultad de Ciencias de la Salud',
    ciudad: 'Cochabamba',
    sigla: 'UNIVALLE',
  },
  UDABOL: {
    nombre: 'Universidad de Aquino Bolivia — Facultad de Ciencias de la Salud',
    ciudad: 'Santa Cruz de la Sierra',
    sigla: 'UDABOL',
  },
  UPEA: {
    nombre: 'Universidad Pública de El Alto — Carrera de Medicina',
    ciudad: 'El Alto',
    sigla: 'UPEA',
  },
  NUR: {
    nombre: 'Universidad NUR — Facultad de Ciencias de la Salud',
    ciudad: 'Santa Cruz de la Sierra',
    sigla: 'NUR',
  },
};

/**
 * Una etapa de trayectoria, en el vocabulario del seeder.
 *
 * `tipo` no viaja a la API —el modelo no distingue formación de empleo— pero
 * sirve para dos cosas acá: escribir el resumen de la corrida por tipo de
 * etapa, y hacer evidente al leer estos datos que la formación se está
 * guardando como afiliación a propósito y no por descuido.
 *
 * @typedef {object} Etapa
 * @property {'GRADO'|'INTERNADO'|'SSSRO'|'RESIDENCIA'|'POSGRADO'|'EJERCICIO'|'DOCENCIA'} tipo
 * @property {string} organizacion Institución, con su nombre completo.
 * @property {string} cargo Título obtenido o cargo ejercido.
 * @property {string} [departamento] Servicio, cátedra o área.
 * @property {string} desde Fecha ISO de inicio.
 * @property {string} [hasta] Fecha ISO de fin; ausente si sigue vigente.
 */

/**
 * El elenco. Catorce profesionales, uno por especialidad, repartidos por las
 * ciudades donde AloVida tiene datos sembrados.
 *
 * `codigoEspecialidad` es la clave con la que el seeder resuelve el concepto
 * real del catálogo (`clinical-forms:specialty:*`): sin ese paso el médico cae
 * bajo «Sin especialidad registrada» en la guía de profesionales.
 */
export const MEDICOS = [
  {
    nombre: 'Marisol',
    apellido: 'Quispe',
    segundoApellido: 'Alanoca',
    titulo: 'Cardióloga',
    especialidad: 'Cardiología',
    codigoEspecialidad: 'cardiologia',
    ciudad: 'La Paz',
    matricula: 'MSD-LP-8842',
    bio: 'Cardióloga con quince años de práctica en La Paz. Atiendo hipertensión, arritmias y control de riesgo cardiovascular, con ergometría y Holter en el mismo consultorio. Trabajo con registro domiciliario de presión: el número que decide un tratamiento tiene que ser el de tu casa, no el del susto de la consulta. Derivo a electrofisiología cuando el caso lo pide y lo digo de frente cuando no hace falta.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2003-02-10',
        hasta: '2008-12-19',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital de Clínicas Universitario',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2009-01-12',
        hasta: '2009-12-18',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Achacachi — Red de Salud Omasuyos',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2010-01-15',
        hasta: '2010-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Obrero N.º 1 — Caja Nacional de Salud',
        cargo: 'Residente de Cardiología (R1 a R3)',
        departamento: 'Servicio de Cardiología',
        desde: '2011-03-01',
        hasta: '2014-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Instituto Nacional de Tórax',
        cargo: 'Formación complementaria en Ecocardiografía y Prueba de Esfuerzo',
        departamento: 'Unidad de Métodos No Invasivos',
        desde: '2014-04-01',
        hasta: '2015-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Clínica del Sur',
        cargo: 'Médica cardióloga de planta',
        departamento: 'Servicio de Cardiología',
        desde: '2015-05-04',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Docente de la cátedra de Semiología Cardiovascular',
        departamento: 'Carrera de Medicina',
        desde: '2018-03-05',
      },
    ],
  },
  {
    nombre: 'Ramiro',
    apellido: 'Mamani',
    segundoApellido: 'Choque',
    titulo: 'Pediatra',
    especialidad: 'Pediatría',
    codigoEspecialidad: 'pediatria',
    ciudad: 'El Alto',
    matricula: 'MSD-LP-9317',
    bio: 'Pediatra de atención primaria en El Alto. Control del niño sano, vacunas y lo que no puede esperar: fiebre, bronquiolitis, diarreas. Atiendo con la libreta de vacunas a la vista y explico cada indicación hasta que quien acompaña al niño la pueda repetir con sus palabras. Si algo no lo sé, lo digo y busco a quien lo sepa.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2005-02-07',
        hasta: '2010-12-17',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital del Niño «Dr. Ovidio Aliaga Uría»',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Pediatría general y Neonatología',
        desde: '2011-01-10',
        hasta: '2011-12-16',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Puesto de Salud Charazani — Red de Salud Bautista Saavedra',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2012-01-16',
        hasta: '2012-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital del Niño «Dr. Ovidio Aliaga Uría»',
        cargo: 'Residente de Pediatría (R1 a R3)',
        departamento: 'Servicio de Pediatría',
        desde: '2013-03-04',
        hasta: '2016-02-29',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital Municipal Boliviano Holandés',
        cargo: 'Médico pediatra de planta',
        departamento: 'Servicio de Pediatría — Consulta externa',
        desde: '2016-04-01',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UPEA.nombre,
        cargo: 'Docente de Pediatría y Puericultura',
        departamento: 'Carrera de Medicina',
        desde: '2020-02-17',
      },
    ],
  },
  {
    nombre: 'Lucía',
    apellido: 'Salas',
    segundoApellido: 'Ferrufino',
    titulo: 'Médica internista',
    especialidad: 'Medicina interna',
    codigoEspecialidad: 'medicina-interna',
    ciudad: 'Cochabamba',
    matricula: 'MSD-CB-4471',
    bio: 'Medicina interna: el paciente adulto que trae varias cosas a la vez. Diabetes, tiroides, presión y colesterol, ordenadas como un solo problema y no como cuatro consultas separadas. Reviso la lista de medicamentos entera al menos una vez al año, porque la mitad de lo que complica a un paciente crónico es lo que quedó indicado y nadie volvió a mirar.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSS.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2002-02-11',
        hasta: '2007-12-14',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Clínico Viedma',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2008-01-14',
        hasta: '2008-12-19',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Independencia — Red de Salud Ayopaya',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2009-01-19',
        hasta: '2009-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Clínico Viedma',
        cargo: 'Residente de Medicina Interna (R1 a R3)',
        departamento: 'Servicio de Medicina Interna',
        desde: '2010-03-01',
        hasta: '2013-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: UNIVERSIDADES.UMSS.nombre,
        cargo: 'Diplomado en Educación Superior en Salud',
        departamento: 'Escuela Universitaria de Posgrado',
        desde: '2014-03-10',
        hasta: '2015-02-27',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital Univalle',
        cargo: 'Médica internista — jefa de consulta externa',
        departamento: 'Servicio de Medicina Interna',
        desde: '2015-04-06',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UMSS.nombre,
        cargo: 'Docente titular de Medicina Interna',
        departamento: 'Carrera de Medicina',
        desde: '2016-02-15',
      },
    ],
  },
  {
    nombre: 'Diego',
    apellido: 'Rivas',
    segundoApellido: 'Antezana',
    titulo: 'Médico de familia',
    especialidad: 'Medicina general',
    codigoEspecialidad: 'medicina-general',
    ciudad: 'Santa Cruz de la Sierra',
    matricula: 'MSD-SC-6620',
    bio: 'Consulta general para adultos y familias. Suelo ser la primera puerta: escucho el motivo entero, examino y pido lo que hace falta. Si te corresponde un especialista te lo digo el mismo día y con el motivo escrito, en vez de mandarte a dar vueltas por cuatro consultorios. Una buena derivación ahorra meses.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UAGRM.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2006-02-13',
        hasta: '2011-12-16',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Universitario Japonés',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2012-01-16',
        hasta: '2012-12-21',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud San Julián — Red de Salud Ñuflo de Chávez',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2013-01-21',
        hasta: '2013-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital San Juan de Dios',
        cargo: 'Residente de Medicina Familiar y Comunitaria (R1 a R3)',
        departamento: 'Servicio de Medicina Familiar',
        desde: '2014-03-03',
        hasta: '2017-02-28',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital Santa María',
        cargo: 'Médico de familia — consulta externa y guardias',
        departamento: 'Atención primaria',
        desde: '2017-04-03',
      },
    ],
  },
  {
    nombre: 'Verónica',
    apellido: 'Aliaga',
    segundoApellido: 'Céspedes',
    titulo: 'Ginecóloga y obstetra',
    especialidad: 'Ginecología y obstetricia',
    codigoEspecialidad: 'ginecologia-obstetricia',
    ciudad: 'La Paz',
    matricula: 'MSD-LP-7154',
    bio: 'Control ginecológico, planificación familiar y embarazo de bajo riesgo. La consulta es larga a propósito: la mayoría de lo que una mujer trae al consultorio no entra en quince minutos, y lo que no se pregunta no aparece. Papanicolaou y colposcopía en el mismo turno cuando hace falta.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UCB.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2004-02-09',
        hasta: '2009-12-11',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital de la Mujer',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Obstetricia y Ginecología',
        desde: '2010-01-11',
        hasta: '2010-12-17',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Coroico — Red de Salud Nor Yungas',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2011-01-17',
        hasta: '2011-12-30',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital de la Mujer',
        cargo: 'Residente de Ginecología y Obstetricia (R1 a R4)',
        departamento: 'Servicio de Obstetricia',
        desde: '2012-03-01',
        hasta: '2016-02-29',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Hospital Materno Infantil — Caja Nacional de Salud',
        cargo: 'Formación en Colposcopía y Patología del Tracto Genital Inferior',
        departamento: 'Unidad de Patología Cervical',
        desde: '2016-04-04',
        hasta: '2017-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Centro Médico Sopocachi',
        cargo: 'Médica ginecóloga y obstetra',
        departamento: 'Consultorio de Ginecología',
        desde: '2017-05-08',
      },
    ],
  },
  {
    nombre: 'Jorge',
    apellido: 'Terceros',
    segundoApellido: 'Áñez',
    titulo: 'Traumatólogo',
    especialidad: 'Traumatología y ortopedia',
    codigoEspecialidad: 'traumatologia',
    ciudad: 'Santa Cruz de la Sierra',
    matricula: 'MSD-SC-5083',
    bio: 'Lesiones de rodilla y hombro, y la traumatología del que hace deporte sin ser profesional. Artroscopía y rehabilitación acompañada: la cirugía es la mitad del tratamiento y la otra mitad son los tres meses que vienen después. Opero lo que hay que operar y digo con la misma claridad lo que no.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UAGRM.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2001-02-12',
        hasta: '2006-12-15',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital San Juan de Dios',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Cirugía y Traumatología',
        desde: '2007-01-15',
        hasta: '2007-12-20',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Vallegrande — Red de Salud Vallegrande',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2008-01-21',
        hasta: '2008-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital San Juan de Dios',
        cargo: 'Residente de Traumatología y Ortopedia (R1 a R4)',
        departamento: 'Servicio de Traumatología',
        desde: '2009-03-02',
        hasta: '2013-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Hospital Universitario Japonés',
        cargo: 'Formación en Cirugía Artroscópica de Rodilla y Hombro',
        departamento: 'Unidad de Artroscopía',
        desde: '2013-04-01',
        hasta: '2014-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Clínica Foianini',
        cargo: 'Cirujano traumatólogo',
        departamento: 'Servicio de Traumatología y Ortopedia',
        desde: '2014-05-05',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UDABOL.nombre,
        cargo: 'Docente de Anatomía del Aparato Locomotor',
        departamento: 'Carrera de Medicina',
        desde: '2019-02-11',
      },
    ],
  },
  {
    nombre: 'Patricia',
    apellido: 'Vargas',
    segundoApellido: 'Rocha',
    titulo: 'Dermatóloga',
    especialidad: 'Dermatología',
    codigoEspecialidad: 'dermatologia',
    ciudad: 'Cochabamba',
    matricula: 'MSD-CB-3908',
    bio: 'Dermatología clínica: acné, dermatitis, caída de cabello y control de lunares con dermatoscopía digital. Reviso la piel entera aunque la consulta venga por una sola mancha, porque lo que trae al paciente casi nunca es lo único que hay para ver.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UNIVALLE.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2005-02-14',
        hasta: '2010-12-10',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Clínico Viedma',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2011-01-10',
        hasta: '2011-12-16',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Aiquile — Red de Salud Campero',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2012-01-16',
        hasta: '2012-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Obrero N.º 2 — Caja Nacional de Salud',
        cargo: 'Residente de Dermatología (R1 a R3)',
        departamento: 'Servicio de Dermatología',
        desde: '2013-03-04',
        hasta: '2016-02-29',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Instituto Boliviano de Dermatología',
        cargo: 'Formación en Dermatoscopía y Cirugía Dermatológica',
        departamento: 'Unidad de Lesiones Pigmentadas',
        desde: '2016-04-04',
        hasta: '2017-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Clínica Los Olivos',
        cargo: 'Médica dermatóloga',
        departamento: 'Consultorio de Dermatología',
        desde: '2017-05-02',
      },
    ],
  },
  {
    nombre: 'Andrés',
    apellido: 'Colque',
    segundoApellido: 'Huanca',
    titulo: 'Psiquiatra',
    especialidad: 'Psiquiatría y salud mental',
    codigoEspecialidad: 'psiquiatria',
    ciudad: 'La Paz',
    matricula: 'MSD-LP-6612',
    bio: 'Ansiedad, depresión y trastornos del sueño en adultos. Trabajo con psicoterapia y, cuando hace falta, medicación explicada: qué hace, cuánto tarda, qué esperar las primeras dos semanas y cuándo se deja. Nadie tendría que empezar un tratamiento sin saber cómo termina.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2004-02-10',
        hasta: '2009-12-18',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital de Clínicas Universitario',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2010-01-11',
        hasta: '2010-12-17',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Patacamaya — Red de Salud Aroma',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2011-01-17',
        hasta: '2011-12-30',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Instituto Nacional de Psiquiatría «Gregorio Pacheco»',
        cargo: 'Residente de Psiquiatría (R1 a R3)',
        departamento: 'Servicio de Psiquiatría de Adultos',
        desde: '2012-03-01',
        hasta: '2015-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: UNIVERSIDADES.UCB.nombre,
        cargo: 'Maestría en Psicoterapia Cognitivo-Conductual',
        departamento: 'Departamento de Posgrado en Salud',
        desde: '2015-08-10',
        hasta: '2017-07-28',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Centro Médico Sopocachi',
        cargo: 'Médico psiquiatra',
        departamento: 'Consultorio de Salud Mental',
        desde: '2015-04-06',
      },
    ],
  },
  {
    nombre: 'Silvia',
    apellido: 'Rojas',
    segundoApellido: 'Camargo',
    titulo: 'Endocrinóloga',
    especialidad: 'Endocrinología',
    codigoEspecialidad: 'endocrinologia',
    ciudad: 'Sucre',
    matricula: 'MSD-CH-2276',
    bio: 'Diabetes, tiroides y obesidad con enfoque metabólico. Ajusto el tratamiento con los datos del paciente y no con un esquema fijo, y eso pide controles más seguidos al principio y muchos menos después. La meta se decide entre los dos, con los números a la vista.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.USFX.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2003-02-17',
        hasta: '2008-12-12',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Santa Bárbara',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2009-01-12',
        hasta: '2009-12-18',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Monteagudo — Red de Salud Hernando Siles',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2010-01-18',
        hasta: '2010-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Obrero N.º 1 — Caja Nacional de Salud',
        cargo: 'Residente de Medicina Interna (R1 a R3)',
        departamento: 'Servicio de Medicina Interna',
        desde: '2011-03-01',
        hasta: '2014-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Hospital Obrero N.º 1 — Caja Nacional de Salud',
        cargo: 'Subespecialidad en Endocrinología y Metabolismo',
        departamento: 'Unidad de Endocrinología',
        desde: '2014-03-03',
        hasta: '2016-02-26',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Clínica Cristo de las Américas',
        cargo: 'Médica endocrinóloga',
        departamento: 'Consultorio de Endocrinología',
        desde: '2016-04-04',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.USFX.nombre,
        cargo: 'Docente de Fisiopatología Endocrina',
        departamento: 'Carrera de Medicina',
        desde: '2018-02-19',
      },
    ],
  },
  {
    nombre: 'Fernando',
    apellido: 'Peña',
    segundoApellido: 'Gutiérrez',
    titulo: 'Oftalmólogo',
    especialidad: 'Oftalmología',
    codigoEspecialidad: 'oftalmologia',
    ciudad: 'Tarija',
    matricula: 'MSD-TJ-1845',
    bio: 'Consulta oftalmológica general, control de glaucoma y cirugía de catarata. Reviso fondo de ojo en todo paciente con diabetes aunque venga sólo por lentes: la retinopatía no avisa, y cuando avisa ya avanzó.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UAJMS.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2002-02-18',
        hasta: '2007-12-14',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Regional San Juan de Dios de Tarija',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2008-01-14',
        hasta: '2008-12-19',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Yacuiba — Red de Salud Gran Chaco',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2009-01-19',
        hasta: '2009-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Instituto Nacional de Oftalmología',
        cargo: 'Residente de Oftalmología (R1 a R3)',
        departamento: 'Servicio de Segmento Anterior',
        desde: '2010-03-01',
        hasta: '2013-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Instituto Nacional de Oftalmología',
        cargo: 'Formación en Cirugía de Catarata por Facoemulsificación',
        departamento: 'Unidad de Cirugía Ambulatoria',
        desde: '2013-04-01',
        hasta: '2014-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Clínica Los Chacos',
        cargo: 'Médico oftalmólogo y cirujano',
        departamento: 'Consultorio de Oftalmología',
        desde: '2014-05-05',
      },
    ],
  },
  {
    nombre: 'Gabriela',
    apellido: 'Ortuño',
    segundoApellido: 'Zenteno',
    titulo: 'Neuróloga',
    especialidad: 'Neurología',
    codigoEspecialidad: 'neurologia',
    ciudad: 'Cochabamba',
    matricula: 'MSD-CB-5590',
    bio: 'Neurología clínica de adultos: migraña, epilepsia, deterioro de memoria y secuelas de accidente cerebrovascular. La primera consulta dura una hora porque la historia es el estudio más importante que existe en neurología, y ningún resonador la reemplaza.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSS.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2004-02-16',
        hasta: '2009-12-11',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Clínico Viedma',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2010-01-11',
        hasta: '2010-12-17',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Villa Tunari — Red de Salud Chapare',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2011-01-17',
        hasta: '2011-12-30',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Obrero N.º 2 — Caja Nacional de Salud',
        cargo: 'Residente de Neurología (R1 a R4)',
        departamento: 'Servicio de Neurología',
        desde: '2012-03-01',
        hasta: '2016-02-29',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Hospital Clínico Viedma',
        cargo: 'Formación en Electroencefalografía y Epilepsia',
        departamento: 'Unidad de Neurofisiología',
        desde: '2016-04-04',
        hasta: '2017-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital Univalle',
        cargo: 'Médica neuróloga',
        departamento: 'Servicio de Neurología',
        desde: '2017-05-02',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UNIVALLE.nombre,
        cargo: 'Docente de Neuroanatomía y Neurología Clínica',
        departamento: 'Carrera de Medicina',
        desde: '2019-02-18',
      },
    ],
  },
  {
    nombre: 'Óscar',
    apellido: 'Villarroel',
    segundoApellido: 'Nina',
    titulo: 'Gastroenterólogo',
    especialidad: 'Gastroenterología',
    codigoEspecialidad: 'gastroenterologia',
    ciudad: 'La Paz',
    matricula: 'MSD-LP-4038',
    bio: 'Gastroenterología y endoscopía digestiva. Reflujo, gastritis, Helicobacter pylori, hígado graso y tamizaje de cáncer de colon. Explico cada estudio antes de pedirlo: una endoscopía que el paciente no entiende es una endoscopía que se suspende el día del turno.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2001-02-12',
        hasta: '2006-12-15',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital de Clínicas Universitario',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2007-01-15',
        hasta: '2007-12-20',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Apolo — Red de Salud Franz Tamayo',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2008-01-21',
        hasta: '2008-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital Obrero N.º 1 — Caja Nacional de Salud',
        cargo: 'Residente de Medicina Interna (R1 a R3)',
        departamento: 'Servicio de Medicina Interna',
        desde: '2009-03-02',
        hasta: '2012-02-29',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Instituto Gastroenterológico Boliviano-Japonés',
        cargo: 'Subespecialidad en Gastroenterología y Endoscopía Digestiva',
        departamento: 'Unidad de Endoscopía',
        desde: '2012-03-05',
        hasta: '2014-02-28',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Instituto Gastroenterológico Boliviano-Japonés',
        cargo: 'Médico gastroenterólogo — endoscopista',
        departamento: 'Unidad de Endoscopía Digestiva',
        desde: '2014-04-01',
      },
    ],
  },
  {
    nombre: 'Carla',
    apellido: 'Ibáñez',
    segundoApellido: 'Suárez',
    titulo: 'Neumóloga',
    especialidad: 'Neumología',
    codigoEspecialidad: 'neumologia',
    ciudad: 'Santa Cruz de la Sierra',
    matricula: 'MSD-SC-7729',
    bio: 'Asma, EPOC, tos crónica y estudios del sueño. Enseño técnica de inhalador en la consulta y la vuelvo a revisar en cada control: la mitad de los tratamientos que «no funcionan» son tratamientos que no llegan al pulmón.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UAGRM.nombre,
        cargo: 'Doctora en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2005-02-14',
        hasta: '2010-12-10',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Universitario Japonés',
        cargo: 'Interna rotatoria de pregrado',
        departamento: 'Medicina interna, Cirugía, Pediatría y Ginecología',
        desde: '2011-01-10',
        hasta: '2011-12-16',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Camiri — Red de Salud Cordillera',
        cargo: 'Médica SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2012-01-16',
        hasta: '2012-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Instituto Nacional de Tórax',
        cargo: 'Residente de Neumología (R1 a R3)',
        departamento: 'Servicio de Neumología',
        desde: '2013-03-04',
        hasta: '2016-02-29',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Instituto Nacional de Tórax',
        cargo: 'Formación en Medicina del Sueño y Ventilación No Invasiva',
        departamento: 'Laboratorio de Sueño',
        desde: '2016-04-04',
        hasta: '2017-03-31',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital Santa María',
        cargo: 'Médica neumóloga',
        departamento: 'Servicio de Neumología',
        desde: '2017-05-02',
      },
    ],
  },
  {
    nombre: 'Rodrigo',
    apellido: 'Mendoza',
    segundoApellido: 'Calderón',
    titulo: 'Médico emergenciólogo',
    especialidad: 'Medicina de Emergencia',
    codigoEspecialidad: 'medicina-emergencia',
    ciudad: 'El Alto',
    matricula: 'MSD-LP-8801',
    bio: 'Medicina de emergencia y trauma. Guardias en El Alto desde hace diez años. Escribo sobre lo que veo llegar tarde: infartos que esperaron, quemaduras mal tratadas en casa, intoxicaciones por remedios caseros. Lo que se sabe antes de llegar a una emergencia cambia lo que se puede hacer adentro.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Doctor en Medicina — título en provisión nacional',
        departamento: 'Carrera de Medicina',
        desde: '2003-02-10',
        hasta: '2008-12-19',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital Municipal Boliviano Holandés',
        cargo: 'Interno rotatorio de pregrado',
        departamento: 'Emergencias, Cirugía y Medicina interna',
        desde: '2009-01-12',
        hasta: '2009-12-18',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Puesto de Salud Curahuara de Carangas — Red de Salud Sajama',
        cargo: 'Médico SAFCI — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Primer nivel de atención',
        desde: '2010-01-15',
        hasta: '2010-12-31',
      },
      {
        tipo: 'RESIDENCIA',
        organizacion: 'Hospital de Clínicas Universitario',
        cargo: 'Residente de Medicina de Emergencias (R1 a R3)',
        departamento: 'Servicio de Emergencias',
        desde: '2011-03-01',
        hasta: '2014-02-28',
      },
      {
        tipo: 'POSGRADO',
        organizacion: 'Sociedad Boliviana de Medicina Crítica y Terapia Intensiva',
        cargo: 'Instructor certificado de Soporte Vital Avanzado (ACLS y ATLS)',
        departamento: 'Comité de Capacitación',
        desde: '2015-06-01',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Hospital del Norte',
        cargo: 'Médico de planta — jefe de guardia de Emergencias',
        departamento: 'Servicio de Emergencias',
        desde: '2014-04-01',
      },
    ],
  },
  {
    nombre: 'Elena',
    apellido: 'Chuquimia',
    segundoApellido: 'Poma',
    titulo: 'Nutricionista clínica',
    especialidad: 'Nutrición y Dietética',
    codigoEspecialidad: 'nutricion',
    ciudad: 'La Paz',
    matricula: 'NUT-LP-1163',
    bio: 'Nutrición clínica para diabetes, hipertensión, embarazo y anemia. Trabajo con lo que se come acá y con lo que se consigue en el mercado del barrio: la quinua, la papa, el chuño y el maíz no son un problema, son la base. Un plan que pide alimentos que nadie vende cerca es un plan que no se cumple.',
    trayectoria: [
      {
        tipo: 'GRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Licenciada en Nutrición y Dietética',
        departamento: 'Carrera de Nutrición y Dietética',
        desde: '2008-02-11',
        hasta: '2012-12-14',
      },
      {
        tipo: 'INTERNADO',
        organizacion: 'Hospital de Clínicas Universitario',
        cargo: 'Internado en Nutrición Clínica',
        departamento: 'Unidad de Soporte Nutricional',
        desde: '2013-01-14',
        hasta: '2013-12-20',
      },
      {
        tipo: 'SSSRO',
        organizacion: 'Centro de Salud Viacha — Red de Salud Ingavi',
        cargo: 'Nutricionista — Servicio Social de Salud Rural Obligatorio',
        departamento: 'Programa Desnutrición Cero',
        desde: '2014-01-20',
        hasta: '2014-12-31',
      },
      {
        tipo: 'POSGRADO',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Maestría en Nutrición Clínica y Metabolismo',
        departamento: 'Escuela de Posgrado en Salud Pública',
        desde: '2016-03-07',
        hasta: '2018-02-23',
      },
      {
        tipo: 'EJERCICIO',
        organizacion: 'Centro Médico Sopocachi',
        cargo: 'Nutricionista clínica',
        departamento: 'Consultorio de Nutrición',
        desde: '2015-03-02',
      },
      {
        tipo: 'DOCENCIA',
        organizacion: UNIVERSIDADES.UMSA.nombre,
        cargo: 'Docente de Nutrición del Adulto',
        departamento: 'Carrera de Nutrición y Dietética',
        desde: '2019-02-18',
      },
    ],
  },
];
