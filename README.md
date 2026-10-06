# Colivi

**Plataforma integral de busqueda de alojamiento, gestion de gastos compartidos y auditoria inteligente mediante Inteligencia Artificial.**

---

## Vision General

Colivi es una aplicacion web full-stack disenada para cubrir el ciclo de vida completo del usuario que busca vivienda compartida: desde el descubrimiento y reserva de un alojamiento hasta la convivencia diaria con sus companeros. La plataforma unifica en un unico ecosistema digital tres grandes capacidades que habitualmente exigen herramientas separadas: un mercado de alquileres geolocalizados, un motor privado de gestion economica del hogar, y una capa de inteligencia artificial que permite interactuar con los datos de la aplicacion mediante lenguaje natural.

El proyecto nace como Trabajo de Fin de Grado (TFG) con el objetivo de demostrar la viabilidad de integrar el **Model Context Protocol (MCP)** en una aplicacion real de produccion, permitiendo que un modelo de lenguaje grande (LLM) audite, analice y razone sobre datos propios del sistema de forma segura y multi-tenant.

---

## Modulos Funcionales

### Mercado de Alojamientos

El nucleo publico de la plataforma. Permite a cualquier usuario explorar un catalogo de anuncios de alquiler de corta y larga duracion.

- **Busqueda geolocalizada con mapa interactivo.** Los anuncios se representan como marcadores sobre un mapa en tiempo real. El usuario puede desplazarse por la cartografia y aplicar filtros de ciudad y rango de precio para acotar los resultados.
- **Catalogo inteligente con sugerencias personalizadas.** La seccion "Sugeridos para ti" analiza el historico de busquedas almacenado en el navegador del usuario (cookies / localStorage) y recicla los endpoints de filtrado existentes para proponer alojamientos alineados con sus preferencias sin requerir logica adicional en el servidor.
- **Publicacion y moderacion de anuncios.** Los usuarios registrados pueden dar de alta alojamientos, que quedan en estado PENDING y son visibles publicamente con un aviso de revision. Los administradores disponen de un panel de moderacion para aprobar o rechazar solicitudes.
- **Sistema cruzado de valoraciones y comentarios.** Los usuarios pueden puntuar alojamientos (1-5 estrellas) y evaluar el perfil de otros usuarios, tanto inquilinos como propietarios.
- **Auto-moderacion preventiva por denuncias.** Si un anuncio acumula mas de cinco denuncias unicas, el sistema lo oculta automaticamente del catalogo publico y genera una alerta prioritaria en la bandeja del administrador.
- **Mensajeria privada y ofertas economicas formales.** Cada anuncio integra un canal de chat entre inquilino y propietario desde el que se pueden enviar mensajes de texto y formalizar ofertas economicas vinculadas al inmueble.

#### Ciclo de vida de una reserva

El flujo de reserva se gestiona mediante una maquina de estados determinista:

| Estado | Descripcion |
|---|---|
| `PENDING` | El inquilino envia formalmente la solicitud de reserva. |
| `ACCEPTED` | El propietario acepta al candidato. Se desbloquea la pasarela de pago simulada. |
| `CONFIRMED` | El inquilino completa el pago simulado. La plaza queda cerrada (`UNAVAILABLE`). |
| `REJECTED` | El propietario declina la solicitud. |
| `CANCELLED` | Cualquiera de las partes cancela. Si la reserva estaba `CONFIRMED`, el anuncio vuelve al catalogo activo de forma automatica. |

---

### Gestion del Hogar

Modulo privado y exclusivo para usuarios autenticados. Permite organizar la convivencia de un grupo de personas en torno a un "Hogar" virtual.

- **Creacion y gestion de hogares.** Cualquier usuario puede crear un hogar y convertirse en su administrador. Puede invitar a otros miembros por correo electronico o nickname, y expulsar miembros siempre que no tengan deudas pendientes con el grupo.
- **Motor de gastos compartidos.** Para cada gasto se define un pagador unico y un conjunto de usuarios afectados. El reparto puede ser equitativo o con porcentajes personalizados que sumen el 100%. El sistema calcula en tiempo real el balance de cada miembro, indicando visualmente si debe dinero al grupo o si el grupo le debe a el.
- **Algoritmo de simplificacion de deudas.** El backend ejecuta un algoritmo de optimizacion de grafos de transacciones que reduce al minimo el numero de transferencias necesarias para liquidar todas las deudas del hogar. Si A debe 10 EUR a B y B debe 10 EUR a C, el sistema sugiere directamente que A pague 10 EUR a C. Este calculo es una proyeccion en tiempo de ejecucion: nunca reescribe el historial de gastos original persistido en base de datos.
- **Modulo de tareas colectivas.** Los miembros pueden crear, asignar y completar tareas del hogar (limpieza, mantenimiento, organizacion) con estado binario COMPLETADA / PENDIENTE. Las tareas no afectan a los balances economicos.

---

### Trazabilidad e Integridad de Datos (Auditoria)

Componente transversal que garantiza que ninguna accion financiera o de organizacion pueda ser alterada de forma fraudulenta.

