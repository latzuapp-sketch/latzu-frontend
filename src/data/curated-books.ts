import type { LibraryBook } from "@/types/library";

const NO_CHAPTERS: LibraryBook["chapters"] = [];
const NO_EXERCISES: LibraryBook["exercises"] = [];

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
    overview: `## Trágate Ese Sapo — Resumen Ejecutivo

Brian Tracy parte de una simple verdad: la procrastinación es el enemigo número uno del éxito. Su solución es igualmente directa — identifica tu tarea más importante del día (tu «sapo») y ejecútala **primero**, antes de emails, reuniones o cualquier otra cosa.

### El método ABCDE
Clasifica cada tarea antes de empezar:
- **A** — Debo hacerlo (consecuencias graves si no)
- **B** — Debería hacerlo (consecuencias menores)
- **C** — Sería bueno (sin consecuencias reales)
- **D** — Delegar
- **E** — Eliminar

**Regla de oro:** nunca hagas una tarea B cuando hay una A pendiente.

### La regla 80/20 aplicada al tiempo
El 20% de tus actividades produce el 80% de tus resultados. Planear el día anterior en papel —no en pantalla— incrementa la productividad hasta un 25%. La claridad elimina la vacilación.

### El hábito, no la fuerza de voluntad
Tracy no propone motivación — propone sistema. Una vez que entrenas el hábito de comenzar el día con el sapo, el resto del día fluye desde esa victoria temprana.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Hábitos Atómicos — Resumen Ejecutivo

Los hábitos son el interés compuesto de la autosuperación. James Clear argumenta que **el 1% de mejora diaria produce un resultado 37 veces mejor al final del año**, mientras que el 1% de deterioro diario lleva casi a cero. El problema no es que queramos cambiar poco — es que intentamos cambiar lo equivocado.

### El modelo de tres capas del cambio
Clear propone que el cambio ocurre en tres niveles:
1. **Resultados** — lo que obtienes (la capa más superficial)
2. **Procesos** — lo que haces
3. **Identidad** — quién crees ser (la capa más profunda y duradera)

La mayoría intenta cambiar resultados directamente. El cambio duradero viene de cambiar la identidad primero: no «quiero leer más» sino **«soy un lector»**. Cada hábito que practicas es un voto para convertirte en ese tipo de persona.

### Las 4 Leyes del Cambio de Comportamiento
Para crear un hábito, hazlo **obvio → atractivo → fácil → satisfactorio**. Para romper un mal hábito, invierte cada ley: invisible, no atractivo, difícil, insatisfactorio.

### La meseta del potencial latente
El cambio parece no ocurrir durante semanas — luego el esfuerzo acumulado atraviesa la «línea de decepción» y los resultados se disparan. Persiste durante la meseta; los resultados siempre llegan si el sistema es correcto.`,
    chapters: [
      {
        title: "El Poder Sorprendente de los Hábitos Atómicos",
        content: `## El Poder Sorprendente de los Hábitos Atómicos

El equipo de ciclismo de Gran Bretaña era mediocre durante décadas. En 2003, Dave Brailsford asumió como director con una estrategia: **mejora marginal del 1% en todo**. Ajuste del asiento, mantas de calefacción para los músculos, gel antibacteriano en los neumáticos, almohadas que viajan con el equipo. Cinco años después dominaron el Tour de France y los Juegos Olímpicos.

**La matemática del 1%:** mejorar 1% cada día durante un año resulta en 37 veces mejor. Empeorar 1% cada día resulta en casi cero. Los hábitos son el interés compuesto del comportamiento.

El problema más común: esperamos resultados lineales de hábitos que producen resultados exponenciales. Cuando el progreso parece inexistente, estamos en la *meseta del potencial latente* — el esfuerzo se está acumulando bajo la superficie, como el hielo que se funde. El rompimiento llega de golpe.

**La diferencia entre metas y sistemas:** Los ganadores y los perdedores tienen las mismas metas. Las metas no diferencian a los que logran cosas de los que no. Lo que diferencia es el sistema. "No te elevas al nivel de tus metas; caes al nivel de tus sistemas."`,
      },
      {
        title: "Cómo los Hábitos Moldean tu Identidad",
        content: `## Cómo los Hábitos Moldean tu Identidad

Hay tres capas del cambio de comportamiento. La mayoría empieza en la capa más externa: *¿qué quiero lograr?* (Resultados). Algunos van más profundo: *¿qué proceso seguiré?* (Procesos). Clear propone empezar desde adentro: *¿en quién quiero convertirme?* (Identidad).

**El problema del cambio basado en resultados:** "Quiero leer 12 libros este año" es frágil — cuando la motivación baja, el comportamiento desaparece. "Soy un lector" es robusto — los lectores leen, porque eso es quiénes son.

**Cada hábito es un voto:** No se cambia la identidad de golpe. Se cambia con evidencia acumulada. Cada vez que vas al gimnasio, votas por ser alguien que cuida su cuerpo. Cada vez que abres el libro, votas por ser un lector. La identidad emerge de la evidencia.

El proceso en dos pasos: (1) decide qué tipo de persona quieres ser, (2) demuéstratelo con pequeñas victorias. La pregunta más útil no es "¿qué quiero lograr?" sino "¿qué tipo de persona logra eso, y qué haría hoy esa persona?"`,
      },
      {
        title: "Cómo Construir Mejores Hábitos: El Ciclo de 4 Pasos",
        content: `## Cómo Construir Mejores Hábitos: El Ciclo de 4 Pasos

Todo hábito — bueno o malo — sigue el mismo proceso: **Señal → Anhelo → Respuesta → Recompensa**.

- **Señal:** el disparador que indica al cerebro iniciar un comportamiento (lugar, hora, emoción, personas, acción previa)
- **Anhelo:** la motivación detrás del hábito; no es el hábito mismo lo que se anhela sino el cambio de estado que produce
- **Respuesta:** el hábito real (pensamiento o acción), siempre limitado por la habilidad o motivación disponibles
- **Recompensa:** el beneficio que refuerza el ciclo; satisface el anhelo y enseña al cerebro qué recordar

**Las 4 Leyes del Cambio de Comportamiento** son el marco práctico que emerge del ciclo:

| Paso | Para crear un hábito | Para romperlo |
|------|---------------------|---------------|
| Señal | Hazlo obvio | Hazlo invisible |
| Anhelo | Hazlo atractivo | Hazlo poco atractivo |
| Respuesta | Hazlo fácil | Hazlo difícil |
| Recompensa | Hazlo satisfactorio | Hazlo insatisfactorio |

Este marco convierte la psicología del hábito en un sistema de diseño accionable.`,
      },
      {
        title: "1ª Ley: Hazlo Obvio",
        content: `## 1ª Ley: Hazlo Obvio

Los hábitos son respuestas automáticas a señales. El cerebro no analiza conscientemente la mayoría de sus acciones — las ejecuta en piloto automático basado en las señales del entorno.

**Implementación de intención:** la táctica más efectiva para empezar un nuevo hábito. Formato: "Haré [COMPORTAMIENTO] a las [HORA] en [LUGAR]." Las personas que planean *cuándo y dónde* tienen tasas de adherencia significativamente mayores.

**Apilamiento de hábitos:** vincula el nuevo hábito a uno que ya existe. Formato: "Después de [HÁBITO ACTUAL], haré [NUEVO HÁBITO]." El café de la mañana se convierte en la señal para meditar. Lavarse los dientes, en la señal para el hilo dental.

**Diseño del entorno:** el comportamiento es una función de la persona y el entorno. Rediseña el espacio para que las señales de buenos hábitos sean visibles y las de malos hábitos sean invisibles. El libro en la almohada. El teléfono en otro cuarto. Los snacks saludables a la vista.

**Hazlo invisible para romperlo:** los malos hábitos son señales invisibilizadas. Borra las apps del teléfono. Pon la televisión en un closet. Deja el cigarrillo en el carro, no en el bolsillo. El autocontrol es una estrategia de corto plazo; el diseño del entorno es de largo plazo.`,
      },
      {
        title: "2ª Ley: Hazlo Atractivo",
        content: `## 2ª Ley: Hazlo Atractivo

La dopamina se dispara en *anticipación* de la recompensa, no solo al recibirla. El cerebro libera dopamina cuando *espera* el placer — esto explica por qué el deseo puede ser más intenso que la satisfacción.

**Agrupamiento de tentaciones (temptation bundling):** vincula una acción que *necesitas* hacer con una que *quieres* hacer. Solo puedes ver tu serie favorita mientras caminas en la caminadora. Solo puedes revisar redes sociales mientras haces los ejercicios de fisioterapia.

**El rol del grupo social:** imitamos los hábitos de tres grupos: los cercanos, los muchos (la tribu) y los poderosos (los que admiramos). Únete a culturas donde el comportamiento deseado es la norma. Encuentra un ambiente donde tus hábitos meta sean el comportamiento estándar. "Nada sostiene la motivación mejor que pertenecer a una tribu."

**Reencuadre motivacional:** Los hábitos son asociaciones. Puedes cambiar cómo los percibes. "Tengo que ir al gimnasio" → "Tengo la *oportunidad* de fortalecer mi cuerpo." "Tengo que cocinar" → "Puedo nutrir mi familia." El lenguaje moldea la motivación.`,
      },
      {
        title: "3ª Ley: Hazlo Fácil",
        content: `## 3ª Ley: Hazlo Fácil

El principio del menor esfuerzo: cuando hay dos opciones similares, las personas naturalmente gravitan hacia la que requiere menos trabajo. Esto no es pereza — es eficiencia del cerebro. Diseña el entorno para que el camino de menor resistencia sea el correcto.

**La cantidad de repeticiones supera al tiempo:** no importa cuánto tiempo llevas con un hábito — importa cuántas veces lo has ejecutado. El cerebro consolida conexiones neuronales con la práctica repetida. Actúa primero; perfecciona después.

**La Regla de los 2 Minutos:** cuando empiezas un nuevo hábito, debe tomar menos de 2 minutos hacerlo. "Leer antes de dormir" → empezar con "leer una página." "Correr 5 km" → "ponerme los zapatos de correr." El punto no es que el hábito dure 2 minutos — es que empezar sea tan fácil que no haya excusa. *Un hábito debe establecerse antes de que pueda mejorarse.*

**Dispositivos de compromiso:** decisiones tomadas en el presente que bloquean el comportamiento futuro. Pagar el gym por adelantado. Dejar el teléfono fuera del cuarto antes de dormir. Programar transferencias automáticas a ahorros. Reducir la fricción para el comportamiento deseado; aumentarla para el indeseado.`,
      },
      {
        title: "4ª Ley: Hazlo Inmediatamente Satisfactorio",
        content: `## 4ª Ley: Hazlo Inmediatamente Satisfactorio

El cerebro prioriza las recompensas inmediatas sobre las futuras. El problema con la mayoría de buenos hábitos: sus beneficios son en el futuro (salud, riqueza, conocimiento) mientras sus costos son inmediatos (esfuerzo, incomodidad). Con los malos hábitos es al revés.

**Refuerzo inmediato:** añade una pequeña recompensa inmediata al completar el hábito. Después de cada sesión de ejercicio, un baño caliente especial. Después de estudiar, 10 minutos de una serie. La recompensa no debe contrarrrestar el hábito (comer pizza después de correr), pero sí reforzarlo.

**El seguimiento de hábitos:** marcar en un calendario o app cada día que completas el hábito es en sí mismo satisfactorio. Ver la cadena creciendo crea motivación. *Nunca rompas la cadena* — la racha se convierte en su propia recompensa.

**"Nunca falles dos veces":** un día malo no es el problema — es la respuesta al día malo. Fallar una vez es un accidente; fallar dos veces es el inicio de un nuevo hábito negativo. Regresa al hábito al día siguiente, sin importar cuán pequeño sea el retorno. "El hábito de aparecer siempre supera al hábito de hacerlo perfectamente."`,
      },
      {
        title: "La Trampa de los Buenos Hábitos y la Regla de Goldilocks",
        content: `## La Trampa de los Buenos Hábitos y la Regla de Goldilocks

Los hábitos tienen un lado oscuro: una vez que se automatizan, dejas de mejorar. El piloto automático es eficiente pero no genera crecimiento. La solución es combinar hábitos (ejecución automática) con práctica deliberada (atención activa en la mejora).

**La Regla de Goldilocks:** los humanos experimentamos motivación máxima cuando trabajamos en tareas en el límite exacto de nuestras capacidades actuales. Ni demasiado fácil (aburrimiento) ni demasiado difícil (ansiedad). El punto óptimo está aproximadamente un 4% más allá del nivel actual.

Los grandes atletas, músicos y ejecutores no solo practican más — practican *en el borde*, donde la tarea es suficientemente difícil para requerir atención total. Esta es la diferencia entre repetición automática y práctica deliberada.

**Revisión y reflexión:** Clear recomienda revisiones anuales (¿qué funcionó?, ¿qué no?, ¿qué debería cambiar?) e informes de integridad semestrales (¿quién soy?, ¿cuáles son mis valores?, ¿cómo estoy viviendo en relación a ellos?). Sin reflexión, el éxito puede convertirse en trampa — la identidad que te llevó hasta aquí puede impedirte llegar más lejos.`,
      },
    ],
    analysis: `## "So What" — Por Qué Importa Ahora

**Clear vs. Duhigg:** El marco de las 4 Leyes de Clear es más accionable que el Loop del Hábito de Duhigg (*El Poder del Hábito*, 2012). Duhigg explica *por qué* existen los hábitos; Clear te dice *cómo* diseñarlos paso a paso. Son complementarios: Duhigg para el mecanismo neurológico, Clear para el sistema de construcción.

**La dimensión de identidad que Fogg no tiene:** B.J. Fogg (*Tiny Habits*) se enfoca en el comportamiento mínimo y la celebración inmediata — tácticamente brillante, pero sin la palanca de identidad que explica la adherencia a largo plazo. Clear añade la pregunta "¿en quién me estoy convirtiendo?" que es lo que sostiene los hábitos bajo estrés.

**Implicaciones para equipos y organizaciones:** Las 4 Leyes son diseño de sistemas, no solo consejo personal. Un equipo puede rediseñar sus procesos usando los mismos principios: ¿qué señales hacemos obvias en el entorno de trabajo? ¿qué fricciones reducimos en los flujos correctos? Las culturas organizacionales son hábitos colectivos.

**Límite del libro:** Clear es fuerte en hábitos de comportamiento observable pero menos útil para hábitos cognitivos complejos (pensamiento estratégico, creatividad profunda). Para eso, *Trabajo Profundo* de Newport ofrece el complemento necesario — Clear te construye el hábito de sentarte a trabajar; Newport te dice qué hacer con ese tiempo.`,
    critiques: [
      "La evidencia científica es más delgada de lo que parece: muchos estudios citados son correlacionales o con muestras pequeñas. El «1% diario = 37x en un año» es matemáticamente correcto pero metafóricamente cuestionable aplicado a habilidades humanas, que no mejoran de forma exponencial indefinida.",
      "La regla de los 2 minutos puede ser contraproducente para hábitos que requieren compromiso real. Normaliza el esfuerzo mínimo en dominios donde la adherencia ya no es el problema sino la profundidad de la práctica.",
      "El libro subestima las circunstancias estructurales: hábitos como el ejercicio, la lectura y la nutrición dependen de condiciones económicas, de tiempo y de entorno que Clear trata como modificables por el individuo, cuando frecuentemente no lo son.",
    ],
    exercises: [
      {
        prompt:
          "Escribe un hábito que quieras construir y reformúlalo como una declaración de identidad ('Soy alguien que…'). Luego lista 3 acciones concretas que esa persona haría hoy, por pequeñas que sean.",
        type: "reflection",
      },
      {
        prompt:
          "Diseña un 'tablero de hábito': elige 1 hábito nuevo, define su señal específica (cuándo/dónde), hazlo ridículamente pequeño (máx. 2 minutos), y apílalo después de un hábito que ya tienes firmemente establecido.",
        type: "action",
      },
      {
        prompt:
          "Identifica un mal hábito tuyo. Mapea su ciclo completo (señal → anhelo → respuesta → recompensa). Luego aplica las 4 leyes inversas: ¿cómo puedes hacer esa señal invisible, la rutina difícil y la recompensa insatisfactoria?",
        type: "reflection",
      },
    ],
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
    overview: `## Los 7 Hábitos — Resumen Ejecutivo

Covey distingue entre la **ética del carácter** (valores internos, integridad, humildad) y la **ética de la personalidad** (técnicas, actitudes superficiales). Su argumento: la literatura de autoayuda del siglo XX se enfocó en la personalidad y produjo éxito frágil. Los principios atemporales del carácter producen efectividad duradera.

### La progresión de los 7 Hábitos
Los hábitos siguen una secuencia lógica de crecimiento:

**Victoria Privada** (dependencia → independencia):
1. **Sé proactivo** — responde desde valores, no desde impulsos
2. **Empieza con el fin en mente** — define tu misión personal antes de actuar
3. **Pon primero lo primero** — organiza por importancia, no por urgencia

**Victoria Pública** (independencia → interdependencia):
4. **Piensa en ganar-ganar** — busca acuerdos de beneficio mutuo
5. **Busca primero comprender** — escucha empáticamente antes de hablar
6. **Sinergiza** — las diferencias crean terceras alternativas superiores

**Renovación:**
7. **Afila la sierra** — renueva las cuatro dimensiones: física, mental, emocional, espiritual

### El cuadrante II: el hábito más subestimado
La mayoría vive en el cuadrante I (urgente e importante) o IV (urgente y no importante). El cuadrante II — importante pero **no** urgente — es donde vive la prevención, la planificación, las relaciones y el crecimiento personal. Invertir en él reduce el cuadrante I.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Mindset — Resumen Ejecutivo

Carol Dweck, psicóloga de Stanford, pasó décadas estudiando por qué algunas personas prosperan ante el desafío mientras otras se colapsan. Su hallazgo: la diferencia fundamental no es el talento sino la **mentalidad** — la historia que la persona se cuenta sobre si sus capacidades son fijas o maleables.

### Los dos mindsets cara a cara

| | Mentalidad Fija | Mentalidad de Crecimiento |
|---|---|---|
| Inteligencia | Innata e inmutable | Desarrollable con esfuerzo |
| Desafíos | Los evita (amenazan el ego) | Los abraza (son oportunidades) |
| Esfuerzo | Señal de poca habilidad | Camino al dominio |
| Fracaso | Amenaza a la identidad | Información para aprender |
| Crítica | La ignora o rechaza | Extrae lecciones de ella |

### Cómo se forman los mindsets
La forma en que se elogia tiene consecuencias masivas. Elogiar la **inteligencia** ("eres muy listo") → mentalidad fija: el niño evita retos para proteger esa identidad. Elogiar el **esfuerzo y la estrategia** ("te esforzaste / intentaste un enfoque diferente") → mentalidad de crecimiento.

### El cambio es posible
El mindset puede cambiarse conscientemente en cuatro pasos: (1) reconocer la voz de la mentalidad fija, (2) entender que tienes elección, (3) responder con la voz de crecimiento, (4) actuar sobre ese nuevo paradigma.`,
    chapters: [
      {
        title: "Los Dos Mindsets",
        content: `## Los Dos Mindsets

El punto de partida de Dweck es simple: las personas difieren en su creencia fundamental sobre *de dónde viene el talento y la habilidad*.

**Mentalidad fija:** las cualidades son talladas en piedra. Tienes una cierta cantidad de inteligencia, de personalidad, de carácter moral — y eso es todo. Cada situación se convierte en una prueba: ¿soy inteligente o estúpido? ¿tengo talento o no? Si fallas, la respuesta es "no eres suficiente" y eso amenaza toda tu identidad.

**Mentalidad de crecimiento:** las cualidades básicas son cultivables mediante dedicación y trabajo. La inteligencia no es un dato fijo sino un punto de partida. Los grandes logros — en arte, ciencia, deportes, negocios — vienen de años de pasión, trabajo y entrenamiento, no de un talento innato.

Dweck no dice que cualquiera puede ser Einstein con suficiente esfuerzo. Dice que el potencial humano es desconocido y que nadie puede predecir de antemano lo que alguien puede lograr con años de dedicación genuina.

**La trampa de la mentalidad fija:** necesitas *demostrar* constantemente que eres capaz. Cada tarea, relación o proyecto se convierte en una oportunidad de probar tu valía — o de exponerte. Esto lleva a evitar todo desafío donde podrías fracasar.`,
      },
      {
        title: "Dentro de los Mindsets: Retos, Esfuerzo y Fracasos",
        content: `## Dentro de los Mindsets: Retos, Esfuerzo y Fracasos

Los dos mindsets producen respuestas completamente distintas ante las mismas situaciones.

**Ante un desafío:**
- *Fija:* lo evita si hay riesgo de fracaso (fracasar probaría que no eres suficientemente bueno)
- *Crecimiento:* lo busca activamente (es donde ocurre el aprendizaje)

**Ante el esfuerzo:**
- *Fija:* ver el esfuerzo como algo negativo — si necesitas esforzarte mucho, significa que no tienes talento innato
- *Crecimiento:* el esfuerzo es el mecanismo del logro, no una señal de deficiencia

**Ante el fracaso:**
- *Fija:* el fracaso define quién eres. Las personas con mentalidad fija pueden entrar en depresión profunda por un mal examen, una crítica o una pérdida deportiva
- *Crecimiento:* el fracaso es información. "No *soy* un fracaso — *tuve* un fracaso"

**Ante la crítica:**
- *Fija:* la ignora o racionaliza (ataca al crítico, busca a alguien que lo haya hecho peor)
- *Crecimiento:* la busca activamente como fuente de datos

Dweck muestra cómo atletas de élite como Michael Jordan, campeones olímpicos y genios como Darwin tenían en común una respuesta de crecimiento ante los obstáculos — no la ausencia de ellos.`,
      },
      {
        title: "La Verdad sobre el Talento y los Elogios",
        content: `## La Verdad sobre el Talento y los Elogios

Uno de los hallazgos más contraintuitivos de Dweck: **elogiar a los niños por ser inteligentes les hace daño.**

En su experimento clásico, dividió niños en dos grupos después de una prueba donde todos tuvieron buen desempeño. A un grupo le dijeron "eres muy inteligente." Al otro: "te esforzaste mucho." Luego les ofrecieron elegir entre un problema fácil y uno difícil.

- Los elogiados por inteligencia: eligieron el fácil (no querían arriesgar su reputación)
- Los elogiados por esfuerzo: eligieron el difícil (querían aprender)

Cuando después todos enfrentaron problemas difíciles, los del primer grupo reportaron menos disfrute, peor desempeño y menor persistencia. Los del segundo grupo persistieron más y mejoraron.

**Qué elogiar en cambio:** el proceso — el esfuerzo, las estrategias, el enfoque, la persistencia, la mejora. "Te esforzaste mucho en esto." "Probaste un enfoque diferente cuando el primero no funcionó." "Mira cuánto has mejorado."

Esto aplica igualmente a adultos. Los managers que elogian el proceso crean equipos con mentalidad de crecimiento. Los que elogian el talento crean equipos que evitan el riesgo.`,
      },
      {
        title: "Mindset en los Negocios y el Liderazgo",
        content: `## Mindset en los Negocios y el Liderazgo

Dweck estudió culturas corporativas y encontró patrones claros. Las empresas con liderazgo de mentalidad fija comparten características: el CEO necesita ser el más inteligente, los errores se ocultan, el talento se acapara en la cima y hay una cultura de culpabilización.

**El CEO con mentalidad fija:** necesita probar constantemente que es el más inteligente. Rodea de aduladores, no de cuestionadores. Cuando las cosas salen mal, busca culpables externos. Ejemplo: Enron contrató solo a personas "brillantes" y creó una cultura donde admitir problemas era imposible.

**El CEO con mentalidad de crecimiento:** ve su rol como desarrollar talento, no demostrar el propio. Contrata personas que los desafíen. Trata los errores como información. Ejemplo: Jack Welch en GE, Lou Gerstner en IBM — su primera tarea fue eliminar la cultura de arrogancia y crear una de aprendizaje.

**Para managers:** la pregunta crítica es: ¿qué comportamientos son los que realmente recompensas? ¿El éxito sin riesgo, o el aprendizaje a través del error? Las culturas de crecimiento requieren psicológical safety — el equipo debe saber que puede hablar de problemas sin consecuencias.`,
      },
      {
        title: "Cambiar tu Mindset: El Proceso",
        content: `## Cambiar tu Mindset: El Proceso

Nadie tiene puramente uno u otro mindset. Todos tenemos una mezcla, y el mindset puede variar por dominio — puedes tener mentalidad de crecimiento en tu profesión y fija en las relaciones, o viceversa.

**El proceso de cambio en 4 pasos:**

1. **Reconoce la voz de la mentalidad fija:** "No soy bueno en esto." "¿Y si fallo?" "Pareceré estúpido." Obsérvala sin juzgarla — es el cerebro protegiéndote de la manera equivocada.

2. **Date cuenta de que tienes elección:** el pensamiento fijo es un hábito, no una verdad. Cuando aparece, no tienes que actuar desde él.

3. **Responde con la voz de crecimiento:** "¿Qué puedo aprender de esto?" "¿Qué estrategia diferente podría probar?" "Todavía no lo domino — la palabra clave es *todavía*."

4. **Actúa:** toma el desafío, busca la retroalimentación, persiste ante el obstáculo.

**El poder del "todavía":** Dweck encontró que añadir "todavía" a las afirmaciones negativas transforma completamente el impacto. "No entiendo esto" → "No entiendo esto *todavía*." Es un pequeño cambio lingüístico con consecuencias grandes sobre la motivación y la persistencia.`,
      },
    ],
    analysis: `## "So What" — Por Qué Importa Ahora

**El impacto más subestimado es el organizacional:** Dweck dedica capítulos enteros a las empresas, pero el mundo corporativo los subestima. Los líderes con mentalidad fija — que necesitan demostrar que son los más inteligentes — crean culturas donde se ocultan los errores y se castiga el riesgo. Los líderes de crecimiento crean culturas donde el fracaso es información. Esta diferencia explica por qué algunas culturas innovan y otras se estancan mucho más que la estrategia o el presupuesto.

**Conexión con Clear y Newport:** El concepto de Clear de «voto de identidad» es una aplicación práctica del mindset de crecimiento a los hábitos. El «Abraza el aburrimiento» de Newport es imposible sin mentalidad de crecimiento — alguien con mentalidad fija evita exactamente las situaciones donde podría quedar expuesto como menos que brillante.

**La crisis de replicabilidad:** Varios estudios de replicación del efecto de las intervenciones de mindset en aulas han producido resultados mixtos. El efecto parece más robusto cuando se implementa con fidelidad y en contextos con condiciones de seguridad psicológica. Dweck ha respondido refinando el modelo, pero es importante no sobre-generalizar las aplicaciones educativas.

**Para líderes de equipos:** la pregunta más útil del libro no es «¿cómo cambio mi mindset?» sino «¿qué señales en nuestro entorno están creando mentalidad fija en mi equipo?» Los sistemas de evaluación, cómo se habla del fracaso en las reuniones y quién recibe visibilidad son los vectores más poderosos.`,
    critiques: [
      "La división en dos mentalidades es didácticamente útil pero psicológicamente simplista. La mayoría de personas tiene mentalidad fija en algunos dominios (matemáticas, deportes) y de crecimiento en otros. El libro no aborda suficientemente esta variabilidad intra-personal.",
      "La crisis de replicabilidad afecta directamente las intervenciones educativas: los metaanálisis de 2018-2022 muestran efectos mucho más pequeños en aulas reales que los reportados en los estudios originales, especialmente en contextos socioeconómicos adversos.",
      "El libro cae en cierto voluntarismo: si crees lo suficiente en tu capacidad de crecer, crecerás. Esto puede derivar en una narrativa de culpabilización individual que ignora estructuras sistémicas — acceso a recursos, discriminación — que limitan el desarrollo independientemente del mindset.",
    ],
    exercises: [
      {
        prompt:
          "Piensa en un área donde tienes mentalidad fija ('no soy bueno en esto'). Escribe 3 momentos específicos en que esa creencia te llevó a evitar un reto o rendirte antes de tiempo. ¿Qué habría pasado si hubieras persistido con la mentalidad de que podías mejorar?",
        type: "reflection",
      },
      {
        prompt:
          "La próxima vez que enfrentes un fracaso o crítica esta semana, escríbela en papel. Luego respóndete: ¿Qué aprendí? ¿Qué estrategia diferente podría probar? Practica conscientemente convertir la reacción fija en respuesta de crecimiento.",
        type: "action",
      },
      {
        prompt:
          "Revisa cómo elogias a alguien que lideras o enseñas — o cómo te elogias a ti mismo. ¿Estás elogiando el resultado y el talento, o el proceso y el esfuerzo? Escribe 3 frases concretas de elogio orientadas al proceso que usarás esta semana.",
        type: "reflection",
      },
    ],
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
    overview: `## Trabajo Profundo — Resumen Ejecutivo

Cal Newport define el **trabajo profundo** como actividad cognitiva realizada en estado de concentración sin distracciones que lleva las capacidades al límite. Su hipótesis central: en la economía del conocimiento del siglo XXI, esta habilidad es simultáneamente la **más valiosa** y la **más escasa**.

### Por qué el trabajo profundo está desapareciendo
La cultura corporativa moderna privilegia la conectividad constante — emails, Slack, reuniones — que fragmenta la atención de forma permanente. Newport argumenta que este paradigma beneficia a la organización en términos de visibilidad, pero destruye el valor que los trabajadores del conocimiento pueden crear.

### Las cuatro filosofías del trabajo profundo
Newport no prescribe un único modelo — cada persona debe encontrar el suyo:
- **Monástica:** eliminar casi completamente las obligaciones superficiales
- **Bimodal:** periodos largos de aislamiento total alternados con tiempo normal
- **Rítmica:** sesiones cortas diarias a la misma hora (la más sostenible para la mayoría)
- **Periodística:** insertar trabajo profundo en los huecos del día (requiere entrenamiento)

### Las cuatro reglas
1. **Trabaja profundamente** — elige tu filosofía, crea rituales, haz gestos grandes
2. **Abraza el aburrimiento** — programa el uso de internet, practica la meditación productiva
3. **Abandona las redes sociales** — aplica la ley del artesano: ¿sus beneficios superan claramente sus costos?
4. **Drena lo superficial** — agenda cada minuto, cuantifica la profundidad de cada tarea, termina a hora fija

El objetivo: construir hacia **4 horas/día de trabajo profundo real**, que supera en output a 8 horas de trabajo fragmentado.`,
    chapters: [
      {
        title: "Trabajo Profundo: La Hipótesis Central",
        content: `## Trabajo Profundo: La Hipótesis Central

Newport abre con una pregunta: ¿qué tienen en común Carl Jung, J.K. Rowling, Bill Gates en sus "semanas de reflexión" y el escritor Neal Stephenson que no responde emails? Todos practican el trabajo profundo de forma sistemática y deliberada.

**Definición formal:** el trabajo profundo es la actividad profesional realizada en estado de concentración sin distracciones que lleva las capacidades cognitivas al límite. Crea nuevo valor, mejora habilidades y es difícil de replicar.

**La hipótesis:** en la nueva economía, quienes dominan el trabajo profundo prosperarán. El trabajo profundo te permite (1) aprender cosas difíciles rápidamente y (2) producir al mejor nivel en términos de calidad y velocidad. Ambas capacidades son la base del éxito en la economía del conocimiento.

**El trabajo superficial** — emails, reuniones de status, tareas administrativas realizadas distraído — es fácil de replicar y crea poco valor. Es visible y parece productivo, pero no produce las cosas que realmente importan.

Newport argumenta que no es coincidencia que el trabajo profundo sea valioso *y* escaso al mismo tiempo — son causalmente relacionados. La misma cultura que destruye la capacidad de concentración también incrementa el valor de quienes la mantienen.`,
      },
      {
        title: "El Trabajo Profundo es Raro (y por qué las organizaciones lo sabotean)",
        content: `## El Trabajo Profundo es Raro

Newport identifica tres fuerzas que empujan a las organizaciones hacia la superficialidad:

**1. La métrica de la ocupación visible:** en ausencia de indicadores claros de productividad, los trabajadores del conocimiento recurren a la señal más fácil de medir: parecer ocupado. Responder emails inmediatamente, estar disponible en Slack, tener el calendario lleno. Estas señales son visibles pero no crean valor real.

**2. La cultura de la conectividad:** la comunicación instantánea facilita la coordinación y resuelve problemas inmediatos, pero fragmenta la atención de todos permanentemente. Las organizaciones rara vez calculan el costo cognitivo acumulado.

**3. La ideología de internet:** hay una presunción cultural de que todo lo nuevo y conectado es bueno. Resistir las últimas herramientas de comunicación parece retrógrado, aunque esas herramientas destruyan la capacidad de producir trabajo profundo.

El resultado: las organizaciones sistemáticamente crean condiciones donde el trabajo profundo es casi imposible, y luego se preguntan por qué la innovación y la productividad real son tan difíciles de sostener.`,
      },
      {
        title: "Regla 1: Trabaja Profundamente",
        content: `## Regla 1: Trabaja Profundamente

Querer hacer trabajo profundo no es suficiente — debes diseñar tu vida para que sea posible. Newport propone cuatro filosofías:

**Monástica:** eliminar o reducir radicalmente las obligaciones superficiales. El matemático Donald Knuth no tiene email. El novelista Neal Stephenson no acepta solicitudes de reunión. Solo viable para quienes tienen completa autonomía sobre su tiempo.

**Bimodal:** dividir el tiempo en bloques amplios de trabajo profundo y períodos de disponibilidad normal. Jung construyó una torre en Bollingen donde se retiraba durante semanas. Los académicos frecuentemente usan veranos o sabbaticals.

**Rítmica:** la más práctica para la mayoría. Bloques cortos diarios a la misma hora — típicamente las primeras 2-4 horas del día, antes de que el mundo llegue. Se convierte en hábito y no requiere decisiones.

**Periodística:** insertar trabajo profundo en cualquier hueco disponible del día. Difícil de implementar porque requiere entrenamiento previo — el cerebro debe poder entrar en modo profundo rápidamente.

**Rituales de inicio y cierre:** define exactamente cómo empiezas (un café, revisar los objetivos del bloque, silenciar el teléfono) y cómo terminas (revisión de lo logrado, listar próximos pasos, decirte explícitamente "trabajo terminado por hoy").`,
      },
      {
        title: "Regla 2: Abraza el Aburrimiento",
        content: `## Regla 2: Abraza el Aburrimiento

El mayor error es creer que puedes trabajar distraído todo el día y luego concentrarte profundamente cuando lo necesitas. La concentración es un músculo que se atrofia con el desuso.

**El problema de la estimulación constante:** cuando entrenamos al cerebro para buscar novedad en cualquier momento de aburrimiento (revisar el teléfono en la fila, en el semáforo, esperando el ascensor), debilitamos la capacidad de mantener la atención durante el trabajo profundo.

**Programa el uso de internet:** en lugar de desconectarte de internet periódicamente, Newport propone lo contrario — programa bloques específicos para usar internet y mantén la conexión prohibida fuera de esos bloques. Esto incluye email, redes sociales y cualquier sitio de distracción. El efecto: entrenas al cerebro a resistir los impulsos de cambiar el foco.

**Meditación productiva:** durante actividades físicas que no requieren atención mental (caminar, correr, ducharse), enfoca activamente tu pensamiento en un problema profesional. No dejes que la mente divague — trabaja en el problema. Los filósofos peripatéticos ya sabían que el movimiento y el pensamiento profundo son compatibles.

**Abraza el aburrimiento real:** cuando esperas, no saques el teléfono. Deja que la mente procese, divague brevemente y regrese. Esta práctica, acumulada, reconstruye la tolerancia al aburrimiento que es prerequisito del trabajo profundo.`,
      },
      {
        title: "Regla 3: Abandona las Redes Sociales",
        content: `## Regla 3: Abandona las Redes Sociales

Newport no argumenta que las redes sociales son inherentemente malas — argumenta que la decisión de adoptarlas se toma con criterios equivocados.

**La lógica del mínimo beneficio:** "Esta herramienta tiene algún beneficio para mí, por lo tanto debo usarla." El problema: ignora el costo de usar esa herramienta, particularmente el costo de atención fragmentada.

**La ley del artesano:** adopta una herramienta solo si sus beneficios para tus metas más importantes superan claramente sus desventajas. Un carpintero experto elige sus herramientas con criterio — no porque "podrían ser útiles" sino porque son las mejores para el trabajo específico.

Aplicado a redes sociales: lista tus dos o tres objetivos más importantes (profesionales y personales). Para cada red social que usas, evalúa si contribuye *significativamente* a esos objetivos, o solo marginalmente. La mayoría de redes sociales ofrecen beneficios marginales y costos de atención sustanciales.

**El experimento de 30 días:** deja de usar la red social sin anuncio dramático. Después de 30 días, pregúntate: ¿alguien notó que no estaba? ¿Extrañé algo importante? ¿Habría sido peor mi vida o trabajo sin ella? La mayoría de respuestas son "no".`,
      },
      {
        title: "Regla 4: Drena lo Superficial",
        content: `## Regla 4: Drena lo Superficial

El trabajo superficial es inevitable pero no debe dominar el calendario. La estrategia de Newport para contenerlo:

**Agenda cada minuto del día:** al inicio de cada jornada, divide el día en bloques de 30 minutos y asigna una tarea a cada bloque. No para seguir el plan rígidamente — para obligarte a tomar decisiones conscientes sobre el tiempo en lugar de dejar que las distracciones decidan.

**Cuantifica la profundidad:** para cada actividad importante, pregúntate: "¿Cuántos meses de entrenamiento necesitaría un recién graduado inteligente para hacer esta tarea?" Alta profundidad = meses. Baja profundidad = días o ninguno. Usa esto para priorizar dónde poner la energía.

**Fija una cuota de trabajo superficial:** decide qué porcentaje del día puede ser superficial (30-50% para la mayoría de trabajos del conocimiento) y no superes ese límite conscientemente.

**Termina a una hora fija:** determina con anticipación a qué hora terminas el trabajo, sin excepción. Esto crea presión para usar el tiempo disponible en lo que importa. Newport termina a las 17:30 todos los días — y produce más que la mayoría de académicos con horarios "abiertos". El principio: un límite claro fuerza la eficiencia.`,
      },
    ],
    analysis: `## "So What" — Por Qué Importa Ahora

**Newport tenía razón — y la IA lo amplifica:** Escribió el libro en 2016 anticipando que las tareas superficiales serían automatizadas. En 2024-2025, eso está ocurriendo. Los modelos de lenguaje grandes automatizan emails, resúmenes y tareas cognitivas rutinarias. Lo que permanece insustituible es exactamente la síntesis creativa compleja, el juicio estratégico y la producción de trabajo original — todas actividades que requieren trabajo profundo.

**Newport complementa a Clear:** *Hábitos Atómicos* te construye el hábito de sentarte a trabajar; *Trabajo Profundo* te dice qué hacer durante esas horas. Son el par más poderoso de la biblioteca de productividad. Usa a Clear para establecer el ritual; usa a Newport para entender por qué vale la pena protegerlo.

**Conexión con Csikszentmihalyi:** el estado de «trabajo profundo» de Newport y el «flujo» de Csikszentmihalyi son el mismo fenómeno descrito desde perspectivas distintas — productividad vs. psicología positiva. Leer ambos juntos da una imagen más completa: Newport te dice cuándo y cómo crear las condiciones; Csikszentmihalyi explica por qué el resultado vale la pena.

**El límite real:** Newport diagnostica un problema estructural (las organizaciones incentivan la superficialidad) pero ofrece soluciones mayormente individuales. El cambio real requiere transformar cómo los equipos miden el rendimiento — no solo cómo el individuo gestiona su calendario. Sin cambio organizacional, el individuo que intenta hacer trabajo profundo en una cultura superficial paga un costo social alto.`,
    critiques: [
      "Newport sobrestima la posibilidad de aislar el trabajo de las demandas organizacionales. En la mayoría de empleos, la disponibilidad constante no es una preferencia sino un requisito explícito. Su consejo implica un privilegio de autonomía que pocos trabajadores tienen.",
      "La hostilidad hacia las redes sociales es filosóficamente coherente pero empíricamente cuestionable: hay evidencia de que el uso moderado mejora el acceso a información relevante y las redes profesionales, especialmente para emprendedores y creativos que dependen de la visibilidad.",
      "El modelo de 4 horas de trabajo profundo máximo al día puede desanimar a quienes no alcanzan ese ideal, creando una forma de perfeccionismo productivo. Newport no aborda suficientemente la curva de aprendizaje para quienes entrenan esta capacidad desde cero.",
    ],
    exercises: [
      {
        prompt:
          "Registra mañana completo en bloques de 30 minutos. Clasifica cada bloque como 'profundo' (concentración total, cognitivamente exigente), 'superficial' (email, reuniones, admin) o 'logístico'. ¿Cuántas horas reales de trabajo profundo tuviste?",
        type: "action",
      },
      {
        prompt:
          "Diseña tu ritual de trabajo profundo: define duración (empieza con 60-90 min), lugar específico, qué está permitido y qué prohibido durante ese bloque, y cómo cierras la sesión. Impleméntalo mañana.",
        type: "action",
      },
      {
        prompt:
          "Elige una red social que uses regularmente. Aplica la 'ley del artesano' de Newport: lista los beneficios concretos para tus 2-3 metas más importantes vs. los costos en atención fragmentada. ¿La balanza justifica mantenerla?",
        type: "reflection",
      },
    ],
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
    overview: `## El Poder del Hábito — Resumen Ejecutivo

Duhigg revela la neurociencia detrás del loop **señal → rutina → recompensa** que gobierna todo comportamiento automático. Su hallazgo más importante: los hábitos nunca se eliminan — solo se reemplazan. El cerebro los codifica permanentemente en los ganglios basales, listos para reactivarse con la señal correcta.

### La regla de oro del cambio de hábito
Mantén la señal y la recompensa; cambia solo la rutina. Si comes galletas a las 3pm (señal: el reloj; recompensa: socialización y estímulo), no intentes eliminar el snack — reemplaza la rutina por caminar hasta el escritorio de un colega.

### Los hábitos clave (keystone habits)
Algunos hábitos desencadenan cambios positivos en cascada. El ejercicio es el más poderoso: quienes comienzan a ejercitar regularmente también empiezan a comer mejor, dormir más, beber menos y ser más productivos en el trabajo. Identificar y transformar tu hábito clave tiene efecto multiplicador.

### La fuerza de voluntad no es suficiente
La voluntad es un recurso limitado que se agota durante el día. El diseño de rutinas — convertir las decisiones importantes en automáticas — es más confiable que depender del autocontrol. Los equipos de alto rendimiento y las empresas excelentes convierten las buenas decisiones en hábitos institucionales.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Piense y Hágase Rico — Resumen Ejecutivo

Basado en 20 años de investigación sobre los hombres más exitosos de América (Carnegie, Ford, Edison, Roosevelt), Hill sintetiza 13 principios que transforman el **deseo ardiente** en su equivalente físico. Su tesis central: el éxito empieza en la mente, y la mente puede entrenarse para atraer lo que busca.

### Los principios más accionables

**Deseo** — el punto de partida no es un deseo vago ("quiero ser rico") sino uno específico con monto exacto, fecha límite y precio claro a pagar. Escríbelo y léelo dos veces al día.

**Mente Maestra** — dos o más mentes coordinadas con armonía hacia un objetivo común crean una inteligencia combinada superior a la suma de las partes. Hill considera este el principio más poderoso para los negocios.

**Persistencia** — Hill considera la falta de persistencia la causa número uno del fracaso. El momento más cercano al éxito frecuentemente llega justo después del punto donde la mayoría se rinde.

### Contexto histórico
Publicado en 1937, durante la Gran Depresión, el libro fue deliberadamente optimista en un momento de desesperanza colectiva. Muchos de sus principios sobre el subconsciente y la «ley de atracción» carecen de base científica moderna, pero el núcleo práctico — deseo específico, plan escrito, persistencia, redes de apoyo — sigue siendo sólido.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## El Hombre en Busca de Sentido — Resumen Ejecutivo

Viktor Frankl, psiquiatra vienés, sobrevivió tres años en Auschwitz y Dachau perdiendo a casi toda su familia. De esa experiencia surgió la **Logoterapia** — su sistema psicoterapéutico — y su tesis central: el ser humano puede soportar cualquier «cómo» si tiene un «para qué» suficientemente poderoso.

### La Logoterapia en tres premisas
1. La vida tiene sentido bajo **cualquier** circunstancia, incluso en el sufrimiento
2. El ser humano está motivado principalmente por la **voluntad de sentido** (no por el placer como Freud, ni por el poder como Adler)
3. El ser humano tiene **libertad** para encontrar ese sentido

### Los tres caminos hacia el sentido
- **Crear o trabajar** — contribuir algo al mundo
- **Amar** — amar a una persona por lo que es, no por lo que da
- **Sufrir con dignidad** — elegir la actitud ante el sufrimiento inevitable

### La paradoja de la felicidad
Buscar la felicidad directamente la aleja. La felicidad y el éxito son **efectos secundarios** del compromiso con algo más grande que uno mismo. "No preguntes qué esperas de la vida — pregunta qué espera la vida de ti."

La cita más citada del libro: *"Entre el estímulo y la respuesta existe un espacio. En ese espacio reside nuestra libertad."*`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## El Inversor Inteligente — Resumen Ejecutivo

