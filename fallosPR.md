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
- **Problema:** "Code smell" de limpieza y legibilidad. Las excepciones `BusinessRuleValidationException` (líneas 83 y 95) se instancian con su nombre de paquete completamente cualificado, lo que añade ruido visual y va en contra de las convenciones de Java.
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

### 3. ROBUSTEZ Y CASOS LÍMITE (EDGE CASES)

- **Nivel:** [BLOCKER]
- **Archivo:** `RecommendedListings.tsx`
- **Problema:** Ausencia de fallback visual definido ante errores 404 de imagen. El componente `ListingCard` verifica si existe `coverImage` pero no gestiona el estado de error si la carga de red falla. Si una imagen devuelve error (404/500), se mostrará el ícono genérico y roto del navegador en lugar del estado vacío (el SVG del placeholder) afectando la robustez y calidad visual.
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

### 5. HALLAZGOS ADICIONALES (SEGUNDA REVISIÓN)

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

- **Nivel:** [BLOCKER]
- **Archivo:** `RecommendationServiceImpl.java` (Línea 83)
- **Problema:** Falta de robustez en el "Cold Start" con historiales corruptos. En `resolveSearchContext`, si `resolvedTypeStr` proviene del historial de búsqueda y el valor en base de datos quedó corrupto u obsoleto, arrojará un `BusinessRuleValidationException`. Esto causará un HTTP 400 permanente para ese usuario al cargar el inicio, bloqueándole el acceso al carecer de un bloque `try-catch` tolerante a fallos para el historial (Edge case crítico).
- **Solución Propuesta:**
```java
        RentalType parsedType = null;
        if (resolvedTypeStr != null && !resolvedTypeStr.isBlank()) {
            try {
                parsedType = RentalType.valueOf(resolvedTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid accommodation type: {}", resolvedTypeStr);
                // Lanzar excepción SOLO si proviene de una petición explícita
                if (hasExplicitCriteria) {
                    throw new BusinessRuleValidationException("Tipo de alojamiento no válido: " + resolvedTypeStr);
                }
                // Si proviene de history, se ignora silenciosamente y se sigue (parsedType = null)
            }
        }
```

### 6. HALLAZGOS ADICIONALES (TERCERA REVISIÓN)

- **Nivel:** [BLOCKER] (Robustez / Lógica de Negocio)
- **Archivo:** `ListingBookingCard.tsx`
- **Problema:** El cálculo matemático de la fecha de fin de reserva (`lastDayOfResultingMonth`) está sumando un mes de más, cobrando al usuario un mes adicional por error (Overcharging). Por ejemplo, si un usuario alquila 3 meses empezando en Septiembre, debería terminar el 30 de Noviembre (Septiembre, Octubre, Noviembre = 3 meses). Sin embargo, la fórmula `(y * 12 + (m - 1)) + months` produce como mes resultante Diciembre (`11`), por lo que la reserva termina el 31 de Diciembre (4 meses en total). Incluso el JSDoc del método miente indicando un comportamiento correcto que el código no hace.
- **Solución Propuesta:**
Se debe restar `1` en la suma de los meses para obtener el índice del mes final correcto.
```typescript
function lastDayOfResultingMonth(isoStartDate: string, months: number): string {
  const [y, m] = isoStartDate.split('-').map(Number);
  // Al sumar 'months' a 'm - 1' (el índice del mes actual), terminamos un mes más adelante
  // de lo que deberíamos. Se requiere restar 1.
  const totalMonths  = (y * 12 + (m - 1)) + months - 1; 
  const targetYear   = Math.floor(totalMonths / 12);
  const targetMonth  = totalMonths % 12; 
  const lastDay      = new Date(targetYear, targetMonth + 1, 0);
  return toISODate(lastDay);
}
```

### 7. HALLAZGOS FINALES (CUARTA REVISIÓN - NITPICKS)

Tras ejecutar `mvn clean test` en el backend, confirmo que la integridad a nivel de tests es del 100% (671 tests pasando exitosamente). Sin embargo, a nivel de Frontend he encontrado dos fallos técnicos menores (Nitpicks) analizando los archivos de tests que abriste y los componentes que interactúan con APIs asíncronas:

- **Nivel:** [NITPICK] (Arquitectura / Testing)
- **Archivo:** `usePriceHistogram.test.ts`
- **Problema:** El test `"preserves globalMaxPrice when price filter is active"` es un **falso positivo**. El test inyecta el array `mockListings` inalterado (que incluye el piso de 800€) al mismo tiempo que inyecta filtros activos. El test pasa simplemente porque el estado anterior al renderizado es el valor por defecto (`DEFAULT_MAX_PRICE`). Nunca comprueba realmente que el hook recuerde el estado histórico cuando el componente padre *filtre y mutile* la lista de arrays (que es el propósito del hook).
- **Solución Propuesta:**
El test debe usar `rerender` de `@testing-library/react`. Primero renderizar sin filtros (para asentar el Max Price en 800) y luego hacer un `rerender` simulando la respuesta de la capa superior pasando un array de listados ya filtrado (solo el de 300) junto con los filtros activos, y así validar que el Max Price del hook no decrezca a 300 sino que se quede anclado en 800.

- **Nivel:** [NITPICK] (Robustez / Riesgo de Memory Leak)
- **Archivo:** `ListingBookingCard.tsx`
- **Problema:** Al enviar una solicitud de reserva exitosa, se lanza un `setTimeout` de 3000ms para limpiar el formulario y cerrar el modal. Si el usuario cierra la tarjeta o cambia de vista rápidamente antes de que transcurran los 3 segundos, React intentará mutar el estado de un componente desmontado, causando un memory leak y lanzando un Warning de React en consola.
- **Solución Propuesta:**
Guardar la referencia del timeout y destruirlo cuando el componente se desmonte.
```typescript
  // Implementación recomendada vía useEffect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (messageSent) {
      timeoutId = setTimeout(() => {
        setMessageSent(false);
        setIsContactModalOpen(false);
        setContactMessage('');
        setStartDate('');
        setDurationMonths(6);
      }, 3000);
    }
    return () => clearTimeout(timeoutId); // Limpia el timeout si se desmonta
  }, [messageSent]);
```
