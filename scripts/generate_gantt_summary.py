#!/usr/bin/env python3
"""
Módulo: generate_gantt_summary.py
Descripción: Procesa las Pull Requests aprobadas de Colivi (prs_aprobadas_colivi.xlsx)
             y el plan maestro de desarrollo (CLAUDE.md). Genera en docs/gantt_colivi_agrupado.xlsx
             un libro integral con una hoja maestra consolidada que reúne el cronograma real WBS,
             la estimación teórica inicial, la matriz comparativa directa (Gap Analysis),
             las justificaciones académicas para el TFG y el detalle técnico por PR.
Arquitectura: Diseñado bajo principios SOLID, tipado estricto y sin dependencias no declaradas.
"""

from dataclasses import dataclass
from datetime import datetime, date, timedelta
from typing import List, Dict, Tuple
import os

import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


# ==============================================================================
# 1. MODELOS DE DOMINIO (SINGLE RESPONSIBILITY & TYPING)
# ==============================================================================

@dataclass(frozen=True)
class PRRecord:
    """Representa una Pull Request individual extraída del repositorio."""
    number: int
    title: str
    head_ref: str
    base_ref: str
    author: str
    approver: str
    created_at: str
    approved_at: str
    merged_at: str
    start_date: str
    end_date: str
    duration_days: int


@dataclass(frozen=True)
class FunctionalModule:
    """Definición de un módulo funcional o épica del sistema (WBS)."""
    code: str
    name: str
    description: str
    order: int


@dataclass
class ModuleSummary:
    """Agregación de métricas y rango temporal de un módulo funcional."""
    module: FunctionalModule
    prs: List[PRRecord]
    start_date: str
    end_date: str
    total_days: int
    pr_count: int
    pr_numbers: str


@dataclass(frozen=True)
class EstimatedPhase:
    """Representa una fase del plan inicial estimado extraída de CLAUDE.md."""
    phase_code: str
    title: str
    weeks_label: str
    start_week: int
    end_week: int
    duration_weeks: int
    main_module: str
    objective: str
    deliverable: str
    methodology_solid: str
    task_count: int
    real_wbs_mapping: str


@dataclass(frozen=True)
class ComparativeRecord:
    """Representa una fila de análisis comparativo y justificación académica."""
    item_id: str
    dimension: str
    estimated_plan: str
    actual_execution: str
    deviation: str
    justification: str


# ==============================================================================
# 2. CLASIFICADOR FUNCIONAL DE PRS (OPEN / CLOSED PRINCIPLE)
# ==============================================================================

class PRClassifier:
    """Clasifica PRs en módulos funcionales basándose en reglas semánticas y trazabilidad."""

    MODULES: Dict[str, FunctionalModule] = {
        "F01": FunctionalModule(
            code="F01",
            name="Arquitectura Base, Infraestructura y DevOps",
            description="Configuración de repositorio, pipelines CI/CD, Docker Compose, desacoplamiento SOLID y arquitectura limpia.",
            order=1
        ),
        "F02": FunctionalModule(
            code="F02",
            name="Gestión de Usuarios, Autenticación y Perfiles",
            description="Autenticación stateless JWT, OAuth2 con Google, recuperación de contraseña, perfiles de usuario y borrado lógico.",
            order=2
        ),
        "F03": FunctionalModule(
            code="F03",
            name="Gestión de Alojamientos y Catálogo",
            description="Publicación de inmuebles, catálogo de comodidades para coliving, filtros avanzados, mapas interactivos y recomendador.",
            order=3
        ),
        "F04": FunctionalModule(
            code="F04",
            name="Solicitudes de Reserva y Pagos de Fianza",
            description="Ciclo de reservas de estancia, validación de meses completos, control de concurrencia, deep-linking y depósito de fianza.",
            order=4
        ),
        "F05": FunctionalModule(
            code="F05",
            name="Gestión de Hogares y Convivencia",
            description="Administración de unidades de convivencia (Hogares), asignación de inquilinos y registro cronológico de actividad.",
            order=5
        ),
        "F06": FunctionalModule(
            code="F06",
            name="Gestión de Gastos Compartidos (Expenses)",
            description="Reparto proporcional de gastos comunes, cálculo dinámico de deudas, liquidación de saldos y auditoría contable.",
            order=6
        ),
        "F07": FunctionalModule(
            code="F07",
            name="Sistema de Denuncias, Reseñas y Moderación",
            description="Canal de reporte de incidencias, valoraciones verificadas, ranking de moderación y resolución administrativa en cascada.",
            order=7
        ),
        "F08": FunctionalModule(
            code="F08",
            name="Tareas Domésticas y Gamificación (Chores)",
            description="Asignación rotativa automatizada de tareas (round-robin), periodicidad recurrente y tabla de puntuación (leaderboard).",
            order=8
        ),
        "F09": FunctionalModule(
            code="F09",
            name="Sistema de Mensajería Interna",
            description="Canal de mensajería privada entre miembros y propietarios, persistencia de chats e integración con reportes.",
            order=9
        ),
        "F10": FunctionalModule(
            code="F10",
            name="Asistente Virtual Inteligente (IA & MCP)",
            description="Integración de Spring AI con Model Context Protocol (MCP), orquestación de herramientas y widget React Copilot.",
            order=10
        ),
        "F11": FunctionalModule(
            code="F11",
            name="Adaptabilidad Móvil y Despliegue Android",
            description="Optimización ergonómica responsive para móviles, integración con Capacitor y empaquetado del APK de Android.",
            order=11
        ),
        "F12": FunctionalModule(
            code="F12",
            name="Cumplimiento Legal y Privacidad (RGPD)",
            description="Plataforma de gestión de consentimiento (CMP), políticas de privacidad, términos legales y adaptación LOPDGDD.",
            order=12
        ),
    }

    EXPLICIT_MAPPING: Dict[int, str] = {
        1: "F01",
        2: "F02",
        3: "F02",
        28: "F01",
        29: "F03",
        30: "F02",
        31: "F02",
        32: "F04",
        33: "F03",
        34: "F04",
        35: "F01",
        36: "F04",
        37: "F01",
        38: "F05",
        39: "F06",
        40: "F05",
        41: "F01",
        42: "F07",
        43: "F02",
        44: "F04",
        45: "F03",
        46: "F02",
        47: "F02",
        48: "F02",
        49: "F03",
        50: "F03",
        51: "F04",
        52: "F01",
        53: "F07",
        54: "F02",
        55: "F03",
        56: "F07",
        57: "F07",
        58: "F05",
        59: "F06",
        60: "F02",
        61: "F08",
        62: "F09",
        63: "F10",
        64: "F11",
        65: "F11",
        66: "F12",
    }

    @classmethod
    def classify(cls, pr_number: int) -> FunctionalModule:
        code = cls.EXPLICIT_MAPPING.get(pr_number, "F01")
        return cls.MODULES[code]


# ==============================================================================
# 3. PROVEEDOR DEL PLAN ESTIMADO Y ANÁLISIS DE DESVIACIONES (CLAUDE.MD)
# ==============================================================================

