"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es";

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  en: {
    loading: "Loading...",

    nav: {
      pricing: "Pricing",
      login: "Log in",
      tryFree: "Start free",
    },

    landing: {
      hero: {
        badge: "Adaptive intelligence for what you want to become",
        headline1: "Your knowledge,",
        headline2: "one connected galaxy.",
        sub: "The first agent that learns with you, organizes your tasks, and walks beside your goals — all in one place.",
        ctaPrimary: "Start free",
        ctaSecondary: "See how it works",
        socialProof: "Free early access · No credit card required",
        mono: "40 nodes · 78 connections · live",
      },
      problem: {
        label: "01 — Today",
        headline: "It lives in three different apps.",
        sub: "Notes in one. Tasks in another. Conversations in a third. None of them talk to each other.",
        clusters: [
          { label: "Notes" },
          { label: "Tasks" },
          { label: "Chat" },
        ],
        mono: "0 connections",
      },
      knowledge: {
        label: "02 — Latzu",
        headline: "Latzu connects them.",
        sub: "Every concept, book, task and conversation links into one personal graph that grows with you.",
        mono: "0 → 78 connections",
        bullets: [
          "Notes, PDFs and links indexed automatically",
          "Books, conversations, outcomes — all woven in",
          "Search by meaning, not by keywords",
        ],
      },
      planning: {
        label: "03 — Action",
        headline: "Knowledge becomes a plan.",
        sub: "Turn any idea into an executable plan. Tasks, priorities, deadlines — without leaving the chat.",
        columns: ["Backlog", "In progress", "Blocked", "Done"],
        bullets: [
          "Plans that rewrite themselves on your real progress",
          "Tasks created straight from a conversation",
          "Deadlines synced with your calendar",
        ],
      },
      mentor: {
        label: "04 — Mentor",
        headline: "And a mentor that closes the loop.",
        sub: "It doesn't just answer. It creates the tasks, spots blockers, and pushes you when you need it.",
        agentName: "Latzu",
        statusLabel: "Active",
        typing: "typing…",
        bubbles: [
          { from: "user", text: "I have a calculus exam in 12 days." },
          { from: "agent", text: "Done — I built a 5-block plan. The first one starts tomorrow at 7am." },
          { from: "user", text: "And if I fall behind?" },
          { from: "agent", text: "I rebuild the schedule and ping you on WhatsApp before each block." },
        ],
      },
      integrations: {
        label: "Connected to what you already use",
        headline: "Everything plugs in.",
        sub: "WhatsApp pings, calendar blocks, Drive PDFs, YouTube transcripts. Your sources stay where they are.",
        items: [
          { name: "WhatsApp", desc: "Reminders that actually arrive" },
          { name: "Google Calendar", desc: "Study blocks synced" },
          { name: "Google Drive", desc: "Your PDFs, indexed" },
          { name: "YouTube", desc: "Videos transcribed into your graph" },
          { name: "Web & PDF", desc: "Any link, captured" },
        ],
        mono: "5 sources connected",
      },
    },

    pricingSection: {
      badge: "Pricing",
      title: "Start free. Scale without friction.",
      subtitle: "No contracts. No hidden fees. Cancel anytime.",
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
            "Unlimited plans, adaptive in real time",
            "Calendar & Drive sync",
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
            "API access",
            "Dedicated 24/7 support",
          ],
        },
      ],
    },

    finalCtaSection: {
      title1: "Your mind,",
      title2: "organized by an AI that understands it.",
      subtitle: "Free to start, no card required. Up and running in under two minutes.",
      ctaPrimary: "Start free",
      ctaSecondary: "Log in",
      socialProof: "Free early access · No credit card required · HTTPS encrypted",
    },

    footerSection: {
      pricing: "Pricing",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      copyright: "© 2026 Latzu",
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
      pricing: "Precios",
      login: "Iniciar sesión",
      tryFree: "Empezar gratis",
    },

    landing: {
      hero: {
        badge: "Inteligencia adaptativa para lo que querés llegar a ser",
        headline1: "Tu conocimiento,",
        headline2: "una galaxia conectada.",
        sub: "El primer agente que aprende con vos, organiza tus tareas y te acompaña en tus metas — todo en un solo lugar.",
        ctaPrimary: "Empezar gratis",
        ctaSecondary: "Ver cómo funciona",
        socialProof: "Acceso anticipado gratuito · Sin tarjeta de crédito",
        mono: "40 nodos · 78 conexiones · en vivo",
      },
      problem: {
        label: "01 — Hoy",
        headline: "Vive en tres apps distintas.",
        sub: "Notas en una. Tareas en otra. Conversaciones en una tercera. Ninguna se habla con la otra.",
        clusters: [
          { label: "Notas" },
          { label: "Tareas" },
          { label: "Chat" },
        ],
        mono: "0 conexiones",
      },
      knowledge: {
        label: "02 — Latzu",
        headline: "Latzu las une.",
        sub: "Cada concepto, libro, tarea y conversación se enlaza en un grafo personal que crece con vos.",
        mono: "0 → 78 conexiones",
        bullets: [
          "Notas, PDFs y links indexados automáticamente",
          "Libros, conversaciones, resultados — todo entrelazado",
          "Buscás por significado, no por palabras clave",
        ],
      },
      planning: {
        label: "03 — Acción",
        headline: "El conocimiento se vuelve plan.",
        sub: "Convertí cualquier idea en un plan ejecutable. Tareas, prioridades, deadlines — sin salir del chat.",
        columns: ["Backlog", "En curso", "Bloqueado", "Hecho"],
        bullets: [
          "Planes que se reescriben con tu progreso real",
          "Tareas creadas desde una conversación",
          "Deadlines sincronizados con tu calendario",
        ],
      },
      mentor: {
        label: "04 — Mentor",
        headline: "Y un mentor que cierra el ciclo.",
        sub: "No solo responde. Crea las tareas, detecta bloqueos y te empuja cuando hace falta.",
        agentName: "Latzu",
        statusLabel: "Activo",
        typing: "escribiendo…",
        bubbles: [
          { from: "user", text: "Tengo examen de cálculo en 12 días." },
          { from: "agent", text: "Listo — armé un plan de 5 bloques. El primero arranca mañana 7am." },
          { from: "user", text: "¿Y si me atraso?" },
          { from: "agent", text: "Reprogramo el cronograma y te aviso por WhatsApp antes de cada bloque." },
        ],
      },
      integrations: {
        label: "Conectado a lo que ya usás",
        headline: "Todo se enchufa.",
        sub: "Recordatorios por WhatsApp, bloques en tu calendario, PDFs en Drive, transcripciones de YouTube. Tus fuentes se quedan donde están.",
        items: [
          { name: "WhatsApp", desc: "Recordatorios que sí llegan" },
          { name: "Google Calendar", desc: "Bloques de estudio sincronizados" },
          { name: "Google Drive", desc: "Tus PDFs, indexados" },
          { name: "YouTube", desc: "Videos transcritos al grafo" },
          { name: "Web & PDF", desc: "Cualquier link, capturado" },
        ],
        mono: "5 fuentes conectadas",
      },
    },

    pricingSection: {
      badge: "Precios",
      title: "Empezá gratis. Escalá sin fricción.",
      subtitle: "Sin contratos. Sin tarifas ocultas. Cancelás cuando quieras.",
      educationalText: "¿Sos una institución educativa?",
      educationalLink: "Contactanos para planes especiales →",
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
            "Planes ilimitados, adaptativos en tiempo real",
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
            "API access",
            "Soporte dedicado 24/7",
          ],
        },
      ],
    },

    finalCtaSection: {
      title1: "Tu mente,",
      title2: "organizada por una IA que la entiende.",
      subtitle: "Gratis para empezar, sin tarjeta. En menos de dos minutos.",
      ctaPrimary: "Empezar gratis",
      ctaSecondary: "Iniciar sesión",
      socialProof: "Acceso anticipado gratuito · Sin tarjeta · HTTPS cifrado",
    },

    footerSection: {
      pricing: "Precios",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
      copyright: "© 2026 Latzu",
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
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-border/60 hover:border-primary/60 hover:text-primary transition-colors text-muted-foreground cursor-pointer ${className ?? ""}`}
      aria-label="Toggle language"
    >
      {t.langToggle}
    </button>
  );
}
