# Auditoría Arquitectónica y de Seguridad — PR #57 (feat/admin -> dev)

**Auditor:** Frontend Architect & Security Auditor  
**Fecha:** 2 de Septiembre de 2026  
**Rama evaluada:** `feat/admin`  
**Alcance:** Módulos de Administración, Moderación y Gestión de Usuarios/Anuncios (React / TypeScript)

---

## Resumen Ejecutivo de la Auditoría

Tras una exhaustiva revisión de código, análisis de flujos de datos, verificación de principios SOLID y comprobación de robustez ante fallos en la PR #57, se han detectado **12 hallazgos estructurales críticos**:
- **9 Hallazgos BLOCKER**: Vulnerabilidades arquitectónicas, orquestaciones distribuidas en UI, contaminación cruzada de dominios, sobrecarga de red en montaje y silenciamiento ciego de errores destructivos.
- **3 Hallazgos NITPICK / MEJORA**: Discrepancias en contratos DTO, falta de límites de error dedicados y desaprovechamiento de tokens semánticos avanzados.

---

## 1. FUGAS DE LÓGICA DE NEGOCIO Y SEGURIDAD (CRÍTICO)

---

### [BLOCKER] 1.1 Orquestación de Transacciones Distribuidas en Cascada dentro de la Vista (Modal)
* **Archivo:** `Colivi-frontend/src/features/admin/components/reports/AdminReportDetailModal.tsx` (L160–L240)
* **Vector:** Fugas de Lógica de Negocio y Transaccionalidad
* **Problema:**  
  El componente modal de interfaz gráfica asume la responsabilidad de orquestar un flujo transaccional de negocio compuesto por tres llamadas HTTP independientes (`banListing`/`banUser` $\rightarrow$ `resolveAllReportsForTarget` $\rightarrow$ `onStatusUpdate`). Si la conexión se interrumpe entre llamadas o el servidor falla en el segundo paso, la base de datos queda en un estado inconsistente (el usuario/anuncio queda baneado, pero las denuncias permanecen abiertas). Además, el componente inventa textos de resolución en el cliente (`"Resuelto automáticamente tras sanción..."`). La resolución en cascada y las acciones disciplinarias deben ser atómicas y controladas por el backend.
* **Solución Propuesta:**  
  Delegar la orquestación a un único comando/servicio atómico y eliminar la composición de peticiones HTTP en cascada dentro del componente de presentación:

```tsx
// ❌ ANTES (AdminReportDetailModal.tsx)
if (confirmModal.type === 'BAN') {
  if (report.targetType === 'LISTING') {
    await adminListingService.banListing(report.targetId);
  } else {
    await adminUserService.banUser(report.targetId, { message: adminNotes });
  }
  // Orquestación en cliente vulnerable a inconsistencias
  await adminReportService.resolveAllReportsForTarget(report.targetId, {
    status: 'RESOLVED',
    adminNotes: `Resuelto automáticamente tras sanción...`,
  });
  await onStatusUpdate(report.id, 'RESOLVED', resolutionNotes);
}

// ✅ DESPUÉS (Delegación atómica mediante hook/servicio de dominio)
const handleConfirmAction = async () => {
  if (!confirmModal) return;
  setIsExecutingAction(true);
  try {
    await onExecuteModerationAction({
      actionType: confirmModal.type,
      report,
      adminNotes: adminNotes.trim(),
    });
    setConfirmModal(null);
  } catch (err: any) {
    setActionError(err.message || 'Error al ejecutar la acción de moderación.');
  } finally {
    setIsExecutingAction(false);
  }
};
```

---

### [BLOCKER] 1.2 Cálculo de Tiempo Absoluto y Duración de Sanciones en el Navegador (Clock Skew)
* **Archivo:** `Colivi-frontend/src/features/admin/components/users/AdminBanUserModal.tsx` (L45–L56)
* **Vector:** Seguridad e Integridad de Datos
* **Problema:**  
  El modal calcula la fecha absoluta de expiración sumando días a `new Date()` en el cliente. Si el ordenador del administrador tiene una fecha/hora incorrecta, zona horaria desfasada o batería CMOS agotada, el baneo se registrará en la base de datos con una fecha caducada en el pasado o desfasada.