class EstimatedPlanProvider:
    """Proporciona la planificación teórica inicial documentada en CLAUDE.md."""

    @staticmethod
    def get_estimated_phases() -> List[EstimatedPhase]:
        return [
            EstimatedPhase(
                phase_code="Fase 0",
                title="Configuración del Entorno y Scaffolding",
                weeks_label="Semana 0",
                start_week=0,
                end_week=0,
                duration_weeks=1,
                main_module="Scaffolding, Docker, esquema BD",
                objective="Tener un entorno de desarrollo funcional con todas las herramientas configuradas antes de escribir una sola línea de lógica.",
                deliverable="docker-compose up levanta PostgreSQL, backend arranca con 200 OK en /api/v1/health, frontend carga en localhost:3000.",
                methodology_solid="Monorepo modular, Docker Compose, Flyway V1__init_schema.",
                task_count=9,
                real_wbs_mapping="F01 (Arquitectura Base, Infraestructura y DevOps)"
            ),
            EstimatedPhase(
                phase_code="Fase 1",
                title="Núcleo de Seguridad y Gestión de Usuarios",
                weeks_label="Semanas 1-2",
                start_week=1,
                end_week=2,
                duration_weeks=2,
                main_module="Autenticación JWT y gestión de usuarios",
                objective="Sistema de autenticación robusto y gestión de perfiles de usuario.",
                deliverable="Un usuario puede registrarse, iniciar sesión y obtener su perfil con token JWT válido. Intentos erróneos devuelven 401.",
                methodology_solid="SRP (IUserService, ITokenProvider), DIP (SecurityConfig desacoplado de la implementación).",
                task_count=15,
                real_wbs_mapping="F02 (Gestión de Usuarios, Autenticación y Perfiles)"
            ),
            EstimatedPhase(
                phase_code="Fase 2",
                title="Motor Financiero (TDD Obligatorio)",
                weeks_label="Semanas 3-4",
                start_week=3,
                end_week=4,
                duration_weeks=2,
                main_module="Motor financiero (TDD) — Gastos y deudas",
                objective="Implementar el núcleo del módulo de gastos compartidos con cobertura de tests completa antes de escribir el código de producción.",
                deliverable="Cobertura tests > 90 % en clases financieras. Endpoint de balances devuelve el grafo de deudas simplificado.",
                methodology_solid="TDD estricto (Red-Green-Refactor), OCP (DebtSimplifierEngine intercambiable), SRP (ExpenseService).",
                task_count=23,
                real_wbs_mapping="F06 (Gestión de Gastos Compartidos)"
            ),
            EstimatedPhase(
                phase_code="Fase 3",
                title="Subsistema de Auditoría e Inmutabilidad",
                weeks_label="Semana 5",
                start_week=5,
                end_week=5,
                duration_weeks=1,
                main_module="Auditoría inmutable y feed de actividad",
                objective="Implementar la capa de trazabilidad append-only con captura automática de snapshots JSONB.",
                deliverable="Cualquier mutación sobre EXPENSE o TASK genera snapshot inmutable. Feed de actividad cronológico funcional.",
                methodology_solid="SRP (IAuditService), ISP (AuditLogRepository append-only sin delete/update), DIP (listeners JPA y trigger PostgreSQL).",
                task_count=13,
                real_wbs_mapping="F05 (Gestión de Hogares y Convivencia)"
            ),
            EstimatedPhase(
                phase_code="Fase 4",
                title="Módulo de Alojamiento: Estructura Física e Imágenes",
                weeks_label="Semana 6",
                start_week=6,
                end_week=6,
                duration_weeks=1,
                main_module="Propiedades físicas (Accommodation) e imágenes Cloudinary",
                objective="Implementar la base de datos de las propiedades físicas (Accommodation) y la integración de almacenamiento cloud en Cloudinary.",
                deliverable="Un propietario autenticado puede registrar su propiedad física, geolocalizarla con coordenadas y subir imágenes a Cloudinary.",
                methodology_solid="SRP (IAccommodationService inventario físico), OCP/DIP (IImageStorageService desacoplado del proveedor cloud).",
                task_count=9,
                real_wbs_mapping="F03 (Gestión de Alojamientos y Catálogo)"
            ),
            EstimatedPhase(
                phase_code="Fase 5",
                title="Publicación y Catálogo Comercial (Listings)",
                weeks_label="Semana 7",
                start_week=7,
                end_week=7,
                duration_weeks=1,
                main_module="Publicación comercial (AccommodationListing) y moderación",
                objective="Implementar publicación de anuncios comerciales (AccommodationListing), buscador con filtros y mapas, y moderación admin.",
                deliverable="Propietario con >= 2 imágenes publica anuncio; tras aprobación admin entra en estado AVAILABLE en catálogo y mapa interactivo.",
                methodology_solid="SRP (IAccommodationListingService, IAccommodationReportService, IReviewService independientes).",
                task_count=12,
                real_wbs_mapping="F03 (Alojamientos), F07 (Denuncias y Moderación)"
            ),
            EstimatedPhase(
                phase_code="Fase 6",
                title="Frontend Core (Desarrollo en Paralelo)",
                weeks_label="Semanas 6-7",
                start_week=6,
                end_week=7,
                duration_weeks=2,
                main_module="Frontend Core (desarrollado en paralelo a Fases 4 y 5)",
                objective="Desarrollar la interfaz web completa para usuarios y administradores, consumiendo los endpoints REST de forma reactiva.",
                deliverable="Flujo visual y navegable completo de usuario y administrador en el frontend Next.js con Tailwind consumiendo Spring Boot.",
                methodology_solid="Frontend-First, Zustand para autenticación, React Query para sincronización de servidor, componentes modulares.",
                task_count=11,
                real_wbs_mapping="Transversal (Integración de interfaz de todos los módulos)"
            ),
            EstimatedPhase(
                phase_code="Fase 7",
                title="Servidor MCP e Integración IA",
                weeks_label="Semana 8",
                start_week=8,
                end_week=8,
                duration_weeks=1,
                main_module="Servidor MCP e integración del chat IA",
                objective="Construir el servidor MCP independiente y conectar la interfaz de chat del frontend para consultas en lenguaje natural.",
                deliverable="El usuario resuelve dudas ('¿Quién modificó el gasto?') mediante LLM llamando a herramientas MCP con seguridad multi-tenant.",
                methodology_solid="Model Context Protocol (JSON-RPC 2.0), proxy autenticado sin almacenar tokens, esquemas Zod.",
                task_count=12,
                real_wbs_mapping="F10 (Asistente Virtual Inteligente IA & MCP)"
            ),
            EstimatedPhase(
                phase_code="Fase 8",
                title="Hardening, Documentación y Despliegue",
                weeks_label="Semana 9",
                start_week=9,
                end_week=9,
                duration_weeks=1,
                main_module="Hardening, documentación y despliegue",
                objective="Preparar el proyecto para entrega académica con calidad de producción.",
                deliverable="Proyecto arranca con un único docker-compose up. Documentación OpenAPI en /swagger-ui.html y README completo.",
                methodology_solid="Cobertura de tests >= 80%, perfiles Spring dev/prod, OpenAPI 3.0, CI/CD hardening.",
                task_count=15,
                real_wbs_mapping="F01 (DevOps), F11 (Despliegue Móvil), F12 (Cumplimiento Legal)"
            ),
        ]

    @staticmethod
    def get_comparative_records() -> List[ComparativeRecord]:
        return [
            ComparativeRecord(
                item_id="C01",
                dimension="Horizonte Temporal y Esfuerzo Global",
                estimated_plan="10 semanas estimadas (Semanas 0 a 9) con dedicación secuencial prevista.",
                actual_execution="16 semanas reales (113 días naturales: 01/06/2026 al 21/09/2026). 42 PRs aprobadas.",
                deviation="+6 semanas (+60% de maduración temporal sobre la estimación inicial).",
                justification="La ampliación temporal responde a la transición de un prototipo monorepo básico hacia una plataforma completa con arquitectura limpia hexagonal, transacciones económicas seguras, empaquetado nativo para Android (Capacitor), gamificación de convivencia y cumplimiento estricto del RGPD europeo. Justifica con creces las ~300 horas correspondientes a los 12 créditos ECTS del TFG."
            ),
            ComparativeRecord(
                item_id="C02",
                dimension="F01: Arquitectura Base, Infraestructura y DevOps",
                estimated_plan="Fase 0 (Semana 0) y Fase 8 (Semana 9): Scaffolding inicial y hardening final.",
                actual_execution="Módulo transversal F01 (6 PRs: #1, #28, #35, #37, #41, #52) activo del 01/06 al 30/08 (91 días).",
                deviation="Evolución continua de infraestructura a lo largo de todo el ciclo de vida.",
                justification="La infraestructura no fue un hito cerrado al inicio, sino una refactorización continua basada en principios SOLID: desacoplamiento de excepciones del dominio de la capa web, control de concurrencia con eventos de bloqueo transaccional y optimización de Docker Compose."
            ),
            ComparativeRecord(
                item_id="C03",
                dimension="F02: Gestión de Usuarios, Autenticación y Perfiles",
                estimated_plan="Fase 1 (Semanas 1-2): Registro, login con JWT y perfil de usuario simple.",
                actual_execution="Módulo F02 (10 PRs: #2, #3, #30, #31, #43, #46, #47, #48, #54, #60) de 28/06 a 04/09 (69 días).",
                deviation="+5 semanas de desarrollo iterativo en seguridad, recuperación y ciclo de cuenta.",
                justification="Se amplió sustancialmente la seguridad mediante autenticación OAuth2 con Google, recuperación de contraseña tokenizada por correo, capa transversal de control de usuarios suspendidos/baneados (código HTTP 403 dinámico) y borrado lógico con derecho al olvido (soft delete)."
            ),
            ComparativeRecord(
                item_id="C04",
                dimension="F03: Gestión de Alojamientos y Catálogo",
                estimated_plan="Fases 4 y 5 (Semanas 6-7): Propiedades físicas, subida a Cloudinary y listings.",
                actual_execution="Módulo F03 (6 PRs: #29, #33, #45, #49, #50, #55) de 05/07 a 30/08 (57 días).",
                deviation="Desarrollo simultáneo y sincronizado de backend y frontend a lo largo de 8 semanas.",
                justification="Ampliación del catálogo con comodidades exclusivas de coliving, mapas interactivos con cálculo geoespacial de radio dinámico y un motor heurístico de recomendaciones personalizadas basado en el historial de búsquedas recientes del usuario."
            ),
            ComparativeRecord(
                item_id="C05",
                dimension="F04: Solicitudes de Reserva y Pagos de Fianza",
                estimated_plan="Mencionado como submódulo simplificado contractual en Listings.",
                actual_execution="Módulo independiente F04 (5 PRs: #32, #34, #36, #44, #51) de 13/07 a 30/08 (49 días).",
                deviation="Creación de un dominio transaccional de alta complejidad no dimensionado en el plan.",
                justification="Implementación de máquina de estados determinista para reservas, validación estricta de meses de estancia para evitar solapamientos, tests de integración E2E, deep-linking y pasarela simulada de retención y liquidación de depósitos de fianza."
            ),
            ComparativeRecord(
                item_id="C06",
                dimension="F05: Gestión de Hogares y Convivencia",
                estimated_plan="Fase 3 (Semana 5): Subsistema de auditoría inmutable append-only.",
                actual_execution="Módulo F05 (3 PRs: #38, #40, #58) de 31/07 a 03/09 (35 días).",
                deviation="Cohesión entre el espacio multi-tenant de coliving y la trazabilidad de eventos.",
                justification="Desarrollo del espacio multi-tenant del hogar compartido, gestión de convivientes condicionada a saldo cero y feed cronológico de eventos (Activity Log) desacoplado mediante formateo modular de estrategias."
            ),
            ComparativeRecord(
                item_id="C07",
                dimension="F06: Gestión de Gastos Compartidos (Expenses)",
                estimated_plan="Fase 2 (Semanas 3-4): Motor financiero TDD de gastos y deudas simplificadas.",
                actual_execution="Módulo F06 (2 PRs: #39, #59) de 07/08 a 03/09 (28 días).",
                deviation="Ejecución rigurosa bajo TDD con posterior refinamiento funcional en septiembre.",
                justification="Implementación exitosa del algoritmo de simplificación de deudas en memoria mediante grafo de tránsito sin reescribir la BD, complementado posteriormente con liquidaciones de deuda parciales, edición de gastos y auditoría."
            ),
            ComparativeRecord(
                item_id="C08",
                dimension="F07: Sistema de Denuncias, Reseñas y Moderación",
                estimated_plan="Submódulo simple de reportes incluido tangencialmente en Fase 5.",
                actual_execution="Módulo completo F07 (4 PRs: #42, #53, #56, #57) de 09/08 a 02/09 (25 días).",
                deviation="Ampliación hacia un subsistema administrativo completo de moderación y confianza.",
                justification="Creación del sistema de valoraciones bidireccionales verificadas tras la estancia, regla preventiva de auto-moderación atómica ante denuncias reiteradas y panel de administración con ranking de moderación activa y resolución en cascada."
            ),
            ComparativeRecord(
                item_id="C09",
                dimension="F08: Tareas Domésticas y Gamificación (Chores)",
                estimated_plan="CRUD básico de tareas (Task) sin dinámicas de gamificación.",
                actual_execution="Módulo F08 (PR #61) completado el 06/09/2026 tras diseño algorítmico previo.",
                deviation="Nueva funcionalidad diferenciadora incorporada al alcance del proyecto.",
                justification="Algoritmo rotativo round-robin para asignación automatizada de tareas periódicas del hogar y clasificación por puntos (leaderboard) para incentivar la colaboración y evitar fricciones de convivencia mediante gamificación."
            ),
            ComparativeRecord(
                item_id="C10",
                dimension="F09: Sistema de Mensajería Interna",
                estimated_plan="Mensajes básicos vinculados a publicaciones en Fase 5.",
                actual_execution="Módulo F09 (PR #62) de 07/09 a 08/09 (2 días).",
                deviation="Canal de comunicación en tiempo real independiente del asistente de IA.",
                justification="Implementación de mensajería privada bidireccional entre usuarios con soporte para contraofertas económicas, persistencia paginada, filtros anti-abuso y reporte directo de mensajes indebidos a los administradores."
            ),
            ComparativeRecord(
                item_id="C11",
                dimension="F10: Asistente Virtual Inteligente (IA & MCP)",
                estimated_plan="Fase 7 (Semana 8): Servidor MCP independiente en Node.js.",
                actual_execution="Módulo F10 (PR #63) de 10/09 a 12/09 (3 días).",
                deviation="Integración tecnológica avanzada con Spring AI y widget React Copilot.",
                justification="Adopción del estándar industrial Model Context Protocol (MCP) para conectar el modelo de lenguaje con la API de Colivi mediante herramientas tipadas con esquemas Zod y widget flotante Copilot en el cliente web."
            ),
            ComparativeRecord(
                item_id="C12",
                dimension="F11: Adaptabilidad Móvil y Despliegue Android",
                estimated_plan="No planificado inicialmente (limitado a cliente web Next.js responsive).",
                actual_execution="Módulo F11 (2 PRs: #64 y #65) de 17/09 a 21/09 (5 días).",
                deviation="Ampliación multiplataforma completa hacia app nativa para smartphones.",
                justification="Optimización de ergonomía táctil y diseño adaptativo en el frontend, integración con Capacitor y empaquetado nativo generando el archivo APK instalable en dispositivos móviles Android reales."
            ),
            ComparativeRecord(
                item_id="C13",
                dimension="F12: Cumplimiento Legal y Privacidad (RGPD)",
                estimated_plan="No planificado explícitamente en el desglose de fases iniciales.",
                actual_execution="Módulo F12 (PR #66) completado el 21/09/2026.",
                deviation="Incorporación obligatoria para la puesta en producción según el marco legal europeo.",
                justification="Implementación de plataforma de gestión de consentimiento (CMP), banners de cookies configurables, políticas de privacidad, términos de servicio y mecanismos de ejercicio de derechos ARCO conforme al RGPD y la LOPDGDD."
            )
        ]


