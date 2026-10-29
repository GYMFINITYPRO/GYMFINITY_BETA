// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDlvQtEOO86_PZOqROoMuDU7wK_r3v3tXM",
  authDomain: "gymfinitybeta.firebaseapp.com",
  projectId: "gymfinitybeta",
  storageBucket: "gymfinitybeta.firebasestorage.app",
  messagingSenderId: "938550934993",
  appId: "1:938550934993:web:376ec1e176b7cad2f0b4f0",
  measurementId: "G-YTZRFQR8RM"
};

// Inicializamos la conexión a la Nube
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
// ==========================================
// ESTADO GLOBAL
// ==========================================
const state = {
  currentUser: JSON.parse(localStorage.getItem('gym_session')) || null, 
  adminTab: 'profile', clientTab: 'routine', viewingClientAsAdmin: false,
  calendarDate: new Date(),
  events: [],
  historyDB: {},
  inventory: [
    'Extensiones de cuadriceps', 'Curl femoral de pie', 'Curl femoral acostado', 'Smith',
    'Press militar hombro en máquina', 'Trapecio en máquina', 'Peck deck hombro', 'Peck deck pecho', 
    'Jalón vertical', 'Aperturas', 'Fondos', 'Crunch abdominal', 'Mancuernas', 'Polea'
  ],
  clients: [],
  currentProductIndex: 0
};

// ==========================================
// FUNCIONES DE SINCRONIZACIÓN CON LA NUBE
// ==========================================
async function loadDataFromFirebase() {
    try {
        const settingsDoc = await db.collection('gymData').doc('settings').get();
        if(settingsDoc.exists) {
            const d = settingsDoc.data();
            if(d.inventory) state.inventory = d.inventory;
        }

        const eventsDoc = await db.collection('gymData').doc('events').get();
        if(eventsDoc.exists) state.events = eventsDoc.data().events || [];

        const historyDoc = await db.collection('gymData').doc('history').get();
        if(historyDoc.exists) state.historyDB = historyDoc.data() || {};

        const clientsSnapshot = await db.collection('clients').get();
        state.clients = clientsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error conectando a Firebase:", error);
    }
}

function syncClientToDB(clientRecord) { db.collection('clients').doc(clientRecord.cc).set(clientRecord).catch(e => console.log(e)); }
function deleteClientFromDB(cc) { db.collection('clients').doc(cc).delete().catch(e => console.log(e)); }
function syncSettingsToDB() { db.collection('gymData').doc('settings').set({ inventory: state.inventory }).catch(e => console.log(e)); }
function syncEventsToDB() { db.collection('gymData').doc('events').set({ events: state.events }).catch(e => console.log(e)); }
function syncHistoryToDB() { db.collection('gymData').doc('history').set(state.historyDB).catch(e => console.log(e)); }

// ==========================================
// ENTRENADORES Y PLANES
// ==========================================
const authorizedAdmins = [
    { name: "Daniel Muñoz", cc: "1022991699" },
    { name: "José Muñoz", cc: "79818717" }
];

