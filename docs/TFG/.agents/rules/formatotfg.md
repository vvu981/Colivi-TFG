---
trigger: always_on
---

La memoria del Trabajo Fin de Grado/Máster se presentará en formato  UNE  A4,  salvo  que  las  características  especiales  del  trabajo  presentado  no  lo permitieran.

\section {Estilo,  Tipografía y    Maquetado}

Se podrán utilizar las siguientes familias de tipos de letras \url{https://tug.org/FontCatalogue/}, no se recomiendan tipos de letras con decoración excesiva:

	\begin{center}
	\begin{tabular}{p{2cm}p{7.5cm}c}
		\textbf{Tipo} & \textbf{Fuente} & \textbf{Anchura} \\ \hline
         Familia 1 & Arial, Helvética, Tahoma  	\ldots & Variable \\
         Familia 2 & Times New Roman, Palatino  Linotype,  	\ldots & Variable  \\
         Familia 3 & Courier  New,  Miriam Fixed \ldots & Fija\\
         \hline
	\end{tabular}
	\end{center}



\begin{table} 
	\begin{center}
	\begin{tabular}{l c c}
		\textbf{Tipo} & \textbf{Fuente} & \textbf{Anchura} \\ \hline
         Familia 1 & Arial, Helvética, Tahoma  	\ldots & Variable \\
         Familia 2 & Times New Roman, Palatino  Linotype,  	\ldots & Variable  \\
         Familia 3 & Courier  New,  Miriam Fixed \ldots & Fija \\
         \hline
	\end{tabular}
	\end{center}

	\caption{\label{tab:letras}Tipos de letras.}
\end{table}


La familia 1 se recomienda para los títulos de las distintas secciones del documento.

La familia 2 se recomienda para los párrafos normales.

La familia 3 se recomienda para escribir, por ejemplo, porciones de código, debido a su tamaño fijo donde es necesario un texto tabulado y se alinee perfectamente, así como cualquier otro uso de texto de tamaño de letra fijo.

Se recomienda el uso del tipo de letra Palatino Linotype en itálica para la escritura de fórmulas sencillas, para aquellas que sean más complejas se podrá usar un editor de ecuaciones, ejemplos:

$ x^2+y^2=r^2,    a+b=c$

Si fuese necesario se puede utilizar un entorno ecuación para después poder referenciarlo en el texto. La ecuacion  \ref{ec:ecuacion} es un ejemplo, pero se convierte en un flotante como las tablas y las figuras. La potencia de \LaTeX{} para la edición de ecuaciones supera el alcance de este documento, se sugiere consultar otras fuentes para ampliar la información sobre su uso.

\begin{equation}
\label{ec:ecuacion}
    x_1= \frac{-b+\sqrt{b^2-4*a*c}}{2*a}
\end{equation}




Las dimensiones del la zona de texto se definen a través del \emph{geometry}, \lstinline[language=enparrafo]!geometry!, un paquete de latex que en este caso se incluye en el estilo \textbf{UAL}, \lstinline[language=enparrafo]!\usepackage{UAL}!.

\section {Estilo ual de latex}

En el estilo se define la portada y contraportada según las recomendaciones de la escuela superior de ingeniería, véase la figura \ref{fig:facultad}.

\begin{figure}
	\begin{center}
		\includegraphics[width = 0.5\textwidth]{facultad.png}
	\end{center}
	\caption{\label{fig:facultad} Logotipo de la Escuela Superior de ingeniería }
\end{figure}



El estilo generado permite definir un documento a una cara o doble cara para lo que se tiene que seleccionar la opción "print" al incluir el paquete estilo (\lstinline[language=enparrafo]!\usepackage[print]{UAL}!). De esta forma se podrá personalizar, el pasar al la página impar en cada sección o bien a la páginas siguiente. %Para lo que se ha personalizado el comando $\ $siguiente que se ha de colocar antes del inicio de cada sección.
Además se fija la marca de agua. Otras cuestiones incorporados en el estilo son los distintos tipos de cabeceras y pies de página necesarios.

Un aspecto importante son los elementos flotantes de latex, en especial tablas y figuras. Estos son los elementos que después pueden incorporarse en los índices de la cabecera del documento. En los casos que se utilicen "códigos" también se puede incluir un índice de listados, \lstinline[language=enparrafo]!\usepackage{listing}!.

Si es necesario se puede trabajar con los paquetes para tablas largas o con aquellos que permiten hacer subfiguras.

 \section{Figuras y tablas}

Las  figuras  (o  gráficos)  y  tablas  (cuadros)  que  se  incorporen  deben  ir  numerados  (números  arábigos)  y  tener  un  título,  y  siempre  tendrán  que  tener  relación  con el contenido expuesto.  Todo elemento flotante debe referenciarse en el texto y debe colocarse  preferiblemente después de la primera vez que se cita en el texto.

Las  gráficas, fotografías,  los  diagramas,  mapas,  dibujos,  etc.serán  considerados como  figuras. Es importante que se incluya el origen de la figura, en la etiqueta, si la ha hecho el autor se coloca el texto "elaboración propia".

No se deben poner gráficos, figuras y fotos sólo para rellenar siempre se nota demasiado. Los gráficos y figuras deben ir referenciados en el texto, sino es mejor no incorporarlas en la memoria.



 \section{Listados de código}

En el dominio de la informática es habitual que un TFG/TFM deba incluir porciones de código fomateado. Incluso que se definan como un un elemento flotante especial. En \LaTeX{} existen muchas formas de resolver esta cuestión. Se ha definido un estilo llamado \lstinline[language=enparrafo]!codigo.sty! que implementa un ejemplo. Los archivos de código están una carpeta aparte igual que las figuras. \footnote{Se puede sincronizar con repositorios de código tipo \url{www.github.com} se emplea overleaf, pero es necesario mantener dos proyectos}

\subsection{Utilización del entorno verbatim}
Lo que en latex se coloca dentro de un entorno verbatim deja de ser código latex y se representan tal como aparece. Pero suele tener interacciones con el paquete  gráfico tikz. por lo que no es recomendable, es mejor usar \lstinline[language=enparrafo]!\lstinline!

\begin{verbatim}
#include <stdio.h>

int main()
{
        printf("Hola mundo");
        return 0;
}
\end{verbatim}

\subsection{Utilización de paquete listing}


Se puede escribir directamente el código dentro de un entorno y si no se especifica nada se utilizan los parámetros por defecto. Para detalle de como configurar esta utilidad es conveniente revisar la documentación del paquete

\begin{lstlisting}[caption=Ejemplo ]
#include <stdio.h>

int main()
{
        printf("Hola mundo");
        return 0;
}
}
\end{lstlisting}


