---
trigger: always_on
---

Siempre que quieras crear el pdf usando latex, debes usar este comando:
pdflatex -synctex=1 -interaction=nonstopmode main.tex && \
bibtex main && \
pdflatex -synctex=1 -interaction=nonstopmode main.tex && \
pdflatex -synctex=1 -interaction=nonstopmode main.tex
