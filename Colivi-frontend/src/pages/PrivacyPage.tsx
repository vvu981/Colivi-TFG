import React from 'react';
import { ShieldCheck, Lock, Eye, Database, Share2, Clock, UserCheck, Globe } from 'lucide-react';
import { MainLayout } from '../layouts/MainLayout';

export const PrivacyPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-margin-desktop py-8 sm:py-12 flex flex-col gap-8">
        {/* Encabezado */}
        <div className="space-y-3 border-b border-outline-variant/60 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <ShieldCheck size={14} />
            <span>Privacidad y Protección de Datos</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679), LOPDGDD 3/2018 y normativa CCPA/CPRA.
          </p>
        </div>

        {/* Resumen ejecutivo */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lock size={20} />
          </div>
          <div className="text-xs sm:text-sm text-secondary leading-relaxed">
            <p className="font-semibold text-on-surface mb-0.5">Nuestro Compromiso de Privacidad</p>
            En Colivi tus datos pertenecen exclusivamente a ti. Tratamos la información con minimización estricta, jamás
            comercializamos ni vendemos tus datos a terceros con fines publicitarios, y puedes ejercer en cualquier momento
            tus derechos de acceso, rectificación, portabilidad o supresión definitiva (derecho al olvido).
          </div>
        </div>

        {/* Índice */}
        <nav aria-label="Índice de política de privacidad" className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs">
          <span className="font-bold text-on-surface block mb-2">Índice del Documento:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-secondary">
            <a href="#responsable" className="hover:text-primary hover:underline">1. Responsable del Tratamiento y DPO</a>
            <a href="#bases" className="hover:text-primary hover:underline">2. Bases Legales del Tratamiento</a>
            <a href="#categorias" className="hover:text-primary hover:underline">3. Categorías de Datos Recogidos</a>
            <a href="#terceros" className="hover:text-primary hover:underline">4. Encargados y Cesiones a Terceros</a>
            <a href="#conservacion" className="hover:text-primary hover:underline">5. Plazos de Conservación y Bloqueo</a>
            <a href="#derechos" className="hover:text-primary hover:underline">6. Ejercicio de Derechos ARCO/RGPD</a>
            <a href="#seguridad" className="hover:text-primary hover:underline">7. Medidas de Seguridad Técnicas</a>
            <a href="#ccpa" className="hover:text-primary hover:underline">8. Cláusulas de Compatibilidad CCPA/CPRA</a>
          </div>
        </nav>

        {/* Articulado */}
        <article className="space-y-8 text-sm text-secondary leading-relaxed">
          {/* 1. Responsable */}
          <section id="responsable" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <UserCheck size={18} className="text-primary" />
              <h2 className="text-lg font-bold">1. Responsable del Tratamiento y Delegado de Protección de Datos (DPO)</h2>
            </div>
            <p>
              El responsable del tratamiento de los datos personales recabados a través de la Plataforma es{' '}
              <strong>Colivi Platform</strong> (Proyecto Universitario de Fin de Grado), con domicilio fiscal y sede en
              España.
            </p>
            <p>
              Para cualquier cuestión relativa a la gestión de tu privacidad o para contactar con nuestro Delegado de
              Protección de Datos (DPO), dispones del canal oficial habilitado:{' '}
              <a href="mailto:privacy@colivi.es" className="text-primary hover:underline font-semibold">
                privacy@colivi.es
              </a>
              .
            </p>
          </section>

          {/* 2. Bases Legales */}
          <section id="bases" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Eye size={18} className="text-primary" />
              <h2 className="text-lg font-bold">2. Bases Legales del Tratamiento (Art. 6 RGPD)</h2>
            </div>
            <p>Tratamos tus datos personales únicamente cuando concurre alguna de las siguientes bases legitimadoras:</p>
            <div className="space-y-2 pl-2">
              <div className="border-l-2 border-primary pl-3 py-1">
                <span className="font-semibold text-on-surface block">a) Ejecución del Contrato de Servicios:</span>
                Necesario para gestionar el alta de usuario, verificación de cuenta, publicación y búsqueda de alojamientos,
                mensajería interna privada y coordinación de gastos/tareas en hogares compartidos.
              </div>
              <div className="border-l-2 border-primary pl-3 py-1">
                <span className="font-semibold text-on-surface block">b) Interés Legítimo:</span>
                Garantizar la seguridad de la infraestructura, prevenir fraudes, evitar la suplantación de identidad y
                gestionar reportes o expedientes disciplinarios frente a comportamientos ilícitos.
              </div>
              <div className="border-l-2 border-primary pl-3 py-1">
                <span className="font-semibold text-on-surface block">c) Cumplimiento de Obligaciones Legales:</span>
                Atención de requerimientos de autoridades judiciales, tributarias o cuerpos y fuerzas de seguridad del Estado.
              </div>
              <div className="border-l-2 border-primary pl-3 py-1">
                <span className="font-semibold text-on-surface block">d) Consentimiento Expreso:</span>
                Instalación de cookies analíticas o de personalización no técnicas, conforme a tus preferencias configuradas en
                el banner o centro de privacidad.
              </div>
            </div>
          </section>

          {/* 3. Categorías de Datos */}
          <section id="categorias" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Database size={18} className="text-primary" />
              <h2 className="text-lg font-bold">3. Categorías de Datos Recogidos</h2>
            </div>
            <p>
              Aplicamos el principio de minimización de datos (Art. 5.1.c RGPD), solicitando estrictamente los datos
              necesarios para el servicio:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Datos Identificativos y de Contacto:</strong> Nombre, apellidos, dirección de correo electrónico y
                número de teléfono.
              </li>
              <li>
                <strong>Datos de Perfil de Convivencia:</strong> Biografía, preferencias de estilo de vida (horarios, hábitos,
                mascotas), fotografía de perfil y rol (anfitrión o compañero).
              </li>
              <li>
                <strong>Datos del Inmueble:</strong> Dirección, fotografías de las estancias, descripción, precio y normas del
                hogar publicadas voluntariamente por el usuario.
              </li>
              <li>
                <strong>Comunicaciones y Reportes:</strong> Historial de mensajes en el chat de la plataforma y denuncias o
                alegaciones remitidas a través del módulo de moderación.
              </li>
              <li>
                <strong>Datos Técnicos de Navegación:</strong> Dirección IP anonimizada, identificadores de sesión cifrados y
                registros de consentimiento de cookies con timestamp.
              </li>
            </ul>
          </section>

          {/* 4. Terceros y Cesiones */}
          <section id="terceros" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Share2 size={18} className="text-primary" />
              <h2 className="text-lg font-bold">4. Encargados del Tratamiento y Transferencias a Terceros</h2>
            </div>
            <p>
              <strong>Principio de no comercialización:</strong> Colivi no vende, no alquila y no comparte tus datos con
              agencias publicitarias ni data brokers bajo ninguna circunstancia.
            </p>
            <p>
              Para prestar el servicio, contratamos con proveedores tecnológicos que actúan como Encargados del Tratamiento
              (Art. 28 RGPD) bajo estrictos acuerdos de confidencialidad y tratamiento de datos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Proveedores de infraestructura cloud y almacenamiento de base de datos ubicados en la Unión Europea.</li>
              <li>Proveedores de cartografía y geocodificación (Leaflet / OpenStreetMap / CartoDB).</li>
              <li>
                En caso de transferencias internacionales fuera del Espacio Económico Europeo (EEE), se formalizan mediante
                Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea.
              </li>
            </ul>
          </section>

          {/* 5. Plazos de Conservación */}
          <section id="conservacion" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Clock size={18} className="text-primary" />
              <h2 className="text-lg font-bold">5. Plazos de Conservación y Bloqueo de Datos</h2>
            </div>
            <p>
              Tus datos personales se conservarán mientras mantengas activa tu cuenta en Colivi y no solicites su supresión.
            </p>
            <p>
              <strong>Bloqueo de datos tras la baja:</strong> Una vez solicitada la baja o eliminación de la cuenta, tus datos se
              suprimirán de los sistemas operativos activos y permanecerán debidamente bloqueados a disposición exclusiva de
              jueces, tribunales y administraciones competentes durante los plazos legales de prescripción de responsabilidades
              (hasta 5 años conforme al Código Civil y legislación española aplicable). Finalizado dicho periodo, se procederá
              a su destrucción física o anonimización irreversible.
            </p>
          </section>

          {/* 6. Derechos ARCO/RGPD */}
          <section id="derechos" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <ShieldCheck size={18} className="text-primary" />
              <h2 className="text-lg font-bold">6. Ejercicio de Derechos (Acceso, Rectificación, Supresión y otros)</h2>
            </div>
            <p>Como titular de los datos, la normativa te asiste en los siguientes derechos:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Acceso:</strong> Conocer qué datos personales tratamos sobre ti.</li>
              <li><strong>Rectificación:</strong> Corregir información inexacta o desactualizada desde tu perfil o por correo.</li>
              <li><strong>Supresión ("Derecho al olvido"):</strong> Solicitar el borrado íntegro de tus datos de la plataforma.</li>
              <li><strong>Limitación:</strong> Solicitar la restricción del tratamiento en los supuestos previstos por ley.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en un formato estructurado y de uso común (ej. JSON).</li>
              <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos fundado en intereses legítimos.</li>
            </ul>
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50 space-y-2 mt-2">
              <p className="font-semibold text-on-surface">¿Cómo ejercer tus derechos?</p>
              <p>
                Basta con enviar un correo electrónico a{' '}
                <a href="mailto:privacy@colivi.es" className="text-primary hover:underline font-semibold">
                  privacy@colivi.es
                </a>{' '}
                indicando en el asunto "Ejercicio de Derechos RGPD" y adjuntando documento acreditativo de tu identidad. La
                atención es completamente gratuita y se resolverá en un plazo máximo de un (1) mes.
              </p>
              <p className="text-xs text-secondary">
                Si consideras que no hemos satisfecho adecuadamente tu solicitud, tienes derecho a presentar una reclamación
                ante la Agencia Española de Protección de Datos (AEPD) a través de su sede electrónica en{' '}
                <a href="https://www.aepd.es" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">
                  www.aepd.es
                </a>
                .
              </p>
            </div>
          </section>

          {/* 7. Seguridad */}
          <section id="seguridad" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Lock size={18} className="text-primary" />
              <h2 className="text-lg font-bold">7. Medidas Técnicas y Organizativas de Seguridad</h2>
            </div>
            <p>
              Implementamos protocolos de seguridad robustos conformes al Art. 32 RGPD: comunicaciones cifradas mediante
              TLS/HTTPS, hash criptográfico unidireccional de contraseñas (BCrypt), autenticación mediante tokens JWT sin
              exposición de secretos en cliente, control de acceso basado en roles (RBAC) y defensas contra ataques de fuerza
              bruta y Cross-Site Scripting (XSS).
            </p>
          </section>

          {/* 8. CCPA / CPRA */}
          <section id="ccpa" className="space-y-3">
            <div className="flex items-center gap-2 text-on-surface">
              <Globe size={18} className="text-primary" />
              <h2 className="text-lg font-bold">8. Disposiciones Específicas CCPA/CPRA (Residentes en California)</h2>
            </div>
            <p>
              En virtud de la California Consumer Privacy Act (CCPA) y la California Privacy Rights Act (CPRA), los residentes
              de California cuentan con derechos adicionales:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Do Not Sell or Share My Personal Information:</strong> Colivi no vende ("does not sell") ni comparte
                información personal para publicidad conductual entre contextos ("cross-context behavioral advertising") a
                cambio de contraprestación económica o de valor.
              </li>
              <li>
                <strong>No discriminación:</strong> No discriminaremos a ningún usuario por el ejercicio de sus derechos de
                privacidad reconocidos por la legislación de California.
              </li>
            </ul>
          </section>
        </article>
      </div>
    </MainLayout>
  );
};
