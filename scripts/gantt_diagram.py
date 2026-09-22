import os
import requests
import pandas as pd
from datetime import datetime

# ==========================================
# CONFIGURACIÓN
# ==========================================
REPO_OWNER = "vvu981"          # Tu usuario u organización en GitHub
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "docs", "prs_aprobadas_colivi.xlsx")
REPO_NAME = "Colivi-TFG"

# Token de GitHub (Recomendado para evitar límites de API de 60 peticiones/hora):
# Puedes generar uno en GitHub -> Settings -> Developer settings -> Personal access tokens (Tokens classic)
# con permisos 'repo' (si es privado) o 'public_repo' (si es público).
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

HEADERS = {
    "Accept": "application/vnd.github.v3+json",
}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"


def get_all_merged_prs(owner: str, repo: str) -> list:
    """Obtiene todas las PRs cerradas con paginación."""
    prs = []
    page = 1
    per_page = 100

    print(f"Consultando PRs de {owner}/{repo}...")
    while True:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
        params = {
            "state": "closed",
            "sort": "created",
            "direction": "asc",
            "per_page": per_page,
            "page": page
        }
        response = requests.get(url, headers=HEADERS, params=params)
        
        if response.status_code == 401:
            raise Exception("Token de GitHub no válido o no autorizado.")
        elif response.status_code == 404:
            raise Exception("Repositorio no encontrado. Si es privado, configura tu GITHUB_TOKEN.")
        elif response.status_code != 200:
            raise Exception(f"Error en la API de GitHub ({response.status_code}): {response.json().get('message')}")

        data = response.json()
        if not data:
            break

        # Filtramos solo las que realmente se mergearon (no las cerradas sin merge)
        merged_in_page = [pr for pr in data if pr.get("merged_at") is not None]
        prs.extend(merged_in_page)

        if len(data) < per_page:
            break
        page += 1

    print(f"Total de PRs mergeadas encontradas: {len(prs)}")
    return prs


def get_pr_approval_info(owner: str, repo: str, pr_number: int) -> dict:
    """Obtiene el primer reviewer que aprobó la PR y la fecha de aprobación."""
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        return {"approved": False, "approver": None, "approved_at": None}

    reviews = response.json()
    # Buscar reviews con estado APPROVED
    approved_reviews = [r for r in reviews if r.get("state") == "APPROVED"]
    
    if approved_reviews:
        # Tomamos la última aprobación antes del merge
        latest_approval = approved_reviews[-1]
        return {
            "approved": True,
            "approver": latest_approval.get("user", {}).get("login"),
            "approved_at": latest_approval.get("submitted_at")
        }
    
    return {"approved": False, "approver": None, "approved_at": None}


def main():
    prs = get_all_merged_prs(REPO_OWNER, REPO_NAME)
    records = []

    print("Verificando revisiones y aprobaciones de cada PR...")
    for pr in prs:
        pr_number = pr["number"]
        approval = get_pr_approval_info(REPO_OWNER, REPO_NAME, pr_number)

        # Si requieres estrictamente que tenga aprobación formal en GitHub:
        # Si se mergearon de forma directa/admin sin review explícito, 
        # se usa 'merged_at' como fecha de cierre/aprobación.
        fecha_creacion = pr.get("created_at")
        fecha_aprobacion = approval.get("approved_at") or pr.get("merged_at")
        fecha_merge = pr.get("merged_at")

        # Parseo de fechas para cálculos y visualización limpia
        dt_inicio = datetime.fromisoformat(fecha_creacion.replace("Z", "+00:00"))
        dt_fin = datetime.fromisoformat(fecha_merge.replace("Z", "+00:00"))
        duracion_dias = max(1, (dt_fin.date() - dt_inicio.date()).days)

        records.append({
            "Número PR": pr_number,
            "Título PR": pr["title"],
            "Rama Origen": pr["head"]["ref"],
            "Rama Destino": pr["base"]["ref"],
            "Autor": pr["user"]["login"],
            "Aprobado Por": approval["approver"] if approval["approved"] else "Merge Directo / Admin",
            "Fecha Creación": dt_inicio.strftime("%Y-%m-%d %H:%M"),
            "Fecha Aprobación": datetime.fromisoformat(fecha_aprobacion.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M"),
            "Fecha Merge": dt_fin.strftime("%Y-%m-%d %H:%M"),
            "Fecha Inicio (Gantt)": dt_inicio.strftime("%Y-%m-%d"),
            "Fecha Fin (Gantt)": dt_fin.strftime("%Y-%m-%d"),
            "Duración (Días)": duracion_dias
        })

    if not records:
        print("No se encontraron PRs para exportar.")
        return

    df = pd.DataFrame(records)

    # Ordenar cronológicamente de forma secuencial por fecha de inicio
    df.sort_values(by="Fecha Creación", ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Exportar a Excel con formato
    with pd.ExcelWriter(OUTPUT_FILE, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="PRs_Gantt", index=False)
        
        # Ajustar ancho de columnas automáticamente
        worksheet = writer.sheets["PRs_Gantt"]
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

    print(f"\n¡Listo! Archivo exportado exitosamente: {OUTPUT_FILE}")
    print(f"Total de registros exportados: {len(df)}")


if __name__ == "__main__":
    main()