"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/userStore";
import { trackLessonProgress, TimeTracker } from "@/lib/events";
import { GET_ENTITIES } from "@/graphql/api/operations";
import { entityClient } from "@/lib/apollo";
import type {
  InteractiveLesson,
  LessonProgress,
  LessonBlock,
  LearningPath,
} from "@/types/lesson";

interface UseLessonsOptions {
  lessonId?: string;
}

// Lesson catalog — add new lessons here to make them available at /learn/[id]
const mockLessons: InteractiveLesson[] = [
  // ── Lección 1: Introducción a la IA ────────────────────────────────────────
  {
    id: "intro-ai",
    title: "Introducción a la Inteligencia Artificial",
    description: "Aprende los conceptos fundamentales de la IA y cómo está transformando el mundo",
    estimatedMinutes: 15,
    difficulty: "beginner",
    tags: ["IA", "Fundamentos"],
    concepts: ["machine-learning", "neural-networks"],
    prerequisites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [
      {
        type: "content",
        markdown: `# ¿Qué es la Inteligencia Artificial?

La **Inteligencia Artificial (IA)** es un campo de la informática que se enfoca en crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.

## Tipos principales de IA

1. **IA Estrecha (Narrow AI)**: Diseñada para tareas específicas — como reconocer imágenes o traducir texto
2. **IA General (AGI)**: Capacidad cognitiva similar a la humana — todavía teórica
3. **Superinteligencia**: Supera la inteligencia humana en todos los aspectos — futuro especulativo

## Historia rápida

- **1950** — Alan Turing propone el *Test de Turing* para evaluar si una máquina puede "pensar"
- **1956** — Se acuña el término "Inteligencia Artificial" en Dartmouth
- **2012** — Deep learning revoluciona el reconocimiento de imágenes
- **2022** — ChatGPT democratiza los modelos de lenguaje para el público general

> La IA ya está presente en tu vida diaria: desde asistentes virtuales hasta recomendaciones de contenido.`,
      },
      {
        type: "quiz",
        question: "¿Cuál de los siguientes es un ejemplo de IA Estrecha?",
        options: [
          "Un robot que puede hacer cualquier tarea humana",
          "Un asistente virtual como Siri o Alexa",
          "Un sistema que supera la inteligencia humana en todo",
          "Una IA con conciencia propia",
        ],
        correctIndex: 1,
        explanation:
          "Los asistentes virtuales como Siri o Alexa son ejemplos de IA Estrecha: están diseñados para tareas específicas (reconocer voz, responder preguntas) pero no pueden generalizar fuera de ese dominio.",
        points: 10,
      },
      {
        type: "content",
        markdown: `## Machine Learning — el motor de la IA moderna

El **Machine Learning** (Aprendizaje Automático) es la rama de la IA que permite a los sistemas **aprender de datos** sin ser programados explícitamente para cada caso.

### Los tres paradigmas de aprendizaje

| Tipo | Cómo aprende | Ejemplo |
|------|-------------|---------|
| **Supervisado** | De datos etiquetados (input → output conocido) | Detector de spam |
| **No supervisado** | Encuentra patrones en datos sin etiquetar | Segmentación de clientes |
| **Por refuerzo** | Maximiza recompensas mediante prueba y error | Juegos de IA (AlphaGo) |

### Ciclo de un modelo de ML

1. **Recopilar datos** → 2. **Entrenar modelo** → 3. **Evaluar** → 4. **Desplegar** → 5. **Monitorizar**`,
      },
      {
        type: "callout",
        variant: "tip",
        title: "Dato curioso",
        body: "El término 'Machine Learning' fue acuñado por Arthur Samuel en 1959 mientras desarrollaba un programa que jugaba a las damas y aprendía a mejorar con la práctica.",
      },
      {
        type: "divider",
        label: "Práctica",
      },
      {
        type: "exercise",
        prompt:
          "Identifica 3 aplicaciones de IA que uses en tu vida cotidiana. Para cada una, indica: (1) qué tipo de IA es, (2) qué datos usa para aprender, y (3) qué tarea resuelve.",
        hints: [
          "Piensa en tu smartphone: reconocimiento facial, teclado predictivo, mapas…",
          "Considera plataformas de streaming: ¿cómo saben qué recomendarte?",
          "Los filtros de correo spam son uno de los ejemplos más clásicos de ML supervisado",
        ],
      },
      {
        type: "ai-interaction",
        context:
          "El estudiante está aprendiendo sobre IA y Machine Learning por primera vez. Ayúdale a explorar los conceptos con ejemplos concretos de su área de interés.",
        suggestedQuestions: [
          "¿Cómo funciona exactamente el aprendizaje supervisado con un ejemplo real?",
          "¿Cuáles son las aplicaciones de IA con más impacto en los próximos años?",
          "¿Necesito saber programar para trabajar en IA o hay roles no técnicos?",
        ],
      },
      {
        type: "reflection",
        prompt:
          "Reflexiona sobre cómo la IA podría impactar tu campo profesional o área de estudio en los próximos 5 años.",
        guidingQuestions: [
          "¿Qué tareas repetitivas de tu trabajo podrían automatizarse?",
          "¿Qué nuevas habilidades serán más valiosas en un mundo con IA?",
          "¿Ves la IA principalmente como una herramienta, una amenaza o una oportunidad?",
        ],
      },
      {
        type: "quiz",
        question:
          "Un modelo que aprende a detectar correos spam analizando miles de emails etiquetados como 'spam' o 'no spam' usa:",
        options: [
          "Aprendizaje no supervisado",
          "Aprendizaje por refuerzo",
          "Aprendizaje supervisado",
          "Aprendizaje profundo",
        ],
        correctIndex: 2,
        explanation:
          "Es aprendizaje supervisado: el modelo aprende de ejemplos con etiquetas conocidas (spam / no spam). El aprendizaje profundo puede ser supervisado o no supervisado; es una técnica, no un paradigma.",
        points: 10,
      },
    ],
  },

  // ── Lección 2: Machine Learning en profundidad ─────────────────────────────
  {
    id: "ml-basics",
    title: "Machine Learning: De los Datos al Modelo",
    description: "Comprende el ciclo completo de un proyecto de ML y los algoritmos más importantes",
    estimatedMinutes: 25,
    difficulty: "beginner",
    tags: ["Machine Learning", "Algoritmos", "Datos"],
    concepts: ["supervised-learning", "model-training", "evaluation"],
    prerequisites: ["intro-ai"],
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [
      {
        type: "content",
        markdown: `# Machine Learning: De los Datos al Modelo

## ¿Por qué Machine Learning?

Los programas tradicionales siguen **reglas escritas por humanos**. El ML invierte este paradigma: en lugar de escribir reglas, le damos **datos y ejemplos** y el algoritmo descubre las reglas por sí mismo.

\`\`\`
Programación tradicional:  Datos + Reglas  →  Resultados
Machine Learning:          Datos + Resultados  →  Reglas (el modelo)
\`\`\`

## Los algoritmos más importantes

### 1. Regresión Lineal
Predice valores continuos. Ejemplo: precio de una casa en función de su tamaño.

### 2. Regresión Logística
Clasifica en categorías. Ejemplo: ¿este tumor es maligno o benigno?

### 3. Árboles de Decisión
Divide el problema en preguntas sí/no. Muy interpretables.

### 4. Random Forest
Combina cientos de árboles para mayor precisión y robustez.

### 5. Redes Neuronales
Imitan el cerebro humano. Base del Deep Learning moderno.`,
      },
      {
        type: "quiz",
        question: "Quieres predecir la temperatura de mañana en grados Celsius. ¿Qué tipo de problema es?",
        options: [
          "Clasificación binaria",
          "Clasificación multiclase",
          "Regresión",
          "Clustering",
        ],
        correctIndex: 2,
        explanation:
          "Es un problema de regresión porque el resultado (temperatura) es un valor numérico continuo, no una categoría. Clasificación sería si quisieras predecir 'hace calor / hace frío'.",
        points: 10,
      },
      {
        type: "content",
        markdown: `## El ciclo completo de un proyecto de ML

### Fase 1: Datos
- **Recolección**: ¿Qué datos necesito y de dónde los obtengo?
- **Limpieza**: Gestionar valores nulos, duplicados, outliers
- **Exploración (EDA)**: Entender distribuciones y correlaciones
- **Feature engineering**: Crear nuevas variables que ayuden al modelo

### Fase 2: Modelado
- **División train/test**: Separar datos para entrenar y evaluar (típicamente 80/20)
- **Entrenamiento**: El algoritmo ajusta sus parámetros minimizando el error
- **Validación cruzada**: Evitar sobreajuste (overfitting)

### Fase 3: Evaluación
Métricas según el tipo de problema:

| Tipo | Métricas clave |
|------|---------------|
| Regresión | MAE, RMSE, R² |
| Clasificación | Accuracy, Precision, Recall, F1, AUC-ROC |
| Clustering | Silhouette score, Davies-Bouldin |

### Fase 4: Producción
- Serializar el modelo (pickle, ONNX, TensorFlow SavedModel)
- Crear API para servir predicciones
- Monitorizar drift del modelo en el tiempo

> **Geoffrey Hinton**, **Yann LeCun** y **Yoshua Bengio** — los "padrinos del Deep Learning" — recibieron el Premio Turing 2018 por revolucionar estas técnicas con redes neuronales profundas.`,
      },
      {
        type: "quiz",
        question: "Tu modelo de clasificación tiene 99% de accuracy pero falla en detectar fraudes (que son el 1% de los datos). ¿Cuál es el problema?",
        options: [
          "El modelo está subajustado (underfitting)",
          "Las métricas son incorrectas",
          "El dataset está desbalanceado — el modelo aprendió a predecir siempre 'no fraude'",
          "Necesitas más datos de entrenamiento",
        ],
        correctIndex: 2,
        explanation:
          "Este es el problema del dataset desbalanceado. Si el 99% son transacciones normales, un modelo que siempre diga 'no fraude' tiene 99% accuracy pero detecta 0 fraudes. Por eso en estos casos se usa Recall, F1 o AUC-ROC en lugar de accuracy.",
        points: 15,
      },
      {
        type: "exercise",
        prompt:
          "Diseña a alto nivel un sistema de ML para recomendar canciones en una app de música. Define: (1) qué datos usarías, (2) qué tipo de problema es (supervisado/no supervisado), (3) qué métrica usarías para evaluar si las recomendaciones son buenas, y (4) un riesgo o limitación ética.",
        hints: [
          "Piensa en Spotify: historial de escucha, likes, tiempo de escucha, skips…",
          "¿Puedes medir si una recomendación fue 'buena'? ¿Cómo lo etiquetarías?",
          "Considera el 'efecto burbuja': ¿el sistema te encerrará en los mismos géneros?",
        ],
      },
      {
        type: "ai-interaction",
        context:
          "El estudiante está aprendiendo sobre ciclos de proyectos de ML y algoritmos. Puede tener preguntas sobre casos prácticos, herramientas (Python, sklearn) o dilemas éticos.",
        suggestedQuestions: [
          "¿Cómo elijo entre un árbol de decisión y una red neuronal para mi problema?",
          "¿Qué es el overfitting exactamente y cómo lo evito?",
          "¿Qué herramientas de Python se usan en proyectos reales de ML?",
        ],
      },
      {
        type: "reflection",
        prompt:
          "El Machine Learning aprende de datos históricos, lo que significa que puede perpetuar sesgos del pasado. Reflexiona sobre un escenario donde esto podría ser problemático.",
        guidingQuestions: [
          "¿Qué pasaría si un sistema de contratación de empleo se entrenara con datos históricos de una empresa con poca diversidad?",
          "¿Quién debería ser responsable de los errores de un modelo de ML?",
          "¿Cómo equilibrarías la precisión de un modelo con su equidad (fairness)?",
        ],
      },
    ],
  },

  // ── Lección 3: Grafos de Conocimiento ──────────────────────────────────────
  {
    id: "knowledge-graphs",
    title: "Grafos de Conocimiento y Neo4j",
    description: "Aprende cómo las bases de datos de grafos organizan el conocimiento y potencian la IA",
    estimatedMinutes: 20,
    difficulty: "intermediate",
    tags: ["Knowledge Graph", "Neo4j", "Bases de Datos"],
    concepts: ["graph-database", "cypher", "knowledge-representation"],
    prerequisites: ["intro-ai"],
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [
      {
        type: "content",
        markdown: `# Grafos de Conocimiento

## ¿Qué es un grafo?

Un **grafo** es una estructura matemática compuesta por:
- **Nodos** (vértices): representan entidades — personas, conceptos, lugares
- **Aristas** (relaciones): representan cómo están conectadas las entidades

Esta estructura captura algo que las tablas relacionales no pueden expresar fácilmente: **la red de relaciones entre cosas**.

## De tabla relacional a grafo

**Base de datos relacional** para "Alan Turing trabajó en Bletchley Park":
\`\`\`
Tabla Personas: id=1, nombre="Alan Turing"
Tabla Lugares:  id=5, nombre="Bletchley Park"  
Tabla Trabajó:  persona_id=1, lugar_id=5
\`\`\`

**Grafo** equivalente:
\`\`\`
(Alan Turing) -[:TRABAJÓ_EN]→ (Bletchley Park)
\`\`\`

El grafo es más natural para datos altamente conectados: redes sociales, mapas de conocimiento, sistemas de recomendación.

## Neo4j: la base de datos de grafos más popular

Neo4j almacena datos como grafos nativos. Latzu usa Neo4j para:
1. El **esquema dinámico** de entidades (EntityType, EntityInstance)
2. Los **nodos de conocimiento** extraídos por IA (KnowledgeNode)
3. Las **sesiones de chat** y su historial`,
      },
      {
        type: "quiz",
        question: "¿En qué tipo de consulta destaca una base de datos de grafos frente a una relacional?",
        options: [
          "Consultas simples sobre una sola tabla grande",
          "Consultas de agregación como SUM o COUNT",
          "Encontrar conexiones entre entidades a varios niveles de profundidad",
          "Almacenar grandes archivos binarios",
        ],
        correctIndex: 2,
        explanation:
          "Las bases de datos de grafos brillan en consultas de 'traversal': encontrar el camino entre dos nodos, recomendar amigos de amigos, o detectar comunidades. En SQL esto requiere múltiples JOINs que se vuelven lentos con profundidad.",
        points: 10,
      },
      {
        type: "content",
        markdown: `## Cypher: el lenguaje de consulta de Neo4j

Cypher es declarativo y visualmente intuitivo — las relaciones se escriben como flechas:

### Crear datos
\`\`\`cypher
// Crear nodos
CREATE (turing:Persona {nombre: "Alan Turing", nacimiento: 1912})
CREATE (ml:Concepto {nombre: "Machine Learning"})

// Crear relación
MATCH (p:Persona {nombre: "Alan Turing"}), (c:Concepto {nombre: "Machine Learning"})
CREATE (p)-[:PIONERO_DE]->(c)
\`\`\`

### Consultar
\`\`\`cypher
// ¿Quién es pionero de qué conceptos?
MATCH (p:Persona)-[:PIONERO_DE]->(c:Concepto)
RETURN p.nombre, c.nombre

// Encontrar todo lo relacionado con Turing a 2 saltos
MATCH (turing:Persona {nombre: "Alan Turing"})-[*1..2]-(relacionado)
RETURN relacionado
\`\`\`

## Grafos de Conocimiento en IA

Los grafos de conocimiento potencian la IA de varias formas:

| Aplicación | Cómo usa el grafo |
|-----------|-------------------|
| **RAG** | Recupera contexto estructurado para enriquecer respuestas de LLM |
| **Recomendación** | Navega relaciones para sugerir contenido relevante |
| **Búsqueda semántica** | Combina vectores con estructura de grafo |
| **Detección de fraude** | Encuentra patrones de conexión anómalos |

> **Latzu** usa exactamente este patrón: extrae KnowledgeNodes de textos con IA, los almacena en Neo4j con embeddings vectoriales, y los recupera mediante RAG para enriquecer las respuestas del chat.`,
      },
      {
        type: "exercise",
        prompt:
          "Modela en papel (o texto) un grafo de conocimiento para una biblioteca universitaria. Define: (1) al menos 4 tipos de nodos, (2) al menos 5 tipos de relaciones entre ellos, y (3) escribe en pseudocódigo Cypher una consulta para 'encontrar todos los libros sobre Machine Learning escritos por profesores de esta universidad'.",
        hints: [
          "Nodos posibles: Libro, Autor, Tema, Departamento, Estudiante, Curso…",
          "Relaciones posibles: ESCRITO_POR, PERTENECE_A, TRATA_SOBRE, PRESTADO_A, PARTE_DE…",
          "La consulta necesitará encadenar varios MATCH para conectar Libro → Tema y Autor → Departamento",
        ],
      },
      {
        type: "ai-interaction",
        context:
          "El estudiante está aprendiendo sobre grafos de conocimiento y Neo4j. Tiene acceso a la base de datos Neo4j de Latzu con nodos reales. Puede hacer preguntas técnicas sobre Cypher, modelado de datos o cómo Latzu usa Neo4j internamente.",
        suggestedQuestions: [
          "¿Cómo Latzu extrae entidades de un texto para crear nodos en Neo4j?",
          "¿Qué diferencia hay entre un vector embedding y un grafo de conocimiento?",
          "¿Puedo usar Cypher para consultar los datos que acabo de crear con el seed script?",
        ],
      },
      {
        type: "reflection",
        prompt:
          "Los grafos de conocimiento pueden representar redes de personas, sus relaciones y comportamientos. Reflexiona sobre las implicaciones éticas de construir este tipo de sistemas.",
        guidingQuestions: [
          "¿Qué diferencia hay entre un grafo de conocimiento académico y un grafo de vigilancia?",
          "¿Quién debería controlar los grafos de conocimiento que contienen datos personales?",
          "¿Cómo el diseño del modelo de datos (qué relaciones capturas) refleja sesgos e intenciones?",
        ],
      },
      {
        type: "quiz",
        question: "En Neo4j, ¿qué hace la siguiente consulta Cypher?\n`MATCH (a:Persona)-[:CONOCE*2..3]->(b:Persona) RETURN b.nombre`",
        options: [
          "Devuelve personas que se conocen directamente",
          "Devuelve personas conectadas a través de 2 o 3 intermediarios",
          "Crea relaciones entre personas",
          "Elimina personas que se conocen",
        ],
        correctIndex: 1,
        explanation:
          "`*2..3` significa 'entre 2 y 3 saltos'. La consulta navega la red de conocidos y devuelve personas que están a 2 o 3 grados de separación. Es como 'amigos de amigos de amigos' en una red social.",
        points: 15,
      },
    ],
  },

  // ── Lección 4: RAG — Retrieval-Augmented Generation ────────────────────────
  {
    id: "rag-sistemas",
    title: "RAG: Conectando IA con tu Conocimiento",
    description: "Descubre cómo Latzu usa RAG para que el chat responda con tus propios datos",
    estimatedMinutes: 20,
    difficulty: "intermediate",
    tags: ["RAG", "LLM", "Embeddings", "Búsqueda Semántica"],
    concepts: ["rag", "vector-search", "llm-grounding"],
    prerequisites: ["intro-ai", "knowledge-graphs"],
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [
      {
        type: "content",
        markdown: `# RAG: Retrieval-Augmented Generation

## El problema de los LLMs "sin memoria"

Los modelos de lenguaje grandes (LLMs) como Gemini o GPT tienen dos limitaciones clave:
1. **Conocimiento estático**: saben lo que había en internet hasta su fecha de entrenamiento
2. **Sin acceso a tu información privada**: no saben nada de tus documentos, notas o empresa

RAG resuelve ambos problemas.

## ¿Qué es RAG?

**Retrieval-Augmented Generation** es una técnica que combina:

1. **Retrieval** (Recuperación): Busca información relevante en una base de conocimiento
2. **Augmented** (Aumentado): Añade esa información como contexto al prompt del LLM
3. **Generation** (Generación): El LLM genera una respuesta fundamentada en ese contexto

\`\`\`
Tu pregunta
    ↓
[Búsqueda semántica] ← Base de conocimiento (Neo4j + vectores)
    ↓
Contexto relevante
    ↓
[LLM] ← "Responde usando ESTE contexto: ..."
    ↓
Respuesta fundamentada
\`\`\``,
      },
      {
        type: "quiz",
        question: "¿Cuál es la principal ventaja de RAG frente a hacer fine-tuning de un LLM con tus datos?",
        options: [
          "RAG genera respuestas más largas",
          "RAG actualiza la base de conocimiento en tiempo real sin reentrenar el modelo",
          "RAG es más preciso en matemáticas",
          "RAG no necesita GPU",
        ],
        correctIndex: 1,
        explanation:
          "El fine-tuning 'hornea' el conocimiento en los pesos del modelo — costoso, lento y difícil de actualizar. RAG separa el conocimiento del modelo: puedes añadir o modificar documentos en la base de conocimiento y el LLM los usará inmediatamente en la siguiente consulta.",
        points: 10,
      },
      {
        type: "content",
        markdown: `## Cómo funciona la búsqueda semántica (el corazón de RAG)

La búsqueda tradicional busca palabras exactas. La búsqueda semántica busca **significado**.

### Embeddings: convertir texto en vectores

Un **embedding** es una representación numérica de un texto en un espacio de alta dimensión (típicamente 768 o 1536 dimensiones). Textos con significado similar quedan cerca en ese espacio.

\`\`\`
"perro" → [0.2, -0.5, 0.8, ..., 0.1]  (768 números)
"can"   → [0.21, -0.48, 0.79, ..., 0.09]  ← muy cercano al anterior
"mesa"  → [-0.7, 0.3, -0.1, ..., 0.6]   ← muy diferente
\`\`\`

### Cómo Latzu implementa RAG

1. **Ingestión** (Knowledge page):
   - El usuario pega un texto o URL de YouTube
   - Gemini extrae entidades y relaciones → nodos en Neo4j
   - Se generan embeddings con \`text-embedding-004\` para cada nodo

2. **Recuperación** (en cada mensaje de chat):
   - El mensaje del usuario se convierte en un embedding
   - Neo4j busca los nodos más similares (\`db.index.vector.queryNodes\`)
   - Se seleccionan los top-5 resultados con score ≥ 0.7

3. **Generación**:
   - Los nodos recuperados se incluyen en el prompt como contexto
   - Gemini genera una respuesta que cita y usa ese conocimiento

## ¿Por qué grafos + vectores?

La combinación es poderosa:
- **Vectores** capturan similitud semántica (¿qué texto es relevante?)
- **Grafos** capturan estructura y relaciones (¿cómo están conectados los conceptos?)`,
      },
      {
        type: "exercise",
        prompt:
          "Diseña el pipeline RAG para un asistente de soporte técnico de una empresa de software. Define: (1) qué documentos ingresarías en la base de conocimiento, (2) cómo manejarías documentos que se actualizan frecuentemente, (3) cómo evaluarías si las respuestas RAG son buenas, y (4) qué harías cuando el retrieval no encuentra nada relevante.",
        hints: [
          "Documentos posibles: manuales de usuario, tickets de soporte resueltos, changelogs, FAQs…",
          "Para documentos que cambian: versioning, timestamps, invalidación de embeddings antiguos…",
          "Métricas RAG: Faithfulness (¿la respuesta viene del contexto?), Relevance (¿el retrieval fue bueno?)",
          "Fallback: el LLM puede responder con conocimiento general + avisar que no encontró contexto específico",
        ],
      },
      {
        type: "ai-interaction",
        context:
          "El estudiante está aprendiendo sobre RAG y puede querer entender exactamente cómo Latzu lo implementa, o explorar casos de uso avanzados como RAG con grafos (GraphRAG).",
        suggestedQuestions: [
          "¿Puedes mostrarme cómo Latzu construye el prompt con el contexto RAG?",
          "¿Qué es GraphRAG y en qué mejora al RAG tradicional?",
          "¿Cómo sé si el chat está usando mi conocimiento o respondiendo 'de memoria'?",
        ],
      },
      {
        type: "reflection",
        prompt:
          "RAG permite a los LLMs acceder a documentos privados de empresas: manuales, contratos, datos de clientes. Reflexiona sobre los riesgos de seguridad y privacidad de este enfoque.",
        guidingQuestions: [
          "¿Qué documentos NO deberían nunca entrar en la base de conocimiento de un RAG corporativo?",
          "¿Cómo podrías 'contaminar' un sistema RAG con datos maliciosos? (prompt injection)",
          "¿Qué controles de acceso necesita un sistema RAG que maneja datos sensibles?",
        ],
      },
      {
        type: "quiz",
        question: "En el sistema RAG de Latzu, si escribes en el chat '¿Qué es el aprendizaje supervisado?' después de haber extraído texto sobre ML, ¿qué pasará?",
        options: [
          "El LLM responderá solo con su conocimiento de entrenamiento, ignorando Neo4j",
          "La pregunta se convierte en un embedding, se buscan nodos similares en Neo4j, y esos nodos se incluyen como contexto en el prompt a Gemini",
          "Se hará una búsqueda de palabras exactas en los textos ingestados",
          "El sistema buscará en internet en tiempo real",
        ],
        correctIndex: 1,
        explanation:
          "Exactamente cómo funciona Latzu: (1) embedding del mensaje, (2) búsqueda vectorial en Neo4j con `db.index.vector.queryNodes`, (3) los top nodos se pasan como contexto a Gemini con el prompt 'Responde usando este contexto: [nodos]'. Si no hay nada relevante, Gemini responde con conocimiento general.",
        points: 15,
      },
    ],
  },
];

