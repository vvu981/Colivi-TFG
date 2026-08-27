# 🕵️‍♂️ Auditoría Técnica PR #50 - Reporte de Hallazgos

A continuación se detallan los fallos, riesgos y violaciones arquitectónicas detectadas durante la revisión exhaustiva de la PR #50.

### 1. ARQUITECTURA Y PRINCIPIOS SOLID

- **Nivel:** [BLOCKER]
- **Archivo:** `RecommendationServiceImpl.java`
- **Problema:** Violación del Principio de Inversión de Dependencias (DIP) y Acoplamiento Fuerte. El servicio de recomendaciones inyecta y utiliza directamente el `AccommodationListingRepository` en lugar de comunicarse con el módulo a través de `AccommodationListingService`. Esto acopla la lógica de recomendación a la capa de persistencia de otro dominio, dificultando futuras refactorizaciones o cambios en la infraestructura de datos del alojamiento.
- **Solución Propuesta:**
```java
// Reemplazar la inyección directa del repositorio por el servicio correspondiente:
private final AccommodationListingService listingService; 
// Eliminar: private final AccommodationListingRepository listingRepository;

// Utilizar listingService para ejecutar los queries/especificaciones.
```

- **Nivel:** [NITPICK]
- **Archivo:** `RecommendationServiceImpl.java`
- **Problema:** "Code smell" de limpieza y legibilidad. Las excepciones `BusinessRuleValidationException` se instancian con su nombre de paquete completamente cualificado, lo que añade ruido visual y va en contra de las convenciones de Java.
- **Solución Propuesta:**
```java
// Añadir en la sección de imports:
import com.vvu981.colivibackend.core.exception.BusinessRuleValidationException;

// Y reemplazar las instancias por:
throw new BusinessRuleValidationException("Tipo de alojamiento no válido: " + resolvedTypeStr);
```

### 2. RENDIMIENTO Y RENDERIZADO (CRÍTICO)

- **Nivel:** [BLOCKER]
- **Archivo:** `FilterPanel.tsx`
- **Problema:** Falta de protección contra excesivos re-renders. El componente `PriceRangeFilter` (Dual Slider) dispara `handleFieldChange` que a su vez llama a `onChange` (y actualiza el estado global) por cada píxel que el usuario arrastra el slider. Esto desatará una cascada de re-renders masiva en todo el mapa y listado principal, congelando la interfaz.
- **Solución Propuesta:**
```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

// Envolver la llamada al onChange padre con debounce para esperar a que el usuario suelte o se detenga:
const debouncedOnChange = useMemo(
  () => debounce((updated: FilterValues) => onChange(updated), 300),
  [onChange]
);

const handleFieldChange = (updated: FilterValues) => {
  setLocalFilters(updated); // UI local instantánea
  debouncedOnChange(updated); // Actualización pesada protegida
};
```

- **Nivel:** [BLOCKER]
- **Archivo:** `MapSearchPage.tsx`
- **Problema:** Rendimiento crítico comprometido por re-renders continuos durante el redimensionamiento del sidebar. En la función `handleResizeMove`, se llama a `setSidebarWidth(newWidth)` por cada evento de movimiento del ratón (60+ veces por segundo). Al ser un estado de la página superior, esto fuerza el re-renderizado de todo el árbol de componentes (mapa, filtros, marcadores, listados) en cada frame, lo que causará lag extremo al arrastrar el separador.
- **Solución Propuesta:**
Utilizar una referencia mutable para el DOM o desacoplar el estado del layout principal. Ejemplo de mutación directa para saltarse el ciclo de renderizado de React durante la interacción:
```tsx
  // Asignar esta ref al <aside> del sidebar
  const sidebarRef = useRef<HTMLElement>(null);

  const handleResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const deltaX = resizeStartXRef.current - e.clientX;
    const maxAllowed = Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 300);
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(maxAllowed, resizeStartWidthRef.current + deltaX));
    
    // Mutación directa al DOM, sin trigger de re-render en todo MapSearchPage
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
    }
  };
```

- **Nivel:** [BLOCKER]
- **Archivo:** `useMapClusters.ts`
- **Problema:** Riesgo de complejidad algorítmica cuadrática (O(N²)) al resolver hojas individuales (leaves). Dentro del ciclo principal `for (const feature of rawClusters)`, se llama a `items.find(...)` secuencialmente para buscar `fans` y `leaves` por cada punto. Con un número elevado de anuncios desgranados (al hacer zoom out o zoom in), iterar un array que crece por cada punto causará cuellos de botella que estrangularán el main thread.
- **Solución Propuesta:**
Sustituir la búsqueda iterativa en el array por una estructura de datos de búsqueda O(1) (ej. `Map`) utilizando la latitud y longitud combinadas como clave hash.
```typescript
    // En lugar de iterar items con array.find, instanciar un diccionario al inicio
    const leafMap = new Map<string, MapClusterItem>();
    
    // Dentro del bucle, consultar la clave O(1):
    const coordKey = `${lat},${lng}`;
    const existing = leafMap.get(coordKey);
    
    if (existing) {
       // Promover a 'fan' y agregar al array de listings
    } else {
       // Crear nuevo leaf y guardarlo en el Map
       leafMap.set(coordKey, newLeaf);
    }
```

### 3. ROBUSTEZ Y CASOS LÍMITE (EDGE CASES)

