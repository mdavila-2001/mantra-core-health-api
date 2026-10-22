/**
 * comunidad.mjs — La gente que lee, comenta y reacciona.
 *
 * ## Por qué hacía falta
 *
 * Hasta ahora el seeder dejaba publicaciones con `reactionCount: 0` y
 * `commentCount: 0`, y la tarjeta de la ficha pública **oculta el bloque de
 * interacción cuando los dos contadores son cero**. Es decir: el estado que
 * más se sembraba era justo el que hacía invisible la mitad de la tarjeta. No
 * se podía ver cómo queda el resumen de reacciones, ni si «2 comentarios» entra
 * en una línea, ni cómo se comporta la tarjeta cuando el contenido tiene vida.
 *
 * Un contador no se puede escribir a mano: `reaction_count` y `comment_count`
 * salen de contar filas reales de `community.reactions` y `community.comments`,
 * y cada una de esas filas exige un **perfil titular** que la firme
 * (`assertActsAsProfile` rechaza escribir el grafo social con un perfil ajeno).
 * Así que para que haya movimiento tiene que haber gente: cuentas de verdad,
 * con documento y contraseña, que inician sesión y escriben.
 *
 * Eso es lo que hay acá.
 *
 * ## Por qué sus vitrinas son privadas
 *
 * Un perfil público cuyo sujeto es una cuenta de usuario —y no un perfil
 * profesional— cae en `kindOf` al valor por defecto, `PRACTITIONER`, y
 * aparecería en el buscador público como si fuera médico. Sembrar dieciséis
 * vecinos disfrazados de doctores para poder contar comentarios sería peor que
 * no tener comentarios. Por eso nacen con `visibility: PRIVATE`: siguen siendo
 * cuentas reales, con las que se puede entrar y ver la aplicación desde
 * adentro, pero no ensucian el directorio.
 */

/**
 * Los vecinos: dieciséis cuentas de paciente, con documento y contraseña.
 *
 * Se registran por `POST /iam/auth/register-patient`, que identifica por
 * **documento** y no por correo, así que `ci` es lo que se usa para entrar. El
 * correo va igual, porque el login lo acepta también y porque una cuenta sin
 * correo se ve incompleta en las pantallas de perfil.
 *
 * `titular` es la línea de debajo del nombre en su vitrina. No dicen profesión
 * médica ninguno: son quienes leen, no quienes publican.
 *
 * `sexo` está **declarado**, no deducido del nombre. `RegisterPatientDto` lo
 * exige (`sexAtBirth`, obligatorio desde que el alta de paciente cerró su
 * contrato), y adivinarlo a partir de un nombre de pila es exactamente el tipo
 * de dato clínico que no se infiere: el sexo al nacer condiciona rangos de
 * referencia y tamizajes. Son personas de ficción, así que acá se elige y se
 * escribe; en producción lo declara quien se registra.
 */