Benjamin Graham, mentor de Warren Buffett, escribió la biblia del **value investing**. Su mensaje central: trata las acciones como lo que son — participaciones en negocios reales — y usa las oscilaciones del mercado en tu favor, no como guía de tus decisiones.

### La metáfora de Mr. Market
Imagina un socio irracional (Mr. Market) que cada día te ofrece precios distintos por tu participación en un negocio, oscilando entre el optimismo irracional y el pánico extremo. Tu trabajo no es seguir sus estados de ánimo — es reconocer cuándo sus precios son irracionales y aprovecharte de ellos.

### Dos tipos de inversores
- **Defensivo (pasivo):** diversificación amplia, fondos indexados de bajo costo, rebalanceo periódico, ignorar las fluctuaciones diarias. Requiere poco tiempo y produce resultados adecuados para la mayoría.
- **Emprendedor (activo):** busca acciones por debajo de su valor intrínseco. Requiere conocimiento significativamente superior al promedio y tiempo sustancial. Muy pocos lo hacen bien de forma consistente.

### El margen de seguridad: el concepto más importante
Compra solo activos significativamente más baratos que su valor calculado. El margen protege contra errores de análisis, mala suerte y hechos imprevistos. "En inversión, el precio es lo que pagas; el valor es lo que recibes."

