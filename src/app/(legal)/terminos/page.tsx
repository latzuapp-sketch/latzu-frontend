import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Condiciones de uso de la plataforma Latzu.",
};

const SECTIONS = [
  { id: "aceptacion", label: "Aceptación de los términos" },
  { id: "descripcion", label: "Descripción del servicio" },
  { id: "cuenta", label: "Tu cuenta" },
  { id: "uso-aceptable", label: "Uso aceptable" },
  { id: "contenido", label: "Tu contenido" },
  { id: "ia", label: "Inteligencia Artificial" },
  { id: "propiedad", label: "Propiedad intelectual" },
  { id: "suscripcion", label: "Suscripción y pagos" },
  { id: "garantias", label: "Garantías y limitaciones" },
  { id: "indemnizacion", label: "Indemnización" },
  { id: "suspension", label: "Suspensión y terminación" },
  { id: "modificaciones", label: "Modificaciones" },
  { id: "ley", label: "Ley aplicable" },
  { id: "contacto", label: "Contacto" },
];

export default function TerminosPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-12">

        {/* Sticky TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contenido
            </p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 border-l-2 border-transparent hover:border-primary pl-3"
              >
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-heading prose-headings:font-semibold
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-li:text-muted-foreground prose-li:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground">

          {/* Header */}
          <div className="mb-10 not-prose">
            <h1 className="text-3xl font-heading font-bold mb-2">Términos de Servicio</h1>
            <p className="text-sm text-muted-foreground">
              Vigente desde: <strong>Abril 2026</strong> · Última actualización: Abril 2026
            </p>
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
              Por favor lee estos Términos de Servicio detenidamente antes de usar la plataforma <strong className="text-foreground">Latzu</strong>. Al crear una cuenta o usar nuestros servicios, aceptas estar vinculado por estos términos. Si no estás de acuerdo, no utilices la plataforma.
            </div>
          </div>

          {/* 1 */}
          <h2 id="aceptacion">1. Aceptación de los Términos</h2>
          <p>
            Estos Términos de Servicio («Términos») constituyen un acuerdo legalmente vinculante entre tú («usuario», «tú») y Latzu («Latzu», «nosotros», «nuestro») para el uso de la plataforma de inteligencia adaptativa para el aprendizaje disponible en <strong>latzu.app</strong> y sus subdominios (el «Servicio»).
          </p>
          <p>
            Al registrarte, acceder o usar el Servicio, confirmas que tienes al menos 13 años de edad (o la edad mínima de consentimiento digital en tu país, si es mayor) y que tienes capacidad legal para aceptar estos Términos.
          </p>

          {/* 2 */}
          <h2 id="descripcion">2. Descripción del Servicio</h2>
          <p>
            Latzu es una plataforma de aprendizaje impulsada por inteligencia artificial que ofrece:
          </p>
          <ul>
            <li>Tutor de IA adaptativo con memoria persistente entre sesiones.</li>
            <li>Biblioteca de conocimiento personal con organización en grafo.</li>
            <li>Planificación inteligente de estudios y tareas con integración de calendario.</li>
            <li>Procesamiento de documentos, páginas web y videos de YouTube.</li>
            <li>Chat con IA a través de WhatsApp Business (función opcional).</li>
            <li>Analytics y seguimiento del progreso de aprendizaje.</li>
          </ul>
          <p>
            Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del Servicio en cualquier momento, con o sin previo aviso, según lo descrito en la Sección 12.
          </p>

          {/* 3 */}
          <h2 id="cuenta">3. Tu Cuenta</h2>
          <h3>3.1 Registro</h3>
          <p>
            Para acceder a las funciones completas del Servicio debes crear una cuenta proporcionando información veraz, completa y actualizada. Puedes registrarte con email y contraseña o mediante Google OAuth.
          </p>
          <h3>3.2 Seguridad de la cuenta</h3>
          <p>
            Eres responsable de mantener la confidencialidad de tus credenciales de acceso. Debes notificarnos de inmediato a <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a> si sospechas de acceso no autorizado a tu cuenta.
          </p>
          <h3>3.3 Una cuenta por persona</h3>
          <p>
            Cada persona natural puede tener una sola cuenta activa en el Servicio. La creación de múltiples cuentas para eludir restricciones o sanciones está prohibida.
          </p>
          <h3>3.4 Eliminación de cuenta</h3>
          <p>
            Puedes solicitar la eliminación de tu cuenta y tus datos en cualquier momento a través de nuestra <Link href="/eliminar-datos">página de eliminación de datos</Link>.
          </p>

          {/* 4 */}
          <h2 id="uso-aceptable">4. Uso Aceptable</h2>
          <p>Te comprometes a usar el Servicio únicamente para fines legales y de conformidad con estos Términos. Está <strong>prohibido</strong>:</p>
          <ul>
            <li>Usar el Servicio para generar contenido ilegal, ofensivo, difamatorio, fraudulento o que infrinja derechos de terceros.</li>
            <li>Intentar eludir, desactivar o interferir con las medidas de seguridad del Servicio.</li>
            <li>Acceder al Servicio mediante bots, scrapers u otros medios automatizados no autorizados.</li>
            <li>Usar el Servicio para enviar spam, phishing o cualquier tipo de comunicación no solicitada masiva.</li>
            <li>Suplantar la identidad de otra persona o entidad.</li>
            <li>Revender, sublicenciar o comercializar el acceso al Servicio sin autorización escrita de Latzu.</li>
            <li>Intentar extraer, copiar o reutilizar los modelos de IA, algoritmos o bases de datos propietarias de Latzu.</li>
            <li>Usar el Servicio para perjudicar a menores de edad de cualquier forma.</li>
          </ul>
          <p>
            El incumplimiento de estas normas puede resultar en la suspensión o terminación inmediata de tu cuenta.
          </p>

          {/* 5 */}
          <h2 id="contenido">5. Tu Contenido</h2>
          <h3>5.1 Propiedad</h3>
          <p>
            Retienes todos los derechos de propiedad intelectual sobre el contenido que creas en la plataforma (notas, planes, conocimiento organizado). Latzu no reclama ningún derecho de propiedad sobre tu contenido.
          </p>
          <h3>5.2 Licencia a Latzu</h3>
          <p>
            Al subir o crear contenido en el Servicio, nos otorgas una licencia mundial, no exclusiva, libre de regalías y sublicenciable para <strong>almacenar, procesar y mostrar</strong> dicho contenido únicamente con el fin de prestarte el Servicio. Esta licencia termina cuando eliminas el contenido o tu cuenta.
          </p>
          <h3>5.3 Responsabilidad del contenido</h3>
          <p>
            Eres el único responsable del contenido que introduces en la plataforma. No debes cargar contenido que infrinja derechos de autor, marcas registradas, privacidad u otros derechos de terceros.
          </p>
          <h3>5.4 Exportación</h3>
          <p>
            Puedes solicitar una exportación de tu contenido en cualquier momento escribiéndonos a <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a>.
          </p>

          {/* 6 */}
          <h2 id="ia">6. Inteligencia Artificial — Limitaciones y Uso Responsable</h2>
          <p>
            El Servicio utiliza modelos de lenguaje de gran escala (incluyendo Google Gemini) para generar respuestas. Debes tener en cuenta que:
          </p>
          <ul>
            <li>Las respuestas generadas por IA pueden contener errores, imprecisiones o información desactualizada. <strong>No deben reemplazar el juicio de un profesional cualificado</strong> en materias médicas, legales, financieras o de seguridad.</li>
            <li>Los modelos de IA pueden ocasionalmente generar contenido inesperado. Si encuentras una respuesta inapropiada, repórtala a <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a>.</li>
            <li>Latzu no garantiza que las respuestas de la IA sean siempre correctas, completas o apropiadas para tu caso específico.</li>
            <li>El uso del Servicio con fines académicos es tu responsabilidad. Debes conocer y cumplir las normas de integridad académica de tu institución.</li>
          </ul>

          {/* 7 */}
          <h2 id="propiedad">7. Propiedad Intelectual de Latzu</h2>
          <p>
            El Servicio, incluyendo su diseño, código fuente, marcas, logotipos, modelos de personalización, sistemas de memoria adaptativa y demás elementos propietarios, son propiedad exclusiva de Latzu y están protegidos por las leyes de propiedad intelectual aplicables.
          </p>
          <p>
            Se te otorga una licencia limitada, no exclusiva, no transferible y revocable para acceder y usar el Servicio de conformidad con estos Términos. No adquieres ningún otro derecho sobre el Servicio.
          </p>

          {/* 8 */}
          <h2 id="suscripcion">8. Suscripción y Pagos</h2>
          <h3>8.1 Plan gratuito</h3>
          <p>
            Latzu ofrece un período de prueba gratuito de 7 días con acceso a las funciones principales. No se requiere tarjeta de crédito para el período de prueba.
          </p>
          <h3>8.2 Planes de pago</h3>
          <p>
            Al suscribirte a un plan de pago, aceptas el precio y las condiciones de facturación vigentes al momento de la suscripción. Los precios pueden variar y se publicarán con antelación razonable.
          </p>
          <h3>8.3 Cancelación y reembolsos</h3>
          <p>
            Puedes cancelar tu suscripción en cualquier momento. Continuarás teniendo acceso hasta el final del período de facturación pagado. No ofrecemos reembolsos parciales por períodos no utilizados, salvo lo que exija la ley aplicable.
          </p>
          <h3>8.4 Cambios de precio</h3>
          <p>
            Notificaremos cambios de precio con al menos 30 días de anticipación. Si no estás de acuerdo con el nuevo precio, puedes cancelar antes de que el cambio entre en vigencia.
          </p>

          {/* 9 */}
          <h2 id="garantias">9. Garantías y Limitación de Responsabilidad</h2>
          <p>
            <strong>El Servicio se proporciona «tal cual» y «según disponibilidad»</strong>, sin garantías de ningún tipo, ya sean expresas o implícitas, incluyendo (sin limitación) garantías de comerciabilidad, idoneidad para un propósito particular o no infracción.
          </p>
          <p>
            En la máxima medida permitida por la ley aplicable, Latzu no será responsable por:
          </p>
          <ul>
            <li>Pérdida de datos, ingresos, beneficios u oportunidades comerciales.</li>
            <li>Daños derivados de decisiones tomadas con base en respuestas generadas por IA.</li>
            <li>Interrupciones del servicio por mantenimiento, fallas técnicas o causas de fuerza mayor.</li>
            <li>Acceso no autorizado a tu cuenta si resulta de la divulgación de tus credenciales.</li>
            <li>Daños indirectos, incidentales, especiales, consecuentes o punitivos.</li>
          </ul>
          <p>
            La responsabilidad total de Latzu por cualquier reclamación no excederá el monto que hayas pagado por el Servicio en los 12 meses anteriores a la reclamación, o COP $50.000, lo que sea mayor.
          </p>

          {/* 10 */}
          <h2 id="indemnizacion">10. Indemnización</h2>
          <p>
            Aceptas indemnizar, defender y mantener indemne a Latzu y a sus representantes, empleados y agentes frente a cualquier reclamación, daño, pérdida, responsabilidad, costo o gasto (incluidos honorarios legales razonables) que surja de:
          </p>
          <ul>
            <li>Tu uso del Servicio en violación de estos Términos.</li>
            <li>El contenido que cargas o generas en la plataforma.</li>
            <li>La infracción de derechos de terceros como resultado de tus acciones.</li>
          </ul>

          {/* 11 */}
          <h2 id="suspension">11. Suspensión y Terminación</h2>
          <p>
            Latzu puede suspender o terminar tu acceso al Servicio, con o sin previo aviso, si:
          </p>
          <ul>
            <li>Violas cualquier disposición de estos Términos.</li>
            <li>Tu comportamiento causa daño a la plataforma, a otros usuarios o a Latzu.</li>
            <li>Existen razones de seguridad que lo requieran.</li>
            <li>Estamos obligados a hacerlo por ley.</li>
          </ul>
          <p>
            Puedes terminar tu relación con Latzu en cualquier momento eliminando tu cuenta. Las secciones 5, 7, 9, 10 y 13 sobrevivirán a la terminación de estos Términos.
          </p>

          {/* 12 */}
          <h2 id="modificaciones">12. Modificaciones al Servicio y a estos Términos</h2>
          <p>
            Podemos modificar estos Términos en cualquier momento. Cuando hagamos cambios materiales, te notificaremos con al menos <strong>15 días de anticipación</strong> mediante un aviso en la plataforma o por correo electrónico. El uso continuado del Servicio después de la fecha de vigencia constituye aceptación de los nuevos Términos.
          </p>
          <p>
            También podemos modificar, suspender o discontinuar el Servicio (o cualquier parte de él) en cualquier momento. En caso de discontinuación del Servicio, haremos un esfuerzo razonable para notificarte con anticipación y facilitar la exportación de tu contenido.
          </p>

          {/* 13 */}
          <h2 id="ley">13. Ley Aplicable y Resolución de Disputas</h2>
          <p>
            Estos Términos se rigen por las leyes de la <strong>República de Colombia</strong>. Cualquier disputa relacionada con el Servicio o estos Términos se intentará resolver en primera instancia mediante negociación directa. Si no se llega a un acuerdo en 30 días, las disputas se someterán a la jurisdicción de los tribunales competentes de Colombia.
          </p>
          <p>
            Para usuarios en la Unión Europea, también pueden aplicar los mecanismos de resolución alternativa de disputas previstos en la legislación europea.
          </p>

          {/* 14 */}
          <h2 id="contacto">14. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos de Servicio, contáctanos:
          </p>
          <ul>
            <li><strong>Correo electrónico:</strong> <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a></li>
            <li><strong>Política de Privacidad:</strong> <Link href="/privacidad">Ver política</Link></li>
            <li><strong>Eliminación de datos:</strong> <Link href="/eliminar-datos">Solicitar eliminación</Link></li>
          </ul>
        </article>
      </div>
    </div>
  );
}
