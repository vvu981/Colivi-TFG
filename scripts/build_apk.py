#!/usr/bin/env python3
"""
Script de automatización para generar el paquete APK de Android para Colivi.
Cumple con principios SOLID (responsabilidad única, arquitectura desacoplada y tipado estricto).

Flujo de ejecución:
1. Validación del entorno (Node.js, npm, Java/JDK, Android SDK y Gradle wrapper).
2. Compilación de recursos web (npm run build).
3. Sincronización nativa con Capacitor (npx cap sync android).
4. Ensamblado nativo de Android mediante Gradle Wrapper (assembleDebug / assembleRelease).
5. Extracción y publicación del archivo APK en la raíz del proyecto con verificación SHA-256.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class BuildConfig:
    """Configuración inmutable para el proceso de compilación del APK."""

    project_root: Path
    frontend_dir: Path
    android_dir: Path
    mode: str  # 'debug' o 'release'
    skip_web: bool
    clean_gradle: bool
    output_path: Path
    verbose: bool


class Logger:
    """Utilidad de registro en consola profesional y sin emoticonos."""

    @staticmethod
    def info(message: str) -> None:
        print(f"[INFO] {message}")

    @staticmethod
    def step(step_num: int, total_steps: int, message: str) -> None:
        print(f"\n[PASO {step_num}/{total_steps}] {message}")

    @staticmethod
    def success(message: str) -> None:
        print(f"[EXITO] {message}")

    @staticmethod
    def warning(message: str) -> None:
        print(f"[AVISO] {message}")

    @staticmethod
    def error(message: str) -> None:
        print(f"[ERROR] {message}", file=sys.stderr)


class ProcessRunner:
    """Servicio de ejecución de procesos desacoplado de la lógica de negocio."""

    @staticmethod
    def run(
        command: list[str],
        cwd: Path,
        description: str,
        verbose: bool = False,
    ) -> None:
        Logger.info(f"Ejecutando: {' '.join(command)} (en {cwd})")
        stdout_dest = None if verbose else subprocess.PIPE
        stderr_dest = None if verbose else subprocess.PIPE

        try:
            process = subprocess.run(
                command,
                cwd=str(cwd),
                stdout=stdout_dest,
                stderr=stderr_dest,
                text=True,
                check=False,
            )
            if process.returncode != 0:
                Logger.error(f"Fallo durante: {description}")
                if not verbose:
                    if process.stdout:
                        print("--- STDOUT ---", file=sys.stderr)
                        print(process.stdout[-2000:], file=sys.stderr)
                    if process.stderr:
                        print("--- STDERR ---", file=sys.stderr)
                        print(process.stderr[-2000:], file=sys.stderr)
                raise RuntimeError(
                    f"El comando '{command[0]}' finalizó con código de error {process.returncode}."
                )
        except FileNotFoundError as err:
            raise FileNotFoundError(
                f"No se encontró el ejecutable '{command[0]}'. Verifique que está en el PATH del sistema."
            ) from err


class EnvironmentValidator:
    """Verificador de requisitos de entorno para Android y Node.js."""

    def __init__(self, config: BuildConfig):
        self.config = config

    def validate(self) -> None:
        Logger.info("Comprobando herramientas del entorno...")

        # 1. Comprobar Node y npm
        if not shutil.which("node"):
            raise EnvironmentError("Node.js no está instalado o no se encuentra en el PATH.")
        if not shutil.which("npm") and not shutil.which("npm.cmd"):
            raise EnvironmentError("npm no está instalado o no se encuentra en el PATH.")

        # 2. Comprobar Java
        if not shutil.which("java"):
            raise EnvironmentError("Java/JDK no está disponible en el PATH del sistema.")

        # 3. Comprobar Gradle Wrapper
        gradlew = self._get_gradlew_path()
        if not gradlew.exists():
            raise FileNotFoundError(
                f"No se localizó el ejecutable Gradle wrapper en: {gradlew}"
            )

        # 4. Comprobar Android SDK
        sdk_found = self._check_android_sdk()
        if not sdk_found:
            Logger.warning(
                "No se detectó ANDROID_HOME ni ANDROID_SDK_ROOT en las variables de entorno. "
                "Se intentará usar local.properties."
            )
        Logger.info("Entorno validado correctamente.")

    def _get_gradlew_path(self) -> Path:
        is_windows = sys.platform == "win32"
        return self.config.android_dir / ("gradlew.bat" if is_windows else "gradlew")

    def _check_android_sdk(self) -> bool:
        if os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT"):
            return True
        local_props = self.config.android_dir / "local.properties"
        if local_props.exists():
            try:
                content = local_props.read_text(encoding="utf-8")
                return "sdk.dir" in content
            except Exception:
                return False
        return False


class FrontendBuilder:
    """Compilador de activos web estáticos con Vite / TypeScript."""

    def __init__(self, config: BuildConfig):
        self.config = config

    def build(self) -> None:
        Logger.info("Compilando frontend de producción (TypeScript + Vite)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        ProcessRunner.run(
            command=[npm_cmd, "run", "build"],
            cwd=self.config.frontend_dir,
            description="Compilación de frontend web",
            verbose=self.config.verbose,
        )
        dist_dir = self.config.frontend_dir / "dist"
        if not dist_dir.exists() or not (dist_dir / "index.html").exists():
            raise FileNotFoundError(
                "La compilación web finalizó pero no se generó el archivo 'dist/index.html'."
            )
        Logger.success("Frontend web compilado exitosamente.")


class CapacitorSyncService:
    """Sincronizador de artefactos web hacia el entorno nativo de Android."""

    def __init__(self, config: BuildConfig):
        self.config = config

    def sync(self) -> None:
        Logger.info("Sincronizando activos web y plugins con Capacitor Android...")
        npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
        ProcessRunner.run(
            command=[npx_cmd, "cap", "sync", "android"],
            cwd=self.config.frontend_dir,
            description="Sincronización de Capacitor",
            verbose=self.config.verbose,
        )
        Logger.success("Capacitor sincronizado exitosamente con el proyecto Android.")


class GradleApkBuilder:
    """Constructor del archivo APK mediante Gradle Wrapper nativo."""

    def __init__(self, config: BuildConfig):
        self.config = config

    def build_apk(self) -> Path:
        gradlew_path = self.config.android_dir / (
            "gradlew.bat" if sys.platform == "win32" else "gradlew"
        )

        # Permiso de ejecución en Unix si procede
        if sys.platform != "win32":
            os.chmod(gradlew_path, 0o755)

        tasks = []
        if self.config.clean_gradle:
            tasks.append("clean")

        if self.config.mode == "release":
            tasks.append("assembleRelease")
        else:
            tasks.append("assembleDebug")

        Logger.info(f"Invocando Gradle con tareas: {' '.join(tasks)}...")
        ProcessRunner.run(
            command=[str(gradlew_path)] + tasks,
            cwd=self.config.android_dir,
            description=f"Compilación de Gradle ({self.config.mode})",
            verbose=self.config.verbose,
        )

        built_apk = self._find_built_apk()
        if not built_apk.exists():
            raise FileNotFoundError(
                f"Gradle terminó con éxito pero no se localizó el archivo APK esperado en: {built_apk}"
            )
        return built_apk

    def _find_built_apk(self) -> Path:
        build_output_dir = (
            self.config.android_dir / "app" / "build" / "outputs" / "apk" / self.config.mode
        )
        if self.config.mode == "release":
            candidate = build_output_dir / "app-release-unsigned.apk"
            if not candidate.exists():
                candidate = build_output_dir / "app-release.apk"
            return candidate
        return build_output_dir / "app-debug.apk"


class ArtifactPublisher:
    """Publicador y validador de integridad del APK generado."""

    @staticmethod
    def publish(source_apk: Path, destination_apk: Path) -> None:
        destination_apk.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_apk, destination_apk)

        file_size_bytes = destination_apk.stat().st_size
        file_size_mb = file_size_bytes / (1024 * 1024)

        sha256_hash = hashlib.sha256()
        with open(destination_apk, "rb") as f:
            for block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(block)
        checksum = sha256_hash.hexdigest()

        Logger.success(f"APK generado y publicado exitosamente en: {destination_apk.resolve()}")
        Logger.info(f"Tamaño del archivo: {file_size_mb:.2f} MB ({file_size_bytes:,} bytes)")
        Logger.info(f"Checksum SHA-256: {checksum}")


class ApkBuildPipeline:
    """Pipeline orquestador que coordina todas las etapas de generación del APK."""

    def __init__(self, config: BuildConfig):
        self.config = config
        self.validator = EnvironmentValidator(config)
        self.frontend_builder = FrontendBuilder(config)
        self.capacitor_sync = CapacitorSyncService(config)
        self.gradle_builder = GradleApkBuilder(config)
        self.publisher = ArtifactPublisher()

    def execute(self) -> None:
        total_steps = 4 if self.config.skip_web else 5
        current_step = 1

        print("==================================================")
        print(f"  GENERADOR DE APK COLIVI - MODO: {self.config.mode.upper()}")
        print("==================================================")

        # 1. Validación
        Logger.step(current_step, total_steps, "Validación del entorno de construcción")
        self.validator.validate()
        current_step += 1

        # 2. Compilación web (opcional si skip_web es True)
        if not self.config.skip_web:
            Logger.step(current_step, total_steps, "Compilación del frontend web")
            self.frontend_builder.build()
            current_step += 1

            Logger.step(current_step, total_steps, "Sincronización con Capacitor Android")
            self.capacitor_sync.sync()
            current_step += 1
        else:
            Logger.info("Omitiendo compilación web y sincronización (--skip-web activado).")

        # 3. Compilación nativa Gradle
        Logger.step(current_step, total_steps, f"Compilación nativa de APK ({self.config.mode})")
        built_apk = self.gradle_builder.build_apk()
        current_step += 1

        # 4. Publicación
        Logger.step(current_step, total_steps, "Publicación del artefacto final")
        self.publisher.publish(built_apk, self.config.output_path)

        print("\n==================================================")
        Logger.success("PROCESO DE GENERACION COMPLETADO CON EXITO.")
        print("==================================================")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compila y genera el paquete APK de Android para la plataforma Colivi.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--mode",
        choices=["debug", "release"],
        default="debug",
        help="Variante de compilación del APK (debug o release).",
    )
    parser.add_argument(
        "--skip-web",
        action="store_true",
        help="Omite la compilación de Vite y Capacitor sync (usa el contenido actual de android/).",
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Ejecuta una limpieza de Gradle ('clean') antes de ensamblar el APK.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Ruta personalizada de salida para el archivo APK.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Muestra la salida completa y detallada de los comandos subyacentes.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_arguments()

    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent
    frontend_dir = project_root / "Colivi-frontend"
    android_dir = frontend_dir / "android"

    if args.output:
        output_path = Path(args.output).resolve()
    else:
        default_name = (
            "colivi-app-production.apk"
            if args.mode == "release"
            else "colivi-app-debug.apk"
        )
        output_path = project_root / default_name

    config = BuildConfig(
        project_root=project_root,
        frontend_dir=frontend_dir,
        android_dir=android_dir,
        mode=args.mode,
        skip_web=args.skip_web,
        clean_gradle=args.clean,
        output_path=output_path,
        verbose=args.verbose,
    )

    try:
        pipeline = ApkBuildPipeline(config)
        pipeline.execute()
        return 0
    except Exception as exc:
        Logger.error(f"Error fatal durante la generación del APK: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
