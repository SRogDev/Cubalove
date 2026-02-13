import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export const metadata = {
  title: "Términos de Uso — Empatando",
  description: "Términos y condiciones de uso de Empatando",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
          <h1 className="font-display text-3xl font-bold">Términos de Uso</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: 12 de febrero de 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1">

          <p>
            Bienvenido/a a <strong>Empatando</strong> (en lo adelante, &ldquo;la
            Plataforma&rdquo;, &ldquo;la App&rdquo; o &ldquo;nosotros&rdquo;). Al acceder
            y utilizar Empatando, aceptas estos Términos de Uso en su totalidad. Si no
            estás de acuerdo con alguno de estos términos, por favor no utilices la
            Plataforma.
          </p>
          <p>
            Dale una lectura tranquila, que aunque suena formal, es importante que sepas
            cómo funcionan las reglas del juego.
          </p>

          <h2>1. Descripción del Servicio</h2>
          <p>
            Empatando es una plataforma de citas en línea que permite a personas mayores
            de edad conectar con otros usuarios en Cuba y más allá. Ofrecemos funciones de
            descubrimiento de perfiles, matches mutuos, comunicación entre usuarios, y
            contenido comunitario (&ldquo;Chismes&rdquo;).
          </p>

          <h2>2. Requisito de Edad</h2>
          <p>
            Para utilizar Empatando <strong>debes tener 18 años o más</strong>. Al
            crear tu cuenta, declaras y garantizas que tienes al menos 18 años de edad.
          </p>
          <p>
            <strong>Descargo de responsabilidad:</strong> Empatando no se hace
            responsable por usuarios que declaren falsamente ser mayores de edad. Si un
            menor de 18 años accede a la plataforma proporcionando información falsa
            sobre su edad, dicho usuario estará violando directamente estos Términos de
            Uso y las leyes aplicables. Empatando se reserva el derecho de eliminar
            inmediatamente cualquier cuenta que se determine pertenece a un menor de
            edad, sin previo aviso ni derecho a reclamo.
          </p>
          <p>
            Si tienes conocimiento de que un menor de edad está utilizando la plataforma,
            te pedimos que nos lo reportes de inmediato a través del sistema de reportes de
            la App o contactándonos directamente.
          </p>

          <h2>3. Registro y Cuenta</h2>
          <ul>
            <li>
              El registro se realiza exclusivamente mediante autenticación con Google.
            </li>
            <li>
              Eres responsable de mantener la seguridad de tu cuenta de Google y, por
              extensión, de tu cuenta en Empatando.
            </li>
            <li>
              La información de perfil que proporciones debe ser veraz y actualizada. No
              se permiten perfiles falsos, suplantación de identidad ni información
              engañosa.
            </li>
            <li>
              Solo se permite una cuenta por persona.
            </li>
          </ul>

          <h2>4. Recopilación y Uso de Información</h2>
          <p>
            Al utilizar Empatando, aceptas que recopilamos y almacenamos la siguiente
            información para el funcionamiento de la Plataforma:
          </p>
          <ul>
            <li>
              <strong>Datos de perfil:</strong> nombre, fecha de nacimiento, género,
              preferencias, fotos, biografía, intereses y ubicación.
            </li>
            <li>
              <strong>Datos de actividad:</strong> swipes realizados, matches generados,
              interacciones con contenido y estadísticas de uso.
            </li>
            <li>
              <strong>Datos de matches:</strong> almacenamos información sobre tus
              matches para facilitar la conexión entre usuarios, incluyendo historial de
              conversaciones cuando aplique.
            </li>
            <li>
              <strong>Datos de pago:</strong> información necesaria para procesar
              suscripciones a través de Stripe u otros métodos de pago ofrecidos.
            </li>
          </ul>
          <p>
            Al usar la Plataforma, <strong>aceptas expresamente</strong> esta
            recopilación de información, la cual es necesaria para brindarte el servicio.
            Para más detalles, consulta nuestra{" "}
            <Link href="/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>.
          </p>

          <h2>5. Conducta del Usuario</h2>
          <p>Al utilizar Empatando te comprometes a:</p>
          <ul>
            <li>Tratar a otros usuarios con respeto y dignidad.</li>
            <li>No publicar contenido ofensivo, obsceno, violento o ilegal.</li>
            <li>No acosar, amenazar ni intimidar a otros usuarios.</li>
            <li>No enviar spam, publicidad no autorizada ni contenido comercial.</li>
            <li>
              No utilizar la plataforma para actividades fraudulentas o ilegales.
            </li>
            <li>
              No subir fotos que no sean tuyas, contengan desnudos explícitos no
              solicitados, o violen derechos de terceros.
            </li>
          </ul>

          <h2>6. Moderación y Sanciones</h2>
          <p>
            Empatando se reserva el derecho de moderar el contenido y la conducta de
            los usuarios. Las sanciones incluyen:
          </p>
          <ul>
            <li>
              <strong>Suspensión temporal (3 días):</strong> por infracciones menores
              como fotos inapropiadas o comportamiento indebido reportado por otros
              usuarios.
            </li>
            <li>
              <strong>Bloqueo permanente:</strong> por infracciones graves, reincidencia
              en comportamientos sancionados, o violaciones severas de estos términos.
            </li>
          </ul>
          <p>
            Las decisiones de moderación son tomadas por el equipo de administración y son
            definitivas. Los usuarios bloqueados permanentemente no podrán crear nuevas
            cuentas.
          </p>

          <h2>7. Suscripciones y Pagos</h2>
          <ul>
            <li>
              Empatando ofrece planes de suscripción opcionales (Plus y VIP) que
              desbloquean funcionalidades adicionales.
            </li>
            <li>
              Los pagos en USD se procesan de forma segura a través de Stripe.
            </li>
            <li>
              También ofrecemos la opción de pago en CUP mediante proceso manual.
            </li>
            <li>
              Las suscripciones se renuevan automáticamente a menos que se cancelen antes
              del fin del período actual (aplica solo para pagos con Stripe).
            </li>
            <li>
              Nos reservamos el derecho de modificar los precios con previo aviso a los
              usuarios.
            </li>
          </ul>

          <h2>8. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de Empatando (diseño, código, marca, logotipos, textos)
            es propiedad de Empatando o sus licenciantes. Los usuarios conservan los
            derechos sobre el contenido que suben (fotos, textos de perfil), pero otorgan
            a Empatando una licencia no exclusiva para mostrar dicho contenido dentro de
            la Plataforma.
          </p>

          <h2>9. Limitación de Responsabilidad</h2>
          <ul>
            <li>
              Empatando no garantiza resultados específicos en el uso de la plataforma
              (matches, relaciones, etc.).
            </li>
            <li>
              No nos hacemos responsables por la conducta de los usuarios fuera de la
              plataforma, incluyendo encuentros presenciales.
            </li>
            <li>
              La plataforma se ofrece &ldquo;tal cual&rdquo; y &ldquo;según
              disponibilidad&rdquo;.
            </li>
            <li>
              Empatando no garantiza disponibilidad ininterrumpida del servicio,
              especialmente considerando las condiciones de conectividad en Cuba.
            </li>
          </ul>

          <h2>10. Modificaciones a estos Términos</h2>
          <p>
            Empatando puede actualizar estos Términos de Uso en cualquier momento.
            <strong>
              {" "}Cualquier cambio será notificado a todos los usuarios de forma
              inmediata
            </strong>{" "}
            a través de la Plataforma y/o por los canales de comunicación disponibles.
            El uso continuado de la App después de la notificación constituye aceptación
            de los nuevos términos.
          </p>

          <h2>11. Terminación</h2>
          <p>
            Puedes dejar de usar Empatando en cualquier momento. También puedes
            solicitar la eliminación de tu cuenta, lo cual resultará en la eliminación de
            tus datos personales conforme a nuestra Política de Privacidad.
          </p>
          <p>
            Empatando se reserva el derecho de suspender o terminar tu acceso a la
            Plataforma si determina que has violado estos Términos de Uso.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Si tienes preguntas o inquietudes sobre estos Términos de Uso, puedes
            contactarnos a través de nuestros canales oficiales en Instagram o Telegram,
            o escribirnos a{" "}
            <strong>empatando@datingcuba.com</strong>.
          </p>

          {/* Footer links */}
          <div className="border-t border-border/50 pt-6 mt-8 flex gap-4 text-sm">
            <Link href="/privacidad" className="text-primary hover:underline">
              Política de Privacidad
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
