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
      badge: "Adaptive Intelligence for Learning",
      headline1: "Learn faster with",
      headline2: "AI that knows you",
      subtitle:
        "Personal AI tutor, knowledge library, smart planning and adaptive memory — all in one platform that evolves with you.",
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
      title1: "Your best version",
      title2: "starts today",
      subtitle:
        "Join the first wave of students who will learn with adaptive intelligence. Get early access before we open to everyone.",
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
      subtitle: "Be the first to experience Latzu",
      cardTitle: "Join the waitlist",
      cardDescription: "Get early access when we open registrations",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      errorRequired: "Name and email are required",
      createButton: "Join the waitlist",
      successTitle: "You're on the list!",
      successMessage: "We'll notify you as soon as we open registrations. Thank you for your interest in Latzu.",
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
      badge: "Inteligencia Adaptativa para el Aprendizaje",
      headline1: "Aprende más rápido con",
      headline2: "IA que te conoce",
      subtitle:
        "Tutor IA personal, biblioteca de conocimiento, planificación inteligente y memoria adaptativa — todo en una plataforma que evoluciona contigo.",
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
      subtitle: "Sé de los primeros en experimentar Latzu",
      cardTitle: "Únete a la lista de espera",
      cardDescription: "Obtén acceso anticipado cuando abramos los registros",
      nameLabel: "Nombre",
      namePlaceholder: "Tu nombre",
      emailLabel: "Email",
      errorRequired: "Nombre y email son requeridos",
      createButton: "Únete a la lista de espera",
      successTitle: "¡Estás en la lista!",
      successMessage: "Te notificaremos en cuanto abramos los registros. Gracias por tu interés en Latzu.",
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
