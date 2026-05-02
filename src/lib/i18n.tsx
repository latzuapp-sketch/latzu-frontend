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
      badge: "Your personal encyclopedia",
      headline1: "Drop everything you know.",
      headline2: "Ask anything.",
      subtitle:
        "Throw in your notes, books, links, PDFs and screenshots. The AI reads it all, connects the ideas and turns it into your personal encyclopedia. Then you just ask.",
      ctaPrimary: "Start my encyclopedia",
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
      { label: "Drop anything in" },
      { label: "AI organizes it" },
      { label: "Connections appear" },
      { label: "Ask in natural language" },
      { label: "Gets smarter every time" },
    ],

    painSection: {
      badge: "Why this matters",
      title: "You already know a lot. You just can't find it.",
      subtitle:
        "Notes scattered across apps. Books you read once. PDFs you'll never open again. The knowledge is yours — but no system actually understands it.",
      items: [
        {
          title: "Your knowledge is everywhere and nowhere",
          description:
            "Highlights in one place, notes in another, that one PDF you saved six months ago somewhere you don't remember. Searching it by hand never works.",
        },
        {
          title: "Generic AI doesn't know you",
          description:
            "A chat that starts from zero every time can't connect what you read last week with what you're thinking today. It only sees the message in front of it.",
        },
        {
          title: "Organizing it manually is a second job",
          description:
            "Tagging, linking, structuring — most people give up after a month. Your knowledge ends up frozen instead of compounding.",
        },
      ],
    },

    replacesSection: {
      badge: "One place",
      title: "Everything you know, in one encyclopedia that thinks",
      subtitle:
        "Stop juggling apps. Drop your notes, books, links and screenshots in one place. Latzu reads, connects, and answers — across all of it, as if it were a single mind.",
      items: [
        { label: "Notes & ideas", sublabel: "Anything you write or capture" },
        { label: "Tasks & plans", sublabel: "What you said you'd do" },
        { label: "Books & PDFs", sublabel: "Everything you read, indexed" },
        { label: "Links & videos", sublabel: "Web pages and YouTube, summarized" },
        { label: "Photos & screenshots", sublabel: "Read, transcribed, connected" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "The loop that compounds",
      title: "It gets smarter every time you use it",
      subtitle:
        "You don't have to organize anything. Each interaction teaches Latzu more about how you think — and the next answer is better than the last.",
      items: [
        {
          title: "You drop something in",
          description:
            "A note, a PDF, a YouTube link, a photo of your whiteboard. Anything. Latzu reads it, summarizes it and figures out where it fits.",
        },
        {
          title: "It connects ideas across your knowledge",
          description:
            "Every new piece links to what you already had. Concepts from different sources start talking to each other — even ones you saved months apart.",
        },
        {
          title: "You ask in plain language",
          description:
            "Search your own knowledge like you'd ask a friend. The answer comes from your encyclopedia — not from the internet, not from someone else's data.",
        },
        {
          title: "The encyclopedia learns from your questions",
          description:
            "What you ask, what you ignore, what you act on — all of it shapes what Latzu surfaces next. The more you use it, the more it sounds like you.",
        },
      ],
    },

    agentSection: {
      badge: "The Organizer Agent",
      title: "Working in the background, on your encyclopedia",
      subtitle:
        "Most assistants wait for instructions. Latzu's agent reads what you've added, finds patterns, links related ideas and surfaces what matters — without being asked.",
      points: [
        "Reads everything you drop in: text, PDFs, audio, screenshots",
        "Connects ideas across notes, books and links automatically",
        "Spots goals you mentioned in passing and tracks them",
        "Cleans up what's stale, highlights what's hot",
        "Pings you at the right moment — never just to remind you it exists",
      ],
      insight:
        "After a few weeks of dropping things in, your encyclopedia knows you. Every answer gets sharper.",
      activityLog: [
        { action: "Connected", detail: "Note from Tuesday → PDF you saved last month", time: "2m ago" },
        { action: "Synthesized", detail: "New summary across 5 sources on the same topic", time: "15m ago" },
        { action: "Surfaced", detail: "An idea you wrote 3 weeks ago, relevant again now", time: "1h ago" },
        { action: "Cleaned", detail: "12 fragments merged into 3 clean entries", time: "3h ago" },
      ],
    },

    integrationsSection: {
      badge: "Drops from anywhere",
      title: "Whatever you already use, becomes part of your encyclopedia.",
      subtitle:
        "Connect once. Latzu pulls from your calendar, drives and saved videos — and indexes them all into the same searchable, askable encyclopedia.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Drop voice notes and messages on the go" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Knows what's on your week" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexes every doc into your encyclopedia" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Turns any video into searchable knowledge" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Clip any article or document" },
      ],
      moreLabel: "+ more coming",
      chat: {
        agentName: "Latzu",
        time: "7:58 AM",
        messages: [
          { from: "agent", text: "Good morning. You dropped 6 things into your encyclopedia yesterday. Three of them connect to a goal you mentioned weeks ago — want the synthesis?" },
          { from: "user", text: "Yes, send it" },
          { from: "agent", text: "Sent. I also found a contradiction between the article you saved last night and a note from March. I marked both for you to revisit." },
        ],
      },
    },

    librarySection: {
      badge: "Books built in",
      title: "78 books, already part of your encyclopedia.",
      subtitle:
        "We seed your encyclopedia with curated books — fully indexed, summarized and connected to whatever you add. Ask any of them. Mix them with your own notes. Pull lessons in seconds.",
      points: [
        "Chapters, key concepts and exercises ready to query",
        "Pull flashcards from any chapter, in one click",
        "Chat with any book — it answers from the actual text",
        "The agent links book ideas to your own notes automatically",
        "Curated across business, learning, productivity and more",
      ],
    },

    featuresSection: {
      badge: "What's inside",
      title1: "One encyclopedia.",
      title2: "Every way to use it.",
      subtitle:
        "Each module is a different lens on the same encyclopedia. Drop in, organize, ask, plan, learn, act — all on top of one growing memory of you.",
      items: [
        {
          title: "Drop zone",
          description:
            "Throw in notes, PDFs, links, YouTube videos, photos and screenshots. Latzu reads, transcribes and indexes everything — no folders to set up.",
        },
        {
          title: "Knowledge graph",
          description:
            "Every idea you drop in becomes a node connected to what you already had. Discover relationships you never noticed — including across sources you forgot about.",
        },
        {
          title: "Ask anything",
          description:
            "Search your own knowledge in plain language. Get answers grounded in what you actually saved — not in some generic model trained on the internet.",
        },
        {
          title: "Adaptive plans",
          description:
            "Tell Latzu a goal — or let it spot one in your notes. It builds a plan, tracks your progress and rewrites it as life moves. Never static.",
        },
        {
          title: "Spaced repetition built in",
          description:
            "Important ideas resurface at the right time. Pull flashcards from any source — book chapter, article, your own note — and review what actually matters.",
        },
        {
          title: "Background organizer",
          description:
            "An agent that runs while you do anything else: cleaning duplicates, merging fragments, surfacing forgotten ideas, proposing new connections.",
        },
      ],
    },

    howSection: {
      badge: "How it works",
      title1: "Three steps. No",
      title2: "setup.",
      steps: [
        {
          title: "Drop everything in",
          description:
            "Notes, PDFs, links, voice memos, photos. Anything you've collected — anything you collect from now on. No folders, no tags, no structure required.",
        },
        {
          title: "Latzu reads it and connects it",
          description:
            "It summarizes, links related ideas across all your sources and turns the pile into a coherent personal encyclopedia. You don't write a thing.",
        },
        {
          title: "Ask anything, in your own words",
          description:
            "Your encyclopedia answers from what you know. Each question makes it sharper. After a few weeks, it sounds like the smartest version of you.",
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
          q: "How is this different from a regular AI chat?",
          a: "A regular AI chat starts from zero every conversation — it doesn't know what you've read, written or saved. Latzu only knows what you give it, but it knows it deeply: it reads everything you drop in, connects ideas across all of it, and remembers between sessions. The answers come from your encyclopedia, not from generic internet data.",
        },
        {
          q: "How is this different from a notes app?",
          a: "A notes app stores text. The organization is on you — you tag, you link, you fight entropy. Latzu reads what you drop in, summarizes it, finds the connections automatically, and answers questions across everything. You stop organizing and start asking.",
        },
        {
          q: "What can I drop in?",
          a: "Notes, PDFs, articles, web links, YouTube videos, photos of your whiteboard or handwritten pages, screenshots, voice memos. Latzu reads, transcribes and indexes them all into your encyclopedia.",
        },
        {
          q: "Do I need a credit card to start?",
          a: "No. The free trial doesn't require a credit card. Create an account and start dropping things in immediately.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. No contracts, no commitments. Your access continues until the end of the billing period.",
        },
        {
          q: "How does it learn about me?",
          a: "Every drop, every question, every action you take shapes Latzu's model of you. It tracks what you care about, the goals you're chasing, the ideas you keep returning to. The more you use it, the more it sounds like you.",
        },
        {
          q: "Does it work for any field?",
          a: "Yes. Latzu is domain-agnostic. Students, professionals, researchers, founders, lifelong learners — anyone with knowledge worth keeping.",
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
      title1: "Start your",
      title2: "personal encyclopedia.",
      subtitle:
        "Drop in what you already have. Watch it organize itself. Ask anything — and get sharper answers every week.",
      ctaPrimary: "Start my encyclopedia",
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
      subtitle: "Your personal encyclopedia",
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
        { title: "Drop anything in", description: "Notes, PDFs, links, photos — all indexed for you" },
        { title: "Ask in plain language", description: "Search your own knowledge like a conversation" },
        { title: "Gets smarter every week", description: "The more you use it, the more it sounds like you" },
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
      tryFree: "Empezar gratis",
    },

    hero: {
      badge: "Tu enciclopedia personal",
      headline1: "Tirá todo lo que sabés.",
      headline2: "Preguntá lo que quieras.",
      subtitle:
        "Tirá tus notas, libros, links, PDFs y capturas. La IA lee todo, conecta las ideas y lo convierte en tu enciclopedia personal. Después solo preguntás.",
      ctaPrimary: "Empezar mi enciclopedia",
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
      { label: "Tirá lo que sea" },
      { label: "La IA lo organiza" },
      { label: "Aparecen conexiones" },
      { label: "Preguntá en lenguaje natural" },
      { label: "Mejora con cada uso" },
    ],

    painSection: {
      badge: "Por qué importa",
      title: "Sabés mucho. Pero no lo encontrás.",
      subtitle:
        "Notas dispersas en apps. Libros que leíste una vez. PDFs que no vas a abrir más. El conocimiento es tuyo — pero ningún sistema lo entiende de verdad.",
      items: [
        {
          title: "Tu conocimiento está en todos lados y en ninguno",
          description:
            "Subrayados acá, notas allá, ese PDF que guardaste hace seis meses en algún lugar que no recordás. Buscar a mano nunca funciona.",
        },
        {
          title: "Una IA genérica no te conoce",
          description:
            "Un chat que arranca de cero cada vez no puede conectar lo que leíste la semana pasada con lo que estás pensando hoy. Solo ve el mensaje que tiene enfrente.",
        },
        {
          title: "Organizarlo a mano es un segundo trabajo",
          description:
            "Etiquetar, vincular, estructurar — la mayoría se rinde al mes. Tu conocimiento queda congelado en vez de acumularse.",
        },
      ],
    },

    replacesSection: {
      badge: "Un solo lugar",
      title: "Todo lo que sabés, en una enciclopedia que piensa",
      subtitle:
        "Dejá de saltar entre apps. Tirá tus notas, libros, links y capturas en un solo lugar. Latzu lee, conecta y responde — sobre todo eso, como si fuera una única mente.",
      items: [
        { label: "Notas e ideas", sublabel: "Cualquier cosa que escribas o captures" },
        { label: "Tareas y planes", sublabel: "Lo que dijiste que ibas a hacer" },
        { label: "Libros y PDFs", sublabel: "Todo lo que leés, indexado" },
        { label: "Links y videos", sublabel: "Páginas web y YouTube, resumidos" },
        { label: "Fotos y capturas", sublabel: "Leídas, transcritas, conectadas" },
      ],
      arrow: "→ Latzu",
    },

    whySection: {
      badge: "El loop que se acumula",
      title: "Mejora cada vez que la usás",
      subtitle:
        "No tenés que organizar nada. Cada interacción le enseña a Latzu más sobre cómo pensás — y la próxima respuesta es mejor que la anterior.",
      items: [
        {
          title: "Tirás algo adentro",
          description:
            "Una nota, un PDF, un link de YouTube, una foto de tu pizarra. Lo que sea. Latzu lo lee, lo resume y descubre dónde encaja.",
        },
        {
          title: "Conecta ideas en todo tu conocimiento",
          description:
            "Cada pieza nueva se vincula con lo que ya tenías. Conceptos de distintas fuentes empiezan a hablarse — incluso los que guardaste con meses de diferencia.",
        },
        {
          title: "Preguntás en lenguaje natural",
          description:
            "Buscá en tu propio conocimiento como si hablaras con un amigo. La respuesta sale de tu enciclopedia — no de internet, no de los datos de otro.",
        },
        {
          title: "La enciclopedia aprende de tus preguntas",
          description:
            "Lo que preguntás, lo que ignorás, lo que ejecutás — todo eso moldea lo que Latzu te muestra después. Cuanto más la usás, más se parece a vos.",
        },
      ],
    },

    agentSection: {
      badge: "El Agente Organizador",
      title: "Trabaja en segundo plano sobre tu enciclopedia",
      subtitle:
        "La mayoría de asistentes esperan instrucciones. El agente de Latzu lee lo que agregaste, encuentra patrones, vincula ideas relacionadas y muestra lo que importa — sin que se lo pidas.",
      points: [
        "Lee todo lo que tiraste: texto, PDFs, audio, capturas",
        "Conecta ideas entre notas, libros y links automáticamente",
        "Detecta metas que mencionaste de pasada y les hace seguimiento",
        "Limpia lo que se quedó frío, destaca lo que está caliente",
        "Te avisa en el momento adecuado — no solo para recordarte que existe",
      ],
      insight:
        "Después de unas semanas tirando cosas adentro, tu enciclopedia te conoce. Cada respuesta sale más afilada.",
      activityLog: [
        { action: "Conectó", detail: "Nota del martes → PDF que guardaste el mes pasado", time: "hace 2m" },
        { action: "Sintetizó", detail: "Resumen nuevo a partir de 5 fuentes sobre el mismo tema", time: "hace 15m" },
        { action: "Recuperó", detail: "Una idea que escribiste hace 3 semanas, relevante de nuevo", time: "hace 1h" },
        { action: "Limpió", detail: "12 fragmentos fusionados en 3 entradas limpias", time: "hace 3h" },
      ],
    },

    integrationsSection: {
      badge: "Tirá desde donde quieras",
      title: "Lo que ya usás se vuelve parte de tu enciclopedia.",
      subtitle:
        "Conectá una sola vez. Latzu trae cosas de tu calendario, drives y videos guardados — y los indexa todos en la misma enciclopedia que podés buscar y preguntar.",
      integrations: [
        { name: "WhatsApp", color: "oklch(0.65 0.22 145)", desc: "Tirá notas de voz y mensajes desde el celu" },
        { name: "Google Calendar", color: "oklch(0.68 0.24 268)", desc: "Sabe qué tenés esta semana" },
        { name: "Google Drive", color: "oklch(0.75 0.22 60)", desc: "Indexa cada doc a tu enciclopedia" },
        { name: "YouTube", color: "oklch(0.65 0.25 25)", desc: "Convierte cualquier video en conocimiento buscable" },
        { name: "Web & PDF", color: "oklch(0.75 0.22 200)", desc: "Recortá cualquier artículo o documento" },
      ],
      moreLabel: "+ más próximamente",
      chat: {
        agentName: "Latzu",
        time: "7:58 AM",
        messages: [
          { from: "agent", text: "Buen día. Ayer tiraste 6 cosas a tu enciclopedia. Tres conectan con una meta que mencionaste hace semanas — ¿querés la síntesis?" },
          { from: "user", text: "Sí, mandala" },
          { from: "agent", text: "Lista. También encontré una contradicción entre el artículo que guardaste anoche y una nota de marzo. Marqué las dos para que las revises." },
        ],
      },
    },

    librarySection: {
      badge: "Libros incluidos",
      title: "78 libros, ya parte de tu enciclopedia.",
      subtitle:
        "Sembramos tu enciclopedia con libros curados — totalmente indexados, resumidos y conectados con lo que vos agregás. Preguntales lo que quieras. Mezclalos con tus notas. Sacá lecciones en segundos.",
      points: [
        "Capítulos, conceptos clave y ejercicios listos para consultar",
        "Sacá flashcards de cualquier capítulo, en un click",
        "Chateá con cualquier libro — responde desde el texto real",
        "El agente vincula ideas de los libros con tus notas automáticamente",
        "Curada en negocios, aprendizaje, productividad y más",
      ],
    },

    featuresSection: {
      badge: "Qué incluye",
      title1: "Una enciclopedia.",
      title2: "Mil formas de usarla.",
      subtitle:
        "Cada módulo es una lente distinta sobre la misma enciclopedia. Tirá adentro, organizá, preguntá, planificá, aprendé, ejecutá — todo sobre una sola memoria que crece.",
      items: [
        {
          title: "Drop zone",
          description:
            "Tirá notas, PDFs, links, videos de YouTube, fotos y capturas. Latzu lee, transcribe e indexa todo — sin carpetas que armar.",
        },
        {
          title: "Grafo de conocimiento",
          description:
            "Cada idea que tirás se convierte en un nodo conectado con lo que ya tenías. Descubrí relaciones que nunca viste — incluso entre fuentes que olvidaste.",
        },
        {
          title: "Preguntá lo que quieras",
          description:
            "Buscá en tu propio conocimiento en lenguaje natural. Las respuestas vienen de lo que vos guardaste — no de un modelo genérico entrenado con internet.",
        },
        {
          title: "Planes adaptativos",
          description:
            "Decile a Latzu una meta — o dejá que la detecte en tus notas. Arma un plan, hace seguimiento y lo reescribe cuando la vida cambia. Nunca estático.",
        },
        {
          title: "Repetición espaciada incorporada",
          description:
            "Las ideas importantes vuelven a aparecer en el momento justo. Sacá flashcards de cualquier fuente — capítulo de libro, artículo, tu propia nota — y repasá lo que importa.",
        },
        {
          title: "Organizador en segundo plano",
          description:
            "Un agente que corre mientras hacés otra cosa: limpia duplicados, fusiona fragmentos, recupera ideas olvidadas, propone conexiones nuevas.",
        },
      ],
    },

    howSection: {
      badge: "Cómo funciona",
      title1: "Tres pasos. Sin",
      title2: "configuración.",
      steps: [
        {
          title: "Tirá todo adentro",
          description:
            "Notas, PDFs, links, audios, fotos. Cualquier cosa que hayas juntado — y todo lo que junten desde ahora. Sin carpetas, sin etiquetas, sin estructura.",
        },
        {
          title: "Latzu lo lee y lo conecta",
          description:
            "Resume, vincula ideas relacionadas entre todas tus fuentes y convierte la pila en una enciclopedia personal coherente. No escribís nada.",
        },
        {
          title: "Preguntá lo que quieras, en tus palabras",
          description:
            "Tu enciclopedia responde desde lo que vos sabés. Cada pregunta la hace más afilada. Después de unas semanas, suena como la mejor versión de vos.",
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
          q: "¿En qué se diferencia de un chat de IA común?",
          a: "Un chat común arranca desde cero cada conversación — no sabe lo que leíste, escribiste ni guardaste. Latzu solo sabe lo que vos le des, pero lo sabe en profundidad: lee todo lo que tirás adentro, conecta ideas en todo eso, y recuerda entre sesiones. Las respuestas salen de tu enciclopedia, no de datos genéricos de internet.",
        },
        {
          q: "¿En qué se diferencia de una app de notas?",
          a: "Una app de notas guarda texto. La organización corre por tu cuenta — vos etiquetás, vinculás, peleás contra el caos. Latzu lee lo que tirás, resume, encuentra las conexiones automáticamente y responde preguntas sobre todo. Dejás de organizar y empezás a preguntar.",
        },
        {
          q: "¿Qué puedo tirar adentro?",
          a: "Notas, PDFs, artículos, links web, videos de YouTube, fotos de tu pizarra o de hojas escritas a mano, capturas, audios. Latzu lee, transcribe e indexa todo en tu enciclopedia.",
        },
        {
          q: "¿Necesito tarjeta de crédito para empezar?",
          a: "No. La prueba gratuita no requiere tarjeta. Creá tu cuenta y empezá a tirar cosas adentro al toque.",
        },
        {
          q: "¿Puedo cancelar cuando quiera?",
          a: "Sí. Sin contratos, sin compromisos. Tu acceso sigue hasta el fin del periodo de facturación.",
        },
        {
          q: "¿Cómo aprende sobre mí?",
          a: "Cada cosa que tirás, cada pregunta, cada acción que tomás moldea el modelo que Latzu tiene de vos. Hace seguimiento de lo que te importa, las metas que perseguís, las ideas a las que volvés. Cuanto más la usás, más se parece a vos.",
        },
        {
          q: "¿Funciona para cualquier área?",
          a: "Sí. Latzu es agnóstico al dominio. Estudiantes, profesionales, investigadores, emprendedores, curiosos — cualquiera con conocimiento que valga la pena guardar.",
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
      title1: "Empezá tu",
      title2: "enciclopedia personal.",
      subtitle:
        "Tirá adentro lo que ya tenés. Vela organizarse sola. Preguntá lo que quieras — y obtené respuestas más afiladas cada semana.",
      ctaPrimary: "Empezar mi enciclopedia",
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
      subtitle: "Tu enciclopedia personal",
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
        { title: "Tirá lo que sea adentro", description: "Notas, PDFs, links, fotos — todo indexado por vos" },
        { title: "Preguntá en lenguaje natural", description: "Buscá en tu propio conocimiento como una conversación" },
        { title: "Mejora cada semana", description: "Cuanto más la usás, más se parece a vos" },
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