const gymPlans = [
    { id: "1. SILVER", price: "$70.000", subtitle: "Plan básico", target: "Para quien quiere entrenar por su cuenta y busca una opción económica.", schedule: "6:00am - 3:00pm", classes: false, inbody: false, routine: false, companion: false, discount: false, color: "#E5E7EB", shadow: "rgba(229,231,235,0.5)", durationDays: 30 },
    { id: "2. PREMIUM", price: "$75.000", subtitle: "Plan recomendado", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: "5% Dcto. suplementos", color: "#3B82F6", shadow: "rgba(59,130,246,0.5)", durationDays: 30 },
    { id: "3. GOLD", price: "$85.000", subtitle: "Plan más completo", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#FFD700", shadow: "rgba(255,215,0,0.5)", durationDays: 30 },
    { id: "4. FLEX", price: "$49.000", subtitle: "Modalidad flexible", target: "Para quien no quiere comprometerse con un plan mensual tradicional.", schedule: "10 entradas vigencia 1 mes", classes: true, inbody: false, routine: false, companion: false, discount: false, color: "#EC4899", shadow: "rgba(236,72,153,0.5)", durationDays: 30 },
    { id: "1. SILVER BIMESTRE", price: "$130.000", subtitle: "Plan básico", target: "Para quien quiere entrenar por su cuenta y busca una opción económica.", schedule: "6:00am - 3:00pm", classes: false, inbody: false, routine: false, companion: false, discount: false, color: "#A855F7", shadow: "rgba(168,85,247,0.5)", durationDays: 60 },
    { id: "2. PREMIUM BIMESTRE", price: "$140.000", subtitle: "Plan recomendado", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: "5% Dcto. suplementos", color: "#F97316", shadow: "rgba(249,115,22,0.5)", durationDays: 60 },
    { id: "3. GOLD BIMESTRE", price: "$155.000", subtitle: "Plan más completo", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#14B8A6", shadow: "rgba(20,184,166,0.5)", durationDays: 60 },
    { id: "5. RUTINA", price: "$10.000", subtitle: "Puede ir guiada", target: "Para quien quiere orientación básica para entrenar sin plan mensual.", schedule: "6:00am - 10:00pm", classes: true, inbody: false, routine: false, companion: false, discount: false, color: "#18181B", shadow: "rgba(255,255,255,0.4)", durationDays: 30 },
    { id: "2. PLAN JUVENIL", price: "$70.000", subtitle: "De 14 a 17 años", target: "Para quien quiere entrenar con mayor orientación y una rutina adaptada a sus objetivos.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Valoración inicial InBody", routine: "Adaptación personalizada", companion: false, discount: false, color: "#06B6D4", shadow: "rgba(6,182,212,0.5)", durationDays: 30 },
    { id: "3. GOLD F. ARMADAS", price: "$70.000", subtitle: "Fuerzas Armadas", target: "Para quien desea un seguimiento más frecuente y beneficios adicionales.", schedule: "6:00am - 10:00pm", classes: true, inbody: "Seguimiento mensual InBody", routine: "Revisión y ajuste mensual", companion: "Acompañante 4 veces/mes", discount: "10% Dcto. suplementos", color: "#10B981", shadow: "rgba(16,185,129,0.5)", durationDays: 30 }
];

const storeProducts = [
    { name: "Proteína Whey Elite", img: "PRODUCTOS/PROTEINA_1.png", desc: "Fórmula avanzada para acelerar la recuperación post-entrenamiento.", price: "$165.000", tag: "SABOR VAINILLA • 2 LIBRAS", info: ["Rápida absorción", "Baja en carbohidratos", "Ideal post-entreno"] },
    { name: "Proteína Isolate Pro", img: "PRODUCTOS/PROTEINA_2.png", desc: "Proteína aislada de máxima pureza, diseñada para atletas exigentes.", price: "$190.000", tag: "SABOR CHOCOLATE • 2 LIBRAS", info: ["Cero Azúcar", "Libre de Lactosa", "Alta en BCAAs"] },
    { name: "Creatina Monohidratada", img: "PRODUCTOS/CREATINA_1.png", desc: "Suplemento esencial para aumentar la fuerza explosiva y el volumen celular.", price: "$90.000", tag: "SIN SABOR • 300G", info: ["Aumenta la fuerza", "Mejora resistencia", "100% Pura"] }
];

const gymCoaches = [
    { name: "RZR Training", coach: "Alta Intensidad", img: "CLASES/RZR.png", desc: "Entrenamiento de alta intensidad (HIIT). Supera tus límites, mejora tu resistencia cardiovascular y desarrolla fuerza explosiva." },
    { name: "Rumba Aeróbica", coach: "Cardio Dance", img: "CLASES/RUMBA.png", desc: "Quema calorías y libera el estrés al ritmo de los mejores géneros musicales. Una sesión llena de energía, sudor y pura actitud." },
    { name: "Colombia Rumbera", coach: "Sabor Local", img: "CLASES/COLOMBIA_RUMBERA.png", desc: "Fusión explosiva de ritmos folclóricos y urbanos. Un cardio intenso, diferente y muy divertido con auténtico sabor colombiano." },
    { name: "Step Fit", coach: "Resistencia", img: "CLASES/STEP.png", desc: "Coreografía y resistencia sobre plataforma. Ideal para tonificar piernas y glúteos mientras potencias tu capacidad aeróbica." },
    { name: "Combat & Yoga", coach: "Fuerza y Flexibilidad", img: "CLASES/COMBATYOGA.png", desc: "Fusión perfecta entre la adrenalina y energía de los movimientos de combate con la respiración, flexibilidad y control del yoga. Fortalece cuerpo y mente en una sola sesión." }
];

// ==========================================
// DICCIONARIO DE EJERCICIOS
// ==========================================
const exerciseDetails = {
    // ABDOMEN
    "Abdomen Polea Oblicuos": { img: "ejercicios/ABDOMEN/abdomen_polea_oblicuos_arriba.png", desc: "Contrae el abdomen girando desde el torso y mantén tensión en el oblicuo." },
    "Crunch Balón Medicinal": { img: "ejercicios/ABDOMEN/crunch_balon_medicinal.png", desc: "Eleva el torso abrazando o sosteniendo el balón medicinal." },
    "Crunch con Balón Medicinal": { img: "ejercicios/ABDOMEN/crunch_con_balon_medicinal.png", desc: "Eleva el torso abrazando o sosteniendo el balón medicinal." },
    "Crunch con Disco": { img: "ejercicios/ABDOMEN/crunch_con_disco.png", desc: "Sostén el disco sobre el pecho o extendido y eleva el torso." },
    "Crunch Cruzado Libre": { img: "ejercicios/ABDOMEN/crunch_cruzado_libre.png", desc: "Lleva el codo hacia la rodilla contraria alternando lados." },
    "Crunch Elevando Pelvis": { img: "ejercicios/ABDOMEN/crunch_elevando_pelvis.png", desc: "Eleva la cadera ligeramente al mismo tiempo que contraes el abdomen alto." },
    "Crunch en Banco": { img: "ejercicios/ABDOMEN/crunch_en_banco.png", desc: "Recostado en el banco, contrae el abdomen sin tirar del cuello." },
    "Crunch en Máquina": { img: "ejercicios/ABDOMEN/crunch_en_maquina.png", desc: "Ajusta la máquina y flexiona el torso con la resistencia elegida." },
    "Crunch Frog": { img: "ejercicios/ABDOMEN/crunch_frog.png", desc: "Abre las rodillas como rana y haz el crunch para trabajar todo el bloque abdominal." },
    "Crunch Levantamiento Pelvis": { img: "ejercicios/ABDOMEN/crunch_levantamiento_de_pelvis.png", desc: "Levanta la cadera controlando la bajada." },
    "Elevación de Pelvis": { img: "ejercicios/ABDOMEN/elevacion_de_pelvis.png", desc: "Acuéstate boca arriba y eleva la pelvis despegando los glúteos del piso." },
    "Elevación de Piernas": { img: "ejercicios/ABDOMEN/elevacion_de_piernas.png", desc: "Mantén las piernas rectas y súbelas controlando la tensión abdominal." },
    "Elevación Piernas Flexionadas": { img: "ejercicios/ABDOMEN/elevacion_piernas_flexionadas.png", desc: "Lleva las rodillas flexionadas hacia el pecho." },
    "Escaladas": { img: "ejercicios/ABDOMEN/escaladas.png", desc: "En posición de plancha, lleva las rodillas hacia el pecho de forma rápida y controlada." },
    "Giros con Polea": { img: "ejercicios/ABDOMEN/giros_con_polea.png", desc: "Tira de la polea girando el torso, manteniendo los brazos fijos y apretando el abdomen." },
    "Half Wipers Estiradas": { img: "ejercicios/ABDOMEN/Half_Wipers_con_piernas_estiradas.png", desc: "Piernas estiradas apuntando al techo, baja hacia un lado y luego al otro sin tocar el suelo." },
    "Half Wipers Flexionadas": { img: "ejercicios/ABDOMEN/Half_Wipers_con_piernas_flexionadas.png", desc: "Con rodillas dobladas, gira de un lado a otro controlando desde el abdomen." },
    "Laterales Oblicuos": { img: "ejercicios/ABDOMEN/laterales_oblicuos.png", desc: "Desliza la mano hacia el talón del mismo lado contrayendo los oblicuos." },
    "Marcha Horizontal Acostado": { img: "ejercicios/ABDOMEN/marcha_horizontal_acostado.png", desc: "Acuéstate y alterna el movimiento de las piernas como si caminaras." },
    "Marcha Piernas Alternadas": { img: "ejercicios/ABDOMEN/marcha_horizontal_piernas_alternadas.png", desc: "Movimiento de tijera horizontal con las piernas." },
    "Oblicuos Cruzados": { img: "ejercicios/ABDOMEN/oblicuos_cruzados.png", desc: "Elevación cruzando para enfocar el esfuerzo en la pared lateral abdominal." },
    "Oblicuos en Hiperextensión": { img: "ejercicios/ABDOMEN/oblicuos_en_hiperextension.png", desc: "En la silla romana, ponte de lado y eleva el torso contrayendo el oblicuo." },
    "Oblicuos Libre": { img: "ejercicios/ABDOMEN/oblicuos_libre.png", desc: "Trabajo libre enfocado a los laterales del abdomen." },
    "Plancha Lateral": { img: "ejercicios/ABDOMEN/plancha_lateral.png", desc: "Mantén el cuerpo recto y apoyado sobre un antebrazo." },
    "Puente Lateral con Peso": { img: "ejercicios/ABDOMEN/puente_lateral_con_peso.png", desc: "Plancha lateral con elevación o soporte de un peso extra en la mano libre." },
    "Puente Lateral": { img: "ejercicios/ABDOMEN/puente_lateral_sin_peso.png", desc: "Eleva la cadera lateralmente y mantén la posición." },
    "Rueda Abdominal": { img: "ejercicios/ABDOMEN/rueda_abdominal1.png", desc: "Desliza la rueda hacia adelante hasta estirarte por completo y regresa contrayendo fuerte." },
    "Rueda Abdominal Sencilla": { img: "ejercicios/ABDOMEN/rueda_abdominal2.png", desc: "Apoya las rodillas en el suelo y desliza la rueda hacia adelante hasta estirarte por completo." },

    // ANTEBRAZO
    "Curl Antebrazo Barra": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_BARRA.png", desc: "Con palmas arriba, flexiona las muñecas para subir la barra." },
    "Curl Antebrazo Atrás": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_BARRA_ATRAS.png", desc: "Barra por detrás del cuerpo, flexiona las muñecas hacia arriba." },
    "Curl Antebrazo Mancuerna Prono": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_MANCUERNA_PRONACION.png", desc: "Palmas abajo, levanta la mancuerna solo doblando la muñeca." },
    "Curl Antebrazo Prono Polea": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_PRONO_POLEA.png", desc: "Polea desde abajo. Palmas hacia abajo, tira hacia arriba con la muñeca." },
    "Curl Antebrazo Supinación": { img: "ejercicios/ANTEBRAZO/CURL_ANTEBRAZO_SUPINACION.png", desc: "Aislado para la flexión de muñeca con la palma hacia arriba." },
    "Curl Concentrado Antebrazo Barra": { img: "ejercicios/ANTEBRAZO/CURL_CONCENTRADO_ANTEBRAZO_BARRA.png", desc: "Brazo apoyado, movimiento aislado usando barra." },
    "Curl Concentrado Pronación Barra": { img: "ejercicios/ANTEBRAZO/CURL_CONCENTRADO_PRONACION_CON_BARRA.png", desc: "Palmas abajo apoyado sobre rodilla o banco, elevando solo la muñeca." },

    // BICEPS
    "Curl Bíceps Barra Abierto": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_AGARRE_ABIERTO.png", desc: "Sostén la barra con un agarre más ancho que los hombros y flexiona los brazos." },
    "Curl Bíceps Barra Cerrado": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_AGARRE_CERRADO.png", desc: "Agarre cerrado en la barra. Flexiona para enfocar el trabajo en la cabeza externa." },
    "Curl Bíceps Barra Romana": { img: "ejercicios/BICEPS/CURL_BICEPS_BARRA_ROMANA.png", desc: "Utiliza el agarre neutro de la barra romana." },
    "Curl Bíceps Bayesian": { img: "ejercicios/BICEPS/CURL_BICEPS_BAYESIAN.png", desc: "De espaldas a la polea baja, realiza el curl permitiendo máximo estiramiento." },
    "Curl Bíceps Unilateral": { img: "ejercicios/BICEPS/CURL_BICEPS_CON_MANCUERNA_UNILATERAL.png", desc: "Trabaja un brazo a la vez manteniendo el codo fijo pegado al cuerpo." },
    "Curl Concentrado Supino": { img: "ejercicios/BICEPS/CURL_BICEPS_CONCENTRADO_SUPINO.png", desc: "Sentado, apoya el codo en la cara interna del muslo y flexiona." },
    "Curl Mancuernas Alternado": { img: "ejercicios/BICEPS/CURL_BICEPS_MANCUERNAS_ALTERNADO.png", desc: "Alterna la flexión de cada brazo subiendo una mancuerna." },
    "Curl Mancuernas Inclinado": { img: "ejercicios/BICEPS/CURL_BICEPS_MANCUERNAS_INCLINADO.png", desc: "Recostado en un banco inclinado, deja colgar los brazos hacia atrás y flexiona." },
    "Curl Martillo Alternado": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_ALTERNADO.png", desc: "Sube las mancuernas alternadamente con agarre neutro." },
    "Curl Martillo Simultáneo": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_MANCUERNA.png", desc: "Flexiona ambos brazos al mismo tiempo manteniendo el agarre neutro." },
    "Curl Martillo Predicador": { img: "ejercicios/BICEPS/CURL_BICEPS_MARTILLOS_PREDICADOR.png", desc: "Apoyado en el banco Scott, realiza la flexión usando agarre neutro." },
    "Curl Polea Supino": { img: "ejercicios/BICEPS/CURL_BICEPS_POLEA_SUPINO.png", desc: "En polea baja, sujeta la barra recta o en V con las palmas hacia arriba." },
    "Curl Bíceps Polea": { img: "ejercicios/BICEPS/CURL_BICEPS_POLEA.png", desc: "Flexiona los brazos tirando del peso desde la polea baja." },
    "Curl Bíceps Soga Polea": { img: "ejercicios/BICEPS/CURL_BICEPS_SOGA_POLEA.png", desc: "Usa la soga en polea baja con agarre neutro." },
    "Curl Spider Inclinado": { img: "ejercicios/BICEPS/CURL_BICEPS_SPIDER.png", desc: "Pecho apoyado boca abajo en banco inclinado. Flexiona los brazos colgantes." },
    "Curl Predicador Unilateral": { img: "ejercicios/BICEPS/CURL_BICEPS_UNILATERAL_PREDICADOR.png", desc: "Aísla el trabajo de un solo bíceps apoyando firmemente en el banco Scott." },
    "Curl Spider Sentado Suelo": { img: "ejercicios/BICEPS/CURL_SPIDER_SENTADO_SUELO.png", desc: "Variante estricta desde el suelo apoyando brazos, estabiliza el torso." }, 
    
    // CUADRICEPS
    "Sentadilla Profunda con Barra": { img: "ejercicios/CUADRICEPS/SENTADILLA_PROFUNDA_CON_BARRA.PNG", desc: "Con la barra en la espalda, baja flexionando rodillas y cadera hasta romper el paralelo." },
    "Sentadilla Hacka": { img: "ejercicios/CUADRICEPS/SENTANDILLA_HACKA.PNG", desc: "Apoya completamente la espalda en la máquina, baja controladamente." },
    "Extensión de Cuádriceps": { img: "ejercicios/CUADRICEPS/EXTENSION_DE_CUADRICEPS.PNG", desc: "Sentado en la máquina, extiende las rodillas para elevar el peso." },
    
    // ESPALDA
    "Dominadas": { img: "ejercicios/ESPALDA/DOMINADAS.png", desc: "Levanta tu peso libremente pasando la barbilla sobre la barra." },
    "Dominadas Agarre Neutro": { img: "ejercicios/ESPALDA/DOMINADAS_AGARRE_NEUTRO.png", desc: "Las palmas de las manos se miran entre sí." },
    "Dominadas Supino": { img: "ejercicios/ESPALDA/DOMINADAS_SUPINO.png", desc: "Palmas hacia ti. Involucra fuertemente también a los bíceps." },
    "Hiperextensión Lumbar": { img: "ejercicios/ESPALDA/HIPEREXTENSION_LUMBAR.png", desc: "En banco romano, flexiona y extiende el tronco." },
    "Jalón Vertical Unilateral": { img: "ejercicios/ESPALDA/JALON_VERTICAL_UNILATERAL.png", desc: "Jalón en polea a una sola mano, estirando completamente el dorsal." },
    "Jalón Libre Polea": { img: "ejercicios/ESPALDA/JALON_LIBRE_POLEA.png", desc: "Lleva el agarre hacia ti sintiendo la contracción escapular." },
    "Jalón Vertical Abierto": { img: "ejercicios/ESPALDA/JALON_VERTICAL_ABIERTO.png", desc: "Agarre amplio. Jala la barra hacia la clavícula juntando las escápulas." },
    "Jalón Vertical Neutro": { img: "ejercicios/ESPALDA/JALON_VERTICAL_NEUTRO.png", desc: "Jalón con agarre cerrado o V. Énfasis en el grosor de la espalda." },
    "Jalón Vertical Supino": { img: "ejercicios/ESPALDA/JALON_VERTICAL_SUPINO.png", desc: "Agarre inverso (palmas hacia ti). Jala al pecho." },
    "Pull Over": { img: "ejercicios/ESPALDA/PULL_OVER.png", desc: "Acostado con mancuerna, baja los brazos estirados hacia atrás." },
    "Pull Over Sentado": { img: "ejercicios/ESPALDA/PULL_OVER_SENTADO.png", desc: "En máquina o polea, baja la barra con brazos rígidos hasta los muslos." },
    "Remo Barra Libre Supino": { img: "ejercicios/ESPALDA/REMO_BARRA_LIBRE_SUPINACION.png", desc: "Torso inclinado, agarre invertido. Jala la barra hacia el ombligo." },
    "Remo Colgado": { img: "ejercicios/ESPALDA/REMO_COLGADO.png", desc: "Cuelga del TRX o barra baja y tracciona tu propio peso." },
    "Remo de Pie Polea": { img: "ejercicios/ESPALDA/REMO_DEPIE_POLEA.png", desc: "De pie, jala hacia el abdomen manteniendo la espalda estable." },
    "Remo Horizontal Abierto": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_ABIERTO.png", desc: "Agarre ancho en máquina o polea. Tracciona llevando codos hacia atrás." },
    "Remo Horizontal Cerrado": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_CERRADO.png", desc: "Agarre cerrado en polea baja. Lleva el triángulo hacia el estómago." },
    "Remo Horizontal Hammer": { img: "ejercicios/ESPALDA/REMO_HORIZONTAL_HAMMER.png", desc: "En máquina articulada de discos, jala apretando la espalda." },
    "Remo Inferior Polea": { img: "ejercicios/ESPALDA/REMO_INFERIOR_POLEA.png", desc: "Desde polea muy baja tracciona hacia la cadera." },
    "Remo Mancuernas": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS.png", desc: "Jala ambas mancuernas al mismo tiempo llevando los codos arriba." },
    "Remo Mancuernas Inclinado": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS_INCLINADO.png", desc: "Pecho apoyado en banco inclinado. Remo estricto con mancuernas." },
    "Remo Mancuernas Libre": { img: "ejercicios/ESPALDA/REMO_MANCUERNAS_LIBRE.png", desc: "Posición inclinada de pie, rema sin apoyo de pecho." },
    "Remo Smith": { img: "ejercicios/ESPALDA/REMO_SMITH.png", desc: "Remo con barra apoyado en la guía de la máquina Smith." },
    "Remo Supinación": { img: "ejercicios/ESPALDA/REMO_SUPINACION.png", desc: "Agarre palmas hacia arriba. Fuerte trabajo para la parte baja del dorsal." },
    "Remo en T Supinación": { img: "ejercicios/ESPALDA/REMO_T_SUPINACION.png", desc: "Máquina o barra en T con agarre invertido." },
    "Remo Unilateral Mancuerna": { img: "ejercicios/ESPALDA/REMO_UNILATERAL_MANCUERNA.png", desc: "Rodilla y mano apoyada en banco. El otro brazo jala hacia la cadera." },
    "Remo T Pronación": { img: "ejercicios/ESPALDA/REMOT_PRONACION.png", desc: "Barra en T con agarre tradicional palmas hacia abajo." },

    // HOMBRO
    "Face Pull": { img: "ejercicios/HOMBRO/FACE_PULL.PNG", desc: "Tira de la polea hacia tu rostro separando las manos y llevando los codos hacia atrás." },
    "PeckDeck Hombro": { img: "ejercicios/HOMBRO/PECKDECK_APERTURAS_HOMBRO_POSTERIOR.PNG", desc: "Empuja los agarres hacia atrás con los brazos casi rectos." },
    "Trapecio": { img: "ejercicios/HOMBRO/trapecio.png", desc: "Encoge los hombros hacia arriba como si quisieras tocar tus orejas." },

    // ISQUIOS
    "Curl Femoral": { img: "ejercicios/ISQUIOS/curl_femoral.png", desc: "Flexiona las rodillas llevando el peso hacia tus glúteos." },
    "Peso Muerto": { img: "ejercicios/ISQUIOS/PESO_MUERTO.PNG", desc: "Con la espalda recta y el core apretado, baja el torso empujando la cadera hacia atrás." },

    // PECHO
    "Press Plano con Mancuernas": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_CON_MANCUERNA.PNG", desc: "Acostado en banco plano, empuja las mancuernas hacia arriba." },
    "Press Inclinado con Barra": { img: "ejercicios/PECHO/PRESS_INCLINADO_CON_BARRA.PNG", desc: "En banco inclinado, baja la barra hasta la parte alta del pecho y empuja." },
    "Press Banco Plano": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO.PNG", desc: "Acostado en banco plano, baja la barra de forma controlada hasta rozar el pecho." },
    "Press Plano Hammer": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_HAMMER.PNG", desc: "Sentado en la máquina articulada (Hammer), empuja el peso hacia el frente." },
    "Press Inclinado Hammer": { img: "ejercicios/PECHO/PRESS_INCLINADO_HAMMER.PNG", desc: "Utiliza la máquina articulada con inclinación." },
    "Press Plano Abierto": { img: "ejercicios/PECHO/PRESS_BANCO_PLANO_ABIERTO.PNG", desc: "Realiza el press con un agarre más ancho que la línea de los hombros." },
    "Fondos en Paralelas": { img: "ejercicios/PECHO/FONDOS_EN_PARALELAS.PNG", desc: "Inclina el torso ligeramente hacia adelante y baja flexionando los codos." },
    "Flexiones Básicas": { img: "ejercicios/PECHO/FLEXIONES_DE_PECHO_BASICAS.PNG", desc: "Manos a la anchura de los hombros, baja el pecho hasta casi tocar el piso." },
    "Flexiones de Pecho": { img: "ejercicios/PECHO/FLEXIONES_DE_PECHO.PNG", desc: "Flexiones tradicionales manteniendo el core apretado." },
    "Aperturas Polea Inferior": { img: "ejercicios/PECHO/APERTURAS_EN_POLEA_INFERIOR.PNG", desc: "De pie, tira de los agarres desde las poleas bajas hacia arriba y al centro." },
    "Peck Deck": { img: "ejercicios/PECHO/PECKDECK_APERTURAS_HOMBRO_POSTERIOR.PNG", desc: "Junta los brazos frente a ti apretando los pectorales en la contracción máxima." },

    // OTROS 
    "Abducción en maquina": { img: "ejercicios/GLUTEO/ABDUCCION_EN_MAQUINA_SENTADO.PNG", desc: "Sentado en la máquina, junta las piernas empujando los cojines hacia el centro." },
    "Aductores en maquina": { img: "ejercicios/ADUCTORES/ADUCTOR_SENTADO_MAQUINA.PNG", desc: "Sentado en la máquina, empuja los cojines hacia afuera abriendo las piernas." },
    "Gemelos": { img: "ejercicios/GEMELOS/gemelos.png", desc: "Eleva los talones apoyándote en la punta de los pies." }
};

let progressChartInstance = null;
let exerciseChartInstance = null;

// ==========================================
// INICIALIZACIÓN Y CARGA DESDE LA NUBE
// ==========================================
window.onload = async () => {
  const loader = document.getElementById('loading-screen');
  if(loader) {
      loader.classList.remove('hide-loader');
      const title = loader.querySelector('h1');
      if(title) title.innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>';
  }
  
  await loadDataFromFirebase();
  performSystemMaintenance(); 
  migrateOldRoutines(); 
  
  if(loader) {
      setTimeout(() => {
         loader.classList.add('hide-loader');
      }, 500);
  }
  
  if (state.currentUser && state.currentUser.role === 'client') {
      const dbClient = state.clients.find(c => c.cc === state.currentUser.cc);
      if(dbClient) {
          state.currentUser.record = dbClient;
          localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
      }
  }

  renderNavbar();
  renderMainContent();
};

function migrateOldRoutines() {
    let updated = false;
    state.clients.forEach(client => {
        if(!client.plan) { client.plan = gymPlans[0]; updated = true; } 
        if(!client.plan.durationDays) { client.plan.durationDays = 30; updated = true; }
        if(!client.exerciseHistory) { client.exerciseHistory = {}; updated = true; }
        if(client.workout) {
            client.workout.forEach(day => {
                day.exercises.forEach(ex => {
                    const dict = exerciseDetails[ex.name];
                    if(dict) {
                        if(ex.img && (!ex.img.includes('ejercicios/') || ex.img.includes('http') || ex.img.includes('.gif'))) { ex.img = dict.img; updated = true; }
                        if(!ex.desc) { ex.desc = dict.desc; updated = true; }
                    }
                    if(!ex.rest) { ex.rest = "4-5 Minutos"; updated = true; }
                    if(!ex.desc && !dict) { ex.desc = "Sigue las indicaciones de tu entrenador para una correcta ejecución biomecánica."; updated = true; }
                });
            });
        }
        if(updated) syncClientToDB(client);
    });
}

function performSystemMaintenance() {
  let updated = false, historyUpdated = false;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  state.clients = state.clients.filter(client => {
    const dueDate = new Date(client.dueDate); dueDate.setHours(0, 0, 0, 0);
    const diffTime = today - dueDate; const daysExpired = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysExpired > 61) { 
        state.historyDB[client.cc] = client.evaluations; historyUpdated = true; updated = true; 
        deleteClientFromDB(client.cc);
        return false; 
    }
    if (daysExpired > 8 && client.status !== 'inactive') { 
        client.status = 'inactive'; updated = true; 
        syncClientToDB(client);
    }
    return true; 
  });

  if (historyUpdated) syncHistoryToDB();
  if (updated && state.currentUser && state.currentUser.role === 'client') {
      const stillActive = state.clients.find(c => c.cc === state.currentUser.cc && c.status !== 'inactive');
      if (!stillActive) { state.currentUser = null; localStorage.removeItem('gym_session'); }
  }
}

// ==========================================
// NAVEGACIÓN Y RENDERIZADO PRINCIPAL
// ==========================================
function renderNavbar() {
  const container = document.getElementById('nav-actions');
  if (!state.currentUser) {
    container.innerHTML = `<button onclick="showMainLoginFlow()" class="btn-depth bg-transparent border border-cyan-500/80 text-cyan-400 hover:bg-cyan-500 hover:text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)]"><i class="fa-solid fa-user-astronaut"></i> Entrar</button>`;
  } else {
    container.innerHTML = `
      <span class="text-xs md:text-sm text-zinc-300 flex items-center gap-2 inner-depth px-4 py-2 rounded-xl border border-cyan-500/20"><i class="fa-solid ${state.currentUser.role === 'admin' ? 'fa-user-shield text-yellow-400' : 'fa-user text-cyan-400'}"></i><strong class="text-white">${state.currentUser.name}</strong></span>
      <button onclick="logout()" class="btn-depth bg-red-900/60 border border-red-500/50 text-red-100 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-red-600 transition shadow-[0_0_10px_rgba(239,68,68,0.3)]"><i class="fa-solid fa-right-from-bracket"></i></button>
    `;
  }
}

function renderMainContent() {
  const main = document.getElementById('app-content');
  let content = '';
  if (!state.currentUser) { content = renderLandingPage(); } 
  else if (state.currentUser.role === 'admin') {
    if (state.viewingClientAsAdmin) { content = renderClientPortal(); setTimeout(initProgressChart, 100); } 
    else { content = renderAdminDashboard(); }
  } else { content = renderClientPortal(); setTimeout(initProgressChart, 100); }
  
  let footer = '';
  if(!state.currentUser) {
      footer = `
        <footer class="mt-16 py-8 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-400 text-sm bg-[#030303] px-8 rounded-[2rem] shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-zinc-800">
            <div class="flex items-center gap-4 hover:scale-105 transition-transform">
                <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white text-2xl shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                    <i class="fa-brands fa-instagram"></i>
                </div>
                <a href="https://www.instagram.com/gym____finity?srtk=Z3E0Yndqc2NmdHhj" target="_blank" class="font-black text-white hover:text-pink-400 transition tracking-widest uppercase text-base drop-shadow-md">@gym__finity</a>
            </div>
            <div class="text-center md:text-right flex flex-col gap-1">
                <p class="font-bold text-white drop-shadow-md text-base"><i class="fa-solid fa-location-dot text-red-500 mr-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></i> Cra 14#104-05 sur Usminia</p>
                <a href="https://maps.app.goo.gl/uxurEsSw4Vm6HCAj7?g_st=ac" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 underline font-black inline-block mt-1 transition drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]">
                    Mostrar en Google Maps <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
                </a>
            </div>
        </footer>
      `;
  }
  
  main.innerHTML = content + footer;
}

// ==========================================
// CONTROLADOR DEL SLIDER DE PRODUCTOS
// ==========================================
window.changeProduct = function(offset) {
    state.currentProductIndex += offset;
    if (state.currentProductIndex < 0) state.currentProductIndex = storeProducts.length - 1;
    if (state.currentProductIndex >= storeProducts.length) state.currentProductIndex = 0;
    renderMainContent();
};

// ==========================================
// NUEVO: GENERADOR IA AVANZADO
// ==========================================
window.showRoutineGeneratorModal = function() {
    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-wand-magic-sparkles"></i> Generar Nueva Rutina</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="handleGenerateRoutine(event)" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">¿Cuál es el Objetivo?</label>
                <select id="rg_obj" class="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 text-sm text-white font-medium focus:border-yellow-400 outline-none transition">
                    <option value="Hipertrofia">Hipertrofia (Ganar Masa Muscular)</option>
                    <option value="Bajar Grasa">Déficit Calórico (Bajar Grasa)</option>
                    <option value="Fuerza">Ganar Fuerza</option>
                    <option value="Tren Inferior">Aumentar Masa en Tren Inferior (Glúteos/Pierna)</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Días a la semana</label>
                    <select id="rg_day" class="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 text-sm text-white font-medium focus:border-yellow-400 outline-none transition">
                        <option value="3">3 Días</option>
                        <option value="4" selected>4 Días</option>
                        <option value="5">5 Días</option>
                        <option value="6">6 Días</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nivel</label>
                    <select id="rg_lvl" class="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3.5 text-sm text-white font-medium focus:border-yellow-400 outline-none transition">
                        <option value="Principiante">Principiante</option>
                        <option value="Intermedio" selected>Intermedio</option>
                        <option value="Avanzado">Avanzado</option>
                    </select>
                </div>
            </div>
            <div class="bg-red-900/20 border border-red-500/30 p-3 rounded-xl mt-4">
                <p class="text-xs text-red-400 font-bold text-center"><i class="fa-solid fa-triangle-exclamation"></i> Atención: Esto reemplazará la rutina actual del usuario.</p>
            </div>
            <button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-2 shadow-[0_0_15px_rgba(255,215,0,0.4)]">Crear Rutina</button>
        </form>
    `);
}

window.handleGenerateRoutine = function(e) {
    e.preventDefault();
    const obj = document.getElementById('rg_obj').value;
    const days = parseInt(document.getElementById('rg_day').value);
    const lvl = document.getElementById('rg_lvl').value;
    
    const loader = document.getElementById('loading-screen');
    if(loader) {
        loader.classList.remove('hide-loader'); loader.style.opacity = '1'; loader.style.visibility = 'visible'; loader.style.zIndex = '100000';
        loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] animate-pulse">CREANDO NUEVA RUTINA...</span>';
    }

    setTimeout(() => {
        const newWorkout = generateAiWorkoutCustom(obj, days, lvl);
        state.selectedClientRecord.workout = newWorkout;
        state.selectedClientRecord.days = days;
        state.selectedClientRecord.level = lvl;
        syncClientToDB(state.selectedClientRecord);
        
        if(loader) { 
            loader.classList.add('hide-loader'); 
            setTimeout(() => { loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>'; loader.style = ''; }, 600); 
        }
        closeModal(); 
        renderMainContent();
    }, 800);
}

function generateAiWorkoutCustom(objective, days, level) {
    const getEx = (name) => {
        const e = exerciseDetails[name] || { img: "ejercicios/default.png", desc: "Sigue las indicaciones de tu entrenador." };
        return { name, img: e.img, desc: e.desc };
    };
    
    let sets = "4 Series", reps = "10-12 Reps", rest = "90 Segundos";
    
    if (objective === "Fuerza") { sets = "5 Series"; reps = "5-8 Reps"; rest = "3 Minutos"; }
    if (objective === "Bajar Grasa") { reps = "15-20 Reps"; rest = "45 Segundos"; }
    if (level === "Principiante") { sets = "3 Series"; }

    const workout = [];
    if (objective === "Tren Inferior") {
        workout.push({ day: "Día 1: Cuádriceps y Glúteo", exercises: [{...getEx("Sentadilla Profunda con Barra"), sets, reps, rest}, {...getEx("Extensión de Cuádriceps"), sets, reps, rest}, {...getEx("Abductores"), sets, reps, rest}] });
        workout.push({ day: "Día 2: Tren Superior", exercises: [{...getEx("Press Banco Plano"), sets, reps, rest}, {...getEx("Jalón Vertical Abierto"), sets, reps, rest}, {...getEx("Crunch en Banco"), sets, reps, rest}] });
        workout.push({ day: "Día 3: Isquios y Glúteo", exercises: [{...getEx("Peso Muerto"), sets, reps, rest}, {...getEx("Curl Femoral"), sets, reps, rest}, {...getEx("Elevación de Pelvis"), sets, reps, rest}] });
        if(days > 3) workout.push({ day: "Día 4: Hombro y Abdomen", exercises: [{...getEx("Press Hombro"), sets, reps, rest}, {...getEx("Rueda Abdominal"), sets, reps, rest}] });
        if(days > 4) workout.push({ day: "Día 5: Pierna Completa", exercises: [{...getEx("Sentadilla Hacka"), sets, reps, rest}, {...getEx("Curl Femoral"), sets, reps, rest}] });
        if(days > 5) workout.push({ day: "Día 6: Brazos", exercises: [{...getEx("Curl Bíceps Barra Abierto"), sets, reps, rest}, {...getEx("Fondos en Paralelas"), sets, reps, rest}] });
    } else {
        workout.push({ day: "Día 1: Pecho y Tríceps", exercises: [{...getEx("Press Banco Plano"), sets, reps, rest}, {...getEx("Press Inclinado con Barra"), sets, reps, rest}, {...getEx("Fondos en Paralelas"), sets, reps, rest}] });
        workout.push({ day: "Día 2: Espalda y Bíceps", exercises: [{...getEx("Dominadas"), sets, reps, rest}, {...getEx("Remo Horizontal Abierto"), sets, reps, rest}, {...getEx("Curl Bíceps Barra Abierto"), sets, reps, rest}] });
        workout.push({ day: "Día 3: Piernas", exercises: [{...getEx("Sentadilla Profunda con Barra"), sets, reps, rest}, {...getEx("Peso Muerto"), sets, reps, rest}, {...getEx("Extensión de Cuádriceps"), sets, reps, rest}] });
        if(days > 3) workout.push({ day: "Día 4: Hombro y Core", exercises: [{...getEx("Press Hombro"), sets, reps, rest}, {...getEx("Face Pull"), sets, reps, rest}] });
        if(days > 4) workout.push({ day: "Día 5: Pecho y Espalda", exercises: [{...getEx("Peck Deck"), sets, reps, rest}, {...getEx("Jalón Vertical Abierto"), sets, reps, rest}] });
        if(days > 5) workout.push({ day: "Día 6: Pierna Isquios", exercises: [{...getEx("Peso Muerto"), sets, reps, rest}, {...getEx("Curl Femoral"), sets, reps, rest}] });
    }
    return workout.slice(0, days);
}

// Función por defecto para crear usuarios nuevos
function generateAiWorkout(objective, days, level, machines) {
    return generateAiWorkoutCustom(objective, days, level);
}

// ==========================================
// EXPORTACIÓN A PDF (TARJETA COMPACTA Y TEXTO ACTUALIZADO)
// ==========================================
window.downloadPDF = function() {
    const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    if (!clientData || !clientData.workout) return alert("No hay rutina para descargar.");

    const loader = document.getElementById('loading-screen');
    if(loader) {
        loader.classList.remove('hide-loader'); loader.style.opacity = '1'; loader.style.visibility = 'visible'; loader.style.zIndex = '100000';
        // 1. TEXTO ACTUALIZADO A "GENERANDO PDF..."
        loader.querySelector('h1').innerHTML = '<span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse">GENERANDO PDF...</span>';
    }

    const pdfWrapper = document.createElement('div');
    pdfWrapper.id = 'pdf-print-wrapper';
    Object.assign(pdfWrapper.style, {
        width: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: 'Arial, sans-serif'
    });
    
    const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    let html = '';

    clientData.workout.forEach((day, dIdx) => {
        const isFirst = dIdx === 0;

        html += `
            <div style="width: 100%; padding: 40px; box-sizing: border-box; position: relative; background: #ffffff;">
                
                <div style="position: absolute; top: 500px; left: 50%; transform: translate(-50%, -50%); width: 500px; height: 500px; opacity: 0.12; pointer-events: none; z-index: 1; display: flex; align-items: center; justify-content: center;">
                    <img src="LOG.PNG" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='LOGO.PNG';" />
                </div>
        `;

        if (isFirst) {
            html += `
                <img src="LOGO.PNG" style="position: absolute; top: 35px; left: 40px; width: 75px; height: 75px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;" onerror="this.onerror=null; this.src='LOGO.jpg';" />
                <img src="LOGO.PNG" style="position: absolute; top: 35px; right: 40px; width: 75px; height: 75px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;" onerror="this.onerror=null; this.src='LOGO.jpg';" />
                
                <div style="text-align: center; padding-bottom: 5px; margin-bottom: 20px; position: relative; z-index: 10;">
                    <h1 style="font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 1px;">
                        <span style="color: #eab308; -webkit-text-stroke: 1.5px #0f172a; text-shadow: 3px 3px 0px rgba(0,0,0,0.1);">GYM</span><span style="color: #06b6d4; -webkit-text-stroke: 1.5px #0f172a; text-shadow: 3px 3px 0px rgba(0,0,0,0.1);">FINITY</span>
                    </h1>
                    <p style="font-size: 14px; color: #334155; margin-top: 4px; font-weight: 900; text-transform: uppercase; letter-spacing: 5px;">Plan de Entrenamiento Oficial</p>
                    <div style="display: flex; justify-content: center; gap: 6px; margin-top: 15px;">
                        <div style="width: 40px; height: 5px; background: #06b6d4; border-radius: 2px;"></div>
                        <div style="width: 40px; height: 5px; background: #eab308; border-radius: 2px;"></div>
                        <div style="width: 40px; height: 5px; background: #0f172a; border-radius: 2px;"></div>
                        <div style="width: 40px; height: 5px; background: #06b6d4; border-radius: 2px;"></div>
                        <div style="width: 40px; height: 5px; background: #eab308; border-radius: 2px;"></div>
                    </div>
                </div>

                <!-- 2. TARJETA ATLETA (MÁS PEQUEÑA Y COMPACTA PARA AHORRAR ESPACIO VERTICAL) -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 10px 18px; border-radius: 12px; border: 2px solid #cbd5e1; margin-bottom: 25px; position: relative; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
                    <div style="background: #0f172a; padding: 8px 16px; border-radius: 8px; border-left: 4px solid #06b6d4;">
                        <p style="margin: 0; font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 900;">Atleta</p>
                        <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 900; color: #ffffff; text-transform: uppercase;">${clientData.name}</p>
                    </div>
                    <div style="background: #0f172a; padding: 8px 16px; border-radius: 8px; border-right: 4px solid #eab308; text-align: right;">
                        <p style="margin: 0; font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 900;">Plan Asignado</p>
                        <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 900; color: #ffffff; text-transform: uppercase;">${clientData.plan ? clientData.plan.id : 'Rutina Base'}</p>
                    </div>
                </div>
            `;
        } else {
            html += `
                <img src="LOGO.PNG" style="position: absolute; top: 35px; left: 40px; width: 75px; height: 75px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;" onerror="this.onerror=null; this.src='LOGO.jpg';" />
                <img src="LOGO.PNG" style="position: absolute; top: 35px; right: 40px; width: 75px; height: 75px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 10;" onerror="this.onerror=null; this.src='LOGO.jpg';" />
                
                <div style="height: 80px;"></div> 
            `;
        }

        html += `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px; background: #0f172a; border-radius: 12px; padding: 14px 20px; border-left: 6px solid #eab308; border-right: 6px solid #06b6d4; position: relative; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                <div style="background: #eab308; padding: 5px 10px; border-radius: 8px; color: #000; font-weight: 900; font-size: 15px;">📅</div>
                <h2 style="font-size: 20px; font-weight: 900; color: #ffffff; margin: 0; text-transform: uppercase; letter-spacing: 1px;">${day.day}</h2>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 25px; position: relative; z-index: 10;">
        `;

        day.exercises.forEach((ex, idx) => {
            const themeColor = idx % 2 === 0 ? '#06b6d4' : '#eab308'; 
            const explanation = ex.description || ex.notes || 'Mantén la postura firme, controla la respiración y enfócate en la técnica del movimiento.';

            html += `
                <div style="display: flex; align-items: stretch; border: 2px solid ${themeColor}; border-radius: 16px; padding: 15px; background: #ffffff; gap: 20px; page-break-inside: avoid; box-shadow: 0 6px 15px rgba(0,0,0,0.06); position: relative; overflow: hidden;">
                    
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: ${themeColor};"></div>

                    <div style="width: 110px; height: 110px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 5px; margin-left: 8px; align-self: center;">
                        <img src="${ex.img}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='${fallbackBase64}';" />
                    </div>
                    
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${idx + 1}. ${ex.name}</p>
                        
                        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                            <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 8px 12px; border-radius: 8px; color: #ffffff; text-align: center; min-width: 75px; box-shadow: 0 2px 6px rgba(6,182,212,0.3);">
                                <span style="display: block; font-size: 9px; text-transform: uppercase; font-weight: 900; opacity: 0.9; margin-bottom: 2px;">Series</span>
                                <span style="font-size: 15px; font-weight: 900;">${ex.sets}</span>
                            </div>
                            <div style="background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); padding: 8px 12px; border-radius: 8px; color: #000000; text-align: center; min-width: 75px; box-shadow: 0 2px 6px rgba(234,179,8,0.3);">
                                <span style="display: block; font-size: 9px; text-transform: uppercase; font-weight: 900; opacity: 0.8; margin-bottom: 2px;">Reps</span>
                                <span style="font-size: 15px; font-weight: 900;">${ex.reps}</span>
                            </div>
                            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 8px 12px; border-radius: 8px; color: #ffffff; text-align: center; min-width: 90px; box-shadow: 0 2px 6px rgba(15,23,42,0.3);">
                                <span style="display: block; font-size: 9px; text-transform: uppercase; font-weight: 900; color: #38bdf8; margin-bottom: 2px;">⏱️ Descanso</span>
                                <span style="font-size: 14px; font-weight: 900;">${ex.rest || '2 Min'}</span>
                            </div>
                        </div>

                        <div style="background: #f8fafc; border-left: 3px solid ${themeColor}; padding: 8px 12px; border-radius: 0 6px 6px 0;">
                            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.4; font-weight: 600;">
                                <strong style="color: #0f172a; font-size: 11px; text-transform: uppercase;">Técnica:</strong> ${explanation}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`; 

        if (dIdx < clientData.workout.length - 1) {
            html += `<div class="html2pdf__page-break"></div>`;
        }
    });

    html += `
        <div style="padding: 0 40px 30px 40px; page-break-inside: avoid; background: #ffffff;">
            <div style="text-align: center; border-top: 2px dashed #cbd5e1; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">Gym Finity Pro • Cra 14#104-05 sur Usminia</p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #06b6d4; font-weight: 900; letter-spacing: 1px;">Instagram: @gym__finity</p>
            </div>
        </div>
    `;

    pdfWrapper.innerHTML = html;

    const appNav = document.querySelector('nav');
    const appContent = document.getElementById('app-content');
    const appFooter = document.querySelector('footer');
    const waBtn = document.getElementById('whatsapp-btn') || document.querySelector('.btn-whatsapp');
    const toastCont = document.getElementById('toast-container');

    if(appNav) appNav.style.display = 'none';
    if(appContent) appContent.style.display = 'none';
    if(appFooter) appFooter.style.display = 'none';
    if(waBtn) waBtn.style.display = 'none';
    if(toastCont) toastCont.style.display = 'none';

    document.body.style.backgroundColor = '#ffffff'; 
    document.body.appendChild(pdfWrapper);

    const images = pdfWrapper.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => new Promise(resolve => {
        if (img.complete) return resolve();
        img.onload = resolve;
        img.onerror = resolve; 
    }));

    Promise.all(imagePromises).then(() => {
        window.scrollTo(0, 0); 

        html2pdf().set({
            margin: 0,
            filename: `Rutina_${clientData.name.replace(/\s+/g, '_').toUpperCase()}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        }).from(pdfWrapper).save().then(() => {
            
            document.body.removeChild(pdfWrapper);
            document.body.style.backgroundColor = '#020202'; 
            
            if(appNav) appNav.style.display = '';
            if(appContent) appContent.style.display = '';
            if(appFooter) appFooter.style.display = '';
            if(waBtn) waBtn.style.display = '';
            if(toastCont) toastCont.style.display = '';

            if(loader) { 
                loader.classList.add('hide-loader'); 
                setTimeout(() => { 
                    loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>'; 
                    loader.style = ''; 
                }, 600); 
            }
        });
    });
};
// ==========================================
// MODAL DETALLADO DE EJERCICIO (SERIES, REPS, GRÁFICA Y COLOR DE PLAN)
// ==========================================
window.openExerciseModal = function(dayIndex, exerciseIndex) {
    const isAdminViewing = state.viewingClientAsAdmin; 
    const clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    if (!clientData || !clientData.workout || !clientData.workout[dayIndex]) {
        console.error("No se encontró el registro del cliente o del entrenamiento.");
        return;
    }

    const day = clientData.workout[dayIndex];
    const ex = day.exercises[exerciseIndex];
    
    // Inicializar historial si no existe
    clientData.exerciseHistory = clientData.exerciseHistory || {};
    if (!clientData.exerciseHistory[ex.name]) clientData.exerciseHistory[ex.name] = [];
    
    const hasNext = (exerciseIndex + 1) < day.exercises.length;
    const suggestedSets = parseInt(ex.sets) || 4;
    const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    
    // Obtener el color REAL del plan del usuario
    const userPlan = clientData.plan || (typeof gymPlans !== 'undefined' ? gymPlans[0] : {color: '#ffffff'});
    const effColor = userPlan.color || '#ffffff';
    const safeExName = ex.name.replace(/'/g, "\\'");

    let html = `
        <div class="relative bg-[#050505] border shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-[2rem] p-6 md:p-10 max-w-lg mx-auto w-full animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar" style="border-color: ${effColor};">
            
            <!-- BOTÓN CERRAR MINIMALISTA -->
            <button onclick="closeModal()" class="absolute top-5 right-5 w-9 h-9 bg-[#0a0a0a]/80 backdrop-blur-sm border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all z-50 shadow-md">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>

            <div class="flex flex-col items-center gap-5 mt-2">
                
                <!-- IMAGEN DEL EJERCICIO -->
                <div class="w-full bg-white rounded-2xl p-4 flex justify-center items-center border-2 shadow-[0_0_20px_rgba(255,255,255,0.05)]" style="border-color: ${effColor};">
                    <img src="${ex.img}" class="w-full max-h-56 object-contain mix-blend-multiply" onerror="this.onerror=null; this.src='${fallbackBase64}';" />
                </div>
                
                <div class="text-center w-full">
                    <h3 class="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-md mb-1" style="color: ${effColor};">${ex.name}</h3>
                    <p class="text-xs text-zinc-400 font-bold mb-4" id="sets-counter">0/${suggestedSets} series terminadas</p>
                    
                    <!-- CUADROS DE INFO -->
                    <div class="grid grid-cols-2 gap-3 w-full mb-2">
                        <div class="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-layer-group text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Series</span>
                            <span class="text-lg font-black text-white">${ex.sets}</span>
                        </div>
                        <div class="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-repeat text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Reps</span>
                            <span class="text-lg font-black text-white">${ex.reps}</span>
                        </div>
                        <div class="col-span-2 bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 shadow-md">
                            <i class="fa-solid fa-stopwatch text-xl mb-1" style="color: ${effColor}; filter: drop-shadow(0 0 5px ${effColor}80);"></i>
                            <span class="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Descanso</span>
                            <span class="text-lg font-black text-white">${ex.rest || '4-5 Min'}</span>
                        </div>
                    </div>
                    
                    <!-- TÉCNICA -->
                    <div class="mt-3 text-left bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2"><i class="fa-solid fa-circle-info" style="color: ${effColor};"></i> Técnica</h4>
                        <p class="text-xs text-zinc-300 leading-relaxed font-medium">${ex.desc || 'Sigue las indicaciones de tu entrenador.'}</p>
                    </div>

                    <!-- REGISTRO DE CARGAS -->
                    <div class="mt-4 border-t border-zinc-800/80 pt-5 w-full text-left">
                        <h4 class="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-dumbbell" style="color: ${effColor};"></i> Registro de Cargas
                        </h4>

                        ${!isAdminViewing ? `
                        <div class="grid grid-cols-[auto_1fr_1fr] gap-3 mb-2 px-2 text-[10px] font-black text-zinc-500 uppercase tracking-wider text-center">
                            <div class="w-6 md:w-8">Set</div><div>Peso</div><div>Reps</div>
                        </div>

                        <div id="sets-container" class="flex flex-col gap-2 mb-4 custom-scrollbar max-h-[30vh] overflow-y-auto pr-1"></div>

                        ` : `
                        <div class="bg-red-900/10 border border-red-500/30 rounded-xl p-4 text-center mb-6 shadow-inner">
                            <span class="text-xs font-bold text-red-400 uppercase tracking-widest"><i class="fa-solid fa-triangle-exclamation"></i> Solo el usuario puede registrar series y peso.</span>
                        </div>
                        `}

                        <!-- BOTÓN GRÁFICA -->
                        <button onclick="toggleExerciseChart('${safeExName}')" type="button" class="w-full bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white py-3 mb-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 hover:bg-zinc-900 shadow-sm">
                            <i class="fa-solid fa-chart-line" style="color: ${effColor};"></i> Ver Gráfica de Progreso <i id="ex-chart-toggle-icon" class="fa-solid fa-chevron-down ml-1 transition-transform"></i>
                        </button>
                        
                        <!-- CONTENEDOR GRÁFICA -->
                        <div id="ex-chart-wrapper" class="hidden bg-black/50 rounded-xl p-4 mb-6 border border-zinc-800 shadow-inner animate-fade-in">
                            <p class="text-[10px] text-zinc-500 font-bold uppercase mb-3 tracking-widest text-center">Evolución (Carga Máx)</p>
                            <div class="h-32 w-full relative"><canvas id="exerciseChart"></canvas></div>
                        </div>

                        <!-- BOTONES ACCIÓN -->
                        <div class="flex flex-col gap-3">
                            ${!isAdminViewing ? `
                            <button id="save-workout-btn" type="button" class="w-full py-3.5 rounded-xl bg-[#0a0a0a] text-zinc-300 font-black uppercase tracking-wider border border-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2 shadow-md">
                                <i class="fa-solid fa-save"></i> Guardar Serie
                            </button>
                            ` : ''}
                            
                            ${hasNext ? `
                            <button id="save-next-btn" type="button" class="w-full py-3.5 rounded-xl text-black font-black uppercase tracking-wider transition-transform hover:scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2" style="background-color: ${effColor};">
                                Siguiente Ejercicio <i class="fa-solid fa-arrow-right"></i>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    openModal(html);

    // Lógica interna para clientes
    if (!isAdminViewing) {
        const setsContainer = document.getElementById('sets-container');
        let setsData = [];
        const history = clientData.exerciseHistory[ex.name] || [];
        const lastWorkout = history.length > 0 ? history[history.length - 1].sets : null;

        for(let i = 0; i < suggestedSets; i++) {
            setsData.push({
                weight: lastWorkout && lastWorkout[i] ? lastWorkout[i].weight : '',
                reps: lastWorkout && lastWorkout[i] ? lastWorkout[i].reps : (ex.reps.match(/\d+/)?.[0] || '10')
            });
        }

        function renderSetsUI() {
            setsContainer.innerHTML = '';
            setsData.forEach((set, i) => {
                const row = document.createElement('div');
                row.className = 'flex items-center gap-2 md:gap-3 bg-[#0a0a0a] p-2 rounded-xl border border-zinc-800 transition-colors duration-300';
                row.innerHTML = `
                    <div class="w-6 md:w-8 flex justify-center">
                        <div class="set-indicator w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-zinc-600 flex items-center justify-center text-[10px] md:text-xs font-bold text-zinc-400 transition-all">${i + 1}</div>
                    </div>
                    <div class="flex-1 flex items-center bg-black/60 rounded-lg p-1.5 border border-zinc-800/80 focus-within:border-white transition-colors">
                        <input type="number" step="0.5" class="set-weight w-full bg-transparent text-white text-center font-bold text-sm md:text-base outline-none appearance-none" placeholder="-" value="${set.weight}">
                        <span class="text-[9px] md:text-[10px] text-zinc-500 font-black pr-1 uppercase">KG</span>
                    </div>
                    <div class="flex-1 flex items-center bg-black/60 rounded-lg p-1.5 border border-zinc-800/80 focus-within:border-white transition-colors">
                        <input type="number" class="set-reps w-full bg-transparent text-white text-center font-bold text-sm md:text-base outline-none appearance-none" placeholder="-" value="${set.reps}">
                        <span class="text-[9px] md:text-[10px] text-zinc-500 font-black pr-1 uppercase">REPS</span>
                    </div>
                `;

                const indicator = row.querySelector('.set-indicator');
                const wInput = row.querySelector('.set-weight');
                const rInput = row.querySelector('.set-reps');

                const checkDone = () => {
                    if(wInput.value !== '' && rInput.value !== '') {
                        indicator.innerHTML = '<i class="fa-solid fa-check"></i>';
                        indicator.style.backgroundColor = effColor;
                        indicator.style.borderColor = effColor;
                        indicator.style.color = (effColor === '#E5E7EB' || effColor === '#FFD700' || effColor === '#D4D4D8' || effColor === '#ffffff') ? '#000' : '#fff';
                        indicator.style.boxShadow = `0 0 8px ${effColor}80`;
                        row.style.borderColor = effColor + '50';
                        row.classList.add('is-completed');
                    } else {
                        indicator.innerHTML = i + 1;
                        indicator.style = '';
                        row.style.borderColor = '';
                        row.classList.remove('is-completed');
                    }
                    const doneCount = setsContainer.querySelectorAll('.is-completed').length;
                    const counterEl = document.getElementById('sets-counter');
                    if(counterEl) counterEl.innerText = `${doneCount}/${setsData.length} series terminadas`;
                };

                wInput.addEventListener('input', checkDone);
                rInput.addEventListener('input', checkDone);
                checkDone();
                setsContainer.appendChild(row);
            });
        }

        renderSetsUI();

        const addSetBtn = document.getElementById('add-set-btn');
        if(addSetBtn) {
            addSetBtn.onclick = () => {
                setsData.push({weight: '', reps: ''});
                renderSetsUI();
                setsContainer.scrollTop = setsContainer.scrollHeight;
            };
        }

        function guardarEntrenamientoYContinuar(goNext) {
            const rows = setsContainer.children;
            const currentSets = [];
            let maxW = 0;
            
            for(let i = 0; i < rows.length; i++) {
                const wVal = rows[i].querySelector('.set-weight').value;
                const rVal = rows[i].querySelector('.set-reps').value;
                const w = parseFloat(wVal);
                const r = parseInt(rVal);
                
                if(!isNaN(w) && !isNaN(r)) {
                    currentSets.push({weight: w, reps: r});
                    if(w > maxW) maxW = w; 
                }
            }

            if(currentSets.length > 0) {
                const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                clientData.exerciseHistory[ex.name] = history.filter(h => h.date !== today);
                clientData.exerciseHistory[ex.name].push({
                    date: today,
                    weight: maxW, 
                    sets: currentSets 
                });
                
                if(typeof syncClientToDB === 'function') {
                    syncClientToDB(clientData); 
                }
            } else if(!goNext) {
                alert("Por favor completa al menos una serie (Peso y Reps).");
                return;
            }

            const btnId = goNext && hasNext ? 'save-next-btn' : 'save-workout-btn';
            const btn = document.getElementById(btnId);
            if(btn) btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> ¡LISTO!';
            
            setTimeout(() => {
                if(goNext && hasNext) {
                    openExerciseModal(dayIndex, exerciseIndex + 1); 
                } else {
                    closeModal(); 
                    if(typeof renderMainContent === 'function') renderMainContent();
                }
            }, 300);
        }

        const saveBtn = document.getElementById('save-workout-btn');
        if(saveBtn) {
            saveBtn.onclick = () => guardarEntrenamientoYContinuar(false);
        }
    }

    const nextBtn = document.getElementById('save-next-btn');
    if(nextBtn) {
        nextBtn.onclick = () => {
            if(!isAdminViewing) {
                window.guardarEntrenamientoTemp ? window.guardarEntrenamientoTemp(true) : nextExerciseAction(dayIndex, exerciseIndex);
            } else {
                openExerciseModal(dayIndex, exerciseIndex + 1);
            }
        };
    }

    // Auxiliar interna para guardar desde el botón Siguiente
    window.guardarEntrenamientoTemp = function(goNext) {
        const setsContainer = document.getElementById('sets-container');
        if(!setsContainer) {
            if(goNext && hasNext) openExerciseModal(dayIndex, exerciseIndex + 1);
            return;
        }
        const rows = setsContainer.children;
        const currentSets = [];
        let maxW = 0;
        const history = clientData.exerciseHistory[ex.name] || [];

        for(let i = 0; i < rows.length; i++) {
            const w = parseFloat(rows[i].querySelector('.set-weight').value);
            const r = parseInt(rows[i].querySelector('.set-reps').value);
            if(!isNaN(w) && !isNaN(r)) {
                currentSets.push({weight: w, reps: r});
                if(w > maxW) maxW = w; 
            }
        }

        if(currentSets.length > 0) {
            const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
            clientData.exerciseHistory[ex.name] = history.filter(h => h.date !== today);
            clientData.exerciseHistory[ex.name].push({ date: today, weight: maxW, sets: currentSets });
            if(typeof syncClientToDB === 'function') syncClientToDB(clientData);
        }

        if(goNext && hasNext) {
            openExerciseModal(dayIndex, exerciseIndex + 1);
        }
    };
};

// ==========================================
// CONTROL DE VISIBILIDAD DE LA GRÁFICA
// ==========================================
window.toggleExerciseChart = function(exName) {
    const wrapper = document.getElementById('ex-chart-wrapper');
    const icon = document.getElementById('ex-chart-toggle-icon');
    
    if (!wrapper || !icon) return;

    if (wrapper.classList.contains('hidden')) {
        wrapper.classList.remove('hidden');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        updateExerciseChart(exName);
    } else {
        wrapper.classList.add('hidden');
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
};

// ==========================================
// RENDERIZADO DE LA GRÁFICA CON EL COLOR EXACTO DEL PLAN DEL USUARIO
// ==========================================
window.updateExerciseChart = function(exName) {
    const isAdminViewing = state.viewingClientAsAdmin; 
    const clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    if (!clientData) return;

    // 1. Buscamos el plan del usuario de forma inteligente
    let userPlanName = clientData.plan;
    let exactPlanColor = '#D4D4D8'; // Color platinado por defecto para Silver

    if (typeof gymPlans !== 'undefined' && Array.isArray(gymPlans)) {
        // Si clientData.plan es un objeto o un string, intentamos empatarlo con gymPlans
        const matchedPlan = gymPlans.find(p => p.name === userPlanName || p.name === clientData.plan?.name);
        if (matchedPlan) {
            exactPlanColor = matchedPlan.color;
        } else if (typeof clientData.plan === 'object' && clientData.plan?.color) {
            exactPlanColor = clientData.plan.color;
        }
    } else if (typeof clientData.plan === 'object' && clientData.plan?.color) {
        exactPlanColor = clientData.plan.color;
    }

    // Corrección estética: Si el color del plan es grafito/oscuro, lo pasamos a plata brillante para que se note
    if (exactPlanColor === '#18181B' || exactPlanColor === '#000000') {
        exactPlanColor = '#D4D4D8';
    }

    // 2. Convertidor seguro de HEX a RGBA para el sombreado de fondo
    let bgColorWithAlpha = exactPlanColor;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(exactPlanColor)) {
        let c = exactPlanColor.substring(1).split('');
        if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x' + c.join('');
        bgColorWithAlpha = 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ', 0.20)';
    }

    const history = (clientData.exerciseHistory && clientData.exerciseHistory[exName]) ? clientData.exerciseHistory[exName] : [];
    const ctx = document.getElementById('exerciseChart');
    if (!ctx) return;
    
    if(window.exerciseChartInstance) {
        window.exerciseChartInstance.destroy();
    }
    
    if(history.length === 0) {
        ctx.parentElement.innerHTML = `
            <div class="h-full flex flex-col justify-center items-center text-[10px] font-bold uppercase tracking-widest text-center" style="color: ${exactPlanColor}; opacity: 0.7;">
                <i class="fa-solid fa-dumbbell text-2xl mb-2"></i>
                Registra peso para ver tu progreso
            </div>`;
        return;
    }

    const recent = history.slice(-8); 
    const labels = recent.map(e => e.date ? e.date.substring(0, 5) : ''); 
    const data = recent.map(e => e.weight);
    
    window.exerciseChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Carga Máx (kg)', 
                data: data, 
                borderColor: exactPlanColor, 
                backgroundColor: bgColorWithAlpha, 
                fill: true, 
                tension: 0.4, 
                borderWidth: 3, 
                pointBackgroundColor: exactPlanColor, 
                pointBorderColor: '#000000', // Borde negro en los puntos para que resalten perfecto con el blanco platinado
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#9ca3af', font: {size: 9} }, grid: { display: false } },
                y: { ticks: { color: '#9ca3af', font: {size: 9} }, grid: { color: '#27272a' }, beginAtZero: false }
            }
        }
    });
};
// ==========================================
// EDITOR DE RUTINAS Y BUSCADOR VISUAL DE EJERCICIOS
// ==========================================
const musculos = ["ABDOMEN", "ADUCTORES", "ANTEBRAZO", "BICEPS", "CUADRICEPS", "ESPALDA", "GEMELOS", "GLUTEO", "HOMBRO", "ISQUIOS", "PECHO", "TIBIA", "TRICEPS"];

