- **Nivel:** BLOCKER
- **Archivo:** `src/features/housing/hooks/useMapClusters.ts`
- **Problema:** En la lógica de `MacroCluster`, cuando los alojamientos están muy cerca pero no en la misma coordenada, el cluster usa `Math.min(expansionZoom, 18)`. Si `expansionZoom` es mayor que 18 (ej. 19 o 20), al hacer clic, el mapa vuela al zoom 18 y los pines siguen agrupados en un supercluster, creando un bucle donde el cluster es inclicable y nunca se expande para mostrar los anuncios.
- **Solución Propuesta:** 
```typescript
// Línea 189 de useMapClusters.ts
expansionZoom: expansionZoom, // Eliminar Math.min(expansionZoom, 18) para permitir la descompresión total
```

- **Nivel:** NITPICK
- **Archivo:** `src/pages/MapSearchPage.tsx`
- **Problema:** Las funciones `applyFilters` y `resetFilters` se definen de forma inline sin memorizar (`useCallback`). Dado que el estado `viewport` se actualiza repetidamente (al hacer panning o zoom), el componente se re-renderiza y recrea estas funciones constantemente. Al pasarlas a `<FilterPanel>`, fuerzan re-renderizados innecesarios del panel.
- **Solución Propuesta:** 
```typescript
const applyFilters = useCallback((appliedFilters?: FilterValues) => {
  const f = appliedFilters ?? filters;
  setExpandedCoordinate(null);
  setFilteredListings(null);
  hasFittedBoundsRef.current = false;
  search({ ... });
  setFiltersOpen(false);
}, [filters, search]);

const resetFilters = useCallback(() => {
  setExpandedCoordinate(null);
  setFilteredListings(null);
  hasFittedBoundsRef.current = false;
  setFilters({ title: '', city: '', minPrice: undefined, maxPrice: undefined, rentalType: '', amenities: [] });
  search({});
  setFiltersOpen(false);
}, [search]);
```

- **Nivel:** BLOCKER
- **Archivo:** `src/features/housing/components/listing/ListingBookingCard.tsx`
- **Problema:** Violación de fidelidad visual y de apilamiento: hay un color hardcodeado `bg-black/60` para el overlay del modal y un `z-index` arbitrariamente alto (`z-[9999]`), rompiendo la convención del design system y la escala de z-index de Tailwind (donde el mapa usa `z-40` y la barra de redimensión `z-30`). Esto es un riesgo de colisión de capas.
- **Solución Propuesta:** 
```typescript
// Reemplazar la línea 228
className="fixed inset-0 z-50 bg-scrim/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
```

- **Nivel:** BLOCKER
- **Archivo:** `src/components/ui/MonthPicker.tsx`
- **Problema:** Violación de convenciones de apilamiento en Tailwind. Se ha utilizado un `zIndex: 99999` inline en el dropdown del portal. Esto colisiona con el standard z-index escalado de Tailwind y del resto de la PR.
- **Solución Propuesta:** 
```typescript
// Reemplazar la línea 183
zIndex: 50, // Usar la convención estándar o añadir la clase z-50 de Tailwind en su lugar
```

- **Nivel:** NITPICK
- **Archivo:** `src/features/housing/components/map/FilterPanel.tsx`
- **Problema:** Violación de limpieza de código ("unused imports"). El hook `useRef` es importado de React pero jamás se utiliza dentro del componente `FilterPanel`.
- **Solución Propuesta:** 
```typescript
// Línea 1
import React, { useState, useEffect } from 'react'; // Eliminar useRef
```

- **Nivel:** NITPICK
- **Archivo:** `src/features/housing/hooks/usePriceHistogram.ts`
- **Problema:** Violación de Encapsulación (SOLID). El hook expone y retorna las funciones mutadoras del estado interno (`setGlobalMaxPrice`, `setGlobalHistogramData`). Puesto que el propio hook gestiona reactivamente el ciclo de vida de este estado basándose en los filtros y la lista, exponer estos setters permite que componentes externos destruyan y corrompan el estado rompiendo la abstracción.
- **Solución Propuesta:** 
```typescript
// Líneas 12-13, eliminar las firmas de los setters, devolviendo el estado como de solo lectura
export interface UsePriceHistogramResult {
  globalMaxPrice: number;
  globalHistogramData: number[];
}
```

- **Nivel:** NITPICK
- **Archivo:** `src/main/java/com/vvu981/colivibackend/features/accommodation/service/Impl/AccommodationServiceImpl.java`
- **Problema:** Violación de las convenciones globales de Java. El paquete se ha nombrado con mayúscula inicial (`Impl`), cuando todos los paquetes Java deben estar en minúscula estricta. Como estás desarrollando en Windows, compila bien, pero romperá silenciosamente el pipeline de CI/CD en servidores Linux al ser estos *case-sensitive*.
- **Solución Propuesta:** 
```java
// Línea 1
package com.vvu981.colivibackend.features.accommodation.service.impl;
```
