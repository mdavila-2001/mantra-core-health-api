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
import f94 from './medicina-emergencia/nnac-u01-01-paro-cardiorrespiratorio-reani.json';
import f95 from './medicina-emergencia/nnac-u01-02-choque.json';
import f96 from './medicina-emergencia/nnac-u01-04-crisis-hipertensivas.json';
import f97 from './medicina-emergencia/nnac-u01-05-hemoptisis.json';
import f98 from './medicina-emergencia/nnac-u01-07-traumatismo-toracico.json';
import f99 from './medicina-emergencia/nnac-u01-10-quemaduras.json';
import f100 from './medicina-emergencia/nnac-u01-11-heridas.json';
import f101 from './medicina-emergencia/nnac-u01-13-intoxicaciones-agudas.json';
import f102 from './medicina-emergencia/nnac-u01-14-intoxicacion-aguda-inhibidores.json';
import f103 from './medicina-emergencia/nnac-u01-15-intoxicacion-aguda-paraquat.json';
import f104 from './medicina-emergencia/nnac-u01-16-intoxicacion-aguda-paracetamol.json';
import f105 from './medicina-emergencia/nnac-u01-17-intoxicacion-aguda-acido.json';
import f106 from './medicina-emergencia/nnac-u01-18-intoxicacion-aguda-benzodiacep.json';
import f107 from './medicina-emergencia/nnac-u01-19-intoxicacion-aguda-etanol.json';
import f108 from './medicina-emergencia/nnac-u01-20-sindrome-tropoide.json';
import f109 from './medicina-emergencia/nnac-u01-21-mordedura-serpiente.json';
import f110 from './medicina-emergencia/nnac-u01-22-mordedura-viuda-negra.json';
import f111 from './geriatria/nnac-u01-23-caidas-adulto-mayor.json';
import f112 from './psicologia-clinica/nnac-u02-01-violencia-familia-domestica.json';
import f113 from './psicologia-clinica/nnac-u02-02-maltrato-nino-nina.json';
import f114 from './psicologia-clinica/nnac-u02-03-violencia-sexual.json';
import f115 from './infectologia/nnac-u03-01-amebiasis.json';
import f116 from './infectologia/nnac-u03-02-ascariasis.json';
import f117 from './infectologia/nnac-u03-03-colera.json';
import f118 from './infectologia/nnac-u03-04-cisticercosis.json';
import f119 from './infectologia/nnac-u03-08-diarrea-persistente.json';
import f120 from './infectologia/nnac-u03-09-disenteria-bacilar-shigellosis.json';
import f121 from './infectologia/nnac-u03-10-distomatosis-hepatica-fasciola.json';
import f122 from './infectologia/nnac-u03-12-enfermedad-congenita-chagas.json';
import f123 from './infectologia/nnac-u03-13-enfermedad-cronica-chagas.json';
import f124 from './infectologia/nnac-u03-14-enfermedad-cronica-chagas.json';
import f125 from './infectologia/nnac-u03-15-enfermedad-chagas-manejo.json';
import f126 from './dermatologia/nnac-u03-16-erisipela.json';
import f127 from './infectologia/nnac-u03-17-estrongiloidiasis.json';
import f128 from './infectologia/nnac-u03-18-fiebre-tifoidea-paratifoidea.json';
import f129 from './infectologia/nnac-u03-19-giardiasis.json';
import f130 from './infectologia/nnac-u03-20-gingivoestomatitis-herpetica.json';
import f131 from './infectologia/nnac-u03-21-hantavirus-sindrome-cardiopulm.json';
import f132 from './infectologia/nnac-u03-23-hepatitis-viral-aguda.json';
import f133 from './infectologia/nnac-u03-24-himenolepiasis.json';
import f134 from './infectologia/nnac-u03-25-influenza.json';
import f135 from './dermatologia/nnac-u03-26-larva-migrans-cutanea.json';
import f136 from './infectologia/nnac-u03-27-leishmaniasis.json';
import f137 from './infectologia/nnac-u03-28-lepra-enfermedad-hansen.json';
import f138 from './infectologia/nnac-u03-29-malaria-paludismo.json';
import f139 from './dermatologia/nnac-u03-31-miasis.json';
import f140 from './infectologia/nnac-u03-32-oxiuriasis-enterobiasis.json';
import f141 from './infectologia/nnac-u03-33-parasitosis-intestinal.json';
import f142 from './dermatologia/nnac-u03-35-pediculosis.json';
import f143 from './infectologia/nnac-u03-36-quiste-hidatidico.json';
import f144 from './infectologia/nnac-u03-37-rabia-humana.json';
import f145 from './infectologia/nnac-u03-38-rubeola.json';
import f146 from './infectologia/nnac-u03-39-salmonelosis.json';
import f147 from './infectologia/nnac-u03-40-sarampion.json';
import f148 from './dermatologia/nnac-u03-41-sarcoptosis-escabiosis.json';
import f149 from './infectologia/nnac-u03-42-teniasis.json';
import f150 from './infectologia/nnac-u03-43-trichuriasis.json';
import f151 from './neumologia/nnac-u03-44-tuberculosis.json';
import f152 from './neumologia/nnac-u03-45-reacciones-adversas-farmacos.json';
import f153 from './infectologia/nnac-u03-46-toxoplasmosis-congenita.json';
import f154 from './infectologia/nnac-u03-47-uncinariasis.json';
import f155 from './dermatologia/nnac-u03-49-verruga-vulgar.json';
import f156 from './oncologia/nnac-u04-01-cancer-cuello-uterino.json';
import f157 from './oncologia/nnac-u04-02-cancer-mama.json';
import f158 from './hematologia/nnac-u05-03-eritrocitosis.json';
import f159 from './hematologia/nnac-u05-04-purpura-trombocitopenica-autoi.json';
import f160 from './endocrinologia/nnac-u06-03-neuropatia-diabetica.json';
import f161 from './endocrinologia/nnac-u06-04-diabetes-gestacional.json';
import f162 from './endocrinologia/nnac-u06-07-hipotiroidismo.json';
import f163 from './endocrinologia/nnac-u06-08-hipotiroidismo-congenito.json';
import f164 from './endocrinologia/nnac-u06-10-obesidad.json';
import f165 from './endocrinologia/nnac-u06-11-talla-baja.json';
import f166 from './endocrinologia/nnac-u06-13-dislipidemias.json';
import f167 from './psiquiatria/nnac-u08-01-trastornos-mentales-organicos.json';
import f168 from './psiquiatria/nnac-u08-02-psicosis.json';
import f169 from './psiquiatria/nnac-u08-03-trastornos-uso-alcohol.json';
import f170 from './psiquiatria/nnac-u08-04-trastornos-uso-tabaco.json';
import f171 from './psiquiatria/nnac-u08-05-trastornos-debidos-uso.json';
import f172 from './psiquiatria/nnac-u08-06-trastornos-ansiedad.json';
import f173 from './psiquiatria/nnac-u08-07-trastornos-depresivos.json';
import f174 from './psiquiatria/nnac-u08-08-conducta-suicida.json';
import f175 from './psiquiatria/nnac-u08-09-trastornos-somatomorfos.json';
import f176 from './psiquiatria/nnac-u08-10-trastornos-conducta-alimentari.json';
import f177 from './psiquiatria/nnac-u08-11-trastornos-conducta-infancia.json';
import f178 from './psiquiatria/nnac-u08-12-trastornos-deficit-atencion.json';
import f179 from './psiquiatria/nnac-u08-13-atencion-salud-mental.json';
import f180 from './neurologia/nnac-u09-02-convulsiones-febriles.json';
import f181 from './traumatologia/nnac-u09-03-dolor-lumbar-agudo.json';
import f182 from './neurologia/nnac-u09-05-enfermedades-desmielinizantes-.json';
import f183 from './neurologia/nnac-u09-06-enfermedad-cerebro-vascular.json';
import f184 from './neurologia/nnac-u09-07-epilepsia.json';
import f185 from './neurologia/nnac-u09-08-estado-epileptico.json';
import f186 from './neurologia/nnac-u09-12-polineuropatia-motora-aguda.json';
import f187 from './oftalmologia/nnac-u10-01-ambliopia.json';
import f188 from './oftalmologia/nnac-u10-02-blefaritis.json';
import f189 from './oftalmologia/nnac-u10-03-catarata.json';
import f190 from './oftalmologia/nnac-u10-04-celulitis-preseptal-peri.json';
import f191 from './oftalmologia/nnac-u10-05-conjuntivitis-aguda-bacteriana.json';
import f192 from './oftalmologia/nnac-u10-06-conjuntivitis-alergica.json';
import f193 from './oftalmologia/nnac-u10-07-conjuntivitis-hiperplasica-pig.json';
import f194 from './oftalmologia/nnac-u10-08-cuerpo-extrano.json';
import f195 from './oftalmologia/nnac-u10-09-chalazion.json';
import f196 from './oftalmologia/nnac-u10-10-dacriocistitis-aguda-cronica.json';
import f197 from './oftalmologia/nnac-u10-11-degeneracion-macular-relaciona.json';
import f198 from './oftalmologia/nnac-u10-12-desprendimiento-retina.json';
import f199 from './oftalmologia/nnac-u10-13-entropion-ectropion.json';
import f200 from './oftalmologia/nnac-u10-14-erosion-abrasion-corneal.json';
import f201 from './oftalmologia/nnac-u10-15-escleritis.json';
import f202 from './oftalmologia/nnac-u10-16-estrabismo-especificado.json';
import f203 from './oftalmologia/nnac-u10-17-exoftalmos.json';
import f204 from './oftalmologia/nnac-u10-18-glaucoma.json';
import f205 from './oftalmologia/nnac-u10-19-oclusion-arteria-central.json';
import f206 from './oftalmologia/nnac-u10-20-sindrome-ojo-seco.json';
import f207 from './oftalmologia/nnac-u10-21-orzuelo.json';
import f208 from './oftalmologia/nnac-u10-22-pinguecula.json';
import f209 from './oftalmologia/nnac-u10-23-pterigion.json';
import f210 from './oftalmologia/nnac-u10-24-ptosis-palpebral-congenita.json';
import f211 from './oftalmologia/nnac-u10-25-quemaduras-causticaciones-ocul.json';
import f212 from './oftalmologia/nnac-u10-26-retinopatia-prematuridad.json';
import f213 from './oftalmologia/nnac-u10-27-retinopatia-diabetica.json';
import f214 from './oftalmologia/nnac-u10-28-retinopatia-hipertensiva.json';
import f215 from './oftalmologia/nnac-u10-29-trauma-ocular-abierto.json';
import f216 from './oftalmologia/nnac-u10-30-ulcera-corneal.json';
import f217 from './oftalmologia/nnac-u10-31-uveitis.json';
import f218 from './otorrinolaringologia/nnac-u11-01-otitis-media.json';
import f219 from './otorrinolaringologia/nnac-u11-02-mastoiditis.json';
import f220 from './otorrinolaringologia/nnac-u11-03-cuerpos-extranos-oido.json';
import f221 from './cardiologia/nnac-u12-02-hipertension-arterial-sistemic.json';
import f222 from './cardiologia/nnac-u12-03-trombo-embolismo-pulmonar.json';
import f223 from './cardiologia/nnac-u12-04-insuficiencia-cardiaca.json';
import f224 from './cardiologia/nnac-u12-05-enfermedad-isquemica-corazon.json';
import f225 from './cirugia-general/nnac-u12-06-obstruccion-arterial-aguda.json';
import f226 from './cirugia-general/nnac-u12-07-obstruccion-arterial-cronica.json';
import f227 from './cirugia-general/nnac-u12-08-trombosis-venosa-profunda.json';
import f228 from './cirugia-general/nnac-u12-09-varices-miembro-inferior.json';
import f229 from './otorrinolaringologia/nnac-u13-01-resfrio-comun-rinofaringitis.json';
import f230 from './otorrinolaringologia/nnac-u13-02-faringoamigdalitis-estreptococ.json';
import f231 from './otorrinolaringologia/nnac-u13-05-rinosinusitis-aguda-rinosinusi.json';
import f232 from './pediatria/nnac-u13-06-bronquiolitis.json';
import f233 from './neumologia/nnac-u13-07-asma-bronquial-adultos.json';
import f234 from './pediatria/nnac-u13-08-asma-bronquial-ninos.json';
import f235 from './neumologia/nnac-u13-09-neumonia-adquirida-comunidad.json';
import f236 from './neumologia/nnac-u13-14-insuficiencia-respiratoria-gra.json';
import f237 from './neumologia/nnac-u13-15-edema-agudo-pulmon.json';
import f238 from './gastroenterologia/nnac-u14-01-dolor-abdominal-recurrente.json';
import f239 from './gastroenterologia/nnac-u14-02-enfermedad-reflujo-gastroesofa.json';
import f240 from './gastroenterologia/nnac-u14-03-estrenimiento-cronico.json';
import f241 from './gastroenterologia/nnac-u14-07-hemorragia-digestiva-baja.json';
import f242 from './gastroenterologia/nnac-u14-08-impactacion-fecal-fecaloma.json';
import f243 from './cirugia-general/nnac-u14-09-obstruccion-intestinal.json';
import f244 from './gastroenterologia/nnac-u14-11-ulcera-peptica-enfermedad.json';
import f245 from './cirugia-general/nnac-u14-12-volvulo-sigmoide.json';
import f246 from './medicina-interna/nnac25-mi-01-anemia-ferropenica.json';
import f247 from './medicina-interna/nnac25-mi-02-artritis-reumatoide.json';
import f248 from './medicina-interna/nnac25-mi-04-bronquitis-aguda.json';
import f249 from './medicina-interna/nnac25-mi-05-diabetes-mellitus.json';
import f250 from './medicina-interna/nnac25-mi-07-enfermedad-cambios-minimos.json';
import f251 from './medicina-interna/nnac25-mi-08-enfermedad-chagas-maza.json';
import f252 from './medicina-interna/nnac25-mi-11-fiebre-reumatica-mencion.json';
import f253 from './medicina-interna/nnac25-mi-13-glomerulonefritis-postestrepto.json';
import f254 from './medicina-interna/nnac25-mi-14-hepatitis-viral-aguda.json';
import f255 from './medicina-interna/nnac25-mi-16-hipertiroidismo.json';
import f256 from './medicina-interna/nnac25-mi-18-infeccion-tracto-urinario.json';
import f257 from './medicina-interna/nnac25-mi-19-insuficiencia-suprarrenal.json';
import f258 from './medicina-interna/nnac25-mi-20-lupus-eritematoso-sistemico.json';
import f259 from './medicina-interna/nnac25-mi-21-neumonia-adquirida-comunidad.json';
import f260 from './medicina-interna/nnac25-mi-22-neumonia-intrahospitalaria-nih.json';
import f261 from './medicina-interna/nnac25-mi-23-pancreatitis-aguda.json';
import f262 from './medicina-interna/nnac25-mi-24-sindrome-metabolico.json';
import f263 from './medicina-interna/nnac25-mi-25-sindrome-nefritico-agudo.json';
import f264 from './medicina-interna/nnac25-mi-26-sindro-me-nefrotico.json';
import f265 from './medicina-intensiva/nnac25-ti-03-cetoacidosis-diabetica.json';
import f266 from './medicina-intensiva/nnac25-ti-04-choque-hemorragico-obstetrico.json';
import f267 from './medicina-intensiva/nnac25-ti-05-coagulacion-intravascular-dise.json';
import f268 from './medicina-intensiva/nnac25-ti-06-falla-hepatica-aguda.json';
import f269 from './medicina-intensiva/nnac25-ti-07-falla-renal-aguda.json';
import f270 from './medicina-intensiva/nnac25-ti-08-sepsis-choque-septico.json';
import f271 from './medicina-intensiva/nnac25-ti-09-sindrome-coronario-agudo.json';
import f272 from './medicina-intensiva/nnac25-ti-10-trastornos-hipertensivos-embar.json';
import f273 from './medicina-intensiva/nnac25-ti-11-trauma-abdominal-pelvico.json';
import f274 from './medicina-intensiva/nnac25-ti-13-traumatismo-craneoencefalico.json';
import f275 from './traumatologia/nnac25-tra-01-artrosis-osteoartrosis.json';
import f276 from './traumatologia/nnac25-tra-02-displasia-desarrollo-cadera.json';
import f277 from './traumatologia/nnac25-tra-03-fracturas.json';
import f278 from './traumatologia/nnac25-tra-04-fractura-cadera.json';
import f279 from './traumatologia/nnac25-tra-05-fractura-clavicula.json';
import f280 from './traumatologia/nnac25-tra-06-fractura-diafisis-humeral.json';
import f281 from './traumatologia/nnac25-tra-07-fractura-diafisis-tibial.json';
import f282 from './traumatologia/nnac25-tra-08-fractura-metacarpianos.json';
import f283 from './traumatologia/nnac25-tra-09-fractura-tobillo.json';
import f284 from './traumatologia/nnac25-tra-10-fractura-distal-humero.json';
import f285 from './traumatologia/nnac25-tra-11-fractura-distal-radio.json';
import f286 from './traumatologia/nnac25-tra-12-fractura-proximal-humero.json';
import f287 from './traumatologia/nnac25-tra-14-luxacion-acromioclavicular.json';
import f288 from './traumatologia/nnac25-tra-15-osteoartritis-tuberculosa.json';
import f289 from './traumatologia/nnac25-tra-16-osteomielitis-aguda.json';
import f290 from './traumatologia/nnac25-tra-17-osteomielitis-cronica.json';
import f291 from './traumatologia/nnac25-tra-18-osteoporosis.json';
import f292 from './medicina-emergencia/nnac25-urg-02-angina-pecho-estable.json';
import f293 from './medicina-emergencia/nnac25-urg-04-choque-anafilactico.json';
import f294 from './medicina-emergencia/nnac25-urg-08-fascitis-necrosante.json';
import f295 from './medicina-emergencia/nnac25-urg-10-hemorragia-digestiva-alta.json';
import f296 from './medicina-emergencia/nnac25-urg-11-hemorragia-digestiva-alta.json';
import f297 from './medicina-emergencia/nnac25-urg-23-politraumatismo.json';
import f298 from './medicina-emergencia/nnac25-urg-25-sindrome-convulsivo.json';
import f299 from './neurologia/nnac25-neu-02-cefalea-tensional.json';
import f300 from './neurologia/nnac25-neu-03-demencias.json';
import f301 from './neurologia/nnac25-neu-04-dolor-neuropatico.json';
import f302 from './neurologia/nnac25-neu-05-encefalitis.json';
import f303 from './neurologia/nnac25-neu-06-enfermedad-parkinson.json';
import f304 from './neurologia/nnac25-neu-10-meningitis-bacteriana-aguda.json';
import f305 from './neurologia/nnac25-neu-11-migrana.json';
import f306 from './neurologia/nnac25-neu-12-neuralgia-trigemino-glosofarin.json';
import f307 from './neurologia/nnac25-neu-13-neurocisticercosis.json';
import f308 from './neurologia/nnac25-neu-14-paralisis-facial-periferica.json';
import f309 from './pediatria/nnac25-ped-05-dengue.json';
import f310 from './pediatria/nnac25-ped-06-dermatitis-panal.json';
import f311 from './pediatria/nnac25-ped-07-diarrea-gastroenteritis-presun.json';
import f312 from './pediatria/nnac25-ped-08-epiglotitis-crup.json';
import f313 from './pediatria/nnac25-ped-11-fiebre-oropouche.json';
import f314 from './pediatria/nnac25-ped-14-persistencia-circulacion-fetal.json';
import f315 from './pediatria/nnac25-ped-16-laringitis-laringotraqueitis.json';
import f316 from './pediatria/nnac25-ped-17-moniliasis-oral-candidiasis.json';
import f317 from './pediatria/nnac25-ped-19-neumonia-grave-menores.json';
import f318 from './pediatria/nnac25-ped-22-parotiditis.json';
import f319 from './pediatria/nnac25-ped-23-pubertad-precoz.json';
import f320 from './pediatria/nnac25-ped-26-sepsis-debida-candida.json';
import f321 from './pediatria/nnac25-ped-27-sepsis-nosocomial-infeccion.json';
import f322 from './pediatria/nnac25-ped-28-sifilis-congenita.json';
import f323 from './pediatria/nnac25-ped-30-trastornos-metabolicos-equilib.json';
import f324 from './pediatria/nnac25-ped-31-varicela.json';

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
  f94,
  f95,
  f96,
  f97,
  f98,
  f99,
  f100,
  f101,
  f102,
  f103,
  f104,
  f105,
  f106,
  f107,
  f108,
  f109,
  f110,
  f111,
  f112,
  f113,
  f114,
  f115,
  f116,
  f117,
  f118,
  f119,
  f120,
  f121,
  f122,
  f123,
  f124,
  f125,
  f126,
  f127,
  f128,
  f129,
  f130,
  f131,
  f132,
  f133,
  f134,
  f135,
  f136,
  f137,
  f138,
  f139,
  f140,
  f141,
  f142,
  f143,
  f144,
  f145,
  f146,
  f147,
  f148,
  f149,
  f150,
  f151,
  f152,
  f153,
  f154,
  f155,
  f156,
  f157,
  f158,
  f159,
  f160,
  f161,
  f162,
  f163,
  f164,
  f165,
  f166,
  f167,
  f168,
  f169,
  f170,
  f171,
  f172,
  f173,
  f174,
  f175,
  f176,
  f177,
  f178,
  f179,
  f180,
  f181,
  f182,
  f183,
  f184,
  f185,
  f186,
  f187,
  f188,
  f189,
  f190,
  f191,
  f192,
  f193,
  f194,
  f195,
  f196,
  f197,
  f198,
  f199,
  f200,
  f201,
  f202,
  f203,
  f204,
  f205,
  f206,
  f207,
  f208,
  f209,
  f210,
  f211,
  f212,
  f213,
  f214,
  f215,
  f216,
  f217,
  f218,
  f219,
  f220,
  f221,
  f222,
  f223,
  f224,
  f225,
  f226,
  f227,
  f228,
  f229,
  f230,
  f231,
  f232,
  f233,
  f234,
  f235,
  f236,
  f237,
  f238,
  f239,
  f240,
  f241,
  f242,
  f243,
  f244,
  f245,
  f246,
  f247,
  f248,
  f249,
  f250,
  f251,
  f252,
  f253,
  f254,
  f255,
  f256,
  f257,
  f258,
  f259,
  f260,
  f261,
  f262,
  f263,
  f264,
  f265,
  f266,
  f267,
  f268,
  f269,
  f270,
  f271,
  f272,
  f273,
  f274,
  f275,
  f276,
  f277,
  f278,
  f279,
  f280,
  f281,
  f282,
  f283,
  f284,
  f285,
  f286,
  f287,
  f288,
  f289,
  f290,
  f291,
  f292,
  f293,
  f294,
  f295,
  f296,
  f297,
  f298,
  f299,
  f300,
  f301,
  f302,
  f303,
  f304,
  f305,
  f306,
  f307,
  f308,
  f309,
  f310,
  f311,
  f312,
  f313,
  f314,
  f315,
  f316,
  f317,
  f318,
  f319,
  f320,
  f321,
  f322,
  f323,
  f324,
];
