# Velad: Mapa de los Últimos Tiempos

Mapa de investigación bíblica de los últimos tiempos: Mateo 24, Daniel, Zacarías y Apocalipsis, con lugares, fotos e hilos que los conectan.

**Sitio:** https://augustodichuk-misio.github.io/Velad/

Es un sitio estático, sin frameworks ni build: GitHub Pages publica los archivos tal cual.

| Archivo | Qué tiene |
|---|---|
| `index.html` | La página (estructura, encabezado, recorrido, créditos). |
| `data.json` | **Todo el contenido del mapa**: bloques, capítulos, tarjetas, posiciones, hilos, textos de cada dossier. |
| `css/app.css`, `js/app.js` | Diseño y funcionamiento del mapa. |
| `css/edit.css`, `js/edit.js` | Modo edición. |
| `img/` | Fotos de las tarjetas y del recorrido. |
| `og.jpg` | Imagen que aparece al compartir el link. |

## Crear el token (una sola vez)

1. Entrá a GitHub → tu foto (arriba a la derecha) → **Settings**.
2. Abajo de todo, en el menú de la izquierda: **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Ponele un nombre (por ejemplo “Velad web”) y elegí una fecha de vencimiento.
4. En **Repository access** elegí **Only select repositories** y marcá solamente **Velad**.
5. En **Permissions → Repository permissions**, buscá **Contents** y elegí **Read and write**. No hace falta nada más.
6. Tocá **Generate token** y copiá el código (empieza con `github_pat_…`). GitHub lo muestra una sola vez.

## Usar el Modo edición

7. Abrí el sitio y tocá el **lápiz** chiquito de la esquina inferior derecha (o entrá a `…/Velad/?editar`). Pegá el token: queda guardado solo en ese dispositivo.
8. Editá y tocá **Guardar**:
   - **Mover**: arrastrá las tarjetas con el dedo; los hilos las siguen. Tocá una tarjeta para editar título, etiqueta, referencia, temas, color y el texto del dossier (negrita, cursiva, títulos, listas, “Cita” para versículos y “Recuadro”). Desde ahí también podés borrar la tarjeta, quitar hilos o **crear un mapa dentro** de ella.
   - **Hilo**: tocá una tarjeta y después otra para unirlas. Si ya estaban unidas, se borra el hilo.
   - **+ Tarjeta** agrega una tarjeta en el centro de la pantalla. **Mapa** edita el título y la línea de abajo del mapa actual.
   - **Guardar** sube `data.json` al repo con el mensaje “Edición desde la web”. Aparece “Guardado ✓ (se publica en ~1 min)”: GitHub Pages tarda alrededor de un minuto en mostrar el cambio a todos.

En **⋯** está **Cerrar sesión**, que borra el token de ese dispositivo. Si el token se pierde o vence, creá uno nuevo con los pasos de arriba. Si editaste desde otro dispositivo mientras tanto, el sitio te avisa antes de sobrescribir.

---

Ubicaciones: [OpenBible.info Bible Geocoding](https://www.openbible.info/geo/), CC BY 4.0. Fotos de Wikimedia Commons, cada una con su licencia (ver “Créditos y fuentes” en el sitio). Citas bíblicas: Reina-Valera 1960.
