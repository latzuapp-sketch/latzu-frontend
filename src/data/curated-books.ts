import type { LibraryBook } from "@/types/library";

export const CURATED_BOOKS: LibraryBook[] = [
  {
    id: "eat-that-frog",
    title: "Trágate Ese Sapo",
    author: "Brian Tracy",
    year: 2001,
    category: "productividad",
    coverGradient: "from-orange-500 to-red-600",
    pages: 128,
    readMinutes: 20,
    tags: ["priorización", "ABCDE", "foco", "procrastinación"],
    summary:
      "El método definitivo para vencer la procrastinación. Tracy enseña a identificar siempre la tarea más difícil e importante (el 'sapo') y hacerla primero, antes de cualquier cosa, todos los días.",
    insights: [
      "Tu 'sapo' es la tarea A-1: la más importante y la que más temes. Cómela primero.",
      "Método ABCDE: clasifica cada tarea antes de empezar. Solo las A determinan tu éxito.",
      "La regla 80/20: el 20% de tus actividades produce el 80% de tus resultados.",
      "Planear el día anterior en papel incrementa la productividad hasta un 25%.",
      "Si tienes dos sapos, comienza por el más feo: el más difícil primero siempre.",
      "La claridad es poder: saber exactamente qué quieres elimina la vacilación.",
      "El hábito de la acción inmediata: tomar decisiones y actuar sin dudar es un músculo que se entrena.",
    ],
    aiContext: `Libro: "Trágate Ese Sapo" de Brian Tracy (2001).
CONCEPTO CENTRAL: Vencer la procrastinación identificando y ejecutando siempre primero la tarea más importante y difícil del día.

MÉTODO ABCDE:
- A = Debo hacerlo (consecuencias graves si no lo hago) — el "sapo"
- B = Debería hacerlo (consecuencias menores)
- C = Sería bueno hacerlo (sin consecuencias reales)
- D = Delegar (alguien más puede hacerlo)
- E = Eliminar (no tiene valor real)

REGLA CLAVE: Nunca hacer una tarea B cuando hay una A pendiente.

LAS 21 TÉCNICAS DE TRACY:
1. Establece la mesa (define metas por escrito)
2. Planifica cada día con anticipación
3. Aplica el 80/20 a todo
4. Considera las consecuencias de cada acción
5. Practica la procrastinación creativa (elimina lo trivial)
6. Usa el método ABCDE constantemente
7. Enfócate en áreas de resultado clave
8. Aplica la Ley de las Tres Tareas
9. Prepárate a fondo antes de empezar
10. Aprovecha tus talentos especiales
11. Identifica tus principales limitaciones
12. Toma acción una vez tomada la decisión
13. Presiona para alcanzar tus competencias centrales
14. Motívate para actuar
15. Usa la tecnología como herramienta, no como amo
16. Concentra tu atención en áreas de alto valor
17. Divide cada tarea grande en sub-tareas
18. Crea grandes bloques de tiempo
19. Desarrolla un sentido de urgencia
20. Sigue practicando hasta que sea hábito
21. La autodisciplina es la clave del éxito

CITAS CLAVE: "Cada minuto gastado en planear ahorra diez minutos en ejecución." "La habilidad de concentrarse en la tarea más importante, hacerla bien y terminarla completamente es la clave del éxito."`,
  },
  {
    id: "atomic-habits",
    title: "Hábitos Atómicos",
    author: "James Clear",
    year: 2018,
    category: "habitos",
    coverGradient: "from-teal-500 to-cyan-600",
    pages: 320,
    readMinutes: 45,
    tags: ["hábitos", "sistemas", "identidad", "cambio"],
    summary:
      "Los pequeños cambios del 1% acumulados producen resultados extraordinarios. Clear muestra que los hábitos no son sobre metas sino sobre sistemas e identidad: conviértete en la persona que tiene esos hábitos.",
    insights: [
      "Mejora del 1% diaria = 37x mejor al año. El poder del interés compuesto aplicado a hábitos.",
      "Olvidate de las metas, enfócate en los sistemas. Las metas son resultados; los sistemas son procesos.",
      "Identidad primero: no 'quiero leer más', sino 'soy un lector'. El comportamiento sigue a la identidad.",
      "Las 4 leyes del cambio de comportamiento: hacerlo obvio, atractivo, fácil e inmediatamente satisfactorio.",
      "Para romper malos hábitos invierte las 4 leyes: hazlo invisible, no atractivo, difícil e insatisfactorio.",
      "El entorno moldea el comportamiento más que la motivación. Diseña tu entorno para el éxito.",
      "'Nunca falles dos veces': un día malo no importa; dos días seguidos crean un nuevo hábito negativo.",
    ],
    aiContext: `Libro: "Hábitos Atómicos" (Atomic Habits) de James Clear (2018).
TESIS: Los cambios pequeños —hábitos atómicos— acumulados con el tiempo producen resultados extraordinarios. El 1% de mejora diaria equivale a 37 veces mejor al año.

EL MODELO DE LAS 4 LEYES:
Para CREAR un buen hábito:
1. Hazlo obvio (señal visible, implementación de intención: "Haré X en el lugar Y a la hora Z")
2. Hazlo atractivo (agrupamiento de tentaciones: combinar algo que necesitas con algo que quieres)
3. Hazlo fácil (reducción de fricción, regla de los 2 minutos: todo hábito nuevo debe tomar menos de 2 min)
4. Hazlo satisfactorio (recompensa inmediata, seguimiento de hábitos)

Para ROMPER un mal hábito (inversión de las 4 leyes):
1. Hazlo invisible
2. Hazlo no atractivo
3. Hazlo difícil
4. Hazlo insatisfactorio

IDENTIDAD Y HÁBITOS:
- Capa 1 (más superficial): Resultados — lo que obtienes
- Capa 2: Procesos — lo que haces
- Capa 3 (más profunda): Identidad — lo que crees

El cambio real es un cambio de identidad. Cada hábito es un voto para convertirte en el tipo de persona que quieres ser.

CICLO DEL HÁBITO: Señal → Anhelo → Respuesta → Recompensa

CONCEPTOS CLAVE: Apilamiento de hábitos, diseño del entorno, la regla de Goldilocks (zona de máximo rendimiento entre aburrimiento y ansiedad), meseta del potencial latente.`,
  },
  {
    id: "7-habits",
    title: "Los 7 Hábitos de la Gente Altamente Efectiva",
    author: "Stephen R. Covey",
    year: 1989,
    category: "liderazgo",
    coverGradient: "from-blue-600 to-indigo-700",
    pages: 432,
    readMinutes: 60,
    tags: ["efectividad", "liderazgo", "carácter", "paradigmas"],
    summary:
      "Un marco de principios intemporales para la efectividad personal y profesional. Covey distingue entre la ética del carácter (valores internos) y la ética de la personalidad (técnicas externas), argumentando que solo la primera produce éxito duradero.",
    insights: [
      "Sé proactivo: eres responsable de tu vida. Actúa desde tus valores, no desde tus emociones.",
      "Empieza con el fin en mente: escribe tu propio epitafio. ¿Qué quieres que digan de ti?",
      "Primero lo primero: organiza por cuadrantes (urgente/importante). Vive en el cuadrante II.",
      "Piensa en ganar-ganar: busca acuerdos mutuamente beneficiosos en toda relación.",
      "Primero busca comprender, luego ser comprendido: escucha empáticamente antes de hablar.",
      "Sinergiza: el todo es mayor que la suma de las partes. Valora las diferencias.",
      "Afila la sierra: renueva constantemente las cuatro dimensiones (físico, mental, emocional, espiritual).",
    ],
    aiContext: `Libro: "Los 7 Hábitos de la Gente Altamente Efectiva" de Stephen R. Covey (1989).

LOS 7 HÁBITOS:
VICTORIA PRIVADA (dependencia → independencia):
1. SER PROACTIVO: Toma responsabilidad de tu vida. Círculo de influencia vs círculo de preocupación. Actúa desde valores, no desde estímulos externos.
2. COMENZAR CON EL FIN EN MENTE: Define tu misión personal. Todo se crea dos veces: primero mentalmente, luego físicamente. Escribe tu enunciado de misión.
3. PONER PRIMERO LO PRIMERO: Cuadrante II (importante pero no urgente) = zona de alto valor. Administración del tiempo basada en roles y metas semanales.

VICTORIA PÚBLICA (independencia → interdependencia):
4. PENSAR EN GANAR/GANAR: El paradigma de la abundancia. Busca acuerdos de beneficio mutuo. Requiere integridad, madurez y mentalidad de abundancia.
5. BUSCA PRIMERO ENTENDER, LUEGO SER ENTENDIDO: Escucha empática (no autobiográfica). Niveles: ignorar, pretender escuchar, escuchar selectivo, escuchar atento, escucha empática.
6. SINERGIZAR: La sinergia crea terceras alternativas. Valora y aprovecha las diferencias.
7. AFILAR LA SIERRA: Renovación en 4 dimensiones: física (ejercicio, nutrición), mental (leer, escribir, planear), social/emocional (relaciones), espiritual (valores, meditación).

CONCEPTOS CLAVE: Proactividad, cuenta bancaria emocional, paradigmas, el espacio entre estímulo y respuesta, las cuatro necesidades humanas (vivir, amar, aprender, dejar un legado).`,
  },
  {
    id: "mindset",
    title: "Mindset: La Actitud del Éxito",
    author: "Carol S. Dweck",
    year: 2006,
    category: "mentalidad",
    coverGradient: "from-violet-500 to-purple-700",
    pages: 277,
    readMinutes: 35,
    tags: ["mentalidad", "crecimiento", "aprendizaje", "inteligencia"],
    summary:
      "Dweck descubrió que el éxito depende más de la mentalidad que del talento. Con mentalidad de crecimiento, el cerebro es plástico: las habilidades se desarrollan con esfuerzo, estrategia y aprendizaje del fracaso.",
    insights: [
      "Mentalidad fija: 'El talento nace, no se hace.' Cada fracaso amenaza tu identidad.",
      "Mentalidad de crecimiento: 'Puedo mejorar con esfuerzo.' El fracaso es información, no identidad.",
      "Elogiar el esfuerzo, no el talento, produce mentalidad de crecimiento en niños y adultos.",
      "Las personas con mentalidad fija evitan los desafíos; las de crecimiento los buscan.",
      "El potencial humano es desconocido. Nadie puede predecir lo que alguien puede lograr con años de pasión y dedicación.",
      "En los negocios, los líderes con mentalidad fija crean culturas tóxicas; los de crecimiento crean culturas de aprendizaje.",
      "Puedes cambiar tu mentalidad: es un proceso consciente y posible a cualquier edad.",
    ],
    aiContext: `Libro: "Mindset: La Actitud del Éxito" de Carol S. Dweck (2006).

DOS MENTALIDADES FUNDAMENTALES:
MENTALIDAD FIJA (Fixed Mindset):
- Creencia: La inteligencia y las habilidades son innatas e inmutables
- Comportamiento: Evita desafíos, se rinde ante obstáculos, ve el esfuerzo como inútil
- Reacción al fracaso: Amenaza a la identidad, culpa factores externos
- Resultado: Estancamiento, desaprovecha potencial

MENTALIDAD DE CRECIMIENTO (Growth Mindset):
- Creencia: Las capacidades se desarrollan con dedicación y trabajo
- Comportamiento: Abraza desafíos, persiste ante obstáculos, ve el esfuerzo como camino al éxito
- Reacción al fracaso: Información útil para aprender y mejorar
- Resultado: Logro creciente, uso completo del potencial

APLICACIONES:
- Padres y educadores: Elogiar el proceso ("Te esforzaste mucho") no el resultado ("Eres muy listo")
- Negocios: Las empresas con liderazgo de mentalidad de crecimiento superan constantemente a las de mentalidad fija
- Relaciones: Las parejas con mentalidad de crecimiento resuelven problemas mejor
- Deportes: Los grandes campeones (Jordan, Ali) tenían mentalidad de crecimiento

NEUROCIENCIA: El cerebro es plástico. Las neuronas forman nuevas conexiones con el aprendizaje y la práctica. No existe un "nivel fijo" de inteligencia.

CAMBIAR LA MENTALIDAD: 1) Reconoce la voz de la mentalidad fija. 2) Date cuenta de que tienes elección. 3) Responde con la voz de crecimiento. 4) Actúa.`,
  },
  {
    id: "deep-work",
    title: "Trabajo Profundo",
    author: "Cal Newport",
    year: 2016,
    category: "productividad",
    coverGradient: "from-slate-600 to-slate-800",
    pages: 304,
    readMinutes: 40,
    tags: ["foco", "concentración", "productividad", "economía del conocimiento"],
    summary:
      "La capacidad de concentrarse sin distracciones en tareas cognitivamente exigentes —trabajo profundo— se está convirtiendo en la habilidad más valiosa del siglo XXI, justo cuando más escasea.",
    insights: [
      "Trabajo profundo = concentración intensa sin distracciones en tareas que llevan al límite tus capacidades cognitivas.",
      "Trabajo superficial = tareas no cognitivamente exigentes, hechas distraído. Fácil de replicar, poco valor.",
      "Las redes sociales y el email fragmentan la atención de forma permanente, reduciendo la capacidad de trabajo profundo.",
      "Hipótesis de Newport: dominar el trabajo profundo te hará prosperar en la nueva economía.",
      "Regla del tiempo de trabajo productivo: trabajo profundo = horas × intensidad de concentración.",
      "Rituales y rutinas: los grandes pensadores tienen horarios fijos de trabajo profundo (4 horas típicamente).",
      "Abraza el aburrimiento: no revises el teléfono cuando esperas. El aburrimiento es el caldo de cultivo de la concentración.",
    ],
    aiContext: `Libro: "Trabajo Profundo" (Deep Work) de Cal Newport (2016).

DEFINICIONES CLAVE:
TRABAJO PROFUNDO: Actividades profesionales en estado de concentración sin distracciones que llevan las capacidades cognitivas al límite. Crea nuevo valor, mejora habilidades y es difícil de replicar.

TRABAJO SUPERFICIAL: Tareas no cognitivamente exigentes, realizadas distraído. No crea mucho valor y es fácil de replicar (responder emails, reuniones de status, scrollear redes).

LAS 4 REGLAS DEL TRABAJO PROFUNDO:
1. TRABAJA PROFUNDAMENTE: Elige una filosofía (monástica, bimodal, rítmica, periodística). Crea rituales. Haz gestos grandes (trabaja en otro lugar sin internet).
2. ABRAZA EL ABURRIMIENTO: Programa el uso de internet. Practica la meditación productiva. Memoriza un mazo de cartas (ejercicio de concentración).
3. ABANDONA LAS REDES SOCIALES: Aplica la ley del artesano: adopta una herramienta solo si sus beneficios superan claramente sus perjuicios. La mayoría de herramientas de red social no superan este umbral.
4. DRENA LO SUPERFICIAL: Agenda cada minuto del día. Cuantifica la profundidad de cada actividad. Fija una cuota de trabajo superficial. Termina el trabajo a una hora fija.

MÉTRICAS: Horas de trabajo profundo por día como KPI principal. Newport sugiere construir hacia 4 horas/día de trabajo profundo real.

ECONOMÍA DEL CONOCIMIENTO: Quienes pueden 1) aprender cosas difíciles rápido y 2) producir al mejor nivel en términos de calidad y velocidad prosperarán. Ambas habilidades dependen del trabajo profundo.`,
  },
  {
    id: "power-of-habit",
    title: "El Poder del Hábito",
    author: "Charles Duhigg",
    year: 2012,
    category: "habitos",
    coverGradient: "from-amber-500 to-orange-600",
    pages: 375,
    readMinutes: 50,
    tags: ["hábitos", "neurociencia", "cambio", "rutinas"],
    summary:
      "Duhigg explica la neurociencia detrás de por qué los hábitos existen y cómo cambiarlos. El loop del hábito —señal, rutina, recompensa— es la estructura fundamental de todo comportamiento automático.",
    insights: [
      "El loop del hábito: señal → rutina → recompensa. Identificar los tres elementos permite cambiarlo.",
      "Los hábitos nunca desaparecen: el cerebro los codifica permanentemente. Solo puedes reemplazarlos.",
      "La señal y la recompensa permanecen; solo cambias la rutina para transformar un hábito.",
      "Los hábitos clave (keystone habits) desencadenan cambios positivos en cascada. Ej: el ejercicio.",
      "La fuerza de voluntad es un músculo que se agota. Diseña rutinas para no depender de ella.",
      "Las organizaciones también tienen hábitos. Cambiarlos requiere entender sus señales y recompensas.",
      "La creencia es crucial: los grupos que cambian hábitos permanentemente tienen fe en que pueden cambiar.",
    ],
    aiContext: `Libro: "El Poder del Hábito" de Charles Duhigg (2012).

EL LOOP DEL HÁBITO:
SEÑAL → RUTINA → RECOMPENSA

- SEÑAL: El disparador que le indica al cerebro que entre en modo automático. Puede ser: ubicación, hora, estado emocional, otras personas, acción inmediatamente anterior.
- RUTINA: El comportamiento físico, mental o emocional que sigue a la señal.
- RECOMPENSA: Lo que el cerebro aprende a buscar. Crea el anhelo que alimenta el hábito.

REGLA DORADA DEL CAMBIO DE HÁBITO: Mantén la señal y la recompensa, cambia solo la rutina.
Ejemplo: Si el hábito de comer galletas (rutina) se activa a las 3pm (señal) por aburrimiento/socialización (recompensa), cambia la rutina por ir a hablar con un colega.

HÁBITOS CLAVE (KEYSTONE HABITS): Algunos hábitos desencadenan otros cambios en cascada. Identificarlos y transformarlos tiene un efecto multiplicador. Ejemplos: ejercicio, hacer la cama, comer juntos en familia, anotar lo que comes.

FUERZA DE VOLUNTAD COMO RECURSO LIMITADO: Se agota durante el día (depleción del ego). Estrategia: convierte las decisiones importantes en rutinas para no gastar voluntad en ellas.

CRAVING (ANHELO): Los hábitos son poderosos porque crean antojos neurológicos. El cerebro anticipa la recompensa antes de obtenerla. El marketing lo explota, tú también puedes aprovecharlo.

CONTEXTO ORGANIZACIONAL: Las empresas tienen hábitos institucionales (rutinas, procesos). Las crisis son oportunidades para cambiarlos porque desestabilizan el equilibrio de fuerzas.`,
  },
  {
    id: "think-rich",
    title: "Piense y Hágase Rico",
    author: "Napoleon Hill",
    year: 1937,
    category: "mentalidad",
    coverGradient: "from-yellow-500 to-amber-600",
    pages: 233,
    readMinutes: 40,
    tags: ["riqueza", "mentalidad", "deseo", "perseverancia"],
    summary:
      "Basado en 20 años de investigación sobre los hombres más exitosos de América, Hill identifica 13 principios que transforman el deseo en su equivalente físico. Un clásico del pensamiento sobre el éxito.",
    insights: [
      "Todo empieza con un deseo ardiente específico y definido —no un deseo vago.",
      "La fe (autoconfianza) amplifica el poder de la mente subconsciente y atrae lo que se espera.",
      "El conocimiento especializado supera al conocimiento general; enfócate en aprender lo que necesitas.",
      "La imaginación es el taller donde se crean todos los planes. Sintetiza conocimiento en ideas.",
      "La planificación organizada: transforma el deseo en acción con un plan escrito y aliados.",
      "La persistencia es la fuerza que supera la resistencia; sin ella no existe éxito duradero.",
      "La mente maestra (mastermind): dos o más personas coordinando con armonía crean una inteligencia superior.",
    ],
    aiContext: `Libro: "Piense y Hágase Rico" de Napoleon Hill (1937).

LOS 13 PRINCIPIOS DEL ÉXITO:
1. DESEO: El punto de partida. Deseo ardiente y específico, no vago. Pasos: fijar monto exacto, determinar qué darás a cambio, fecha límite, plan escrito, leer dos veces al día.
2. FE: La creación de la fe mediante la autosugestión. La mente subconsciente actúa sobre lo que cree.
3. AUTOSUGESTIÓN: El puente entre la mente consciente y la subconsciente. Repite con emoción.
4. CONOCIMIENTO ESPECIALIZADO: El conocimiento general tiene poco valor; el conocimiento organizado y dirigido tiene valor. Saber cómo conseguir conocimiento es más valioso que poseerlo.
5. IMAGINACIÓN: Sintética (reorganiza conceptos existentes) vs Creativa (inspiración desde el infinito). Los planes nacen en la imaginación.
6. PLANIFICACIÓN ORGANIZADA: Forma una Mente Maestra, decide qué puedes ofrecer a cambio, crea un plan y actúa inmediatamente.
7. DECISIÓN: La procrastinación es el opuesto. Los líderes deciden rápido y cambian de opinión lentamente.
8. PERSISTENCIA: El esfuerzo sostenido que no acepta el fracaso. La falta de persistencia es la causa #1 del fracaso.
9. EL PODER DE LA MENTE MAESTRA: La ley de dos o más mentes coordinadas hacia un objetivo común.
10. EL MISTERIO DE LA TRANSMUTACIÓN DEL SEXO: La energía creativa redirigida hacia propósitos superiores.
11. EL SUBCONSCIENTE: El enlace entre la mente finita y la inteligencia infinita. Se alimenta de deseos emocionales.
12. EL CEREBRO: Emisora y receptora de pensamientos. Sintoniza con otras mentes a través de la emoción.
13. EL SEXTO SENTIDO: La Inteligencia Infinita. Desarrollado solo después de dominar los 12 principios anteriores.`,
  },
  {
    id: "man-search-meaning",
    title: "El Hombre en Busca de Sentido",
    author: "Viktor E. Frankl",
    year: 1946,
    category: "mentalidad",
    coverGradient: "from-stone-600 to-stone-800",
    pages: 197,
    readMinutes: 25,
    tags: ["propósito", "sufrimiento", "libertad", "logoterapia"],
    summary:
      "El relato de Frankl sobre su supervivencia en los campos de concentración nazis y la Logoterapia que fundó. Su conclusión central: el significado es la fuerza motivadora fundamental del ser humano.",
    insights: [
      "Entre el estímulo y la respuesta hay un espacio. En ese espacio está tu libertad y tu crecimiento.",
      "El ser humano puede soportar cualquier 'cómo' si tiene un 'para qué' suficientemente poderoso.",
      "El sufrimiento en sí no tiene sentido, pero tú puedes elegir la actitud con la que lo enfrentas.",
      "No busques el éxito directamente — comprométete con una causa más grande que tú mismo.",
      "La logoterapia: encontrar sentido en 1) un trabajo que haces, 2) alguien a quien amas, 3) el sufrimiento inevitable.",
      "El vacío existencial (aburrimiento, cinismo) surge cuando falta el sentido de vida.",
      "La libertad humana última es elegir la propia actitud ante cualquier circunstancia dada.",
    ],
    aiContext: `Libro: "El Hombre en Busca de Sentido" de Viktor E. Frankl (1946).

CONTEXTO: Frankl, psiquiatra vienés, sobrevivió 3 años en campos de concentración nazis (Auschwitz, Dachau). Perdió a casi toda su familia. El libro combina su testimonio personal con la exposición de la Logoterapia.

LOGOTERAPIA: Tercera escuela vienesa de psicoterapia (después de Freud y Adler).
Premisas fundamentales:
1. La vida tiene sentido bajo cualquier circunstancia.
2. El ser humano está motivado por la "voluntad de sentido" (no placer como Freud, ni poder como Adler).
3. El ser humano tiene libertad para encontrar sentido en lo que hace.

TRES CAMINOS HACIA EL SENTIDO:
1. Crear un trabajo o realizar una acción
2. Amar a otra persona (por lo que es, no por lo que puede dar)
3. La actitud que tomamos ante el sufrimiento inevitable

LA CITA CENTRAL: "Entre el estímulo y la respuesta existe un espacio. En ese espacio reside nuestra libertad de elegir nuestra respuesta. En nuestra respuesta yace nuestro crecimiento y nuestra libertad."

CONCEPTOS CLAVE:
- Neurosis noógena (vacío existencial): surge de problemas existenciales no resueltos
- Frustración existencial: el sentimiento de que la vida carece de significado
- La paradoja de la intención: buscar directamente la felicidad/éxito la aleja; viene como efecto secundario
- Auto-trascendencia: el ser humano se realiza en la medida en que se entrega a algo más grande que sí mismo

LECCIÓN PARA LA VIDA MODERNA: El aburrimiento, la depresión y el nihilismo contemporáneo son síntomas del vacío existencial. La cura es el compromiso con un propósito.`,
  },
  {
    id: "intelligent-investor",
    title: "El Inversor Inteligente",
    author: "Benjamin Graham",
    year: 1949,
    category: "finanzas",
    coverGradient: "from-emerald-600 to-green-800",
    pages: 640,
    readMinutes: 90,
    tags: ["inversión", "bolsa", "valor", "finanzas personales"],
    summary:
      "La biblia del value investing. Graham distingue entre el inversor defensivo y el emprendedor, y enseña a analizar acciones como partes de negocios reales, no como tickers en una pantalla.",
    insights: [
      "El mercado es un votador a corto plazo pero una balanza a largo plazo. Mr. Market es tu sirviente, no tu guía.",
      "Margen de seguridad: compra activos significativamente por debajo de su valor intrínseco para protegerte del error.",
      "El inversor defensivo: diversificación, fondos indexados, bajo costo, ignorar el mercado diariamente.",
      "La distinción fundamental: inversión = análisis cuidadoso + preservación del capital + retorno adecuado.",
      "La inflación es el mayor enemigo del inversor a largo plazo; debes superarla sistemáticamente.",
      "La volatilidad no es riesgo si no necesitas el dinero pronto; el verdadero riesgo es la pérdida permanente.",
      "El comportamiento importa más que la inteligencia: la disciplina emocional es la ventaja competitiva.",
    ],
    aiContext: `Libro: "El Inversor Inteligente" de Benjamin Graham (1949, actualizado por Jason Zweig 2003).

CONCEPTO DE MR. MARKET: Imagina que tienes un socio (Mr. Market) que te ofrece comprar o vender tu participación en un negocio cada día. Sus precios oscilan entre el optimismo irracional y el pesimismo extremo. Debes usar sus precios en tu beneficio, no dejarte guiar por sus emociones.

DOS TIPOS DE INVERSORES:
DEFENSIVO (Pasivo): Preservar capital, no pasar tiempo, resultados adecuados.
- 50% bonos de alta calidad + 50% acciones de primer nivel
- Rebalancear cuando la proporción cambie significativamente
- Fondos indexados de bajo costo (actualización de Zweig)
- Ignorar las fluctuaciones del mercado

EMPRENDEDOR (Activo): Mayor tiempo y análisis a cambio de mejores resultados.
- Requiere conocimiento superior al promedio del mercado
- Busca acciones a precio de ganga (precio < valor intrínseco)
- Análisis fundamental completo de empresas

MARGEN DE SEGURIDAD (Concepto central):
Compra un activo por significativamente menos que su valor intrínseco calculado. El margen protege de:
- Errores de análisis
- Mala suerte
- Hechos imprevistos

ANÁLISIS DE ACCIONES VS. ESPECULACIÓN:
- Inversión: análisis cuidadoso, seguridad del capital, retorno adecuado
- Especulación: todo lo demás

INFLACIÓN: El mayor peligro a largo plazo. Las acciones son mejor cobertura que los bonos.

ADVERTENCIA: La mayoría de inversores NO deberían intentar superar el mercado. Los fondos indexados de bajo costo ganan a la mayoría de gestores activos a largo plazo.`,
  },
  {
    id: "4-hour-week",
    title: "La Semana Laboral de 4 Horas",
    author: "Tim Ferriss",
    year: 2007,
    category: "negocios",
    coverGradient: "from-sky-500 to-blue-700",
    pages: 308,
    readMinutes: 40,
    tags: ["automatización", "outsourcing", "libertad", "emprendimiento"],
    summary:
      "Ferriss desafía el modelo de trabajar 40 años para jubilarse y propone los mini-retiros: vivir de manera extraordinaria ahora aplicando el Principio de Pareto a la productividad y la automatización al trabajo.",
    insights: [
      "DEAL: Definición (nueva vida y reglas), Eliminación (80/20 + dieta de información), Automatización (outsourcing), Liberación (trabajar desde cualquier parte).",
      "El 80/20 radical: el 20% de tus clientes genera el 80% de tus ingresos. Elimina o limita el 80% restante.",
      "La dieta de información: consume solo lo necesario para tomar decisiones, no más. Evita las noticias.",
      "Tu tiempo vale más que el dinero. Subcontrata todo lo que no sea tu fortaleza o alegría.",
      "El medo real al fracaso: el peor caso es casi siempre solucionable y temporal.",
      "Los mini-retiros intercalados en la vida activa son mejores que un retiro único después de 40 años.",
      "Pide perdón, no permiso: la mayoría de restricciones son auto-impuestas o nunca se han probado.",
    ],
    aiContext: `Libro: "La Semana Laboral de 4 Horas" de Tim Ferriss (2007).

EL MARCO DEAL:
D - DEFINICIÓN: Redefine las reglas del juego. "Los NR (Nuevos Ricos) no tienen metas de dinero sino de estilo de vida." Define qué es lo que realmente quieres hacer, ser y tener.

E - ELIMINACIÓN: Aplica el principio 80/20 radicalmente.
- El 20% de tus actividades genera el 80% de tus resultados positivos
- El 20% de tus clientes genera el 80% de tus ingresos
- El 20% de tus problemas genera el 80% de tu estrés
Solución: Eliminar el 80% de baja productividad. Aplicar la dieta de información.

A - AUTOMATIZACIÓN: Crea sistemas que funcionen sin ti.
- Asistentes virtuales (outsourcing) para tareas delegables
- Productos de información (muse): ingresos pasivos
- Procesos automatizados para ventas, soporte, operaciones

L - LIBERACIÓN: Trabaja desde cualquier parte.
- Negociar trabajo remoto con empleadores actuales
- Geolibertad: vivir en países de bajo costo con ingresos de alto costo
- Mini-retiros: vive ahora, no esperes 40 años

HERRAMIENTAS PRÁCTICAS:
- Batching: agrupa tareas similares (emails solo 2 veces/día)
- Dieta de noticias: no consumir noticias por 5 días
- 3 preguntas de productividad diaria: ¿Qué 3 cosas, si se hacen hoy, me harían sentir que el día fue exitoso?
- Preguntas de miedo: ¿Cuál es el peor caso real? ¿Cuán probable es? ¿Cómo me recupero?`,
  },
  {
    id: "flow",
    title: "Fluir (Flow)",
    author: "Mihaly Csikszentmihalyi",
    year: 1990,
    category: "productividad",
    coverGradient: "from-cyan-500 to-teal-700",
    pages: 303,
    readMinutes: 45,
    tags: ["flujo", "felicidad", "concentración", "experiencia óptima"],
    summary:
      "Basado en décadas de investigación, Csikszentmihalyi identifica el estado de flujo como la experiencia humana óptima: absorción total en una actividad desafiante donde el tiempo desaparece y el rendimiento máximo surge.",
    insights: [
      "El flujo ocurre cuando el desafío de una tarea y tus habilidades están perfectamente equilibrados.",
      "La consciencia ordenada: en flujo, la información que entra concuerda con los objetivos. No hay desorden psíquico.",
      "Las actividades autotélicas (con valor intrínseco) son la fuente más confiable de flujo.",
      "El trabajo puede ser fuente de flujo si le añades metas claras, feedback inmediato y el reto adecuado.",
      "La paradoja del ocio: el tiempo libre produce menos flujo que el trabajo bien estructurado.",
      "El yo desaparece en flujo, pero emerge más fuerte después. Es la paradoja del crecimiento del ego.",
      "La vida óptima no es placer constante sino una serie de desafíos superados con plena implicación.",
    ],
    aiContext: `Libro: "Fluir (Flow)" de Mihaly Csikszentmihalyi (1990).

CONCEPTO CENTRAL - EL FLUJO:
Estado de concentración absoluta donde uno está completamente inmerso en una actividad. Características:
1. Metas claras en cada paso
2. Feedback inmediato sobre las acciones
3. Equilibrio entre el desafío y las habilidades
4. Acción y conciencia se fusionan
5. Las distracciones quedan excluidas de la conciencia
6. No hay miedo al fracaso
7. La autorreflexión desaparece
8. El sentido del tiempo se distorsiona
9. La actividad se vuelve autotélica (fin en sí misma)

CANAL DE FLUJO:
- Demasiado fácil → Aburrimiento
- Demasiado difícil → Ansiedad
- Equilibrio exacto → FLUJO

Para mantener el flujo debes aumentar constantemente el desafío o las habilidades.

LA EXPERIENCIA ÓPTIMA EN DISTINTOS CONTEXTOS:
- Trabajo: Rediseña tu trabajo para tener metas claras, feedback y el reto correcto
- Ocio: El ocio pasivo (TV) produce menos flujo que las actividades activas (música, deporte, conversación profunda)
- Relaciones: Las relaciones de flujo requieren complejidad, atención mutua y metas compartidas

ENTROPÍA PSÍQUICA vs CONSCIENCIA ORDENADA:
- Entropía: información que contradice las metas (preocupación, frustración, aburrimiento)
- Consciencia ordenada: flujo — toda la atención dirigida a las metas sin conflicto

EL SELF: En flujo, el yo desaparece temporalmente, pero emerge más complejo y fuerte después. Este es el mecanismo del crecimiento personal.

APLICACIÓN PRÁCTICA: Transforma cualquier tarea en actividad de flujo definiendo metas claras, buscando feedback inmediato y ajustando la dificultad al borde de tus capacidades.`,
  },
  {
    id: "how-to-win-friends",
    title: "Cómo Ganar Amigos e Influir Sobre las Personas",
    author: "Dale Carnegie",
    year: 1936,
    category: "liderazgo",
    coverGradient: "from-rose-500 to-red-700",
    pages: 288,
    readMinutes: 35,
    tags: ["relaciones", "comunicación", "influencia", "liderazgo"],
    summary:
      "El libro de relaciones interpersonales más vendido de la historia. Carnegie enseña que el éxito profesional y personal depende en un 85% de la capacidad de relacionarse con las personas.",
    insights: [
      "No critiques, no condenes, no te quejes. La crítica no produce el cambio que buscas.",
      "Dale a la persona lo que más desea: sentirse importante. Hazlo sinceramente.",
      "Sonríe. Una sonrisa genuina es el activo de relaciones más poderoso y barato.",
      "Recuerda los nombres: el nombre de una persona es el sonido más dulce que puede escuchar.",
      "Sé un oyente genuino. Anima a otros a hablar de ellos mismos.",
      "Habla siempre en términos de los intereses de la otra persona.",
      "Haz que la otra persona sienta que la idea fue suya. La paternidad de las ideas importa.",
    ],
    aiContext: `Libro: "Cómo Ganar Amigos e Influir Sobre las Personas" de Dale Carnegie (1936).

PARTE 1 - TÉCNICAS FUNDAMENTALES PARA TRATAR A LAS PERSONAS:
1. No critiques, no condenes, no te quejes. La crítica hiere el orgullo, provoca resentimiento.
2. Muestra apreciación sincera y honesta. El deseo más profundo de la naturaleza humana es el de sentirse importante.
3. Despierta en los demás un deseo ferviente. Habla en términos de lo que el otro quiere.

PARTE 2 - SEIS MANERAS DE AGRADAR A LOS DEMÁS:
1. Interésate sinceramente por los demás
2. Sonríe
3. Recuerda que el nombre de una persona es el sonido más dulce para esa persona
4. Sé un buen oyente. Alienta a los demás a hablar de sí mismos
5. Habla en términos de los intereses del otro
6. Haz que los demás se sientan importantes, y hazlo sinceramente

PARTE 3 - CÓMO INFLUIR SOBRE LOS DEMÁS:
1. La única manera de salir ganando de una discusión es evitándola
2. Muestra respeto por las opiniones ajenas. Nunca digas "Está usted equivocado"
3. Si te equivocas, admítelo rápida y enfáticamente
4. Empieza de forma amigable
5. Consigue que el otro diga sí inmediatamente
6. Deja que el otro hable mucho
7. Deja que el otro sienta que la idea es suya
8. Mira las cosas desde el punto de vista del otro
9. Muestra simpatía por los deseos del otro
10. Apela a los motivos más nobles
11. Dramatiza tus ideas

PARTE 4 - SEA UN LÍDER: Cómo cambiar a los demás sin ofenderlos ni despertar resentimientos.`,
  },
  {
    id: "think-fast-slow",
    title: "Pensar Rápido, Pensar Despacio",
    author: "Daniel Kahneman",
    year: 2011,
    category: "mentalidad",
    coverGradient: "from-indigo-500 to-blue-700",
    pages: 499,
    readMinutes: 70,
    tags: ["psicología", "sesgos cognitivos", "toma de decisiones", "economia conductual"],
    summary:
      "Kahneman, Premio Nobel de Economía, revela los dos sistemas del pensamiento humano: el rápido e intuitivo (Sistema 1) y el lento y racional (Sistema 2), y cómo sus interacciones gobiernan nuestras decisiones.",
    insights: [
      "Sistema 1 (automático): rápido, intuitivo, emocional. Actúa constantemente con poco esfuerzo.",
      "Sistema 2 (deliberado): lento, analítico, lógico. Se activa con esfuerzo consciente. Busca atajos.",
      "La mayoría de errores de juicio vienen del Sistema 1 tomando control cuando se necesita el Sistema 2.",
      "Sesgo de confirmación: buscamos información que confirma lo que ya creemos.",
      "Efecto ancla: el primer número que escuchamos afecta desproporcionadamente nuestras estimaciones.",
      "La aversión a la pérdida: perder algo duele el doble de lo que alegra ganarlo. Moldea todas las decisiones.",
      "WYSIATI (What You See Is All There Is): tomamos decisiones con la información disponible como si fuera toda.",
    ],
    aiContext: `Libro: "Pensar Rápido, Pensar Despacio" de Daniel Kahneman (2011).

LOS DOS SISTEMAS:
SISTEMA 1 (Rápido):
- Automático, rápido, sin esfuerzo
- Emocional, estereotípico, inconsciente
- Fuente de: intuición, impresiones, sentimientos
- Errores: heurísticas, sesgos cognitivos

SISTEMA 2 (Lento):
- Deliberado, lento, con esfuerzo
- Lógico, calculador, consciente
- Activado para: análisis complejo, deliberación
- Problema: perezoso, busca atajos del Sistema 1

PRINCIPALES SESGOS COGNITIVOS:
1. ANCLAJE: El primer número escuchado sirve como ancla. Ej: negociaciones, precios.
2. DISPONIBILIDAD: Lo que viene más fácilmente a la mente parece más común (aviones vs coches).
3. REPRESENTATIVIDAD: Juzgamos probabilidades por similitud con estereotipos.
4. EFECTO HALO: Una impresión positiva en un área contagia otras áreas.
5. AVERSIÓN A LA PÉRDIDA: Perder $100 duele ~2x más que ganar $100 alegra.
6. EXCESO DE CONFIANZA: Somos demasiado seguros de nuestras predicciones.
7. WYSIATI: Juzgamos con la información disponible como si fuera completa.
8. PLANIFICACIÓN FALLIDA: Sistemáticamente subestimamos tiempo, costo y riesgo de proyectos.

ECONOMÍA CONDUCTUAL:
- Los humanos no somos homo economicus (racionales y egoístas)
- Las decisiones se ven afectadas por el marco (framing), contexto y emociones
- Nudge: diseña el entorno para que la opción por defecto sea la mejor

APLICACIÓN PRÁCTICA:
- Para tomar mejores decisiones: activa el Sistema 2 antes de decidir sobre cosas importantes
- Implementa premortem: antes de un proyecto, imagina que falló y explica por qué
- Busca "disconfirmadores" activamente para combatir el sesgo de confirmación`,
  },
];

export const BOOK_CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  productividad: {
    label: "Productividad",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  habitos: {
    label: "Hábitos",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  finanzas: {
    label: "Finanzas",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  mentalidad: {
    label: "Mentalidad",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  negocios: {
    label: "Negocios",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  liderazgo: {
    label: "Liderazgo",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
};