**Advertencia de Graham:** la mayoría de inversores individuales y gestores activos no superan el mercado a largo plazo. Los fondos indexados de bajo costo son la estrategia correcta para la mayoría.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## La Semana Laboral de 4 Horas — Resumen Ejecutivo

Ferriss desafía el modelo de «trabajar 40 años para jubilarse» y propone el marco **DEAL**: Definición, Eliminación, Automatización, Liberación. Su argumento: la riqueza de estilo de vida — tiempo + movilidad + dinero suficiente — es alcanzable ahora, no en la jubilación.

### El marco DEAL

**Definición:** los "Nuevos Ricos" no tienen metas de dinero sino de estilo de vida. Define qué quieres hacer, ser y tener — con detalle concreto. ¿Cuánto dinero necesitas realmente para esa vida?

**Eliminación:** aplica el 80/20 radicalmente. El 20% de tus clientes genera el 80% de tus ingresos; el 20% de tus actividades produce el 80% de tus resultados. Elimina o limita el 80% restante. Añade la dieta de información: consume solo lo necesario para tomar decisiones.

**Automatización:** crea sistemas que funcionen sin ti. Asistentes virtuales para tareas delegables, productos de información para ingresos pasivos, procesos automatizados para ventas y soporte.

**Liberación:** negocia trabajo remoto o construye un negocio portable. La geolibertad — vivir en mercados de bajo costo con ingresos de alto costo — multiplica el poder adquisitivo.

