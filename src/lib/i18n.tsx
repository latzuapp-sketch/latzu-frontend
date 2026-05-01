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
      badge: "Adaptive Intelligence Platform",
      headline1: "Your second brain.",
      headline2: "Powered by AI.",
      subtitle:
        "A system that learns how you learn, connects what you know, and gets sharper every time you use it.",
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

    moduleStrip: [
      { label: "Notes & Knowledge" },
      { label: "Tasks & Projects" },
      { label: "Book Library" },
      { label: "Adaptive Learning" },
      { label: "AI Agent" },
    ],

    painSection: {
      badge: "The real problem",
      title: "5 tools. 5 tabs. No connection between them.",
      subtitle:
        "You already have everything you need — scattered across apps that don't talk to each other.",
      items: [
        {
          title: "Constant context switching",
          description:
            "Notes in one app, tasks in another, books somewhere else. You spend more time switching than actually doing.",
        },
        {
          title: "Knowledge trapped in silos",
          description:
            "Your notes don't know about your tasks. Your books don't connect to your study plans. Nothing sees the full picture.",
        },
        {
          title: "5 subscriptions, 0 integration",
          description:
            "You pay for multiple tools separately. None of them knows your goals, your progress, or what you learned last week.",
        },
      ],
    },

    replacesSection: {
      badge: "One platform",
      title: "Every module makes the next one smarter",
      subtitle:
        "Notes feed your knowledge graph. Your graph improves your study plans. Your plans inform your tasks. Everything compounds — nothing is siloed.",
      items: [
        { label: "Notes & workspace", sublabel: "Knowledge management" },
        { label: "Tasks & projects", sublabel: "Planning & execution" },
        { label: "Book summaries", sublabel: "Curated library of 78 books" },
        { label: "Adaptive learning", sublabel: "Personalized study paths" },
        { label: "AI on your knowledge", sublabel: "Agent that connects everything" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "The compound flywheel",
      title: "The intelligence that compounds",
      subtitle:
        "Each session makes Latzu smarter about you. Not just stored data — a living model of how you think, learn, and work.",
      items: [
        {
          title: "You chat → it learns your style",
          description:
            "Your AI tutor adapts to your pace, your gaps, and your preferred way of understanding. Every conversation makes it more accurate.",
        },
        {
          title: "You save a note → the graph connects it",
          description:
            "Every idea you capture gets linked to what you already know. Concepts from different areas start talking to each other.",
        },
        {
          title: "You complete a task → the plan adapts",
          description:
            "Outcomes feed back into your study plan in real time. Behind schedule? It adjusts. Ahead? It accelerates. Never static.",
        },
        {
          title: "The agent sees all → acts for you",
          description:
            "One agent with a full view of your knowledge, tasks, and goals. It connects ideas you missed, surfaces what's urgent, and organizes what's stale.",
        },
      ],
    },

    agentSection: {
      badge: "The Organizer Agent",
      title: "The agent that works while you work",
      subtitle:
        "Most tools are reactive — they wait for you to ask. Latzu's agent is proactive — it watches, connects, and acts on your behalf.",
      points: [
        "Detects patterns across your notes, tasks, and books",
        "Proposes connections between ideas you didn't see",
        "Reorganizes stale content before it becomes noise",
        "Maps your life areas: work, learning, projects, goals",
        "Sends focus signals at the right moment — not at random",
      ],
      insight:
        "After a few weeks, Latzu knows you better than any app ever has. And it keeps getting better.",
      activityLog: [
        { action: "Connected", detail: "\"React Hooks\" → \"State Management\"", time: "2m ago" },
        { action: "Proposed", detail: "New workspace: \"Frontend Architecture\"", time: "15m ago" },
        { action: "Signal", detail: "Review \"OSPF\" — 7 days since last seen", time: "1h ago" },
        { action: "Archived", detail: "3 stale notes from 3 months ago", time: "3h ago" },
      ],
    },

    integrationsSection: {
      badge: "Proactive Integrations",
      title: "Latzu lives where you already work.",
      subtitle:
        "Connect your tools once. The agent reads your calendar, drives, and chats — then proactively organizes and reminds you, without you having to ask.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Morning briefings & reminders" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Reads your schedule, blocks focus time" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexes your docs into the knowledge graph" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Extract concepts from any video" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Clip any page or document" },
      ],
      moreLabel: "+ more coming",
      chat: {
        agentName: "Latzu",
        time: "7:58 AM",
        messages: [
          { from: "agent", text: "Good morning! You have an exam on Thursday. Based on your weak spots, I prepared a 20-min review on React Hooks. Want to start now?" },
          { from: "user", text: "Yes, send it!" },
          { from: "agent", text: "Done. I also found 2 chapters from \"The Pragmatic Programmer\" that connect directly to what you're studying. Added to your queue." },
        ],
      },
    },

    librarySection: {
      badge: "Book Library",
      title: "78 books. Not to read. To integrate.",
      subtitle:
        "Every book connects to your knowledge graph. Chat with it, pull flashcards from it, or let the agent recommend a chapter based on what you're learning this week.",
      points: [
        "AI-enriched chapters, concepts, and exercises",
        "Auto-generated flashcards — integrated into your decks",
        "Chat directly with any book",
        "Agent links book insights to your existing knowledge",
        "Curated for students, professionals, and founders",
      ],
    },

    featuresSection: {
      badge: "What's inside",
      title1: "Every tool you need.",
      title2: "All working together.",
      subtitle:
        "Not features bolted together — modules built from the ground up to share intelligence and compound over time.",
      items: [
        {
          title: "Adaptive AI Tutor",
          description:
            "Remembers every conversation, knows your weak spots, and adapts its teaching in real time. Explains concepts in multiple ways until you truly understand. Voice narration included.",
        },
        {
          title: "Knowledge Graph",
          description:
            "Capture notes, PDFs, YouTube videos, and web pages. Latzu extracts key concepts and builds a graph of connections — including ones you didn't know existed.",
        },
        {
          title: "Smart Planning",
          description:
            "Create plans and tasks from chat — or let the agent build them based on your knowledge gaps. Your schedule adapts as you progress, never static.",
        },
        {
          title: "Adaptive Learning Engine",
          description:
            "SM-2 spaced repetition + Bayesian Knowledge Tracing. Measures your real knowledge per concept and prioritizes exactly what needs reinforcement — not what feels easy.",
        },
        {
          title: "Learning Analytics",
          description:
            "Know exactly where you stand: study streak, mastered concepts, weak topics, time invested. Clear data on your actual progress, not just activity.",
        },
        {
          title: "AI Studio",
          description:
            "Generate flashcards, quizzes, summaries, and mind maps from any source in seconds. The agent manages your workflows and creates tasks directly from chat.",
        },
      ],
    },

    howSection: {
      badge: "How it works",
      title1: "Built for you in",
      title2: "minutes",
      steps: [
        {
          title: "Tell it who you are",
          description:
            "Set your goals, your field, your current level. Latzu builds a personalized system from day one — not a generic template you have to configure.",
        },
        {
          title: "Use it like any app",
          description:
            "Chat, take notes, read books, manage tasks. Every action feeds the system. Every session makes it smarter about you.",
        },
        {
          title: "Watch it compound",
          description:
            "After a few weeks, Latzu knows you better than any app ever has. Your second brain, growing with you — every day.",
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
      title1: "Start building",
      title2: "your second brain.",
      subtitle:
        "Join the first users building an AI that truly knows them. The earlier you start, the smarter it gets.",
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
      badge: "Plataforma de Inteligencia Adaptativa",
      headline1: "Tu segunda mente.",
      headline2: "Potenciada por IA.",
      subtitle:
        "Un sistema que aprende cómo aprendes, conecta lo que sabes y mejora cada vez que lo usas.",
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

    moduleStrip: [
      { label: "Notas y Conocimiento" },
      { label: "Tareas y Proyectos" },
      { label: "Biblioteca de Libros" },
      { label: "Aprendizaje Adaptativo" },
      { label: "Agente IA" },
    ],

    painSection: {
      badge: "El problema real",
      title: "5 herramientas. 5 pestañas. Sin conexión entre ellas.",
      subtitle:
        "Ya tienes todo lo que necesitas — disperso en apps que no se hablan entre sí.",
      items: [
        {
          title: "Cambio de contexto constante",
          description:
            "Notas en una app, tareas en otra, libros en otra más. Gastas más tiempo cambiando de herramienta que haciendo el trabajo.",
        },
        {
          title: "Conocimiento atrapado en silos",
          description:
            "Tus notas no saben de tus tareas. Tus libros no conectan con tus planes de estudio. Ninguna herramienta ve el cuadro completo.",
        },
        {
          title: "5 suscripciones, 0 integración",
          description:
            "Pagas por varias herramientas por separado. Ninguna conoce tus metas, tu progreso ni lo que aprendiste la semana pasada.",
        },
      ],
    },

    replacesSection: {
      badge: "Una sola plataforma",
      title: "Cada módulo hace al siguiente más inteligente",
      subtitle:
        "Las notas alimentan tu grafo de conocimiento. El grafo mejora tus planes. Los planes informan tus tareas. Todo se acumula — nada queda en silos.",
      items: [
        { label: "Notas y workspace", sublabel: "Gestión de conocimiento" },
        { label: "Tareas y proyectos", sublabel: "Planificación y ejecución" },
        { label: "Resúmenes de libros", sublabel: "Biblioteca curada de 78 libros" },
        { label: "Aprendizaje adaptativo", sublabel: "Rutas de estudio personalizadas" },
        { label: "IA sobre tu conocimiento", sublabel: "Agente que conecta todo" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "El volante compuesto",
      title: "La inteligencia que se acumula",
      subtitle:
        "Cada sesión hace a Latzu más inteligente sobre ti. No solo datos guardados — un modelo vivo de cómo piensas, aprendes y trabajas.",
      items: [
        {
          title: "Chateas → aprende tu estilo",
          description:
            "Tu tutor IA se adapta a tu ritmo, tus brechas y tu forma de entender. Cada conversación lo hace más preciso sobre ti.",
        },
        {
          title: "Guardas una nota → el grafo la conecta",
          description:
            "Cada idea que capturas se vincula con lo que ya sabes. Conceptos de distintas áreas empiezan a hablarse entre sí.",
        },
        {
          title: "Completas una tarea → el plan se ajusta",
          description:
            "Los resultados alimentan tu plan en tiempo real. ¿Atrasado? Se ajusta. ¿Adelantado? Acelera. Nunca estático.",
        },
        {
          title: "El agente ve todo → actúa por ti",
          description:
            "Un agente con visión completa de tu conocimiento, tus tareas y tus metas. Conecta ideas que perdiste, muestra lo urgente y organiza lo que se acumula.",
        },
      ],
    },

    agentSection: {
      badge: "El Agente Organizador",
      title: "El agente que trabaja mientras tú trabajas",
      subtitle:
        "La mayoría de herramientas son reactivas — esperan que preguntes. El agente de Latzu es proactivo — observa, conecta y actúa en tu nombre.",
      points: [
        "Detecta patrones en tus notas, tareas y libros",
        "Propone conexiones entre ideas que no habías visto",
        "Reorganiza contenido inactivo antes de que se vuelva ruido",
        "Mapea tus áreas de vida: trabajo, aprendizaje, proyectos, metas",
        "Envía señales de foco en el momento adecuado — no al azar",
      ],
      insight:
        "Después de unas semanas, Latzu te conoce mejor que cualquier app. Y sigue mejorando.",
      activityLog: [
        { action: "Conectó", detail: "\"React Hooks\" → \"Gestión de Estado\"", time: "hace 2m" },
        { action: "Propuso", detail: "Nuevo workspace: \"Arquitectura Frontend\"", time: "hace 15m" },
        { action: "Señal", detail: "Repasa \"OSPF\" — 7 días sin verlo", time: "hace 1h" },
        { action: "Archivó", detail: "3 notas inactivas de hace 3 meses", time: "hace 3h" },
      ],
    },

    integrationsSection: {
      badge: "Integraciones Proactivas",
      title: "Latzu vive donde ya trabajas.",
      subtitle:
        "Conecta tus herramientas una sola vez. El agente lee tu calendario, drives y chats — y te organiza y recuerda proactivamente, sin que tengas que pedírselo.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Resúmenes matutinos y recordatorios" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Lee tu agenda y bloquea tiempo de enfoque" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexa tus documentos al grafo de conocimiento" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Extrae conceptos de cualquier video" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Recorta cualquier página o documento" },
      ],
      moreLabel: "+ más próximamente",
      chat: {
        agentName: "Latzu",
        time: "7:58 AM",
        messages: [
          { from: "agent", text: "¡Buenos días! Tienes un examen el jueves. Según tus puntos débiles, preparé un repaso de 20 min sobre React Hooks. ¿Empezamos?" },
          { from: "user", text: "¡Sí, mándalo!" },
          { from: "agent", text: "Listo. También encontré 2 capítulos de \"El Programador Pragmático\" que conectan directo con lo que estudias. Los agregué a tu cola." },
        ],
      },
    },

    librarySection: {
      badge: "Biblioteca de Libros",
      title: "78 libros. No para leer. Para integrar.",
      subtitle:
        "Cada libro se conecta a tu grafo de conocimiento. Chatea con él, extrae flashcards, o deja que el agente recomiende un capítulo según lo que estás aprendiendo esta semana.",
      points: [
        "Capítulos, conceptos y ejercicios enriquecidos con IA",
        "Flashcards autogeneradas — integradas a tus mazos",
        "Chatea directamente con cualquier libro",
        "El agente vincula los aprendizajes a tu conocimiento existente",
        "Curada para estudiantes, profesionales y emprendedores",
      ],
    },

    featuresSection: {
      badge: "Qué incluye",
      title1: "Cada herramienta que necesitas.",
      title2: "Todas trabajando juntas.",
      subtitle:
        "No funciones ensambladas — módulos construidos desde cero para compartir inteligencia y acumularse con el tiempo.",
      items: [
        {
          title: "Tutor IA Adaptativo",
          description:
            "Recuerda cada conversación, conoce tus puntos débiles y adapta su enseñanza en tiempo real. Explica conceptos de múltiples formas hasta que los entiendas. Narración de voz incluida.",
        },
        {
          title: "Grafo de Conocimiento",
          description:
            "Captura notas, PDFs, videos de YouTube y páginas web. Latzu extrae los conceptos clave y construye un grafo de conexiones — incluyendo las que no sabías que existían.",
        },
        {
          title: "Planificación Inteligente",
          description:
            "Crea planes y tareas desde el chat — o deja que el agente los construya según tus brechas de conocimiento. Tu agenda se adapta a medida que avanzas, nunca estática.",
        },
        {
          title: "Motor de Aprendizaje Adaptativo",
          description:
            "Repetición espaciada SM-2 + Bayesian Knowledge Tracing. Mide tu conocimiento real por concepto y prioriza exactamente lo que necesita refuerzo — no lo que se siente fácil.",
        },
        {
          title: "Analytics de Aprendizaje",
          description:
            "Sabe exactamente dónde estás: racha de estudio, conceptos dominados, temas débiles, tiempo invertido. Datos claros de tu progreso real, no solo actividad.",
        },
        {
          title: "Studio IA",
          description:
            "Genera flashcards, quizzes, resúmenes y mapas mentales desde cualquier fuente en segundos. El agente gestiona tus flujos de trabajo y crea tareas directamente desde el chat.",
        },
      ],
    },

    howSection: {
      badge: "Cómo funciona",
      title1: "Listo para ti en",
      title2: "minutos",
      steps: [
        {
          title: "Cuéntale quién eres",
          description:
            "Define tus metas, tu área y tu nivel actual. Latzu construye tu sistema personalizado desde el primer día — no una plantilla genérica que tienes que configurar.",
        },
        {
          title: "Úsalo como cualquier app",
          description:
            "Chatea, toma notas, lee libros, gestiona tareas. Cada acción alimenta el sistema. Cada sesión lo hace más inteligente sobre ti.",
        },
        {
          title: "Observa cómo se acumula",
          description:
            "Después de unas semanas, Latzu te conoce mejor que cualquier app. Tu segunda mente, creciendo contigo — cada día.",
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
          q: "¿En qué se diferencia Latzu de los asistentes IA de propósito general?",
          a: "Los asistentes de IA son poderosos pero empiezan desde cero cada sesión — no conocen tus metas, tu progreso ni lo que ya aprendiste. Latzu construye un modelo persistente de ti: tus brechas de conocimiento, tu estilo de aprendizaje, tus áreas de vida. Y a diferencia de un chatbot, actúa proactivamente — organizando tu workspace, sugiriendo repasos y haciendo seguimiento de tus planes — sin esperar a que preguntes.",
        },
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
      title1: "Empieza a construir",
      title2: "tu segunda mente.",
      subtitle:
        "Únete a los primeros usuarios construyendo una IA que realmente los conoce. Cuanto antes empieces, más inteligente se vuelve.",
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