window.addExerciseModal = function(dIdx) {
    const musculoOptions = musculos.map(m => `<option value="${m}">${m}</option>`).join('');

    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-plus"></i> Añadir Ejercicio</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="saveNewExercise(event, ${dIdx})" class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            
            <div class="relative bg-[#050505] p-5 rounded-2xl border border-zinc-800 mb-6 shadow-inner">
                <div class="mb-4">
                    <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-layer-group text-cyan-400 mr-1"></i> Grupo Muscular</label>
                    <select id="ex_muscle_filter" onchange="filterExerciseOptions(document.getElementById('ex_search_input').value)" class="w-full bg-[#0a0a0a] border border-cyan-500/50 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md appearance-none cursor-pointer">
                        <option value="TODOS">Ver Todos los Músculos</option>
                        ${musculoOptions}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-magnifying-glass text-yellow-400 mr-1"></i> Buscar Ejercicio</label>
                    <input type="text" id="ex_search_input" onkeyup="filterExerciseOptions(this.value)" placeholder="Ej: sentadilla, press..." class="w-full bg-[#0a0a0a] border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-base text-white font-bold transition-all outline-none shadow-md" autocomplete="off" />
                </div>
                
                <div id="ex_search_results" class="w-full max-h-60 overflow-y-auto bg-[#0a0a0a] border border-yellow-500/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] rounded-xl mt-3 hidden custom-scrollbar"></div>
            </div>
            
            <input type="hidden" id="n_e_nm" />
            <input type="hidden" id="n_e_im" />
            <input type="hidden" id="n_e_ds" />

            <div id="selected_ex_preview" class="hidden items-center gap-5 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30 mb-4 animate-fade-in shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                <div class="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner shrink-0">
                    <img id="prev_ex_img" src="" class="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div class="flex-1">
                    <p class="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-1">Selección:</p>
                    <p id="prev_ex_name" class="text-white font-black text-lg drop-shadow-md leading-tight"></p>
                </div>
            </div>

        <div class="grid grid-cols-2 gap-3">
            <!-- AQUI CAMBIAMOS EL INPUT POR EL SELECT DESPLEGABLE -->
        <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Series</label>
                <select id="n_e_st" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium cursor-pointer appearance-none">
                    <option value="1 Serie">1 Serie</option>
                    <option value="2 Series">2 Series</option>
                    <option value="3 Series">3 Series</option>
                    <option value="4 Series" selected>4 Series</option>
                    <option value="5 Series">5 Series</option>
                    <option value="6 Series">6 Series</option>
                </select>
            </div>
    
            <!-- LAS REPETICIONES QUEDAN EXACTAMENTE IGUAL -->
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Repeticiones</label>
                <input type="text" id="n_e_rp" value="10-12 Reps" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" />
            </div>
        </div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Tiempo de Descanso</label><input type="text" id="n_e_rt" value="4-5 Minutos" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            
            <button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]"><i class="fa-solid fa-plus"></i> Añadir a la Rutina</button>
        </form>
    `);
    
    filterExerciseOptions(""); // Inicia mostrando u ocultando según el select
};

window.filterExerciseOptions = function(query) {
    const resultsDiv = document.getElementById('ex_search_results');
    const selectedMuscle = document.getElementById('ex_muscle_filter').value;
    
    if(!query && selectedMuscle === "TODOS") { 
        resultsDiv.classList.add('hidden'); 
        return; 
    }
    
    let matches = Object.keys(exerciseDetails);

    if (selectedMuscle !== "TODOS") {
        matches = matches.filter(name => {
            const exImg = exerciseDetails[name].img.toUpperCase();
            return exImg.includes(`/${selectedMuscle}/`);
        });
    }

    if (query) {
        matches = matches.filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }
    
    if(matches.length > 0) {
        resultsDiv.innerHTML = matches.map(name => {
            const ex = exerciseDetails[name];
            return `
            <div onclick="selectExerciseOption('${name}', '${ex.img}', '${ex.desc.replace(/'/g, "\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer flex items-center gap-4 border-b border-zinc-800 last:border-0 transition-colors group">
                <div class="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src="${ex.img}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.src='ejercicios/default.png'" />
                </div>
                <span class="text-sm font-bold text-white drop-shadow-md">${name}</span>
            </div>`;
        }).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium text-center">No se encontraron ejercicios en este grupo.</div>`;
        resultsDiv.classList.remove('hidden');
    }
};

