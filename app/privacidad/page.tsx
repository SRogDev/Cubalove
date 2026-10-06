import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export const metadata = {
  title: "Política de Privacidad — Cubalove",
  description: "Política de privacidad y protección de datos de Cubalove",
};

export default function PrivacidadPage() {
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
          <h1 className="font-display text-3xl font-bold">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: 12 de febrero de 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1">

          <p>
            En <strong>Cubalove</strong> nos tomamos tu privacidad en serio. Esta
            Política de Privacidad explica qué información recopilamos, cómo la usamos,
            con quién la compartimos y qué derechos tienes sobre tus datos. Léela
            tranquilamente — queremos que sepas exactamente cómo manejamos tu información.
          </p>

          <h2>1. Información que Recopilamos</h2>

          <h3>1.1 Información que nos proporcionas directamente</h3>
          <ul>
            <li>
              <strong>Datos de registro:</strong> nombre, correo electrónico y foto de
              perfil obtenidos a través de tu cuenta de Google al registrarte.
            </li>
            <li>
              <strong>Perfil:</strong> nombre para mostrar, fecha de nacimiento, género,
              preferencias de búsqueda, biografía, trabajo/estudio, intereses y número
              de teléfono (opcional).
            </li>
            <li>
              <strong>Fotos:</strong> las imágenes que subes a tu perfil (hasta 6).
            </li>
            <li>
              <strong>Prompts:</strong> tus respuestas a las preguntas de perfil.
            </li>
            <li>
              <strong>Ubicación:</strong> tu municipio y provincia para mostrarte
              perfiles cercanos.
            </li>
          </ul>

          <h3>1.2 Información generada por tu uso</h3>
          <ul>
            <li>
              <strong>Actividad de swipes:</strong> registramos tus likes, nopes y super
              likes para el funcionamiento del sistema de matching.
            </li>
            <li>
              <strong>Matches:</strong> almacenamos la información de tus matches para
              facilitar la conexión con otros usuarios.
            </li>
            <li>
              <strong>Interacciones:</strong> tu actividad en la sección de Chismes
              (vistas, likes, compartidos).
            </li>
            <li>
              <strong>Datos de uso:</strong> estadísticas generales de cómo usas la
              plataforma para mejorar el servicio.
            </li>
          </ul>

          <h3>1.3 Información de pagos</h3>
          <p>
            Si adquieres una suscripción, los datos de pago son procesados directamente
            por <strong>Stripe</strong>. Cubalove no almacena números de tarjeta ni
            datos financieros sensibles. Solo guardamos un identificador de referencia
            del pago, el monto y el estado de la transacción para tu historial.
          </p>

          <h2>2. Cómo Usamos tu Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Crear y mantener tu cuenta y perfil.</li>
            <li>
              Mostrarte perfiles relevantes según tus preferencias y ubicación.
            </li>
            <li>
              Gestionar el sistema de matches y facilitar conexiones entre usuarios.
            </li>
            <li>Procesar pagos y gestionar suscripciones.</li>
            <li>
              Generar estadísticas anónimas y agregadas sobre la comunidad (contenido de
              Chismes).
            </li>
            <li>Moderar contenido y mantener la seguridad de la plataforma.</li>
            <li>Mejorar y desarrollar nuevas funcionalidades.</li>
            <li>
              Comunicarte cambios importantes sobre el servicio o tus términos.
            </li>
          </ul>

          <h2>3. Con Quién Compartimos tu Información</h2>
          <p>
            Tu información personal no se vende a terceros. Solo compartimos datos en
            los siguientes casos:
          </p>
          <ul>
            <li>
              <strong>Google:</strong> para autenticación de tu cuenta (OAuth). Solo
              recibimos nombre, email y foto de perfil de Google.
            </li>
            <li>
              <strong>Stripe:</strong> procesador de pagos para suscripciones en USD.
              Stripe maneja los datos financieros bajo su propia política de privacidad.
            </li>
            <li>
              <strong>Cloudflare:</strong> para la distribución de contenido (CDN),
              protección de seguridad y optimización de imágenes. Cloudflare puede
              procesar datos técnicos de las solicitudes.
            </li>
            <li>
              <strong>Otros usuarios:</strong> la información de tu perfil público
              (nombre, fotos, bio, intereses, ubicación general) es visible para otros
              usuarios de la plataforma como parte del servicio.
            </li>
            <li>
              <strong>Autoridades:</strong> si la ley lo requiere o es necesario para
              proteger nuestros derechos, la seguridad de los usuarios o terceros.
            </li>
          </ul>

          <h2>4. Almacenamiento y Seguridad</h2>
          <ul>
            <li>
              Tus datos se almacenan en servidores seguros con cifrado en tránsito
              (HTTPS/TLS) y políticas de acceso restrictivas.
            </li>
            <li>
              Las fotos se almacenan en un servicio de almacenamiento seguro compatible
              con S3, distribuido a través de CDN para optimizar la velocidad de carga.
            </li>
            <li>
              Implementamos Row Level Security (RLS) en nuestra base de datos para que
              cada usuario solo pueda acceder a sus propios datos sensibles.
            </li>
            <li>
              A pesar de nuestras medidas de seguridad, ningún sistema es 100% seguro.
              Haz tu parte protegiendo el acceso a tu cuenta de Google.
            </li>
          </ul>

          <h2>5. Tus Derechos</h2>
          <p>Como usuario de Cubalove, tienes derecho a:</p>
          <ul>
            <li>
              <strong>Acceder</strong> a la información personal que tenemos sobre ti.
            </li>
            <li>
              <strong>Rectificar</strong> información incorrecta o desactualizada en tu
              perfil.
            </li>
            <li>
              <strong>Eliminar</strong> tu cuenta y todos tus datos personales. Al
              solicitar la eliminación, se borrarán tus datos personales, fotos, matches
              y actividad. Retenemos datos financieros de pagos por obligaciones
              fiscales y contables.
            </li>
            <li>
              <strong>Exportar</strong> tus datos personales en un formato legible.
            </li>
          </ul>
          <p>
            Para ejercer estos derechos, contáctanos a través de nuestros canales
            oficiales o escríbenos a <strong>cubalove@datingcuba.com</strong>.
          </p>

          <h2>6. Cookies y Tecnologías Similares</h2>
          <p>
            Cubalove utiliza cookies estrictamente necesarias para el funcionamiento
            de la plataforma:
          </p>
          <ul>
            <li>
              <strong>Cookies de autenticación:</strong> para mantener tu sesión activa
              de forma segura (gestionadas por Supabase Auth).
            </li>
            <li>
              <strong>Preferencias:</strong> como el modo claro/oscuro de la interfaz.
            </li>
          </ul>
          <p>
            No utilizamos cookies de seguimiento publicitario ni de terceros para
            publicidad.
          </p>

          <h2>7. Retención de Datos</h2>
          <ul>
            <li>
              Tus datos de perfil se mantienen mientras tu cuenta esté activa.
            </li>
            <li>
              Al eliminar tu cuenta, borramos tus datos personales de forma permanente.
            </li>
            <li>
              Los datos financieros (historial de pagos) se retienen por el período
              legalmente requerido para cumplimiento fiscal.
            </li>
            <li>
              Los datos anonimizados y agregados (estadísticas generales) pueden
              retenerse indefinidamente ya que no identifican a ningún usuario.
            </li>
          </ul>

          <h2>8. Menores de Edad</h2>
          <p>
            Cubalove no está dirigido a menores de 18 años y no recopilamos
            conscientemente información de menores. Si descubrimos que un menor ha
            creado una cuenta, la eliminaremos inmediatamente junto con toda su
            información. Si conoces a un menor usando la plataforma, repórtalo
            inmediatamente.
          </p>

          <h2>9. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente.{" "}
            <strong>
              Cualquier cambio será notificado a los usuarios de forma inmediata
            </strong>{" "}
            a través de la Plataforma. Te recomendamos revisar esta página
            ocasionalmente. La fecha de última actualización aparece al inicio del
            documento.
          </p>

          <h2>10. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta Política de Privacidad o sobre cómo manejamos
            tus datos, puedes contactarnos:
          </p>
          <ul>
            <li>
              Email: <strong>cubalove@datingcuba.com</strong>
            </li>
            <li>A través de nuestros canales oficiales en Instagram y Telegram.</li>
          </ul>

          {/* Footer links */}
          <div className="border-t border-border/50 pt-6 mt-8 flex gap-4 text-sm">
            <Link href="/terminos" className="text-primary hover:underline">
              Términos de Uso
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
