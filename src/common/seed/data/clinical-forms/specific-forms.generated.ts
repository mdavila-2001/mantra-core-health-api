/* GENERADO por tools/clinical-forms/build-forms.mjs — no editar a mano. */
/* Las fichas específicas por condición, una por archivo. */

import f0 from './cardiologia/cardio-ctrl-hta.json';
import f1 from './cardiologia/cardio-ctrl-ic.json';
import f2 from './cardiologia/cardio-ctrl-fa.json';
import f3 from './cardiologia/cardio-ctrl-isquemica.json';
import f4 from './cardiologia/cardio-ctrl-chagas.json';
import f5 from './endocrinologia/endo-ctrl-dm2.json';
import f6 from './endocrinologia/endo-ctrl-tiroides.json';
import f7 from './endocrinologia/endo-ctrl-obesidad.json';
import f8 from './endocrinologia/endo-ctrl-dislipidemia.json';
import f9 from './neumologia/neumo-ctrl-asma.json';
import f10 from './neumologia/neumo-ctrl-epoc.json';
import f11 from './neumologia/neumo-ctrl-tb.json';
import f12 from './neumologia/neumo-ctrl-neumonia.json';
import f13 from './gastroenterologia/gastro-ctrl-erge-dispepsia.json';
import f14 from './gastroenterologia/gastro-ctrl-hepatopatia.json';
import f15 from './gastroenterologia/gastro-ctrl-hemorragia.json';
import f16 from './nefrologia/nefro-ctrl-erc.json';
import f17 from './nefrologia/nefro-ctrl-litiasis.json';
import f18 from './neurologia/neuro-ctrl-acv.json';
import f19 from './neurologia/neuro-ctrl-epilepsia.json';
import f20 from './neurologia/neuro-ctrl-cefalea.json';
import f21 from './neurologia/neuro-ctrl-parkinson.json';
import f22 from './reumatologia/reuma-ctrl-ar.json';
import f23 from './reumatologia/reuma-ctrl-les.json';
import f24 from './reumatologia/reuma-ctrl-gota.json';
import f25 from './reumatologia/reuma-ctrl-artrosis.json';
import f26 from './infectologia/infecto-ctrl-dengue.json';
import f27 from './infectologia/infecto-ctrl-vih.json';
import f28 from './infectologia/infecto-ctrl-malaria.json';
import f29 from './infectologia/infecto-ctrl-itu.json';
import f30 from './hematologia/hemato-ctrl-anemia.json';
import f31 from './hematologia/hemato-ctrl-anticoagulacion.json';
import f32 from './oncologia/onco-ctrl-quimioterapia.json';
import f33 from './oncologia/onco-ctrl-paliativos.json';
import f34 from './geriatria/geria-ctrl-fragilidad.json';
import f35 from './geriatria/geria-ctrl-caidas.json';
import f36 from './geriatria/geria-ctrl-demencia.json';
import f37 from './dermatologia/derma-ctrl-lesion-pigmentada.json';
import f38 from './dermatologia/derma-ctrl-psoriasis.json';
import f39 from './dermatologia/derma-ctrl-leishmaniasis.json';
import f40 from './medicina-general/medgen-ctrl-ecnt.json';
import f41 from './medicina-general/medgen-ctrl-ira.json';
import f42 from './medicina-general/medgen-ctrl-eda.json';
import f43 from './medicina-general/medgen-ctrl-lumbalgia.json';
import f44 from './medicina-familiar/medfam-ctrl-salud-mental.json';
import f45 from './medicina-familiar/medfam-ctrl-planificacion.json';
import f46 from './medicina-interna/medint-ctrl-sfp.json';
import f47 from './medicina-interna/medint-ctrl-multimorbilidad.json';
import f48 from './medicina-intensiva/uci-ctrl-sepsis.json';
import f49 from './medicina-intensiva/uci-ctrl-ventilacion.json';
import f50 from './medicina-emergencia/emerg-dolor-toracico.json';
import f51 from './medicina-emergencia/emerg-acv.json';
import f52 from './medicina-emergencia/emerg-politrauma.json';
import f53 from './medicina-emergencia/emerg-intoxicacion.json';
import f54 from './psiquiatria/psiq-ctrl-depresion.json';
import f55 from './psiquiatria/psiq-ctrl-psicosis.json';
import f56 from './psiquiatria/psiq-ctrl-alcohol.json';
import f57 from './psicologia-clinica/psico-ctrl-ansiedad-depresion.json';
import f58 from './psicologia-clinica/psico-ctrl-violencia.json';
import f59 from './cirugia-general/cirgen-ctrl-posoperatorio.json';
import f60 from './cirugia-general/cirgen-ctrl-abdomen-agudo.json';
import f61 from './urologia/uro-ctrl-hpb.json';
import f62 from './urologia/uro-ctrl-litiasis.json';
import f63 from './otorrinolaringologia/orl-ctrl-otitis.json';
import f64 from './otorrinolaringologia/orl-ctrl-hipoacusia.json';
import f65 from './oftalmologia/oftalmo-ctrl-retinopatia.json';
import f66 from './oftalmologia/oftalmo-ctrl-glaucoma.json';
import f67 from './traumatologia/trauma-ctrl-fractura.json';
import f68 from './traumatologia/trauma-ctrl-rodilla.json';
import f69 from './anestesiologia/anest-ctrl-recuperacion.json';
import f70 from './pediatria/pedia-ctrl-ira.json';
import f71 from './pediatria/pedia-ctrl-eda.json';
import f72 from './pediatria/pedia-ctrl-desnutricion.json';
import f73 from './pediatria/pedia-ctrl-asma.json';
import f74 from './pediatria/pedia-recien-nacido.json';
import f75 from './ginecologia-obstetricia/ginobs-consulta-ginecologica.json';
import f76 from './ginecologia-obstetricia/ginobs-ctrl-tamizaje-cervix.json';
import f77 from './ginecologia-obstetricia/ginobs-ctrl-puerperio.json';
import f78 from './obstetricia/obst-ctrl-hipertension.json';
import f79 from './obstetricia/obst-ctrl-diabetes-gestacional.json';
import f80 from './obstetricia/obst-trabajo-de-parto.json';
import f81 from './odontologia/odonto-ctrl-periodontal.json';
import f82 from './nutricion/nutri-ctrl-obesidad.json';
import f83 from './nutricion/nutri-ctrl-diabetes.json';
import f84 from './fisioterapia/fisio-ctrl-lumbalgia.json';
import f85 from './fisioterapia/fisio-ctrl-neurologica.json';
import f86 from './enfermeria/enfer-ctrl-heridas.json';
import f87 from './medicina-deportiva/medep-preparticipativa.json';
import f88 from './radiologia/radio-informe-mamografia.json';
import f89 from './radiologia/radio-informe-rx-torax.json';
import f90 from './radiologia/radio-informe-eco-obstetrica.json';
import f91 from './patologia-clinica/patol-informe-citologia-cervical.json';
import f92 from './bioquimica-clinica/bioq-informe-hemograma.json';
import f93 from './bioquimica-clinica/bioq-informe-orina.json';

export const SPECIFIC_FORMS = [
  f0,
  f1,
  f2,
  f3,
  f4,
  f5,
  f6,
  f7,
  f8,
  f9,
  f10,
  f11,
  f12,
  f13,
  f14,
  f15,
  f16,
  f17,
  f18,
  f19,
  f20,
  f21,
  f22,
  f23,
  f24,
  f25,
  f26,
  f27,
  f28,
  f29,
  f30,
  f31,
  f32,
  f33,
  f34,
  f35,
  f36,
  f37,
  f38,
  f39,
  f40,
  f41,
  f42,
  f43,
  f44,
  f45,
  f46,
  f47,
  f48,
  f49,
  f50,
  f51,
  f52,
  f53,
  f54,
  f55,
  f56,
  f57,
  f58,
  f59,
  f60,
  f61,
  f62,
  f63,
  f64,
  f65,
  f66,
  f67,
  f68,
  f69,
  f70,
  f71,
  f72,
  f73,
  f74,
  f75,
  f76,
  f77,
  f78,
  f79,
  f80,
  f81,
  f82,
  f83,
  f84,
  f85,
  f86,
  f87,
  f88,
  f89,
  f90,
  f91,
  f92,
  f93,
];