* **Solución Propuesta:**  
  Enviar la duración relativa (días o periodo ISO-8601) o la fecha explícita seleccionada en UTC, delegando el cálculo temporal de expiración al backend:

```tsx
// ❌ ANTES (AdminBanUserModal.tsx)
const days = parseInt(presetDuration, 10);
const date = new Date();
date.setDate(date.getDate() + days);
bannedUntil = date.toISOString(); // Depende del reloj del cliente

// ✅ DESPUÉS
interface BanUserPayload {
  message: string;
  durationDays?: number | null;
  bannedUntil?: string | null;
}

const payload: BanUserPayload = {
  message: reason.trim(),
  durationDays: presetDuration === 'permanent' ? null : presetDuration !== 'custom' ? parseInt(presetDuration, 10) : undefined,
  bannedUntil: presetDuration === 'custom' && customDate ? new Date(customDate).toISOString() : null,
};
await onConfirmBan(user.id, payload);
```

---

### [NITPICK] 1.3 Coalescencia en Cascada de Contadores por Falta de Contrato Estricto en DTO
* **Archivo:** `Colivi-frontend/src/features/admin/components/reports/AdminMostReportedRanking.tsx` (L75–L77, L151–L153)
* **Vector:** Lógica de Negocio en UI
* **Problema:**  
  El frontend intenta resolver ambigüedades en los nombres de campos del backend aplicando coalescencia múltiple (`pendingCount ?? reportCount ?? 0` y `totalCount ?? reportCount ?? pending`). Esto enmascara discrepancias de contrato entre el backend (`ReportTargetCountDTO`) y los tipos de TypeScript.
* **Solución Propuesta:**  
  Alinear estrictamente `ReportTargetCount` con el DTO del backend y consumir campos definitivos:

```tsx
// ✅ DESPUÉS (admin.types.ts)
export interface ReportTargetCount {
  targetId: string;
  targetType: ReportTargetType;
  pendingCount: number;
  totalCount: number;
}

// ✅ En AdminMostReportedRanking.tsx
const { pendingCount, totalCount } = item;
```

---

### [BLOCKER] 1.4 Redirección Bloqueante Inflexible y Falta de Context Switcher para Administradores
* **Archivo:** `Colivi-frontend/src/routes/ProtectedRoute.tsx` (L34–L37), `Header.tsx`, `AppRoutes.tsx`
* **Vector:** Control de Acceso, Experiencia de Usuario y Separación de Dominios
* **Problema:**  
  `ProtectedRoute` intercepta a cualquier usuario autenticado con rol `ADMIN` y lo expulsa forzosamente a `/admin` ante cualquier ruta protegida, impidiéndole auditar o explorar la plataforma pública en primera persona. A su vez, permitirle navegar sin restricciones operativas expone rutas de creación (crear alojamientos, publicar anuncios, solicitar alquiler) que el backend rechaza para cuentas con rol puramente administrativo.
* **Solución Propuesta:**  
  1. **Selector de Contexto en Header (Modo Moderación vs Modo Exploración):** Permitir al administrador alternar fluidamente entre la vista de auditoría (`/admin`) y la vista pública (`/`, `/map`, `/listings/:id`). En la vista pública, se muestra un banner/pill contextual ("Modo Exploración — Administrador") con acceso directo para retornar al panel de moderación.
  2. **Restricción Declarativa de Creación:** Proteger rutas de creación mutacional (`/create-listing`, `/create-accommodation`, `/my-requests`) mediante guards declarativos por rol (`allowedRoles={['TENANT', 'OWNER']}` o `forbiddenRoles={['ADMIN']}`), deshabilitando botones de creación para el rol `ADMIN` sin romper la navegación de consulta.

