#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
message_fixtures.py — Rich Conversation Scenarios & Dialogue Data for Colivi QA
================================================================================
Colección estructurada y contextual de plantillas de diálogo realistas en español
para simular conversaciones completas entre inquilinos y anfitriones en Colivi.
"""

# Diálogos temáticos completos (flujos de preguntas y respuestas coordinadas)
CONVERSATION_FLOWS = [
    {
        "topic": "telework_and_connectivity",
        "category": "CONSULTA_GENERAL",
        "messages": [
            {"sender": "tenant", "text": "¡Hola! He visto las fotos del anuncio y la habitación tiene una luz natural fantástica. Trabajo 100% en remoto como programador, ¿qué tal llega la señal de internet a la habitación? ¿Tenéis fibra de alta velocidad?"},
            {"sender": "host", "text": "¡Buenas! Sí, sin problema. Tenemos contratada fibra simétrica de 600 Mbps y hay un punto de acceso Wi-Fi 6 en el pasillo central, a menos de cuatro metros de la puerta. Además la mesa es de 140x70 y la silla es ergonómica."},
            {"sender": "tenant", "text": "Eso me da muchísima tranquilidad. ¿Y de ruido ambiental durante las mañanas qué tal está? Suelo tener bastantes videollamadas con el equipo."},
            {"sender": "host", "text": "La ventana da a un patio de manzana ajardinado muy amplio, sin nada de tráfico. Los otros dos chicos salen a trabajar fuera entre las 9 y las 18h, así que la casa está prácticamente en silencio absoluto por el día."},
            {"sender": "tenant", "text": "¡Maravilloso! Encaja punto por punto con lo que necesito para el próximo trimestre. Voy a tramitar la solicitud de reserva."},
            {"sender": "host", "text": "Perfecto, en cuanto la envíes la reviso y te la apruebo para dejar las fechas bloqueadas."}
        ]
    },
    {
        "topic": "supplies_and_expenses",
        "category": "CONSULTA_SUMINISTROS",
        "messages": [
            {"sender": "tenant", "text": "Hola, buenas tardes. Me interesa mucho la habitación para el curso universitario. Quería confirmar si los suministros (luz, agua, gas e internet) van incluidos en el precio mensual."},
            {"sender": "host", "text": "Hola. El internet de alta velocidad y los gastos de comunidad están incluidos en la mensualidad. Los consumos de agua, luz y gas se liquidan a través del módulo de gastos de Colivi entre los convivientes."},
            {"sender": "tenant", "text": "¿Y más o menos a cuánto suele ascender la media por persona al mes según vuestra experiencia?"},
            {"sender": "host", "text": "Suele oscilar entre 35€ y 45€ mensuales por persona, algo más en los meses de invierno por la calefacción. Es un sistema muy transparente porque cada factura se sube directamente a la plataforma."},
            {"sender": "tenant", "text": "Genial, me parece muy justo pagar según consumo real. ¿Se requiere un mes de fianza legal?"},
            {"sender": "host", "text": "Exacto, un mes de fianza que queda custodiada de forma segura por Colivi hasta el fin de la estancia."}
        ]
    },
    {
        "topic": "housemates_and_lifestyle",
        "category": "PERFIL_CONVIVENCIA",
        "messages": [
            {"sender": "tenant", "text": "¡Hola! Estoy buscando piso compartido cerca del campus y me ha gustado mucho vuestra vivienda. ¿Qué perfil de compañeros hay actualmente en el piso?"},
            {"sender": "host", "text": "¡Hola! Actualmente viven dos chicas y un chico de entre 23 y 27 años. Dos están terminando un máster y otro trabaja en una consultora tecnológica. El ambiente es muy respetuoso y tranquilo."},
            {"sender": "tenant", "text": "¿Cómo gestionáis las tareas de limpieza de las zonas comunes (cocina, salón y baños)?"},
            {"sender": "host", "text": "Se organizan a través de la sección de Tareas de Colivi. Hay un reparto rotativo semanal y la verdad es que funciona genial, son muy limpios y se respetan las horas de estudio y sueño."},
            {"sender": "tenant", "text": "Me identifico totalmente con ese estilo de convivencia. Envío la solicitud de reserva ahora mismo."},
        ]
    },
    {
        "topic": "bike_storage_and_mobility",
        "category": "MOVILIDAD_Y_SERVICIOS",
        "messages": [
            {"sender": "tenant", "text": "Buenas. Me desplazo siempre en bicicleta por la ciudad. ¿Hay algún espacio comunitario o patio donde se pueda dejar guardada con seguridad?"},
            {"sender": "host", "text": "Hola. Sí, en el patio interior de la finca hay una zona techada con aparcabicis cerrado con llave exclusivo para los vecinos. Además el ascensor es espacioso."},
            {"sender": "tenant", "text": "¡Estupendo! ¿Y respecto a visitas de familiares o pareja algún fin de semana qué normas tenéis estipuladas?"},
            {"sender": "host", "text": "Las visitas puntuales están permitidas avisando previamente al resto por el chat del hogar. Siempre que prime el respeto al descanso común, no hay ningún problema."},
            {"sender": "tenant", "text": "Entendido y de acuerdo. Muchas gracias por la aclaración tan rápida."}
        ]
    },
    {
        "topic": "kitchen_and_appliances",
        "category": "EQUIPAMIENTO",
        "messages": [
            {"sender": "tenant", "text": "Hola! Quería consultar qué electrodomésticos tiene la cocina. Me gusta bastante cocinar y para mí es importante tener horno y espacio en la nevera."},
            {"sender": "host", "text": "¡Buenas! La cocina está recién reformada. Cuenta con frigorífico combi grande, horno pirolítico, placa de inducción, microondas y lavavajillas Balay. Cada habitación tiene asignado su propio armario y balda de nevera."},
            {"sender": "tenant", "text": "¡Qué maravilla tener lavavajillas y espacio organizado! ¿El menaje de cocina (sartenes, platos, cubiertos) está disponible o hay que llevar el propio?"},
            {"sender": "host", "text": "Todo el menaje básico está disponible y totalmente equipado para compartir, no hace falta que traigas nada de eso."},
            {"sender": "tenant", "text": "Perfecto, muchísimas gracias. Me convence mucho el piso."}
        ]
    },
    {
        "topic": "ac_and_heating",
        "category": "CONFORT_CLIMATIZACION",
        "messages": [
            {"sender": "tenant", "text": "Buenas tardes. He visto que el piso está muy céntrico. En los meses calurosos, ¿la habitación cuenta con aire acondicionado o ventilador de techo?"},
            {"sender": "host", "text": "Hola. La habitación dispone de un ventilador de techo ultrasilencioso con mando a distancia y en el salón común hay aire acondicionado split con bomba de calor frío/calor."},
            {"sender": "tenant", "text": "¿Y durante el invierno la calefacción es central o eléctrica?"},
            {"sender": "host", "text": "Calefacción por radiadores de gas natural con termostato inteligente programado a 21 grados durante el día. La casa es muy cálida y tiene ventanas climalit con doble acristalamiento."},
            {"sender": "tenant", "text": "Genial, el aislamiento es clave para mí. Solicito reserva para las fechas de mi contrato laboral."}
        ]
    },
    {
        "topic": "short_stay_dates",
        "category": "CONSULTA_FECHAS",
        "messages": [
            {"sender": "tenant", "text": "Hola! Voy a realizar una estancia de investigación de 4 meses en la universidad. ¿Sería posible alquilar exactamente de octubre a enero inclusive?"},
            {"sender": "host", "text": "Hola. Sí, nuestros contratos están pensados específicamente para estancias de media duración por trimestres o semestres, así que esas fechas cuadran perfecto."},
            {"sender": "tenant", "text": "Excelente. ¿Aceptáis certificado de admisión de la universidad como justificante de ingresos/solvencia?"},
            {"sender": "host", "text": "Sí, la carta de admisión o matrícula oficial junto con DNI o pasaporte es suficiente para verificar el perfil en Colivi."}
        ]
    },
    {
        "topic": "booking_accepted_and_keys",
        "category": "COORDINACION_ENTREGA",
        "messages": [
            {"sender": "tenant", "text": "¡Hola! Acabo de enviar la solicitud de reserva a través de la aplicación para las fechas acordadas."},
            {"sender": "host", "text": "¡Buenas noticias! La acabo de revisar y he aceptado la solicitud en el sistema. Ya puedes completar el abono seguro de la fianza."},
            {"sender": "tenant", "text": "¡Listo! Pago completado a través de Stripe en la plataforma. Ya me sale el estado CONFIRMADO."},
            {"sender": "host", "text": "¡Confirmado por aquí también! Bienvenido a Colivi. La semana de tu llegada coordinamos la hora exacta en el portal para entregarte las llaves y mostrarte el piso."},
            {"sender": "tenant", "text": "¡Perfecto! Nos vemos muy pronto. Muchísimas gracias por todo."}
        ]
    },
    {
        "topic": "resolved_and_archived",
        "category": "CONSULTA_ARCHIVADA",
        "messages": [
            {"sender": "tenant", "text": "Hola, ¿la habitación sigue libre para entrar esta misma semana?"},
            {"sender": "host", "text": "Hola. Lamentablemente se formalizó una reserva ayer mismo para esa habitación en concreto. Pero en dos semanas quedará otra libre en el piso contiguo."},
            {"sender": "tenant", "text": "Entiendo, necesito mudarme con urgencia así que seguiré buscando. Muchas gracias por responder tan rápido."},
            {"sender": "host", "text": "De nada, ¡mucha suerte encontrando alojamiento!"}
        ]
    },
    {
        "topic": "public_transport_and_metro",
        "category": "UBICACION_TRANSPORTE",
        "messages": [
            {"sender": "tenant", "text": "¡Hola! ¿A cuántos minutos a pie está la parada de metro o autobús más cercana?"},
            {"sender": "host", "text": "¡Hola! Tienes la estación de metro a solo 4 minutos caminando (líneas 3 y 5 directas al centro y aeropuerto) y varias líneas de autobús en la esquina de la manzana."},
            {"sender": "tenant", "text": "¿Y hay supermercados o farmacias cerca?"},
            {"sender": "host", "text": "Hay un Mercadona a 200 metros, un gimnasio a 3 minutos y varios comercios locales en el barrio. La zona es muy cómoda para hacer vida a pie."},
            {"sender": "tenant", "text": "Tiene una ubicación inmejorable. Gracias por los datos."}
        ]
    },
    {
        "topic": "nudge_conversion_dialogue",
        "category": "FLUJO_CONVERSION_NUDGE",
        "messages": [
            {"sender": "tenant", "text": "Buenas, me gusta mucho la distribución del piso. ¿La cama de la habitación es individual o doble?"},
            {"sender": "host", "text": "Hola. Es una cama de 135x190 con colchón viscoelástico nuevo a estrenar y canapé abatible para guardar maletas debajo."},
            {"sender": "tenant", "text": "¿Y el armario es empotrado o exterior?"},
            {"sender": "host", "text": "Es un armario empotrado de tres cuerpos de suelo a techo, con cajonera y altillo."},
            # Al enviar el siguiente mensaje de usuario se superan los 4 mensajes y el backend inyectará el NUDGE
            {"sender": "tenant", "text": "Genial, la capacidad de almacenaje era justo lo que más me preocupaba."},
            {"sender": "host", "text": "Nos gusta que los inquilinos tengan espacio suficiente. Si te convence, puedes solicitar la reserva para que no se te adelante nadie."}
        ]
    },
    {
        "topic": "pending_inquiry_unread",
        "category": "CONSULTA_PENDIENTE_NO_LEIDA",
        "messages": [
            {"sender": "tenant", "text": "Hola! He visto tu anuncio y me parece una gran opción. ¿Sería posible hacer una videollamada corta o visita previa este jueves para conocer a los compañeros?"},
            {"sender": "tenant", "text": "Disculpa la insistencia, es que tengo un par de opciones y esta es mi preferida. Si estás disponible por la tarde me vendría perfecto."}
        ]
    }
]

# Mensajes individuales para variedad adicional en conversaciones dinámicas
EXTRA_TENANT_QUESTIONS = [
    "¿Hay disponibilidad de lavadora y espacio para tender la ropa al aire libre?",
    "¿Qué tal es la iluminación natural en las horas de tarde?",
    "¿El edificio dispone de ascensor en funcionamiento?",
    "¿Hay posibilidad de empadronarse durante la estancia para trámites de residencia?",
    "¿Se puede fumar en el balcón o la vivienda es 100% libre de humos?",
    "¿Las puertas de las habitaciones disponen de cerradura individual con llave?",
    "¿Se pueden guardar maletas grandes en algún trastero comunitario?",
    "¿Hay buen ambiente de estudio en la casa durante época de exámenes?",
]

EXTRA_HOST_ANSWERS = [
    "Sí, hay lavadora de 8kg en la galería y un tendedero exterior cubierto muy práctico.",
    "La orientación es este-oeste, por lo que entra muchísima luz durante todo el día.",
    "Sí, el edificio tiene ascensor a cota cero reformado recientemente.",
    "Por supuesto, facilitamos el contrato legal de arrendamiento para el trámite de empadronamiento.",
    "El piso es 100% libre de humos en todas las estancias interiores por acuerdo de los convivientes.",
    "Cada habitación cuenta con su propia cerradura y juego de llaves independiente para total privacidad.",
    "Tenemos un pequeño altillo en el pasillo habilitado para dejar maletas sin ocupar espacio en la habitación.",
    "Totalmente, todos los compañeros están en época de entrega de proyectos o trabajando y se respeta el silencio.",
]