# ==============================================================================
# 4. LECTOR Y VALIDADOR DE DATOS DE PRS
# ==============================================================================

class PRDataReader:
    """Lee y valida el archivo Excel de PRs aprobadas en docs/ o scripts/."""

    @staticmethod
    def load_records(filepath: str) -> List[PRRecord]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"No se encontró el archivo de origen: {filepath}")

        df = pd.read_excel(filepath)
        records: List[PRRecord] = []

        for _, row in df.iterrows():
            record = PRRecord(
                number=int(row.iloc[0]),
                title=str(row.iloc[1]).strip(),
                head_ref=str(row.iloc[2]).strip(),
                base_ref=str(row.iloc[3]).strip(),
                author=str(row.iloc[4]).strip(),
                approver=str(row.iloc[5]).strip(),
                created_at=str(row.iloc[6]).strip(),
                approved_at=str(row.iloc[7]).strip(),
                merged_at=str(row.iloc[8]).strip(),
                start_date=str(row.iloc[9]).strip()[:10],
                end_date=str(row.iloc[10]).strip()[:10],
                duration_days=int(row.iloc[11])
            )
            records.append(record)

        return records


# ==============================================================================
# 5. AGREGADOR DE MÉTRICAS GANTT
# ==============================================================================

class GanttAggregator:
    """Consolida las PRs en resúmenes funcionales para diagramas de Gantt."""

    @staticmethod
    def aggregate(records: List[PRRecord]) -> List[ModuleSummary]:
        grouped: Dict[str, List[PRRecord]] = {}

        for rec in records:
            module = PRClassifier.classify(rec.number)
            if module.code not in grouped:
                grouped[module.code] = []
            grouped[module.code].append(rec)

        summaries: List[ModuleSummary] = []

        for code, module in sorted(PRClassifier.MODULES.items(), key=lambda item: item[1].order):
            if code not in grouped:
                continue

            prs_in_module = grouped[code]
            start_dates = [datetime.strptime(p.start_date, "%Y-%m-%d") for p in prs_in_module]
            end_dates = [datetime.strptime(p.end_date, "%Y-%m-%d") for p in prs_in_module]

            min_date = min(start_dates)
            max_date = max(end_dates)
            duration = (max_date - min_date).days + 1
            pr_numbers_str = ", ".join(f"#{p.number}" for p in sorted(prs_in_module, key=lambda x: x.number))

            summary = ModuleSummary(
                module=module,
                prs=prs_in_module,
                start_date=min_date.strftime("%Y-%m-%d"),
                end_date=max_date.strftime("%Y-%m-%d"),
                total_days=duration,
                pr_count=len(prs_in_module),
                pr_numbers=pr_numbers_str
            )
            summaries.append(summary)

        return summaries


