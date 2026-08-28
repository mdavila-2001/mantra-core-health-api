/**
 * publicaciones.mjs — Lo que publica cada especialidad en la vitrina pública.
 *
 * ## Por qué el contenido está escrito y no generado
 *
 * La sección «Publicaciones» de una ficha sólo se puede juzgar —tipografía,
 * ancho de lectura, dónde corta el «Ver más», cómo queda la tarjeta con una
 * imagen y con tres— cuando el texto tiene el peso que va a tener en
 * producción. Un `lorem ipsum`, o cuatro frases repetidas en sesenta tarjetas,
 * hacen que todo se vea bien y no prueban nada.
 *
 * Son **cuatro publicaciones por especialidad**, todas distintas, de dos a
 * cuatro párrafos, en la voz de quien las firma y sobre lo que esa especialidad
 * de verdad tiene que explicar. Con quince profesionales en el elenco eso da
 * sesenta publicaciones, cada una con sus etiquetas y su imagen.
 *
 * `imagen` es la consulta con la que el seeder busca una foto en un banco
 * libre; la baja, la sube a `common.files` y la adjunta. `null` deja la
 * publicación sólo de texto, que también hay que poder ver.
 */

/**
 * Publicaciones que puede firmar cualquiera: son de higiene sanitaria general
 * y no de una especialidad. Sirven de reserva cuando una especialidad tiene
 * menos entradas propias que publicaciones pedidas por médico.
 */
export const GENERALES = [
  {
    texto:
      'Traer los estudios previos a la consulta cambia el resultado.\n\nNo es burocracia. Sin el laboratorio anterior no se puede saber si un valor subió, bajó o siempre fue así, y esa diferencia decide si hoy pedimos algo nuevo o esperamos. Un mismo colesterol de 210 es una buena noticia en quien venía de 260 y una señal de alarma en quien venía de 170.\n\nSi los tenés en papel, una foto legible alcanza. Si están en otra institución, casi siempre te los entregan pidiéndolos en admisión con tu documento.',
    hashtags: ['prevención', 'consultaMédica', 'saludBolivia'],
    imagen: 'documentos-clinicos',
  },
  {
    texto:
      'El control anual no es un trámite.\n\nLa mitad de lo que encontramos a tiempo no daba ningún síntoma cuando lo encontramos: presión alta, azúcar en el límite, una tiroides que empieza a fallar. Ninguna de esas cosas duele hasta que ya hizo daño.\n\nUn control razonable para un adulto sano es una consulta clínica al año, con presión, peso, y análisis de sangre y orina. Si hay antecedentes en la familia, el médico ajusta desde ahí.',
    hashtags: ['chequeoAnual', 'prevención', 'medicinaPreventiva'],
    imagen: 'control-medico-anual',
  },
  {
    texto:
      'Si te indicaron un antibiótico, terminá el esquema completo.\n\nAunque te sientas bien al segundo día. Cortarlo antes deja vivas a las bacterias más resistentes —justamente las que costó más matar— y esas son las que vuelven, ahora sin miedo a ese antibiótico.\n\nY al revés: el antibiótico no sirve para la gripe, ni para la mayoría de los dolores de garganta, ni para el resfrío. Tomarlo «por las dudas» no acorta nada y sí gasta una herramienta que es de todos.',
    hashtags: ['usoResponsableDeAntibióticos', 'resistenciaAntimicrobiana'],
    imagen: 'antibioticos-farmacia',
  },
  {
    texto:
      'Cómo saber si una fiebre puede esperar al día siguiente.\n\nEn un adulto, una fiebre sola, que baja con paracetamol y deja hacer vida más o menos normal, casi siempre puede verse en un turno normal. Lo que cambia el plan es la compañía: falta de aire, dolor de pecho, confusión, una mancha en la piel que no desaparece al apretarla, o fiebre que ya lleva más de tres días sin ceder.\n\nEn bebés menores de tres meses, cualquier fiebre es consulta el mismo día. Ahí no se espera.',
    hashtags: ['fiebre', 'cuándoConsultar', 'urgencias'],
    imagen: 'termometro-fiebre',
  },
  {
    texto:
      'Vivimos a 3.600 metros y eso cambia varios números.\n\nEn altura, la hemoglobina normal es más alta que a nivel del mar, y la saturación de oxígeno también se lee distinta: un 92 % en La Paz no significa lo mismo que un 92 % en Santa Cruz. Un laboratorio interpretado con tablas de otro país puede hacerte creer que tenés una enfermedad que no tenés —o taparte una que sí.\n\nCuando te entreguen un resultado, preguntá con qué referencia lo están leyendo. Es una pregunta corta que evita estudios de más.',
    hashtags: ['altura', 'saludBolivia', 'laboratorio', 'hemoglobina'],
    imagen: 'ciudad-altura-andes',
  },
];

/**
 * Lo propio de cada especialidad, indexado por el mismo código corto que usa
 * `MEDICOS.codigoEspecialidad` en `elenco-medico.mjs`.
 */