export function useLessons(options: UseLessonsOptions = {}) {
  const { data: session } = useSession();
  const tenantId = useUserStore((state) => state.tenantId);

  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeTracker] = useState(() => new TimeTracker());

  // Fetch lesson
  useEffect(() => {
    if (options.lessonId) {
      fetchLesson(options.lessonId);
    }
  }, [options.lessonId]);

  const fetchLesson = async (lessonId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch from Entity API; fall back to mock catalog if backend is not running
      let foundLesson: InteractiveLesson | undefined;

      try {
        const { data } = await entityClient.query({
          query: GET_ENTITIES,
          variables: { entityType: "InteractiveLesson", limit: 50 },
          fetchPolicy: "network-only",
        });
        const item = (data?.entities?.items ?? []).find(
          (i: { properties: Record<string, unknown> }) =>
            i.properties?.lessonId === lessonId
        );
        if (item) {
          const p = item.properties as InteractiveLesson & { lessonId: string };
          foundLesson = {
            ...p,
            id: p.lessonId,
            blocks: (p.blocks ?? []) as LessonBlock[],
            createdAt: new Date(item.createdAt ?? Date.now()),
            updatedAt: new Date(item.updatedAt ?? Date.now()),
          };
        }
      } catch {
        // Backend unreachable — fall through to mock
      }

      if (!foundLesson) {
        foundLesson = mockLessons.find((l) => l.id === lessonId);
      }

      if (!foundLesson) {
        throw new Error("Lección no encontrada");
      }

      setLesson(foundLesson);

      // Initialize progress
      setProgress({
        lessonId,
        userId: session?.user?.id || "anonymous",
        currentBlockIndex: 0,
        completedBlocks: [],
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        score: 0,
        timeSpent: 0,
        quizScores: {},
        exerciseSubmissions: {},
        reflections: {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading lesson");
    } finally {
      setIsLoading(false);
    }
  };

  const goToBlock = useCallback(
    (index: number) => {
      if (!lesson) return;
      if (index < 0 || index >= lesson.blocks.length) return;

      // Track time on previous block
      const timeSpent = timeTracker.getElapsedSeconds();
      if (lesson.blocks[currentBlockIndex]) {
        trackLessonProgress(
          lesson.id,
          currentBlockIndex,
          lesson.blocks[currentBlockIndex].type,
          "completed",
          timeSpent,
          { tenantId, userId: session?.user?.id }
        );
      }

      // Reset timer for new block
      timeTracker.reset();
      setCurrentBlockIndex(index);

      // Track start of new block
      trackLessonProgress(
        lesson.id,
        index,
        lesson.blocks[index].type,
        "started",
        0,
        { tenantId, userId: session?.user?.id }
      );
    },
    [lesson, currentBlockIndex, timeTracker, tenantId, session]
  );

  const nextBlock = useCallback(() => {
    if (!lesson) return;
    if (currentBlockIndex < lesson.blocks.length - 1) {
      goToBlock(currentBlockIndex + 1);
    }
  }, [lesson, currentBlockIndex, goToBlock]);

  const previousBlock = useCallback(() => {
    if (currentBlockIndex > 0) {
      goToBlock(currentBlockIndex - 1);
    }
  }, [currentBlockIndex, goToBlock]);

  const completeBlock = useCallback(
    (blockIndex: number, data?: { score?: number; submission?: string }) => {
      setProgress((prev) => {
        if (!prev) return prev;

        const newProgress = { ...prev };
        if (!newProgress.completedBlocks.includes(blockIndex)) {
          newProgress.completedBlocks.push(blockIndex);
        }

        if (data?.score !== undefined) {
          newProgress.quizScores[blockIndex] = data.score;
          newProgress.score += data.score;
        }

        if (data?.submission) {
          newProgress.exerciseSubmissions[blockIndex] = data.submission;
        }

        newProgress.lastAccessedAt = new Date();
        newProgress.timeSpent += timeTracker.getElapsedSeconds();

        return newProgress;
      });
    },
    [timeTracker]
  );

  const submitQuizAnswer = useCallback(
    (blockIndex: number, selectedIndex: number): boolean => {
      if (!lesson) return false;

      const block = lesson.blocks[blockIndex];
      if (block.type !== "quiz") return false;

      const isCorrect = selectedIndex === block.correctIndex;
      const score = isCorrect ? (block.points || 10) : 0;

      completeBlock(blockIndex, { score });

      trackLessonProgress(
        lesson.id,
        blockIndex,
        "quiz",
        "completed",
        timeTracker.getElapsedSeconds(),
        {
          tenantId,
          userId: session?.user?.id,
          score,
        }
      );

      return isCorrect;
    },
    [lesson, completeBlock, timeTracker, tenantId, session]
  );

  const submitExercise = useCallback(
    (blockIndex: number, submission: string) => {
      if (!lesson) return;

      completeBlock(blockIndex, { submission });

      trackLessonProgress(
        lesson.id,
        blockIndex,
        "exercise",
        "completed",
        timeTracker.getElapsedSeconds(),
        { tenantId, userId: session?.user?.id }
      );
    },
    [lesson, completeBlock, timeTracker, tenantId, session]
  );

  const submitReflection = useCallback(
    (blockIndex: number, reflection: string) => {
      setProgress((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reflections: { ...prev.reflections, [blockIndex]: reflection },
        };
      });

      if (lesson) {
        trackLessonProgress(
          lesson.id,
          blockIndex,
          "reflection",
          "completed",
          timeTracker.getElapsedSeconds(),
          { tenantId, userId: session?.user?.id }
        );
      }
    },
    [lesson, timeTracker, tenantId, session]
  );

  const isBlockCompleted = useCallback(
    (blockIndex: number): boolean => {
      return progress?.completedBlocks.includes(blockIndex) ?? false;
    },
    [progress]
  );

  const getProgressPercentage = useCallback((): number => {
    if (!lesson || !progress) return 0;
    return Math.round(
      (progress.completedBlocks.length / lesson.blocks.length) * 100
    );
  }, [lesson, progress]);

  const isLessonComplete = useCallback((): boolean => {
    if (!lesson || !progress) return false;
    return progress.completedBlocks.length >= lesson.blocks.length;
  }, [lesson, progress]);

  return {
    // State
    lesson,
    progress,
    currentBlockIndex,
    currentBlock: lesson?.blocks[currentBlockIndex] ?? null,
    isLoading,
    error,

    // Navigation
    goToBlock,
    nextBlock,
    previousBlock,

    // Actions
    completeBlock,
    submitQuizAnswer,
    submitExercise,
    submitReflection,

    // Helpers
    isBlockCompleted,
    getProgressPercentage,
    isLessonComplete,
    totalBlocks: lesson?.blocks.length ?? 0,
  };
}

