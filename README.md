# El 42 Motos — Landing page

Landing de alta conversión para **El 42 Motos** (Arrecifes & Capitán Sarmiento).
Sitio estático, sin build step. Se abre con doble clic en `index.html` o se sube a cualquier hosting.

## Estructura

```
landing-el42motos/
├── index.html        ← estructura y secciones
├── css/styles.css    ← sistema visual (Branding 1.0)
├── js/main.js        ← config, inventario, WhatsApp, filtros
└── README.md
```

## ✅ Qué tenés que reemplazar (5 minutos)

Todo lo editable está marcado con `REEMPLAZAR` en el código.

1. **Número de WhatsApp** → `js/main.js`, en `CONFIG.whatsapp`.
   Formato Argentina celular: `54` + `9` + área (sin 0) + número (sin 15).
   Ejemplo Arrecifes (02478): `5492478123456`.

2. **Instagram** → `CONFIG.instagram` en `js/main.js` y los links `@el42motos` en `index.html`.

3. **Inventario de motos** → array `MOTOS` en `js/main.js`.
   Editá nombre, condición (`"0km"` / `"usada"`), precio, financiación y `img`.

4. **Fotos** → reemplazá las URLs de Unsplash (placeholders) por fotos reales.
   Recomendado: guardarlas en una carpeta `assets/` y usar rutas tipo `assets/honda-wave.jpg`.
   - Hero: en `index.html`, `<img class="hero__moto">`.
   - Cards: campo `img` de cada moto en `js/main.js`.
   - Instagram: `style="--img:url(...)"` en la sección Comunidad.

5. **Direcciones y Google Maps** → sección `#ubicaciones` en `index.html`
   (texto de dirección + `href` de los botones "Ver en Maps" con el link real del local).

6. **Imagen para redes (Open Graph)** → ya viene una `img/og-image.jpg` branded (1200×630) y el `og:image` está activo. Reemplazala por una con fotos reales si querés.

> **Nota demo:** esta versión sale con `<meta name="robots" content="noindex">` para no competir con el futuro sitio real de El 42 en Google. Al migrarla al dominio definitivo del cliente: quitar el `noindex`, descomentar el bloque **JSON-LD** del `<head>` (datos estructurados de las 2 sucursales) y reemplazar todos los `REEMPLAZAR` con datos reales.

## 🎨 Marca

Definida en `:root` de `css/styles.css`:
amarillo `#FEF102`, azul `#02ADEF`, negro `#050505`, grafito `#1A1F1F`.
Tipografías: Anton (títulos), Inter (texto), Roboto Condensed (precios) — vía Google Fonts.

## 🚀 Publicar

- **Netlify / Vercel**: arrastrá la carpeta. Listo.
- **Hosting compartido**: subí los archivos por FTP a `public_html`.
- **GitHub Pages**: subí el repo y activá Pages sobre la rama principal.


## 🧮 Cotizador online agregado

La sección `#cotizador` calcula cuotas estimadas desde el navegador.
El dueño puede personalizar planes editando el bloque `FINANCE_CONFIG` en `js/main.js`:

- `entregaMinimaPct`
- `entregaInicialPct`
- `gastoAdministrativoPct`
- `gastoFijo`
- `redondeo`
- `planes` con `cuotas`, `recargoTotalPct` y `nombre`

También se agregó `admin-cotizador.html`, un panel auxiliar para generar el bloque de configuración y copiarlo.
Importante: como este sitio es estático, ese panel no guarda cambios globales en el hosting. Para un admin real con login y cambios online para todos, migrar a Next.js + Supabase.
