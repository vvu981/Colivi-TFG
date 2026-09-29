# Guía de Evaluación y Pruebas de Usuario: Colivi

Bienvenido a la sesión de evaluación técnica de Colivi, una plataforma integral que 
unifica el alquiler de vivienda compartida, la convivencia económica del hogar y la 
asistencia inteligente mediante Model Context Protocol (MCP).

Para evaluar la aplicación de forma exhaustiva, sigue las 8 misiones que se detallan a 
continuación. Se recomienda utilizar un ordenador y disponer de una ventana principal y 
una ventana de incógnito para simular la interacción entre dos usuarios distintos.

---

### Preparación del Entorno
1. Accede a la URL de la aplicación.
2. Abre una ventana en modo incógnito en paralelo (servirá para simular a tu compañero de piso o arrendador).
3. **Requisito de correo electrónico:** Utiliza direcciones de correo electrónico reales a las que tengas acceso inmediato, ya que la plataforma envía correos transaccionales (confirmaciones y restablecimiento de credenciales).
4. **Advertencia de autenticación:** NO utilices las opciones de "Registrarse con Google" ni "Iniciar sesión con Google", dado que la integración con OAuth de Google aún no está configurada. Utiliza exclusivamente el registro tradicional con correo y contraseña.

---

### Misión 1: Registro de Usuarios, Recuperación de Contraseña y Perfil
* Objetivo: Validar el flujo de autenticación, verificación por correo, restablecimiento de contraseñas y personalización.
1. En la ventana normal, accede a "Registrarse" y crea la cuenta del Usuario A con un correo real al que tengas acceso.
2. En la ventana de incógnito, accede a "Registrarse" y crea la cuenta del Usuario B (también con un correo real accesible).
3. **Comprobación de recuperación de contraseña:**
   - Cierra sesión temporalmente con el Usuario A o ve a la pantalla de "Iniciar Sesión".
   - Pulsa en "¿Has olvidado tu contraseña?" (o "Recuperar contraseña").
   - Introduce el correo real del Usuario A y solicita el enlace/código de recuperación.
   - Revisa tu bandeja de entrada (y la carpeta de spam si es necesario), accede al enlace recibido y define una nueva contraseña.
   - Vuelve a iniciar sesión con la nueva contraseña para certificar que el restablecimiento funciona de extremo a extremo.
4. Entra en "Mi Perfil" con el Usuario A. Modifica tu biografía, número de teléfono y avatar.
5. Verifica que los cambios se persisten correctamente al recargar la página.

---

### Misión 2: Exploración de Mercado y Búsqueda Geolocalizada
* Objetivo: Evaluar la interacción cartográfica y el motor de filtrado.
1. Con el Usuario A, navega a la sección "Buscar Alojamiento" o accede al mapa interactivo.
2. Desplázate por el mapa cartográfico interactivo, amplía el zoom y haz clic sobre los marcadores de las viviendas.
3. Aplica filtros combinados: rango de precio mensual, ciudad y tipo de estancia.
4. Comprueba cómo se actualiza la lista lateral en sincronía con los límites visibles del mapa.
5. Haz clic en un alojamiento para abrir su ficha detallada: revisa las imágenes, comodidades, reglas de convivencia y ubicación.

---

### Misión 3: Publicación de Alojamiento y Anuncio (Rol Propietario)
* Objetivo: Evaluar el asistente de publicación y control de estados.
1. Cambia a la ventana del Usuario B.
2. Accede a "Mis Alojamientos" -> "Crear Alojamiento".
3. Rellena los datos físicos del inmueble: dirección completa, número de habitaciones, baños, metros cuadrados y sube fotografías.
4. Una vez creado el inmueble base, haz clic en "Publicar Anuncio". Define el título comercial, descripción, precio mensual, fianza y fechas de disponibilidad.
5. Observa el estado del anuncio: quedará publicado o en estado de revisión según la política del sistema.

---