const mockPaths: LearningPath[] = [
  {
    id: "ai-fundamentals",
    title: "Fundamentos de IA y Machine Learning",
    description: "De cero a entender cómo las máquinas aprenden. Sin código, con ejemplos reales.",
    lessons: ["intro-ai", "ml-basics"],
    estimatedHours: 1,
    difficulty: "beginner",
    tags: ["IA", "Machine Learning", "Fundamentos"],
    outcomes: [
      "Entender qué es la IA y sus tipos",
      "Conocer el ciclo completo de un proyecto de ML",
      "Saber elegir el algoritmo adecuado para cada problema",
    ],
  },
  {
    id: "ai-knowledge-systems",
    title: "IA con Grafos y RAG",
    description: "Cómo Latzu conecta tu conocimiento con la IA usando Neo4j y Retrieval-Augmented Generation.",
    lessons: ["knowledge-graphs", "rag-sistemas"],
    estimatedHours: 1,
    difficulty: "intermediate",
    tags: ["Knowledge Graph", "RAG", "Neo4j", "LLM"],
    outcomes: [
      "Modelar datos como grafos en Neo4j",
      "Entender cómo funciona la búsqueda semántica con embeddings",
      "Construir un sistema RAG que responde con tu propio conocimiento",
    ],
  },
];