window.selectExerciseOption = function(name, img, desc) {
    document.getElementById('n_e_nm').value = name;
    document.getElementById('n_e_im').value = img;
    document.getElementById('n_e_ds').value = desc;
    
    document.getElementById('ex_search_input').value = name;
    document.getElementById('ex_search_results').classList.add('hidden');
    
    document.getElementById('prev_ex_img').src = img;
    document.getElementById('prev_ex_name').innerText = name;
    document.getElementById('selected_ex_preview').classList.remove('hidden');
    document.getElementById('selected_ex_preview').classList.add('flex');
};

window.saveNewExercise = function(e, dIdx) {
    e.preventDefault();
    let nm = document.getElementById('n_e_nm').value;
    let img = document.getElementById('n_e_im').value;
    let desc = document.getElementById('n_e_ds').value;

    if(!nm) {
        nm = document.getElementById('ex_search_input').value;
        img = "ejercicios/default.png";
        desc = "Sigue las indicaciones de tu entrenador.";
    }

    state.selectedClientRecord.workout[dIdx].exercises.push({ 
        name: nm, 
        img: img, 
        sets: document.getElementById('n_e_st').value, 
        reps: document.getElementById('n_e_rp').value, 
        rest: document.getElementById('n_e_rt').value, 
        desc: desc 
    });
    syncClientToDB(state.selectedClientRecord); closeModal(); renderMainContent();
};

window.editExerciseModal = function(dIdx, exIdx) {
    const clientData = state.selectedClientRecord;
    const ex = clientData.workout[dIdx].exercises[exIdx];
    const musculoOptions = musculos.map(m => `<option value="${m}">${m}</option>`).join('');

    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-pen"></i> Editar Ejercicio</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        
        <div class="relative bg-[#050505] p-5 rounded-2xl border border-zinc-800 mb-6 shadow-inner">
            <div class="mb-4">
                <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-layer-group text-cyan-400 mr-1"></i> Grupo Muscular</label>
                <select id="edit_ex_muscle_filter" onchange="filterEditExerciseOptions(document.getElementById('edit_ex_search_input').value)" class="w-full bg-[#0a0a0a] border border-cyan-500/50 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md appearance-none cursor-pointer">
                    <option value="TODOS">Ver Todos los Músculos</option>
                    ${musculoOptions}
                </select>
            </div>

            <div>
                <label class="block text-sm font-black text-zinc-400 mb-2 tracking-widest uppercase"><i class="fa-solid fa-magnifying-glass text-yellow-400 mr-1"></i> Buscar Ejercicio (Reemplazar)</label>
                <input type="text" id="edit_ex_search_input" onkeyup="filterEditExerciseOptions(this.value)" placeholder="Ej: sentadilla, press..." class="w-full bg-[#0a0a0a] border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-sm text-white font-bold transition-all outline-none shadow-md" autocomplete="off" />
            </div>
            <div id="edit_ex_search_results" class="w-full max-h-60 overflow-y-auto bg-[#0a0a0a] border border-yellow-500/50 shadow-[0_0_20px_rgba(255,215,0,0.15)] rounded-xl mt-3 hidden custom-scrollbar"></div>
        </div>

        <form onsubmit="saveExerciseEdit(event, ${dIdx}, ${exIdx})" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Ejercicio</label><input type="text" id="e_nm" value="${ex.name}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            <input type="hidden" id="e_im" value="${ex.img}" />
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Series</label><input type="text" id="e_st" value="${ex.sets}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
                <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Repeticiones</label><input type="text" id="e_rp" value="${ex.reps}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            </div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Tiempo de Descanso</label><input type="text" id="e_rt" value="${ex.rest || '4-5 Minutos'}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
            <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Explicación</label><textarea id="e_ds" required rows="3" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">${ex.desc || ''}</textarea></div>
            <div class="flex gap-3 pt-4 border-t border-zinc-800">
                <button type="button" onclick="deleteExercise(${dIdx}, ${exIdx})" class="flex-1 bg-red-900/40 text-red-400 border border-red-500/50 py-3.5 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i> Eliminar</button>
                <button type="submit" class="flex-1 btn-depth bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(255,215,0,0.4)]"><i class="fa-solid fa-save"></i> Guardar</button>
            </div>
        </form>
    `);
};

window.filterEditExerciseOptions = function(query) {
    const resultsDiv = document.getElementById('edit_ex_search_results');
    const selectedMuscle = document.getElementById('edit_ex_muscle_filter').value;
    
    if(!query && selectedMuscle === "TODOS") { 
        resultsDiv.classList.add('hidden'); 
        return; 
    }
    
    let matches = Object.keys(exerciseDetails);

    if (selectedMuscle !== "TODOS") {
        matches = matches.filter(name => {
            const exImg = exerciseDetails[name].img.toUpperCase();
            return exImg.includes(`/${selectedMuscle}/`);
        });
    }

    if (query) {
        matches = matches.filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }
    
    if(matches.length > 0) {
        resultsDiv.innerHTML = matches.map(name => {
            const ex = exerciseDetails[name];
            return `
            <div onclick="selectEditExerciseOption('${name}', '${ex.img}', '${ex.desc.replace(/'/g, "\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer flex items-center gap-4 border-b border-zinc-800 last:border-0 transition-colors group">
                <div class="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <img src="${ex.img}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.src='ejercicios/default.png'" />
                </div>
                <span class="text-sm font-bold text-white drop-shadow-md">${name}</span>
            </div>`;
        }).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium text-center">No se encontraron ejercicios en este grupo.</div>`;
        resultsDiv.classList.remove('hidden');
    }
};

window.selectEditExerciseOption = function(name, img, desc) {
    document.getElementById('e_nm').value = name;
    document.getElementById('e_im').value = img;
    document.getElementById('e_ds').value = desc;
    
    document.getElementById('edit_ex_search_input').value = name;
    document.getElementById('edit_ex_search_results').classList.add('hidden');
};

window.saveExerciseEdit = function(e, dIdx, exIdx) {
    e.preventDefault(); const clientData = state.selectedClientRecord;
    clientData.workout[dIdx].exercises[exIdx] = { name: document.getElementById('e_nm').value, img: document.getElementById('e_im').value, sets: document.getElementById('e_st').value, reps: document.getElementById('e_rp').value, rest: document.getElementById('e_rt').value, desc: document.getElementById('e_ds').value };
    syncClientToDB(clientData); closeModal(); renderMainContent();
};

window.deleteExercise = function(dIdx, exIdx) {
    if(confirm("¿Seguro que deseas eliminar este ejercicio?")) {
        state.selectedClientRecord.workout[dIdx].exercises.splice(exIdx, 1);
        syncClientToDB(state.selectedClientRecord); closeModal(); renderMainContent();
    }
};

// ==========================================
// PORTAL DE USUARIO Y RUTINA
// ==========================================
window.switchClientTab = function(tab) { state.clientTab = tab; renderMainContent(); };

window.uploadProfilePic = function(event, cc) { 
    const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(e) { const client = state.clients.find(c => c.cc === cc); if(client) { client.profilePic = e.target.result; syncClientToDB(client); if(state.currentUser && state.currentUser.cc === cc) { state.currentUser.record.profilePic = e.target.result; localStorage.setItem('gym_session', JSON.stringify(state.currentUser)); } renderMainContent(); } }; reader.readAsDataURL(file); }
}