# ==============================================================================
# 6. GENERADOR DEL ARCHIVO EXCEL UNIFICADO (OPENPYXL)
# ==============================================================================

class ExcelGanttReportGenerator:
    """Genera el libro Excel con la hoja maestra unificada y la hoja de detalle técnico."""

    def __init__(self, output_filepath: str):
        self.output_filepath = output_filepath
        self.workbook = openpyxl.Workbook()
        self.workbook.remove(self.workbook.active)

        # Paleta corporativa
        self.DARK_NAVY = "1E293B"
        self.SLATE_GRAY = "475569"
        self.LIGHT_BLUE = "DBEAFE"
        self.BAR_BLUE = "2563EB"
        self.BORDER_GRAY = "CBD5E1"
        self.CARD_BG = "F8FAFC"
        self.STATUS_BG = "D1FAE5"
        self.PURPLE_HEADER = "312E81"
        self.PURPLE_BAR = "4F46E5"
        self.AMBER_HEADER = "78350F"

        # Tipografías
        self.font_main_title = Font(name="Calibri", size=15, bold=True, color="0F172A")
        self.font_section_title = Font(name="Calibri", size=12, bold=True, color="1E293B")
        self.font_subtitle = Font(name="Calibri", size=10, italic=True, color="64748B")
        self.font_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        self.font_data = Font(name="Calibri", size=10, color="1E293B")
        self.font_data_bold = Font(name="Calibri", size=10, bold=True, color="1E293B")
        self.font_status = Font(name="Calibri", size=10, bold=True, color="047857")

        # Rellenos
        self.fill_header_dark = PatternFill(start_color=self.DARK_NAVY, end_color=self.DARK_NAVY, fill_type="solid")
        self.fill_header_slate = PatternFill(start_color=self.SLATE_GRAY, end_color=self.SLATE_GRAY, fill_type="solid")
        self.fill_header_purple = PatternFill(start_color=self.PURPLE_HEADER, end_color=self.PURPLE_HEADER, fill_type="solid")
        self.fill_header_amber = PatternFill(start_color=self.AMBER_HEADER, end_color=self.AMBER_HEADER, fill_type="solid")
        self.fill_zebra = PatternFill(start_color=self.CARD_BG, end_color=self.CARD_BG, fill_type="solid")
        self.fill_gantt_bar = PatternFill(start_color=self.BAR_BLUE, end_color=self.BAR_BLUE, fill_type="solid")
        self.fill_est_bar = PatternFill(start_color=self.PURPLE_BAR, end_color=self.PURPLE_BAR, fill_type="solid")
        self.fill_status = PatternFill(start_color=self.STATUS_BG, end_color=self.STATUS_BG, fill_type="solid")

        # Bordes
        thin_side = Side(border_style="thin", color=self.BORDER_GRAY)
        self.border_thin = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
        self.border_group_top = Border(
            left=thin_side, right=thin_side,
            top=Side(border_style="medium", color=self.SLATE_GRAY),
            bottom=thin_side
        )

        # Alineaciones
        self.align_center = Alignment(horizontal="center", vertical="center")
        self.align_left = Alignment(horizontal="left", vertical="center")
        self.align_wrap_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

    def generate(
        self,
        summaries: List[ModuleSummary],
        records: List[PRRecord],
        estimated_phases: List[EstimatedPhase],
        comparisons: List[ComparativeRecord]
    ) -> None:
        """Construye la hoja maestra unificada y la hoja de detalle técnico."""
        self._build_unified_master_sheet(summaries, estimated_phases, comparisons)
        self._build_detail_sheet(records)

        try:
            self.workbook.save(self.output_filepath)
            print(f"Libro Excel generado exitosamente en: {self.output_filepath}")
        except PermissionError:
            fallback_path = self.output_filepath.replace(".xlsx", "_actualizado.xlsx")
            self.workbook.save(fallback_path)
            print(f"AVISO: {self.output_filepath} está bloqueado por Excel.")
            print(f"Libro guardado en copia alternativa: {fallback_path}")

    def _build_unified_master_sheet(
        self,
        summaries: List[ModuleSummary],
        phases: List[EstimatedPhase],
        comparisons: List[ComparativeRecord]
    ) -> None:
        """Hoja 1: Concentra el cronograma real WBS, estimación CLAUDE, comparativa y justificaciones."""
        ws = self.workbook.create_sheet(title="Gantt_y_Comparativa")
        ws.views.sheetView[0].showGridLines = True

        # ======================================================================
        # TÍTULO DEL DOCUMENTO MAESTRO
        # ======================================================================
        ws["A1"] = "COLIVI TFG - CRONOGRAMA INTEGRAL, ESTIMACIÓN INICIAL Y ANÁLISIS DE DESVIACIONES"
        ws["A1"].font = self.font_main_title
        ws["A2"] = "Consolidación en una sola vista del WBS ejecutado (12 módulos, 42 PRs), plan teórico (CLAUDE.md), matriz comparativa y justificaciones metodológicas del TFG."
        ws["A2"].font = self.font_subtitle

        # ======================================================================
        # SECCIÓN 1: CRONOGRAMA EJECUTIVO REAL (WBS F01-F12) Y GANTT SEMANAL
        # ======================================================================
        ws["A4"] = "SECCIÓN 1: CRONOGRAMA REAL EJECUTADO POR MÓDULOS FUNCIONALES (WBS)"
        ws["A4"].font = self.font_section_title

        # Generar semanas reales (W23 - 01/06/2026 hasta W40 - 28/09/2026)
        start_cal = date(2026, 6, 1)
        weeks: List[Tuple[date, date, str, str]] = []
        current = start_cal
        while current <= date(2026, 9, 30):
            week_end = current + timedelta(days=6)
            month_name = current.strftime("%B").upper()
            es_months = {
                "JUNE": "JUNIO 2026",
                "JULY": "JULIO 2026",
                "AUGUST": "AGOSTO 2026",
                "SEPTEMBER": "SEPTIEMBRE 2026",
                "OCTOBER": "OCTUBRE 2026"
            }
            month_label = es_months.get(month_name, month_name)
            week_label = f"S{len(weeks)+1} ({current.strftime('%d/%m')})"
            weeks.append((current, week_end, week_label, month_label))
            current += timedelta(days=7)

        headers_s1 = [
            ("Código WBS", 14, self.align_center),
            ("Módulo Funcional", 34, self.align_left),
            ("Alcance y Entregables Clave", 52, self.align_wrap_left),
            ("Fecha Inicio", 14, self.align_center),
            ("Fecha Fin", 14, self.align_center),
            ("Duración (Días)", 16, self.align_center),
            ("Nº PRs", 10, self.align_center),
            ("PRs Asociadas", 30, self.align_wrap_left),
            ("Estado", 14, self.align_center),
        ]

        # Fila 5: Cabecera base de Sección 1
        row_s1 = 6
        for col_idx, (h_title, width, align) in enumerate(headers_s1, start=1):
            cell = ws.cell(row=row_s1, column=col_idx, value=h_title)
            cell.font = self.font_header
            cell.fill = self.fill_header_dark
            cell.alignment = align
            cell.border = self.border_thin
            col_letter = get_column_letter(col_idx)
            ws.column_dimensions[col_letter].width = width

        # Fila 5 y 6: Cabeceras temporales agrupadas por mes y semanas
        col_offset = len(headers_s1) + 1
        month_spans: Dict[str, Tuple[int, int]] = {}

        for w_idx, (_, _, w_label, m_label) in enumerate(weeks):
            col_num = col_offset + w_idx
            cell_w = ws.cell(row=row_s1, column=col_num, value=w_label)
            cell_w.font = Font(name="Calibri", size=9, bold=True, color="FFFFFF")
            cell_w.fill = self.fill_header_slate
            cell_w.alignment = self.align_center
            cell_w.border = self.border_thin
            col_letter = get_column_letter(col_num)
            ws.column_dimensions[col_letter].width = 11

            if m_label not in month_spans:
                month_spans[m_label] = (col_num, col_num)
            else:
                month_spans[m_label] = (month_spans[m_label][0], col_num)

        # Fila 5: Meses fusionados
        for m_label, (c_start, c_end) in month_spans.items():
            if c_start == c_end:
                cell_m = ws.cell(row=5, column=c_start, value=m_label)
            else:
                ws.merge_cells(start_row=5, start_column=c_start, end_row=5, end_column=c_end)
                cell_m = ws.cell(row=5, column=c_start, value=m_label)
            cell_m.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
            cell_m.fill = self.fill_header_dark
            cell_m.alignment = self.align_center
            for c in range(c_start, c_end + 1):
                ws.cell(row=5, column=c).border = self.border_thin
                ws.cell(row=5, column=c).fill = self.fill_header_dark

        ws.row_dimensions[5].height = 22
        ws.row_dimensions[6].height = 25

        # Datos de Sección 1 y barras Gantt reales
        current_row = 7
        for idx, s in enumerate(summaries):
            is_even = (idx % 2 == 0)
            fill_row = PatternFill(fill_type=None) if is_even else self.fill_zebra

            values = [
                (s.module.code, self.font_data_bold, self.align_center),
                (s.module.name, self.font_data_bold, self.align_left),
                (s.module.description, self.font_data, self.align_wrap_left),
                (s.start_date, self.font_data, self.align_center),
                (s.end_date, self.font_data, self.align_center),
                (s.total_days, self.font_data_bold, self.align_center),
                (s.pr_count, self.font_data_bold, self.align_center),
                (s.pr_numbers, self.font_data, self.align_wrap_left),
                ("Completado", self.font_status, self.align_center),
            ]

            for col_idx, (val, font_style, align_style) in enumerate(values, start=1):
                cell = ws.cell(row=current_row, column=col_idx, value=val)
                cell.font = font_style
                cell.alignment = align_style
                cell.border = self.border_thin
                cell.fill = self.fill_status if col_idx == 9 else fill_row

            # Barras Gantt reales
            mod_start = datetime.strptime(s.start_date, "%Y-%m-%d").date()
            mod_end = datetime.strptime(s.end_date, "%Y-%m-%d").date()

            for w_idx, (w_start, w_end, _, _) in enumerate(weeks):
                col_num = col_offset + w_idx
                cell_grid = ws.cell(row=current_row, column=col_num)
                cell_grid.border = self.border_thin

                is_active = (mod_start <= w_end) and (mod_end >= w_start)
                if is_active:
                    cell_grid.fill = self.fill_gantt_bar
                    cell_grid.value = "[====]"
                    cell_grid.font = Font(name="Calibri", size=8, bold=True, color="FFFFFF")
                    cell_grid.alignment = self.align_center
                else:
                    cell_grid.fill = PatternFill(fill_type=None)

            ws.row_dimensions[current_row].height = 26
            current_row += 1

        # Totales Sección 1
        global_min = min(s.start_date for s in summaries)
        global_max = max(s.end_date for s in summaries)
        dt_min = datetime.strptime(global_min, "%Y-%m-%d")
        dt_max = datetime.strptime(global_max, "%Y-%m-%d")
        global_days = (dt_max - dt_min).days + 1

        ws.cell(row=current_row, column=1, value="TOTALES").alignment = self.align_center
        ws.cell(row=current_row, column=2, value=f"{len(summaries)} Módulos Funcionales")
        ws.cell(row=current_row, column=3, value="Cobertura funcional integral del proyecto")
        ws.cell(row=current_row, column=4, value=global_min).alignment = self.align_center
        ws.cell(row=current_row, column=5, value=global_max).alignment = self.align_center
        ws.cell(row=current_row, column=6, value=global_days).alignment = self.align_center
        ws.cell(row=current_row, column=7, value=f"=SUM(G7:G{current_row-1})").alignment = self.align_center
        ws.cell(row=current_row, column=8, value=f"{sum(s.pr_count for s in summaries)} PRs Aprobadas")
        ws.cell(row=current_row, column=9, value="100%").alignment = self.align_center

        for c in range(1, 10):
            t_cell = ws.cell(row=current_row, column=c)
            t_cell.font = self.font_header
            t_cell.fill = self.fill_header_slate
            t_cell.border = self.border_thin

        for w_idx in range(len(weeks)):
            c_tot = ws.cell(row=current_row, column=col_offset + w_idx, value="")
            c_tot.fill = self.fill_header_slate
            c_tot.border = self.border_thin

        ws.row_dimensions[current_row].height = 24
        current_row += 3

        # ======================================================================
        # SECCIÓN 2: ESTIMACIÓN INICIAL DE TIEMPOS (CLAUDE.MD - 9 FASES)
        # ======================================================================
        ws.cell(row=current_row, column=1, value="SECCIÓN 2: ESTIMACIÓN INICIAL DE TIEMPOS (PLAN MAESTRO CLAUDE.MD)").font = self.font_section_title
        current_row += 1

        headers_s2 = [
            ("Fase", 10, self.align_center),
            ("Nombre de la Fase", 34, self.align_left),
            ("Objetivo y Entregable Verificable", 52, self.align_wrap_left),
            ("Ventana Estimada", 14, self.align_center),
            ("Módulo Principal", 14, self.align_center),
            ("Duración (Sem.)", 16, self.align_center),
            ("Nº Tareas", 10, self.align_center),
            ("Metodología / SOLID", 30, self.align_wrap_left),
            ("Módulo Real (WBS)", 14, self.align_center),
        ]

        row_s2_head = current_row
        for col_idx, (h_title, _, align) in enumerate(headers_s2, start=1):
            cell = ws.cell(row=row_s2_head, column=col_idx, value=h_title)
            cell.font = self.font_header
            cell.fill = self.fill_header_purple
            cell.alignment = align
            cell.border = self.border_thin

        # Cabecera de Semanas estimadas (Sem 0 a Sem 9)
        ws.cell(row=row_s2_head - 1, column=col_offset, value="CRONOGRAMA TEÓRICO ESTIMADO (SEMANAS 0 A 9)").font = self.font_header
        ws.cell(row=row_s2_head - 1, column=col_offset).fill = self.fill_header_purple
        ws.cell(row=row_s2_head - 1, column=col_offset).alignment = self.align_center
        ws.merge_cells(start_row=row_s2_head - 1, start_column=col_offset, end_row=row_s2_head - 1, end_column=col_offset + 9)
        for c in range(col_offset, col_offset + 10):
            ws.cell(row=row_s2_head - 1, column=c).border = self.border_thin
            ws.cell(row=row_s2_head - 1, column=c).fill = self.fill_header_purple

        for w in range(10):
            col_num = col_offset + w
            cell_w = ws.cell(row=row_s2_head, column=col_num, value=f"Sem {w}")
            cell_w.font = Font(name="Calibri", size=9, bold=True, color="FFFFFF")
            cell_w.fill = self.fill_header_slate
            cell_w.alignment = self.align_center
            cell_w.border = self.border_thin

        ws.row_dimensions[row_s2_head - 1].height = 22
        ws.row_dimensions[row_s2_head].height = 25

        current_row += 1
        for idx, p in enumerate(phases):
            is_even = (idx % 2 == 0)
            fill_row = PatternFill(fill_type=None) if is_even else self.fill_zebra

            values = [
                (p.phase_code, self.font_data_bold, self.align_center),
                (p.title, self.font_data_bold, self.align_left),
                (f"Objetivo: {p.objective} | Entregable: {p.deliverable}", self.font_data, self.align_wrap_left),
                (p.weeks_label, self.font_data, self.align_center),
                (p.main_module, self.font_data, self.align_center),
                (p.duration_weeks, self.font_data_bold, self.align_center),
                (p.task_count, self.font_data_bold, self.align_center),
                (p.methodology_solid, self.font_data, self.align_wrap_left),
                (p.real_wbs_mapping[:18], self.font_data, self.align_center),
            ]

            for col_idx, (val, font_style, align_style) in enumerate(values, start=1):
                cell = ws.cell(row=current_row, column=col_idx, value=val)
                cell.font = font_style
                cell.alignment = align_style
                cell.border = self.border_thin
                cell.fill = fill_row

            # Barras estimadas (Sem 0 a Sem 9)
            for w in range(10):
                col_num = col_offset + w
                cell_bar = ws.cell(row=current_row, column=col_num)
                cell_bar.border = self.border_thin
                is_active = (p.start_week <= w <= p.end_week)
                if is_active:
                    cell_bar.fill = self.fill_est_bar
                    cell_bar.value = "[====]"
                    cell_bar.font = Font(name="Calibri", size=8, bold=True, color="FFFFFF")
                    cell_bar.alignment = self.align_center
                else:
                    cell_bar.fill = PatternFill(fill_type=None)

            ws.row_dimensions[current_row].height = 28
            current_row += 1

        # Totales Sección 2
        total_tasks = sum(p.task_count for p in phases)
        ws.cell(row=current_row, column=1, value="TOTAL").alignment = self.align_center
        ws.cell(row=current_row, column=2, value="9 Fases de Desarrollo")
        ws.cell(row=current_row, column=3, value="Entorno arrancable, TDD obligatorio y documentación completa")
        ws.cell(row=current_row, column=4, value="Semanas 0 a 9").alignment = self.align_center
        ws.cell(row=current_row, column=5, value="Plan Teórico Base").alignment = self.align_center
        ws.cell(row=current_row, column=6, value=10).alignment = self.align_center
        ws.cell(row=current_row, column=7, value=total_tasks).alignment = self.align_center
        ws.cell(row=current_row, column=8, value="TDD y SOLID transversal")
        ws.cell(row=current_row, column=9, value="Base de partida").alignment = self.align_center

        for c in range(1, 10):
            t_cell = ws.cell(row=current_row, column=c)
            t_cell.font = self.font_header
            t_cell.fill = self.fill_header_slate
            t_cell.border = self.border_thin

        for w in range(10):
            col_num = col_offset + w
            t_bar = ws.cell(row=current_row, column=col_num, value="")
            t_bar.fill = self.fill_header_slate
            t_bar.border = self.border_thin

        ws.row_dimensions[current_row].height = 24
        current_row += 3

        # ======================================================================
        # SECCIÓN 3: MATRIZ COMPARATIVA DIRECTA Y JUSTIFICACIONES (GAP ANALYSIS)
        # ======================================================================
        ws.cell(row=current_row, column=1, value="SECCIÓN 3: ANÁLISIS COMPARATIVO DIRECTO Y JUSTIFICACIONES TÉCNICAS (GAP ANALYSIS)").font = self.font_section_title
        current_row += 1
        ws.cell(row=current_row, column=1, value="Evaluación metodológica de las desviaciones temporales y justificación académica de la ampliación del alcance funcional (Scope Expansion).").font = self.font_subtitle
        current_row += 2

        # Cabeceras Sección 3 (Distribuidas sobre el ancho total de 27 columnas)
        # Col 1: ID (Col 1)
        # Col 2: Dimensión / Módulo (Col 2)
        # Col 3-5: Plan Teórico (Cols 3 a 5 fusionadas)
        # Col 6-8: Ejecución Real (Cols 6 a 8 fusionadas)
        # Col 9-11: Variación Temporal (Cols 9 a 11 fusionadas)
        # Col 12-27: Justificación Académica para el TFG (Cols 12 a 27 fusionadas)
        row_s3_head = current_row

        ws.cell(row=row_s3_head, column=1, value="ID").alignment = self.align_center
        ws.cell(row=row_s3_head, column=2, value="Módulo / Dimensión Evaluada").alignment = self.align_left

        ws.cell(row=row_s3_head, column=3, value="Plan Teórico Estimado (CLAUDE.md)").alignment = self.align_center
        ws.merge_cells(start_row=row_s3_head, start_column=3, end_row=row_s3_head, end_column=5)

        ws.cell(row=row_s3_head, column=6, value="Ejecución Real (Repositorio / 42 PRs)").alignment = self.align_center
        ws.merge_cells(start_row=row_s3_head, start_column=6, end_row=row_s3_head, end_column=8)

        ws.cell(row=row_s3_head, column=9, value="Variación / Desviación").alignment = self.align_center
        ws.merge_cells(start_row=row_s3_head, start_column=9, end_row=row_s3_head, end_column=11)

        ws.cell(row=row_s3_head, column=12, value="Justificación Académica y Ampliación de Alcance para la Memoria del TFG").alignment = self.align_left
        ws.merge_cells(start_row=row_s3_head, start_column=12, end_row=row_s3_head, end_column=len(headers_s1) + len(weeks))

        for c in range(1, len(headers_s1) + len(weeks) + 1):
            c_head = ws.cell(row=row_s3_head, column=c)
            c_head.font = self.font_header
            c_head.fill = self.fill_header_dark
            c_head.border = self.border_thin

        ws.row_dimensions[row_s3_head].height = 25
        current_row += 1

        for idx, comp in enumerate(comparisons):
            is_even = (idx % 2 == 0)
            fill_row = PatternFill(fill_type=None) if is_even else self.fill_zebra

            # Col 1: ID
            c1 = ws.cell(row=current_row, column=1, value=comp.item_id)
            c1.font = self.font_data_bold
            c1.alignment = self.align_center
            c1.border = self.border_thin
            c1.fill = fill_row

            # Col 2: Dimensión
            c2 = ws.cell(row=current_row, column=2, value=comp.dimension)
            c2.font = self.font_data_bold
            c2.alignment = self.align_left
            c2.border = self.border_thin
            c2.fill = fill_row

            # Col 3-5: Plan Teórico
            c3 = ws.cell(row=current_row, column=3, value=comp.estimated_plan)
            c3.font = self.font_data
            c3.alignment = self.align_wrap_left
            ws.merge_cells(start_row=current_row, start_column=3, end_row=current_row, end_column=5)
            for c in range(3, 6):
                ws.cell(row=current_row, column=c).border = self.border_thin
                ws.cell(row=current_row, column=c).fill = fill_row

            # Col 6-8: Ejecución Real
            c6 = ws.cell(row=current_row, column=6, value=comp.actual_execution)
            c6.font = self.font_data
            c6.alignment = self.align_wrap_left
            ws.merge_cells(start_row=current_row, start_column=6, end_row=current_row, end_column=8)
            for c in range(6, 9):
                ws.cell(row=current_row, column=c).border = self.border_thin
                ws.cell(row=current_row, column=c).fill = fill_row

            # Col 9-11: Variación
            c9 = ws.cell(row=current_row, column=9, value=comp.deviation)
            c9.font = self.font_data_bold
            c9.alignment = self.align_wrap_left
            ws.merge_cells(start_row=current_row, start_column=9, end_row=current_row, end_column=11)
            for c in range(9, 12):
                ws.cell(row=current_row, column=c).border = self.border_thin
                ws.cell(row=current_row, column=c).fill = fill_row

            # Col 12-27: Justificación Académica
            c12 = ws.cell(row=current_row, column=12, value=comp.justification)
            c12.font = self.font_data
            c12.alignment = self.align_wrap_left
            ws.merge_cells(start_row=current_row, start_column=12, end_row=current_row, end_column=len(headers_s1) + len(weeks))
            for c in range(12, len(headers_s1) + len(weeks) + 1):
                ws.cell(row=current_row, column=c).border = self.border_thin
                ws.cell(row=current_row, column=c).fill = fill_row

            ws.row_dimensions[current_row].height = 36
            current_row += 1

        current_row += 2

        # ======================================================================
        # SECCIÓN 4: CONCLUSIONES METODOLÓGICAS PARA EL TRIBUNAL DEL TFG
        # ======================================================================
        ws.cell(row=current_row, column=1, value="SECCIÓN 4: SÍNTESIS METODOLÓGICA PARA LA MEMORIA Y DEFENSA DEL TFG").font = self.font_section_title
        current_row += 1

        conclusions = [
            "1. Cobertura de Carga de Trabajo Académica: La duración de 16 semanas (113 días) y las 42 Pull Requests auditadas justifican objetivamente las ~300 horas de dedicación formal correspondientes a un TFG de 12 créditos ECTS.",
            "2. Adaptabilidad e Ingeniería Ágil: La divergencia respecto a la estimación inicial demuestra que el proyecto no fue una maqueta estática, sino un software vivo que evolucionó conforme a las necesidades funcionales de un marketplace de coliving.",
            "3. Rigor de Calidad y Principios SOLID: Cada incremento de alcance respetó escrupulosamente los principios SOLID, pruebas automáticas (TDD en finanzas, tests E2E y unitarios) y cero warnings en compilación.",
            "4. Madurez Tecnológica Integral: La plataforma culminó con tres elementos diferenciales de alto valor académico: Asistente conversacional IA vía Model Context Protocol (MCP), App nativa Android (Capacitor) y cumplimiento legal estricto RGPD."
        ]

        for conc in conclusions:
            ws.cell(row=current_row, column=1, value=conc).font = self.font_data
            ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=len(headers_s1) + len(weeks))
            for c in range(1, len(headers_s1) + len(weeks) + 1):
                ws.cell(row=current_row, column=c).border = self.border_thin
                ws.cell(row=current_row, column=c).fill = self.fill_zebra
            ws.row_dimensions[current_row].height = 22
            current_row += 1

    def _build_detail_sheet(self, records: List[PRRecord]) -> None:
        """Hoja 2: Detalle cronológico y clasificado de las 42 Pull Requests individuales."""
        ws = self.workbook.create_sheet(title="Gantt_Detalle_PRs")
        ws.views.sheetView[0].showGridLines = True

        ws["A1"] = "COLIVI TFG - DETALLE DE PULL REQUESTS AGRUPADAS POR MÓDULO"
        ws["A1"].font = self.font_main_title
        ws["A2"] = "Desglose técnico de cada PR con su asignación a módulo funcional, rama, fechas de creación/merge y duración."
        ws["A2"].font = self.font_subtitle

        headers = [
            ("WBS", 10, self.align_center),
            ("Módulo Funcional", 32, self.align_left),
            ("Nº PR", 10, self.align_center),
            ("Título de la PR", 48, self.align_wrap_left),
            ("Rama Origen", 30, self.align_left),
            ("Rama Destino", 14, self.align_center),
            ("Autor", 12, self.align_center),
            ("Aprobado Por", 22, self.align_center),
            ("Fecha Creación", 18, self.align_center),
            ("Fecha Merge", 18, self.align_center),
            ("Inicio (Gantt)", 14, self.align_center),
            ("Fin (Gantt)", 14, self.align_center),
            ("Duración (Días)", 15, self.align_center),
        ]

        row_idx = 4
        for col_idx, (h_title, width, align) in enumerate(headers, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=h_title)
            cell.font = self.font_header
            cell.fill = self.fill_header_dark
            cell.alignment = align
            cell.border = self.border_thin
            col_letter = get_column_letter(col_idx)
            ws.column_dimensions[col_letter].width = width
        ws.row_dimensions[row_idx].height = 25

        sorted_records = sorted(
            records,
            key=lambda r: (PRClassifier.classify(r.number).order, r.created_at)
        )

        row_idx = 5
        prev_wbs = None
        for r in sorted_records:
            mod = PRClassifier.classify(r.number)
            is_new_module = (prev_wbs is not None and prev_wbs != mod.code)
            prev_wbs = mod.code

            values = [
                (mod.code, self.font_data_bold, self.align_center),
                (mod.name, self.font_data, self.align_left),
                (f"#{r.number}", self.font_data_bold, self.align_center),
                (r.title, self.font_data, self.align_wrap_left),
                (r.head_ref, self.font_data, self.align_left),
                (r.base_ref, self.font_data, self.align_center),
                (r.author, self.font_data, self.align_center),
                (r.approver, self.font_data, self.align_center),
                (r.created_at, self.font_data, self.align_center),
                (r.merged_at, self.font_data, self.align_center),
                (r.start_date, self.font_data, self.align_center),
                (r.end_date, self.font_data, self.align_center),
                (r.duration_days, self.font_data_bold, self.align_center),
            ]

            fill_row = self.fill_zebra if mod.order % 2 == 0 else PatternFill(fill_type=None)
            border_to_apply = self.border_group_top if is_new_module else self.border_thin

            for col_idx, (val, font_style, align_style) in enumerate(values, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.font = font_style
                cell.alignment = align_style
                cell.border = border_to_apply
                cell.fill = fill_row

            ws.row_dimensions[row_idx].height = 22
            row_idx += 1


# ==============================================================================
# 7. ORQUESTADOR PRINCIPAL (DEPENDENCY INVERSION)
# ==============================================================================

class GanttSummaryApp:
    """Orquestador de la aplicación de generación del cronograma."""

    def __init__(self, input_file: str, output_file: str):
        self.input_file = input_file
        self.output_file = output_file

    def run(self) -> None:
        print(f"Leyendo registros de PRs desde: {self.input_file}...")
        records = PRDataReader.load_records(self.input_file)
        print(f"Se cargaron {len(records)} PRs aprobadas.")

        print("Agrupando y consolidando métricas por módulo funcional (WBS)...")
        summaries = GanttAggregator.aggregate(records)
        print(f"Se generaron {len(summaries)} resúmenes funcionales.")

        print("Cargando estimación inicial y análisis comparativo desde CLAUDE.md...")
        estimated_phases = EstimatedPlanProvider.get_estimated_phases()
        comparisons = EstimatedPlanProvider.get_comparative_records()
        print(f"Se cargaron {len(estimated_phases)} fases y {len(comparisons)} dimensiones comparativas.")

        print(f"Construyendo libro Excel unificado en: {self.output_file}...")
        generator = ExcelGanttReportGenerator(self.output_file)
        generator.generate(summaries, records, estimated_phases, comparisons)


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)

    # Rutas primarias en docs/
    input_path = os.path.join(project_root, "docs", "prs_aprobadas_colivi.xlsx")
    output_path = os.path.join(project_root, "docs", "gantt_colivi_agrupado.xlsx")

    # Fallback si aún estuviese en scripts/
    if not os.path.exists(input_path):
        fallback_input = os.path.join(base_dir, "prs_aprobadas_colivi.xlsx")
        if os.path.exists(fallback_input):
            input_path = fallback_input

    app = GanttSummaryApp(input_file=input_path, output_file=output_path)
    app.run()


if __name__ == "__main__":
    main()
