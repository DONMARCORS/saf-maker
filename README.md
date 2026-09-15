# SAF Maker · Generador de paquetes SAF para DSpace

Aplicación web 100% en el navegador para preparar paquetes **SAF (Simple Archive Format)** listos para importar en **DSpace**, sin instalar nada y sin servidor.

🚀 **Desplegada en:** <https://saf.marcorivera.xyz/>

---

## ¿Qué hace?

1. **Cargas tu CSV de metadatos** (drag & drop). Se detectan automáticamente el delimitador (coma, punto y coma o TAB) y la codificación (UTF-8 o ISO-8859-1/Latin-1).
2. **La herramienta interpreta tus columnas**: `dc.title` y las demás cabeceras `schema.element[.qualifier]` se convierten en metadatos Dublin Core (los esquemas que no son `dc` generan su propio `metadata_<esquema>.xml`). Columnas especiales como `filename`, `bundle:THUMBNAIL`, `collection` y `handle` se detectan y se pueden ajustar en el panel de mapeo.
3. **Asignas los archivos y miniaturas**: sueltas una carpeta de fuentes y la app empareja los archivos por nombre contra las referencias del CSV; también puedes arrastrarlos item a item. Se soporta la sintaxis estilo SAFCreator `archivo.jpg__bundle:THUMBNAIL` (y `primary:`/`description:`).
4. **Validas y exportas**: revisas qué items tienen metadatos/archivos/miniaturas y descargas el **ZIP SAF** → con estructura `item_000/`, `item_001/`, … con `dublin_core.xml`, `contents`, archivos y opcionalmente `collections`/`handle`.

## ¿Cómo se importa el ZIP en DSpace?

- **Dentro de DSpace 7.4+: «Batch Import (ZIP)»** en el menú del administrador (Import → Batch Import).
- **Por línea de comandos** (todas las versiones): `[dspace]/bin/dspace import -a -e usuario@correo -c HANDLE_COLECCION -s directorio_del_zip -z nombre.zip -m mapfile`.
- Pruébalo primero con la opción de validación (`--validate` / «Validate Only») para verificar que el SAF es aceptado sin tocar contenido.

## ¿Con qué versiones de DSpace funciona?

El formato SAF es estable, por lo que el ZIP generado es compatible con **DSpace 6, 7, 8 y 9** (y versiones posteriores que mantengan el Simple Archive Format):

| Función | Soporte |
|---|---|
| `dublin_core.xml` / `metadata_<esquema>.xml` | Todas las versiones |
| `contents` con bundles (`bundle:THUMBNAIL`, `bundle:TEXT`, …) | Todas las versiones |
| Archivo `collections` (colección por item, la primera es la propietaria) | Todas las versiones |
| Archivo `handle` | Todas las versiones |
| Opciones por archivo `primary:` / `description:` | Todas las versiones |
| Import desde ZIP (`-z`) | Todas las versiones |
| «Batch Import (ZIP)» desde la interfaz web | DSpace 7.4+ |

## Cosas a tener en cuenta

- **Registro de metadatos**: cada campo que uses (p. ej. `dc.description.abstract` o los esquemas `r3d.*`) debe estar registrado en el **Metadata Registry** de tu instancia de DSpace. Si un campo no existe, la importación fallará.
- **Miniaturas**: si activas «Generar miniatura automática», la app crea un `.jpg` (bundle `THUMBNAIL`) a partir de las imágenes de `ORIGINAL`. También puedes indicar tus propias miniaturas con una columna `bundle:THUMBNAIL` o arrastrándolas.
- **Colecciones**: si el CSV incluye columna `collection`, se escribe el archivo `collections` por item. Sin esa columna, el item se importa a la colección que elijas en el momento de importar.
- **Selección de colección por item**: la primera línea del archivo `collections` marca la colección propietaria; para que un item pertenezca a varias, pon una por línea.
- **Precaución con valores especiales**: los `&` se escapan automáticamente (`&amp;`) según el formato SAF; no hace falta escapar nada a mano.
- **Lotes grandes**: todo se procesa en tu navegador. Para miles de archivos el ZIP puede requerir bastante memoria: si quieres dividir, carga un CSV con un subconjunto de registros.
- **Privacidad**: tu CSV y tus archivos **nunca salen de tu máquina**; no hay servidor detrás guardando datos.

## Formato del CSV

- Primera fila = cabeceras. Ejemplo:

```csv
dc.title,dc.description.abstract,dc.date.issued,filename,bundle:THUMBNAIL,collection,id
Mi recurso,Resumen del recurso,2024,documento.pdf,,123456789/239,
Otro recurso,Resumen B||Resumen C,2023,imagen.jpg,imagen.jpg__bundle:THUMBNAIL,123456789/240,+
```

- **Multivalores** separados por `||` (configurable).
- **Referencias a archivos**: columnas `filename`/`bitstream` (bundle `ORIGINAL`), `bundle:THUMBNAIL` etc. En una celda puedes usar `nombre__bundle:THUMBNAIL`, `nombre__primary:true`, `nombre__description:...`.
- Cualquier columna cuyo nombre no encaje se puede configurar en el panel de mapeo (metadato, archivos, colecciones, handle o ignorar).

## Desarrollo local

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en dist/
npm test         # tests unitarios (Vitest)
```

## Tecnología

React 19 + TypeScript + Vite · CSV con PapaParse · ZIP con JSZip · Sin backend (100% estático).

## Licencia

MIT