### La pregunta del miedo
Antes de cualquier decisión que temes: ¿cuál es el peor caso real? ¿Cuán probable es? ¿Cómo te recuperarías? La mayoría de miedos no sobreviven este análisis.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Fluir (Flow) — Resumen Ejecutivo

Csikszentmihalyi pasó décadas estudiando cuándo las personas son más felices y más productivas. Su hallazgo: el estado de **flow** — absorción total en una actividad desafiante — es la experiencia humana óptima. No el placer pasivo ni el descanso, sino la implicación activa al límite de las propias capacidades.

### Las condiciones del flow
El flow ocurre cuando se cumplen tres condiciones simultáneamente:
1. **Metas claras** en cada paso de la actividad
2. **Feedback inmediato** sobre el progreso
3. **Equilibrio desafío-habilidad:** la tarea está en el límite exacto de tus capacidades — ni tan fácil que aburra, ni tan difícil que genere ansiedad

### La paradoja del ocio
El tiempo libre produce *menos* flow que el trabajo bien estructurado. Ver televisión, navegar redes sociales y el descanso pasivo son psicológicamente empobrecedores comparados con actividades activas como la música, el deporte, la conversación profunda o el trabajo creativo.

### El self que desaparece y vuelve más fuerte
En el estado de flow, el sentido del yo desaparece temporalmente — no hay autoconsciencia, solo la actividad. Pero al salir del flow, el yo emerge más complejo, más capaz. Este es el mecanismo del crecimiento personal: la actividad al límite que produce desarrollo real.

