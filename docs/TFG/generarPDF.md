1. echo 'export PATH="/c/LaTex/miktex/bin/x64:$PATH"' >> ~/.bash_profile
source ~/.bash_profile


2. pdflatex -synctex=1 -interaction=nonstopmode main.tex && \
bibtex main && \
pdflatex -synctex=1 -interaction=nonstopmode main.tex && \
pdflatex -synctex=1 -interaction=nonstopmode main.tex
