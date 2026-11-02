# 7 meses 🌷

Jueguito de atrapar 7 corazones (uno por mes) que abre una cartita. HTML/CSS/JS puro, sin build ni dependencias.

## Publicar en kitty.mattias.cl

1. Crea un repo en GitHub (puede ser privado si tu plan lo permite con Pages; si no, público) y sube estos archivos a la rama `main`.
2. En el repo: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. En el DNS de `mattias.cl`, crea un registro **CNAME**: `kitty` → `<tu-usuario>.github.io` (sin el nombre del repo).
4. En **Settings → Pages**, confirma que el dominio diga `kitty.mattias.cl` (lo toma del archivo `CNAME`) y, cuando aparezca disponible, activa **Enforce HTTPS**.
5. Abre https://kitty.mattias.cl en el celular y pruébalo entero antes de mandarlo.

## Qué editar

- Texto de la carta: `index.html`, dentro de `<article class="paper">`.
- Fecha de inicio, cantidad de corazones y nombres de meses: arriba en `js/main.js`.
- Colores: variables al inicio de `css/style.css`.

Probar en local: abre `index.html` en el navegador, o `python3 -m http.server` en la carpeta.