**Aplicación práctica:** cualquier tarea puede convertirse en flow si le añades metas claras, buscas feedback inmediato y ajustas la dificultad justo por encima de tu nivel actual.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Cómo Ganar Amigos e Influir Sobre las Personas — Resumen Ejecutivo

Publicado en 1936 y con más de 30 millones de copias vendidas, Carnegie demostró que el **85% del éxito profesional** proviene de habilidades de relaciones interpersonales, no del conocimiento técnico. El libro sigue siendo el manual de inteligencia social más práctico disponible.

### Los tres principios fundamentales
1. **No critiques, no condenes, no te quejes** — la crítica nunca produce el cambio que buscas; solo genera resentimiento y defensividad
2. **Da apreciación sincera y honesta** — el deseo más profundo de la naturaleza humana es sentirse importante; quien satisface ese deseo genuinamente tiene un poder enorme
3. **Despierta en el otro un deseo ferviente** — habla siempre en términos de los intereses de la otra persona, no de los tuyos

### Las seis maneras de agradar
Interésate genuinamente por los demás · Sonríe · Recuerda y usa los nombres · Sé un oyente genuino · Habla de los intereses del otro · Haz sentir importante a la otra persona

### Cómo influir sin imponer
Carnegie enseña a cambiar comportamientos sin crear resistencia: nunca decir «estás equivocado», empezar con preguntas que obtengan síes, dejar que el otro sienta que la idea fue suya, reconocer los propios errores rápida y enfáticamente.

