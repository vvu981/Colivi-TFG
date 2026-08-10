# Registro de Requisitos Funcionales (RF)

| ID | Nombre | Descripción |
|---|---|---|
| RF-01 | Registrarse en la Plataforma | Permite a un usuario no autenticado crear una cuenta introduciendo sus datos básicos, cifrando la contraseña y creando un perfil en base de datos. |
| RF-02 | Iniciar Sesión (Login) | Permite a un usuario registrado autenticarse usando credenciales. El sistema valida y retorna tokens JWT (Access y Refresh). |
| RF-03 | Refrescar Sesión (Refresh Token) | El sistema permite emitir un nuevo Access Token válido a partir de un Refresh Token vigente sin requerir reingresar credenciales. |
| RF-04 | Solicitar Recuperación de Contraseña | Permite a un usuario no autenticado solicitar el restablecimiento de su clave mediante el envío de un token temporal por correo electrónico. |
| RF-05 | Restablecer Contraseña con Token | Permite fijar una nueva contraseña en el sistema validando el token de recuperación emitido previamente. |
| RF-06 | Solicitar Reactivación de Cuenta | Permite a un usuario cuya cuenta fue borrada lógicamente (Soft Delete) solicitar su recuperación, generando un token temporal. |
| RF-07 | Confirmar Reactivación de Cuenta | Permite restaurar el acceso a una cuenta previamente borrada proporcionando el token de reactivación. |
| RF-08 | Actualizar Perfil de Usuario | Permite al usuario modificar sus datos públicos (nombre, biografía, foto, idiomas) sin alterar credenciales. |
| RF-09 | Cambiar Contraseña Interna | Permite al usuario autenticado modificar su contraseña actual aportando la antigua por motivos de seguridad. |
| RF-10 | Cerrar Sesión (Logout) | Invalida los tokens del usuario activo, terminando la sesión de forma segura. |
| RF-11 | Borrado Lógico de Cuenta Propia | Permite al usuario eliminar su propia cuenta, ocultándola del sistema (Soft Delete) sin perder referencias físicas por integridad. |
| RF-12 | Consultar Perfil Público de Usuario | Permite a cualquier usuario autenticado visualizar la ficha pública (nombre, foto, biografía, valoraciones) de otro usuario de la plataforma. |
| RF-13 | Listar y Buscar Usuarios (Admin) | Permite a la administración buscar, filtrar y listar las cuentas de usuario registradas en el sistema por estado, rol o criterios de búsqueda. |
| RF-14 | Borrado Físico de Usuario | Permite a un SuperAdmin eliminar irreversiblemente (Hard Delete) todos los datos y rastro físico de un usuario de la base de datos. |
| RF-15 | Banear Usuario | Permite a un Administrador suspender (Ban) el acceso a la plataforma de un usuario infractor. |
| RF-16 | Desbanear Usuario | Permite a un Administrador revocar la suspensión de una cuenta baneada, devolviendo el acceso al usuario. |
| RF-17 | Promover Privilegios de Administración | Permite a un SuperAdmin asignar o retirar el rol de ADMIN a otro usuario del sistema. |
| RF-18 | Crear Hogar (Coliving) | Permite a un usuario crear un espacio de convivencia, asignándole el rol de Administrador de dicho hogar y generando un código de invitación. |
| RF-19 | Unirse a Hogar | Permite a un usuario vincularse como inquilino a un hogar existente mediante un código de invitación válido. |
| RF-20 | Consultar Detalles del Hogar | Permite a los miembros de un hogar visualizar su información, reglas y listado de participantes. |
| RF-21 | Abandonar Hogar | Permite a un miembro salir voluntariamente del hogar, perdiendo el acceso al tablón, gastos y actividades. |
| RF-22 | Archivar y Desarchivar Hogar | Permite al Administrador del hogar ocultar temporalmente (archivar) o restaurar un hogar, pausando su actividad general. |
| RF-23 | Transferir Administración del Hogar | Permite al actual Administrador del hogar ceder el control y permisos de propietario a otro inquilino activo. |
| RF-24 | Expulsar Miembro del Hogar | Permite al Administrador del hogar remover a un inquilino. Requiere que el usuario no tenga deudas o se liquidan automáticamente si corresponde. |
| RF-25 | Expulsión Forzada de Miembro | Permite al Administrador expulsar a un miembro sobreescribiendo bloqueos por deudas económicas en casos de emergencia. |
| RF-26 | Regenerar Código de Invitación | Permite al Administrador del hogar rotar el código de acceso, invalidando el anterior por motivos de seguridad o privacidad. |
| RF-27 | Borrar Hogar Lógicamente (Admin) | Permite al Administrador borrar lógicamente su hogar si es el único miembro activo. |
| RF-28 | Borrar Hogar Físicamente (SuperAdmin) | Permite a un SuperAdmin eliminar irreversiblemente un hogar y todo su rastro de la base de datos bypaseando restricciones. |
| RF-29 | Registrar Gasto Común | Permite a un miembro del hogar añadir un pago, dividiendo automáticamente el importe según la participación o lógica definida. |
| RF-30 | Modificar Gasto Común | Permite al creador de un gasto o al Administrador del hogar editar el concepto o importe de un gasto previamente registrado, recalculando saldos. |
| RF-31 | Eliminar Gasto | Permite al creador del gasto o al Administrador del hogar eliminar un registro económico que fue añadido por error. |
| RF-32 | Consultar Historial de Gastos | Permite a los miembros del hogar ver un listado cronológico de todos los gastos registrados. |
| RF-33 | Consultar Saldos Individuales | El Sistema calcula en tiempo real quién debe cuánto y a quién, mostrando los balances netos de cada usuario en el hogar. |
| RF-34 | Generar Plan de Transferencias | El Sistema calcula algorítmicamente la forma más óptima y con menos transacciones para que los inquilinos liquidan deudas. |
| RF-35 | Registrar Pago Directo / Liquidar Deuda | Permite a un miembro del hogar registrar una transferencia o pago directo a otro integrante para saldar o reducir su balance neto de deuda. |
| RF-36 | Consultar Auditoría de Actividad | Permite a los miembros ver el registro histórico automatizado de eventos (ej. "X pagó la luz", "Y se unió al hogar"). |
| RF-37 | Registrar Nueva Propiedad (Accommodation) | Permite a un usuario registrar un inmueble físico (piso, habitación) en su inventario privado aportando sus atributos estructurales. |
| RF-38 | Consultar Mis Propiedades | Permite a un usuario listar todas las propiedades físicas que ha registrado, independientemente de si son anuncios públicos o no. |
| RF-39 | Consultar Detalles de Propiedad Propia | Permite al propietario ver el detalle completo e interno de un inmueble específico de su inventario. |
| RF-40 | Modificar Detalles de Propiedad | Permite al propietario editar la información física y estructural de una de sus propiedades. |
| RF-41 | Gestionar Galería de Imágenes de Propiedad | Permite al propietario subir fotos, cambiar el orden (portada) y eliminar imágenes asociadas a un inmueble físico. |
| RF-42 | Borrado Lógico de Propiedad | Permite al propietario marcar su inmueble como eliminado lógicamente (Soft Delete). |
| RF-43 | Borrado Físico de Propiedad (SuperAdmin) | Permite a un administrador eliminar por completo un inmueble de la base de datos. |
| RF-44 | Publicar Anuncio (Listing) | Permite a un propietario tomar una propiedad (Accommodation) y publicarla al mundo como anuncio con precio y condiciones. |
| RF-45 | Consultar Detalle Público de Anuncio | Permite a cualquier usuario ver la ficha completa, precio y disponibilidad de un anuncio específico. |
| RF-46 | Modificar Anuncio Público | Permite al propietario editar las condiciones comerciales (precio, normas) de un anuncio sin alterar la estructura de la propiedad subyacente. |
| RF-47 | Buscar y Filtrar Catálogo de Anuncios | Permite a cualquier usuario buscar anuncios disponibles mediante filtros dinámicos (precio, ubicación, tipo, fechas). |
| RF-48 | Actualizar Disponibilidad del Anuncio | Permite al propietario cambiar el estado del alojamiento (disponible, alquilado, pausado) ocultándolo de las búsquedas si ya no está libre. |
| RF-49 | Retirar Anuncio (Soft Delete Propietario) | Permite al propietario retirar permanentemente su oferta inmobiliaria del mercado, manteniéndola en BD. |
| RF-50 | Borrar Anuncio (Hard Delete SuperAdmin) | Permite a un SuperAdmin eliminar irreversiblemente un anuncio y todas sus dependencias de la base de datos por violaciones de las normas. |
| RF-51 | Recuperar Anuncio Retirado | Permite al propietario restaurar a estado público un anuncio previamente marcado como borrado lógico. |
| RF-52 | Ocultar Anuncio (Moderación Admin) | Permite a un Administrador bloquear/banear un anuncio que infrinja políticas, impidiendo que aparezca en búsquedas públicas. |
| RF-53 | Restaurar Anuncio (Moderación Admin) | Permite a un Administrador levantar el bloqueo de un anuncio baneado para que vuelva a estar visible. |
| RF-54 | Enviar Solicitud de Reserva (Inquilino) | Permite a un interesado enviar una petición de alojamiento al propietario para unas fechas determinadas. |
| RF-55 | Enviar Solicitud de Reserva (Admin) | Permite a un Administrador forzar/crear una solicitud de reserva en nombre de un inquilino específico hacia una propiedad. |
| RF-56 | Consultar Detalle de Solicitud de Reserva | Permite a un usuario consultar el estado e información concreta de una reserva particular (propia o donde él es el dueño). |
| RF-57 | Gestionar Solicitud de Reserva | Permite al propietario Aceptar, Rechazar o Cancelar una petición de reserva entrante sobre sus anuncios. |
| RF-58 | Consultar Reservas Enviadas (Inquilino) | Permite a un inquilino ver el histórico y estado de todas las solicitudes de reserva que ha emitido. |
| RF-59 | Consultar Reservas Recibidas (Propietario) | Permite a un propietario listar las reservas entrantes hacia sus anuncios, filtrables por inmueble. |
| RF-60 | Listar Todas las Reservas (Admin) | Permite a la administración ver, filtrar y auditar absolutamente todas las transacciones y reservas del sistema. |
| RF-61 | Crear Denuncia (Reporte) | Permite a cualquier usuario enviar una alerta de moderación hacia un objetivo (Usuario, Anuncio, Hogar, Gasto) indicando motivo y justificación. |
| RF-62 | Consultar Mis Denuncias | Permite a un usuario listar las denuncias que ha emitido y ver su estado actual de resolución. |
| RF-63 | Cancelar Denuncia Propia | Permite a un usuario anular (CANCELLED) voluntariamente una denuncia que hizo, siempre que su estado siga como pendiente. |
| RF-64 | Filtrar Denuncias (Admin) | Permite a la administración buscar quejas usando especificaciones complejas (por objetivo, creador, tipo, fechas, estado). |
| RF-65 | Gestionar Estado de Denuncia | Permite a un Administrador avanzar el ciclo de vida de un reporte (Investigar, Resolver o Desestimar) añadiendo notas privadas. |
| RF-66 | Moderación Masiva (Bulk Update) | Permite a la administración resolver, desestimar o investigar múltiples denuncias de forma atómica y agrupada. |
| RF-67 | Consultar Estadísticas de Denuncias | Retorna a la administración un ranking con los elementos que acumulan más quejas (Top Most Reported) para detectar infractores reincidentes. |
| RF-68 | Absorción Automática de Deuda | El Sistema genera automáticamente un gasto interno (CONDONACIÓN_EXPULSIÓN) para redistribuir la deuda impagada de un miembro cuando este es expulsado forzosamente. |
| RF-69 | Promoción Automática de Administrador | El Sistema otorga automáticamente (HomeMemberOrphanListener) el rol de Administrador al miembro activo más antiguo si el actual Admin elimina su cuenta. |
| RF-70 | Cierre Automático de Hogar Vacío | El Sistema archiva o marca automáticamente un hogar como inactivo/borrado cuando se detecta que su único y último miembro activo sale del mismo o elimina su cuenta. |