export const POR_ESPECIALIDAD = {
  cardiologia: [
    {
      texto:
        'La presión se mide sentado, con la espalda apoyada, los pies en el piso y el brazo a la altura del corazón, después de cinco minutos quieto y sin haber tomado café ni fumado en la media hora previa.\n\nMedida de cualquier otra forma —parado, apurado, con la vejiga llena— el número sale alto y no sirve para decidir nada. Un tratamiento ajustado con mediciones mal tomadas es un tratamiento mal ajustado.\n\nLo mejor para el control es un registro en casa: dos tomas a la mañana y dos a la noche, durante una semana, anotadas con fecha y hora. Ese cuaderno vale más que una sola medición en el consultorio.',
      hashtags: ['hipertensión', 'presiónArterial', 'cardiología'],
      imagen: 'tensiometro-presion-arterial',
    },
    {
      texto:
        'Tres señales que sí ameritan ir a una emergencia, no esperar un turno:\n\n1. Dolor o presión en el pecho que aparece con el esfuerzo y cede con el reposo.\n2. Falta de aire que aparece al acostarse y obliga a dormir con más almohadas.\n3. Desmayo sin aviso, sobre todo si fue haciendo un esfuerzo.\n\nEl resto de las molestias del pecho —pinchazos que duran un segundo, dolor que cambia al respirar o al apretar con el dedo— casi nunca son del corazón. Pero si hay dudas se consulta: perder una hora en una guardia es barato comparado con lo otro.',
      hashtags: ['infarto', 'señalesDeAlarma', 'cardiología'],
      imagen: 'electrocardiograma-corazon',
    },
    {
      texto:
        'Sobre la sal: el problema casi nunca es el salero.\n\nAlrededor de tres cuartas partes de la sal que come una persona ya venía adentro de lo que compró: pan, embutidos, caldos en cubo, snacks, conservas y salsas. Sacar el salero de la mesa ayuda, pero mueve poco si el resto no cambia.\n\nDos gestos que sí mueven la aguja: leer el sodio en la etiqueta —por cada 100 gramos, no por porción, que las porciones están dibujadas para que el número parezca chico— y cocinar el mismo plato con la mitad de sal durante dos semanas. El gusto se reeduca; la presión responde antes que el paladar.',
      hashtags: ['sodio', 'hipertensión', 'alimentación', 'cardiología'],
      imagen: 'sal-alimentacion-etiquetas',
    },
    {
      texto:
        'El Holter no es «un electro más largo», y por eso a veces lo pido cuando el electro salió normal.\n\nUn electrocardiograma es una foto de treinta segundos. Si tu palpitación aparece dos veces por semana, la probabilidad de que caiga justo en esos treinta segundos es casi nula. El Holter graba 24 o 48 horas seguidas, y ahí sí aparece —o se demuestra que no está.\n\nDos cosas que te van a pedir y conviene saber de antes: llevar un diario de síntomas con la hora exacta (eso es lo que hace útil el estudio) y no bañarse con el equipo puesto. Y sí, se duerme con él.',
      hashtags: ['holter', 'arritmias', 'palpitaciones', 'cardiología'],
      imagen: 'monitor-holter-cardiaco',
    },
  ],

  pediatria: [
    {
      texto:
        'La libreta de vacunas es el documento de salud más importante que tiene tu hijo. Traela a cada consulta, aunque la visita sea por otra cosa.\n\nEn cada control revisamos qué toca y qué quedó pendiente. Una vacuna atrasada no se pierde: se retoma desde donde quedó, no se empieza de cero. Lo que no se recupera es el tiempo en que el chico estuvo sin protección.\n\nSi la perdiste, en el establecimiento donde lo vacunaron tienen el registro y te la reconstruyen. Andá con el documento de la mamá o del papá.',
      hashtags: ['vacunas', 'pediatría', 'controlDelNiñoSano'],
      imagen: 'vacunacion-infantil',
    },
    {
      texto:
        'Bronquiolitis: qué es y cuándo preocuparse.\n\nEs una infección viral de las vías respiratorias más chicas, común en menores de dos años y sobre todo en invierno. Empieza como un resfrío y al segundo o tercer día aparece la tos y esa respiración silbante que se escucha desde la puerta.\n\nLo que se vigila en casa: que respire rápido o con el pecho hundido entre las costillas, que le cueste comer o dormir por la falta de aire, que se ponga pálido o azulado alrededor de la boca. Cualquiera de esas tres cosas es consulta inmediata.\n\nEl resto se maneja con paciencia, líquidos fraccionados y lavados nasales antes de cada comida. El antibiótico no hace nada contra un virus.',
      hashtags: ['bronquiolitis', 'pediatría', 'saludRespiratoria'],
      imagen: 'bebe-nebulizacion',
    },
    {
      texto:
        'Diarrea en niños: lo que salva es el suero, no el antibiótico.\n\nLa mayoría de las diarreas de la infancia son virales y se curan solas. Lo que hace daño no es el germen: es la deshidratación. Las sales de rehidratación oral del sobre —que se dan en cualquier centro de salud— reponen exactamente lo que se está perdiendo, y se ofrecen a cucharaditas, seguido, aunque vomite.\n\nZinc por 14 días acorta el cuadro y reduce la próxima diarrea. Eso sí tiene evidencia.\n\nSeñales de ir ya: no orina en seis horas, llora sin lágrimas, está muy decaído o hundido de ojos, sangre en las heces, o vómitos que no dejan pasar ni el suero.',
      hashtags: ['diarrea', 'rehidratación', 'zinc', 'pediatría'],
      imagen: 'suero-rehidratacion-oral',
    },
    {
      texto:
        'Cuánto tendría que dormir un chico, y por qué importa más de lo que parece.\n\nDe 1 a 2 años, entre 11 y 14 horas contando la siesta. De 3 a 5, entre 10 y 13. De 6 a 12, entre 9 y 12. Adolescentes, entre 8 y 10 — y casi ninguno las duerme.\n\nEl sueño corto crónico no se ve como sueño: se ve como irritabilidad, bajo rendimiento escolar, hambre desordenada y, en los más chicos, como hiperactividad. Antes de estudiar un problema de conducta conviene preguntar a qué hora se acuesta.\n\nLo que más ayuda: pantallas fuera del cuarto y la misma hora de acostarse también el fin de semana.',
      hashtags: ['sueñoInfantil', 'pediatría', 'crianza'],
      imagen: 'nino-durmiendo-habitacion',
    },
  ],

  'medicina-interna': [
    {
      texto:
        'Tener varias enfermedades crónicas a la vez —diabetes, presión, tiroides, colesterol— no es tener varios problemas separados. Es un solo sistema que hay que mantener en equilibrio.\n\nEl error frecuente es que cada especialista ajusta lo suyo sin mirar el resto, y el paciente termina con doce pastillas que compiten entre sí. La medicina interna existe para ordenar eso: una sola mirada, la lista de medicación revisada entera y controles que se agrupan en vez de multiplicarse.\n\nSi tomás más de cinco medicamentos, pedí una revisión completa de la lista al menos una vez al año. Se llama deprescripción y a veces la mejor indicación es sacar.',
      hashtags: ['enfermedadesCrónicas', 'polifarmacia', 'medicinaInterna'],
      imagen: 'pastillero-medicacion-cronica',
    },
    {
      texto:
        'Traé la bolsa con todo lo que tomás. Toda.\n\nNo una lista escrita de memoria: los frascos. Incluyendo lo que comprás sin receta, lo que te sobró de otra vez, los suplementos, el mate de hierbas y lo que te recomendó una vecina. Esas cuatro categorías son las que producen la mitad de las interacciones que veo.\n\nDos ejemplos concretos: el ibuprofeno tomado seguido sube la presión y castiga al riñón en quien ya tiene presión alta; y varias hierbas de uso común alteran la coagulación en quien toma anticoagulantes. Ninguna de las dos cosas aparece si no las contás, porque «eso no es un medicamento».',
      hashtags: ['interacciones', 'automedicación', 'medicinaInterna'],
      imagen: 'medicamentos-mesa-consulta',
    },
    {
      texto:
        'Anemia no es un diagnóstico: es un hallazgo que obliga a preguntar por qué.\n\nEn Bolivia la causa más común sigue siendo la falta de hierro, y en altura además se lee distinto: los valores normales de hemoglobina son más altos que a nivel del mar, así que una anemia puede quedar escondida detrás de un número que en otro país sería normal.\n\nTratar con hierro sin buscar la causa es tapar una luz de alarma. En una mujer joven, casi siempre son las pérdidas menstruales; después de los 50, en cualquiera de los dos sexos, hay que descartar pérdida digestiva antes de conformarse con el suplemento.',
      hashtags: ['anemia', 'hierro', 'altura', 'medicinaInterna'],
      imagen: 'analisis-sangre-laboratorio',
    },
    {
      texto:
        'Sobre el «me hago un chequeo completo»: no existe, y menos es mejor.\n\nPedir cuarenta análisis a alguien sin síntomas garantiza que dos o tres salgan levemente fuera de rango por puro azar estadístico. Cada uno de esos abre una cadena de estudios, de gastos y de sustos que casi siempre termina en nada.\n\nLo que sí tiene respaldo, en un adulto sano: presión, peso y perímetro de cintura, glucemia, perfil de lípidos, función renal, hemograma y orina. Sumá según la edad el Papanicolaou, la mamografía, el tamizaje de colon y el fondo de ojo si hay diabetes.\n\nEso es un chequeo. Lo demás se pide cuando hay una pregunta que responder.',
      hashtags: ['chequeo', 'prevenciónCuaternaria', 'medicinaInterna'],
      imagen: 'consulta-medica-escritorio',
    },
  ],

  'medicina-general': [
    {
      texto:
        'Qué esperar de una consulta con el médico de familia.\n\nNo soy el final del camino: muchas veces soy la primera puerta. Escucho el motivo entero —y el motivo entero suele aparecer recién en el minuto siete—, examino y pido lo que hace falta para entender qué pasa. Si el problema se resuelve acá, lo resolvemos.\n\nSi necesitás un especialista te lo digo el mismo día, con el nombre de la especialidad y el motivo escrito en la derivación. Una buena derivación ahorra meses; una consulta general bien hecha evita la mitad de las derivaciones.',
      hashtags: ['atenciónPrimaria', 'medicinaFamiliar', 'saludBolivia'],
      imagen: 'consultorio-medico-general',
    },
    {
      texto:
        'Cómo aprovechar quince minutos de consulta.\n\nAnotá antes de venir tres cosas: qué te pasa (con desde cuándo y cómo empezó), qué tomás, y qué querés saber. Ese papelito cambia la consulta entera.\n\nDecí primero lo que más te preocupa, no lo que te parece más presentable. Lo que más asusta suele salir en la puerta, cuando ya no hay tiempo — y es casi siempre lo importante.\n\nY si algo de lo que indiqué no lo vas a poder hacer —por plata, por horario, por distancia— decilo en el momento. Un plan que no se puede cumplir no es un plan: es una forma cara de perder dos meses.',
      hashtags: ['consultaMédica', 'atenciónPrimaria', 'medicinaFamiliar'],
      imagen: 'paciente-notas-consulta',
    },
    {
      texto:
        'Dolor de garganta: cuándo es viral y cuándo no.\n\nSi hay tos, mocos, ronquera y estornudos, es viral en la enorme mayoría de los casos, y el antibiótico no acorta ni un día. Se trata el síntoma: líquidos, analgésico y paciencia.\n\nLo que hace sospechar una faringitis bacteriana es lo contrario: fiebre alta sin tos, ganglios del cuello dolorosos, placas en las amígdalas — sobre todo entre los 5 y los 15 años. Ahí sí conviene evaluar y, si corresponde, tratar.\n\nLa diferencia importa: la faringitis por estreptococo mal tratada puede complicarse; el resfrío tratado con antibiótico sólo deja bacterias más resistentes para la próxima.',
      hashtags: ['faringitis', 'antibióticos', 'medicinaFamiliar'],
      imagen: 'dolor-garganta-consulta',
    },
    {
      texto:
        'Certificados, recetas y trámites: qué se puede resolver sin ocupar un turno.\n\nUna receta de continuación de un tratamiento crónico estable, la repetición de una orden de laboratorio o un certificado de asistencia no necesitan una consulta completa. Preguntá en admisión cómo se piden en tu centro.\n\nSí necesitan consulta: un certificado de aptitud física, cualquier cambio de dosis, y todo lo que implique afirmar algo sobre tu estado de salud hoy. Un médico no puede certificar lo que no examinó, y el que lo hace no te está haciendo un favor.',
      hashtags: ['trámites', 'recetas', 'atenciónPrimaria'],
      imagen: 'receta-medica-formulario',
    },
  ],

  'ginecologia-obstetricia': [
    {
      texto:
        'El Papanicolaou detecta cambios en el cuello del útero años antes de que se conviertan en un problema serio. Ese margen de años es lo que lo hace tan efectivo: da tiempo de sobra para actuar.\n\nLa recomendación general es empezar a los 25 y repetir cada tres años si los resultados son normales, o según lo que indique tu ginecóloga si hubo algún hallazgo. Sumado a la vacuna contra el VPH, es la prevención de cáncer más eficaz que tenemos hoy.\n\nNo duele, dura dos minutos y no necesitás derivación para pedirlo. En Bolivia es gratuito en los establecimientos públicos.',
      hashtags: ['papanicolaou', 'prevención', 'saludDeLaMujer', 'VPH'],
      imagen: 'salud-de-la-mujer-consulta',
    },
    {
      texto:
        'Los controles del embarazo no son cinco visitas iguales. Cada una busca algo distinto y por eso el calendario es el que es.\n\nAntes de las 12 semanas: confirmar el embarazo y las semanas exactas, laboratorio completo, y empezar el ácido fólico y el hierro. Entre 20 y 24: la ecografía que mira la anatomía del bebé en detalle. Entre 24 y 28: la prueba de tolerancia a la glucosa, que busca diabetes del embarazo —que no da síntomas y sí da complicaciones—. Desde las 28: presión, crecimiento y posición, cada vez más seguido.\n\nSaltarse uno no se compensa yendo dos veces al siguiente: lo que se buscaba en esa ventana ya no se puede buscar igual.',
      hashtags: ['embarazo', 'controlPrenatal', 'obstetricia'],
      imagen: 'ecografia-control-prenatal',
    },
    {
      texto:
        'Anticoncepción: no hay un método mejor, hay un método mejor para vos.\n\nLo que decide no es sólo la eficacia: es si vas a poder usarlo bien. La píldora falla poco en el papel y bastante en la vida real, porque exige acordarse todos los días a la misma hora. El implante y el DIU no dependen de la memoria de nadie, duran entre tres y diez años, y se sacan cuando querés.\n\nDos cosas que se preguntan mucho: ninguno de estos métodos afecta la fertilidad futura, y el DIU también se puede colocar si nunca tuviste hijos.\n\nY el preservativo sigue siendo el único que además previene infecciones de transmisión sexual. Los dos métodos juntos no compiten: se suman.',
      hashtags: ['anticoncepción', 'planificaciónFamiliar', 'saludDeLaMujer'],
      imagen: 'planificacion-familiar-consulta',
    },
    {
      texto:
        'La menopausia no es una enfermedad, pero tampoco es «aguantar y ya».\n\nLos calores, el insomnio, la sequedad y los cambios de ánimo son síntomas reales, tienen tratamiento y no hay ningún premio por soportarlos en silencio. Hay opciones hormonales y no hormonales, y cuál conviene depende de tu historia —no de lo que le funcionó a una amiga.\n\nLo que sí hay que atender aunque no moleste: el hueso. La pérdida de masa ósea se acelera en los primeros años después de la última menstruación y no avisa hasta que hay una fractura. Calcio, vitamina D, caminar con peso y, si corresponde por edad y factores de riesgo, una densitometría.',
      hashtags: ['menopausia', 'osteoporosis', 'saludDeLaMujer'],
      imagen: 'mujer-adulta-salud',
    },
  ],

  traumatologia: [
    {
      texto:
        'Torcedura de tobillo: los primeros dos días deciden cómo sigue.\n\nLo básico sigue siendo lo de siempre: frío 20 minutos cada 2 o 3 horas, el pie en alto por encima del corazón, y una venda elástica que comprima sin cortar la circulación.\n\nCuándo hace falta radiografía: si no podés apoyar el pie ni dar cuatro pasos, si el dolor está justo sobre el hueso y no sobre el ligamento, o si a las 48 horas la hinchazón no bajó nada. Si podés caminar aunque duela, casi siempre es ligamento y se maneja sin placa.\n\nLo que más se hace mal: reposo absoluto de dos semanas. El tobillo que no se mueve se pone rígido y se vuelve a torcer.',
      hashtags: ['esguince', 'traumatología', 'lesionesDeportivas'],
      imagen: 'tobillo-vendaje-lesion',
    },
    {
      texto:
        'Dolor de espalda baja: el 90 % se cura solo, y la radiografía casi nunca ayuda.\n\nUn lumbago sin señales de alarma no necesita imagen en las primeras seis semanas. Las radiografías de columna de gente sana están llenas de hallazgos —desgaste, discos disminuidos— que no explican ningún dolor y sí explican muchas cirugías innecesarias.\n\nLo que funciona: seguir moviéndose (el reposo en cama empeora), analgesia por unos días, calor local, y volver de a poco a la actividad.\n\nLo que sí obliga a estudiar rápido: dolor que despierta de noche, fiebre, pérdida de peso, debilidad en una pierna, o problemas para orinar o controlar el esfínter. Eso último es una emergencia.',
      hashtags: ['lumbalgia', 'columna', 'traumatología'],
      imagen: 'dolor-espalda-lumbar',
    },
    {
      texto:
        'Después de una cirugía de rodilla, la operación es la mitad más fácil.\n\nUna reconstrucción de ligamento cruzado tarda entre seis y nueve meses en volver al deporte, y ese plazo no lo pone el cirujano: lo pone el injerto, que necesita ese tiempo para integrarse. Volver a los tres meses porque «ya no duele» es la razón número uno de la segunda rotura.\n\nLa rehabilitación no es opcional ni es un complemento: es el tratamiento. Un paciente que hace kinesiología tres veces por semana termina mejor que uno operado con la mejor técnica que no la hace.\n\nEso te lo tienen que decir antes de operar, no después.',
      hashtags: ['rodilla', 'ligamentoCruzado', 'rehabilitación', 'traumatología'],
      imagen: 'rehabilitacion-rodilla-kinesiologia',
    },
    {
      texto:
        'Una fractura en un adulto mayor casi nunca es sólo un accidente.\n\nCuando alguien de más de 65 se fractura la cadera, la muñeca o una vértebra con una caída desde su propia altura, eso se llama fractura por fragilidad, y es la primera señal visible de una osteoporosis que venía de años.\n\nLo que hay que hacer después de tratar el hueso roto: estudiar por qué se rompió. Densitometría, vitamina D, calcio, revisar los medicamentos que dan mareo o bajan la presión, y mirar la casa —alfombras sueltas, baño sin agarradera, escalera sin luz—.\n\nLa fractura siguiente se previene ahí, no en el quirófano.',
      hashtags: ['osteoporosis', 'caídas', 'adultoMayor', 'traumatología'],
      imagen: 'adulto-mayor-caminando-baston',
    },
  ],

  dermatologia: [
    {
      texto:
        'La regla del ABCDE para mirar un lunar:\n\nA de Asimetría — una mitad distinta de la otra.\nB de Bordes irregulares o mal definidos.\nC de Color — más de un tono, o muy oscuro.\nD de Diámetro mayor a 6 milímetros.\nE de Evolución — cualquier cambio de tamaño, forma, color o síntomas en los últimos meses.\n\nLa E es la más importante. Un lunar que cambia se revisa, tenga el aspecto que tenga.\n\nUna vez al año, alguien que te mire la piel entera con dermatoscopio. Es rápido, no duele y cambia pronósticos.',
      hashtags: ['lunares', 'cáncerDePiel', 'dermatología'],
      imagen: 'dermatoscopia-lunares-piel',
    },
    {
      texto:
        'En Bolivia el sol pega distinto, y no es una impresión.\n\nA 3.600 metros la radiación ultravioleta es alrededor de un 50 % más intensa que a nivel del mar, y el índice UV en el altiplano llega a valores extremos casi todo el año, también en invierno y también con el cielo nublado —las nubes dejan pasar buena parte de la UV.\n\nProtector solar factor 50, todos los días, en cara, orejas, cuello y dorso de manos. Se repone cada dos horas si estás afuera. Y lo que más protege sigue siendo gratis: sombrero de ala ancha, manga larga y sombra entre las 10 y las 16.\n\nLa piel no lleva la cuenta del año pasado: lleva la de toda la vida.',
      hashtags: ['fotoprotección', 'radiaciónUV', 'altura', 'dermatología'],
      imagen: 'protector-solar-sombrero',
    },
    {
      texto:
        'Acné: cuatro cosas que hacen daño y todo el mundo hace.\n\nExprimir. Cada grano exprimido cambia una lesión que iba a irse sola por una mancha o una cicatriz que dura años.\n\nLavarse la cara cinco veces al día con algo que «reseque». La piel irritada produce más grasa, no menos. Dos veces, con jabón suave, alcanza.\n\nCambiar de crema cada dos semanas. Un tratamiento para acné tarda entre ocho y doce semanas en mostrar resultado. Antes de eso no se puede saber si sirve.\n\nY el cuarto: creer que es cosa de adolescentes. El acné del adulto existe, es frecuente en mujeres entre 25 y 40, y a veces avisa de otra cosa que conviene estudiar.',
      hashtags: ['acné', 'cuidadoDeLaPiel', 'dermatología'],
      imagen: 'cuidado-facial-dermatologia',
    },
    {
      texto:
        'Caída de cabello: primero hay que saber de cuál se trata.\n\nPerder hasta 100 cabellos por día es normal. Lo que preocupa es cuando el pelo sale a mechones al lavarse, cuando aparecen zonas sin pelo, o cuando la raya del medio se ensancha.\n\nLa causa más frecuente en consulta no es genética: es un efluvio, o sea una caída difusa que aparece dos o tres meses después de un evento —una enfermedad con fiebre, una cirugía, un parto, una dieta muy restrictiva, anemia o un problema de tiroides—. Ése se recupera solo cuando se corrige lo de atrás.\n\nPor eso el estudio empieza con un análisis de sangre, no con una ampolla cara.',
      hashtags: ['alopecia', 'caídaDelCabello', 'dermatología'],
      imagen: 'cuero-cabelludo-consulta',
    },
  ],

  psiquiatria: [
    {
      texto:
        'Sobre empezar una medicación para la ansiedad o la depresión.\n\nLo que suele no contarse bien: los antidepresivos no hacen efecto el primer día. Tardan entre dos y cuatro semanas en mostrar el beneficio real, y las primeras dos semanas pueden traer molestias que después se van. Saber eso de entrada evita abandonarlos justo antes de que empiecen a funcionar.\n\nNo generan dependencia como se cree, pero no se cortan de golpe: se bajan de a poco y acompañados. Y no reemplazan a la psicoterapia — trabajan mejor juntas que cualquiera de las dos sola.',
      hashtags: ['saludMental', 'depresión', 'ansiedad', 'psiquiatría'],
      imagen: 'salud-mental-terapia',
    },
    {
      texto:
        'Dormir mal no es un detalle: es un síntoma y a veces es la causa.\n\nAntes de pedir una pastilla para dormir, hay siete cosas que funcionan y se prueban primero: levantarse a la misma hora todos los días (sí, también sábado y domingo), no quedarse en la cama despierto más de veinte minutos, nada de siesta después de las 15, cafeína hasta el mediodía y no más, alcohol lejos de la noche —hace dormir rápido y despertar a las 4—, pantalla fuera del cuarto, y usar la cama para dormir y nada más.\n\nEso se llama higiene del sueño y en insomnio crónico funciona mejor y por más tiempo que los medicamentos. Los hipnóticos tienen su lugar, pero es un lugar corto y acompañado.',
      hashtags: ['insomnio', 'sueño', 'saludMental', 'psiquiatría'],
      imagen: 'insomnio-noche-reloj',
    },
    {
      texto:
        'Cómo hablarle a alguien que está mal.\n\nLo que no ayuda, aunque salga de buena fe: «tenés que poner de tu parte», «hay gente peor», «salí a distraerte». Todo eso le dice a la persona que su estado es una decisión, y no lo es.\n\nLo que sí ayuda: preguntar y quedarse a escuchar la respuesta. «¿Hace cuánto que te sentís así?» «¿Qué es lo más pesado del día?» Y ofrecer algo concreto y chico —acompañar a pedir el turno, ir juntos la primera vez—, porque cuando alguien está deprimido el trámite es justamente lo que no puede hacer.\n\nY si aparece la idea de morir, se pregunta directo. Preguntar no siembra la idea: abre la única puerta por la que se puede pedir ayuda.',
      hashtags: ['saludMental', 'acompañamiento', 'prevenciónDelSuicidio'],
      imagen: 'conversacion-apoyo-emocional',
    },
    {
      texto:
        'El alcohol como ansiolítico: por qué parece que funciona y por qué termina peor.\n\nUna copa baja la ansiedad en veinte minutos. Ese alivio rápido es exactamente el problema: enseña al cerebro un atajo, y el atajo pide cada vez más para dar lo mismo.\n\nAdemás el alcohol fragmenta el sueño profundo, y una persona que duerme mal amanece más ansiosa. Es un círculo que se cierra solo y que en consulta veo llegar tarde, cuando ya hay tolerancia.\n\nSeñales para mirar con honestidad: si tomás para poder dormir, si tomás solo, si escondés cuánto, o si dejaste de disfrutar algo que antes disfrutabas sin tomar. Ninguna de las cuatro te convierte en alcohólico; las cuatro son motivo de consulta.',
      hashtags: ['alcohol', 'ansiedad', 'saludMental', 'psiquiatría'],
      imagen: 'consumo-alcohol-salud',
    },
  ],

  endocrinologia: [
    {
      texto:
        'La hemoglobina glicosilada (HbA1c) es un promedio de tu azúcar en sangre de los últimos tres meses. Por eso vale más que un pinchazo aislado: no la podés «preparar» con dos días de dieta antes del análisis.\n\nEn una persona con diabetes la meta habitual es mantenerla por debajo de 7 %, pero eso se individualiza —edad, años de enfermedad, riesgo de hipoglucemia—. Bajarla de 9 a 8 ya reduce complicaciones de forma medible.\n\nNo hace falta llegar a un número perfecto para que el esfuerzo valga la pena. Ése es el mensaje que más falta hace.',
      hashtags: ['diabetes', 'HbA1c', 'endocrinología'],
      imagen: 'glucometro-control-diabetes',
    },
    {
      texto:
        'Tiroides: no todo cansancio es hipotiroidismo, y no todo nódulo es cáncer.\n\nEl TSH alterado se confirma antes de tratar: hay valores que suben transitoriamente después de una infección o de un estrés fuerte y vuelven solos. Empezar levotiroxina con un solo análisis es empezar un tratamiento de por vida sobre un dato de un día.\n\nY sobre los nódulos: son muy frecuentes —los encuentra cualquier ecografía— y la enorme mayoría son benignos. Lo que decide si se punza no es el tamaño solo, sino las características que describe el informe ecográfico.\n\nSi ya tomás levotiroxina: en ayunas, con agua, y esperar 30 minutos antes del desayuno. El calcio y el hierro se toman lejos, porque impiden que se absorba.',
      hashtags: ['tiroides', 'hipotiroidismo', 'endocrinología'],
      imagen: 'ecografia-tiroides-cuello',
    },
    {
      texto:
        'Hipoglucemia: la complicación que asusta menos de lo que debería.\n\nSudoración fría, temblor, hambre repentina, palpitaciones, confusión. En una persona que usa insulina o ciertas pastillas, eso es azúcar baja hasta que se demuestre lo contrario, y se trata en el momento.\n\nLa regla es 15 y 15: 15 gramos de azúcar de absorción rápida —tres cucharaditas de azúcar en agua, medio vaso de gaseosa común, no dietética— y volver a medir a los 15 minutos. Si sigue baja, se repite. Recién después se come algo con proteína o almidón.\n\nLo que no se hace: dar de comer a alguien que está inconsciente. Ahí se pide ayuda y se traslada.\n\nY toda hipoglucemia se cuenta en la próxima consulta. Es información para ajustar la dosis, no una falta.',
      hashtags: ['hipoglucemia', 'diabetes', 'insulina', 'endocrinología'],
      imagen: 'medicion-glucosa-dedo',
    },
    {
      texto:
        'Obesidad: la balanza es el peor indicador de si algo está funcionando.\n\nEl peso sube y baja hasta dos kilos por día por agua, sal y hormonas. Pesarse todas las mañanas y decidir el ánimo con ese número es una forma segura de abandonar en la tercera semana.\n\nLo que sí sirve medir: el perímetro de cintura, cómo entra la misma ropa, la presión, la glucemia y los triglicéridos. Una pérdida sostenida del 5 al 10 % del peso ya mejora todo eso, aunque el espejo no lo note.\n\nY una cosa que hay que decir más seguido: la obesidad es una enfermedad crónica con componente hormonal y genético, no un defecto de carácter. Se trata como cualquier enfermedad crónica — con seguimiento, y sin culpa.',
      hashtags: ['obesidad', 'síndromeMetabólico', 'endocrinología'],
      imagen: 'cinta-metrica-cintura',
    },
  ],

  oftalmologia: [
    {
      texto:
        'Si tenés diabetes, necesitás un control de fondo de ojo una vez al año aunque veas perfecto.\n\nLa retinopatía diabética —el daño que el azúcar alto le hace a los vasos de la retina— no da ningún síntoma en sus etapas tempranas, que son justo las que se pueden tratar. Cuando aparece la visión borrosa o las manchas, el daño ya avanzó.\n\nEl estudio es simple: unas gotas para dilatar la pupila y una foto de la retina. Media hora, una vez al año.\n\nUn detalle práctico: con la pupila dilatada no vas a poder manejar por unas horas. Vení acompañado o dejá el auto.',
      hashtags: ['retinopatíaDiabética', 'diabetes', 'oftalmología'],
      imagen: 'fondo-de-ojo-retina',
    },
    {
      texto:
        'El glaucoma se lleva la visión de afuera hacia adentro, y sin avisar.\n\nEs la primera causa de ceguera irreversible en el mundo y no duele. El campo visual se va cerrando tan despacio que el cerebro rellena lo que falta, y la persona se da cuenta cuando ya perdió una parte que no vuelve.\n\nLo que lo detecta es un control de rutina: medir la presión del ojo y mirar el nervio óptico. A partir de los 40, una vez cada dos años; antes y más seguido si hay glaucoma en la familia, miopía alta o diabetes.\n\nLo que se pierde no se recupera, pero lo que queda se conserva casi siempre. Por eso el único enemigo real acá es llegar tarde.',
      hashtags: ['glaucoma', 'prevención', 'oftalmología'],
      imagen: 'examen-vista-oftalmologo',
    },
    {
      texto:
        'La catarata no se «madura» esperando. Eso era cierto hace cuarenta años.\n\nCon la técnica actual —facoemulsificación, incisión de menos de tres milímetros, sin puntos y con anestesia en gotas— se opera cuando la visión empieza a estorbar tu vida: cuando no distinguís bien de noche, cuando te encandilan las luces, cuando dejaste de leer o de manejar.\n\nEsperar a que la catarata esté muy dura sólo hace la cirugía más difícil y la recuperación más lenta.\n\nEs ambulatoria: entrás y salés el mismo día. Y sí, hay que poner gotas durante varias semanas después. Esa parte la hace el paciente y es la que decide el resultado.',
      hashtags: ['catarata', 'cirugíaOcular', 'oftalmología'],
      imagen: 'cirugia-catarata-quirofano',
    },
    {
      texto:
        'Ojo seco y pantallas: por qué arde a las seis de la tarde.\n\nMirando una pantalla parpadeamos alrededor de un tercio de lo normal. Menos parpadeo es menos lágrima repartida, y de ahí el ardor, la sensación de arenilla y —esto sorprende— el lagrimeo, que es la respuesta del ojo irritado.\n\nLo que funciona: la regla 20-20-20 —cada 20 minutos, mirar algo a 20 pies (unos 6 metros) durante 20 segundos—, la pantalla un poco por debajo de la línea de los ojos, y lágrimas artificiales sin conservantes si hace falta.\n\nLo que no: las gotas «para el ojo rojo» de venta libre. Blanquean el ojo apretando los vasos y con el uso seguido lo dejan peor que antes.',
      hashtags: ['ojoSeco', 'pantallas', 'oftalmología'],
      imagen: 'fatiga-visual-pantalla',
    },
  ],

  neurologia: [
    {
      texto:
        'Migraña no es «un dolor de cabeza fuerte». Es una enfermedad neurológica con criterios propios.\n\nDolor de un lado, pulsátil, que empeora con la actividad, con náusea o molestia por la luz y el ruido, y que dura entre 4 y 72 horas. Si eso te describe, hay tratamiento — y no es aguantar.\n\nDos tratamientos distintos que se confunden todo el tiempo: el de la crisis (para cortar el episodio) y el preventivo (para que haya menos episodios). El preventivo se toma todos los días, aunque no duela, y tarda entre seis y ocho semanas en mostrar efecto.\n\nY una advertencia importante: tomar analgésicos más de diez días al mes produce cefalea por abuso de analgésicos, que se siente igual y se trata sacando lo que la causa.',
      hashtags: ['migraña', 'cefalea', 'neurología'],
      imagen: 'dolor-de-cabeza-migrana',
    },
    {
      texto:
        'Reconocer un ACV a tiempo: cuatro señales y un reloj.\n\nCara caída de un lado. Un brazo que no se puede levantar o que cae solo. Habla trabada o palabras que no salen. Y la hora exacta en que empezó — ése es el dato que más vale, porque los tratamientos que salvan tejido cerebral tienen ventana de tiempo.\n\nSi ves cualquiera de las tres primeras: emergencia, ya. No esperes a ver si se pasa, no le des aspirina, no le des de comer ni de beber.\n\nCada minuto sin tratar un ACV isquémico cuesta alrededor de dos millones de neuronas. La frase «lo llevamos mañana si sigue igual» es la que más secuelas produce.',
      hashtags: ['ACV', 'derrameCerebral', 'emergencia', 'neurología'],
      imagen: 'atencion-neurologica-urgencia',
    },
    {
      texto:
        'Olvidos: cuáles son de la edad y cuáles no.\n\nOlvidar dónde dejaste las llaves y encontrarlas después es normal a cualquier edad. Olvidar para qué sirve la llave, no.\n\nLo que hace consultar: repetir la misma pregunta varias veces en una charla, perderse en un recorrido conocido, tener dificultad para manejar plata o seguir una receta que se hacía siempre, o cambios de carácter que la familia nota antes que la persona.\n\nY algo que se olvida: hay causas de deterioro que son reversibles —hipotiroidismo, déficit de vitamina B12, depresión, apnea del sueño, algunos medicamentos—. Por eso el estudio empieza con análisis, no con resignación.',
      hashtags: ['memoria', 'demencia', 'neurología'],
      imagen: 'memoria-adulto-mayor',
    },
    {
      texto:
        'Qué hacer si alguien tiene una convulsión delante tuyo.\n\nMirá la hora. Acostalo de costado. Sacá lo que tenga cerca contra lo que pueda golpearse y ponele algo blando bajo la cabeza. Aflojale la ropa del cuello. Y esperá: la mayoría de las crisis ceden solas en menos de dos minutos.\n\nLo que NO se hace, y se hace siempre: meterle algo en la boca. No se traga la lengua — eso es un mito, y lo único que se consigue es romperle los dientes o lastimarse la mano. Tampoco se sujeta a la fuerza.\n\nLlamá a emergencias si la crisis pasa de cinco minutos, si se repite sin recuperar la conciencia entre una y otra, si es la primera vez, si hay embarazo o si se golpeó la cabeza.',
      hashtags: ['epilepsia', 'primerosAuxilios', 'neurología'],
      imagen: 'primeros-auxilios-emergencia',
    },
  ],

  gastroenterologia: [
    {
      texto:
        'Reflujo: lo que cambia el cuadro no es sólo la pastilla.\n\nEl omeprazol y sus parientes bajan el ácido, y funcionan. Pero el reflujo también depende de la mecánica: comer mucho de una vez, acostarse antes de tres horas, el sobrepeso abdominal y el cigarrillo empujan el contenido hacia arriba por más que el ácido esté bajo.\n\nDos medidas caseras con buena evidencia: levantar la cabecera de la cama unos 15 centímetros —con tacos bajo las patas, no con almohadas, que doblan el abdomen y empeoran— y cenar liviano y temprano.\n\nY una advertencia: si venís tomando protector gástrico hace más de dos meses sin que nadie te haya estudiado, ése es motivo de consulta y no de repetir la receta.',
      hashtags: ['reflujo', 'acidez', 'gastroenterología'],
      imagen: 'acidez-estomacal-reflujo',
    },
    {
      texto:
        'Helicobacter pylori: frecuente acá, y no siempre hay que tratarlo.\n\nEn Bolivia buena parte de la población adulta lo tiene. Se trata cuando hay úlcera, ciertos hallazgos en la endoscopía, antecedentes familiares de cáncer gástrico o síntomas que lo justifican — no por haberlo encontrado en un examen pedido de casualidad.\n\nCuando se trata, se trata en serio: dos antibióticos y un inhibidor durante 14 días, todos los días, completos. Un esquema cortado a la mitad no cura y deja la bacteria más resistente para el segundo intento, que es bastante más difícil.\n\nY se controla después: un test de aliento o de heces a las cuatro semanas de terminar. Suponer que funcionó no es lo mismo que saberlo.',
      hashtags: ['helicobacter', 'gastritis', 'gastroenterología'],
      imagen: 'endoscopia-digestiva-estomago',
    },
    {
      texto:
        'Hígado graso: la enfermedad hepática más común y la que menos se nombra.\n\nAparece en una ecografía pedida por otra cosa y suele quedar ahí, sin plan. No debería: una parte de esos hígados desarrolla inflamación y, con los años, fibrosis.\n\nNo hay pastilla. Lo que revierte hígado graso es perder entre el 7 y el 10 % del peso, mover el cuerpo (150 minutos por semana), sacar el azúcar líquido —gaseosas y jugos, que van directo al hígado— y el alcohol.\n\nLa buena noticia es la otra cara: es de las pocas enfermedades crónicas que de verdad se pueden revertir. Y el hígado responde antes que la balanza.',
      hashtags: ['hígadoGraso', 'esteatosis', 'gastroenterología'],
      imagen: 'higado-ecografia-abdomen',
    },
    {
      texto:
        'Sangre en las heces: nunca es normal, y nunca es «seguro que son hemorroides».\n\nPuede serlo, y de hecho muchas veces lo es. Pero las hemorroides son tan comunes que se convierten en la explicación cómoda de un sangrado que venía de otro lado. El error diagnóstico más caro de mi especialidad empieza así.\n\nLo que obliga a estudiar sí o sí: más de 50 años, cambio del ritmo intestinal que dura más de un mes, pérdida de peso sin explicación, anemia, o antecedente familiar de cáncer de colon.\n\nEl tamizaje de cáncer de colon empieza a los 50 —a los 40 si hay antecedente familiar directo— y es la prevención que más años de vida gana en gastroenterología. Un pólipo sacado en una colonoscopía es un cáncer que nunca existió.',
      hashtags: ['colonoscopía', 'cáncerDeColon', 'tamizaje', 'gastroenterología'],
      imagen: 'colonoscopia-prevencion-colon',
    },
  ],

  neumologia: [
    {
      texto:
        'La mitad de los inhaladores que «no funcionan» son inhaladores mal usados.\n\nLo veo todas las semanas: el paciente lo hace mal, el medicamento se queda en la boca y no llega al bronquio, y el tratamiento se cambia por uno más caro que también va a fallar.\n\nCon aerosol: agitar, exhalar todo el aire afuera, disparar al empezar a inhalar —no antes, no después—, inhalar lento y profundo, aguantar diez segundos.\n\nY una cosa que cambia todo: usar aerocámara. Con espaciador llega al pulmón el doble, y en niños y adultos mayores es directamente imprescindible.\n\nTraé tu inhalador a la consulta. Que te lo vean hacer vale más que cualquier explicación.',
      hashtags: ['asma', 'inhaladores', 'EPOC', 'neumología'],
      imagen: 'inhalador-asma-aerocamara',
    },
    {
      texto:
        'Tos que dura más de tres semanas: se estudia.\n\nUna tos aguda por un virus dura entre una y tres semanas y se va sola. Después de eso ya no alcanza con esperar.\n\nEn Bolivia, toda tos de más de dos semanas obliga a descartar tuberculosis con baciloscopía —es gratuito en todo establecimiento público y no necesita derivación—. La TB sigue entre nosotros y se cura, pero se cura tratada.\n\nLas otras tres causas frecuentes de tos crónica en quien no fuma: goteo posnasal, asma que se manifiesta sólo con tos, y reflujo. Se distinguen en la consulta, y ninguna se resuelve con jarabe.',
      hashtags: ['tosCrónica', 'tuberculosis', 'neumología'],
      imagen: 'radiografia-torax-pulmones',
    },
    {
      texto:
        'Dejar de fumar: el pulmón empieza a recuperarse antes de lo que creés.\n\nA las 12 horas el monóxido de carbono en sangre vuelve a lo normal. Entre las 2 semanas y los 3 meses mejora la función pulmonar. Al año, el riesgo de enfermedad coronaria cae a la mitad del de un fumador.\n\nLo que más funciona no es la fuerza de voluntad sola: es la combinación de acompañamiento y tratamiento —parches o chicles de nicotina, o medicación—, que multiplica por tres la probabilidad de lograrlo.\n\nY una cosa que hay que decir: recaer es parte del proceso, no el final. La mayoría necesita varios intentos. Cada intento enseña algo del siguiente.',
      hashtags: ['tabaquismo', 'dejarDeFumar', 'neumología'],
      imagen: 'dejar-de-fumar-cigarrillo',
    },
    {
      texto:
        'Ronca fuerte, se ahoga de noche y se levanta cansado: eso tiene nombre.\n\nSe llama apnea obstructiva del sueño, y no es un problema de ruido: son pausas respiratorias que fragmentan el descanso y castigan al corazón noche tras noche. Sube la presión, aumenta el riesgo de arritmia y de ACV, y produce esa somnolencia diurna que causa accidentes de tránsito.\n\nSe diagnostica con un estudio del sueño y se trata, casi siempre con un equipo de presión positiva (CPAP) que en pocas semanas cambia el ánimo, la presión y la concentración.\n\nLa señal más confiable no la da el paciente: la da quien duerme al lado. Si te contaron que dejás de respirar mientras dormís, eso es motivo de consulta.',
      hashtags: ['apneaDelSueño', 'ronquido', 'CPAP', 'neumología'],
      imagen: 'estudio-del-sueno-cpap',
    },
  ],

  'medicina-emergencia': [
    {
      texto:
        'Lo que hacés en los primeros diez minutos de una quemadura decide la cicatriz.\n\nAgua corriente fría —no helada, no con hielo— durante 20 minutos. Sacar anillos, pulseras y ropa que no esté pegada. Cubrir con un paño limpio y consultar.\n\nLo que NO se pone, y se pone siempre: pasta de dientes, aceite, manteca, clara de huevo, papa rallada. Todo eso atrapa el calor, contamina la herida y hace que en la guardia tengamos que limpiar antes de poder ver qué hay debajo.\n\nVan directo a emergencia: las quemaduras en cara, manos, pies, genitales o articulaciones; las que dan la vuelta completa a un miembro; las de un niño pequeño; y cualquiera con ampollas de más que una palma de la mano.',
      hashtags: ['quemaduras', 'primerosAuxilios', 'emergencias'],
      imagen: 'primeros-auxilios-quemadura',
    },
    {
      texto:
        'RCP con las manos: lo único que hay que recordar.\n\nSi una persona se desploma, no responde y no respira normal: pedí ayuda, llamá al 118 y empezá a comprimir el centro del pecho. Fuerte —unos 5 centímetros—, rápido —100 a 120 por minuto, el ritmo de «La Bamba»— y sin parar hasta que llegue ayuda o la persona reaccione.\n\nNo hace falta dar respiración boca a boca si no querés o no sabés. La compresión sola salva vidas y es infinitamente mejor que no hacer nada.\n\nEl único error grave posible es quedarse mirando. Un paro sin RCP pierde alrededor del 10 % de probabilidad de sobrevida por cada minuto que pasa.',
      hashtags: ['RCP', 'paroCardíaco', 'primerosAuxilios', 'emergencias'],
      imagen: 'rcp-reanimacion-cardiopulmonar',
    },
    {
      texto:
        'Guardar los medicamentos donde un chico no llegue no es exageración.\n\nLa mayoría de las intoxicaciones que atendemos en menores de cinco años pasan en la casa, con algo que estaba a la vista: la cartera con las pastillas de la abuela, el frasco de jarabe en la mesa de luz, el limpiador guardado en una botella de gaseosa.\n\nSi pasó: no provoques el vómito. Con cáusticos —lejía, destapacañerías, ácido de batería— el vómito quema una segunda vez el esófago al subir. No des leche «para cortar». Llevá el envase a la guardia: saber exactamente qué era cambia el tratamiento.\n\nY nunca guardes químicos en botellas de bebida. Es la causa evitable número uno.',
      hashtags: ['intoxicaciones', 'seguridadInfantil', 'emergencias'],
      imagen: 'seguridad-hogar-medicamentos',
    },
    {
      texto:
        'Lo que más veo llegar tarde: el infarto que esperó a la mañana.\n\nEl patrón se repite. Dolor en el pecho a las once de la noche, «debe ser la comida», un té, esperar acostado, y llegar a las nueve de la mañana con diez horas de músculo cardíaco perdido que no vuelve.\n\nEl tiempo es músculo. Un infarto tratado en la primera hora deja un corazón casi normal; el mismo infarto tratado a las diez horas deja una insuficiencia cardíaca para toda la vida.\n\nSi hay dolor opresivo en el pecho de más de veinte minutos, que se va al brazo, al cuello o a la mandíbula, con sudor frío o falta de aire: emergencia, y en lo que llegue primero. No manejes vos.\n\nY en mujeres y en personas con diabetes se presenta distinto más seguido: como falta de aire, náusea o cansancio extremo, sin el dolor clásico.',
      hashtags: ['infarto', 'tiempoEsMúsculo', 'emergencias'],
      imagen: 'ambulancia-emergencia-urgencias',
    },
  ],

  nutricion: [
    {
      texto:
        'La comida de acá no es el problema. Muchas veces es la solución.\n\nLa quinua tiene los nueve aminoácidos esenciales y hierro. La papa —hervida y enfriada— aporta almidón resistente, que alimenta la flora intestinal. El chuño y la tunta son energía densa que aguanta una jornada de trabajo. Las habas y el tarwi tienen más proteína que muchos cortes de carne y cuestan una fracción.\n\nLo que sí conviene mirar es la forma: fritura diaria, gaseosa con cada plato y el pan como base de tres comidas. Ahí está el problema, no en la papa.\n\nUn plan de alimentación que pide alimentos que no se venden en tu mercado es un plan que no se va a cumplir. Y uno que no se cumple no sirve, por más correcto que esté.',
      hashtags: ['alimentaciónBoliviana', 'quinua', 'nutrición'],
      imagen: 'mercado-alimentos-bolivia',
    },
    {
      texto:
        'Cómo leer una etiqueta en treinta segundos.\n\nMirá siempre la columna «por 100 g», no la de «por porción»: las porciones se dibujan chicas para que los números parezcan bajos.\n\nTres números y un renglón:\n— Azúcares: más de 15 g por 100 g es alto.\n— Grasas saturadas: más de 5 g por 100 g es alto.\n— Sodio: más de 400 mg por 100 g es alto.\n— Y la lista de ingredientes, que va ordenada de mayor a menor: si el azúcar aparece entre los tres primeros, ya sabés qué estás comprando.\n\nY los sellos octogonales de advertencia del frente están para eso: si el paquete tiene tres, no hace falta que leas nada más.',
      hashtags: ['etiquetado', 'alimentación', 'nutrición'],
      imagen: 'etiqueta-nutricional-supermercado',
    },
    {
      texto:
        'Anemia por falta de hierro: el hierro de las lentejas no entra igual que el de la carne.\n\nHay dos tipos. El hemo —carnes, hígado, sangre— se absorbe muy bien. El no hemo —legumbres, verduras de hoja, quinua— se absorbe poco, pero se puede mejorar mucho:\n\nAcompañalo con vitamina C: limón sobre la ensalada, un cítrico de postre, tomate en el plato. Multiplica la absorción varias veces.\n\nY separalo del té, el café y el mate: los taninos se pegan al hierro y no lo dejan pasar. Media hora antes o dos horas después, no con la comida. Lo mismo el calcio.\n\nEsto no es un detalle: en niños y embarazadas es la diferencia entre corregir una anemia y estar tomando el suplemento para nada.',
      hashtags: ['anemia', 'hierro', 'vitaminaC', 'nutrición'],
      imagen: 'legumbres-alimentos-hierro',
    },
    {
      texto:
        'La gaseosa es el cambio más rentable que existe en nutrición.\n\nUna botella de medio litro tiene alrededor de 13 cucharaditas de azúcar. En líquido no genera saciedad: el cuerpo no la registra como comida, así que se suma entera a todo lo demás.\n\nSacar una gaseosa diaria son unas 800 calorías menos por semana sin cambiar un solo plato, y baja triglicéridos e hígado graso más rápido que casi cualquier otra medida aislada.\n\nY sí, el jugo de fruta «natural» de caja tiene prácticamente el mismo azúcar. La fruta entera no: la fibra cambia todo.\n\nAgua. Es aburrido de decir y es lo que más funciona.',
      hashtags: ['azúcar', 'bebidasAzucaradas', 'nutrición'],
      imagen: 'bebidas-azucaradas-vaso-agua',
    },
  ],
};

/**
 * La cola de publicaciones de un profesional: primero lo propio de su
 * especialidad y después lo general, sin repetir hasta agotar. Así una
 * cardióloga abre con algo de cardiología y no con un consejo genérico.
 *
 * @param {string} codigoEspecialidad Código corto de la especialidad.
 * @returns {Array<object>} Publicaciones en el orden en que se van a sembrar.
 */
export function publicacionesPara(codigoEspecialidad) {
  return [...(POR_ESPECIALIDAD[codigoEspecialidad] ?? []), ...GENERALES];
}