// NUEVO: Modal para Registrar Nuevos Datos BIA (Punto 1 y 2)
window.showNewBiaModal = function() {
    const dToday = new Date().toISOString().split('T')[0];
    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-weight-scale"></i> Registrar Evaluación BIA</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="handleNewBiaSubmit(event)" class="space-y-4">
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Fecha de Registro</label>
                <input type="date" id="n_bia_date" value="${dToday}" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Peso (kg)</label>
                    <input type="number" step="0.1" id="n_bia_weight" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">% Grasa</label>
                    <input type="number" step="0.1" id="n_bia_fat" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" />
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Músculo (kg)</label>
                    <input type="number" step="0.1" id="n_bia_muscle" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" />
                </div>
            </div>
            <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(0,229,255,0.4)]"><i class="fa-solid fa-save"></i> Guardar Datos</button>
        </form>
    `);
};

window.handleNewBiaSubmit = function(e) {
    e.preventDefault();
    const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    const rawDate = document.getElementById('n_bia_date').value;
    const dateObj = new Date(rawDate);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    const evalDate = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const weight = Number(document.getElementById('n_bia_weight').value);
    const fat = Number(document.getElementById('n_bia_fat').value);
    const muscle = Number(document.getElementById('n_bia_muscle').value);
    const height = clientData.bia.height;
    const bmi = (weight / ((height/100) ** 2)).toFixed(1);

    clientData.bia.weight = weight;
    clientData.bia.fat = fat;
    clientData.bia.muscle = muscle;
    clientData.bia.bmi = bmi;

    if(!clientData.evaluations) clientData.evaluations = [];
    clientData.evaluations.push({ date: evalDate, weight, fat, muscle, bmi });
    
    syncClientToDB(clientData);
    closeModal();
    renderMainContent();
};

function renderClientPortal() {
  const clientData = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
  if (!clientData) return `<p class="p-8 text-zinc-400 text-center font-bold">Sin registros.</p>`;

  const { bia, workout, name, date, days, dueDate, profilePic, plan } = clientData;
  const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  
  const defaultPlan = gymPlans[0];
  const userPlan = plan || defaultPlan;
  const effColor = userPlan.color === '#18181B' ? '#D4D4D8' : userPlan.color; 
  
  const themeStyles = `
    <style>
      .u-theme-text { color: ${effColor} !important; }
      .u-theme-bg { background-color: ${effColor} !important; color: ${effColor === '#E5E7EB' || effColor === '#FFD700' || effColor === '#D4D4D8' ? '#000000' : '#ffffff'} !important; }
      .u-theme-border { border-color: ${effColor} !important; }
      .u-theme-border-soft { border-color: ${effColor}50 !important; }
      .u-theme-shadow { box-shadow: 0 0 15px ${effColor}66 !important; }
      .u-theme-drop { filter: drop-shadow(0 0 5px ${effColor}80) !important; }
      .u-theme-btn { background-color: ${effColor}; color: ${effColor === '#E5E7EB' || effColor === '#FFD700' || effColor === '#D4D4D8' ? '#000000' : '#ffffff'}; font-weight: 900; box-shadow: 0 0 15px ${effColor}66; }
      .u-theme-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    </style>
  `;

  const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const profileImageHTML = profilePic ? `<img src="${profilePic}" class="w-full h-full object-cover rounded-full" />` : `<i class="fa-solid fa-camera text-2xl text-zinc-500/50 u-theme-text"></i>`;

  let contentHTML = state.clientTab === 'calendar' ? renderCalendarHTML('client') : `
      <div class="card-depth p-6 md:p-10 rounded-[2rem] flex flex-col gap-6 mb-8 border u-theme-border-soft shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-10 bg-[#050505] overflow-hidden">
        
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div class="flex items-center gap-6">
              <!-- Foto -->
              <div class="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed u-theme-border inner-depth flex items-center justify-center overflow-hidden cursor-pointer transition u-theme-shadow group shrink-0" onclick="document.getElementById('pic-upload').click()">
                  ${profileImageHTML}
                  <div class="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-sm"><i class="fa-solid fa-camera mb-1"></i> Foto</div><input type="file" id="pic-upload" class="hidden" accept="image/*" onchange="uploadProfilePic(event, '${clientData.cc}')" />
              </div>
              
              <!-- Info y Lápiz -->
              <div>
                  <div class="flex items-center gap-3">
                      <h2 class="text-2xl md:text-3xl font-black text-white drop-shadow-md uppercase tracking-wider">${name}</h2>
                      ${state.viewingClientAsAdmin ? `
                      <button onclick="openEditProfileModal()" class="w-8 h-8 md:w-9 md:h-9 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 hover:border-cyan-500 transition-all shadow-md z-20" title="Editar Perfil"><i class="fa-solid fa-pen text-[10px] md:text-xs"></i></button>
                      ` : ''}
                  </div>
                  <p class="text-[10px] md:text-xs mt-1 font-bold uppercase tracking-widest text-zinc-500">
                      CC: ${clientData.cc} <span class="mx-1 text-zinc-700">|</span> Registro: ${date}
                  </p>
              </div>
          </div>
          <button onclick="downloadPDF()" class="btn-depth px-5 py-3 md:px-6 md:py-4 rounded-2xl text-xs md:text-sm w-full md:w-auto flex justify-center items-center gap-2 u-theme-btn transition shadow-lg shrink-0"><i class="fa-solid fa-file-pdf"></i> Guardar PDF</button>
        </div>
        
        <div class="w-full h-px bg-zinc-800/80 my-2"></div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-20">
            <div class="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner"><div class="w-2.5 h-10 rounded-full bg-[#eab308]"></div><div><p class="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Peso (kg)</p><p class="text-lg font-black text-white drop-shadow-sm">${bia.weight || '0'}</p></div></div>
            <div class="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner"><div class="w-2.5 h-10 rounded-full bg-[#ef4444]"></div><div><p class="text-[10px] text-zinc-500 font-black uppercase tracking-widest">% Grasa</p><p class="text-lg font-black text-white drop-shadow-sm">${bia.fat || '0'}</p></div></div>
            <div class="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner"><div class="w-2.5 h-10 rounded-full bg-[#10b981]"></div><div><p class="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Músculo</p><p class="text-lg font-black text-white drop-shadow-sm">${bia.muscle || '0'}</p></div></div>
            <div class="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-inner"><div class="w-2.5 h-10 rounded-full bg-[#3b82f6]"></div><div><p class="text-[10px] text-zinc-500 font-black uppercase tracking-widest">IMC</p><p class="text-lg font-black text-white drop-shadow-sm">${bia.bmi || '0'}</p></div></div>
        </div>
      </div>

      <!-- INSIGNIA FUNDADOR (Totalmente Borrosa) -->
      ${clientData.isMigrated ? `<div class="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/50 px-4 py-2 rounded-full blur-md opacity-60 select-none pointer-events-none"><i class="fa-solid fa-medal text-yellow-400 text-lg"></i><span class="text-xs font-black text-yellow-400 uppercase tracking-widest">Miembro Pionero</span></div>` : ''}

      <!-- PLAN POR TIEMPO LIMITADO -->
      <div class="card-depth p-8 rounded-[2rem] border u-theme-border-soft mb-8 bg-[#0a0a0a] shadow-[0_0_15px_rgba(0,0,0,0.4)] relative flex justify-center items-center z-10">
          <h3 class="text-xl md:text-3xl font-black text-white uppercase tracking-widest u-theme-drop animate-pulse text-center">PLAN POR TIEMPO LIMITADO</h3>
      </div>

      <!-- VENCIMIENTO MENSUALIDAD (Se Mantiene Intacto) -->
      <div class="p-6 md:p-8 mb-8 rounded-[2rem] border ${isExpired ? 'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'card-depth border-yellow-500/40 shadow-[0_0_20px_rgba(255,215,0,0.1)]'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-5">
              <div class="w-14 h-14 rounded-2xl inner-depth flex items-center justify-center ${isExpired ? 'text-red-500 border border-red-500/50 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-yellow-400 border border-yellow-500/50 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'}"><i class="fa-solid fa-calendar-check text-2xl"></i></div>
              <div><p class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Estado Mensualidad</p><p class="text-xl font-bold text-white drop-shadow-md">Vence: <span class="${isExpired ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]'}">${dueDate}</span></p></div>
          </div>
          <span class="px-6 py-3 rounded-xl text-xs font-black uppercase w-full md:w-auto text-center tracking-widest shadow-md ${isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'btn-depth bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'}">${isExpired ? 'VENCIDA' : daysLeft + ' Días Restantes'}</span>
      </div>
      
      <!-- SECCIÓN GRÁFICA -->
      <div class="card-depth rounded-[2rem] overflow-hidden mb-8 border border-zinc-800/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative z-10">
          <div class="bg-[#050505] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black">
              <div class="flex items-center gap-4 cursor-pointer hover:opacity-80 transition" onclick="toggleProgressChart()">
                  <h3 class="text-sm font-bold flex items-center gap-3 u-theme-text u-theme-drop"><i class="fa-solid fa-chart-line text-lg"></i> Evolución Física</h3>
                  <button class="inner-depth text-zinc-400 px-4 py-2 rounded-lg text-xs font-bold border border-zinc-800"><span id="chart-toggle-text">Ocultar</span> <i id="chart-toggle-icon" class="fa-solid fa-chevron-up ml-1"></i></button>
              </div>
              <button onclick="event.stopPropagation(); showNewBiaModal()" class="btn-depth w-full md:w-auto bg-cyan-500 text-black px-5 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)] hover:scale-105 transition"><i class="fa-solid fa-plus"></i> Registrar Nuevos Datos</button>
          </div>
          <div id="chart-wrapper" class="p-6 md:p-8 bg-[#030303]"><div class="relative h-64 w-full"><canvas id="progressChart"></canvas></div></div>
      </div>

      <!-- SECCIÓN RUTINA -->
      <div id="pdf-container" class="space-y-6 relative z-10">
          <div class="card-depth p-6 md:p-10 rounded-[2rem] border u-theme-border-soft shadow-[0_0_20px_rgba(0,0,0,0.05)]">
              <div class="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8 border-b border-zinc-800/80 pb-6 justify-between">
                  <div class="flex items-center gap-4">
                      <div class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border u-theme-border u-theme-text u-theme-shadow"><i class="fa-solid fa-dumbbell text-xl"></i></div>
                      <h3 class="text-xl md:text-2xl font-black text-white drop-shadow-md">Plan de Entrenamiento <span class="text-zinc-500 text-lg font-medium">(${days || 4} Días)</span></h3>
                  </div>
                  ${state.viewingClientAsAdmin ? `
                  <button onclick="showRoutineGeneratorModal()" class="btn-depth w-full md:w-auto bg-yellow-400 text-black font-extrabold px-6 py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:scale-105 transition flex items-center justify-center gap-2 gen-btn-pdf-hide">
                      <i class="fa-solid fa-wand-magic-sparkles"></i> Generar Nueva Rutina
                  </button>
                  ` : ''}
              </div>
              
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  ${workout.map((d, dIdx) => `
                  <div class="inner-depth p-6 rounded-2xl space-y-5 border border-zinc-800/50 relative">
                      <h4 class="font-bold text-sm border-b border-zinc-800/80 pb-3 u-theme-text u-theme-drop">${d.day}</h4>
                      <div class="space-y-4">
                          ${d.exercises.map((ex, exIdx) => `
                          <div onclick="openExerciseModal(${dIdx}, ${exIdx})" class="cursor-pointer bg-[#050505] p-4 rounded-xl flex gap-4 border border-zinc-800/80 hover:border-zinc-500 transition group items-center relative overflow-hidden">
                              <div class="w-28 h-20 rounded-lg bg-white flex items-center justify-center border u-theme-border-soft shrink-0 overflow-hidden shadow-inner p-1">
                                  <img src="${ex.img}" alt="${ex.name}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.onerror=null; this.src='${fallbackBase64}';"/>
                              </div>
                              <div class="flex-1 flex flex-col justify-center gap-2">
                                  <div class="text-xs font-bold text-white uppercase drop-shadow-md transition">${exIdx + 1}. ${ex.name}</div>
                                  <div class="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                                      <span class="bg-[#0a0a0a] px-3 py-1.5 rounded border u-theme-border-soft u-theme-text">${ex.sets}</span>
                                      <span class="bg-[#0a0a0a] px-3 py-1.5 rounded border border-zinc-700 text-zinc-300">${ex.reps}</span>
                                  </div>
                              </div>
                              ${state.viewingClientAsAdmin ? `
                                  <button onclick="event.stopPropagation(); editExerciseModal(${dIdx}, ${exIdx})" class="absolute top-2 right-2 w-8 h-8 rounded bg-[#0a0a0a] border border-zinc-700 text-zinc-500 hover:text-yellow-400 hover:border-yellow-400 transition flex items-center justify-center shadow-md edit-btn-pdf-hide">
                                      <i class="fa-solid fa-pen"></i>
                                  </button>
                              ` : ''}
                          </div>
                          `).join('')}
                      </div>
                      ${state.viewingClientAsAdmin ? `
                          <button onclick="addExerciseModal(${dIdx})" class="w-full mt-4 border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 add-btn-pdf-hide">
                              <i class="fa-solid fa-plus"></i> Añadir Ejercicio
                          </button>
                      ` : ''}
                  </div>`).join('')}
              </div>
          </div>
      </div>
  `;

  return `
    ${themeStyles}
    <!-- MARCA DE AGUA -->
    <div class="fixed inset-0 pointer-events-none flex flex-col items-center justify-center z-0 overflow-hidden opacity-[0.03]">
        <h1 class="text-[18vw] font-black text-white leading-none tracking-tighter select-none">GYM</h1>
        <h1 class="text-[18vw] font-black text-white leading-none tracking-tighter select-none">FINITY</h1>
    </div>
    
    <div class="space-y-6 animate-fade-in pb-12 relative z-10">
      ${state.currentUser && state.currentUser.role === 'admin' ? `<div class="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/40 p-4 rounded-2xl mb-6 shadow-[0_0_15px_rgba(255,215,0,0.1)]"><button onclick="backToAdminPanel()" class="bg-[#050505] text-yellow-400 border border-yellow-500/50 hover:bg-yellow-400 hover:text-black hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-arrow-left"></i> Volver al Panel Admin</button></div>` : ''}
      <div class="flex flex-wrap gap-3 border-b border-zinc-900 pb-6 mb-6">
          <button onclick="switchClientTab('routine')" class="px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.clientTab === 'routine' ? 'u-theme-btn' : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'}"><i class="fa-solid fa-dumbbell"></i> Mi Plan</button>
          <button onclick="switchClientTab('calendar')" class="px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.clientTab === 'calendar' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#0a0a0a] text-zinc-400 hover:text-white border border-zinc-800'}"><i class="fa-solid fa-calendar-day"></i> Citas / Asistencia</button>
      </div>
      ${contentHTML}
    </div>
  `;
}

// ==========================================
// LANDING PAGE Y PLANES (VERSIÓN EXPECTATIVA)
// ==========================================
function renderLandingPage() {
  const currentProduct = storeProducts[state.currentProductIndex];
  
  const mainPlans = gymPlans.slice(0, 3);
  const extraPlans = gymPlans.slice(3);

  return `
    <div class="flex flex-col gap-24 animate-fade-in pb-20">
      <div class="text-center mt-12 md:mt-16 space-y-6">
          <h2 class="text-5xl md:text-7xl font-black tracking-tight leading-tight flex flex-col md:flex-row items-center justify-center gap-3 md:gap-5">
              <div class="flex"><span class="letter-anim delay-1">G</span><span class="letter-anim delay-2">Y</span><span class="letter-anim delay-3">M</span><span class="letter-anim delay-4 ml-2">F</span><span class="letter-anim delay-5">I</span><span class="letter-anim delay-6">N</span><span class="letter-anim delay-7">I</span><span class="letter-anim delay-8">T</span><span class="letter-anim delay-9">Y</span><span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">,</span></div>
              <span class="glow-text-anim text-white">entrena sin limites.</span>
          </h2>
          <p class="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base mt-2 drop-shadow-md">Ciencia, tecnología y entrenamiento personalizado. Evaluación InBody, análisis biomecánico y rutinas diseñadas a tu medida para maximizar tu rendimiento y alcanzar tus objetivos.</p>
      </div>
      
      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Estructura de Planes</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
              ${mainPlans.map((plan, index) => {
                  const isBlack = plan.id.includes('RUTINA');
                  const planColor = isBlack ? '#3F3F46' : plan.color; 
                  const planShadow = isBlack ? 'rgba(255,255,255,0.2)' : plan.shadow;
                  const bgColorAlpha = isBlack ? 'rgba(63, 63, 70, 0.4)' : `${plan.color}1A`;
                  const textColor = isBlack ? '#FFFFFF' : plan.color;

                  return `
                  <div onclick="showDynamicPlanModal(${index})" class="rounded-3xl p-8 cursor-pointer flex flex-col items-center relative transparent-plan-card group overflow-hidden" style="--plan-color: ${planColor}; --plan-shadow: ${planShadow}; --plan-shadow-inset: ${planColor}33; --plan-color-alpha: ${bgColorAlpha};">
                      <!-- Mensaje Superpuesto de Expectativa -->
                      <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/40 transition-colors">
                          <span class="text-white font-black text-2xl drop-shadow-[0_0_15px_rgba(0,0,0,1)] text-center px-4 uppercase tracking-widest animate-pulse">ALGO MASIVO SE ACERCA...</span>
                      </div>
                      <!-- Contenido del Plan Difuminado -->
                      <div class="w-full flex flex-col items-center blur-md opacity-30 pointer-events-none select-none h-full">
                          <h4 class="text-xl font-black uppercase text-center drop-shadow-md" style="color: ${textColor};">${plan.id}</h4>
                          <p class="text-xs text-zinc-400 uppercase tracking-widest mb-4 text-center font-bold">${plan.subtitle}</p>
                          <p class="text-3xl font-black text-white mb-8 drop-shadow-sm">${plan.price}</p>
                          <ul class="w-full space-y-4 text-sm text-zinc-400 mb-8 flex-1 font-medium">
                              <li class="flex items-center gap-3"><i class="fa-regular fa-clock text-zinc-500"></i> ${plan.schedule}</li>
                              ${plan.classes ? `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-green-500"></i> Clases grupales</li>` : `<li class="flex items-center gap-3"><i class="fa-solid fa-xmark text-red-500"></i> Sin Clases grupales</li>`}
                          </ul>
                      </div>
                  </div>
              `}).join('')}
          </div>

          <div class="text-center mt-8">
              <button onclick="document.getElementById('extra-plans-container').classList.toggle('hidden')" class="bg-[#0a0a0a] border border-zinc-800 text-zinc-300 px-6 py-3 rounded-xl font-bold hover:text-white transition shadow-md">
                  <i class="fa-solid fa-layer-group text-yellow-400"></i> VER PLANES EXTRA <i class="fa-solid fa-chevron-down ml-2"></i>
              </button>
          </div>

          <div id="extra-plans-container" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch mt-8 transition-all">
              ${extraPlans.map((plan, index) => {
                  const actualIndex = index + 3; 
                  const isBlack = plan.id.includes('RUTINA');
                  const planColor = isBlack ? '#3F3F46' : plan.color; 
                  const planShadow = isBlack ? 'rgba(255,255,255,0.2)' : plan.shadow;
                  const bgColorAlpha = isBlack ? 'rgba(63, 63, 70, 0.4)' : `${plan.color}1A`;
                  const textColor = isBlack ? '#FFFFFF' : plan.color;

                  return `
                  <div onclick="showDynamicPlanModal(${actualIndex})" class="rounded-3xl p-8 cursor-pointer flex flex-col items-center relative transparent-plan-card group overflow-hidden" style="--plan-color: ${planColor}; --plan-shadow: ${planShadow}; --plan-shadow-inset: ${planColor}33; --plan-color-alpha: ${bgColorAlpha};">
                      <!-- Mensaje Superpuesto de Expectativa -->
                      <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/40 transition-colors">
                          <span class="text-white font-black text-2xl drop-shadow-[0_0_15px_rgba(0,0,0,1)] text-center px-4 uppercase tracking-widest animate-pulse">ALGO MASIVO SE ACERCA...</span>
                      </div>
                      <!-- Contenido del Plan Difuminado -->
                      <div class="w-full flex flex-col items-center blur-md opacity-30 pointer-events-none select-none h-full">
                          <h4 class="text-xl font-black uppercase text-center drop-shadow-md" style="color: ${textColor};">${plan.id}</h4>
                          <p class="text-xs text-zinc-400 uppercase tracking-widest mb-4 text-center font-bold">${plan.subtitle}</p>
                          <p class="text-3xl font-black text-white mb-8 drop-shadow-sm">${plan.price}</p>
                          <ul class="w-full space-y-4 text-sm text-zinc-400 mb-8 flex-1 font-medium">
                              <li class="flex items-center gap-3"><i class="fa-regular fa-clock text-zinc-500"></i> ${plan.schedule}</li>
                              ${plan.classes ? `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-green-500"></i> Clases grupales</li>` : `<li class="flex items-center gap-3"><i class="fa-solid fa-xmark text-red-500"></i> Sin Clases grupales</li>`}
                          </ul>
                      </div>
                  </div>
              `}).join('')}
          </div>
      </div>
      
      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Clases Grupales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              ${gymCoaches.map(c => `
                  <div class="card-depth border border-zinc-800/80 rounded-[2rem] overflow-hidden flex flex-col md:flex-row group hover:border-cyan-500/50 transition duration-500">
                      <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4 order-2 md:order-1 relative z-10 bg-[#050505]/80 backdrop-blur-sm">
                          <div><p class="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">${c.coach}</p><h4 class="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-md">${c.name}</h4></div>
                          <p class="text-sm text-zinc-400 leading-relaxed font-medium">${c.desc}</p>
                      </div>
                      <div class="w-full md:w-1/2 relative min-h-[200px] md:min-h-full order-1 md:order-2 overflow-hidden bg-black flex items-center justify-center"><div class="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050505] to-transparent z-10 hidden md:block"></div><img src="${c.img}" alt="${c.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-70 group-hover:opacity-100" onerror="this.src='https://via.placeholder.com/400x400/15130b/fff.png&text=${encodeURIComponent(c.name)}'"/></div>
                  </div>
              `).join('')}
          </div>
      </div>

      <div class="space-y-12">
          <h3 class="text-center text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Suplementación</h3>
          <div class="max-w-5xl mx-auto flex items-center gap-6">
              <button onclick="changeProduct(-1)" class="w-14 h-14 rounded-full border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-left"></i></button>
              <div class="flex-1 rounded-[2rem] overflow-hidden card-depth flex flex-col md:flex-row items-center p-8 md:p-14 relative animate-fade-in" id="product-display">
                  <div class="w-full md:w-1/2 flex justify-center mb-8 md:mb-0 relative"><div class="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full mix-blend-screen"></div><img src="${currentProduct.img}" alt="${currentProduct.name}" class="w-56 md:w-80 object-contain relative z-10 hover:scale-105 transition duration-500 drop-shadow-2xl" onerror="this.src='https://via.placeholder.com/400x400/15130b/fff.png&text=${encodeURIComponent(currentProduct.name)}'" /></div>
                  <div class="w-full md:w-1/2 text-left space-y-5">
                      <h4 class="text-3xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">${currentProduct.name}</h4><p class="text-xs text-yellow-500 uppercase tracking-[0.2em] font-bold drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">${currentProduct.tag}</p><p class="text-sm md:text-base text-zinc-300 leading-relaxed font-medium">${currentProduct.desc}</p>
                      <ul class="text-sm text-zinc-300 space-y-3 mt-4 border-l-2 border-cyan-500/50 pl-4 font-medium">${currentProduct.info.map(i => `<li><i class="fa-solid fa-check mr-2 text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"></i> ${i}</li>`).join('')}</ul>
                      <div class="mt-8 inline-block btn-depth bg-yellow-500 text-black px-8 py-4 rounded-2xl text-xl font-black shadow-[0_0_20px_rgba(255,215,0,0.4)]">${currentProduct.price}</div>
                  </div>
              </div>
              <button onclick="changeProduct(1)" class="w-14 h-14 rounded-full border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
      </div>
    </div>
  `;
}

// ==========================================
// MODALES GLOBALES Y LOGIN
// ==========================================
function openModal(html) { const m = document.getElementById('app-modal'), c = document.getElementById('modal-content'); c.innerHTML = html; m.classList.remove('hidden'); c.classList.add('animate-scale-up'); }
function closeModal() { document.getElementById('app-modal').classList.add('hidden'); }

window.showDynamicPlanModal = function(index) {
    const plan = gymPlans[index];
    const isBlack = plan.id.includes('RUTINA');
    const planColor = isBlack ? '#3F3F46' : plan.color;

    openModal(`
        <div class="absolute inset-0 metallic-bg rounded-[2rem] overflow-hidden" style="--plan-color: ${planColor};"><div class="metallic-shine"></div><div class="metallic-texture"></div></div>
        <div class="relative z-10 text-left space-y-6 h-full flex flex-col justify-center">
            
            <!-- Botón Cerrar visible y centrado arriba -->
            <div class="flex justify-between items-start absolute top-0 w-full z-50">
                <div class="w-12 h-8 rounded bg-zinc-300 flex flex-col justify-center gap-1 shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-white/50 relative overflow-hidden" style="background: linear-gradient(135deg, #eee, #aaa);"><div class="w-full h-[1px] bg-black/20"></div><div class="w-full h-[1px] bg-black/20"></div><div class="w-full h-[1px] bg-black/20"></div></div>
                <button onclick="closeModal()" class="w-10 h-10 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-black transition border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Texto de Intriga -->
            <div class="absolute inset-0 z-40 flex items-center justify-center pointer-events-none mt-10">
                <h2 class="text-3xl md:text-5xl font-black text-white text-center drop-shadow-[0_0_20px_rgba(0,0,0,1)] metal-text-shadow px-4 animate-pulse uppercase tracking-widest">ESTÁS A PUNTO DE <br> CRUZAR LA LÍNEA...</h2>
            </div>
            
            <!-- Contenido Borroso -->
            <div class="blur-xl opacity-40 select-none pointer-events-none mt-12">
                <div>
                    <h3 class="text-4xl font-black text-white tracking-widest uppercase metal-text-shadow drop-shadow-md">${plan.id}</h3>
                    <p class="text-xs font-black uppercase tracking-widest mt-1 metal-text-shadow text-white drop-shadow-md bg-black/40 inline-block px-3 py-1 rounded-full border border-white/10">${plan.subtitle}</p>
                    <p class="text-6xl font-black text-white mt-4 metal-text-shadow drop-shadow-md">${plan.price}</p>
                </div>
                <div class="bg-black/70 backdrop-blur-md border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-2xl p-6 space-y-5 mt-6">
                    <div class="text-sm text-zinc-200 italic border-b border-zinc-700/50 pb-4 font-medium"><strong class="text-white not-italic block mb-1">¿Para quién es?</strong> ${plan.target}</div>
                    <div class="pt-2"><p class="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-3">Características del Plan</p><ul class="space-y-4 text-sm font-bold text-white drop-shadow-md">
                            <li class="flex items-center gap-4"><i class="fa-regular fa-clock text-zinc-300 text-lg w-5 text-center drop-shadow-md"></i> ${plan.schedule}</li>
                            <li class="flex items-center gap-4"><i class="fa-solid ${plan.classes ? 'fa-check text-green-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.classes ? 'Acceso a clases grupales' : 'No incluye clases grupales'}</li>
                            <li class="flex items-center gap-4"><i class="fa-solid ${plan.inbody ? 'fa-check text-cyan-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.inbody || 'No incluye InBody'}</li>
                            <li class="flex items-center gap-4"><i class="fa-solid ${plan.routine ? 'fa-check text-cyan-400' : 'fa-xmark text-red-400'} text-lg w-5 text-center drop-shadow-md"></i> ${plan.routine || 'No incluye adaptación de rutina'}</li>
                    </ul></div>
                </div>
            </div>
        </div>
    `);
};
window.showMainLoginFlow = function() {
  openModal(`
    <div class="flex justify-between items-center mb-8 border-b border-zinc-800/50 pb-4">
        <h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            <i class="fa-solid fa-door-open text-cyan-400"></i> Acceso al Sistema
        </h3>
        <button onclick="closeModal()" class="text-zinc-500 hover:text-white">
            <i class="fa-solid fa-xmark text-lg"></i>
        </button>
    </div>
    <div class="space-y-4">
      <button onclick="showClientLoginModal()" class="w-full card-depth border border-cyan-500/30 text-white hover:border-cyan-400 font-bold py-6 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_10px_rgba(0,229,255,0.1)]">
          <i class="fa-solid fa-user text-cyan-400 text-xl"></i> INGRESO DE USUARIO
      </button>
      <button onclick="showAdminLoginModal()" class="w-full card-depth border border-yellow-500/30 text-white hover:border-yellow-400 font-bold py-6 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_10px_rgba(255,215,0,0.1)]">
          <i class="fa-solid fa-user-shield text-yellow-400 text-xl"></i> ACCESO ENTRENADOR
      </button>
    </div>
  `);
};

window.showClientLoginModal = function() {
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
        <h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Ingreso de Usuario</h3>
        <button onclick="showMainLoginFlow()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
    </div>
    <form onsubmit="handleClientLoginSubmit(event)" class="space-y-5">
      <div>
          <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula</label>
          <input type="text" id="l_c_cc" required class="w-full input-gym rounded-xl p-4 text-sm text-white font-medium" />
      </div>
      <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm shadow-[0_0_15px_rgba(0,229,255,0.4)]">Entrar a mi Rutina</button>
    </form>
  `);
};

window.showAdminLoginModal = function() {
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
        <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">Acceso Entrenador</h3>
        <button onclick="showMainLoginFlow()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
    </div>
    <form onsubmit="handleAdminLoginSubmit(event)" class="space-y-4">
      <div>
          <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula Autorizada</label>
          <input type="text" id="l_cc" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" />
      </div>
      <button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]">Entrar al Panel Admin</button>
    </form>
  `);
};

function showModalError(message, backFunction) {
  openModal(`
    <div class="text-center space-y-6 py-6">
        <div class="w-20 h-20 inner-depth text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-red-500/50 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div><h3 class="text-lg font-bold text-white mb-2">Aviso del Sistema</h3><p class="text-sm text-zinc-400 leading-relaxed max-w-[80%] mx-auto font-medium">${message}</p></div>
        <div class="flex gap-3 pt-4"><button onclick="closeModal()" class="flex-1 card-depth border border-zinc-800 text-white py-3.5 rounded-xl text-sm font-bold">Cerrar</button>
        ${backFunction ? `<button onclick="(${backFunction.name})()" class="flex-1 btn-depth bg-cyan-500 text-black py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(0,229,255,0.3)]">Reintentar</button>` : ''}</div>
    </div>
  `);
}

window.handleAdminLoginSubmit = function(e) {
    e.preventDefault();
    const cc = document.getElementById('l_cc').value.trim();
    const trainer = authorizedAdmins.find(x => x.cc === cc);
    
    if(trainer) {
        state.currentUser = {role: 'admin', name: trainer.name, cc: trainer.cc};
        localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
        closeModal(); renderNavbar(); renderMainContent();
    } else {
        showModalError('Cédula no autorizada o acceso denegado.', showAdminLoginModal);
    }
};

window.showClientRegisterModal = function() {
  const dToday = new Date().toISOString().split('T')[0];
  const planOptions = gymPlans.filter(p => !p.id.includes('RUTINA')).map(p => `<option value="${p.id}">${p.id} - ${p.price}</option>`).join('');
  
  openModal(`
    <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Nuevo Usuario</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div>
    <form onsubmit="handleClientRegisterSubmit(event)" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div><label class="block text-xs font-bold text-cyan-400 mb-1.5 ml-1">Seleccionar Plan</label><select id="r_c_pl" class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-black border-cyan-500/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]">${planOptions}</select></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Fecha de Ingreso</label><input type="date" id="r_c_ing" value="${dToday}" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Cédula</label><input type="text" id="r_c_cc" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Completo</label><input type="text" id="r_c_nm" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div>
      <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Edad</label><input type="number" id="r_c_ag" value="25" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Género</label><select id="r_c_gn" class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium"><option value="M">Masc.</option><option value="F">Fem.</option></select></div></div>
      <div class="border-t border-zinc-800/50 pt-5 mt-2">
          <p class="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-weight-scale"></i> Análisis BIA</p>
          <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Peso (kg)</label><input type="number" step="0.1" id="b_wt" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Altura (cm)</label><input type="number" id="b_ht" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">% Grasa</label><input type="number" step="0.1" id="b_ft" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
              <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Músculo (kg)</label><input type="number" step="0.1" id="b_ms" required class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium" /></div>
          </div>
      </div>
      <div class="grid grid-cols-2 gap-3 pt-3">
          <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Días Entreno</label>
              <select id="w_dy" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">
                  <option value="3">3 Días</option>
                  <option value="4" selected>4 Días</option>
                  <option value="5">5 Días</option>
                  <option value="6">6 Días</option>
              </select>
          </div>
          <div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nivel</label>
              <select id="w_lv" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium">
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio" selected>Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
              </select>
          </div>
      </div>
      <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm mt-6 shadow-[0_0_15px_rgba(0,229,255,0.4)]">Guardar y Generar Rutina</button>
    </form>
  `);
};

window.handleClientRegisterSubmit = async function(e) {
  e.preventDefault();
  const loader = document.getElementById('loading-screen');
  if(loader) {
      loader.classList.remove('hide-loader'); loader.style.opacity = '1'; loader.style.visibility = 'visible'; loader.style.zIndex = '100000';
      loader.querySelector('h1').innerHTML = '<span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse">GENERANDO RUTINA IA...</span>';
  }
  
  const selectedPlanId = document.getElementById('r_c_pl').value;
  const userPlan = gymPlans.find(p => p.id === selectedPlanId) || gymPlans[0];

  const inputDateStr = document.getElementById('r_c_ing').value;
  const inputDate = new Date(inputDateStr);
  const expirationDate = new Date(inputDate.getTime() + (userPlan.durationDays * 24 * 60 * 60 * 1000));
  const dueDate = expirationDate.toISOString().split('T')[0];

  const cc = document.getElementById('r_c_cc').value.trim(); const name = document.getElementById('r_c_nm').value.trim();
  const gender = document.getElementById('r_c_gn').value; 
  const weight = Number(document.getElementById('b_wt').value); const height = Number(document.getElementById('b_ht').value);
  const fat = Number(document.getElementById('b_ft').value);
  const bmi = (weight / ((height/100) ** 2)).toFixed(1);
  let objective = "Recomposición Corporal"; if (fat > 22 && gender === 'M') objective = "Déficit Calórico"; else if (fat > 28 && gender === 'F') objective = "Déficit Calórico"; else if (fat < 15) objective = "Hipertrofia Muscular";
  
  const aiRoutine = generateAiWorkout(objective, document.getElementById('w_dy').value, document.getElementById('w_lv').value, state.inventory);
  const evalDate = new Date(inputDateStr).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const currentEval = { date: evalDate, weight, fat, muscle: Number(document.getElementById('b_ms').value), bmi };
  
  let evaluations = []; const existingIdx = state.clients.findIndex(c => c.cc === cc);
  if (existingIdx >= 0) { evaluations = state.clients[existingIdx].evaluations || []; } else if (state.historyDB[cc]) { evaluations = [...state.historyDB[cc]]; evaluations.push({ date: 'INACTIVO', weight: null, fat: null, muscle: null, bmi: null }); } evaluations.push(currentEval);

  const newRecord = { cc, name, age: Number(document.getElementById('r_c_ag').value), gender, dueDate, status: 'active', date: evalDate, profilePic: null, plan: userPlan, exerciseHistory: {}, bia: { weight, height, fat, muscle: currentEval.muscle, bmi, objective }, workout: aiRoutine, days: document.getElementById('w_dy').value, level: document.getElementById('w_lv').value, evaluations: evaluations };
  if (existingIdx >= 0) state.clients[existingIdx] = newRecord; else state.clients.push(newRecord);
  
  syncClientToDB(newRecord);
  
  if(loader) { loader.classList.add('hide-loader'); setTimeout(() => { loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">GYM</span> <span class="text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">FINITY</span>'; loader.style = ''; }, 600); }
  closeModal(); renderMainContent();
};

window.handleClientLoginSubmit = function(e) {
  e.preventDefault(); const cc = document.getElementById('l_c_cc').value.trim(); const client = state.clients.find(c => c.cc === cc);
  if (!client) return showModalError("Cédula no encontrada. Por favor comunícate con el entrenador.", showClientLoginModal);
  if (client.status === 'inactive') return showModalError("Su cuenta está inactiva.", showClientLoginModal);
  if (Math.ceil((new Date(client.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) < 0) return showModalError("Su mensualidad ha vencido.", showClientLoginModal);

  state.currentUser = { role: 'client', name: client.name, cc: client.cc, record: client }; localStorage.setItem('gym_session', JSON.stringify(state.currentUser));
  closeModal(); state.clientTab = 'routine'; 

  const today = new Date(); const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const futureEvents = state.events.filter(ev => ev.assignedCC === client.cc && ev.date >= todayStr && ev.attendance !== 'missed');
  futureEvents.sort((a,b) => new Date(a.date) - new Date(b.date));

  if(futureEvents.length > 0) {
      const nextEvent = futureEvents[0]; const toast = document.createElement('div'); toast.className = "bg-black/90 border border-cyan-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-4 animate-popup card-depth";
      toast.innerHTML = `<div class="text-cyan-400 text-3xl drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"><i class="fa-solid fa-bell animate-bounce"></i></div><div><p class="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Tu próxima cita</p><p class="text-white font-bold text-sm drop-shadow-md">${nextEvent.name}</p><p class="text-cyan-400 text-xs font-mono drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-regular fa-calendar"></i> ${nextEvent.date} a las ${nextEvent.startTime}</p></div>`;
      document.getElementById('toast-container').appendChild(toast); setTimeout(() => { toast.style.animation = "fadeOutLoader 0.5s ease-out forwards"; setTimeout(() => toast.remove(), 500); }, 4000);
  }
  renderNavbar(); renderMainContent();
};

// ==========================================
// CALENDARIO CON RESTRICCIÓN DE CRUCE
// ==========================================
window.changeMonth = function(offset) { state.calendarDate.setMonth(state.calendarDate.getMonth() + offset); renderMainContent(); };
function renderCalendarHTML(context) { 
  const year = state.calendarDate.getFullYear(); const month = state.calendarDate.getMonth(); const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const monthName = state.calendarDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase(); 
  let grid = `<div class="grid grid-cols-7 gap-2 text-center mb-3">${['D','L','M','M','J','V','S'].map(d => `<div class="font-black text-zinc-500 text-sm">${d}</div>`).join('')}`;
  for (let i = 0; i < firstDay; i++) { grid += `<div></div>`; }
  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    let dayEvents = state.events.filter(e => e.date === currentDateStr); if (context === 'client' && state.currentUser) { dayEvents = dayEvents.filter(e => e.assignedCC === state.currentUser.cc); }
    let baseClass = "w-10 h-10 md:w-12 md:h-12 mx-auto flex items-center justify-center rounded-full text-sm md:text-base font-black cursor-pointer transition-all duration-300 relative z-10 ";
    if (dayEvents.length > 0) { const allAttended = dayEvents.every(e => e.attendance === 'attended'); const anyMissed = dayEvents.some(e => e.attendance === 'missed');
        if (allAttended) { baseClass += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"; } else if (anyMissed) { baseClass += "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"; } else { baseClass += "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.6)]"; }
    } else if (currentDateStr === todayStr) { baseClass += "border-2 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)]"; } else { baseClass += "text-zinc-400 hover:bg-zinc-800 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"; }
    grid += `<div onclick="showEventModal('${currentDateStr}', '${context}')" class="${baseClass}">${i}</div>`;
  }
  grid += `</div>`; return `<div class="card-depth p-6 md:p-8 rounded-[2rem] border border-cyan-500/20 max-w-lg mx-auto shadow-[0_0_25px_rgba(0,229,255,0.05)] mb-8 relative z-10"><div class="flex justify-between items-center mb-6"><button onclick="changeMonth(-1)" class="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-left"></i></button><h3 class="text-base md:text-lg font-black text-white tracking-widest drop-shadow-md">${monthName} <span class="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">${year}</span></h3><button onclick="changeMonth(1)" class="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-chevron-right"></i></button></div>${grid}</div>`;
}

window.filterUserSearch = function(query) { 
  const resultsDiv = document.getElementById('ev_cc_results'); const hiddenInput = document.getElementById('ev_assigned_cc');
  if(!query) { resultsDiv.classList.add('hidden'); hiddenInput.value=''; return; } const matches = state.clients.filter(c => c.cc.includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase()));
  if(matches.length > 0) { resultsDiv.innerHTML = matches.map(m => `<div onclick="selectEventUser('${m.cc}', '${m.name.replace(/'/g,"\\'")}')" class="p-3 hover:bg-zinc-800 cursor-pointer text-sm text-white font-medium border-b border-zinc-800 last:border-0">${m.name} <br><span class="text-cyan-400 font-mono text-xs drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">(CC: ${m.cc})</span></div>`).join(''); resultsDiv.classList.remove('hidden'); } else { resultsDiv.innerHTML = `<div class="p-4 text-sm text-zinc-500 font-medium">Sin resultados</div>`; resultsDiv.classList.remove('hidden'); }
};
window.selectEventUser = function(cc, name) { document.getElementById('ev_cc_search').value = `${name}`; document.getElementById('ev_assigned_cc').value = cc; document.getElementById('ev_cc_results').classList.add('hidden'); };

window.saveActivity = function(e, date) { 
    e.preventDefault(); 
    const name = document.getElementById('ev_name').value;
    const start = document.getElementById('ev_start').value;
    const end = document.getElementById('ev_end').value;
    const cc = document.getElementById('ev_assigned_cc').value || null; 
    
    if(!name || !start || !end) return; 

    const toMins = (t) => { const [h,m] = t.split(':'); return parseInt(h)*60 + parseInt(m); };
    const nStart = toMins(start);
    const nEnd = toMins(end);

    const dayEvents = state.events.filter(ev => ev.date === date);
    const hasOverlap = dayEvents.some(ev => {
        const eStart = toMins(ev.startTime);
        const eEnd = toMins(ev.endTime);
        return (nStart < eEnd && nEnd > eStart);
    });

    if (hasOverlap) {
        showModalError("Ya existe una cita agendada que se cruza con este horario. Por favor, selecciona otra hora.", null);
        return;
    }

    state.events.push({ id: Date.now(), date, name, startTime: start, endTime: end, assignedCC: cc, attendance: 'pending' }); 
    syncEventsToDB(); 
    closeModal(); 
    renderMainContent(); 
};

window.deleteEvent = function(id) { state.events = state.events.filter(e => e.id !== id); syncEventsToDB(); closeModal(); renderMainContent(); };
window.markAttendance = function(id, status) { const event = state.events.find(e => e.id === id); if(event) { event.attendance = status; syncEventsToDB(); closeModal(); renderMainContent(); } };

window.showEventModal = function(dateStr, context) { 
  let dayEvents = state.events.filter(e => e.date === dateStr); if (context === 'client' && state.currentUser) { dayEvents = dayEvents.filter(e => e.assignedCC === state.currentUser.cc); }
  let existingHTML = ''; 
  if(dayEvents.length > 0) { 
      existingHTML = `<div class="mb-6 space-y-4"><h4 class="text-xs text-zinc-400 font-bold uppercase tracking-widest border-b border-zinc-800/50 pb-2">Actividades Programadas:</h4>${dayEvents.map(e => { let bgColor = "bg-zinc-900/50", borderColor = "border-zinc-800", shadowColor = ""; if(e.attendance === 'attended') { bgColor = "bg-emerald-900/10"; borderColor = "border-emerald-500/50"; shadowColor="shadow-[0_0_10px_rgba(16,185,129,0.1)]"; } if(e.attendance === 'missed') { bgColor = "bg-red-900/10"; borderColor = "border-red-500/50"; shadowColor="shadow-[0_0_10px_rgba(239,68,68,0.1)]"; } return `<div class="inner-depth p-5 rounded-2xl flex flex-col gap-3 border ${borderColor} ${bgColor} ${shadowColor}"><div class="flex justify-between items-start"><div><strong class="text-white text-base drop-shadow-md">${e.name}</strong><br><span class="text-sm text-zinc-400 mt-1 block font-medium"><i class="fa-regular fa-clock text-zinc-500"></i> ${e.startTime} - ${e.endTime}</span>${e.assignedCC ? `<span class="text-cyan-400 font-bold text-xs mt-2 block drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">Cédula asignada: ${e.assignedCC}</span>` : ''}</div>${context === 'admin' ? `<button onclick="deleteEvent(${e.id})" class="text-zinc-500 hover:text-red-500 bg-black p-2 rounded-lg border border-red-500/20 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] transition"><i class="fa-solid fa-trash"></i></button>` : ''}</div><div class="flex gap-3 mt-3 pt-3 border-t border-zinc-800/50"><button onclick="markAttendance(${e.id}, 'attended')" class="flex-1 py-2 rounded-xl text-xs font-black transition ${e.attendance === 'attended' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#050505] text-zinc-400 border border-zinc-700 hover:text-emerald-400 hover:border-emerald-500/50'}"><i class="fa-solid fa-check"></i> Asistió</button><button onclick="markAttendance(${e.id}, 'missed')" class="flex-1 py-2 rounded-xl text-xs font-black transition ${e.attendance === 'missed' ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-[#050505] text-zinc-400 border border-zinc-700 hover:text-red-400 hover:border-red-500/50'}"><i class="fa-solid fa-xmark"></i> Faltó</button></div></div>`}).join('')}</div>`; 
  } else { existingHTML = `<div class="flex flex-col items-center justify-center p-8 text-center opacity-80 animate-fade-in"><i class="fa-regular fa-calendar-xmark text-5xl text-cyan-500/30 mb-4 animate-float drop-shadow-[0_0_10px_rgba(0,229,255,0.2)]"></i><p class="text-sm text-zinc-400 font-medium">Sin actividades para esta fecha.</p></div>`; }
  
  if (context === 'client') { openModal(`<div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-calendar-day"></i> Actividades</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div><p class="text-sm text-zinc-400 mb-4 font-bold">Fecha: <span class="text-white">${dateStr}</span></p>${existingHTML}`); return; }
  openModal(`<div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4"><h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-calendar-plus"></i> Gestión de Fecha</h3><button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button></div><p class="text-sm text-zinc-400 mb-4 font-bold">Fecha: <span class="text-white">${dateStr}</span></p>${existingHTML}<form onsubmit="saveActivity(event, '${dateStr}')" class="space-y-4 pt-6 border-t border-zinc-800/80"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Nombre Actividad</label><input type="text" id="ev_name" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Hora Inicio</label><input type="time" id="ev_start" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div><div><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Hora Fin</label><input type="time" id="ev_end" required class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" /></div></div><div class="relative"><label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Asignar a Cliente (Opcional)</label><input type="text" id="ev_cc_search" onkeyup="filterUserSearch(this.value)" placeholder="Buscar por nombre o CC..." class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium" autocomplete="off" /><div id="ev_cc_results" class="absolute w-full z-10 max-h-40 overflow-y-auto bg-[#0a0a0a] border border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.2)] rounded-xl mt-1 hidden custom-scrollbar"></div><input type="hidden" id="ev_assigned_cc"></div><button type="submit" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]">Guardar Actividad</button></form>`);
};

// ==========================================
// PANEL DE ADMINISTRADOR COMPLETO
// ==========================================
window.switchAdminTab = function(tab) { state.adminTab = tab; state.viewingClientAsAdmin = false; renderMainContent(); };
function renderAdminDashboard() { 
  const activeClients = state.clients.filter(c => c.status !== 'inactive'); const inactiveClients = state.clients.filter(c => c.status === 'inactive');
  return `<div class="space-y-8 animate-fade-in pb-10"><div class="flex flex-wrap gap-3 border-b border-zinc-900 pb-6 mb-4"><button onclick="switchAdminTab('profile')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'profile' ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-cyan-500/50'}"><i class="fa-solid fa-id-card"></i> Perfil</button><button onclick="switchAdminTab('calendar')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'calendar' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-yellow-400/50'}"><i class="fa-solid fa-calendar-days"></i> Calendario</button><button onclick="switchAdminTab('active_clients')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'active_clients' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-emerald-500/50'}"><i class="fa-solid fa-users"></i> Activos (${activeClients.length})</button><button onclick="switchAdminTab('inactive_clients')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'inactive_clients' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-500/50'}"><i class="fa-solid fa-user-slash"></i> Inactivos (${inactiveClients.length})</button><button onclick="switchAdminTab('inventory')" class="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${state.adminTab === 'inventory' ? 'bg-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-[#0a0a0a] border border-zinc-800 text-zinc-400 hover:text-white hover:border-white/50'}"><i class="fa-solid fa-dumbbell"></i> Máquinas</button></div>
      ${state.adminTab === 'profile' ? `<div class="card-depth border border-cyan-500/20 rounded-[2rem] p-10 max-w-2xl mx-auto space-y-8 shadow-[0_0_20px_rgba(0,229,255,0.05)]"><div class="flex items-center gap-5 border-b border-zinc-800/50 pb-6"><div class="w-16 h-16 inner-depth text-cyan-400 rounded-full flex items-center justify-center text-2xl drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"><i class="fa-solid fa-user-shield"></i></div><div><h3 class="text-2xl font-black text-white drop-shadow-md">Perfil Entrenador</h3><p class="text-sm text-zinc-400 mt-1 font-medium">Administración del sistema</p></div></div><div class="space-y-4 text-sm"><div class="inner-depth p-5 rounded-2xl flex justify-between items-center"><span class="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nombre Completo:</span><span class="font-bold text-white text-base drop-shadow-md">${state.currentUser.name}</span></div><div class="inner-depth p-5 rounded-2xl flex justify-between items-center"><span class="text-zinc-500 font-bold uppercase tracking-widest text-xs">Cédula Asignada:</span><span class="font-bold text-cyan-400 font-mono text-base drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">${state.currentUser.cc}</span></div></div></div>` : ''}
      ${state.adminTab === 'calendar' ? renderCalendarHTML('admin') : ''}
      ${state.adminTab === 'active_clients' ? renderActiveClientsTab(activeClients) : ''}
      ${state.adminTab === 'inactive_clients' ? renderInactiveClientsTab(inactiveClients) : ''}
      ${state.adminTab === 'inventory' ? `<div class="card-depth border border-zinc-500/20 rounded-[2rem] p-8 max-w-3xl mx-auto space-y-6"><h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md"><span class="p-2.5 bg-zinc-800 rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.1)]"><i class="fa-solid fa-dumbbell text-zinc-300"></i></span> Inventario de Máquinas</h3><div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">${state.inventory.map((item, idx) => `<div class="flex justify-between items-center inner-depth p-4 rounded-xl text-sm"><span class="text-zinc-200 font-medium">${item}</span><button onclick="state.inventory.splice(${idx},1); syncSettingsToDB(); renderMainContent();" class="text-zinc-500 hover:text-red-500 bg-[#050505] p-3 rounded-lg border border-zinc-800 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.3)] transition"><i class="fa-solid fa-trash-can"></i></button></div>`).join('')}</div><div class="flex flex-col md:flex-row gap-3 pt-6 border-t border-zinc-800/80"><input type="text" id="new-machine" placeholder="Nombre de nueva máquina..." class="flex-1 input-gym rounded-xl px-4 py-3 text-sm text-white font-medium" /><button onclick="const v=document.getElementById('new-machine').value; if(v){state.inventory.push(v); syncSettingsToDB(); renderMainContent();}" class="btn-depth bg-zinc-200 text-black px-8 py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">+ Añadir Equipo</button></div></div>` : ''}
    </div>`;
}

// ==========================================
// FILTRO EN TIEMPO REAL PARA LA TABLA DE CLIENTES
// ==========================================
window.filterClientsTable = function(query) {
    const q = query.toLowerCase().trim();
    // Filtramos las filas de la tabla de escritorio
    const desktopRows = document.querySelectorAll('#desktop-clients-table tbody tr');
    desktopRows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(q)) row.style.display = '';
        else row.style.display = 'none';
    });
    
    // Filtramos las tarjetas de la vista móvil
    const mobileCards = document.querySelectorAll('#mobile-clients-list > div');
    mobileCards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(q)) card.style.display = '';
        else card.style.display = 'none';
    });
};

// ==========================================
// RENDERIZADO DE CLIENTES ACTIVOS
// ==========================================
function renderActiveClientsTab(clients) { 
  // Botones de acción y barra de búsqueda
  const headerActions = `
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4 w-full">
        <h3 class="text-xl font-bold text-white flex items-center gap-3 drop-shadow-md whitespace-nowrap">
            <span class="p-2.5 bg-cyan-500/10 rounded-xl shadow-[0_0_10px_rgba(0,229,255,0.2)]"><i class="fa-solid fa-users text-cyan-400"></i></span> 
            Usuarios Activos
        </h3>
        
        <!-- BUSCADOR -->
        <div class="relative w-full md:max-w-xs flex-1 shrink-0">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-magnifying-glass text-zinc-500"></i>
            </div>
            <input type="text" onkeyup="filterClientsTable(this.value)" placeholder="Buscar por nombre o CC..." class="w-full bg-[#050505] border border-zinc-800 text-white text-sm rounded-xl focus:border-cyan-500 block pl-10 p-2.5 outline-none transition-colors shadow-inner placeholder-zinc-600">
        </div>

        <!-- BOTONES FIX: Quitamos overflow-x-auto y usamos flex-wrap -->
        <div class="flex flex-wrap gap-3 w-full md:w-auto justify-start md:justify-end shrink-0">
            <button onclick="showBulkImportModal()" class="flex-1 md:flex-none bg-yellow-400 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-[0_0_10px_rgba(255,215,0,0.3)] hover:scale-105 transition flex items-center justify-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-file-import"></i> Importar Excel
            </button>
            <button onclick="showClientRegisterModal()" class="flex-1 md:flex-none bg-cyan-500 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-[0_0_10px_rgba(0,229,255,0.3)] hover:scale-105 transition flex items-center justify-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-user-plus"></i> Nuevo Usuario
            </button>
        </div>
    </div>
  `;

  if (clients.length === 0) return `<div class="flex flex-col items-center justify-center p-16 opacity-80 animate-fade-in"><i class="fa-solid fa-user-astronaut text-6xl text-cyan-500/30 mb-6 animate-float drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]"></i><p class="text-base text-zinc-400 font-medium mb-6">Aún no tienes usuarios activos registrados.</p><div class="flex justify-center">${headerActions}</div></div>`;
  
  return `
    <div class="space-y-4">
        ${headerActions}
        
        <!-- VISTA MÓVIL -->
        <div id="mobile-clients-list" class="block md:hidden space-y-4">
            ${clients.map(c => { 
                const daysLeft = Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24)); 
                return `
                <div class="card-depth p-5 rounded-[2rem] flex flex-col gap-4 border border-cyan-500/20">
                    <div class="flex justify-between items-start">
                        <div>
                            <strong class="text-white text-base drop-shadow-md">${c.name}</strong><br>
                            <span class="text-xs text-cyan-400 font-mono mt-1 block drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">CC: ${c.cc}</span>
                        </div>
                        <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-md ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}">${daysLeft < 0 ? 'VENCIDO' : daysLeft + ' días'}</span>
                    </div>
                    <div class="bg-[#050505] p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex justify-around font-medium">
                        <span>Peso: <strong class="text-white">${c.bia.weight}kg</strong></span>
                        <span>Grasa: <strong class="text-white">${c.bia.fat}%</strong></span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewClientRoutine('${c.cc}')" class="flex-1 bg-cyan-500 text-black py-2.5 rounded-xl text-xs font-black shadow-[0_0_10px_rgba(0,229,255,0.3)]"><i class="fa-solid fa-eye"></i> Ver / Editar</button>
                        <button onclick="toggleClientStatus('${c.cc}', 'inactive')" class="flex-1 bg-[#050505] text-zinc-400 border border-zinc-700 py-2.5 rounded-xl text-xs font-bold hover:text-red-400 hover:border-red-500/50 transition"><i class="fa-solid fa-user-slash"></i> Inactivar</button>
                    </div>
                </div>` 
            }).join('')}
        </div>

        <!-- VISTA ESCRITORIO -->
        <div class="hidden md:block card-depth rounded-[2rem] p-8 overflow-x-auto border border-cyan-500/20 custom-scrollbar">
            <table id="desktop-clients-table" class="w-full text-left text-sm text-zinc-300">
                <thead class="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-800">
                    <tr><th class="p-4 font-bold">Cliente</th><th class="p-4 font-bold">Vencimiento</th><th class="p-4 font-bold">Datos BIA</th><th class="p-4 font-bold text-center">Acciones</th></tr>
                </thead>
                <tbody class="divide-y divide-zinc-800/50">
                    ${clients.map(c => { 
                        const daysLeft = Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24)); 
                        return `
                        <tr class="hover:bg-[#0a0a0a] transition-all">
                            <td class="p-4">
                                <strong class="text-white drop-shadow-md">${c.name}</strong><br>
                                <span class="text-xs text-cyan-400 font-mono drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">CC: ${c.cc}</span>
                            </td>
                            <td class="p-4">
                                <span class="px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${daysLeft < 0 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}">${c.dueDate} (${daysLeft < 0 ? 'VENCIDO' : daysLeft + ' días'})</span>
                            </td>
                            <td class="p-4 text-xs text-zinc-400 font-medium">
                                Peso: <strong class="text-white">${c.bia.weight}kg</strong> | Grasa: <strong class="text-white">${c.bia.fat}%</strong>
                            </td>
                            <td class="p-4 text-center space-x-2 whitespace-nowrap">
                                <button onclick="viewClientRoutine('${c.cc}')" class="bg-cyan-500 text-black px-6 py-2.5 rounded-full text-xs font-extrabold hover:scale-105 transition shadow-[0_0_10px_rgba(0,229,255,0.4)]"><i class="fa-solid fa-eye"></i> Ver / Editar</button>
                                <button onclick="toggleClientStatus('${c.cc}', 'inactive')" class="bg-[#050505] text-zinc-300 border border-zinc-700 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 hover:text-red-400 hover:border-red-500/50 transition"><i class="fa-solid fa-user-slash"></i> Inactivar</button>
                            </td>
                        </tr>`; 
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}
function renderInactiveClientsTab(clients) { 
  if (clients.length === 0) return `<div class="flex flex-col items-center justify-center p-16 opacity-80 animate-fade-in"><i class="fa-solid fa-user-shield text-6xl text-red-500/30 mb-6 animate-float drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]"></i><p class="text-base text-zinc-400 font-medium">No hay usuarios inactivos o retirados.</p></div>`;
  return `<div class="space-y-4"><h3 class="text-xl font-bold text-white flex items-center gap-3 px-2 drop-shadow-md"><span class="p-2.5 bg-red-500/10 rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.2)]"><i class="fa-solid fa-user-slash text-red-400"></i></span> Inactivos</h3><div class="block md:hidden space-y-4">${clients.map(c => `<div class="card-depth p-5 rounded-[2rem] flex flex-col gap-4 border border-red-500/30"><div class="flex justify-between items-start"><div><strong class="text-white text-base drop-shadow-md">${c.name}</strong><br><span class="text-xs text-red-400 font-mono mt-1 block drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">CC: ${c.cc}</span></div><span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase bg-[#050505] border border-zinc-800 text-zinc-500 shadow-md">Inactivo</span></div><div class="text-xs text-zinc-500 font-medium"><i class="fa-regular fa-calendar"></i> Última Eval: ${c.date}</div><div class="flex gap-2"><button onclick="toggleClientStatus('${c.cc}', 'active')" class="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-2.5 rounded-xl text-xs font-bold transition hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_10px_rgba(16,185,129,0.4)]"><i class="fa-solid fa-user-check"></i> Reactivar</button><button onclick="confirmDeleteUser('${c.cc}')" class="flex-1 bg-red-900/40 text-red-400 border border-red-500/50 py-2.5 rounded-xl text-xs font-bold transition hover:bg-red-600 hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]"><i class="fa-solid fa-trash-can"></i> Borrar</button></div></div>`).join('')}</div><div class="hidden md:block card-depth rounded-[2rem] p-8 overflow-x-auto border border-red-500/30"><table class="w-full text-left text-sm text-zinc-300"><thead class="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-800"><tr><th class="p-4 font-bold">Cliente</th><th class="p-4 font-bold">Última Eval</th><th class="p-4 font-bold">Estado</th><th class="p-4 font-bold text-center">Acciones</th></tr></thead><tbody class="divide-y divide-zinc-800/50">${clients.map(c => `<tr class="hover:bg-[#0a0a0a] transition-all"><td class="p-4"><strong class="text-white drop-shadow-md">${c.name}</strong><br><span class="text-xs text-red-400 font-mono drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">CC: ${c.cc}</span></td><td class="p-4 text-zinc-400 font-medium">${c.date}</td><td class="p-4"><span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#050505] border border-zinc-800 text-zinc-500 shadow-md">Inactivo</span></td><td class="p-4 text-center space-x-2 whitespace-nowrap"><button onclick="toggleClientStatus('${c.cc}', 'active')" class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-black transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"><i class="fa-solid fa-user-check"></i> Reactivar</button><button onclick="confirmDeleteUser('${c.cc}')" class="bg-red-900/40 text-red-400 border border-red-500/50 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-red-600 hover:text-white transition shadow-[0_0_10px_rgba(239,68,68,0.2)]"><i class="fa-solid fa-trash-can"></i> Borrar</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

window.toggleClientStatus = function(cc, status) { const c = state.clients.find(x => x.cc === cc); if (c) { c.status = status; syncClientToDB(c); renderMainContent(); } };
window.viewClientRoutine = function(cc) { const c = state.clients.find(x => x.cc === cc); if (c) { state.viewingClientAsAdmin = true; state.selectedClientRecord = c; renderMainContent(); } };
window.backToAdminPanel = function() { state.viewingClientAsAdmin = false; state.selectedClientRecord = null; renderMainContent(); };
window.confirmDeleteUser = function(cc) {
  const client = state.clients.find(c => c.cc === cc); if (!client) return;
  openModal(`<div class="text-center space-y-6 py-4"><div class="w-20 h-20 inner-depth text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl border border-red-500/50 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"><i class="fa-solid fa-trash-can"></i></div><div><h3 class="text-lg font-bold text-white mb-2">¿Borrar Definitivamente?</h3><p class="text-sm text-zinc-400 leading-relaxed max-w-[90%] mx-auto font-medium">Se eliminarán los datos de <strong class="text-white">${client.name}</strong>, pero su progreso se guardará en el historial del sistema.</p></div><div class="flex gap-3 pt-4"><button onclick="closeModal()" class="flex-1 card-depth border border-zinc-800 text-zinc-300 py-3.5 rounded-xl text-sm font-bold">Cancelar</button><button onclick="deleteUserPermanently('${cc}')" class="flex-1 btn-depth bg-red-600 text-white py-3.5 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(239,68,68,0.4)]">Sí, Borrar</button></div></div>`);
};
window.deleteUserPermanently = function(cc) { 
  const client = state.clients.find(c => c.cc === cc);
  if(client && client.evaluations) { state.historyDB[cc] = client.evaluations; syncHistoryToDB(); }
  state.clients = state.clients.filter(c => c.cc !== cc); deleteClientFromDB(cc); closeModal(); renderMainContent(); 
};

window.toggleProgressChart = function() { const w = document.getElementById('chart-wrapper'), i = document.getElementById('chart-toggle-icon'), t = document.getElementById('chart-toggle-text'); if (w.classList.contains('hidden')) { w.classList.remove('hidden'); i.classList.replace('fa-chevron-down', 'fa-chevron-up'); t.innerText = 'Ocultar'; } else { w.classList.add('hidden'); i.classList.replace('fa-chevron-up', 'fa-chevron-down'); t.innerText = 'Mostrar'; } };

window.initProgressChart = function() { 
    const c = state.viewingClientAsAdmin ? state.selectedClientRecord : (state.clients.find(x => x.cc === state.currentUser.cc) || state.currentUser.record); 
    if (!c || !c.evaluations || c.evaluations.length === 0) return; 
    const ctx = document.getElementById('progressChart'); if (!ctx) return; 
    if (progressChartInstance) progressChartInstance.destroy(); 
    
    const labels = c.evaluations.map(e => e.date); 
    const weightData = c.evaluations.map(e => e.weight);
    const fatData = c.evaluations.map(e => e.fat); 
    const muscleData = c.evaluations.map(e => e.muscle); 
    const bmiData = c.evaluations.map(e => e.bmi); 
    
    progressChartInstance = new Chart(ctx, { 
        type: 'line', 
        data: { 
            labels, 
            datasets: [ 
                { label: 'Peso (kg)', data: weightData, borderColor: '#eab308', backgroundColor: '#eab308', tension: 0.3, borderWidth: 3, spanGaps: false },
                { label: '% Grasa', data: fatData, borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.3, borderWidth: 3, spanGaps: false }, 
                { label: 'Músculo', data: muscleData, borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.3, borderWidth: 3, spanGaps: false }, 
                { label: 'IMC', data: bmiData, borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.3, borderWidth: 3, spanGaps: false } 
            ] 
        }, 
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { labels: { color: '#fff', font: { family: 'Outfit', weight: 'bold' } } } }, 
            scales: { x: { ticks: { color: '#6b7280' }, grid: { color: '#111' } }, y: { ticks: { color: '#6b7280' }, grid: { color: '#111' } } } 
        } 
    }); 
};

window.logout = function() { state.currentUser = null; state.viewingClientAsAdmin = false; localStorage.removeItem('gym_session'); renderNavbar(); renderMainContent(); };

// ==========================================
// IMPORTADOR MASIVO DESDE EXCEL Y CAMBIO DE PLAN
// ==========================================

window.showBulkImportModal = function() {
    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]"><i class="fa-solid fa-file-excel"></i> Importar desde Excel</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="space-y-4">
            <div class="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
                <p class="text-xs text-blue-400 font-bold"><i class="fa-solid fa-circle-info"></i> Copia las filas de tu Excel y pégalas abajo. Asegúrate de que las columnas estén en este orden exacto:</p>
                <p class="text-[10px] text-white font-mono mt-2 bg-black/50 p-2 rounded tracking-widest text-center">CC | NOMBRE | GENERO | FECHA INICIO | FECHA FINAL | OBJETIVO | PLAN</p>
            </div>
            <textarea id="bulk_data" rows="8" class="w-full bg-[#0a0a0a] border border-zinc-700 focus:border-yellow-400 rounded-xl p-3 text-xs text-zinc-300 font-mono custom-scrollbar" placeholder="Ejemplo:
1022991234	Juan Perez	M	01/10/2026	01/11/2026	Bajar Grasa	Mensualidad Básica..."></textarea>
            
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">¿A qué Plan de Gym Finity Pro los asignamos por defecto?</label>
                <select id="bulk_new_plan" class="w-full input-gym rounded-xl p-3 text-sm text-white font-medium border-yellow-500/50">
                    ${gymPlans.map(p => `<option value="${p.id}">${p.id} - ${p.price}</option>`).join('')}
                </select>
            </div>

            <button onclick="processBulkImport()" class="w-full btn-depth bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-sm mt-2 shadow-[0_0_15px_rgba(255,215,0,0.4)]"><i class="fa-solid fa-rocket"></i> Migrar Usuarios Ahora</button>
        </div>
    `);
};

window.processBulkImport = function() {
    const data = document.getElementById('bulk_data').value.trim();
    if (!data) return alert("Pega los datos del Excel primero.");

    const newPlanId = document.getElementById('bulk_new_plan').value;
    const userPlan = gymPlans.find(p => p.id === newPlanId) || gymPlans[0];
    const rows = data.split('\n');
    let importedCount = 0;

    const loader = document.getElementById('loading-screen');
    if(loader) { loader.classList.remove('hide-loader'); loader.style.opacity = '1'; loader.style.visibility = 'visible'; loader.style.zIndex = '100000'; loader.querySelector('h1').innerHTML = '<span class="text-yellow-400 animate-pulse">MIGRANDO USUARIOS...</span>'; }

    rows.forEach(row => {
        const cols = row.split('\t'); 
        if (cols.length >= 7) { 
            const cc = cols[0].trim();
            const name = cols[1].trim();
            const gender = cols[2].trim().toUpperCase().startsWith('F') ? 'F' : 'M';
            const dateIn = cols[3].trim();
            const dateOut = cols[4].trim();
            const obj = cols[5].trim();
            const oldPlan = cols[6].trim();

            let dueDate = dateOut; 
            if (dateOut.includes('/')) {
                const parts = dateOut.split('/');
                if(parts.length === 3) {
                    dueDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`; 
                }
            } else if (dateOut.includes('-') && dateOut.split('-')[0].length === 2) {
                const parts = dateOut.split('-');
                dueDate = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }

            const aiRoutine = generateAiWorkout(obj, "4", "Intermedio", state.inventory);
            
            // AQUÍ YA ESTÁ INTEGRADO EL TEMPORIZADOR "migratedAt"
            const newRecord = {
                cc: cc, name: name, age: 25, gender: gender, 
                dueDate: dueDate, status: 'active', date: dateIn, profilePic: null, 
                plan: userPlan, exerciseHistory: {}, 
                bia: { weight: 70, height: 170, fat: 20, muscle: 30, bmi: "24.2", objective: obj }, 
                workout: aiRoutine, days: "4", level: "Intermedio", evaluations: [],
                isMigrated: true, 
                oldPlanName: oldPlan,
                migratedAt: new Date().toISOString() // Temporizador automático de 30 días
            };

            const existingIdx = state.clients.findIndex(c => c.cc === cc);
            if (existingIdx >= 0) state.clients[existingIdx] = newRecord; 
            else state.clients.push(newRecord);
            
            syncClientToDB(newRecord);
            importedCount++;
        }
    });

    setTimeout(() => {
        if(loader) { loader.classList.add('hide-loader'); setTimeout(() => { loader.style = ''; }, 600); }
        closeModal();
        alert(`¡Éxito! Se migraron ${importedCount} usuarios pioneros correctamente.`);
        renderMainContent();
    }, 1500);
};