Ejemplo de inclusión sin utilizar un objeto flotante. No aparecerá en el índice por poner \lstinline[language=enparrafo]!nolol=true!.

\lstinputlisting[firstline=1, firstnumber=1, nolol=true]{holamundo.c}


\lstinputlisting[caption=,language=pseudo, caption=Ejemplo en pseudocodigo]{holamundo.psc}


Realmente se trata de un paquete muy complejo que se puede complementar con el uso de entornos personalizados, cuya explotación exhaustiva queda fuera de este libro de estilo.


\chapter {Buenas prácticas}


En esta sección se incluyen una serie de cuestiones o buenas prácticas que se derivan de la experiencia, de normas básicas de elaboración de textos científicos \cite{alba2009}, y de las normas gramaticales básicas.

\begin{enumerate}
    \item Cuidado con el espacio entre palabras, utilizar \emph{hyphenation} para cortar o no palabras con los guiones. Aunque por defecto el paquete de español de latex lo gestiona aceptablemente bien.

Los signos de puntuación (comas, puntos, puntos y comas, dos puntos) así   como   el   cierre  de   comillas, paréntesis e   interrogaciones han   de   ir inmediatamente   a   continuación   (sin   espacios)   de   la   palabra   anterior   y separados  por  un  espacio  de  la  palabra siguiente.  De  modo  contrario,  los signos   de   apertura   de   comillas, paréntesis e   interrogaciones deben   ir separados  por  un  espacio  de  la  palabra  anterior e inmediatamente  antes  (sin espacio) de la palabra posterior.


En las listas \lstinline[language=enparrafo]!\begin{itemize}! \lstinline[language=enparrafo]!end{itemize}! o enumeraciones \lstinline[language=enparrafo]!\begin{enumerate}! donde no aparezca un verbo, es decir no se a una oración completa no se pone punto al final. Sólo se pone punto en el último item de la lista para finalizar el párrafo.