- **Snapshots inmutables de estado.** Cada operacion de creacion, modificacion o eliminacion sobre un gasto o una tarea genera automaticamente un registro de auditoria con el estado anterior (Before) y el estado resultante (After) en formato JSON. Estos registros son de solo escritura a nivel de arquitectura: el backend bloquea explicitamente cualquier intento de UPDATE o DELETE sobre la tabla de auditoria.
- **Trazabilidad de autoria.** Cada snapshot queda vinculado de forma univoca al identificador del usuario que realizo la accion y a un timestamp de precision de milisegundos generado en el servidor, impidiendo su manipulacion desde el cliente.
- **Feed de actividad cronologico.** Los miembros del hogar pueden consultar un historial legible en lenguaje natural que traduce los JSON de auditoria en eventos comprensibles: variaciones de precio en gastos, reasignaciones de responsables en tareas, modificaciones en la lista de afectados, etc.
- **Control de concurrencia optimista.** Las entidades principales (Expense, Task, Hogar) implementan bloqueo optimista mediante campo de version gestionado por JPA. Si dos usuarios modifican la misma entidad de forma simultanea, solo la primera transaccion se consolida; la segunda es rechazada con un error controlado que obliga al cliente a sincronizar el estado real antes de reintentar.

---

### Asistente de Inteligencia Artificial (MCP)

Colivi integra un servidor MCP (Model Context Protocol) independiente que actua como puente entre un modelo de lenguaje grande (LLM) y los datos privados de la aplicacion. Esta capa permite interacciones conversacionales avanzadas ancladas estrictamente en la base de conocimiento real del sistema.

El servidor MCP no accede directamente a la base de datos. En su lugar, propaga el token JWT del usuario hacia la API REST del backend, garantizando que el LLM opere siempre bajo el contexto de seguridad del usuario autenticado y solo tenga visibilidad sobre los datos a los que este tiene acceso legitimo (aislamiento multi-tenant).

El asistente expone tres herramientas estructuradas:

| Herramienta | Descripcion |
|---|---|
| `auditar_conflictos_hogar` | Recupera y analiza la secuencia cronologica de cambios sobre un hogar para resolver malentendidos entre convivientes. El LLM contrasta la autoria de cada modificacion usando los snapshots de auditoria. |
| `analizar_balances_y_deudas` | Extrae el grafo de deudas consolidado y el historico financiero del hogar para emitir recomendaciones conversacionales sobre como liquidar las cuentas de forma optima. |
| `busqueda_semantica_alojamientos` | Permite buscar alojamientos mediante lenguaje natural cruzando las preferencias expresadas por el usuario con valoraciones y comentarios reales que los filtros tradicionales de base de datos no pueden indexar. |

---

## Roles de Usuario

| Rol | Descripcion |
|---|---|
| **Invitado** | Acceso de solo lectura al catalogo publico de alojamientos, mapa interactivo y filtros basicos. |
| **Usuario Registrado** | Hereda los permisos del Invitado. Puede publicar anuncios, realizar reservas, acceder al modulo de hogar, usar el asistente de IA y mantener conversaciones privadas con otros usuarios. |
| **Administrador** | Acceso al panel de moderacion global. Puede aprobar o rechazar anuncios, eliminar contenido que vulnere las normativas y gestionar baneos temporales con motivo y fecha de expiracion. |

---

## Stack Tecnologico

### Frontend
- **Framework:** React 18 + TypeScript sobre Vite
- **Routing:** React Router v6 con carga lazy de paginas
- **Estilos:** Tailwind CSS
- **Mapas:** Leaflet con marcadores geolocalizados
- **Gestion de estado:** Context API + hooks personalizados

### Backend
- **Framework:** Java 21 + Spring Boot 3.x
- **Seguridad:** Spring Security + autenticacion stateless mediante JWT
- **Persistencia:** Spring Data JPA + PostgreSQL
- **Almacenamiento de imagenes:** Proveedor de objetos en la nube (S3 / Cloudinary), persistiendo unicamente las URLs publicas
- **Arquitectura:** Clean Architecture por capas (Controller / Service / Repository / Entity) orientada a features con estricto cumplimiento de los principios SOLID

### Servidor MCP
- **Runtime:** Node.js + TypeScript
- **Protocolo:** Model Context Protocol (JSON-RPC sobre SSE)
- **Seguridad:** Passthrough del token JWT del usuario hacia la API del backend

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Base de datos:** PostgreSQL con indices compuestos para consultas geograficas y de precio

---

## Arquitectura del Sistema

```
[ Navegador / Cliente React ]
          |
          | HTTP REST + JWT
          v
[ Backend Spring Boot ] <--- [ Servidor MCP (Node.js) ]
          |                            |
          | Spring Data JPA           | JSON-RPC + JWT Passthrough
          v                            v
    [ PostgreSQL ]           [ API REST del Backend ]
```

El sistema se compone de tres capas de ejecucion completamente aisladas. El frontend nunca accede directamente a la base de datos. El servidor MCP nunca accede directamente a la base de datos: siempre consume los endpoints protegidos del backend, propagando el token JWT del usuario para respetar el modelo de seguridad establecido.

---

## Acerca del Proyecto

Colivi es el Trabajo de Fin de Grado (TFG) del Grado en Ingenieria Informatica. El proyecto investiga la integracion practica del **Model Context Protocol (MCP)** en aplicaciones de produccion reales, demostrando como los modelos de lenguaje pueden operar sobre datos privados y sensibles de forma segura, trazable y aislada por usuario.