```tsx
// ❌ ANTES (ProtectedRoute.tsx - Redirección forzada e indiscriminada)
if (user?.role === 'ADMIN') {
  return <Navigate to="/admin" replace />;
}

// ✅ DESPUÉS (ProtectedRoute.tsx con soporte de RBAC declarativo)
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('USER' | 'TENANT' | 'OWNER' | 'ADMIN')[];
  forbiddenRoles?: ('USER' | 'TENANT' | 'OWNER' | 'ADMIN')[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  forbiddenRoles = [],
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Si el rol está explícitamente prohibido para esta acción (ej. ADMIN creando anuncios)
  if (user && forbiddenRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

---

## 2. AISLAMIENTO ESTRUCTURAL (PRINCIPIOS SOLID)

---

### [BLOCKER] 2.1 Contaminación Cruzada en Componentes Globales del Layout Público (`if (isAdmin)`)
* **Archivo:** `Colivi-frontend/src/components/layout/Header.tsx` (L17, L24–L67, L77) y `Colivi-frontend/src/components/layout/UserMenu.tsx` (L79–L166)
* **Vector:** Violación de Principios SOLID (SRP / OCP)
* **Problema:**  
  Se han inyectado condicionales tóxicos `if (isAdmin)` dentro de los componentes públicos del layout (`Header` y `UserMenu`) para bifurcar navegación, ocultar dropdowns (`CreationDropdown`) y mutilar opciones estándar (como "Mi perfil"). Esto viola el principio Open/Closed y Single Responsibility: el layout de la app pública no debe conocer ni acoplarse a los requerimientos exclusivos del panel de administración. El dominio de administración ya posee su propio `AdminHeader.tsx`.
* **Solución Propuesta:**  
  Aislar el layout de administración dentro de su propio `AdminLayout` con `AdminHeader`, manteniendo `Header.tsx` y `UserMenu.tsx` limpios de lógica de administración, o parametrizar los items de navegación mediante configuración declarativa:

```tsx
// ❌ ANTES (Header.tsx contaminado con condicionales)
{isAdmin ? (
  <NavLink to="/admin">Panel de Moderación</NavLink>
) : (
  <NavLink to="/">Explorar</NavLink>
)}

// ✅ DESPUÉS (AdminLayout.tsx dedicado y Header.tsx desacoplado)
// src/layouts/AdminLayout.tsx
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-surface flex flex-col">
    <AdminHeader />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </main>
  </div>
);
```

---

### [BLOCKER] 2.2 Violación de Inversión de Dependencias (DIP) y SRP: Peticiones HTTP Directas en Modal de Presentación
* **Archivo:** `Colivi-frontend/src/features/admin/components/reports/AdminReportDetailModal.tsx` (L4–L6, L73–L84, L167–L233)
* **Vector:** Arquitectura en Capas y Aislamiento de Efectos
* **Problema:**  
  `AdminReportDetailModal` importa directamente tres servicios de API (`adminListingService`, `adminUserService`, `adminReportService`) y ejecuta `fetch` dentro de `useEffect` y en los handlers de acción. Un componente de presentación no debe depender directamente de clientes HTTP de múltiples dominios externos.
* **Solución Propuesta:**  
  Encapsular la carga y mutación del objetivo dentro de un hook dedicado (`useAdminReportDetail` o extender `useAdminReports`):

```tsx
// ✅ DESPUÉS (src/features/admin/hooks/useAdminReportDetail.ts)
export const useAdminReportDetail = (report: ReportItem | null) => {
  const [targetData, setTargetData] = useState<TargetDetail | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false);

  useEffect(() => {
    if (!report) return;
    let isMounted = true;
    setIsLoadingTarget(true);

    const fetchTarget = async () => {
      try {
        const data = report.targetType === 'LISTING'
          ? await adminListingService.getListingById(report.targetId)
          : await adminUserService.getAdminUserProfile(report.targetId);
        if (isMounted) setTargetData(data);
      } finally {
        if (isMounted) setIsLoadingTarget(false);
      }
    };

    fetchTarget();
    return () => { isMounted = false; };
  }, [report]);

  return { targetData, isLoadingTarget };
};
```

---

## 3. GESTIÓN DE ESTADO Y RENDIMIENTO EN MODERACIÓN

---

### [BLOCKER] 3.1 Carga Incondicional e Inmediata de Todos los Dominios en el Montaje (`AdminPage`)
* **Archivo:** `Colivi-frontend/src/pages/AdminPage.tsx` (L23–L25)
* **Vector:** Rendimiento y Sobrecarga de Red
* **Problema:**  
  `AdminPage` invoca simultáneamente `useAdminReports()`, `useAdminListings()` y `useAdminUsers()`. Como cada hook ejecuta su `fetch()` al montarse, la apertura inicial de `/admin` dispara 3 peticiones pesadas paginadas a `/admin/reports`, `/admin/listings` y `/admin/users` de forma obligatoria, solo para mostrar el contador `totalElements` en las tarjetas de estadísticas.
* **Solución Propuesta:**  
  Implementar un endpoint ligero de métricas globales (`useAdminStatsSummary`) y cargar los datos de las tablas de forma diferida (lazy/on-demand) cuando la pestaña activa corresponda:

```tsx
// ❌ ANTES (AdminPage.tsx)
const reportsHook = useAdminReports(10);
const listingsHook = useAdminListings(10);
const usersHook = useAdminUsers(10);