// Hook to fetch learning paths from Entity API (falls back to mock if backend unreachable)
export function useLearningPaths() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPaths = async () => {
      setIsLoading(true);
      try {
        const { data } = await entityClient.query({
          query: GET_ENTITIES,
          variables: { entityType: "LearningPath", limit: 50 },
          fetchPolicy: "network-only",
        });
        const items = data?.entities?.items ?? [];
        if (items.length > 0) {
          const fetched: LearningPath[] = items.map(
            (item: { id: string; properties: Record<string, unknown> }) => ({
              ...((item.properties as unknown) as LearningPath),
              id: (item.properties.pathId as string) ?? item.id,
            })
          );
          setPaths(fetched);
          return;
        }
      } catch {
        // Backend unreachable — fall through to mock
      }
      setPaths(mockPaths);
    };

    fetchPaths().finally(() => setIsLoading(false));
  }, []);

  return { paths, isLoading };
}

// Hook to fetch the full lesson catalog for the /learn page
export function useLessonCatalog() {
  const [lessons, setLessons] = useState<InteractiveLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data } = await entityClient.query({
          query: GET_ENTITIES,
          variables: { entityType: "InteractiveLesson", limit: 50 },
          fetchPolicy: "network-only",
        });
        const items = data?.entities?.items ?? [];
        if (items.length > 0) {
          const fetched: InteractiveLesson[] = items.map(
            (item: { id: string; createdAt?: string; updatedAt?: string; properties: Record<string, unknown> }) => {
              const p = (item.properties as unknown) as InteractiveLesson & { lessonId: string };
              return {
                ...p,
                id: p.lessonId ?? item.id,
                blocks: (p.blocks ?? []) as LessonBlock[],
                createdAt: new Date(item.createdAt ?? Date.now()),
                updatedAt: new Date(item.updatedAt ?? Date.now()),
              };
            }
          );
          setLessons(fetched);
          return;
        }
      } catch {
        // Backend unreachable — fall through to mock
      }
      setLessons(mockLessons);
    };

    fetchLessons().finally(() => setIsLoading(false));
  }, []);

  return { lessons, isLoading };
}