export const CIUDADANOS = [
  {
    nombre: 'Rosario',
    apellido: 'Choque',
    segundoApellido: 'Ticona',
    ci: '4821337',
    ciudad: 'La Paz',
    sexo: 'FEMALE',
    nacimiento: '1972-04-18',
    titular: 'Comerciante en la Uyustus · mamá de tres',
  },
  {
    nombre: 'Juan Carlos',
    apellido: 'Flores',
    segundoApellido: 'Apaza',
    ci: '6720914',
    ciudad: 'El Alto',
    sexo: 'MALE',
    nacimiento: '1985-09-02',
    titular: 'Chofer de minibús · vecino de Villa Adela',
  },
  {
    nombre: 'Mariela',
    apellido: 'Sejas',
    segundoApellido: 'Villca',
    ci: '5109882',
    ciudad: 'Cochabamba',
    sexo: 'FEMALE',
    nacimiento: '1990-01-27',
    titular: 'Maestra de primaria · corre los domingos en la Coronilla',
  },
  {
    nombre: 'Álvaro',
    apellido: 'Justiniano',
    segundoApellido: 'Roca',
    ci: '7734025',
    ciudad: 'Santa Cruz de la Sierra',
    sexo: 'MALE',
    nacimiento: '1978-06-11',
    titular: 'Ingeniero agrónomo · Warnes',
  },
  {
    nombre: 'Nancy',
    apellido: 'Callisaya',
    segundoApellido: 'Mamani',
    ci: '3998471',
    ciudad: 'La Paz',
    sexo: 'FEMALE',
    nacimiento: '1965-11-30',
    titular: 'Jubilada · cuida a su nieto los martes',
  },
  {
    nombre: 'Wilson',
    apellido: 'Guzmán',
    segundoApellido: 'Arce',
    ci: '8102336',
    ciudad: 'Sucre',
    sexo: 'MALE',
    nacimiento: '1996-03-15',
    titular: 'Estudiante de Derecho en la USFX',
  },
  {
    nombre: 'Fabiola',
    apellido: 'Encinas',
    segundoApellido: 'Ledezma',
    ci: '6541209',
    ciudad: 'Tarija',
    sexo: 'FEMALE',
    nacimiento: '1988-08-08',
    titular: 'Contadora · embarazada de 22 semanas',
  },
  {
    nombre: 'Freddy',
    apellido: 'Condori',
    segundoApellido: 'Huanca',
    ci: '5233718',
    ciudad: 'El Alto',
    sexo: 'MALE',
    nacimiento: '1974-12-04',
    titular: 'Albañil · diabético desde hace nueve años',
  },
  {
    nombre: 'Karina',
    apellido: 'Montaño',
    segundoApellido: 'Peredo',
    ci: '7009645',
    ciudad: 'Santa Cruz de la Sierra',
    sexo: 'FEMALE',
    nacimiento: '1993-05-21',
    titular: 'Diseñadora gráfica · trabaja doce horas frente a la pantalla',
  },
  {
    nombre: 'Ernesto',
    apellido: 'Quiroga',
    segundoApellido: 'Balderrama',
    ci: '4470182',
    ciudad: 'Cochabamba',
    sexo: 'MALE',
    nacimiento: '1969-02-14',
    titular: 'Taxista · dejó de fumar hace un año y medio',
  },
  {
    nombre: 'Lourdes',
    apellido: 'Ayaviri',
    segundoApellido: 'Tarqui',
    ci: '6180553',
    ciudad: 'La Paz',
    sexo: 'FEMALE',
    nacimiento: '1982-07-19',
    titular: 'Enfermera auxiliar · Red de Salud Sur',
  },
  {
    nombre: 'Marco Antonio',
    apellido: 'Zeballos',
    segundoApellido: 'Ovando',
    ci: '7856430',
    ciudad: 'Santa Cruz de la Sierra',
    sexo: 'MALE',
    nacimiento: '1999-10-06',
    titular: 'Juega fútbol los sábados en la Villa Primero de Mayo',
  },
  {
    nombre: 'Elsa',
    apellido: 'Poma',
    segundoApellido: 'Alanoca',
    ci: '3721996',
    ciudad: 'El Alto',
    sexo: 'FEMALE',
    nacimiento: '1961-01-09',
    titular: 'Vendedora en la 16 de Julio · hipertensa',
  },
  {
    nombre: 'Rodrigo',
    apellido: 'Salvatierra',
    segundoApellido: 'Melgar',
    ci: '8298107',
    ciudad: 'Tarija',
    sexo: 'MALE',
    nacimiento: '1994-04-25',
    titular: 'Guía de turismo en el Valle de la Concepción',
  },
  {
    nombre: 'Vania',
    apellido: 'Padilla',
    segundoApellido: 'Ríos',
    ci: '7412668',
    ciudad: 'Sucre',
    sexo: 'FEMALE',
    nacimiento: '1991-12-13',
    titular: 'Bioquímica · trabaja en laboratorio clínico',
  },
  {
    nombre: 'Grover',
    apellido: 'Cussi',
    segundoApellido: 'Limachi',
    ci: '5680341',
    ciudad: 'La Paz',
    sexo: 'MALE',
    nacimiento: '1980-03-28',
    titular: 'Mecánico en Villa Fátima · papá de dos',
  },
];