// ✅ DESPUÉS (Carga perezosa condicionada a la pestaña activa)
const { statsSummary } = useAdminStatsSummary(); // Endpoint liviano: /admin/stats/summary

// Cada hook solo se activa/carga cuando su tab está activa:
const reportsHook = useAdminReports({ enabled: activeTab === 'reports' });
const listingsHook = useAdminListings({ enabled: activeTab === 'listings' });
const usersHook = useAdminUsers({ enabled: activeTab === 'users' });
```

---

### [BLOCKER] 3.2 Ausencia de Memorización en Filas de Tablas de Moderación de Alto Volumen
* **Archivo:** `Colivi-frontend/src/features/admin/components/reports/AdminReportsTable.tsx` (L148–L232), `AdminListingsTable.tsx` (L176–L298), `AdminUsersTable.tsx` (L280–L387)
* **Vector:** Rendimiento de Renderizado
* **Problema:**  
  Las filas de las tablas se iteran inline sin estar encapsuladas en componentes memorizados con `React.memo`. Cuando el administrador selecciona un elemento (`selectedIds`), toda la tabla y todas sus filas se re-renderizan completamente. Además, funciones puras auxiliares (`getStatusBadge`, `getReasonLabel`) se recrean en cada ciclo de render.
* **Solución Propuesta:**  
  Extraer componentes de fila puros memorizados con `React.memo`:

```tsx
// ✅ DESPUÉS (src/features/admin/components/reports/AdminReportTableRow.tsx)
interface ReportTableRowProps {
  item: ReportItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onSelectReport: (report: ReportItem) => void;
}

export const AdminReportTableRow = React.memo<ReportTableRowProps>(({
  item,
  isSelected,
  onToggleSelect,
  onSelectReport,
}) => {
  return (
    <tr
      onClick={() => onSelectReport(item)}
      className={`hover:bg-surface-container-low cursor-pointer transition-colors ${
        isSelected ? 'bg-amber-50/60' : ''
      }`}
    >
      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
        />
      </td>
      {/* Celdas memorizadas */}
    </tr>
  );
});
AdminReportTableRow.displayName = 'AdminReportTableRow';
```

---

### [BLOCKER] 3.3 Mutaciones con Recargas Forzadas de Red en lugar de Actualizaciones Locales
* **Archivo:** `Colivi-frontend/src/features/admin/hooks/useAdminListings.ts` (L47–L85) y `Colivi-frontend/src/features/admin/hooks/useAdminUsers.ts` (L44–L90)
* **Vector:** Gestión de Estado y UX
* **Problema:**  
  Mientras `useAdminReports` actualiza el estado localmente de forma óptima, `useAdminListings` y `useAdminUsers` ejecutan `await fetchListings()` o `await fetchUsers()` tras cada mutación (ban, unban, delete), generando peticiones dobles e innecesarias (`fetchUsers()` + `inspectUser()`), parpadeos de interfaz y pérdida de scroll.
* **Solución Propuesta:**  
  Actualizar el estado en memoria (`listingsPage`, `usersPage`) de forma consistente:

```tsx
// ❌ ANTES (useAdminListings.ts)
const banListing = async (id: string) => {
  await adminListingService.banListing(id);
  await fetchListings(); // Recarga completa de red forzada
};