Por la misma razón no se deben acabar los títulos y los subtitulos con un punto. En los pies de figuras y tablas queda a criterio del autor y tutor, pero la recomendación es no ponerlo.

Aunque en español las siglas puedan marcarse con puntos entre letra y letra,  se  recomienda  utilizarlas  siempre  en  mayúscula  (siempre  sin  tilde) y  sin los    puntos.  

La  primera  vez  se emplea una acrónimo debe  ser  definido, incluyendo   el   texto   de   la   definición   entre   paréntesis   y   marcando   con mayúsculas  las  letras  que  dan  lugar  al  acrónimo.  Ejemplo:  MCU  (Multipoint Control  Unit).  En  subsiguientes  apariciones  del  acrónimo  no  debe  volverse  a incluir  la  definición.  Se  recomienda  adjuntar  al  principio  del  proyecto  una relación    detallada    de    los    acrónimos    y    su    significado,    ordenados alfabéticamente.


\Existen tres tipos de comillas: las españolas o latinas (<<comillas >>), las inglesas ("comillas") y las simples ('comillas' ). Use un único tipo a lo largo del texto. En escritos científicos es más común encontrar las inglesas o las simples. Empléelas siempre que efectúe citas textuales extraídas de algún documento.  También están las comillas abiertas y cerradas ``comillas ''. 


Evite   emplear   innecesariamente   palabras   o   expresiones   en   inglés cuando  en  español  exista  un  equivalente.  El  uso  de  términos  ingleses  no aceptados debe circunscribirse al campo técnico. Por ejemplo "planning del proyecto" en lugar de "planificación del proyecto". 

No se deben traducir sin comprobar la validez términos técnicos muy específicos si dichas traducciones no se encuentran más o menos asumidas por la comunidad científica (es decir, las   ha   leído   o   escuchado   repetidas   veces).   En   el   texto   los   términos   y expresiones inglesas no aceptados deben aparecer en cursiva.

Cuando  se  referencien  símbolos  matemáticos  en  el  texto,  estos  han  de aparecer   en   cursiva   y   de   la   misma   manera   a   como   aparecen   en   las ecuaciones.

No se deben usar frases con el verbo principal en infinitivo y sin articular. Por ejemplo no se debe escribir  “En  primer  lugar,  destacar  que  los  resultados  se  obtuvieron  por simulación”. En su lugar  “En primer  lugar se ha  de  reseñar que  los resultados...” (o “se debe”, “es preciso”, “hemos de”, “cabe” reseñar).

El sujeto (salvo que se intercale una frase subordinada) no se puede separar por comas del predicado. 

Se ha de ser   coherente  con  el  uso  de  los  tiempos  verbales.  Si  describe  lo  que  se  ha hecho en pasado, se ha de continuar  con ese tiempo a lo largo de la memoria. 

No se debe abusar del  anidamiento  de oraciones  subordinadas.  En  su  lugar  es recomendable  usar  una  secuencia  de  oraciones  cortas,  que  son  de  más  fácil compresión. Asimismo, se deben evitar las negaciones encadenadas 
“no  aumentar  el  parámetro  beta  implica  que  no  se  aumenta  la  ganancia”, siendo preferible afirmar “reducir el parámetro beta reduce la ganancia”.

Se han de reescribir   las  formas pasivas.  Utilice,  en  su  lugar,  la  pasiva  refleja.  Es preferible “se ha desarrollado un sistema” a “un sistema ha sido desarrollado”. La construcción en pasiva es típicamente inglesa y su abuso denota que estás traduciendo algo (lo cual no es pecado si dices de quien lo traduces). Lo mejor es escribir en castellano. Ejemplo: “Puede  que  sean  retrasadas...”    se  debería  escribir  “Pueden  retrasarse”  o  “puede  que  se retrasen”.

Todos los párrafos concluyen con un punto final.
En  el  texto,  si se utilizan números se han de expresar   con  palabras   si  son  menores  o  iguales  que veinte y con números si son superiores a ese valor o presentan decimales.
A  la  hora  de  emplear  la  coma  o  el  punto  para  expresar  los decimales en los números se debe ser congruente, no usarlos indistintamente.