/**
 * Los comentarios, indexados por la misma clave de especialidad que las
 * publicaciones, **en el mismo orden**: los dos primeros van a la primera
 * publicación de esa especialidad, los dos siguientes a la segunda, y así.
 *
 * Ocho por especialidad, ninguno repetido: con cuatro publicaciones por
 * profesional y dos comentarios cada una, la cuenta cierra exacta y ninguna
 * tarjeta muestra dos veces la misma frase.
 *
 * Están escritos como comenta la gente: preguntas concretas, una experiencia
 * propia, alguna duda mal formulada, algún «gracias doctora». Un pool de
 * elogios genéricos («excelente aporte») haría que todas las tarjetas se
 * vieran iguales, que es justamente lo que un seeder tiene que evitar.
 */
export const COMENTARIOS_POR_ESPECIALIDAD = {
  cardiologia: [
    'Doctora, ¿el tensiómetro de muñeca sirve o tengo que comprar el de brazo? En la farmacia me dijeron que da lo mismo.',
    'Yo me tomaba la presión recién llegando de la calle y siempre me salía 150. Con lo que dice acá la volví a medir descansada y me dio 128. Gracias.',
    'Mi papá tuvo eso del dolor que se le pasaba al descansar y lo dejamos pasar dos semanas. Ojalá hubiéramos leído esto antes.',
    '¿El dolor de pecho al respirar profundo también entra en la lista o ése no?',
    'Nunca miré el sodio del pan. Fui a ver y el que compro todos los días tiene más que las papas fritas. Increíble.',
    'Cociné con la mitad de sal como dice y los primeros días fue horrible, pero a las dos semanas ya ni lo noto. Confirmo.',
    'Doctora, me pidieron Holter y trabajo manejando. ¿Puedo trabajar con el aparato puesto?',
    'A mí el electro me salió normal y yo seguía sintiendo los saltos. Recién con el Holter apareció. Buen dato el del diario de síntomas.',
  ],
  pediatria: [
    'Perdí la libreta de mi hija en la mudanza y pensé que había que empezar todo de nuevo. Voy al centro de salud entonces.',
    'Doctor, mi hijo tiene 3 años y le falta una dosis de refuerzo desde el año pasado. ¿Todavía se la puedo poner?',
    'Mi bebé tuvo bronquiolitis en julio y lo del pecho hundido fue exactamente lo que nos hizo correr al hospital. Muy bien explicado.',
    '¿Los lavados nasales con suero se hacen también si está durmiendo o hay que esperar a que despierte?',
    'Yo le daba antibiótico cada vez que tenía diarrea porque así me enseñaron. No sabía lo del zinc.',
    'Doctor, ¿los sobres de suero son los mismos que venden en la farmacia o hay que pedirlos en el centro de salud?',
    'Mi hijo de 8 se duerme a las 11 de la noche porque hace tareas. Leyendo esto entiendo por qué anda de mal humor todo el día.',
    'Lo de sacar la tablet del cuarto nos costó una semana de guerra, pero funcionó. Duerme una hora más.',
  ],
  'medicina-interna': [
    'Mi mamá toma once pastillas y cada médico le agrega una. Nunca escuché que se pudieran sacar. Voy a pedir la revisión.',
    'Doctora, ¿la revisión de medicamentos la hace cualquier internista o hay que pedir algo especial?',
    'Confieso que nunca conté el mate de hierbas como medicamento. Tomo uno para dormir hace años.',
    'Lo del ibuprofeno me pasó: tomaba dos por día por la rodilla y se me subió la presión. Nadie relacionó las dos cosas hasta que un médico preguntó.',
    'Me trataron una anemia con hierro tres veces y siempre volvía. Nadie buscó de dónde salía la pérdida.',
    'Doctora, entonces la hemoglobina de La Paz no se compara con la tabla del laboratorio de Santa Cruz. ¿Cómo sé cuál usan?',
    'Yo me hacía el paquete de 40 análisis todos los años en oferta. Nunca lo pensé así.',
    '¿El perímetro de cintura se mide sobre el ombligo o más arriba? Siempre me confundo.',
  ],
  'medicina-general': [
    'Lo del minuto siete es tan cierto. Siempre me acuerdo de lo importante cuando ya estoy en la puerta.',
    'Doctor, ¿usted atiende también a adultos mayores o eso ya es geriatría?',
    'Llevé mi papelito con las tres cosas anotadas y la consulta rindió el triple. Recomiendo.',
    'Yo no dije que no podía pagar el estudio y perdí dos meses esperando un turno que nunca iba a poder usar. Buen consejo.',
    'Me dieron antibiótico por dolor de garganta con tos y mocos. Ahora entiendo que no hacía falta.',
    '¿A los 40 años el dolor de garganta con placas también hay que estudiarlo o eso es sólo en chicos?',
    'Gasté un turno completo para que me repitieran la receta de la presión. No sabía que se podía pedir en admisión.',
    'Un médico me firmó un certificado de aptitud física sin revisarme y me pareció raro. Ahora sé que estaba mal.',
  ],
  'ginecologia-obstetricia': [
    'Tengo 31 y nunca me hice el PAP por miedo a que duela. Leyendo esto voy a pedir turno.',
    'Doctora, ¿si ya me puse la vacuna del VPH igual tengo que hacerme el Papanicolaou?',
    'Estoy de 22 semanas y no sabía lo de la prueba de glucosa. ¿Se pide sola o me la tienen que indicar?',
    'A mí me saltearon la eco de las 20 semanas por falta de turnos y nadie me explicó que era la importante.',
    'Doctora, tengo 26 y no tuve hijos. Me dijeron que no me podía poner DIU. ¿Entonces era mentira?',
    'Usé pastillas cinco años y me olvidaba una por semana. Con el implante dejé de vivir pendiente.',
    'Tengo 49 y llevo dos años con calores. Me decían que era normal y que aguante. Gracias por decir lo contrario.',
    '¿La densitometría se pide a todas después de la menopausia o depende?',
  ],
  traumatologia: [
    'Me torcí el tobillo jugando y estuve dos semanas en cama. Ahora entiendo por qué me quedó rígido.',
    'Doctor, ¿la venda elástica se deja también para dormir o se saca de noche?',
    'Me hicieron tres radiografías de columna en un año por el mismo dolor y nunca cambió el tratamiento.',
    'Lo de la debilidad en la pierna me pasó y por suerte fui rápido. Era una hernia que comprimía.',
    'Volví a jugar a los cuatro meses de la operación de cruzado y me lo rompí de nuevo. Ojalá me hubieran dicho esto antes, doctor.',
    '¿La kinesiología después de la cirugía la cubre el seguro o va aparte?',
    'Mi abuela se quebró la muñeca en una caída en el baño y nadie estudió por qué se cayó. Voy a pedir la densitometría.',
    'Sacamos las alfombras y pusimos agarradera en la ducha después de que se cayó. Lo básico que uno no piensa.',
  ],
  dermatologia: [
    'Tengo un lunar que me cambió de color este año pero es chiquito, como de 3 mm. ¿Igual lo consulto?',
    'Fui al control de lunares por primera vez a los 45. Me encontraron uno que había que sacar y no lo veía nadie.',
    'Doctora, yo uso protector sólo cuando voy al lago. Viviendo en El Alto claramente estaba haciéndolo mal.',
    '¿El protector solar hay que ponerlo también los días nublados en la ciudad?',
    'Confieso lo de cambiar de crema cada dos semanas. Nunca esperé tres meses a que algo funcione.',
    'Tengo 34 años y acné. Siempre pensé que era ridículo consultar a esta edad.',
    'Después del parto se me caía el pelo a mechones y me asusté muchísimo. Volvió solo a los seis meses, tal cual dice.',
    'Doctora, ¿qué análisis se piden para la caída de cabello? Para llegar a la consulta con algo hecho.',
  ],
  psiquiatria: [
    'Dejé el antidepresivo a los diez días porque me sentía peor. Nadie me avisó que las primeras semanas eran así.',
    'Doctor, ¿la psicoterapia sirve sola o siempre hay que sumar medicación?',
    'Llevo dos años durmiendo mal y nunca probé lo de levantarme a la misma hora los fines de semana. Voy a intentarlo.',
    '¿La cafeína del té también cuenta o sólo el café?',
    'A mi hermana le dije justo eso de que hay gente peor. Me duele leerlo escrito así.',
    'Lo de ofrecer acompañar a pedir el turno es lo que más me sirvió cuando estuve mal. Nadie lo entiende hasta que le pasa.',
    'Tomo una copa para dormir hace años y me convencí de que era inofensivo porque es sólo una.',
    'Doctor, ¿cuánto es «mucho» en alcohol? Nunca sé si lo mío es normal o no.',
  ],
  endocrinologia: [
    'Me hacía dieta dos días antes del análisis para que salga bien. Ahora entiendo que la glicosilada no se engaña.',
    'Doctora, tengo 8.4 de HbA1c y me desanimé mucho. Leer que bajar a 7.5 ya sirve me cambió el día.',
    'Tomaba la levotiroxina con el desayuno junto al calcio. Sin saberlo la estaba anulando hace dos años.',
    '¿Un nódulo de 1 cm en la tiroides hay que punzarlo sí o sí?',
    'A mi marido le bajó el azúcar en la calle y le dimos gaseosa dietética. No sabíamos que no servía.',
    'Doctora, ¿la regla del 15 y 15 también vale para los que toman pastillas y no insulina?',
    'Dejé de pesarme todos los días y por primera vez sostuve un plan más de un mes.',
    'Bajé 6 kilos en seis meses y me parecía poco, pero me bajaron los triglicéridos a la mitad. Sirve saberlo.',
  ],
  oftalmologia: [
    'Tengo diabetes hace doce años y nunca me hicieron fondo de ojo. Veo bien, por eso nunca fui.',
    'Doctor, ¿cuántas horas dura el efecto de las gotas que dilatan? Trabajo en la tarde.',
    'Mi mamá perdió visión lateral y nos dimos cuenta cuando chocaba con los muebles. Era glaucoma.',
    '¿El control de presión ocular lo hace el optómetra o tiene que ser oftalmólogo?',
    'A mi abuelo le dijeron que espere a que la catarata madure. Hace tres años que casi no sale de la casa.',
    'Doctor, ¿la cirugía de catarata se hace con los dos ojos el mismo día?',
    'Trabajo ocho horas frente al monitor y a la tarde me arden los ojos. Pensaba que necesitaba lentes nuevos.',
    'Usaba las gotas para el ojo rojo todos los días. Ahora entiendo por qué cada vez las necesitaba más.',
  ],
  neurologia: [
    'Toda mi vida me dijeron que era «dolor de cabeza por nervios». Recién a los 38 me dijeron que era migraña.',
    'Doctora, tomo analgésicos casi todos los días desde hace meses. ¿Eso es lo que usted llama cefalea por abuso?',
    'A mi suegro le pasó lo de la cara caída y esperamos a la mañana porque «estaba cansado». Quedó con secuelas.',
    'Guardo esto para mostrarlo en la casa. Lo de anotar la hora exacta no se me hubiera ocurrido nunca.',
    'Mi papá repite la misma pregunta cuatro veces en una charla. Pensábamos que era la edad.',
    'Doctora, ¿la falta de vitamina B12 de verdad puede confundirse con demencia?',
    'Vi convulsionar a un compañero y le metimos una cuchara en la boca. Le rompimos un diente. Nadie sabía.',
    '¿Y si la persona convulsiona en la calle y no sabemos si es la primera vez?',
  ],
  gastroenterologia: [
    'Tomo omeprazol hace tres años sin control. Lo compro en la farmacia y ya está.',
    'Doctor, lo de levantar la cabecera con tacos y no con almohadas me cambió las noches. Simple y funcionó.',
    'Me salió Helicobacter en un examen de rutina y me trataron enseguida. Nunca me preguntaron si tenía síntomas.',
    '¿El test de aliento se hace en cualquier laboratorio o hay que pedir turno especial?',
    'Me dijeron hígado graso en una eco hace cuatro años y nadie me explicó nada. Quedó ahí nomás.',
    'Doctor, ¿el jugo de naranja natural también cuenta como azúcar líquido?',
    'Tuve sangrado y me dijeron que eran hemorroides sin revisarme. Tengo 56 años.',
    '¿La colonoscopía necesita internación o es ambulatoria?',
  ],
  neumologia: [
    'Uso inhalador hace seis años y nunca nadie me miró cómo lo hago. Ahora dudo de todo.',
    'Doctora, ¿la aerocámara la cubre el seguro o hay que comprarla aparte? ¿Cuánto dura?',
    'Tosí un mes y me dieron tres jarabes distintos. Nadie pidió baciloscopía.',
    '¿La prueba de tuberculosis es realmente gratis en cualquier centro? Me da vergüenza preguntar.',
    'Dejé de fumar hace un año y medio y todavía extraño. Leer que recaer es parte del proceso me sacó culpa.',
    'Doctora, ¿los parches de nicotina se pueden usar si uno tiene presión alta?',
    'Mi esposo deja de respirar mientras duerme y ronca durísimo. Yo pensaba que era sólo molesto.',
    '¿El estudio del sueño se hace internado una noche o hay equipos para la casa?',
  ],
  'medicina-emergencia': [
    'A mi hija le puse pasta de dientes en una quemadura porque así hacía mi mamá. Menos mal salió bien.',
    'Doctor, ¿20 minutos de agua es mucho? Con un chico llorando parece imposible.',
    'Hice el curso de RCP en el trabajo y lo olvidé todo. Lo del ritmo de La Bamba no se me va a olvidar más.',
    '¿Y si le rompo una costilla haciendo compresiones? Es lo que más miedo me da.',
    'Guardábamos el detergente en una botella de gaseosa en la cocina. Ya lo cambiamos.',
    'Doctor, ¿el número de emergencias es el 118 en todo el país o cambia por ciudad?',
    'Mi tío tuvo dolor de pecho a la medianoche y esperó hasta la mañana. Hoy tiene el corazón dañado.',
    'No sabía que en las mujeres el infarto se siente distinto. Eso debería saberlo todo el mundo.',
  ],
  nutricion: [
    'Me habían dicho que la papa engorda y la había sacado de la casa. Somos de Potosí, imagínese lo que fue eso.',
    'Licenciada, ¿el chuño se puede comer teniendo diabetes?',
    'Miraba siempre la columna «por porción» sin darme cuenta. Las galletas que compro tienen el doble de lo que pensaba.',
    '¿Los sellos octogonales ya están en todos los productos que se venden acá?',
    'Tomo el suplemento de hierro con el té del desayuno hace meses. Estaba tirando la plata.',
    'Licenciada, ¿el limón sobre la ensalada de lentejas de verdad alcanza o hay que tomar vitamina C aparte?',
    'Sacamos la gaseosa de la casa en enero. Bajé 4 kilos sin cambiar nada más y me costó menos de lo que pensaba.',
    'Yo le daba jugo de caja a mi hijo pensando que era mejor que la gaseosa.',
  ],
};