// ==========================================
// CAMBIAR PLAN DE USUARIO DESDE EL PERFIL
// ==========================================
window.showChangePlanModal = function(cc) {
    const client = state.clients.find(c => c.cc === cc);
    if(!client) return;
    
    const planOptions = gymPlans.map(p => `<option value="${p.id}" ${client.plan.id === p.id ? 'selected' : ''}>${p.id} - ${p.price}</option>`).join('');
    
    openModal(`
        <div class="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
            <h3 class="text-lg font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"><i class="fa-solid fa-exchange-alt"></i> Asignar Nuevo Plan</h3>
            <button onclick="closeModal()" class="text-zinc-500 hover:text-white"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <form onsubmit="saveNewUserPlan(event, '${cc}')" class="space-y-4">
            <p class="text-xs text-zinc-400 font-medium mb-4">Selecciona el plan definitivo al que deseas trasladar al usuario <strong class="text-white">${client.name}</strong>.</p>
            <div>
                <label class="block text-xs font-bold text-zinc-400 mb-1.5 ml-1">Seleccionar Plan</label>
                <select id="edit_u_plan" class="w-full input-gym rounded-xl p-3.5 text-sm text-white font-medium border-cyan-500/50">
                    ${planOptions}
                </select>
            </div>
            <button type="submit" class="w-full btn-depth bg-cyan-500 text-black font-extrabold py-4 rounded-xl text-sm mt-4 shadow-[0_0_15px_rgba(0,229,255,0.4)]">Actualizar Plan</button>
        </form>
    `);
};

