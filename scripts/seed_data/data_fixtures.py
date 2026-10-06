#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
data_fixtures.py — Large-Scale Realistic Datasets for Colivi Production-Grade Seeding
"""

# ── 1. Administradores ────────────────────────────────────────────────
ADMIN_USERS = [
    {
        "email": "victor@colivi.com",
        "password": "password123",
        "nickname": "victor_admin",
        "firstName": "Victor",
        "lastName1": "Admin",
        "lastName2": "Colivi",
        "phone": "+34600123456",
        "role": "ADMIN",
    },
    {
        "email": "admin@gmail.com",
        "password": "AdminContrasena1",
        "nickname": "admin",
        "firstName": "Administrador",
        "lastName1": "Sistema",
        "lastName2": "Colivi",
        "phone": "+34600000000",
        "role": "ADMIN",
    },
    {
        "email": "moderador@colivi.es",
        "password": "Moderador123!",
        "nickname": "moderador_colivi",
        "firstName": "Elena",
        "lastName1": "Vázquez",
        "lastName2": "Mora",
        "phone": "+34600000099",
        "role": "ADMIN",
    },
]

# ── 2. Catálogo de Usuarios Regulares (50 Perfiles Realistas) ──────────
USERS_DATA = [
    # ── Madrid (10 Usuarios) ───────────────────────────────────────────
    {
        "email": "carlos.gomez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "carlos_gomez", "firstName": "Carlos", "lastName1": "Gómez", "lastName2": "Ruiz",
        "phone": "+34611000001", "city": "Madrid",
        "bio": "Ingeniero de software en fintech. Ordenado, tranquilo y apasionado del pádel y la cocina.",
    },
    {
        "email": "sofia.morales@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "sofia_morales", "firstName": "Sofía", "lastName1": "Morales", "lastName2": "Vega",
        "phone": "+34611000002", "city": "Madrid",
        "bio": "Estudiante de 4º de Medicina en la UCM. Horarios intensos pero siempre dispuesta a compartir un té.",
    },
    {
        "email": "alejandro.romero@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "alex_romero", "firstName": "Alejandro", "lastName1": "Romero", "lastName2": "Gil",
        "phone": "+34611000003", "city": "Madrid",
        "bio": "Diseñador de producto digital. Teletrabajo 3 días por semana. Amante del café de especialidad.",
    },
    {
        "email": "mario.campos@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "mario_campos", "firstName": "Mario", "lastName1": "Campos", "lastName2": "León",
        "phone": "+34611000004", "city": "Madrid",
        "bio": "Consultor estratégico. Muy limpio y respetuoso con los espacios comunes.",
    },
    {
        "email": "beatriz.navas@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "bea_navas", "firstName": "Beatriz", "lastName1": "Navas", "lastName2": "Paredes",
        "phone": "+34611000005", "city": "Madrid",
        "bio": "Abogada laboralista. Lectora compulsiva, aficionada a las plantas y a la repostería.",
    },
    {
        "email": "lucas.ibanez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "lucas_iba", "firstName": "Lucas", "lastName1": "Ibáñez", "lastName2": "García",
        "phone": "+34611000006", "city": "Madrid",
        "bio": "Estudiante de Máster en Inteligencia Artificial en la UPM. Amante de la escalada.",
    },
    {
        "email": "clara.vargas@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "clara_vargas", "firstName": "Clara", "lastName1": "Vargas", "lastName2": "Soto",
        "phone": "+34611000007", "city": "Madrid",
        "bio": "Arquitecta de interiores. Me encanta diseñar espacios acogedores y compartir charlas en el salón.",
    },
    {
        "email": "diego.cordero@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "diego_cordero", "firstName": "Diego", "lastName1": "Cordero", "lastName2": "Valle",
        "phone": "+34611000008", "city": "Madrid",
        "bio": "Periodista deportivo. Viajo los fines de semana cubriendo partidos. Muy sociable.",
    },
    {
        "email": "valeria.prieto@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "valeria_p", "firstName": "Valeria", "lastName1": "Prieto", "lastName2": "Méndez",
        "phone": "+34611000009", "city": "Madrid",
        "bio": "Investigadora en biotecnología farmacéutica. Fanática del cine independiente y el yoga.",
    },
    {
        "email": "guillermo.alvarez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "guille_alvarez", "firstName": "Guillermo", "lastName1": "Álvarez", "lastName2": "Cano",
        "phone": "+34611000010", "city": "Madrid",
        "bio": "Propietario y gestor de espacios coliving en Chamberí y Malasaña.",
    },

    # ── Barcelona (8 Usuarios) ──────────────────────────────────────────
    {
        "email": "laura.navarro@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "laura_navarro", "firstName": "Laura", "lastName1": "Navarro", "lastName2": "Sanz",
        "phone": "+34622000001", "city": "Barcelona",
        "bio": "Arquitecta y paisajista. Me encanta la vida comunitaria y el diseño sostenible.",
    },
    {
        "email": "lucia.dominguez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "lucia_dom", "firstName": "Lucía", "lastName1": "Domínguez", "lastName2": "Blanco",
        "phone": "+34622000002", "city": "Barcelona",
        "bio": "Growth Marketer en startup. Yoga mañanero y cenas compartidas de fin de semana.",
    },
    {
        "email": "pablo.ortiz@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "pablo_ortiz", "firstName": "Pablo", "lastName1": "Ortiz", "lastName2": "Serrano",
        "phone": "+34622000003", "city": "Barcelona",
        "bio": "Postdoc en Física Cuántica en la UPC. Silencioso, ordenado y jugador de ajedrez.",
    },
    {
        "email": "andrea.pascual@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "andrea_pascual", "firstName": "Andrea", "lastName1": "Pascual", "lastName2": "Reyes",
        "phone": "+34622000004", "city": "Barcelona",
        "bio": "Product Manager. Música indie, cine en VOSE y explorar cafeterías en Gràcia.",
    },
    {
        "email": "marc.casals@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "marc_casals", "firstName": "Marc", "lastName1": "Casals", "lastName2": "Font",
        "phone": "+34622000005", "city": "Barcelona",
        "bio": "Desarrollador iOS freelance. Fan del paddle surf en la Barceloneta y los festivales.",
    },
    {
        "email": "mireia.puig@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "mireia_puig", "firstName": "Mireia", "lastName1": "Puig", "lastName2": "Soler",
        "phone": "+34622000006", "city": "Barcelona",
        "bio": "Diseñadora de moda sostenible. Creativa, ordenada y amante de los mercadillos vintage.",
    },
    {
        "email": "oriol.rovira@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "oriol_rovira", "firstName": "Oriol", "lastName1": "Rovira", "lastName2": "Vila",
        "phone": "+34622000007", "city": "Barcelona",
        "bio": "Consultor ambiental. Amante del senderismo en Collserola y la cocina vegetariana.",
    },
    {
        "email": "gemma.ferre@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "gemma_ferre", "firstName": "Gemma", "lastName1": "Ferré", "lastName2": "Mas",
        "phone": "+34622000008", "city": "Barcelona",
        "bio": "Psicóloga clínica e investigadora. Tranquila, empática y gran conversadora.",
    },

    # ── Valencia (6 Usuarios) ───────────────────────────────────────────
    {
        "email": "miguel.fernandez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "miguel_fernandez", "firstName": "Miguel", "lastName1": "Fernández", "lastName2": "Pérez",
        "phone": "+34633000001", "city": "Valencia",
        "bio": "Diseñador gráfico freelance e ilustrador. Siempre con música ambiente en casa y muy sociable.",
    },
    {
        "email": "carmen.delgado@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "carmen_delgado", "firstName": "Carmen", "lastName1": "Delgado", "lastName2": "Marín",
        "phone": "+34633000002", "city": "Valencia",
        "bio": "Máster en Biotecnología en la UPV. Bici por el Turia y paellas los domingos.",
    },
    {
        "email": "javier.ramos@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "javi_ramos", "firstName": "Javier", "lastName1": "Ramos", "lastName2": "Ibáñez",
        "phone": "+34633000003", "city": "Valencia",
        "bio": "Desarrollador Frontend. Escalada deportiva y paseos por la playa de la Malvarrosa.",
    },
    {
        "email": "ainoa.garrido@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "ainoa_garrido", "firstName": "Ainoa", "lastName1": "Garrido", "lastName2": "Lledó",
        "phone": "+34633000004", "city": "Valencia",
        "bio": "Fotógrafa y community manager en agencias de eventos. Dinámica y alegre.",
    },
    {
        "email": "sergi.marti@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "sergi_marti", "firstName": "Sergi", "lastName1": "Martí", "lastName2": "Beltrán",
        "phone": "+34633000005", "city": "Valencia",
        "bio": "Ingeniero agrónomo. Fanático de las plantas y los huertos urbanos.",
    },
    {
        "email": "laia.salvador@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "laia_salvador", "firstName": "Laia", "lastName1": "Salvador", "lastName2": "Rios",
        "phone": "+34633000006", "city": "Valencia",
        "bio": "Estudiante de Bellas Artes y tatuadora. Muy respetuosa y ordenada.",
    },

    # ── Sevilla (5 Usuarios) ────────────────────────────────────────────
    {
        "email": "david.torres@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "david_torres", "firstName": "David", "lastName1": "Torres", "lastName2": "Mora",
        "phone": "+34644000001", "city": "Sevilla",
        "bio": "Propietario de alojamientos en Triana y Nervión. Calidad y transparencia ante todo.",
    },
    {
        "email": "sara.iglesias@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "sara_iglesias", "firstName": "Sara", "lastName1": "Iglesias", "lastName2": "Cruz",
        "phone": "+34644000002", "city": "Sevilla",
        "bio": "Guía turística e historiadora del arte. Apasionada de la historia sevillana y la gastronomía.",
    },
    {
        "email": "daniel.medina@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "dani_medina", "firstName": "Daniel", "lastName1": "Medina", "lastName2": "Cano",
        "phone": "+34644000003", "city": "Sevilla",
        "bio": "Data Analyst en energías renovables. Ordenado y aficionado al running.",
    },
    {
        "email": "rocio.benitez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "rocio_benitez", "firstName": "Rocío", "lastName1": "Benítez", "lastName2": "Lara",
        "phone": "+34644000004", "city": "Sevilla",
        "bio": "Estudiante de Traducción e Interpretación. Muy alegre y fan de la guitarra clásica.",
    },
    {
        "email": "gonzalo.valero@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "gonzalo_valero", "firstName": "Gonzalo", "lastName1": "Valero", "lastName2": "Estévez",
        "phone": "+34644000005", "city": "Sevilla",
        "bio": "Veterinario clínico. Respetuoso, amante de los perros y de la tranquilidad del hogar.",
    },

    # ── Granada (4 Usuarios) ────────────────────────────────────────────
    {
        "email": "elena.sanchez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "elena_sanchez", "firstName": "Elena", "lastName1": "Sánchez", "lastName2": "Castillo",
        "phone": "+34655000001", "city": "Granada",
        "bio": "Profesora en la UGR. Senderismo en Sierra Nevada, té moruno y ambiente universitario.",
    },
    {
        "email": "alvaro.herrera@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "alvaro_herrera", "firstName": "Álvaro", "lastName1": "Herrera", "lastName2": "Santos",
        "phone": "+34655000002", "city": "Granada",
        "bio": "Estudiante de Filología y Lenguas Modernas. Hablo 4 idiomas y me encanta viajar.",
    },
    {
        "email": "nuria.castro@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "nuria_castro", "firstName": "Nuria", "lastName1": "Castro", "lastName2": "Vidal",
        "phone": "+34655000003", "city": "Granada",
        "bio": "Ceramista y creadora visual. Casa llena de plantas y cenas compartidas.",
    },
    {
        "email": "ignacio.solis@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "nacho_solis", "firstName": "Ignacio", "lastName1": "Solís", "lastName2": "Gimeno",
        "phone": "+34655000004", "city": "Granada",
        "bio": "Estudiante de Farmacia en el Campus Cartuja. Muy limpio y aficionado al esquí.",
    },

    # ── Málaga (4 Usuarios) ─────────────────────────────────────────────
    {
        "email": "hugo.pena@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "hugo_pena", "firstName": "Hugo", "lastName1": "Peña", "lastName2": "Gallego",
        "phone": "+34666000001", "city": "Málaga",
        "bio": "Fullstack Engineer para empresa tech de Londres. Surf y ambiente internacional.",
    },
    {
        "email": "paula.rivas@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "paula_rivas", "firstName": "Paula", "lastName1": "Rivas", "lastName2": "Soto",
        "phone": "+34666000002", "city": "Málaga",
        "bio": "HR Specialist en multinacional. Muy comunicativa y amante de la playa.",
    },
    {
        "email": "raul.mateo@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "raul_mateo", "firstName": "Raúl", "lastName1": "Mateo", "lastName2": "Cano",
        "phone": "+34666000003", "city": "Málaga",
        "bio": "Desarrollador backend en Python/Django. Amante de los videojuegos retro.",
    },
    {
        "email": "estela.bernal@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "estela_bernal", "firstName": "Estela", "lastName1": "Bernal", "lastName2": "Quero",
        "phone": "+34666000004", "city": "Málaga",
        "bio": "Profesora de idiomas para extranjeros. Amante de la gastronomía marinera.",
    },

    # ── Bilbao (4 Usuarios) ─────────────────────────────────────────────
    {
        "email": "marcos.molina@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "marcos_molina", "firstName": "Marcos", "lastName1": "Molina", "lastName2": "Cabrera",
        "phone": "+34677000001", "city": "Bilbao",
        "bio": "Ingeniero industrial en automoción. Montaña, gastronomía y pintxos.",
    },
    {
        "email": "irene.fuentes@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "irene_fuentes", "firstName": "Irene", "lastName1": "Fuentes", "lastName2": "Pastor",
        "phone": "+34677000002", "city": "Bilbao",
        "bio": "Periodista cultural. Museos, literatura y paseos por la ría.",
    },
    {
        "email": "unai.etxebarria@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "unai_etxe", "firstName": "Unai", "lastName1": "Etxebarria", "lastName2": "Bilbao",
        "phone": "+34677000003", "city": "Bilbao",
        "bio": "Estudiante de Ingeniería Náutica en Deusto. Amante del surf en Mundaka.",
    },
    {
        "email": "maite.larrea@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "maite_larrea", "firstName": "Maite", "lastName1": "Larrea", "lastName2": "Goiko",
        "phone": "+34677000004", "city": "Bilbao",
        "bio": "Enfermera en Hospital de Cruces. Turnos rotativos, muy ordenada y tranquila.",
    },

    # ── Salamanca (3 Usuarios) ──────────────────────────────────────────
    {
        "email": "sergio.aguilar@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "sergio_aguilar", "firstName": "Sergio", "lastName1": "Aguilar", "lastName2": "Lozano",
        "phone": "+34688000001", "city": "Salamanca",
        "bio": "Doble Grado Derecho y ADE en la USAL. Ordenado, responsable y deportista.",
    },
    {
        "email": "marta.ortiz@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "marta_ortiz", "firstName": "Marta", "lastName1": "Ortiz", "lastName2": "Benítez",
        "phone": "+34688000002", "city": "Salamanca",
        "bio": "Estudiante de Filología Hispánica. Ambiente histórico y cine clásico.",
    },
    {
        "email": "pablo.montero@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "pablo_montero", "firstName": "Pablo", "lastName1": "Montero", "lastName2": "Lucas",
        "phone": "+34688000003", "city": "Salamanca",
        "bio": "Estudiante de Medicina en el Campus Unamuno. Metódico y sociable.",
    },

    # ── Zaragoza (2 Usuarios) ───────────────────────────────────────────
    {
        "email": "gonzalo.cruz@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "gonzalo_cruz", "firstName": "Gonzalo", "lastName1": "Cruz", "lastName2": "Santana",
        "phone": "+34699000001", "city": "Zaragoza",
        "bio": "Veterinario clínico. Ciclismo de montaña y Pirineos.",
    },
    {
        "email": "lucia.sancho@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "lucia_sancho", "firstName": "Lucía", "lastName1": "Sancho", "lastName2": "Aragón",
        "phone": "+34699000002", "city": "Zaragoza",
        "bio": "Ingeniera de telecomunicaciones. Teletrabajadora y gran cocinera.",
    },

    # ── Alicante (2 Usuarios) ───────────────────────────────────────────
    {
        "email": "valeria.gimenez@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "valeria_gimenez", "firstName": "Valeria", "lastName1": "Giménez", "lastName2": "Rubio",
        "phone": "+34699000003", "city": "Alicante",
        "bio": "Fotógrafa y videógrafa documental. Temporadas largas en la costa mediterránea.",
    },
    {
        "email": "joaquin.soler@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "joaquin_soler", "firstName": "Joaquín", "lastName1": "Soler", "lastName2": "Miralles",
        "phone": "+34699000004", "city": "Alicante",
        "bio": "Capitán de yate y patrón de barco. Amante de la navegación y el mar.",
    },

    # ── San Sebastián y Santander (2 Usuarios) ──────────────────────────
    {
        "email": "leire.arizmendi@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "leire_ariz", "firstName": "Leire", "lastName1": "Arizmendi", "lastName2": "Urkixo",
        "phone": "+34677000005", "city": "San Sebastián",
        "bio": "Cocinera profesional en alta gastronomía vasca. Amante del surf en La Zurriola.",
    },
    {
        "email": "fernando.revilla@gmail.com", "password": "UsuarioContrasena1",
        "nickname": "fer_revilla", "firstName": "Fernando", "lastName1": "Revilla", "lastName2": "Pardo",
        "phone": "+34677000006", "city": "Santander",
        "bio": "Biólogo marino en el Instituto Oceanográfico. Muy tranquilo y amante de la naturaleza.",
    },
]

# ── 3. Ubicaciones Clusterizadas (36 Alojamientos en 11 Capitales) ─────
ACCOMMODATIONS_LOCATIONS = [
    # ── Madrid: Sol / Centro (Cluster 1)
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle Mayor 14, 3º Izquierda",
        "latitude": 40.4168, "longitude": -3.7038, "name_hint": "Sol / Plaza Mayor",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 120,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY", "DISHWASHER"],
        "listings": [
            {"title": "Habitación Premium con Balcón a Calle Mayor", "description": "Luminosa habitación exterior con balcón privado a Calle Mayor. Cama doble viscoelástica, escritorio y climatización.", "price": 680, "deposit": 680, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Confort Interior Silenciosa en Sol", "description": "Habitación interior muy tranquila ideal para estudiantes opositores o que busquen concentración total.", "price": 540, "deposit": 540, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle del Arenal 8, 2º B",
        "latitude": 40.4168, "longitude": -3.7038, "name_hint": "Sol / Arenal",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 85,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "WASHING_MACHINE"],
        "listings": [
            {"title": "Piso Completo Reformado en Puerta del Sol", "description": "Exclusivo apartamento completo de 3 dormitorios y salón diáfano con cocina americana.", "price": 1950, "deposit": 1950, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle Montera 32, 4º Derecha",
        "latitude": 40.4180, "longitude": -3.7020, "name_hint": "Gran Vía / Montera",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 110,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "WORK_ZONE"],
        "listings": [
            {"title": "Habitación Luminosa a pasos de Gran Vía", "description": "Excelente habitación equipada con escritorio ergonómico, wifi 1Gbps y aire acondicionado.", "price": 620, "deposit": 620, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Madrid: Moncloa / Argüelles (Cluster 2)
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle de la Princesa 28, 5º A",
        "latitude": 40.4300, "longitude": -3.7150, "name_hint": "Moncloa / Princesa",
        "rooms": 5, "free_rooms": 3, "baths": 2, "sqm": 150,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "WORK_ZONE", "BALCONY", "WASHING_MACHINE"],
        "listings": [
            {"title": "Habitación Universitaria Moncloa - Hab 1", "description": "Habitación pensada para universitarios de Ciudad Universitaria (UCM, UPM, Comillas).", "price": 590, "deposit": 590, "rentalType": "ROOM", "promoted": False},
            {"title": "Habitación Universitaria Moncloa - Hab 2", "description": "Segunda habitación amplia en piso compartido de estudiantes internacionales.", "price": 610, "deposit": 610, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle Alberto Aguilera 12, 1º Derecha",
        "latitude": 40.4300, "longitude": -3.7150, "name_hint": "Argüelles / ICADE",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "TERRACE"],
        "listings": [
            {"title": "Habitación Doble junto a ICADE y Metro San Bernardo", "description": "Excelente habitación doble en piso señorial con terraza comunitaria.", "price": 650, "deposit": 650, "rentalType": "ROOM", "promoted": True}
        ]
    },

    # ── Madrid: Malasaña y Chamberí (Cluster 3)
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle del Pez 22, 4º C",
        "latitude": 40.4260, "longitude": -3.7020, "name_hint": "Malasaña / Dos de Mayo",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 90,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "BALCONY", "PETS_ALLOWED"],
        "listings": [
            {"title": "Ático Bohemio en el Corazón de Malasaña", "description": "Ático luminoso con vigas de madera vistas, balcón y cocina moderna.", "price": 1700, "deposit": 1700, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle de Santa Engracia 54, 2º A",
        "latitude": 40.4350, "longitude": -3.7000, "name_hint": "Chamberí / Olavide",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 130,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY", "DISHWASHER"],
        "listings": [
            {"title": "Habitación Amplia en Barrio Residencial de Chamberí", "description": "Finca señorial con conserje y ascensor. Barrio seguro, lleno de vida y terrazas.", "price": 640, "deposit": 640, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Barcelona: Eixample Esquerra (Cluster 4)
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer de Provença 215, Principal 2ª",
        "latitude": 41.3935, "longitude": 2.1610, "name_hint": "Eixample / Passeig de Gràcia",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 135,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY", "DISHWASHER"],
        "listings": [
            {"title": "Habitación Señorial con Techos Altos en Eixample", "description": "Espectacular habitación en finca modernista con suelo hidráulico y molduras originales.", "price": 750, "deposit": 750, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Suite con Baño Semiprivado Eixample", "description": "Habitación grande con acceso a baño casi exclusivo. Muy tranquila.", "price": 820, "deposit": 820, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer de Mallorca 190, 3º 1ª",
        "latitude": 41.3935, "longitude": 2.1610, "name_hint": "Eixample / Enric Granados",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 105,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "TERRACE", "WORK_ZONE"],
        "listings": [
            {"title": "Piso Completo en Carrer de Mallorca junto a Enric Granados", "description": "Piso de 3 habitaciones reformado con terraza privada de 15m².", "price": 2400, "deposit": 2400, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer d'Aragó 280, 4º 2ª",
        "latitude": 41.3950, "longitude": 2.1650, "name_hint": "Eixample Dreta / Girona",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 125,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY"],
        "listings": [
            {"title": "Habitación Doble en Finca Regia Eixample Dreta", "description": "Amplia habitación exterior con cama king size, escritorio y armario doble.", "price": 710, "deposit": 710, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Barcelona: Gràcia y Poblenou (Cluster 5)
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer de Verdi 45, 2º 1ª",
        "latitude": 41.4020, "longitude": 2.1570, "name_hint": "Vila de Gràcia",
        "rooms": 4, "free_rooms": 2, "baths": 1, "sqm": 95,
        "amenities": ["WIFI", "HEATING", "BALCONY", "PETS_ALLOWED", "WASHING_MACHINE"],
        "listings": [
            {"title": "Habitación Artística en el Pintoresco Barrio de Gràcia", "description": "Habitación en piso compartido de creadores. Cerca de cines Verdi.", "price": 670, "deposit": 670, "rentalType": "ROOM", "promoted": False}
        ]
    },
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer de Pujades 120, 5º 1ª",
        "latitude": 41.3980, "longitude": 2.1950, "name_hint": "Poblenou / 22@",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 110,
        "amenities": ["WIFI", "AIR_CONDITIONING", "ELEVATOR", "TERRACE", "WORK_ZONE", "SWIMMING_POOL"],
        "listings": [
            {"title": "Habitación Suite con Vistas al Mar Poblenou", "description": "Luminosa habitación exterior en finca moderna con piscina comunitaria en azotea.", "price": 850, "deposit": 850, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Individual en Coliving Tech Poblenou", "description": "Habitación con escritorio para teletrabajo a 8 minutos de la playa de Bogatell.", "price": 740, "deposit": 740, "rentalType": "ROOM", "promoted": True}
        ]
    },

    # ── Valencia: Ruzafa y El Carmen (Cluster 6)
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Carrer de Sueca 34, 2º 4ª",
        "latitude": 39.4625, "longitude": -0.3735, "name_hint": "Ruzafa Centro",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 110,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "BALCONY", "ELEVATOR", "DISHWASHER"],
        "listings": [
            {"title": "Habitación Coliving en el Barrio de Moda (Ruzafa)", "description": "Habitación moderna y completamente equipada en el epicentro cultural de Valencia.", "price": 490, "deposit": 490, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Doble Soleada con Escritorio en Ruzafa", "description": "Gran ventanal, escritorio de 140cm y armario de tres puertas. Gastos incluidos.", "price": 520, "deposit": 520, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Carrer de Cadis 18, 3º Puerta 6",
        "latitude": 39.4625, "longitude": -0.3735, "name_hint": "Ruzafa / Mercado",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 90,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY", "TERRACE", "WASHING_MACHINE"],
        "listings": [
            {"title": "Piso con Terraza Privada en Calle Cádiz (Ruzafa)", "description": "Fantástica vivienda con terraza privativa de 20m² orientada al sur.", "price": 1450, "deposit": 1450, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Carrer dels Cavallers 24, 2º Izquierda",
        "latitude": 39.4760, "longitude": -0.3780, "name_hint": "El Carmen Histórico",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 95,
        "amenities": ["WIFI", "BALCONY", "HEATING", "AIR_CONDITIONING"],
        "listings": [
            {"title": "Piso Histórico con Techos de Madera en El Carmen", "description": "Vivienda bohemia en el centro histórico, junto a la Plaza del Tossal.", "price": 1350, "deposit": 1350, "rentalType": "ENTIRE_PLACE", "promoted": False}
        ]
    },

    # ── Valencia: Benimaclet / Universidades (Cluster 7)
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Carrer d'Emili Baró 26, 4º C",
        "latitude": 39.4880, "longitude": -0.3580, "name_hint": "Benimaclet / UPV",
        "rooms": 5, "free_rooms": 3, "baths": 2, "sqm": 130,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "WORK_ZONE", "BALCONY"],
        "listings": [
            {"title": "Habitación para Estudiantes UPV / UV en Benimaclet", "description": "A 10 minutos a pie del campus de Vera y Blasco Ibáñez. Metro en la puerta.", "price": 420, "deposit": 420, "rentalType": "ROOM", "promoted": False},
            {"title": "Habitación Económica en Piso Compartido Benimaclet", "description": "Habitación individual con luz natural y gastos compartidos reducidos.", "price": 380, "deposit": 380, "rentalType": "ROOM", "promoted": False},
        ]
    },

    # ── Sevilla: Triana y Alameda (Cluster 8)
    {
        "city": "Sevilla", "province": "Sevilla", "country": "España",
        "address": "Calle San Jacinto 62, 2º A",
        "latitude": 37.3830, "longitude": -6.0025, "name_hint": "Triana / Peatonal",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 125,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY", "ELEVATOR"],
        "listings": [
            {"title": "Habitación Tradicional Sevillana en Calle San Jacinto", "description": "Habitación luminosa en finca clásica trianera con patio andaluz.", "price": 460, "deposit": 460, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Doble Exterior con Balcón en Triana", "description": "Balcón a la calle principal, cama de matrimonio y espacio de almacenaje.", "price": 500, "deposit": 500, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Sevilla", "province": "Sevilla", "country": "España",
        "address": "Calle Betis 19, 1º B",
        "latitude": 37.3830, "longitude": -6.0025, "name_hint": "Triana / Betis con Vistas",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 100,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "TERRACE", "DISHWASHER"],
        "listings": [
            {"title": "Piso Exclusivo en Calle Betis con Vistas a la Giralda", "description": "Inmueble singular con panorámica al río Guadalquivir y la Torre del Oro.", "price": 1850, "deposit": 1850, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Sevilla", "province": "Sevilla", "country": "España",
        "address": "Alameda de Hércules 38, 3º C",
        "latitude": 37.3990, "longitude": -5.9930, "name_hint": "Alameda de Hércules",
        "rooms": 4, "free_rooms": 2, "baths": 1, "sqm": 105,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY", "PETS_ALLOWED"],
        "listings": [
            {"title": "Habitación en la Bohemia Alameda de Hércules", "description": "Piso rodeado de vida cultural, cafeterías, librerías y ambiente juvenil.", "price": 440, "deposit": 440, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Granada: Realejo y Centro (Cluster 9)
    {
        "city": "Granada", "province": "Granada", "country": "España",
        "address": "Calle Recogidas 22, 3º Derecha",
        "latitude": 37.1725, "longitude": -3.6020, "name_hint": "Centro / Recogidas",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 110,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY"],
        "listings": [
            {"title": "Habitación Amplia en Pleno Centro de Granada", "description": "Cama grande, mesa de estudio y armario empotrado. Calefacción central.", "price": 390, "deposit": 390, "rentalType": "ROOM", "promoted": False},
            {"title": "Habitación Doble en Piso Universitario Recogidas", "description": "Piso compartido con compañeros de Derecho y Traducción. Muy buen ambiente.", "price": 410, "deposit": 410, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Granada", "province": "Granada", "country": "España",
        "address": "Calle San Matías 15, 2º A",
        "latitude": 37.1725, "longitude": -3.6020, "name_hint": "Realejo Histórico",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 85,
        "amenities": ["WIFI", "HEATING", "BALCONY", "TERRACE", "PETS_ALLOWED"],
        "listings": [
            {"title": "Casa Típica en el Realejo con Terraza y Vistas a la Alhambra", "description": "Vivienda con encanto en el barrio más auténtico de Granada.", "price": 1250, "deposit": 1250, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Granada", "province": "Granada", "country": "España",
        "address": "Calle Pedro Antonio de Alarcón 48, 4º B",
        "latitude": 37.1750, "longitude": -3.6080, "name_hint": "Pedro Antonio / Universidad",
        "rooms": 5, "free_rooms": 3, "baths": 2, "sqm": 135,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "WORK_ZONE"],
        "listings": [
            {"title": "Habitación Universitaria en Calle Pedro Antonio", "description": "A 5 minutos de la Facultad de Ciencias y del metro Recogidas.", "price": 360, "deposit": 360, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Málaga: Centro y Teatinos (Cluster 10)
    {
        "city": "Málaga", "province": "Málaga", "country": "España",
        "address": "Calle Larios 8, 3º B",
        "latitude": 36.7196, "longitude": -4.4200, "name_hint": "Centro / Calle Larios",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY", "ELEVATOR", "DISHWASHER"],
        "listings": [
            {"title": "Habitación Exclusiva en Calle Larios (Centro Málaga)", "description": "Habitación de lujo en la calle más icónica de Málaga con climatización.", "price": 720, "deposit": 720, "rentalType": "ROOM", "promoted": True}
        ]
    },
    {
        "city": "Málaga", "province": "Málaga", "country": "España",
        "address": "Avenida Plutarco 42, 4º C",
        "latitude": 36.7196, "longitude": -4.4700, "name_hint": "Teatinos / Campus UMA",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 120,
        "amenities": ["WIFI", "AIR_CONDITIONING", "SWIMMING_POOL", "PARKING", "TERRACE", "ELEVATOR"],
        "listings": [
            {"title": "Coliving con Piscina y Pádel en Teatinos", "description": "Urbanización privada con piscina comunitaria. A 5 min de las facultades.", "price": 480, "deposit": 480, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Individual en Residencial Teatinos", "description": "Luminosa con vistas a las zonas ajardinadas de la urbanización.", "price": 450, "deposit": 450, "rentalType": "ROOM", "promoted": False},
        ]
    },

    # ── Bilbao: Casco Viejo y Deusto (Cluster 11)
    {
        "city": "Bilbao", "province": "Vizcaya", "country": "España",
        "address": "Calle Somera 14, 2º Derecha",
        "latitude": 43.2570, "longitude": -2.9230, "name_hint": "Casco Viejo / Siete Calles",
        "rooms": 4, "free_rooms": 2, "baths": 1, "sqm": 100,
        "amenities": ["WIFI", "HEATING", "BALCONY", "WASHING_MACHINE"],
        "listings": [
            {"title": "Habitación en Piso Reformado del Casco Viejo de Bilbao", "description": "Aislamiento acústico completo y calefacción por gas natural. Ambiente joven.", "price": 510, "deposit": 510, "rentalType": "ROOM", "promoted": False}
        ]
    },
    {
        "city": "Bilbao", "province": "Vizcaya", "country": "España",
        "address": "Gran Vía de Don Diego López de Haro 38, 4º B",
        "latitude": 43.2625, "longitude": -2.9340, "name_hint": "Abando / Gran Vía",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 130,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "DISHWASHER", "WORK_ZONE"],
        "listings": [
            {"title": "Piso Señorial en Gran Vía de Bilbao junto a Plaza Moyúa", "description": "Amplio piso de 3 habitaciones con despacho y techos altos.", "price": 2100, "deposit": 2100, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },

    # ── Salamanca: Centro y Campus Unamuno (Cluster 12)
    {
        "city": "Salamanca", "province": "Salamanca", "country": "España",
        "address": "Calle Zamora 16, 3º Izquierda",
        "latitude": 40.9650, "longitude": -5.6640, "name_hint": "Salamanca Centro / Plaza Mayor",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "BALCONY", "WORK_ZONE"],
        "listings": [
            {"title": "Habitación para Universitarios USAL a 2 min de Plaza Mayor", "description": "Calefacción central, servicio de limpieza en zonas comunes y wifi de alta velocidad.", "price": 380, "deposit": 380, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Exterior Soleada en Calle Zamora", "description": "Balcón a calle peatonal, escritorio amplio, estanterías y silla de estudio.", "price": 400, "deposit": 400, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Salamanca", "province": "Salamanca", "country": "España",
        "address": "Paseo de San Vicente 52, 1º C",
        "latitude": 40.9620, "longitude": -5.6720, "name_hint": "Campus Unamuno / Hospitales",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 120,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "WORK_ZONE"],
        "listings": [
            {"title": "Habitación para Estudiantes de Medicina y Farmacia en Salamanca", "description": "Frente a las facultades del Campus Miguel de Unamuno. Muy tranquilo para estudiar.", "price": 370, "deposit": 370, "rentalType": "ROOM", "promoted": False}
        ]
    },

    # ── Zaragoza: Centro (Cluster 13)
    {
        "city": "Zaragoza", "province": "Zaragoza", "country": "España",
        "address": "Paseo de Sagasta 28, 3º A",
        "latitude": 41.6450, "longitude": -0.8850, "name_hint": "Centro / Sagasta",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 125,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY"],
        "listings": [
            {"title": "Habitación Suite con Balcón en Paseo Sagasta", "description": "Habitación espaciosa con terraza acristalada y armario empotrado.", "price": 450, "deposit": 450, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Luminosa en Paseo Sagasta", "description": "Habitación con escritorio y armario doble para estudiantes de UNIZAR.", "price": 390, "deposit": 390, "rentalType": "ROOM", "promoted": False},
        ]
    },

    # ── Madrid: Retiro y Barrio de Salamanca (Cluster 15)
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle de Menéndez Pelayo 35, 4º Derecha",
        "latitude": 40.4150, "longitude": -3.6780, "name_hint": "Retiro / Menéndez Pelayo",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 130,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY", "TERRACE"],
        "listings": [
            {"title": "Habitación Exclusiva Frente al Parque del Retiro", "description": "Vistas despejadas a los jardines del Retiro. Habitación exterior con cama doble, mesa de trabajo y baño privado.", "price": 750, "deposit": 750, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Espaciosa en Avenida de Menéndez Pelayo", "description": "Piso señorial con portero físico. Excelente comunicación con metro Ibiza y Atocha.", "price": 680, "deposit": 680, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle de Serrano 88, 3º Izquierda",
        "latitude": 40.4320, "longitude": -3.6870, "name_hint": "Salamanca / Serrano Milla de Oro",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "DISHWASHER", "WORK_ZONE"],
        "listings": [
            {"title": "Elegante Piso Completo en Calle Serrano", "description": "Vivienda de lujo reformada en el Barrio de Salamanca. 3 dormitorios y salón con luz natural.", "price": 2800, "deposit": 2800, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },
    {
        "city": "Madrid", "province": "Madrid", "country": "España",
        "address": "Calle de Lavapiés 18, 2º B",
        "latitude": 40.4110, "longitude": -3.7025, "name_hint": "Lavapiés / Embajadores",
        "rooms": 3, "free_rooms": 2, "baths": 1, "sqm": 80,
        "amenities": ["WIFI", "HEATING", "BALCONY", "PETS_ALLOWED", "WASHING_MACHINE"],
        "listings": [
            {"title": "Habitación Bohemia y Luminosa en Lavapiés", "description": "Piso moderno en barrio multicultural. Cerca de centros culturales como La Casa Encendida y Tabacalera.", "price": 530, "deposit": 530, "rentalType": "ROOM", "promoted": False},
            {"title": "Habitación Individual Tranquila en Lavapiés", "description": "Habitación interior silenciosa ideal para teletrabajar o estudiar en pleno centro.", "price": 480, "deposit": 480, "rentalType": "ROOM", "promoted": False},
        ]
    },

    # ── Barcelona: Born y Sarrià (Cluster 16)
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Passeig del Born 12, 3º 2ª",
        "latitude": 41.3855, "longitude": 2.1830, "name_hint": "El Born / Santa Maria del Mar",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 120,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "BALCONY", "DISHWASHER"],
        "listings": [
            {"title": "Habitación en Finca Histórica del Born", "description": "Habitación con balcón a Passeig del Born. Techos altos con vigas de madera y suelo hidráulico.", "price": 790, "deposit": 790, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Suite con Vestidor en El Born", "description": "Gran amplitud, armario empotrado y mesa de despacho. Ambiente internacional.", "price": 840, "deposit": 840, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Barcelona", "province": "Barcelona", "country": "España",
        "address": "Carrer Major de Sarrià 55, 1º 1ª",
        "latitude": 41.3995, "longitude": 2.1220, "name_hint": "Sarrià / Zona Universitaria",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 110,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "TERRACE", "PARKING"],
        "listings": [
            {"title": "Piso de 3 Dormitorios con Terraza en Sarrià", "description": "Piso residencial muy tranquilo en la zona alta de Barcelona. Cerca de ESADE, IQS y UIC.", "price": 2200, "deposit": 2200, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },

    # ── Valencia: El Cabanyal y Mestalla (Cluster 17)
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Carrer de la Reina 78, 1º Puerta 2",
        "latitude": 39.4670, "longitude": -0.3270, "name_hint": "El Cabanyal / Cerca de Playa",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "AIR_CONDITIONING", "BALCONY", "TERRACE", "WASHING_MACHINE"],
        "listings": [
            {"title": "Habitación con Terraza a 5 min de la Playa (Cabanyal)", "description": "Casa típica de pescadores restaurada con azulejos tradicionales. Terraza privada para desayunar al sol.", "price": 470, "deposit": 470, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Doble en Casa Típica del Cabanyal", "description": "Cama doble, aire acondicionado y escritorio. Parada de tranvía a 2 minutos.", "price": 440, "deposit": 440, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Valencia", "province": "Valencia", "country": "España",
        "address": "Avinguda d'Aragó 18, 5º Puerta 10",
        "latitude": 39.4710, "longitude": -0.3590, "name_hint": "Mestalla / Blasco Ibáñez",
        "rooms": 3, "free_rooms": 1, "baths": 1, "sqm": 95,
        "amenities": ["WIFI", "HEATING", "AIR_CONDITIONING", "ELEVATOR", "BALCONY"],
        "listings": [
            {"title": "Piso Completo Luminoso en Avenida Aragón", "description": "Vivienda completamente equipada junto a los jardines del Turia y las facultades de Blasco Ibáñez.", "price": 1390, "deposit": 1390, "rentalType": "ENTIRE_PLACE", "promoted": False}
        ]
    },

    # ── Sevilla: Nervión y Santa Cruz (Cluster 18)
    {
        "city": "Sevilla", "province": "Sevilla", "country": "España",
        "address": "Avenida de Eduardo Dato 44, 3º B",
        "latitude": 37.3820, "longitude": -5.9750, "name_hint": "Nervión / Gran Plaza",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 120,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "ELEVATOR", "BALCONY", "SWIMMING_POOL"],
        "listings": [
            {"title": "Habitación en Residencial con Piscina en Nervión", "description": "Urbanización cerrada con piscina y jardines. Metro Nervión y tranvía directos a la universidad.", "price": 480, "deposit": 480, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Exterior Soleada en Nervión", "description": "Cama de 135cm, armario empotrado y mesa de estudio ergonómica.", "price": 450, "deposit": 450, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Sevilla", "province": "Sevilla", "country": "España",
        "address": "Calle Mateos Gago 16, 2º Izquierda",
        "latitude": 37.3860, "longitude": -5.9900, "name_hint": "Barrio Santa Cruz / Giralda",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 90,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY", "TERRACE"],
        "listings": [
            {"title": "Apartamento Señorial con Vistas a la Giralda en Santa Cruz", "description": "Vivienda con encanto en pleno corazón monumental de Sevilla. Terraza comunitaria con vistas directas a la Catedral.", "price": 1650, "deposit": 1650, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },

    # ── San Sebastián y Santander (Cluster 19)
    {
        "city": "San Sebastián", "province": "Guipúzcoa", "country": "España",
        "address": "Calle Peña y Goñi 10, 2º Derecha",
        "latitude": 43.3235, "longitude": -1.9760, "name_hint": "Gros / Zurriola Surf",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 115,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "BALCONY", "WORK_ZONE"],
        "listings": [
            {"title": "Habitación Surfer Coliving en Gros a 100m de Zurriola", "description": "Piso con espacio para tablas de surf y neoprenos. Excelente ambiente joven y dinámico.", "price": 680, "deposit": 680, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Confortable en Gros Centro", "description": "Calefacción por suelo radiante y mesa de estudio para teletrabajo.", "price": 620, "deposit": 620, "rentalType": "ROOM", "promoted": False},
        ]
    },
    {
        "city": "Santander", "province": "Cantabria", "country": "España",
        "address": "Paseo de Pereda 22, 4º Izquierda",
        "latitude": 43.4620, "longitude": -3.8050, "name_hint": "Centro / Paseo de Pereda",
        "rooms": 3, "free_rooms": 1, "baths": 2, "sqm": 105,
        "amenities": ["WIFI", "HEATING", "ELEVATOR", "BALCONY", "DISHWASHER"],
        "listings": [
            {"title": "Piso con Vistas a la Bahía de Santander en Paseo de Pereda", "description": "Vistas inmejorables a la bahía y al Centro Botín. 3 habitaciones y amplio salón.", "price": 1550, "deposit": 1550, "rentalType": "ENTIRE_PLACE", "promoted": True}
        ]
    },

    # ── Palma de Mallorca (Cluster 20)
    {
        "city": "Palma de Mallorca", "province": "Baleares", "country": "España",
        "address": "Carrer de Santa Catalina 14, 2º 1ª",
        "latitude": 39.5710, "longitude": 2.6390, "name_hint": "Santa Catalina / Paseo Marítimo",
        "rooms": 4, "free_rooms": 2, "baths": 2, "sqm": 125,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY", "TERRACE", "DISHWASHER"],
        "listings": [
            {"title": "Habitación en Coliving Internacional Santa Catalina", "description": "Habitación luminosa en el barrio más cosmopolita de Palma. Muy cerca del Paseo Marítimo.", "price": 650, "deposit": 650, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación Doble con Balcón Privado en Palma", "description": "Climatización frío/calor, wifi de alta velocidad y cama de matrimonio.", "price": 590, "deposit": 590, "rentalType": "ROOM", "promoted": False},
        ]
    },

    # ── Córdoba (Cluster 21)
    {
        "city": "Córdoba", "province": "Córdoba", "country": "España",
        "address": "Calle Deanes 8, 1º B",
        "latitude": 37.8800, "longitude": -4.7800, "name_hint": "Judería / Mezquita",
        "rooms": 3, "free_rooms": 2, "baths": 1, "sqm": 90,
        "amenities": ["WIFI", "AIR_CONDITIONING", "HEATING", "BALCONY", "PETS_ALLOWED"],
        "listings": [
            {"title": "Habitación con Encanto Andaluz en la Judería de Córdoba", "description": "Patio andaluz con flores y fuentes. Habitación silenciosa junto a la Mezquita Catedral.", "price": 380, "deposit": 380, "rentalType": "ROOM", "promoted": True},
            {"title": "Habitación para Estudiantes UCO en Centro de Córdoba", "description": "A 10 minutos a pie de la estación de tren y facultades. Muy económica.", "price": 340, "deposit": 340, "rentalType": "ROOM", "promoted": False},
        ]
    },
]

# ── 4. Hogares (10 Hogares de Convivencia con 60+ Gastos y 25+ Pagos) ─
HOMES_DATA = [
    {
        "name": "Piso Moncloa - Los 4 Fantásticos",
        "city": "Madrid",
        "creator_email": "carlos.gomez@gmail.com",
        "member_emails": [
            "sofia.morales@gmail.com",
            "alejandro.romero@gmail.com",
            "mario.campos@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra mensual Mercadona (Básicos y droguería)", "amount": 184.60, "payer": "carlos.gomez@gmail.com"},
            {"desc": "Factura Luz Iberdrola Enero", "amount": 112.40, "payer": "sofia.morales@gmail.com"},
            {"desc": "Fibra Digi 1Gbps + WiFi 6", "amount": 30.00, "payer": "alejandro.romero@gmail.com"},
            {"desc": "Kit sartenes Tefal y cafetera italiana", "amount": 65.90, "payer": "carlos.gomez@gmail.com"},
            {"desc": "Pizzas Grosso Napoletano cena bienvenida", "amount": 54.00, "payer": "mario.campos@gmail.com"},
            {"desc": "Reparación fontanero grifo cocina", "amount": 80.00, "payer": "sofia.morales@gmail.com"},
            {"desc": "Compra Carrefour segunda quincena", "amount": 145.20, "payer": "carlos.gomez@gmail.com"},
            {"desc": "Pack papel higiénico y detergente Costco", "amount": 42.50, "payer": "alejandro.romero@gmail.com"},
        ],
        "payments": [
            {"from": "sofia.morales@gmail.com", "to": "carlos.gomez@gmail.com", "amount": 46.15, "notes": "Bizum parte Mercadona"},
            {"from": "alejandro.romero@gmail.com", "to": "carlos.gomez@gmail.com", "amount": 46.15, "notes": "Bizum parte Mercadona"},
            {"from": "mario.campos@gmail.com", "to": "sofia.morales@gmail.com", "amount": 28.10, "notes": "Liquidación luz Iberdrola"},
            {"from": "mario.campos@gmail.com", "to": "carlos.gomez@gmail.com", "amount": 36.30, "notes": "Ajuste compra Carrefour"},
        ],
    },
    {
        "name": "Eixample Tech Coliving",
        "city": "Barcelona",
        "creator_email": "laura.navarro@gmail.com",
        "member_emails": [
            "lucia.dominguez@gmail.com",
            "pablo.ortiz@gmail.com",
            "andrea.pascual@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra conjunta BonÀrea + Frutería", "amount": 142.80, "payer": "laura.navarro@gmail.com"},
            {"desc": "Recibo Gas Natural Endesa", "amount": 95.50, "payer": "pablo.ortiz@gmail.com"},
            {"desc": "Internet Fibra Movistar Pro 1Gbps", "amount": 45.00, "payer": "lucia.dominguez@gmail.com"},
            {"desc": "Suscripción Netflix 4K + Spotify Familia", "amount": 32.00, "payer": "andrea.pascual@gmail.com"},
            {"desc": "Café de especialidad en grano Nomads", "amount": 38.40, "payer": "laura.navarro@gmail.com"},
            {"desc": "Productos de limpieza ecológica", "amount": 28.90, "payer": "lucia.dominguez@gmail.com"},
            {"desc": "Cena sushi fin de mes Sakura", "amount": 76.00, "payer": "pablo.ortiz@gmail.com"},
        ],
        "payments": [
            {"from": "lucia.dominguez@gmail.com", "to": "laura.navarro@gmail.com", "amount": 35.70, "notes": "Bizum BonÀrea"},
            {"from": "andrea.pascual@gmail.com", "to": "pablo.ortiz@gmail.com", "amount": 23.87, "notes": "Transferencia Gas Natural"},
            {"from": "laura.navarro@gmail.com", "to": "pablo.ortiz@gmail.com", "amount": 19.00, "notes": "Parte cena sushi"},
        ],
    },
    {
        "name": "Ruzafa Vibes & Sunshine",
        "city": "Valencia",
        "creator_email": "miguel.fernandez@gmail.com",
        "member_emails": [
            "carmen.delgado@gmail.com",
            "javier.ramos@gmail.com",
            "ainoa.garrido@gmail.com",
        ],
        "expenses": [
            {"desc": "Mercado de Ruzafa (Pescado fresco y verdura)", "amount": 96.30, "payer": "miguel.fernandez@gmail.com"},
            {"desc": "Factura Luz Naturgy", "amount": 78.40, "payer": "javier.ramos@gmail.com"},
            {"desc": "Agua Emivasa bimestre", "amount": 42.10, "payer": "carmen.delgado@gmail.com"},
            {"desc": "Ingredientes paella domingo y horchata", "amount": 58.20, "payer": "miguel.fernandez@gmail.com"},
            {"desc": "Fibra Vodafone 600Mb", "amount": 32.00, "payer": "ainoa.garrido@gmail.com"},
            {"desc": "Kit ambientadores y plantas salón", "amount": 35.00, "payer": "carmen.delgado@gmail.com"},
        ],
        "payments": [
            {"from": "carmen.delgado@gmail.com", "to": "miguel.fernandez@gmail.com", "amount": 24.08, "notes": "Bizum mercado Ruzafa"},
            {"from": "javier.ramos@gmail.com", "to": "miguel.fernandez@gmail.com", "amount": 24.08, "notes": "Bizum mercado Ruzafa"},
            {"from": "ainoa.garrido@gmail.com", "to": "javier.ramos@gmail.com", "amount": 19.60, "notes": "Ajuste factura Luz"},
        ],
    },
    {
        "name": "Triana Flamenco & Coders",
        "city": "Sevilla",
        "creator_email": "david.torres@gmail.com",
        "member_emails": [
            "sara.iglesias@gmail.com",
            "daniel.medina@gmail.com",
            "rocio.benitez@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra súper MAS + Droguería", "amount": 115.00, "payer": "david.torres@gmail.com"},
            {"desc": "Factura Climatización Endesa", "amount": 88.60, "payer": "daniel.medina@gmail.com"},
            {"desc": "Fibra Vodafone 600Mb", "amount": 33.00, "payer": "sara.iglesias@gmail.com"},
            {"desc": "Cena tapas por la calle Betis", "amount": 62.00, "payer": "rocio.benitez@gmail.com"},
            {"desc": "Cesta frutas y verduras frescas", "amount": 34.50, "payer": "david.torres@gmail.com"},
        ],
        "payments": [
            {"from": "sara.iglesias@gmail.com", "to": "david.torres@gmail.com", "amount": 28.75, "notes": "Liquidación compra MAS"},
            {"from": "rocio.benitez@gmail.com", "to": "daniel.medina@gmail.com", "amount": 22.15, "notes": "Parte luz Endesa"},
        ],
    },
    {
        "name": "Realejo Granada Estudiantes",
        "city": "Granada",
        "creator_email": "elena.sanchez@gmail.com",
        "member_emails": [
            "alvaro.herrera@gmail.com",
            "nuria.castro@gmail.com",
            "ignacio.solis@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra Mercadona y productos de limpieza", "amount": 84.50, "payer": "elena.sanchez@gmail.com"},
            {"desc": "Bombona Butano Repsol (x2)", "amount": 34.80, "payer": "alvaro.herrera@gmail.com"},
            {"desc": "Fibra Pepephone 500Mb", "amount": 29.00, "payer": "nuria.castro@gmail.com"},
            {"desc": "Té moruno y dulces árabes", "amount": 22.00, "payer": "ignacio.solis@gmail.com"},
            {"desc": "Garrafas de aceite de oliva virgen extra", "amount": 68.00, "payer": "elena.sanchez@gmail.com"},
        ],
        "payments": [
            {"from": "nuria.castro@gmail.com", "to": "elena.sanchez@gmail.com", "amount": 21.12, "notes": "Bizum Mercadona"},
            {"from": "alvaro.herrera@gmail.com", "to": "elena.sanchez@gmail.com", "amount": 17.00, "notes": "Parte aceite de oliva"},
        ],
    },
    {
        "name": "Teatinos Málaga Developers Hub",
        "city": "Málaga",
        "creator_email": "hugo.pena@gmail.com",
        "member_emails": [
            "paula.rivas@gmail.com",
            "raul.mateo@gmail.com",
            "estela.bernal@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra Carrefour Teatinos (Comida semanal)", "amount": 135.20, "payer": "hugo.pena@gmail.com"},
            {"desc": "Factura Luz y Aire Acondicionado TotalEnergies", "amount": 92.40, "payer": "paula.rivas@gmail.com"},
            {"desc": "Fibra Digi 1Gbps Simétrica", "amount": 25.00, "payer": "hugo.pena@gmail.com"},
            {"desc": "Mesa de ping pong plegable para terraza", "amount": 110.00, "payer": "raul.mateo@gmail.com"},
            {"desc": "Barbacoa y carbón para el fin de semana", "amount": 65.00, "payer": "estela.bernal@gmail.com"},
        ],
        "payments": [
            {"from": "raul.mateo@gmail.com", "to": "hugo.pena@gmail.com", "amount": 33.80, "notes": "Bizum Carrefour"},
            {"from": "estela.bernal@gmail.com", "to": "paula.rivas@gmail.com", "amount": 23.10, "notes": "Bizum luz TotalEnergies"},
        ],
    },
    {
        "name": "Casco Viejo Bilbao Pintxo Coliving",
        "city": "Bilbao",
        "creator_email": "marcos.molina@gmail.com",
        "member_emails": [
            "irene.fuentes@gmail.com",
            "unai.etxebarria@gmail.com",
            "maite.larrea@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra en Eroski Center (Básicos y congelados)", "amount": 128.40, "payer": "marcos.molina@gmail.com"},
            {"desc": "Recibo Calefacción Gas Euskaltel", "amount": 105.00, "payer": "unai.etxebarria@gmail.com"},
            {"desc": "Internet Fibra Euskaltel 1Gbps", "amount": 39.00, "payer": "irene.fuentes@gmail.com"},
            {"desc": "Compra cafetera De'Longhi espresso", "amount": 89.90, "payer": "maite.larrea@gmail.com"},
        ],
        "payments": [
            {"from": "irene.fuentes@gmail.com", "to": "marcos.molina@gmail.com", "amount": 32.10, "notes": "Bizum Eroski"},
            {"from": "maite.larrea@gmail.com", "to": "unai.etxebarria@gmail.com", "amount": 26.25, "notes": "Liquidación gas Euskaltel"},
        ],
    },
    {
        "name": "Salamanca Plaza Mayor Coliving",
        "city": "Salamanca",
        "creator_email": "sergio.aguilar@gmail.com",
        "member_emails": [
            "marta.ortiz@gmail.com",
            "pablo.montero@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra Mercadona semanal", "amount": 78.50, "payer": "sergio.aguilar@gmail.com"},
            {"desc": "Factura Luz y Agua Iberdrola", "amount": 64.20, "payer": "marta.ortiz@gmail.com"},
            {"desc": "Fibra Digi 300Mb", "amount": 20.00, "payer": "pablo.montero@gmail.com"},
            {"desc": "Impresora compartida HP y tinta", "amount": 55.00, "payer": "sergio.aguilar@gmail.com"},
        ],
        "payments": [
            {"from": "pablo.montero@gmail.com", "to": "sergio.aguilar@gmail.com", "amount": 26.16, "notes": "Bizum Mercadona"},
            {"from": "sergio.aguilar@gmail.com", "to": "marta.ortiz@gmail.com", "amount": 21.40, "notes": "Ajuste Luz e Iberdrola"},
        ],
    },
    {
        "name": "Sagasta Zaragoza Flat",
        "city": "Zaragoza",
        "creator_email": "gonzalo.cruz@gmail.com",
        "member_emails": [
            "lucia.sancho@gmail.com",
            "valeria.gimenez@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra súper Alcampo", "amount": 95.30, "payer": "gonzalo.cruz@gmail.com"},
            {"desc": "Recibo Gas Ciudad", "amount": 54.00, "payer": "lucia.sancho@gmail.com"},
            {"desc": "Internet Fibra Movistar", "amount": 35.00, "payer": "valeria.gimenez@gmail.com"},
        ],
        "payments": [
            {"from": "lucia.sancho@gmail.com", "to": "gonzalo.cruz@gmail.com", "amount": 31.76, "notes": "Bizum Alcampo"},
        ],
    },
    {
        "name": "Alicante Mediterranean Coast Flat",
        "city": "Alicante",
        "creator_email": "joaquin.soler@gmail.com",
        "member_emails": [
            "leire.arizmendi@gmail.com",
            "fernando.revilla@gmail.com",
        ],
        "expenses": [
            {"desc": "Compra Mercadona y productos frescos", "amount": 104.20, "payer": "joaquin.soler@gmail.com"},
            {"desc": "Factura Luz e Iberdrola Clima", "amount": 72.00, "payer": "leire.arizmendi@gmail.com"},
            {"desc": "Fibra Digi 1Gbps", "amount": 25.00, "payer": "fernando.revilla@gmail.com"},
        ],
        "payments": [
            {"from": "fernando.revilla@gmail.com", "to": "joaquin.soler@gmail.com", "amount": 34.73, "notes": "Bizum Mercadona"},
        ],
    },
]

# ── 5. Plantillas de Denuncias / Moderación (18 Denuncias Variadas) ────
REPORT_TEMPLATES = [
    {
        "type": "LISTING", "reason": "FRAUD",
        "description": "El anfitrión pide un depósito extra en efectivo por WhatsApp antes de hacer la visita.",
        "admin_action": "RESOLVED", "admin_notes": "Advertencia formal enviada al anfitrión y política de pagos reforzada.",
    },
    {
        "type": "LISTING", "reason": "INAPPROPRIATE_CONTENT",
        "description": "Las fotos no coinciden con la descripción real del inmueble.",
        "admin_action": "INVESTIGATING", "admin_notes": "Solicitadas fotos actualizadas y nota simple.",
    },
    {
        "type": "LISTING", "reason": "SPAM",
        "description": "Anuncio duplicado varias veces por la misma persona con ligeras variaciones de precio.",
        "admin_action": "RESOLVED", "admin_notes": "Anuncios duplicados eliminados del catálogo público.",
    },
    {
        "type": "USER", "reason": "HARASSMENT",
        "description": "El usuario envía mensajes ofensivos tras rechazar su solicitud de reserva.",
        "admin_action": "RESOLVED", "admin_notes": "Usuario sancionado temporalmente conforme a los términos de convivencia.",
    },
    {
        "type": "USER", "reason": "OTHER",
        "description": "Perfil sospechoso sin foto ni verificación que pide datos bancarios privados.",
        "admin_action": "PENDING", "admin_notes": None,
    },
    {
        "type": "LISTING", "reason": "FRAUD",
        "description": "El precio listado no coincide con el que exige por privado al visitar el piso.",
        "admin_action": "DISMISSED", "admin_notes": "Revisado con el propietario; se trataba de una tarifa especial para estancias cortas ya clarificada.",
    },
    {
        "type": "LISTING", "reason": "INAPPROPRIATE_CONTENT",
        "description": "Fotos con publicidad de una agencia externa con marcas de agua intrusivas.",
        "admin_action": "RESOLVED", "admin_notes": "Imágenes reemplazadas por fotografías limpias.",
    },
    {
        "type": "USER", "reason": "SPAM",
        "description": "Envío masivo de solicitudes con mensajes comerciales no relacionados con el alquiler.",
        "admin_action": "RESOLVED", "admin_notes": "Bloqueada la capacidad de envío masivo de mensajes.",
    },
    {
        "type": "LISTING", "reason": "OTHER",
        "description": "Ubicación inexacta en el mapa que confunde a los inquilinos sobre el barrio real.",
        "admin_action": "INVESTIGATING", "admin_notes": "Verificando coordenadas catastrales con el propietario.",
    },
    {
        "type": "USER", "reason": "HARASSMENT",
        "description": "Comportamiento hostil y descalificaciones en los mensajes de convivencia del hogar.",
        "admin_action": "RESOLVED", "admin_notes": "Amonestación por incumplimiento del código de conducta.",
    },
    {
        "type": "LISTING", "reason": "FRAUD",
        "description": "Anuncio que afirma tener piscina privada cuando es una piscina municipal cercana.",
        "admin_action": "RESOLVED", "admin_notes": "Amenities actualizadas correctamente.",
    },
    {
        "type": "USER", "reason": "OTHER",
        "description": "Inquilino que no se presentó el día de entrega de llaves sin avisar ni responder.",
        "admin_action": "DISMISSED", "admin_notes": "Incidencia de fuerza mayor justificada documentalmente.",
    },
]

# ── 6. Plantillas de Reseñas Realistas (25 Reseñas de 1 a 5 Estrellas) ─
REVIEW_TEMPLATES = [
    {"rating": 5, "comment": "¡Experiencia inmejorable! El piso está impoluto, con mucha luz natural y la convivencia con los compañeros ha sido fantástica. El anfitrión respondió al instante."},
    {"rating": 5, "comment": "Ubicación insuperable y habitación comodísima para teletrabajar. El internet vuela y la cocina cuenta con todo lo necesario. Repetiré sin dudarlo."},
    {"rating": 4, "comment": "Muy buen alojamiento, espacioso y bien comunicado con metro y autobuses. El único detalle menor es que en fin de semana se escucha algo de ruido de la calle."},
    {"rating": 4, "comment": "Estancia muy agradable. La habitación era tal cual aparecía en las fotos y la fianza me fue devuelta puntualmente al finalizar el contrato."},
    {"rating": 5, "comment": "Piso espectacular con techos altos y muy buena energía. La terraza comunitaria es un lujo para tomar el café por las mañanas."},
    {"rating": 3, "comment": "El piso en general está bien, pero coincidí con compañeros poco cuidadosos con la limpieza de la cocina. El propietario ayudó a mediar."},
    {"rating": 5, "comment": "Perfecto para estudiantes. Cerca de las facultades, con supermercados y gimnasio al lado. 10/10."},
    {"rating": 4, "comment": "Todo correcto, colchón muy cómodo y buen ambiente en el hogar. La calefacción calienta la casa muy rápido en invierno."},
    {"rating": 5, "comment": "Anfitrión de diez. Nos ayudó con el registro en la ciudad y siempre estuvo pendiente de que no nos faltase nada. ¡Un 10!"},
    {"rating": 5, "comment": "Habitación súper luminosa y cama viscoelástica de calidad. Barrio tranquilo pero con todos los servicios."},
    {"rating": 4, "comment": "El piso es genial y moderno. Como punto a mejorar, añadiría más menaje en la cocina, pero estuvimos muy a gusto."},
    {"rating": 5, "comment": "Convivencia inmejorable con los compañeros de piso. Hicimos cenas conjuntas y nos sentimos como en casa desde el primer día."},
    {"rating": 2, "comment": "El aire acondicionado falló durante una semana calurosa. Aunque el técnico vino a repararlo, la respuesta tardó más de lo esperado."},
    {"rating": 5, "comment": "Excelente relación calidad-precio en pleno centro. Wifi estable para videollamadas internacionales."},
    {"rating": 4, "comment": "Piso limpio, luminoso y ordenado. Zona con mucho encanto y ambiente universitario."},
    {"rating": 5, "comment": "Todo impecable. Baño recién reformado y habitación muy amplia con armario de gran capacidad."},
    {"rating": 4, "comment": "Muy buena experiencia en general. Zona muy segura y tranquila para descansar tras el trabajo."},
    {"rating": 5, "comment": "Sin duda de los mejores colivings en los que he estado. Las zonas comunes están muy bien cuidadas."},
    {"rating": 3, "comment": "Buena ubicación, aunque el ascensor estuvo averiado un par de días y es un 4º piso. La habitación correcta."},
    {"rating": 5, "comment": "Totalmente recomendado para nómadas digitales y profesionales en remoto."},
]

# ── 7. Consultas de Búsqueda Simuladas para Historiales y Analytics ───
SEARCH_QUERIES = [
    {"city": "Madrid", "maxPrice": 700, "rentalType": "ROOM"},
    {"city": "Madrid", "maxPrice": 2000, "rentalType": "ENTIRE_PLACE"},
    {"city": "Barcelona", "maxPrice": 800, "rentalType": "ROOM"},
    {"city": "Barcelona", "maxPrice": 2500, "rentalType": "ENTIRE_PLACE"},
    {"city": "Valencia", "maxPrice": 550, "rentalType": "ROOM"},
    {"city": "Valencia", "maxPrice": 1500, "rentalType": "ENTIRE_PLACE"},
    {"city": "Sevilla", "maxPrice": 500, "rentalType": "ROOM"},
    {"city": "Granada", "maxPrice": 450, "rentalType": "ROOM"},
    {"city": "Málaga", "maxPrice": 600, "rentalType": "ROOM"},
    {"city": "Bilbao", "maxPrice": 650, "rentalType": "ROOM"},
    {"city": "Salamanca", "maxPrice": 400, "rentalType": "ROOM"},
    {"city": "Zaragoza", "maxPrice": 500, "rentalType": "ROOM"},
    {"city": "Alicante", "maxPrice": 500, "rentalType": "ROOM"},
]