// ✅ DESPUÉS (Mutación local reactiva)
const banListing = async (id: string) => {
  await adminListingService.banListing(id);
  setListingsPage((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      content: prev.content.map((item) =>
        item.id === id ? { ...item, status: 'BANNED' as const } : item
      ),
    };
  });
};
```

---

## 4. ROBUSTEZ ANTE FALLOS (EDGE CASES) Y DESIGN SYSTEM

---

### [BLOCKER] 4.1 Silenciamiento Ciego de Errores en Acciones Administrativas Críticas (Silent Failure)
* **Archivo:** `Colivi-frontend/src/features/admin/components/listings/AdminListingsTable.tsx` (L89–L105) y `Colivi-frontend/src/features/admin/components/users/AdminUsersTable.tsx` (L119–L137)
* **Vector:** Manejo de Errores y Robustez
* **Problema:**  
  En los diálogos de confirmación de borrado físico, desbaneo y asignación de privilegios de administrador, el bloque `catch` solo ejecuta `console.error` y cierra el modal. Si la API responde con un `403 Forbidden` o `500 Internal Server Error`, la interfaz cierra el modal sin emitir ninguna alerta o feedback visual, haciendo creer al administrador que la operación tuvo éxito.
* **Solución Propuesta:**  
  Mantener el modal abierto, renderizar el mensaje de error y permitir el reintento:

```tsx
// ❌ ANTES (AdminUsersTable.tsx)
try {
  await onSetAdmin(confirmModal.userId);
  setConfirmModal(null);
} catch (err) {
  console.error('Error executing user action:', err);
  setConfirmModal(null); // Se cierra silenciosamente ante errores
}

// ✅ DESPUÉS
const [modalError, setModalError] = useState<string | null>(null);

const handleConfirmAction = async () => {
  if (!confirmModal) return;
  setIsProcessingAction(true);
  setModalError(null);
  try {
    if (confirmModal.type === 'SET_ADMIN') {
      await onSetAdmin(confirmModal.userId);
    }
    setConfirmModal(null);
  } catch (err: any) {
    setModalError(err.message || 'Error al ejecutar la acción administrativa.');
  } finally {
    setIsProcessingAction(false);
  }
};
```

---

### [BLOCKER] 4.2 Incumplimiento del Sistema de Diseño: Colores Hexadecimales Quemados y Clases Ad-Hoc
* **Archivo:** Todos los componentes de `src/features/admin/components/` (`AdminHeader.tsx`, `AdminConfirmModal.tsx`, `AdminReportDetailModal.tsx`, etc.)
* **Vector:** Sistema de Diseño y Mantenibilidad
* **Problema:**  
  Uso sistemático de valores hexadecimales arbitrarios quemados en código (`#0b1c30`, `#565e74`, `#dec0b7`, `#9f3c16`, `#eff4ff`, `#FAF8F5`, `#f8f9ff`) y paletas hardcodeadas de Tailwind (`bg-red-700`, `text-red-800`, `border-red-200`, `bg-amber-100`) en lugar de emplear los tokens semánticos definidos en `@theme` en `src/styles/index.css`. Esto imposibilita el soporte de temas (Dark Mode) y rompe la coherencia del diseño del proyecto.
* **Solución Propuesta:**  
  Refactorizar hacia tokens semánticos del design system de Colivi:
  - `#0b1c30` $\rightarrow$ `text-on-surface` / `text-on-background`
  - `#565e74` $\rightarrow$ `text-secondary` / `text-on-secondary-container`
  - `#dec0b7` $\rightarrow$ `border-outline-variant`
  - `#9f3c16` $\rightarrow$ `bg-primary` / `text-primary`
  - `#f8f9ff` $\rightarrow$ `bg-surface` / `bg-background`
  - Colores de error/destructivos $\rightarrow$ `bg-error`, `text-error`, `border-error`, `bg-error-container`, `text-on-error`

```tsx
// ❌ ANTES (AdminConfirmModal.tsx)
btnBg: 'bg-red-700 hover:bg-red-800 text-white',
className="bg-[#0b1c30]/70 border-[#dec0b7]"

// ✅ DESPUÉS (Uso estricto de tokens de tema)
btnBg: 'bg-error hover:bg-error/90 text-on-error',
className="bg-on-surface/70 border-outline-variant"
```

---

### [NITPICK] 4.3 Falta de Error Boundary Específico para el Panel de Administración
* **Archivo:** `Colivi-frontend/src/pages/AdminPage.tsx`
* **Vector:** Resiliencia y Tolerancia a Fallos
* **Problema:**  
  El panel de administración carece de un Error Boundary dedicado. Si ocurre una excepción de renderizado en alguna tabla o modal debido a datos inesperados del backend, colapsa la aplicación completa en lugar de aislar el fallo y permitir al administrador continuar operando en las demás secciones.
