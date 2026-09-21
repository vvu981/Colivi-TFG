import type { CookieCategoryDefinition } from '../types/cookieTypes';

export const COOKIE_DEFINITIONS: CookieCategoryDefinition[] = [
  {
    id: 'necessary',
    name: 'Cookies Técnicas y Estrictamente Necesarias',
    description:
      'Son imprescindibles para el funcionamiento técnico de la plataforma, la gestión de la sesión autenticada mediante tokens JWT, la prevención de ataques CSRF y el registro seguro de tus propias preferencias de privacidad. No pueden desactivarse.',
    required: true,
    cookies: [
      {
        name: 'colivi_auth_token',
        provider: 'Colivi (Propia)',
        purpose: 'Autenticación y mantenimiento de la sesión activa del usuario registrado.',
        duration: 'Sesión / 7 días',
      },
      {
        name: 'colivi_cookie_consent_v1',
        provider: 'Colivi (Propia)',
        purpose: 'Almacena el estado de consentimiento granular y marca temporal conforme al RGPD.',
        duration: '12 meses',
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Cookies de Rendimiento y Analítica',
    description:
      'Nos permiten cuantificar el número de visitantes, identificar patrones de navegación y medir los tiempos de respuesta del sistema. Todos los datos se recopilan de forma agregada y anónima con el único fin de optimizar el rendimiento y la usabilidad de Colivi.',
    required: false,
    cookies: [
      {
        name: '_colivi_analytics_session',
        provider: 'Colivi / Analítica de Rendimiento',
        purpose: 'Medición anónima de tráfico, tiempos de carga e interacción con las funcionalidades.',
        duration: '13 meses',
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Cookies de Publicidad y Personalización',
    description:
      'Se utilizan para ofrecer contenidos relevantes y adaptados al perfil del usuario, así como para evaluar la eficacia de campañas divulgativas del servicio. Si no las aceptas, no verás recomendaciones personalizadas basadas en tu historial de navegación.',
    required: false,
    cookies: [
      {
        name: '_colivi_mkt_pref',
        provider: 'Colivi / Redes Colaboradoras',
        purpose: 'Personalización de recomendaciones de alojamientos y seguimiento de campañas.',
        duration: '6 meses',
      },
    ],
  },
];