/**
 * Comentarios que funcionan bajo **cualquier** publicación de divulgación.
 *
 * ## Para qué existe este pool aparte
 *
 * Los de `COMENTARIOS_POR_ESPECIALIDAD` están escritos contra un texto
 * concreto y sólo tienen sentido ahí. Pero en la base conviven publicaciones de
 * corridas anteriores —de cuando el seeder no sembraba interacción— cuya
 * especialidad ya no se puede saber leyendo el feed público: quedaron con cero
 * comentarios y cero reacciones, que es el estado que hace invisible la mitad
 * de la tarjeta.
 *
 * La pasada de saneamiento (`--solo-interaccion`) las completa con esto. Son
 * comentarios de lectora o lector, no de especialista: preguntan por lo
 * práctico —dónde, cuándo, si hace falta derivación—, agradecen, o cuentan que
 * lo van a compartir. Ninguno afirma nada clínico, justamente porque van a caer
 * bajo un texto que este archivo no conoce.
 */
export const COMENTARIOS_GENERALES = [
  'Gracias por explicarlo así, sin términos que uno tiene que ir a buscar después.',
  'Lo comparto en el grupo de la familia. A mi mamá le va a servir.',
  'Doctora, ¿atiende también los sábados? Trabajo de lunes a viernes hasta tarde.',
  'Guardado. Vuelvo a leerlo cuando tenga la consulta.',
  'Ojalá esto se explicara así en todos lados. Uno sale del consultorio sin entender la mitad.',
  '¿Hace falta derivación para pedir turno o se pide directo?',
  'Esto me hubiera ahorrado dos años de dar vueltas.',
  'Consulta: ¿esto también aplica para adultos mayores o cambia algo?',
  'Muy claro todo. Sobre todo la parte de qué NO hay que hacer, que es lo que nadie dice.',
  'Se lo mando a mi hermano que justo está con eso.',
  'Doctor, ¿el seguro cubre ese estudio o va por cuenta propia?',
  'Lo leí dos veces. La segunda entendí lo que estaba haciendo mal.',
  'Aprecio que ponga las señales de alarma concretas y no un «consulte a su médico» y ya.',
  'Vivo en provincia y acá no hay especialista. ¿Se puede consultar en línea?',
  '¿Cada cuánto habría que repetir el control? No me quedó clara esa parte.',
  'Vengo siguiendo sus publicaciones y son de lo poco que se entiende en internet.',
  'Mi médico me dijo lo mismo y no le di bola. Leerlo escrito pega distinto.',
  'Gracias. Recién ahora entiendo por qué me pidieron ese análisis.',
  '¿Se puede pedir turno desde acá o hay que llamar?',
  'Que hable del tiempo real que lleva y de lo que cuesta se agradece. Eso nunca lo dicen.',
  'Justo estaba buscando información seria sobre esto y todo lo que encontraba era publicidad.',
  'Mi papá tiene 78 y le cuesta seguir indicaciones largas. ¿Hay algo más simple para él?',
  'Lo imprimí para pegarlo en la heladera. En serio.',
  'Comparto desde El Alto. Acá esto hace mucha falta.',
];