- **Nivel:** [BLOCKER]
- **Archivo:** `RecommendedListings.tsx`
- **Problema:** Ausencia de fallback visual definido localmente ante errores 404 de imagen. El componente `ListingCard` verifica si existe `coverImage` pero utiliza un servicio externo (placehold.co) que también puede fallar si no hay red o si el servicio está caído. Se debe contar con un fallback SVG limpio y renderizado condicionalmente.
- **Solución Propuesta:**
```typescript
const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const [imageError, setImageError] = React.useState(false);
  const coverImage = listing.selectedImages?.[0]?.imageUrl || listing.accommodation?.images?.[0]?.imageUrl;

  // [...]
  {coverImage && !imageError ? (
    <img
      src={coverImage}
      alt={listing.title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
      onError={() => setImageError(true)} // <- Gestión del Edge Case
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
      {/* SVG Fallback Renderizado */}
    </div>
  )}
```

- **Nivel:** [BLOCKER]
- **Archivo:** `RecommendationServiceImpl.java`
- **Problema:** Falta de robustez en el "Cold Start" con historiales corruptos. En `resolveSearchContext`, si `resolvedTypeStr` proviene del historial de búsqueda y el valor en base de datos quedó corrupto u obsoleto, arrojará un `BusinessRuleValidationException`. Esto causará un HTTP 400 permanente para ese usuario al cargar el inicio, bloqueándole el acceso al carecer de un bloque `try-catch` tolerante a fallos para el historial (Edge case crítico).
- **Solución Propuesta:**
```java
        RentalType parsedType = null;
        if (resolvedTypeStr != null && !resolvedTypeStr.isBlank()) {
            try {
                parsedType = RentalType.valueOf(resolvedTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Si proviene de history, se ignora silenciosamente y se sigue (parsedType = null)
                if (hasExplicitCriteria) {
                    throw new BusinessRuleValidationException("Tipo de alojamiento no válido: " + resolvedTypeStr);
                }
            }
        }
```

### 4. FIDELIDAD VISUAL Y TAILWIND

- **Nivel:** [BLOCKER]
- **Archivo:** `ClusterFan.tsx`
- **Problema:** Colisión de especificidad entre Tailwind y estilos Inline. En la línea 91, se asigna dinámicamente la clase `hover:z-50` pero al mismo tiempo se aplica un `style={{ zIndex: ... }}` inline. En el DOM, los estilos en línea siempre sobreescriben a las clases CSS base de Tailwind, por lo que el hover nunca actuará elevando la tarjeta por encima de los demás elementos del abanico al interactuar.
- **Solución Propuesta:**
```tsx
// Forzar la máxima especificidad utilizando el modificador !important (!) de Tailwind
<div
  key={listing.id}
  className={`absolute inset-0 ${isExpanded ? 'hover:!z-50' : ''}`}
  style={{
    zIndex: isSelected ? 40 : isExpanded ? index + 1 : total - index,
    pointerEvents: !isExpanded && index > 0 ? 'none' : 'auto',
  }}
>
```

- **Nivel:** [BLOCKER]
- **Archivo:** `mapTheme.ts` y `FilterPanel.tsx`
- **Problema:** Múltiples clases de colores "hardcodeados" (ej: `text-white`, `border-white`) esparcidas, rompiendo la coherencia de los tokens semánticos de Tailwind / Material Design. En particular, usar `text-white` sobre fondos variables como `bg-primary-container` es una falla severa de accesibilidad y diseño, ya que el contenedor podría ser claro y volver el texto invisible. (Violación de la directriz de Fidelidad Visual).
- **Solución Propuesta:**
Reemplazar todos los `text-white` y `border-white` por variables semánticas puras. Por ejemplo, en `mapTheme.ts`:
```typescript
  badge: {
    sameAccommodation: 'bg-tertiary text-on-tertiary',
    differentAccommodation: 'bg-primary-container text-on-primary-container',
    border: 'border-2 border-surface',
    // ...
  }
```

### 5. HALLAZGOS FINALES (NITPICKS)

Tras verificar también que los tests del backend pasen (`mvn clean test` implícito) sin añadir regresiones, aquí expongo riesgos técnicos menores:

- **Nivel:** [NITPICK] (Robustez / Riesgo de Memory Leak)
- **Archivo:** `ListingBookingCard.tsx`
- **Problema:** Al enviar una solicitud de reserva exitosa, se lanza un `setTimeout` de 3000ms para limpiar el formulario y cerrar el modal. Si el usuario cierra la tarjeta o cambia de vista rápidamente antes de que transcurran los 3 segundos, React intentará mutar el estado de un componente desmontado, causando un memory leak y lanzando un Warning de React en consola.
- **Solución Propuesta:**
```typescript
  // Implementación recomendada vía useEffect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (messageSent) {
      timeoutId = setTimeout(() => { /* set states */ }, 3000);
    }
    return () => clearTimeout(timeoutId); // Limpia el timeout si se desmonta
  }, [messageSent]);
```

- **Nivel:** [BLOCKER] (Lógica / Matemáticas)
- **Archivo:** `ListingBookingCard.tsx`
- **Problema:** El cálculo matemático de la fecha de fin de reserva (`lastDayOfResultingMonth`) está sumando un mes de más (Overcharging). Por ejemplo, si un usuario alquila 3 meses empezando en Septiembre, debería terminar el 30 de Noviembre. La fórmula actual `(y * 12 + (m - 1)) + months` termina arrojando Diciembre (`11`), un mes de sobrecoste.
- **Solución Propuesta:**
Restar 1 mes adicional a la suma: `const totalMonths = (y * 12 + (m - 1)) + months - 1;`
