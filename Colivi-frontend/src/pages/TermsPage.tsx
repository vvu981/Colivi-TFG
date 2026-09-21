import React from 'react';
import { FileText, ShieldAlert, Scale, UserCheck, AlertTriangle, Copyright, Ban, RefreshCw } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';

export const TermsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-margin-desktop py-8 sm:py-12 flex flex-col gap-8">
        {/* Encabezado */}
        <div className="space-y-3 border-b border-outline-variant/60 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <FileText size={14} />
            <span>Documento Legal Oficial</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Última actualización: 21 de septiembre de 2026. Versión 1.0. Aplicable a todos los usuarios de Colivi.
          </p>
        </div>

        {/* Resumen ejecutivo para el usuario */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale size={20} />
          </div>
          <div className="text-xs sm:text-sm text-secondary leading-relaxed">
            <p className="font-semibold text-on-surface mb-0.5">Resumen de Compromiso y Transparencia</p>
            Colivi es una plataforma tecnológica que facilita la búsqueda de compañeros y la gestión colaborativa de
            viviendas en coliving. <strong>Colivi no actúa como agencia inmobiliaria ni arrendador directo</strong>, y los
            usuarios son responsables de la veracidad de los anuncios y de los acuerdos de convivencia pactados entre sí.
          </div>
        </div>

        {/* Índice de Secciones */}
        <nav aria-label="Índice de términos" className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs">
          <span className="font-bold text-on-surface block mb-2">Contenido de las Condiciones:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-secondary">
            <a href="#objeto" className="hover:text-primary hover:underline">1. Objeto y Naturaleza del Servicio</a>
            <a href="#capacidad" className="hover:text-primary hover:underline">2. Capacidad y Registro de Cuenta</a>
            <a href="#responsabilidad" className="hover:text-primary hover:underline">3. Limitación de Responsabilidad</a>
            <a href="#conducta" className="hover:text-primary hover:underline">4. Uso Aceptable y Normas Comunitarias</a>
            <a href="#propiedad" className="hover:text-primary hover:underline">5. Propiedad Intelectual y Licencias</a>
            <a href="#suspension" className="hover:text-primary hover:underline">6. Suspensión y Rescisión</a>
            <a href="#modificaciones" className="hover:text-primary hover:underline">7. Modificación de los Términos</a>
            <a href="#jurisdiccion" className="hover:text-primary hover:underline">8. Legislación y Fuero Judicial</a>
          </div>
        </nav>

        {/* Articulado Legal */}
        <article className="space-y-8 text-sm text-secondary leading-relaxed">
          {/* Sección 1 */}
          <section id="objeto" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Scale size={18} className="text-primary" />
              <h2 className="text-lg font-bold">1. Objeto y Naturaleza del Servicio</h2>
            </div>
            <p>
              Las presentes Condiciones de Uso regulan el acceso y utilización del sitio web y aplicaciones móviles de{' '}
              <strong>Colivi</strong> (en adelante, la "Plataforma"). La Plataforma constituye un entorno digital diseñado
              para poner en contacto a personas que buscan compartir vivienda en régimen de coliving, facilitando
              herramientas de búsqueda, mensajería interna, asignación de tareas domésticas y cálculo de balances de gastos
              comunes.
            </p>
            <p>
              <strong>Delimitación de la intermediación:</strong> Colivi actúa exclusivamente como prestador de servicios de la
              sociedad de la información al amparo de la Ley 34/2002 (LSSI-CE). Colivi no es agencia inmobiliaria, entidad
              financiera ni parte contratante en los contratos de arrendamiento o pactos de convivencia que los usuarios
              formalicen entre sí. La formalización jurídica del alquiler corresponde de forma exclusiva a propietarios,
              arrendadores e inquilinos.
            </p>
          </section>

          {/* Sección 2 */}
          <section id="capacidad" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <UserCheck size={18} className="text-primary" />
              <h2 className="text-lg font-bold">2. Capacidad Legal y Registro de Cuenta</h2>
            </div>
            <p>
              Para crear una cuenta en Colivi, el usuario debe tener al menos dieciocho (18) años de edad y plena capacidad
              de obrar. El usuario garantiza que todos los datos facilitados durante el proceso de registro y en su perfil
              público son veraces, exactos, completos y actualizados.
            </p>
            <p>
              El usuario es el único responsable de preservar la confidencialidad de sus credenciales de acceso (email y
              contraseña) y de cualquier actividad llevada a cabo desde su cuenta. En caso de sospecha razonable de uso no
              autorizado o quiebra de seguridad, deberá notificarse de forma inmediata a través del correo{' '}
              <a href="mailto:soporte@colivi.es" className="text-primary hover:underline font-semibold">
                soporte@colivi.es
              </a>
              .
            </p>
          </section>

          {/* Sección 3 */}
          <section id="responsabilidad" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <ShieldAlert size={18} className="text-primary" />
              <h2 className="text-lg font-bold">3. Limitación y Exoneración de Responsabilidad</h2>
            </div>
            <p>
              Con el máximo alcance permitido por la legislación aplicable:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Veracidad de los Anuncios:</strong> Colivi no garantiza la veracidad, exactitud, salubridad,
                condiciones higiénicas, habitabilidad o titularidad legal de los inmuebles publicados por terceros. Cada
                anunciante responde personal y jurídicamente de la legalidad de la oferta.
              </li>
              <li>
                <strong>Convivencia y Relaciones Interpersonales:</strong> Colivi no responde de controversias, impagos, daños
                materiales a la vivienda, incumplimientos de normas de convivencia o conductas ilícitas cometidas por los
                compañeros de piso.
              </li>
              <li>
                <strong>Disponibilidad Técnica:</strong> La Plataforma se suministra "tal cual" (as-is). No se garantiza la
                disponibilidad ininterrumpida del servicio ante operaciones de mantenimiento técnico, incidencias en redes de
                telecomunicaciones ajenas o supuestos de fuerza mayor.
              </li>
            </ul>
          </section>

          {/* Sección 4 */}
          <section id="conducta" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Ban size={18} className="text-primary" />
              <h2 className="text-lg font-bold">4. Uso Aceptable y Normas de la Comunidad</h2>
            </div>
            <p>
              El usuario se compromete a hacer un uso diligente y de buena fe de la Plataforma. Quedan terminantemente
              prohibidas las siguientes conductas:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Discriminación:</strong> Publicar anuncios o mensajes con criterios discriminatorios por motivos de
                raza, nacionalidad, etnia, sexo, identidad de género, orientación sexual, religión, discapacidad o estado de
                salud.
              </li>
              <li>
                <strong>Fraude y Suplantación:</strong> Exigir pagos por adelantado sin visita previa o mediante métodos de
                pago opacos no trazables, así como suplantar la identidad de propietarios o inquilinos.
              </li>
              <li>
                <strong>Subarriendos Ilícitos:</strong> Ofrecer habitaciones o inmuebles careciendo del consentimiento expreso y
                por escrito del propietario o vulnerando la Ley de Arrendamientos Urbanos (LAU).
              </li>
              <li>
                <strong>Abuso Tecnológico:</strong> Emplear bots, spiders, scrapers o métodos automáticos no autorizados para
                extraer contenidos o datos personales de otros usuarios.
              </li>
            </ul>
          </section>

          {/* Sección 5 */}
          <section id="propiedad" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Copyright size={18} className="text-primary" />
              <h2 className="text-lg font-bold">5. Propiedad Intelectual y Licencia sobre Contenidos</h2>
            </div>
            <p>
              Todos los derechos de propiedad intelectual e industrial sobre el software de Colivi, diseño gráfico, código
              fuente, logotipos, marcas comerciales y estructura de bases de datos son de titularidad exclusiva de Colivi o
              de sus licenciantes legítimos. Queda prohibida su reproducción, descompilación o distribución sin autorización
              previa.
            </p>
            <p>
              <strong>Contenidos aportados por el usuario:</strong> Al subir fotografías, textos descriptivos o valoraciones, el
              usuario otorga a Colivi una licencia no exclusiva, transferible, libre de regalías y para todo el mundo a los
              únicos efectos de alojar, mostrar, promocionar y poner a disposición dichos contenidos dentro de los fines de la
              Plataforma. El usuario declara ostentar la plena titularidad y autorizaciones sobre el material subido.
            </p>
          </section>

          {/* Sección 6 */}
          <section id="suspension" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <AlertTriangle size={18} className="text-primary" />
              <h2 className="text-lg font-bold">6. Suspensión, Bloqueo y Rescisión de Cuenta</h2>
            </div>
            <p>
              Colivi se reserva el derecho de suspender cautelarmente o cancelar definitivamente el acceso a la cuenta de
              cualquier usuario en caso de incumplimiento de las presentes Condiciones, denuncias reiteradas y fundadas de otros
              usuarios, sospecha de estafa o actividad delictiva.
            </p>
            <p>
              Asimismo, el usuario puede cancelar y dar de baja su cuenta en cualquier momento desde su panel de perfil o
              solicitándolo por escrito a{' '}
              <a href="mailto:soporte@colivi.es" className="text-primary hover:underline font-semibold">
                soporte@colivi.es
              </a>
              . Dicha baja no extingue las obligaciones contractuales pendientes que hubiese adquirido privadamente con terceros.
            </p>
          </section>

          {/* Sección 7 */}
          <section id="modificaciones" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <RefreshCw size={18} className="text-primary" />
              <h2 className="text-lg font-bold">7. Modificación de las Condiciones</h2>
            </div>
            <p>
              Colivi se reserva la facultad de actualizar periódicamente las presentes Condiciones para adaptarlas a novedades
              legislativas o mejoras del servicio. Los cambios sustanciales serán comunicados a través de la web o por correo
              electrónico con al menos quince (15) días de antelación. El uso continuado del servicio tras la entrada en vigor
              implicará su conocimiento y conformidad.
            </p>
          </section>

          {/* Sección 8 */}
          <section id="jurisdiccion" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Scale size={18} className="text-primary" />
              <h2 className="text-lg font-bold">8. Legislación Aplicable y Fuero Competente</h2>
            </div>
            <p>
              Las presentes Condiciones se regirán e interpretarán conforme a la legislación común de España. En caso de
              controversia, ambas partes procurarán resolverla de buena fe. Si no fuere posible, las partes se someten a los
              Juzgados y Tribunales que correspondan conforme a la legislación vigente de protección de los consumidores y
              usuarios (Real Decreto Legislativo 1/2007).
            </p>
          </section>
        </article>
      </div>
    </MainLayout>
  );
};