window.saveNewUserPlan = function(e, cc) {
    e.preventDefault();
    const newPlanId = document.getElementById('edit_u_plan').value;
    const newPlan = gymPlans.find(p => p.id === newPlanId);
    const client = state.clients.find(c => c.cc === cc);
    
    if(client && newPlan) {
        client.plan = newPlan;
        syncClientToDB(client);
        closeModal();
        renderMainContent();
    }
};
// =========================================================================
// PUNTO 1 Y 2: MODAL EDITAR USUARIO (SIN TBW, R, XC + FECHAS BLOQUEADAS PARA CLIENTE)
// =========================================================================
window.openEditProfileModal = function() {
    const isAdminViewing = state.viewingClientAsAdmin; 
    const clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    if (!clientData) return;
    const bia = clientData.bia || {};

    // Formatear la fecha de registro para el input date
    let regDateInput = '';
    if (clientData.date && clientData.date.includes('/')) {
        const parts = clientData.date.split('/');
        if (parts.length === 3) regDateInput = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (clientData.date && clientData.date.includes('-')) {
        regDateInput = clientData.date; 
    }

    const planDays = clientData.plan && clientData.plan.durationDays ? clientData.plan.durationDays : 30;

    // PUNTO 2: Solo el entrenador (isAdminViewing) puede editar la fecha de registro
    const regDateInputHtml = isAdminViewing 
        ? `<input type="date" id="edit_reg_date" value="${regDateInput}" onchange="updateDueDatePreview(this.value, ${planDays})" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition" />`
        : `<input type="date" id="edit_reg_date" value="${regDateInput}" disabled class="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl p-2.5 text-sm text-zinc-500 outline-none cursor-not-allowed" />`;

    let html = `
        <div class="bg-[#050505] border border-zinc-800 rounded-[2rem] p-6 md:p-8 max-w-lg mx-auto w-full shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onclick="closeModal()" class="absolute top-4 right-4 w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition z-50">
                <i class="fa-solid fa-xmark"></i>
            </button>
            
            <h3 class="text-lg font-black text-white uppercase mb-5 tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-pen text-cyan-400"></i> Editar Datos de Usuario
            </h3>

            <div class="space-y-5">
                <!-- DATOS PERSONALES -->
                <div class="border-b border-zinc-800/80 pb-5">
                    <p class="text-[11px] font-black text-cyan-400 mb-3 uppercase tracking-widest">Datos Generales</p>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Nombre Completo</label>
                            <input type="text" id="edit_name" value="${clientData.name || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition" />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Edad</label>
                                <input type="number" id="edit_age" value="${clientData.age || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition" />
                            </div>
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Sexo</label>
                                <select id="edit_gender" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-cyan-500 outline-none transition">
                                    <option value="M" ${clientData.gender === 'M' ? 'selected' : ''}>Masc.</option>
                                    <option value="F" ${clientData.gender === 'F' ? 'selected' : ''}>Fem.</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Fecha de Registro</label>
                                ${regDateInputHtml}
                            </div>
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Vencimiento</label>
                                <input type="date" id="edit_due" value="${clientData.dueDate || ''}" disabled class="w-full bg-zinc-900 border border-zinc-800/60 rounded-xl p-2.5 text-sm text-zinc-500 outline-none cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    <!-- PUNTO 1: PARÁMETROS BIA (SOLO PESO, ESTATURA, GRASA Y MÚSCULO) -->
                    <div>
                        <p class="text-[11px] font-black text-yellow-400 mb-3 uppercase tracking-widest">Parámetros BIA</p>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Peso (kg)</label>
                                <input type="number" step="0.1" id="edit_bia_weight" value="${bia.weight || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-yellow-400 outline-none transition" />
                            </div>
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Estatura (cm)</label>
                                <input type="number" id="edit_bia_height" value="${bia.height || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-yellow-400 outline-none transition" />
                            </div>
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">% Grasa</label>
                                <input type="number" step="0.1" id="edit_bia_fat" value="${bia.fat || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-yellow-400 outline-none transition" />
                            </div>
                            <div>
                                <label class="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Músculo (kg)</label>
                                <input type="number" step="0.1" id="edit_bia_muscle" value="${bia.muscle || ''}" class="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-sm text-white focus:border-yellow-400 outline-none transition" />
                            </div>
                        </div>
                    </div>

                    <button onclick="saveEditedProfile()" class="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase tracking-widest py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                        <i class="fa-solid fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </div>
        `;
    openModal(html);
};

window.updateDueDatePreview = function(regDateStr, durationDays) {
    if (!regDateStr) return;
    const [y, m, d] = regDateStr.split('-');
    const dateObj = new Date(y, parseInt(m) - 1, d);
    dateObj.setDate(dateObj.getDate() + durationDays);
    const dueY = dateObj.getFullYear();
    const dueM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dueD = String(dateObj.getDate()).padStart(2, '0');
    document.getElementById('edit_due').value = `${dueY}-${dueM}-${dueD}`;
};

window.saveEditedProfile = function() {
    const isAdminViewing = state.viewingClientAsAdmin; 
    let clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    clientData.name = document.getElementById('edit_name').value.trim();
    clientData.age = document.getElementById('edit_age').value;
    clientData.gender = document.getElementById('edit_gender').value;
    
    if (isAdminViewing) {
        const regDateStr = document.getElementById('edit_reg_date').value;
        if (regDateStr) {
            const [y, m, d] = regDateStr.split('-');
            clientData.date = `${d}/${m}/${y}`;
        }
        clientData.dueDate = document.getElementById('edit_due').value;
    }

    clientData.bia = clientData.bia || {};
    clientData.bia.weight = parseFloat(document.getElementById('edit_bia_weight').value);
    clientData.bia.height = parseFloat(document.getElementById('edit_bia_height').value);
    clientData.bia.fat = parseFloat(document.getElementById('edit_bia_fat').value);
    clientData.bia.muscle = parseFloat(document.getElementById('edit_bia_muscle').value);
    
    if (clientData.bia.weight && clientData.bia.height) {
        clientData.bia.bmi = (clientData.bia.weight / Math.pow(clientData.bia.height / 100, 2)).toFixed(1);
    }

    if (typeof syncClientToDB === 'function') {
        syncClientToDB(clientData);
    }
    
    closeModal(); 
    if (typeof renderMainContent === 'function') {
        renderMainContent();
    }
};

// ==========================================
// FUNCIÓN PARA ACTUALIZAR VENCIMIENTO EN TIEMPO REAL
// ==========================================
window.updateDueDatePreview = function(regDateStr, durationDays) {
    if (!regDateStr) return;
    const [y, m, d] = regDateStr.split('-');
    
    // Sumar los días a la fecha seleccionada
    const dateObj = new Date(y, parseInt(m) - 1, d);
    dateObj.setDate(dateObj.getDate() + durationDays);
    
    // Construir la nueva fecha YYYY-MM-DD
    const dueY = dateObj.getFullYear();
    const dueM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dueD = String(dateObj.getDate()).padStart(2, '0');
    
    // Actualizar la vista previa deshabilitada
    document.getElementById('edit_due').value = `${dueY}-${dueM}-${dueD}`;
};

// ==========================================
// FUNCIÓN PARA GUARDAR LOS CAMBIOS DEL LÁPIZ
// ==========================================
window.saveEditedProfile = function() {
    const isAdminViewing = state.viewingClientAsAdmin; 
    let clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    // Guardar Datos Personales
    clientData.name = document.getElementById('edit_name').value.trim();
    clientData.age = document.getElementById('edit_age').value;
    clientData.gender = document.getElementById('edit_gender').value;
    
    // Guardar Fechas (Registro y Vencimiento)
    const regDateStr = document.getElementById('edit_reg_date').value;
    if (regDateStr) {
        const [y, m, d] = regDateStr.split('-');
        clientData.date = `${d}/${m}/${y}`; // Guarda el inicio en formato DD/MM/YYYY
    }
    clientData.dueDate = document.getElementById('edit_due').value; // El input desactivado mantiene la fecha automática

    // Guardar Parámetros BIA
    clientData.bia = clientData.bia || {};
    clientData.bia.weight = parseFloat(document.getElementById('edit_bia_weight').value);
    clientData.bia.height = parseFloat(document.getElementById('edit_bia_height').value);
    clientData.bia.fat = parseFloat(document.getElementById('edit_bia_fat').value);
    clientData.bia.muscle = parseFloat(document.getElementById('edit_bia_muscle').value);
    clientData.bia.tbw = parseFloat(document.getElementById('edit_bia_tbw').value);
    clientData.bia.r = parseFloat(document.getElementById('edit_bia_r').value);
    clientData.bia.xc = parseFloat(document.getElementById('edit_bia_xc').value);
    
    // Recalcular IMC dinámicamente si cambian el peso o la altura
    if (clientData.bia.weight && clientData.bia.height) {
        clientData.bia.bmi = (clientData.bia.weight / Math.pow(clientData.bia.height / 100, 2)).toFixed(1);
    }

    // Guarda en la base de datos de GymFinity
    if (typeof syncClientToDB === 'function') {
        syncClientToDB(clientData);
    }
    
    closeModal(); 
    
    // Recarga el panel para reflejar los cambios
    if (typeof renderMainContent === 'function') {
        renderMainContent();
    }
};

// ==========================================
// FUNCIÓN PARA GUARDAR LOS CAMBIOS DEL LÁPIZ
// ==========================================
window.saveEditedProfile = function() {
    const isAdminViewing = state.viewingClientAsAdmin; 
    let clientData = isAdminViewing ? state.selectedClientRecord : (state.clients.find(c => c.cc === state.currentUser.cc) || state.currentUser.record);
    
    // Guardar Datos Personales
    clientData.name = document.getElementById('edit_name').value.trim();
    clientData.age = document.getElementById('edit_age').value;
    clientData.gender = document.getElementById('edit_gender').value;
    clientData.dueDate = document.getElementById('edit_due').value;

    // Guardar Parámetros BIA
    clientData.bia = clientData.bia || {};
    clientData.bia.weight = parseFloat(document.getElementById('edit_bia_weight').value);
    clientData.bia.height = parseFloat(document.getElementById('edit_bia_height').value);
    clientData.bia.fat = parseFloat(document.getElementById('edit_bia_fat').value);
    clientData.bia.muscle = parseFloat(document.getElementById('edit_bia_muscle').value);
    clientData.bia.tbw = parseFloat(document.getElementById('edit_bia_tbw').value);
    clientData.bia.r = parseFloat(document.getElementById('edit_bia_r').value);
    clientData.bia.xc = parseFloat(document.getElementById('edit_bia_xc').value);
    
    // Recalcular IMC dinámicamente si cambian el peso o la altura
    if (clientData.bia.weight && clientData.bia.height) {
        clientData.bia.bmi = (clientData.bia.weight / Math.pow(clientData.bia.height / 100, 2)).toFixed(1);
    }

    // Guarda en la base de datos de GymFinity
    if (typeof syncClientToDB === 'function') {
        syncClientToDB(clientData);
    }
    
    closeModal(); 
    
    // Recarga el panel para reflejar los cambios
    if (typeof renderMainContent === 'function') {
        renderMainContent();
    }
};