### Misión 4: Solicitud de Reserva, Negociación y Mensajería
* Objetivo: Validar la máquina de estados de reserva y la mensajería contextual.
1. Con el Usuario A (ventana normal), busca el anuncio que acaba de publicar el Usuario B.
2. Haz clic en "Contactar con el Propietario" o "Solicitar Reserva".
3. Envía una solicitud formal indicando la fecha de entrada prevista y un mensaje introductorio.
4. Cambia a la ventana del Usuario B y entra en "Mensajes" / "Solicitudes Recibidas".
5. Observa la cabecera fija de contexto (detalles del inmueble sobre el chat). Intercambia mensajes en tiempo real.
6. Con el Usuario B, acepta formalmente la solicitud de reserva.
7. Vuelve al Usuario A en "Mis Solicitudes": comprueba que el estado ha pasado a ACEPTADA y realiza la simulación del pago para cerrar la plaza.

---

### Misión 5: Gestión Económica del Hogar y Reparto de Gastos
* Objetivo: Poner a prueba el motor financiero y el algoritmo de simplificación de deudas.
1. Con el Usuario B, accede a la sección "Hogares" y pulsa "Crear Hogar" (ej. "Piso Centro 3B").
2. En la pestaña "Miembros", copia el código de invitación o invita al Usuario A mediante su identificador.
3. Con el Usuario A, únete al hogar introduciendo el código en "Unirse a Hogar".
4. Dirígete a la pestaña "Gastos":
   - Registra un primer gasto: Usuario B paga 120 EUR de "Compra mensual Mercadona" repartido al 50% entre ambos.
   - Registra un segundo gasto: Usuario A paga 60 EUR de "Internet fibra" con reparto equitativo.
5. Revisa la tarjeta de Balances: observa cómo el algoritmo optimiza el saldo global indicando exactamente quién debe cuánto a quién.
6. Registra un pago de liquidación parcial para comprobar cómo se reajustan los balances sin borrar el histórico.

---

### Misión 6: Organización de Tareas, Calendario y Gamificación
* Objetivo: Evaluar la delegación de tareas domésticas y el sistema de puntos.
1. Dentro del hogar, navega a la pestaña "Tareas".
2. Pulsa en "Nueva Tarea": crea "Limpieza profunda de cocina", asigna una fecha límite, periodicidad semanal, asígnala al Usuario A y define una puntuación de 25 puntos.
3. Cambia a la vista "Calendario" para verificar la distribución temporal de las obligaciones.
4. Con el Usuario A, marca la tarea como completada.
5. Abre la pestaña "Clasificación" (Leaderboard) y comprueba la asignación de puntos y el ranking del hogar.
6. Abre el modal de "Color Personal" y selecciona un color representativo para identificar tus tareas visualmente.

---

### Misión 7: Trazabilidad y Feed de Auditoría
* Objetivo: Comprobar la inmutabilidad y transparencia en la convivencia.
1. En el hogar, accede a la pestaña "Actividad".
2. Revisa la secuencia cronológica de eventos: creación del hogar, altas de miembros, variaciones en gastos y resoluciones de tareas.
3. Modifica el importe de un gasto existente y regresa al feed para validar que queda registrado el autor, la hora exacta y el valor previo vs. nuevo.

---

### Misión 8: Copiloto de Inteligencia Artificial (MCP)
* Objetivo: Evaluar el asistente contextual multi-tenant y la invocación de herramientas.
1. En la esquina inferior derecha de la pantalla, pulsa sobre el icono del Asistente IA ("Copiloto Colivi").
2. Prueba las siguientes consultas directas:
   - Consulta 1 (Tareas): "¿Cuáles son mis tareas del hogar asignadas y cómo voy en el ranking?"
   - Consulta 2 (Mercado): "Búscame habitaciones disponibles en un ambiente tranquilo por menos de 700€."
   - Consulta 3 (Bandeja): "Hazme un resumen de las solicitudes o mensajes pendientes que tengo."
3. Evalúa la rapidez de respuesta, la coherencia de los datos devueltos y si la herramienta estructurada ha consultado la base de datos real del sistema.
