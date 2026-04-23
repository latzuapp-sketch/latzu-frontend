import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo Latzu recopila, usa y protege tu información personal.",
};

const SECTIONS = [
  { id: "responsable", label: "Responsable del tratamiento" },
  { id: "datos", label: "Datos que recopilamos" },
  { id: "uso", label: "Cómo usamos tus datos" },
  { id: "base-legal", label: "Base legal" },
  { id: "terceros", label: "Compartición con terceros" },
  { id: "whatsapp", label: "WhatsApp Business" },
  { id: "retencion", label: "Retención de datos" },
  { id: "derechos", label: "Tus derechos" },
  { id: "cookies", label: "Cookies" },
  { id: "seguridad", label: "Seguridad" },
  { id: "menores", label: "Menores de edad" },
  { id: "cambios", label: "Cambios a esta política" },
  { id: "contacto", label: "Contacto" },
];

export default function PrivacidadPage() {
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
            <h1 className="text-3xl font-heading font-bold mb-2">Política de Privacidad</h1>
            <p className="text-sm text-muted-foreground">
              Vigente desde: <strong>Abril 2026</strong> · Última actualización: Abril 2026
            </p>
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
              Esta Política de Privacidad describe cómo <strong className="text-foreground">Latzu</strong> («nosotros», «nuestro») recopila, usa y protege tu información cuando utilizas nuestra plataforma de inteligencia adaptativa para el aprendizaje. Aplica a todos los servicios de Latzu, incluyendo el sitio web, la aplicación y la integración con WhatsApp Business.
            </div>
          </div>

          {/* 1 */}
          <h2 id="responsable">1. Responsable del Tratamiento</h2>
          <p>
            El responsable del tratamiento de tus datos personales es:
          </p>
          <ul>
            <li><strong>Nombre:</strong> Latzu</li>
            <li><strong>Correo electrónico:</strong> <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a></li>
            <li><strong>País de operación:</strong> República de Colombia</li>
          </ul>
          <p>
            Para cualquier consulta relacionada con el tratamiento de tus datos personales, puedes contactarnos directamente en la dirección de correo indicada.
          </p>

          {/* 2 */}
          <h2 id="datos">2. Datos que Recopilamos</h2>
          <h3>2.1 Datos que nos proporcionas directamente</h3>
          <ul>
            <li><strong>Registro:</strong> nombre, dirección de correo electrónico y contraseña (almacenada con hash bcrypt).</li>
            <li><strong>Google OAuth:</strong> nombre, email, foto de perfil e identificador de Google, cuando eliges registrarte con Google.</li>
            <li><strong>Onboarding:</strong> tipo de perfil (estudiante/aprendiz), institución educativa, carrera, semestre, nivel de experiencia, estilo de aprendizaje, intereses, metas y número de teléfono celular (opcional, para la integración con WhatsApp).</li>
            <li><strong>Contenido generado:</strong> mensajes del chat, notas, planes de estudio, tareas, documentos y cualquier otro contenido que crees dentro de la plataforma.</li>
          </ul>
          <h3>2.2 Datos recopilados automáticamente</h3>
          <ul>
            <li><strong>Datos de uso:</strong> páginas visitadas, funciones utilizadas, frecuencia de sesiones y duración de la actividad.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, identificadores de sesión.</li>
            <li><strong>Cookies y almacenamiento local:</strong> para mantener tu sesión activa y guardar preferencias. Ver sección 9.</li>
          </ul>
          <h3>2.3 Datos que NO recopilamos</h3>
          <p>
            No recopilamos datos de tarjetas de crédito ni información de pago directamente (procesados por terceros). No accedemos a tu micrófono, cámara ni archivos locales sin tu consentimiento explícito en cada ocasión.
          </p>

          {/* 3 */}
          <h2 id="uso">3. Cómo Usamos tus Datos</h2>
          <ul>
            <li><strong>Prestación del servicio:</strong> operar la plataforma, procesar tus mensajes, generar respuestas de IA, almacenar tu historial de aprendizaje y mostrar tu contenido.</li>
            <li><strong>Personalización:</strong> adaptar el tutor de IA, las recomendaciones y los planes de estudio a tu perfil, estilo de aprendizaje y metas.</li>
            <li><strong>Memoria adaptativa:</strong> construir y actualizar tu perfil de aprendizaje a lo largo del tiempo para mejorar progresivamente la calidad de las respuestas.</li>
            <li><strong>WhatsApp:</strong> si proporcionas tu número de teléfono, usarlo para permitirte chatear con el tutor de IA directamente desde WhatsApp Business.</li>
            <li><strong>Comunicaciones:</strong> enviarte notificaciones transaccionales relacionadas con tu cuenta (cambios de contraseña, alertas de seguridad).</li>
            <li><strong>Mejora del servicio:</strong> analizar patrones de uso agregados y anónimos para mejorar las funciones de la plataforma.</li>
            <li><strong>Seguridad:</strong> detectar y prevenir fraude, abuso o acceso no autorizado.</li>
            <li><strong>Cumplimiento legal:</strong> responder a requerimientos de autoridades competentes cuando sea legalmente obligatorio.</li>
          </ul>

          {/* 4 */}
          <h2 id="base-legal">4. Base Legal del Tratamiento</h2>
          <p>
            Tratamos tus datos personales bajo las siguientes bases legales, de conformidad con la <strong>Ley 1581 de 2012</strong> (Colombia) y el <strong>Reglamento General de Protección de Datos (GDPR)</strong> para usuarios en el Espacio Económico Europeo:
          </p>
          <ul>
            <li><strong>Ejecución del contrato:</strong> para prestarte el servicio que solicitas al crear tu cuenta.</li>
            <li><strong>Consentimiento:</strong> para funciones opcionales como la integración con WhatsApp o el envío de comunicaciones de marketing. Puedes revocar tu consentimiento en cualquier momento.</li>
            <li><strong>Interés legítimo:</strong> para mejorar la seguridad de la plataforma y analizar el uso del servicio de forma agregada.</li>
            <li><strong>Obligación legal:</strong> cuando sea requerido por la ley aplicable.</li>
          </ul>

          {/* 5 */}
          <h2 id="terceros">5. Compartición con Terceros</h2>
          <p>
            <strong>No vendemos tus datos personales.</strong> Compartimos información únicamente con los siguientes proveedores de servicios necesarios para la operación de la plataforma:
          </p>
          <ul>
            <li><strong>Google Cloud Platform / Google AI (Gemini):</strong> infraestructura de cómputo y procesamiento de inteligencia artificial. Los mensajes del chat son enviados a la API de Gemini para generar respuestas. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Google</a>.</li>
            <li><strong>Google Cloud Run:</strong> alojamiento del servidor de la aplicación.</li>
            <li><strong>Neo4j Aura:</strong> base de datos en la nube para almacenar tu información y contenido. <a href="https://neo4j.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Política de Neo4j</a>.</li>
            <li><strong>Meta Platforms (WhatsApp Business API):</strong> únicamente si activas la integración de WhatsApp y nos proporcionas tu número de teléfono. Tus mensajes de WhatsApp son procesados por la API de Meta. <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de WhatsApp</a>.</li>
            <li><strong>Google Sign-In (OAuth):</strong> si te registras con Google, compartimos datos mínimos con Google para verificar tu identidad.</li>
          </ul>
          <p>
            Todos nuestros proveedores están obligados contractualmente a proteger tus datos y a usarlos únicamente para los fines especificados.
          </p>

          {/* 6 */}
          <h2 id="whatsapp">6. Integración con WhatsApp Business</h2>
          <p>
            Si eliges conectar tu cuenta de Latzu con WhatsApp proporcionando tu número de teléfono:
          </p>
          <ul>
            <li>Tus mensajes enviados a través de WhatsApp serán procesados por nuestro tutor de IA para generar respuestas.</li>
            <li>El historial de conversaciones de WhatsApp se almacena en nuestra base de datos, separado de tus conversaciones en la plataforma web.</li>
            <li>Tu número de teléfono es asociado a tu cuenta de Latzu para identificarte cuando escribes desde WhatsApp.</li>
            <li>Puedes desconectar WhatsApp en cualquier momento desde la configuración de tu cuenta o solicitando la eliminación de tu número de teléfono a <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a>.</li>
            <li>Los mensajes están sujetos adicionalmente a la <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de Privacidad de WhatsApp/Meta</a>.</li>
          </ul>

          {/* 7 */}
          <h2 id="retencion">7. Retención de Datos</h2>
          <ul>
            <li><strong>Datos de cuenta:</strong> conservados mientras tu cuenta esté activa. Si eliminas tu cuenta, eliminamos tus datos dentro de los 30 días siguientes, salvo obligación legal de retención.</li>
            <li><strong>Historial de chat:</strong> conservado para mantener el contexto de aprendizaje. Puedes eliminar sesiones individuales desde la plataforma.</li>
            <li><strong>Datos de uso técnico:</strong> conservados por un máximo de 12 meses para análisis de seguridad.</li>
            <li><strong>Copias de seguridad:</strong> pueden persistir hasta 90 días adicionales en sistemas de backup encriptados.</li>
          </ul>

          {/* 8 */}
          <h2 id="derechos">8. Tus Derechos</h2>
          <p>
            De conformidad con la Ley 1581 de 2012 de Colombia y el GDPR (para usuarios del EEE), tienes derecho a:
          </p>
          <ul>
            <li><strong>Acceso:</strong> solicitar una copia de los datos personales que tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de tus datos personales. Ver nuestra <Link href="/eliminar-datos">página de solicitud de eliminación</Link>.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
            <li><strong>Limitación:</strong> solicitar que restrinjamos el tratamiento de tus datos.</li>
            <li><strong>Revocación del consentimiento:</strong> retirar el consentimiento otorgado en cualquier momento, sin que ello afecte la licitud del tratamiento anterior.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a> indicando tu solicitud. Responderemos dentro de los 15 días hábiles siguientes.
          </p>

          {/* 9 */}
          <h2 id="cookies">9. Cookies y Tecnologías de Seguimiento</h2>
          <p>
            Utilizamos las siguientes tecnologías de almacenamiento:
          </p>
          <ul>
            <li><strong>Cookies de sesión (NextAuth):</strong> necesarias para mantener tu sesión autenticada. Sin estas cookies, no puedes iniciar sesión. No requieren consentimiento por ser técnicamente esenciales.</li>
            <li><strong>Almacenamiento local (localStorage):</strong> guardamos preferencias de la interfaz (tema oscuro/claro, estado del chat) localmente en tu navegador.</li>
            <li><strong>Almacenamiento de sesión (sessionStorage):</strong> datos temporales de la sesión actual, como el estado del onboarding.</li>
          </ul>
          <p>
            No utilizamos cookies de seguimiento publicitario ni compartimos datos de cookies con plataformas de publicidad.
          </p>

          {/* 10 */}
          <h2 id="seguridad">10. Seguridad</h2>
          <p>
            Implementamos las siguientes medidas de seguridad para proteger tus datos:
          </p>
          <ul>
            <li>Transmisión de datos cifrada mediante TLS/HTTPS.</li>
            <li>Contraseñas almacenadas con hash bcrypt (12 rondas), nunca en texto plano.</li>
            <li>Autenticación mediante tokens JWT de corta duración.</li>
            <li>Acceso a la base de datos restringido mediante credenciales y redes privadas.</li>
            <li>Auditorías periódicas de seguridad del código.</li>
          </ul>
          <p>
            Aunque implementamos medidas razonables, ningún sistema es 100% seguro. En caso de detectar una brecha de seguridad que afecte tus datos, te notificaremos en el menor tiempo posible conforme a la ley aplicable.
          </p>

          {/* 11 */}
          <h2 id="menores">11. Menores de Edad</h2>
          <p>
            Latzu está diseñado para usuarios mayores de 13 años. No recopilamos intencionalmente datos de niños menores de 13 años. Si eres padre/madre o tutor y crees que tu hijo menor de 13 años ha creado una cuenta, contáctanos en <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a> para eliminar la cuenta y los datos asociados.
          </p>
          <p>
            Para usuarios entre 13 y 17 años en Colombia, el tratamiento de datos requiere autorización del padre, madre o representante legal, de conformidad con la Ley 1581 de 2012.
          </p>

          {/* 12 */}
          <h2 id="cambios">12. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o en la legislación aplicable. Cuando realicemos cambios materiales, te notificaremos mediante:
          </p>
          <ul>
            <li>Un aviso visible en la plataforma antes de que los cambios entren en vigencia, o</li>
            <li>Un correo electrónico a la dirección asociada a tu cuenta.</li>
          </ul>
          <p>
            El uso continuado de la plataforma después de la fecha de vigencia de la política actualizada constituye tu aceptación de los cambios.
          </p>

          {/* 13 */}
          <h2 id="contacto">13. Contacto</h2>
          <p>
            Para cualquier pregunta, ejercicio de derechos o reporte de problemas relacionados con la privacidad de tus datos:
          </p>
          <ul>
            <li><strong>Correo electrónico:</strong> <a href="mailto:latzuapp@gmail.com">latzuapp@gmail.com</a></li>
            <li><strong>Solicitud de eliminación de datos:</strong> <Link href="/eliminar-datos">Formulario de eliminación</Link></li>
          </ul>
          <p>
            También puedes presentar una reclamación ante la <strong>Superintendencia de Industria y Comercio (SIC)</strong> de Colombia, autoridad de protección de datos personales del país.
          </p>
        </article>
      </div>
    </div>
  );
}
