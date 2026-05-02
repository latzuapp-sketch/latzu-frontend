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
      tryFree: "Start free",
    },

    hero: {
      badge: "Adaptive learning + execution system",
      headline1: "Learn what matters.",
      headline2: "Execute what you decided.",
      subtitle:
        "An agent that adapts to how you learn, plans with you, reminds you on WhatsApp at the right moment, and turns everything you've ever read into a knowledge that grows. Your personal operating system for what you want to become.",
      ctaPrimary: "Start free",
      ctaSecondary: "See how it works",
      socialProof: "Free early access · No credit card required",
      onlineStatus: "Online",
      chatMessage1:
        "I read the 14 things you dropped this week. They cluster around three goals you've been chasing — want me to walk you through what connects them?",
      chatUserMessage: "Yes — and remind me where I left off",
      chatMessage2:
        "You'd been comparing two approaches in your notes from Tuesday. The PDF you saved on Thursday answers exactly that. Here's the thread...",
      floatingMemory: "Encyclopedia growing",
      floatingStreak: "342 ideas connected",
      floatingConcepts: "47 questions answered from your own knowledge",
    },

    stats: [
      { value: "10x", label: "Faster learning" },
      { value: "24/7", label: "Tutor available" },
      { value: "∞", label: "Organized knowledge" },
      { value: "100%", label: "Personalized for you" },
    ],

    moduleStrip: [
      { label: "Adaptive study plans" },
      { label: "Auto-scheduled blocks" },
      { label: "WhatsApp + email reminders" },
      { label: "Personal knowledge that grows" },
      { label: "An agent that acts for you" },
    ],

    painSection: {
      badge: "The idea",
      title: "Knowing isn't enough. Latzu closes the loop.",
      subtitle:
        "Most apps help you store, plan, OR study. The hard part is the loop: learn what matters, decide what to do, execute on time, adapt as you go. Latzu runs that loop with you — every day.",
      items: [
        {
          title: "Learns the way you learn",
          description:
            "Adaptive study plans, spaced repetition, content generated for your level — the system measures what you actually understand, not what feels familiar.",
        },
        {
          title: "Executes what you decided",
          description:
            "An agent that schedules your study blocks, sends WhatsApp reminders at the right moment, moves tasks when you fall behind, and tracks your real progress.",
        },
        {
          title: "Builds the knowledge you compound",
          description:
            "Every note, book, conversation and outcome feeds a personal graph that gets smarter every week — the foundation your future decisions stand on.",
        },
      ],
    },

    replacesSection: {
      badge: "One operating system",
      title: "Stop running 5 apps to live one life",
      subtitle:
        "Notes app + planner + study app + reminders + calendar + AI chat — all chasing different goals. Latzu replaces them with one adaptive layer that knows you across everything.",
      items: [
        { label: "Adaptive learning", sublabel: "SRS + plans that adjust to your real progress" },
        { label: "Smart planning", sublabel: "An agent that schedules and reprioritizes for you" },
        { label: "Personal knowledge", sublabel: "Notes, books, links growing into a graph" },
        { label: "Goal tracking", sublabel: "Vague wish → real plan → done" },
        { label: "Active reminders", sublabel: "WhatsApp + email when it matters" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "What changes for you",
      title: "You stop relying on willpower",
      subtitle:
        "The work of remembering, scheduling, prioritizing and tracking disappears. What's left is the part that matters — learning, deciding, doing.",
      items: [
        {
          title: "Your study adapts in real time",
          description:
            "Got a quiz wrong? The next block focuses on that gap. Crushing a topic? It accelerates. The plan rewrites itself as you go — never static, never generic.",
        },
        {
          title: "Your agent moves your day forward",
          description:
            "It schedules study sessions when you're free, pings you on WhatsApp 5 minutes before, reschedules when you skip, and prioritizes your week by what matters most right now.",
        },
        {
          title: "Your knowledge compounds",
          description:
            "Every note, every book, every conversation feeds a personal graph. The longer you use it, the more your agent knows you and the sharper its suggestions get.",
        },
        {
          title: "Your goals actually get done",
          description:
            "An engine that takes a vague intention, clarifies it into a real plan, schedules the work, tracks progress, and tells you when something's drifting. Goals stop being wishes.",
        },
      ],
    },

    agentSection: {
      badge: "The agent that acts",
      title: "Not a chatbot. An operator.",
      subtitle:
        "Most AI tools wait for instructions. Latzu's agent reads your goals, plans your week, schedules your study blocks, sends WhatsApp at 6:55am, moves tasks when you fall behind, and reorganizes when life changes. It does the work — you decide what matters.",
      points: [
        "Schedules study sessions on your real calendar — and notifies on WhatsApp/email",
        "Adapts your plan in real time based on quiz scores, task outcomes, and what you skipped",
        "Reprioritizes your week so the highest-leverage thing is always on top",
        "Detects goals you mentioned in passing and turns them into a tracked plan",
        "Connects what you're learning today to what you saved months ago",
      ],
      insight:
        "After two weeks, your agent knows your patterns better than your last app ever did. And it's getting sharper every day.",
      activityLog: [
        { action: "Scheduled", detail: "OSPF study block · tomorrow 7:00 AM · WhatsApp reminder set", time: "2m ago" },
        { action: "Adapted", detail: "Quiz score 60% → next session focuses on link-state routing", time: "15m ago" },
        { action: "Notified", detail: "WhatsApp sent: \"Time to review React Hooks (12 cards due)\"", time: "1h ago" },
        { action: "Rebuilt", detail: "Weekly plan reprioritized — exam Friday moved to top", time: "3h ago" },
      ],
    },

    integrationsSection: {
      badge: "Where the agent reaches you",
      title: "Lives where you live. Talks how you talk.",
      subtitle:
        "Latzu reaches you on your phone, your inbox and your calendar — and pulls in what you read, watch and save. The notification arrives on WhatsApp 5 minutes before your study block. No app to open.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Reminders, briefings & confirmations on your phone" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Schedules study blocks on your real calendar" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexes your docs into your knowledge graph" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Turns any video into a study source" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Clip any article or document" },
      ],
      moreLabel: "+ more coming",
      chat: {
        agentName: "Latzu",
        time: "6:55 AM",
        messages: [
          { from: "agent", text: "Good morning. You scheduled OSPF for 7:00 AM. 25-min focus block. You missed yesterday's session — I shifted today's load lighter so you actually finish. Ready?" },
          { from: "user", text: "Yes, let's go" },
          { from: "agent", text: "Started. After the block I'll record what you got right/wrong and adjust tomorrow's session automatically." },
        ],
      },
    },

    librarySection: {
      badge: "Library, ready to learn from",
      title: "78 books seeded. Your study, not just your shelf.",
      subtitle:
        "We start your knowledge graph with 78 curated books — fully indexed, summarized and connected. Pull a study plan from any of them, generate flashcards from a chapter, or let the agent recommend a book based on a goal you set.",
      points: [
        "Build a study plan from any book in two clicks",
        "Pull flashcards from any chapter — auto-added to your SRS deck",
        "Chat with any book — it answers from the actual text",
        "The agent links book ideas to your own notes and tasks",
        "Curated across business, learning, productivity and more",
      ],
    },

    featuresSection: {
      badge: "What's inside",
      title1: "Six surfaces.",
      title2: "One adaptive system.",
      subtitle:
        "Each module is a lens on the same loop: learn, decide, execute, adapt. The agent ties them together so you don't have to.",
      items: [
        {
          title: "Adaptive study plans",
          description:
            "Tell Latzu what you want to learn — or pick a book. It builds a phased plan with content per task, generates quizzes, and rewrites itself when your scores change.",
        },
        {
          title: "Auto-scheduling agent",
          description:
            "Schedules study blocks on your calendar, sends WhatsApp pings 5 min before, snoozes when you can't, reschedules when you skip. Never depends on willpower.",
        },
        {
          title: "Spaced repetition (SM-2)",
          description:
            "Every concept you mark important resurfaces at the right time. Pull flashcards from any chapter, any note, any chat — review what matters, skip what's settled.",
        },
        {
          title: "Personal knowledge graph",
          description:
            "Notes, PDFs, links, videos and chat history all live in one searchable graph. Ask anything in plain language — answers come grounded in what you've actually saved.",
        },
        {
          title: "Goal engine",
          description:
            "Vague intention → six clarifying questions → real plan → tracked progress. The engine catches when a goal is drifting and proposes a recovery path before you give up.",
        },
        {
          title: "Background organizer",
          description:
            "An agent that runs while you sleep: merging duplicates, surfacing forgotten ideas, scheduling check-ins, proposing connections — and asking your approval before anything risky.",
        },
      ],
    },

    howSection: {
      badge: "How it works",
      title1: "Three steps.",
      title2: "Then the agent runs the loop.",
      steps: [
        {
          title: "Tell it what you want to learn or do",
          description:
            "A goal, a book to study, a topic to master, a project to ship. Latzu asks 6 clarifying questions in your own time, then builds a real plan with phases and tasks.",
        },
        {
          title: "The agent schedules and reminds you",
          description:
            "Study blocks land on your calendar. WhatsApp pings 5 min before each one. When you skip, it reschedules. When you crush, it accelerates. You don't manage anything.",
        },
        {
          title: "Everything compounds",
          description:
            "Every quiz score, every completed task, every note becomes data the system uses tomorrow. After a few weeks, your agent knows your patterns and your knowledge starts answering for itself.",
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
          description: "Start your encyclopedia. No commitment, no card.",
          cta: "Start free",
          features: [
            "Drop in up to 30 sources (notes, PDFs, links)",
            "Ask anything across your encyclopedia",
            "Up to 3 active plans",
            "Daily personalized briefings",
            "Basic dashboard with stats",
            "Email support",
          ],
        },
        {
          name: "Pro",
          badge: "Most popular",
          price: "$10",
          period: "/ month",
          description: "For people serious about a knowledge that compounds.",
          cta: "Get Pro",
          featured: true,
          features: [
            "Everything in Free, no limits",
            "Unlimited drops and questions",
            "Unlimited encyclopedia size",
            "Unlimited plans, adaptive in real time",
            "Advanced personal model",
            "Calendar & drive sync",
            "Background organizer agent",
            "Priority support",
          ],
        },
        {
          name: "Max",
          price: "$30",
          period: "/ month",
          description: "For teams and users who want the most powerful AI.",
          cta: "Get Max",
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
          q: "How is Latzu different from a regular AI chat?",
          a: "A regular AI chat doesn't remember you between sessions, doesn't schedule things on your calendar, doesn't ping you on WhatsApp, doesn't track your real progress on goals. Latzu does all of that — it's a system that LIVES with you, not a tool you ask. The agent acts: it plans your week, sends reminders, adapts when you fall behind. The chat is just one way to talk to it.",
        },
        {
          q: "How is this different from a notes app or a planner?",
          a: "Notes apps store text. Planners store dates. Neither learns from you. Latzu does both AND adapts: study plans rewrite themselves based on quiz scores, the agent reschedules when you skip, and your knowledge graph compounds with every interaction. It's the connective layer that runs the whole loop — learn, decide, execute, adapt.",
        },
        {
          q: "Can it really send me WhatsApp messages?",
          a: "Yes. Connect your phone number once. The agent decides when something matters enough to ping you (5 min before a study block, when an exam is near, when a goal is drifting) and sends it on WhatsApp. You can also reply to confirm or snooze.",
        },
        {
          q: "Does it work if I don't open the app every day?",
          a: "Yes — that's the point. The agent runs in the background, sends WhatsApp/email reminders, and updates your plans based on what's happening. When you do open the app, you see what changed and what needs your attention. No streak guilt.",
        },
        {
          q: "What can I drop in?",
          a: "Notes, PDFs, articles, web links, YouTube videos, photos, voice memos, books from our curated library. The agent reads, transcribes, indexes, and connects everything to what you're learning and doing.",
        },
        {
          q: "Do I need a credit card to start?",
          a: "No. The free trial doesn't require a card. Create an account and start using it immediately.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. No contracts, no commitments. Your access continues until the end of the billing period.",
        },
        {
          q: "Does it work for any field?",
          a: "Yes. Latzu is domain-agnostic. Students, professionals, researchers, founders, lifelong learners — anyone with knowledge to learn and goals to ship.",
        },
        {
          q: "Is my data safe?",
          a: "Your data is private and encrypted. We don't share it with third parties. You can export or delete everything at any time.",
        },
        {
          q: "Are there discounts for students or universities?",
          a: "Yes. Special plans available for educational institutions and student groups. Contact us at latzuapp@gmail.com.",
        },
      ],
    },

    finalCtaSection: {
      title1: "Start the loop.",
      title2: "Latzu runs it with you.",
      subtitle:
        "Adaptive learning, agent-driven execution, knowledge that compounds. Set up in minutes — and let your agent take it from there.",
      ctaPrimary: "Start free",
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
      subtitle: "Adaptive learning + execution",
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
      noAccount: "Don't have an account?",
      registerLink: "Start free",
      continueWithGoogle: "Continue with Google",
      orDivider: "or",
      features: [
        { title: "Adaptive study plans", description: "Plans that rewrite themselves based on your real progress" },
        { title: "Agent that schedules + reminds", description: "WhatsApp pings before each block — no willpower needed" },
        { title: "Knowledge that compounds", description: "Every note + outcome makes the system smarter about you" },
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
        home: "Today",
        brain: "My knowledge",
        planning: "Calendar",
        chat: "Chat",
        agent: "Agent",
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
      tryFree: "Empezar gratis",
    },

    hero: {
      badge: "Sistema adaptativo de aprendizaje + ejecución",
      headline1: "Aprendé lo que importa.",
      headline2: "Ejecutá lo que decidiste.",
      subtitle:
        "Un agente que se adapta a cómo aprendés, planifica con vos, te avisa por WhatsApp en el momento justo y convierte todo lo que leés en un conocimiento que crece. Tu sistema operativo personal para lo que querés ser.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Ver cómo funciona",
      socialProof: "Acceso anticipado gratuito · Sin tarjeta de crédito",
      onlineStatus: "En línea",
      chatMessage1:
        "Leí las 14 cosas que tiraste esta semana. Se agrupan en tres metas que venís siguiendo — ¿querés que te muestre qué las conecta?",
      chatUserMessage: "Sí — y recordame dónde quedé",
      chatMessage2:
        "Estabas comparando dos enfoques en tus notas del martes. El PDF que guardaste el jueves responde justo eso. Acá va el hilo...",
      floatingMemory: "Enciclopedia creciendo",
      floatingStreak: "342 ideas conectadas",
      floatingConcepts: "47 preguntas respondidas con tu propio conocimiento",
    },

    stats: [
      { value: "10x", label: "Aprendizaje más rápido" },
      { value: "24/7", label: "Tutor disponible" },
      { value: "∞", label: "Conocimiento organizado" },
      { value: "100%", label: "Personalizado para ti" },
    ],

    moduleStrip: [
      { label: "Planes de estudio adaptativos" },
      { label: "Bloques auto-agendados" },
      { label: "Recordatorios por WhatsApp + email" },
      { label: "Conocimiento personal que crece" },
      { label: "Un agente que actúa por vos" },
    ],

    painSection: {
      badge: "La idea",
      title: "Saber no alcanza. Latzu cierra el loop.",
      subtitle:
        "La mayoría de las apps te ayudan a guardar, planificar O estudiar. Lo difícil es el loop: aprender lo que importa, decidir qué hacer, ejecutar a tiempo, adaptar sobre la marcha. Latzu corre ese loop con vos — todos los días.",
      items: [
        {
          title: "Aprende como vos aprendés",
          description:
            "Planes de estudio adaptativos, repetición espaciada, contenido generado para tu nivel — el sistema mide lo que entendés de verdad, no lo que se siente familiar.",
        },
        {
          title: "Ejecuta lo que decidiste",
          description:
            "Un agente que agenda tus bloques de estudio, te manda WhatsApp en el momento justo, mueve tareas cuando te atrasás, y hace seguimiento real de tu progreso.",
        },
        {
          title: "Construye un conocimiento que se acumula",
          description:
            "Cada nota, libro, conversación y resultado alimenta un grafo personal que se vuelve más inteligente cada semana — la base sobre la que se paran tus futuras decisiones.",
        },
      ],
    },

    replacesSection: {
      badge: "Un solo sistema operativo",
      title: "Dejá de usar 5 apps para vivir una sola vida",
      subtitle:
        "App de notas + planificador + app de estudio + recordatorios + calendario + chat IA — cada una persigue una meta distinta. Latzu las reemplaza por una sola capa adaptativa que te conoce en todas.",
      items: [
        { label: "Aprendizaje adaptativo", sublabel: "SRS + planes que se ajustan a tu progreso real" },
        { label: "Planificación inteligente", sublabel: "Un agente que agenda y reprioriza por vos" },
        { label: "Conocimiento personal", sublabel: "Notas, libros, links creciendo en un grafo" },
        { label: "Seguimiento de metas", sublabel: "Deseo vago → plan real → ejecutado" },
        { label: "Recordatorios activos", sublabel: "WhatsApp + email cuando importa" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "Lo que cambia para vos",
      title: "Dejás de depender de tu fuerza de voluntad",
      subtitle:
        "El trabajo de recordar, agendar, priorizar y hacer seguimiento desaparece. Lo que queda es la parte que importa — aprender, decidir, hacer.",
      items: [
        {
          title: "Tu estudio se adapta en tiempo real",
          description:
            "¿Reprobaste un quiz? El próximo bloque se enfoca en esa brecha. ¿Estás dominando un tema? Acelera. El plan se reescribe sobre la marcha — nunca estático, nunca genérico.",
        },
        {
          title: "Tu agente mueve tu día adelante",
          description:
            "Agenda sesiones de estudio cuando estás libre, te avisa por WhatsApp 5 minutos antes, reprograma cuando salteás, y prioriza tu semana por lo que más importa ahora.",
        },
        {
          title: "Tu conocimiento se acumula",
          description:
            "Cada nota, cada libro, cada conversación alimenta un grafo personal. Cuanto más lo usás, más te conoce el agente y más afiladas son sus sugerencias.",
        },
        {
          title: "Tus metas se hacen de verdad",
          description:
            "Un motor que toma una intención vaga, la clarifica en un plan real, agenda el trabajo, hace seguimiento, y te avisa cuando algo se está desviando. Las metas dejan de ser deseos.",
        },
      ],
    },

    agentSection: {
      badge: "El agente que actúa",
      title: "No es un chatbot. Es un operador.",
      subtitle:
        "La mayoría de las herramientas IA esperan instrucciones. El agente de Latzu lee tus metas, planifica tu semana, agenda tus bloques de estudio, manda WhatsApp a las 6:55 AM, mueve tareas cuando te atrasás, y reorganiza cuando la vida cambia. Hace el trabajo — vos decidís qué importa.",
      points: [
        "Agenda sesiones de estudio en tu calendario real — y avisa por WhatsApp/email",
        "Adapta tu plan en tiempo real según tus quiz, resultados y lo que salteaste",
        "Reprioriza tu semana para que lo de mayor impacto siempre esté arriba",
        "Detecta metas que mencionaste al pasar y las convierte en planes con seguimiento",
        "Conecta lo que estás aprendiendo hoy con lo que guardaste hace meses",
      ],
      insight:
        "Después de dos semanas, tu agente conoce tus patrones mejor que tu última app. Y se vuelve más afilado cada día.",
      activityLog: [
        { action: "Agendé", detail: "Bloque de OSPF · mañana 7:00 AM · WhatsApp configurado", time: "hace 2m" },
        { action: "Adapté", detail: "Quiz 60% → próxima sesión enfocada en routing de estado de enlace", time: "hace 15m" },
        { action: "Notifiqué", detail: "WhatsApp enviado: \"Hora de repasar React Hooks (12 cards)\"", time: "hace 1h" },
        { action: "Reconstruí", detail: "Plan semanal repriorizado — examen viernes movido al tope", time: "hace 3h" },
      ],
    },

    integrationsSection: {
      badge: "Donde el agente te encuentra",
      title: "Vive donde vivís. Habla como hablás.",
      subtitle:
        "Latzu te llega al celular, al inbox y al calendario — y trae lo que leés, mirás y guardás. La notificación llega por WhatsApp 5 minutos antes de tu bloque de estudio. Sin abrir ninguna app.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Recordatorios, resúmenes y confirmaciones en tu celu" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Agenda bloques de estudio en tu calendario real" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexa tus docs a tu grafo de conocimiento" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Convierte cualquier video en fuente de estudio" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Recortá cualquier artículo o documento" },
      ],
      moreLabel: "+ más próximamente",
      chat: {
        agentName: "Latzu",
        time: "6:55 AM",
        messages: [
          { from: "agent", text: "Buen día. Agendaste OSPF a las 7:00 AM. Bloque de 25 minutos. Te salteaste la sesión de ayer — bajé la carga de hoy para que termines de verdad. ¿Listo?" },
          { from: "user", text: "Dale, vamos" },
          { from: "agent", text: "Empezamos. Después del bloque registro qué te salió bien/mal y ajusto la sesión de mañana automáticamente." },
        ],
      },
    },

    librarySection: {
      badge: "Biblioteca, lista para aprender",
      title: "78 libros sembrados. Para estudiar, no solo guardar.",
      subtitle:
        "Arrancamos tu grafo con 78 libros curados — completamente indexados, resumidos y conectados. Sacá un plan de estudio de cualquiera, generá flashcards de un capítulo, o dejá que el agente te recomiende un libro según una meta que pusiste.",
      points: [
        "Armá un plan de estudio desde cualquier libro en dos clicks",
        "Sacá flashcards de cualquier capítulo — auto-agregadas a tu deck SRS",
        "Chateá con cualquier libro — responde desde el texto real",
        "El agente vincula ideas de los libros con tus notas y tareas",
        "Curada en negocios, aprendizaje, productividad y más",
      ],
    },

    featuresSection: {
      badge: "Qué incluye",
      title1: "Seis superficies.",
      title2: "Un sistema adaptativo.",
      subtitle:
        "Cada módulo es una lente sobre el mismo loop: aprender, decidir, ejecutar, adaptar. El agente las conecta para que vos no tengas que hacerlo.",
      items: [
        {
          title: "Planes de estudio adaptativos",
          description:
            "Decile a Latzu qué querés aprender — o elegí un libro. Arma un plan por fases con contenido por tarea, genera quizzes, y se reescribe cuando cambian tus puntajes.",
        },
        {
          title: "Agente que auto-agenda",
          description:
            "Agenda bloques de estudio en tu calendario, manda WhatsApp 5 min antes, posterga cuando no podés, reprograma cuando salteás. Nunca depende de tu fuerza de voluntad.",
        },
        {
          title: "Repetición espaciada (SM-2)",
          description:
            "Cada concepto que marcás como importante vuelve en el momento justo. Sacá flashcards de cualquier capítulo, nota o chat — repasá lo que importa, salteá lo que ya está.",
        },
        {
          title: "Grafo de conocimiento personal",
          description:
            "Notas, PDFs, links, videos e historial de chat viven en un solo grafo buscable. Preguntá en lenguaje natural — las respuestas salen de lo que vos guardaste.",
        },
        {
          title: "Motor de metas",
          description:
            "Intención vaga → seis preguntas que la clarifican → plan real → seguimiento. El motor detecta cuando una meta se está desviando y propone un camino de recuperación antes de que abandones.",
        },
        {
          title: "Organizador en segundo plano",
          description:
            "Un agente que corre mientras dormís: fusiona duplicados, recupera ideas olvidadas, agenda check-ins, propone conexiones — y te pide aprobación antes de cualquier cosa riesgosa.",
        },
      ],
    },

    howSection: {
      badge: "Cómo funciona",
      title1: "Tres pasos.",
      title2: "Después el agente corre el loop.",
      steps: [
        {
          title: "Decile qué querés aprender o hacer",
          description:
            "Una meta, un libro a estudiar, un tema a dominar, un proyecto a enviar. Latzu te hace 6 preguntas a tu ritmo y arma un plan real con fases y tareas.",
        },
        {
          title: "El agente agenda y te avisa",
          description:
            "Los bloques de estudio aterrizan en tu calendario. WhatsApp 5 min antes de cada uno. Cuando salteás, reprograma. Cuando rompés, acelera. Vos no gestionás nada.",
        },
        {
          title: "Todo se acumula",
          description:
            "Cada quiz, cada tarea completada, cada nota se vuelve dato que el sistema usa mañana. Después de unas semanas, tu agente conoce tus patrones y tu conocimiento empieza a responder solo.",
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
          description: "Empezá tu enciclopedia. Sin compromiso, sin tarjeta.",
          cta: "Empezar gratis",
          features: [
            "Tirá hasta 30 fuentes adentro (notas, PDFs, links)",
            "Preguntá lo que quieras sobre tu enciclopedia",
            "Hasta 3 planes activos",
            "Resúmenes diarios personalizados",
            "Dashboard básico con métricas",
            "Soporte por email",
          ],
        },
        {
          name: "Pro",
          badge: "Más popular",
          price: "$10",
          period: "/ mes",
          description: "Para quienes se toman en serio un conocimiento que se acumula.",
          cta: "Obtener Pro",
          featured: true,
          features: [
            "Todo lo de Free, sin límites",
            "Drops y preguntas ilimitadas",
            "Tamaño ilimitado de tu enciclopedia",
            "Planes ilimitados, adaptativos en tiempo real",
            "Modelo personal avanzado",
            "Sincronización con Calendar y Drive",
            "Agente organizador en segundo plano",
            "Soporte prioritario",
          ],
        },
        {
          name: "Max",
          price: "$30",
          period: "/ mes",
          description: "Para equipos y usuarios que quieren la máxima potencia de IA.",
          cta: "Obtener Max",
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
          q: "¿En qué se diferencia Latzu de un chat de IA común?",
          a: "Un chat común no te recuerda entre sesiones, no agenda cosas en tu calendario, no te avisa por WhatsApp, no hace seguimiento real de tus metas. Latzu hace todo eso — es un sistema que VIVE con vos, no una herramienta que le preguntás. El agente actúa: planifica tu semana, manda recordatorios, se adapta cuando te atrasás. El chat es solo una forma de hablarle.",
        },
        {
          q: "¿En qué se diferencia de una app de notas o un planificador?",
          a: "Las apps de notas guardan texto. Los planificadores guardan fechas. Ninguna aprende de vos. Latzu hace ambas cosas Y se adapta: los planes de estudio se reescriben según tus puntajes de quiz, el agente reprograma cuando salteás, y tu grafo de conocimiento se acumula con cada interacción. Es la capa conectiva que corre todo el loop — aprender, decidir, ejecutar, adaptar.",
        },
        {
          q: "¿Realmente puede mandarme mensajes por WhatsApp?",
          a: "Sí. Conectá tu número una sola vez. El agente decide cuándo algo amerita avisarte (5 min antes de un bloque de estudio, cuando se acerca un examen, cuando una meta se está desviando) y lo manda por WhatsApp. También podés responder para confirmar o postergar.",
        },
        {
          q: "¿Funciona si no abro la app todos los días?",
          a: "Sí — esa es la idea. El agente corre en segundo plano, manda recordatorios por WhatsApp/email, y actualiza tus planes según lo que está pasando. Cuando abrís la app, ves qué cambió y qué necesita tu atención. Sin culpa por rachas.",
        },
        {
          q: "¿Qué puedo tirar adentro?",
          a: "Notas, PDFs, artículos, links web, videos de YouTube, fotos, audios, libros de nuestra biblioteca curada. El agente lee, transcribe, indexa y conecta todo con lo que estás aprendiendo y haciendo.",
        },
        {
          q: "¿Necesito tarjeta de crédito para empezar?",
          a: "No. La prueba gratuita no requiere tarjeta. Creá tu cuenta y empezá a usarla al toque.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí. Sin contratos, sin compromisos. Tu acceso sigue hasta el fin del periodo de facturación.",
        },
        {
          q: "¿Funciona para cualquier área?",
          a: "Sí. Latzu es agnóstico al dominio. Estudiantes, profesionales, investigadores, emprendedores, curiosos — cualquiera con conocimiento para aprender y metas para enviar.",
        },
        {
          q: "¿Mis datos están seguros?",
          a: "Tus datos son privados y encriptados. No los compartimos con terceros. Podés exportar o borrar todo cuando quieras.",
        },
        {
          q: "¿Hay descuento para estudiantes o universidades?",
          a: "Sí. Planes especiales para instituciones educativas y grupos de estudiantes. Escribinos a latzuapp@gmail.com.",
        },
      ],
    },

    finalCtaSection: {
      title1: "Empezá el loop.",
      title2: "Latzu lo corre con vos.",
      subtitle:
        "Aprendizaje adaptativo, ejecución dirigida por agente, conocimiento que se acumula. Configurás en minutos — y dejás que tu agente lo lleve adelante.",
      ctaPrimary: "Empezar gratis",
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
      subtitle: "Aprendizaje + ejecución adaptativos",
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
      noAccount: "¿No tenés cuenta?",
      registerLink: "Empezar gratis",
      continueWithGoogle: "Continuar con Google",
      orDivider: "o",
      features: [
        { title: "Planes de estudio adaptativos", description: "Planes que se reescriben según tu progreso real" },
        { title: "Agente que agenda + recuerda", description: "WhatsApp antes de cada bloque — sin fuerza de voluntad" },
        { title: "Conocimiento que se acumula", description: "Cada nota + resultado vuelve al sistema más inteligente" },
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
        home: "Hoy",
        brain: "Mi conocimiento",
        planning: "Calendario",
        chat: "Chat",
        agent: "Agente",
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
