"""
jacoco_summary.py
Genera el Step Summary de GitHub Actions con:
  1. Tabla global de metricas
  2. <details> colapsable por PAQUETE
  3. <details> colapsable por CLASE con metodos no cubiertos
"""

import xml.etree.ElementTree as ET
import os
import sys

XML_PATH = "Colivi-backend/target/site/jacoco/jacoco.xml"
MIN_COVERAGE = 90.0

METRIC_LABELS = {
    "INSTRUCTION": "Instructions",
    "BRANCH":      "Branches",
    "LINE":        "Lines",
    "COMPLEXITY":  "Complexity",
    "METHOD":      "Methods",
    "CLASS":       "Classes",
}

def pct(covered, missed):
    total = covered + missed
    return (covered / total * 100) if total > 0 else 100.0

def badge(p):
    if p >= 90: return "🟢"
    if p >= 75: return "🟡"
    return "🔴"

def counters_dict(element):
    result = {}
    for c in element.findall("counter"):
        cov = int(c.get("covered", 0))
        mis = int(c.get("missed", 0))
        result[c.get("type")] = (cov, mis)
    return result

def metric_row(label, cov, mis):
    p = pct(cov, mis)
    return f"| {badge(p)} {label} | {cov} | {mis} | **{p:.2f}%** |"

def build_summary(root):
    lines = []

    # 1. Tabla global
    lines.append("# 📊 Code Coverage — JaCoCo Report\n")
    lines.append("| Metric | Covered | Missed | % |")
    lines.append("| --- | ---: | ---: | ---: |")

    global_counters = counters_dict(root)
    for key, label in METRIC_LABELS.items():
        if key in global_counters:
            cov, mis = global_counters[key]
            lines.append(metric_row(label, cov, mis))

    lines.append(f"\n> **Umbral minimo:** {MIN_COVERAGE:.0f}%  🟢 >=90%  🟡 >=75%  🔴 <75%\n")
    lines.append("---\n")
    lines.append("## 📦 Detalle por paquete\n")

    packages = root.findall("package")
    if not packages:
        lines.append("_Sin datos de paquetes en el XML._")
        return "\n".join(lines)

    for pkg in sorted(packages, key=lambda p: p.get("name", "")):
        pkg_name = pkg.get("name", "").replace("/", ".")
        pkg_counters = counters_dict(pkg)

        line_cov, line_mis = pkg_counters.get("LINE", (0, 0))
        br_cov,   br_mis   = pkg_counters.get("BRANCH", (0, 0))
        line_pct  = pct(line_cov, line_mis)
        br_pct    = pct(br_cov,   br_mis)

        pkg_badge = badge(min(line_pct, br_pct))
        pkg_label = (
            f"{pkg_badge} <code>{pkg_name}</code> &nbsp;·&nbsp; "
            f"Lines: {line_pct:.1f}% &nbsp;·&nbsp; Branches: {br_pct:.1f}%"
        )

        lines.append("<details>")
        lines.append(f"<summary>{pkg_label}</summary>\n")
        lines.append("| Class | Lines % | Branches % | Methods % | Complexity % |")
        lines.append("| --- | ---: | ---: | ---: | ---: |")

        classes = pkg.findall("class")
        for cls in sorted(classes, key=lambda c: c.get("name", "")):
            cls_name = cls.get("name", "").split("/")[-1]
            cls_c = counters_dict(cls)

            def fmt(key, d=cls_c):
                cov2, mis2 = d.get(key, (0, 0))
                p2 = pct(cov2, mis2)
                return f"{badge(p2)} {p2:.1f}%"

            lines.append(
                f"| `{cls_name}` | {fmt('LINE')} | {fmt('BRANCH')} | {fmt('METHOD')} | {fmt('COMPLEXITY')} |"
            )

        # Metodos no cubiertos por clase
        for cls in sorted(classes, key=lambda c: c.get("name", "")):
            cls_name = cls.get("name", "").split("/")[-1]
            uncovered = []
            for method in cls.findall("method"):
                mc = counters_dict(method)
                m_cov, m_mis = mc.get("INSTRUCTION", (0, 0))
                if m_mis > 0:
                    m_name = method.get("name", "?")
                    m_desc = method.get("desc", "")
                    m_pct  = pct(m_cov, m_mis)
                    uncovered.append((m_name, m_desc, m_cov, m_mis, m_pct))

            if uncovered:
                uncov_label = f"🔍 <code>{cls_name}</code> — {len(uncovered)} metodo(s) con cobertura incompleta"
                lines.append("")
                lines.append("<details>")
                lines.append(f"<summary>{uncov_label}</summary>\n")
                lines.append("| Method | Covered | Missed | % |")
                lines.append("| --- | ---: | ---: | ---: |")
                for m_name, m_desc, m_cov, m_mis, m_pct in sorted(uncovered, key=lambda x: x[4]):
                    lines.append(f"| `{m_name}{m_desc}` | {m_cov} | {m_mis} | {badge(m_pct)} {m_pct:.1f}% |")
                lines.append("\n</details>\n")

        lines.append("\n</details>\n")

    return "\n".join(lines)


if not os.path.exists(XML_PATH):
    print(f"[jacoco_summary] {XML_PATH} no encontrado — omitiendo resumen.")
    sys.exit(0)

tree = ET.parse(XML_PATH)
root = tree.getroot()
report_md = build_summary(root)

summary_file = os.environ.get("GITHUB_STEP_SUMMARY")
if summary_file:
    with open(summary_file, "w", encoding="utf-8") as f:
        f.write(report_md)
    print("[jacoco_summary] Resumen escrito en GITHUB_STEP_SUMMARY.")
else:
    print(report_md)