La palabra clave en todo el libro: **sinceramente**. Estas técnicas funcionan solo cuando nacen de un interés genuino por las personas, no como manipulación.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
    overview: `## Pensar Rápido, Pensar Despacio — Resumen Ejecutivo

Daniel Kahneman, Premio Nobel de Economía, pasó décadas con Amos Tversky estudiando cómo los humanos toman decisiones. Su hallazgo central: el pensamiento humano opera con dos sistemas que frecuentemente entran en conflicto.

### Los dos sistemas

**Sistema 1 (Rápido):** automático, intuitivo, emocional, inconsciente. Opera sin esfuerzo y constantemente. Es la fuente de primeras impresiones, intuiciones y reacciones emocionales. También es la fuente de sesgos cognitivos.

**Sistema 2 (Lento):** deliberado, analítico, lógico, consciente. Se activa con esfuerzo y es costoso energéticamente. Es perezoso por naturaleza — busca delegar en el Sistema 1 siempre que puede.

### Los sesgos más importantes
- **Anclaje:** el primer número escuchado domina las estimaciones posteriores
- **Aversión a la pérdida:** perder $100 duele aproximadamente el doble de lo que alegra ganar $100
- **WYSIATI:** tomamos decisiones como si la información disponible fuera toda la información relevante
- **Exceso de confianza:** sistemáticamente subestimamos el tiempo, costo y riesgo de proyectos

### Cómo tomar mejores decisiones
Activa el Sistema 2 antes de decisiones importantes. Implementa el **premortem**: antes de lanzar un proyecto, imagina que falló y explica por qué. Busca activamente información que *contradiga* tu hipótesis (combate el sesgo de confirmación). Usa listas de verificación para decisiones repetibles.`,
    chapters: NO_CHAPTERS,
    analysis: "",
    critiques: [],
    exercises: NO_EXERCISES,
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