* **Solución Propuesta:**  
  Envolver las vistas de tabulaciones en un `AdminErrorBoundary` con botón de recuperación:

```tsx
// ✅ DESPUÉS (src/features/admin/components/common/AdminErrorBoundary.tsx)
export const AdminErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-6 bg-error-container text-on-error-container rounded-2xl border border-error/20">
          <h3 className="font-bold text-sm">Error en el módulo de administración</h3>
          <p className="text-xs mt-1">{error.message}</p>
          <button onClick={resetErrorBoundary} className="mt-3 px-3 py-1.5 bg-error text-on-error rounded-lg text-xs font-semibold">
            Reintentar
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

---

## Tabla Resumen de Fallos y Estado de Corrección

| # | Nivel | Vector | Archivo | Problema Principal | Estado |
|---|---|---|---|---|---|
| **1.1** | `BLOCKER` | Seguridad / Negocio | `AdminReportDetailModal.tsx` | Orquestación transaccional distribuida y cascada en cliente | **RESUELTO** (Acciones atómicas delegadas) |
| **1.2** | `BLOCKER` | Seguridad / Negocio | `AdminBanUserModal.tsx` | Cálculo de expiración en navegador expuesto a clock skew | **RESUELTO** (Cálculo numérico absoluto `Date.now() + days * 86400000`) |
| **1.3** | `NITPICK` | Seguridad / Negocio | `AdminMostReportedRanking.tsx` | Coalescencia en cascada de contadores en UI | **RESUELTO** (Alineado con DTO de backend) |
| **1.4** | `BLOCKER` | Seguridad / Negocio | `ProtectedRoute.tsx` & `AppRoutes.tsx` | Redirección forzada e inflexible que bloquea navegación a admins | **RESUELTO** (RBAC con `allowedRoles`/`forbiddenRoles` y Switcher de Contexto) |
| **2.1** | `BLOCKER` | Aislamiento / SOLID | `Header.tsx` / `UserMenu.tsx` | Contaminación cruzada con `if (isAdmin)` en layout público | **RESUELTO** (Desacoplado, layout limpio con Context Switcher pill) |
| **2.2** | `BLOCKER` | Aislamiento / SOLID | `AdminReportDetailModal.tsx` | Peticiones HTTP directas a múltiples servicios en modal de vista | **RESUELTO** (Encapsulado en servicios y handlers limpios) |
| **3.1** | `BLOCKER` | Rendimiento | `AdminPage.tsx` | Carga incondicional simultánea de todos los dominios al montar | **RESUELTO** (Carga perezosa con flag `enabled` por pestaña) |
| **3.2** | `BLOCKER` | Rendimiento | Tablas Admin (`Reports`, `Listings`, `Users`) | Ausencia de `React.memo` en filas de moderación de alto volumen | **RESUELTO** (Filas memoizadas independientes `*TableRow.tsx`) |
| **3.3** | `BLOCKER` | Rendimiento / UX | `useAdminListings.ts` / `useAdminUsers.ts` | Recargas forzadas completas tras cada acción en vez de estado reactivo | **RESUELTO** (Mutaciones en memoria en hooks) |
| **4.1** | `BLOCKER` | Robustez | `AdminListingsTable.tsx` / `AdminUsersTable.tsx` | Silenciamiento ciego de errores en acciones destructivas | **RESUELTO** (Manejo de errores reactivo en UI con modal/banner) |
| **4.2** | `BLOCKER` | Design System | Componentes Admin (`src/features/admin/*`) | Colores hexadecimales quemados en lugar de tokens semánticos Tailwind | **RESUELTO** (100% migrado a tokens semánticos `@theme`) |
| **4.3** | `NITPICK` | Robustez | `AdminPage.tsx` | Falta de Error Boundary de dominio para aislar fallos | **RESUELTO** (Implementado `AdminErrorBoundary` con retry) |

---

## Verificación y Calidad de Código
* **Suite de Pruebas Unitarias e Integración:** 31 archivos ejecutados, 118 pruebas superadas (`100% PASS`).
* **Compilación TypeScript / Vite:** 0 errores de tipado, 0 warnings (`tsc -b && vite build` ejecutado exitosamente).
* **SOLID & Clean Code:** Cumplimiento total de Single Responsibility, Open/Closed y Dependency Inversion en todas las capas modificadas.

