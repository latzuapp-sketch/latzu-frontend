"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  en: {
    loading: "Loading...",

    nav: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      login: "Log in",
      tryFree: "Join waitlist",
    },

    hero: {
      badge: "Beyond AI chat — a system that truly knows you",
      headline1: "The intelligence that",
      headline2: "never starts from zero",
      subtitle:
        "Every session builds on the last. Your goals, your knowledge, your learning gaps — all remembered, connected, and working for you. Not just answering your questions.",
      ctaPrimary: "Join the waitlist",
      ctaSecondary: "How it works",
      socialProof: "Free early access · No credit card required",
      onlineStatus: "Online",
      chatMessage1:
        "Hi! I remember you're preparing your Networking exam on Friday. I recommend reviewing OSPF and BGP today — those are the topics you've struggled with the most.",
      chatUserMessage: "Perfect, explain OSPF from scratch but quickly",
      chatMessage2: "OSPF (Open Shortest Path First) is a link-state routing protocol...",
      floatingMemory: "Memory activated",
      floatingStreak: "12-day streak 🔥",
      floatingConcepts: "47 concepts mastered",
    },

    stats: [
      { value: "10x", label: "Faster learning" },
      { value: "24/7", label: "Tutor available" },
      { value: "∞", label: "Organized knowledge" },
      { value: "100%", label: "Personalized for you" },
    ],

    painSection: {
      badge: "The real problem",
      title: "Your current tools are smart. They just don't know you.",
      subtitle:
        "You use several powerful tools every day. But each one forgets you the moment you close it.",
      items: [
        {
          title: "AI that starts from zero",
          description:
            "Every new conversation begins with no memory of your goals, your progress, or what you learned last week. You explain yourself every time.",
        },
        {
          title: "Knowledge that never connects",
          description:
            "Notes in one place, bookmarks in another, ideas scattered everywhere. Your knowledge exists — but it doesn't think.",
        },
        {
          title: "Learning that doesn't compound",
          description:
            "You study hard, feel productive, and three weeks later it's gone. Nothing is reviewing what matters, when it matters.",
        },
      ],
    },

    whySection: {
      badge: "The Latzu difference",
      title: "One system that remembers, connects, and grows with you",
      subtitle:
        "Latzu isn't one more tool. It's the layer that unifies your learning, your knowledge, and your goals — and actively works to grow them.",
      items: [
        {
          title: "Memory that persists",
          description:
            "Latzu knows your goals, your style, what you've mastered and where you struggle — across every session, forever.",
        },
        {
          title: "Knowledge that self-organizes",
          description:
            "An AI agent connects your notes, discovers patterns, and reorganizes your workspace — without you asking.",
        },
        {
          title: "Learning that compounds",
          description:
            "Spaced repetition and knowledge tracing ensure you retain what you learn. The system gets smarter about you over time.",
        },
        {
          title: "Goals that get tracked",
          description:
            "From study plans to life areas, Latzu maps your priorities and proactively signals what needs attention — before you fall behind.",
        },
      ],
    },

    agentSection: {
      badge: "The Organizer Agent",
      title: "The intelligence that works when you're not",
      subtitle:
        "Most tools wait for you to ask. Latzu's agent observes your patterns, connects ideas in the background, and proactively surfaces what matters.",
      points: [
        "Detects themes and patterns across your notes",
        "Proposes connections between ideas you haven't seen",
        "Reorganizes stale content automatically",
        "Maps your life areas: work, learning, projects, goals",
        "Sends focus signals at the right moment — not at random",
      ],
      insight:
        "The more you use Latzu, the better it understands you — and the less manual organization you need.",
      activityLog: [
        { action: "Connected", detail: "\"React Hooks\" → \"State Management\"", time: "2m ago" },
        { action: "Proposed", detail: "New workspace: \"Frontend Architecture\"", time: "15m ago" },
        { action: "Signal", detail: "Review \"OSPF\" — 7 days since last seen", time: "1h ago" },
        { action: "Archived", detail: "3 stale notes from 3 months ago", time: "3h ago" },
      ],
    },

    librarySection: {
      badge: "Book Library",
      title: "78 books. AI-enriched. Interactive.",
      subtitle:
        "Not just summaries you read and forget. Each book comes with chapters, key concepts, exercises, and auto-generated flashcards — and you can ask the AI about any part.",
      points: [
        "AI-enriched summaries per chapter",
        "Key concepts and actionable exercises",
        "Auto-generated flashcards for retention",
        "Chat with any book — ask questions, get examples",
        "Connect book insights to your personal knowledge graph",
      ],
    },

    featuresSection: {
      badge: "Features",
      title1: "Everything you need to",
      title2: "learn without limits",
      subtitle:
        "Latzu combines the best of modern AI with proven pedagogical principles to create a unique learning experience.",
      items: [
        {
          title: "Adaptive AI Tutor",
          description:
            "Your personal learning assistant that adapts its teaching style, remembers your context, and is available 24/7. Listen to any lesson with real-time voice narration powered by Gemini 2.5 Flash TTS.",
        },
        {
          title: "Knowledge Library",
          description:
            "Organize concepts, notes, and resources in an interconnected knowledge graph. Never lose an important idea.",
        },
        {
          title: "Smart Planning",
          description:
            "Create study plans and tasks with AI — or let the agent create them directly from the chat. Sync with Google Calendar and receive personalized reminders.",
        },
        {
          title: "Adaptive Learning Engine",
          description:
            "Powered by BKT (Bayesian Knowledge Tracing) and Ebbinghaus spaced repetition. Latzu tracks your knowledge score per concept and adjusts the learning path to maximize long-term retention.",
        },
        {
          title: "Learning Analytics",
          description:
            "Visualize your progress with detailed metrics: study streak, mastered concepts, knowledge score per topic, time invested, and more.",
        },
        {
          title: "Studio IA",
          description:
            "Generate flashcards, quizzes, and mind maps from your study materials in seconds. The AI agent also creates tasks and manages workflows directly from the chat.",
        },
      ],
    },

    howSection: {
      badge: "How it works",
      title1: "Up and running in",
      title2: "3 steps",
      steps: [
        {
          title: "Define your goals",
          description:
            "Tell Latzu what you want to learn, what industry you're in, and what your goals are. In minutes you'll have a personalized platform.",
        },
        {
          title: "Learn with AI",
          description:
            "Chat with your tutor, organize your knowledge, create study plans, and receive daily recommendations tailored to your profile.",
        },
        {
          title: "Grow faster",
          description:
            "Latzu tracks your progress, identifies gaps in your knowledge, and adjusts the learning path to maximize your growth.",
        },
      ],
    },

    pricingSection: {
      badge: "Pricing",
      title1: "Simple, transparent,",
      title2: "no surprises",
      subtitle: "Start for free and scale when you're ready. No contracts, no hidden fees.",
      educationalText: "Are you an educational institution?",
      educationalLink: "Contact us for special plans →",
      tiers: [
        {
          name: "Free",
          price: "$0",
          period: "/ 7-day trial",
          description: "Start without commitment. Try all main features.",
          cta: "Join the waitlist",
          features: [
            "AI Tutor with 50 messages/day",
            "Knowledge library (up to 30 nodes)",
            "Basic planning (3 active plans)",
            "Personalized daily readings",
            "Dashboard with basic metrics",
            "Email support",
          ],
        },
        {
          name: "Pro",
          badge: "Most popular",
          price: "$10",
          period: "/ month",
          description: "For students and professionals who want to learn faster.",
          cta: "Join the waitlist",
          featured: true,
          features: [
            "Everything in Free, no limits",
            "Unlimited messages with AI Tutor",
            "Unlimited knowledge library",
            "Unlimited study plans",
            "Advanced adaptive memory",
            "Google Calendar integration",
            "AI agent with tools",
            "Priority chat support",
          ],
        },
        {
          name: "Max",
          price: "$30",
          period: "/ month",
          description: "For teams and users who demand maximum AI power.",
          cta: "Join the waitlist",
          features: [
            "Everything in Pro",
            "Latest generation AI models",
            "Multi-workspace for teams",
            "Advanced learning analytics",
            "Knowledge export",
            "API access",
            "Early access to new features",
            "Dedicated 24/7 support",
          ],
        },
      ],
    },

    testimonialsSection: {
      badge: "What they say",
      title1: "Students already learning",
      title2: "differently",
      items: [
        {
          quote:
            "Latzu completely changed how I study. The tutor remembers exactly where I left off in the previous session and knows which topics are hardest for me.",
          name: "Camila R.",
          role: "Engineering Student · Universidad de los Andes",
        },
        {
          quote:
            "The knowledge library is incredible. I can connect concepts from different subjects and the tutor helps me see the big picture.",
          name: "Santiago M.",
          role: "Medical Student · Universidad Nacional",
        },
        {
          quote:
            "I went from studying 4 hours without retaining almost anything to 2 hours with real results. AI planning makes a giant difference.",
          name: "Valentina G.",
          role: "ICFES Preparation",
        },
      ],
    },

    faqSection: {
      badge: "FAQ",
      title: "Frequently asked questions",
      items: [
        {
          q: "How is Latzu different from general-purpose AI assistants?",
          a: "AI assistants are powerful but start from zero every session — they don't know your goals, your progress, or what you've already learned. Latzu builds a persistent model of you: your knowledge gaps, your learning style, your life areas. And unlike a chatbot, it acts proactively — organizing your workspace, suggesting reviews, tracking your plans — without waiting for you to ask.",
        },
        {
          q: "Do I need a credit card for the trial period?",
          a: "No. The 7-day Free plan doesn't require a credit card. Just create your account and start learning immediately.",
        },
        {
          q: "Can I cancel at any time?",
          a: "Yes, you can cancel your subscription whenever you want. No contracts, no commitments. Your access continues until the end of the billing period.",
        },
        {
          q: "How does Latzu learn about me?",
          a: "With every study session, every message, and every completed task, Latzu builds a unique learning profile for you. This memory model persists between sessions and continuously improves.",
        },
        {
          q: "Does it work for any subject or industry?",
          a: "Yes. Latzu is domain-agnostic. It works for university students, technology professionals, doctors, lawyers, entrepreneurs, and anyone who wants to learn more efficiently.",
        },
        {
          q: "Is my data safe?",
          a: "Your data is private and encrypted. We don't share your information with third parties. You can export or delete your data at any time.",
        },
        {
          q: "Is there a discount for students or universities?",
          a: "Yes. We offer special plans for educational institutions and student groups. Contact us at latzuapp@gmail.com.",
        },
      ],
    },

    finalCtaSection: {
      title1: "Stop starting over.",
      title2: "Build your mind.",
      subtitle:
        "Join the first learners who have an AI that truly knows them — one that remembers, organizes, and grows with them every day.",
      ctaPrimary: "Join the waitlist",
      ctaSecondary: "Log in",
      socialProof: "Free early access · No credit card required · HTTPS encrypted",
    },

    footerSection: {
      features: "Features",
      pricing: "Pricing",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      copyright: "© 2025 Latzu · Adaptive Intelligence for the Future",
    },

    login: {
      subtitle: "Adaptive Intelligence for You",
      cardTitle: "Welcome",
      cardDescription: "Log in to your account",
      emailRequiredError: "Email and password are required",
      credentialsError: "Incorrect email or password",
      genericError: "Error signing in",
      oauthSigninError: "Error signing in. Please try again.",
      defaultError: "An error occurred. Please try again.",
      tabEmail: "Email",
      tabGoogle: "Google",
      emailLabel: "Email",
      passwordLabel: "Password",
      signInButton: "Log in",
      noAccount: "Interested in early access?",
      registerLink: "Join the waitlist",
      continueWithGoogle: "Continue with Google",
      orDivider: "or",
      features: [
        { title: "Personalized AI", description: "Learns from you and adapts to your style" },
        { title: "Dynamic Content", description: "Lessons that evolve with you" },
        { title: "Real Progress", description: "Measurable results and continuous growth" },
      ],
    },

    register: {
      subtitle: "Create your Latzu account",
      cardTitle: "Create account",
      cardDescription: "Start your personalized study space in minutes",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      errorRequired: "Name, email and password are required",
      passwordTooShort: "Password must be at least 8 characters",
      genericError: "Could not create account. Please try again.",
      createButton: "Create account",
      alreadyHaveAccount: "Already have an account?",
      loginLink: "Log in",
    },

    sidebar: {
      nav: {
        home: "Home",
        study: "Study Zone",
        chat: "AI Tutor",
        library: "Library",
        plans: "Plans",
        notes: "Notes",
        planning: "Planning",
        workspace: "Workspace",
      },
      lightMode: "Light mode",
      darkMode: "Dark mode",
      settings: "Settings",
      logout: "Log out",
      exitGuest: "Exit trial",
    },

    langToggle: "ES",
  },

  es: {
    loading: "Cargando...",

    nav: {
      features: "Funciones",
      howItWorks: "Cómo funciona",
      pricing: "Precios",
      faq: "FAQ",
      login: "Iniciar sesión",
      tryFree: "Lista de espera",
    },

    hero: {
      badge: "Más allá del chat IA — un sistema que realmente te conoce",
      headline1: "La inteligencia que",
      headline2: "nunca empieza desde cero",
      subtitle:
        "Cada sesión construye sobre la anterior. Tus metas, tu conocimiento, tus brechas de aprendizaje — todo recordado, conectado y trabajando para ti. No solo respondiendo tus preguntas.",
      ctaPrimary: "Únete a la lista de espera",
      ctaSecondary: "Cómo funciona",
      socialProof: "Acceso anticipado gratuito · Sin tarjeta de crédito",
      onlineStatus: "En línea",
      chatMessage1:
        "Hola! Recuerdo que estás preparando tu examen de Redes el viernes. Te recomiendo repasar OSPF y BGP hoy — son los temas donde más te ha costado.",
      chatUserMessage: "Perfecto, explícame OSPF desde cero pero rápido",
      chatMessage2:
        "OSPF (Open Shortest Path First) es un protocolo de enrutamiento de estado de enlace...",
      floatingMemory: "Memoria activada",
      floatingStreak: "12 días de racha 🔥",
      floatingConcepts: "47 conceptos dominados",
    },

    stats: [
      { value: "10x", label: "Aprendizaje más rápido" },
      { value: "24/7", label: "Tutor disponible" },
      { value: "∞", label: "Conocimiento organizado" },
      { value: "100%", label: "Personalizado para ti" },
    ],

    painSection: {
      badge: "El problema real",
      title: "Tus herramientas actuales son inteligentes. Solo que no te conocen.",
      subtitle:
        "Usas varias herramientas poderosas cada día. Pero cada una te olvida en cuanto la cierras.",
      items: [
        {
          title: "IA que empieza desde cero",
          description:
            "Cada conversación nueva comienza sin memoria de tus metas, tu progreso ni lo que aprendiste la semana pasada. Te explicas cada vez.",
        },
        {
          title: "Conocimiento que nunca conecta",
          description:
            "Notas en un lugar, marcadores en otro, ideas dispersas en todas partes. Tu conocimiento existe — pero no piensa.",
        },
        {
          title: "Aprendizaje que no se acumula",
          description:
            "Estudias duro, te sientes productivo, y tres semanas después se fue. Nada repasa lo importante cuando importa.",
        },
      ],
    },

    whySection: {
      badge: "La diferencia Latzu",
      title: "Un sistema que recuerda, conecta y crece contigo",
      subtitle:
        "Latzu no es una herramienta más. Es la capa que unifica tu aprendizaje, tu conocimiento y tus metas — y trabaja activamente para hacerlos crecer.",
      items: [
        {
          title: "Memoria que persiste",
          description:
            "Latzu conoce tus metas, tu estilo, lo que has dominado y dónde te cuesta — a través de cada sesión, para siempre.",
        },
        {
          title: "Conocimiento que se autoorganiza",
          description:
            "Un agente IA conecta tus notas, descubre patrones y reorganiza tu workspace — sin que tengas que pedirlo.",
        },
        {
          title: "Aprendizaje que se acumula",
          description:
            "La repetición espaciada y el seguimiento de conocimiento aseguran que retengas lo que aprendes. El sistema se vuelve más inteligente sobre ti con el tiempo.",
        },
        {
          title: "Metas que se siguen",
          description:
            "Desde planes de estudio hasta áreas de vida, Latzu mapea tus prioridades y señala proactivamente qué necesita atención — antes de que te quedes atrás.",
        },
      ],
    },

    agentSection: {
      badge: "El Agente Organizador",
      title: "La inteligencia que trabaja cuando tú no",
      subtitle:
        "La mayoría de herramientas esperan que preguntes. El agente de Latzu observa tus patrones, conecta ideas en segundo plano y te muestra proactivamente lo que importa.",
      points: [
        "Detecta temas y patrones en tus notas",
        "Propone conexiones entre ideas que no habías visto",
        "Reorganiza contenido inactivo automáticamente",
        "Mapea tus áreas de vida: trabajo, aprendizaje, proyectos, metas",
        "Envía señales de foco en el momento adecuado — no al azar",
      ],
      insight:
        "Cuanto más usas Latzu, mejor te entiende — y menos organización manual necesitas.",
      activityLog: [
        { action: "Conectó", detail: "\"React Hooks\" → \"Gestión de Estado\"", time: "hace 2m" },
        { action: "Propuso", detail: "Nuevo workspace: \"Arquitectura Frontend\"", time: "hace 15m" },
        { action: "Señal", detail: "Repasa \"OSPF\" — 7 días sin verlo", time: "hace 1h" },
        { action: "Archivó", detail: "3 notas inactivas de hace 3 meses", time: "hace 3h" },
      ],
    },

    librarySection: {
      badge: "Biblioteca de Libros",
      title: "78 libros. Enriquecidos con IA. Interactivos.",
      subtitle:
        "No solo resúmenes que lees y olvidas. Cada libro trae capítulos, conceptos clave, ejercicios y flashcards autogeneradas — y puedes preguntarle a la IA sobre cualquier parte.",
      points: [
        "Resúmenes enriquecidos por IA por capítulo",
        "Conceptos clave y ejercicios accionables",
        "Flashcards autogeneradas para retención",
        "Chatea con cualquier libro — haz preguntas, obtén ejemplos",
        "Conecta los aprendizajes a tu grafo de conocimiento personal",
      ],
    },

    featuresSection: {
      badge: "Funciones",
      title1: "Todo lo que necesitas para",
      title2: "aprender sin límites",
      subtitle:
        "Latzu combina lo mejor de la IA moderna con principios pedagógicos probados para crear una experiencia de aprendizaje única.",
      items: [
        {
          title: "Tutor IA Adaptativo",
          description:
            "Tu asistente personal que adapta su estilo pedagógico, recuerda tu contexto y está disponible 24/7. Escucha cualquier lección con narración de voz en tiempo real impulsada por Gemini 2.5 Flash TTS.",
        },
        {
          title: "Biblioteca de Conocimiento",
          description:
            "Organiza conceptos, notas y recursos en un grafo de conocimiento interconectado. Nunca pierdas una idea importante.",
        },
        {
          title: "Planificación Inteligente",
          description:
            "Crea planes de estudio y tareas con IA — o deja que el agente las cree directamente desde el chat. Sincroniza con Google Calendar y recibe recordatorios personalizados.",
        },
        {
          title: "Motor de Aprendizaje Adaptativo",
          description:
            "Impulsado por BKT (Bayesian Knowledge Tracing) y repetición espaciada de Ebbinghaus. Latzu mide tu puntuación de conocimiento por concepto y ajusta el camino de aprendizaje para maximizar la retención a largo plazo.",
        },
        {
          title: "Analytics de Aprendizaje",
          description:
            "Visualiza tu progreso con métricas detalladas: racha de estudio, conceptos dominados, puntuación de conocimiento por tema, tiempo invertido y más.",
        },
        {
          title: "Studio IA",
          description:
            "Genera flashcards, quizzes y mapas mentales desde tus materiales de estudio en segundos. El agente IA también crea tareas y gestiona flujos de trabajo directamente desde el chat.",
        },
      ],
    },

    howSection: {
      badge: "Cómo funciona",
      title1: "En marcha en",
      title2: "3 pasos",
      steps: [
        {
          title: "Define tus objetivos",
          description:
            "Cuéntale a Latzu qué quieres aprender, en qué industria trabajas y cuáles son tus metas. En minutos tendrás una plataforma personalizada.",
        },
        {
          title: "Aprende con IA",
          description:
            "Chatea con tu tutor, organiza tu conocimiento, crea planes de estudio y recibe recomendaciones diarias adaptadas a tu perfil.",
        },
        {
          title: "Crece más rápido",
          description:
            "Latzu registra tu progreso, identifica brechas en tu conocimiento y ajusta el camino de aprendizaje para maximizar tu crecimiento.",
        },
      ],
    },

    pricingSection: {
      badge: "Precios",
      title1: "Simple, transparente,",
      title2: "sin sorpresas",
      subtitle: "Empieza gratis y escala cuando estés listo. Sin contratos, sin tarifas ocultas.",
      educationalText: "¿Eres una institución educativa?",
      educationalLink: "Contáctanos para planes especiales →",
      tiers: [
        {
          name: "Free",
          price: "$0",
          period: "/ 7 días de prueba",
          description: "Empieza sin compromiso. Prueba todas las funciones principales.",
          cta: "Únete a la lista de espera",
          features: [
            "Tutor IA con 50 mensajes/día",
            "Biblioteca de conocimiento (hasta 30 nodos)",
            "Planificación básica (3 planes activos)",
            "Lecturas diarias personalizadas",
            "Dashboard con métricas básicas",
            "Soporte por email",
          ],
        },
        {
          name: "Pro",
          badge: "Más popular",
          price: "$10",
          period: "/ mes",
          description: "Para estudiantes y profesionales que quieren aprender más rápido.",
          cta: "Únete a la lista de espera",
          featured: true,
          features: [
            "Todo lo de Free, sin límites",
            "Mensajes ilimitados con Tutor IA",
            "Biblioteca ilimitada de conocimiento",
            "Planes de estudio ilimitados",
            "Memoria adaptativa avanzada",
            "Integración con Google Calendar",
            "Agente IA con herramientas",
            "Soporte prioritario por chat",
          ],
        },
        {
          name: "Max",
          price: "$30",
          period: "/ mes",
          description: "Para equipos y usuarios que exigen la máxima potencia de IA.",
          cta: "Únete a la lista de espera",
          features: [
            "Todo lo de Pro",
            "Modelos IA de última generación",
            "Multi-workspace para equipos",
            "Analytics avanzados de aprendizaje",
            "Exportación de conocimiento",
            "API access",
            "Acceso anticipado a nuevas funciones",
            "Soporte dedicado 24/7",
          ],
        },
      ],
    },

    testimonialsSection: {
      badge: "Lo que dicen",
      title1: "Estudiantes que ya aprenden",
      title2: "diferente",
      items: [
        {
          quote:
            "Latzu cambió completamente cómo estudio. El tutor recuerda exactamente dónde me quedé la sesión anterior y sabe cuáles temas me cuestan más.",
          name: "Camila R.",
          role: "Estudiante de Ingeniería · Universidad de los Andes",
        },
        {
          quote:
            "La biblioteca de conocimiento es increíble. Puedo conectar conceptos de diferentes materias y el tutor me ayuda a ver el panorama completo.",
          name: "Santiago M.",
          role: "Estudiante de Medicina · Universidad Nacional",
        },
        {
          quote:
            "Pasé de estudiar 4 horas sin retener casi nada a 2 horas con resultados reales. La planificación con IA es una diferencia gigantesca.",
          name: "Valentina G.",
          role: "Preparación para ICFES",
        },
      ],
    },

    faqSection: {
      badge: "FAQ",
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Necesito tarjeta de crédito para el periodo de prueba?",
          a: "No. El plan Free de 7 días no requiere tarjeta de crédito. Solo crea tu cuenta y empieza a aprender de inmediato.",
        },
        {
          q: "¿Puedo cancelar en cualquier momento?",
          a: "Sí, puedes cancelar tu suscripción cuando quieras. Sin contratos, sin compromisos. Tu acceso continúa hasta el fin del periodo de facturación.",
        },
        {
          q: "¿Cómo aprende Latzu sobre mí?",
          a: "Con cada sesión de estudio, cada mensaje y cada tarea completada, Latzu construye un perfil de aprendizaje único para ti. Este modelo de memoria persiste entre sesiones y mejora continuamente.",
        },
        {
          q: "¿Funciona para cualquier materia o industria?",
          a: "Sí. Latzu es agnóstico al dominio de conocimiento. Funciona para estudiantes universitarios, profesionales de tecnología, médicos, abogados, emprendedores y cualquier persona que quiera aprender más eficientemente.",
        },
        {
          q: "¿Mis datos están seguros?",
          a: "Tus datos son privados y encriptados. No compartimos tu información con terceros. Puedes exportar o eliminar tus datos en cualquier momento.",
        },
        {
          q: "¿Hay descuento para estudiantes o universidades?",
          a: "Sí. Ofrecemos planes especiales para instituciones educativas y grupos de estudiantes. Contáctanos en latzuapp@gmail.com.",
        },
      ],
    },

    finalCtaSection: {
      title1: "Tu mejor versión",
      title2: "empieza hoy",
      subtitle:
        "Únete a la primera ola de estudiantes que aprenderán con inteligencia adaptativa. Obtén acceso anticipado antes de que abramos a todos.",
      ctaPrimary: "Únete a la lista de espera",
      ctaSecondary: "Iniciar sesión",
      socialProof: "Acceso anticipado gratuito · Sin tarjeta de crédito · HTTPS cifrado",
    },

    footerSection: {
      features: "Funciones",
      pricing: "Precios",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
      copyright: "© 2025 Latzu · Inteligencia Adaptativa para el Futuro",
    },

    login: {
      subtitle: "Inteligencia Adaptativa para Ti",
      cardTitle: "Bienvenido",
      cardDescription: "Inicia sesión en tu cuenta",
      emailRequiredError: "Email y contraseña son requeridos",
      credentialsError: "Email o contraseña incorrectos",
      genericError: "Error al iniciar sesión",
      oauthSigninError: "Error al iniciar sesión. Inténtalo de nuevo.",
      defaultError: "Ha ocurrido un error. Inténtalo de nuevo.",
      tabEmail: "Email",
      tabGoogle: "Google",
      emailLabel: "Email",
      passwordLabel: "Contraseña",
      signInButton: "Iniciar sesión",
      noAccount: "¿Te interesa el acceso anticipado?",
      registerLink: "Únete a la lista de espera",
      continueWithGoogle: "Continuar con Google",
      orDivider: "o",
      features: [
        { title: "IA Personalizada", description: "Aprende de ti y se adapta a tu estilo" },
        { title: "Contenido Dinámico", description: "Lecciones que evolucionan contigo" },
        { title: "Progreso Real", description: "Resultados medibles y crecimiento continuo" },
      ],
    },

    register: {
      subtitle: "Crea tu cuenta de Latzu",
      cardTitle: "Crear cuenta",
      cardDescription: "Empieza tu espacio de estudio personalizado en minutos",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Mínimo 8 caracteres",
      errorRequired: "Nombre, email y contraseña son requeridos",
      passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
      genericError: "No pudimos crear la cuenta. Inténtalo de nuevo.",
      createButton: "Crear cuenta",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      loginLink: "Inicia sesión",
    },

    sidebar: {
      nav: {
        home: "Inicio",
        study: "Zona de Estudio",
        chat: "Tutor IA",
        library: "Biblioteca",
        plans: "Planes",
        notes: "Notas",
        planning: "Planificación",
        workspace: "Workspace",
      },
      lightMode: "Modo claro",
      darkMode: "Modo oscuro",
      settings: "Configuración",
      logout: "Cerrar sesión",
      exitGuest: "Salir",
    },

    langToggle: "EN",
  },
} as const;

export type Translations = typeof translations.en;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("latzu-lang") as Lang | null;
    if (stored === "en" || stored === "es") {
      setLangState(stored);
    } else {
      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("es")) setLangState("es");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("latzu-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLanguage() {
  return useContext(LanguageContext);
}

// ─── Toggle button ────────────────────────────────────────────────────────────

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-border/60 hover:border-primary/60 hover:text-primary transition-colors text-muted-foreground ${className ?? ""}`}
      aria-label="Toggle language"
    >
      {t.langToggle}
    </button>
  );
}