/**
 * Lo que responde quien firma la publicación cuando alguien pregunta.
 *
 * Se usan como **respuesta anidada** a uno de los dos comentarios en parte de
 * las publicaciones: sin al menos algunos hilos de dos niveles, no se puede ver
 * cómo se dibuja una respuesta debajo de un comentario ni cuánto se indenta.
 * Son genéricas a propósito —no responden a una pregunta concreta— porque una
 * respuesta específica escrita a ciegas contra un comentario rotado quedaría
 * fuera de lugar; éstas funcionan en cualquier hilo.
 */
export const RESPUESTAS_DEL_AUTOR = [
  'Buena pregunta, y la escucho seguido. Lo veo mejor con la historia completa delante: si querés, pedí un turno y lo revisamos con calma.',
  'Gracias por contarlo. Casos como el suyo son la razón por la que escribo esto acá y no sólo en el consultorio.',
  'Depende del caso, y por eso no me animo a contestarlo con un sí o un no en un comentario. En consulta se resuelve en cinco minutos.',
  'Exacto. Y ojo, que es más común de lo que parece: lo veo varias veces por semana.',
  'Sí, se puede. Traé lo que ya tengas hecho a la consulta y lo miramos juntos antes de pedir nada nuevo.',
  'Me alegra que le haya servido. Contale a alguien más — de eso se trata publicar esto.',
  'No hace falta que se sienta mal por eso: es exactamente lo que a casi todos nos enseñaron. Por eso vale la pena decirlo.',
  'Lo agrego a la lista de temas para la próxima publicación. Gracias por preguntar.',
];

/**
 * Los tipos de reacción disponibles, con el peso con que aparecen.
 *
 * No van repartidos en partes iguales: en cualquier muro real `LIKE` domina y
 * el resto acompaña. Un reparto uniforme haría que el resumen de reacciones se
 * viera igual en todas las tarjetas, que es otra forma de no probar nada.
 */
export const REACCIONES = [
  'LIKE',
  'LIKE',
  'LIKE',
  'LIKE',
  'INSIGHTFUL',
  'INSIGHTFUL',
  'INSIGHTFUL',
  'SUPPORT',
  'SUPPORT',
  'LOVE',
  'CELEBRATE',
];
