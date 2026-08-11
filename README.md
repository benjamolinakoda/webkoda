# KODA BEBIDAS — Sitio web mayorista / minorista

Sitio de venta mayorista y minorista de bebidas para KODA BEBIDAS (Córdoba, Argentina).
Frontend en **HTML + CSS + JavaScript puro** (sin frameworks ni build), con **Firebase**
como backend: Authentication para usuarios reales y Firestore para carritos, pedidos y
el catálogo editado desde el panel de administración. Los pedidos y el catálogo son
compartidos entre todos los dispositivos y navegadores, no quedan aislados por usuario.

## Cómo correrlo

El sitio usa módulos de JavaScript (`import`/`export`) para hablar con Firebase, así que
**no se puede abrir con doble click** (los navegadores bloquean módulos en páginas
`file://`). Tiene que servirse por HTTP:

**Local (recomendado para probar):** abrí la carpeta en VS Code, instalá la extensión
**Live Server**, click derecho sobre `index.html` → "Open with Live Server".

**Producción:** desplegar los archivos en cualquier hosting estático (Netlify, Vercel,
GitHub Pages, Firebase Hosting). No hace falta build ni `npm install`.

## Firebase

El proyecto está conectado a un proyecto real de Firebase (`koda-bebidas`). La config
pública vive en `js/firebase-init.js` (son claves públicas, no secretas — así funciona
Firebase). Los servicios usados:

- **Authentication** (Email/contraseña) — reemplaza el login/registro.
- **Firestore** — colecciones:
  - `users/{uid}` — perfil (nombre, teléfono, dirección, `isAdmin`).
  - `carts/{uid}` — carrito del usuario logueado.
  - `orders/{orderId}` — pedidos (visibles para el dueño y para cualquier admin).
  - `productOverrides`, `productDeleted`, `productCustom` — ediciones del catálogo
    hechas desde el panel admin (el catálogo base sigue viviendo en
    `js/data/products.js`, estas colecciones solo guardan los cambios).

Las reglas de seguridad están en [`firestore.rules`](firestore.rules) — hay que
publicarlas en Firebase Console → Firestore Database → Reglas.

### Convertir un usuario en administrador

No hay forma de auto-otorgarse admin desde el sitio (por seguridad). Para dar acceso al
panel `admin.html`: Firebase Console → Firestore Database → Datos → colección `users` →
abrir el documento del usuario → cambiar el campo `isAdmin` de `false` a `true`.

## Reglas de negocio implementadas

- **Minorista:** cualquier usuario registrado compra a precio de lista minorista, sin
  mínimo de compra.
- **Mayorista:** para finalizar un pedido en modalidad mayorista el subtotal del
  carrito debe ser **igual o superior a $100.000 ARS** (dato tomado de la planilla de
  precios provista: *"Mayorista = compras desde $100.000"*). Si no se llega al mínimo,
  el carrito muestra cuánto falta y no deja avanzar al checkout mayorista, pero sí
  permite seguir comprando en modo minorista.
- El modo de compra (mayorista/minorista) se elige con el toggle que aparece en el
  catálogo, el detalle de producto y el carrito, y recalcula todos los precios al vuelo.
- Los productos marcados como **"Consultar"** en la planilla original (13 productos sin
  precio fijo) se muestran en el catálogo sin precio ni botón de "agregar al carrito":
  en su lugar tienen un botón que abre WhatsApp para consultar el precio.
- El sitio **no procesa pagos**. Al finalizar un pedido se genera un resumen y se abre
  WhatsApp (`https://wa.me/5493515514530`) con el pedido pre-cargado para coordinar
  pago y entrega.
- No se puede finalizar una compra sin estar registrado/logueado (navegar el catálogo
  y armar el carrito sí está permitido como invitado; el carrito de invitado se fusiona
  con el del usuario al iniciar sesión o registrarse).
- La recuperación de contraseña usa el flujo real de Firebase: se envía un email con un
  link para elegir contraseña nueva.

## Catálogo de productos

`js/data/products.js` contiene ~1159 productos generados a partir de los dos Excel
provistos (`Vinos Mayorista Minorista.xlsx` y `Otras Bebidas Mayorista Minorista.xlsx`,
lista base "F&F" del 05/08/2026): 812 vinos agrupados por bodega y 347 productos más
repartidos en Fernet, Vodka, Whisky, Espumantes, Licores, Aperitivos, Cervezas,
Gaseosas, Gin, Ron, Cognac, Tequila y Otros.

Como no había fotos reales para ~1160 productos, cada producto usa un placeholder
propio de su categoría (`img/categorias/placeholder-<categoria>.svg` — botella de vino,
lata de cerveza, botella de champagne, etc., cada una con su color) en vez de un ícono
único genérico. Podés reemplazar la imagen de un producto puntual por una foto real
desde el panel de administración (campo "imagen" al editar), o directamente en
`js/data/products.js` para cambios masivos.

Los cambios hechos desde el panel de administración (editar, eliminar, crear producto)
**no modifican `products.js`**: se guardan en Firestore (`productOverrides`,
`productDeleted`, `productCustom`) y se combinan con la base al mostrar el catálogo.

## Estructura del proyecto

```
KODA/
├── index.html            Home
├── catalogo.html          Catálogo con filtros, buscador y toggle mayorista/minorista
├── producto.html          Detalle de producto
├── carrito.html           Carrito
├── checkout.html          Datos de entrega + redirección a WhatsApp
├── login.html / registro.html / recuperar.html
├── perfil.html            Datos del usuario + historial de pedidos
├── admin.html             Panel de administración (productos y pedidos)
├── nosotros.html / contacto.html
├── firestore.rules       Reglas de seguridad de Firestore
├── css/style.css          Estilos de todo el sitio
├── js/
│   ├── data/products.js   Catálogo base (generado desde los Excel)
│   ├── firebase-init.js   Config e inicialización de Firebase (Auth + Firestore)
│   ├── utils.js            Helpers (moneda, WhatsApp, acceso al catálogo)
│   ├── auth.js              Login / registro / recuperación (Firebase Auth)
│   ├── cart.js               Carrito y pedidos (Firestore)
│   ├── header.js             Estado del header (badge carrito, sesión) en cada página
│   ├── catalog.js, product.js, cart-page.js, checkout.js,
│   │   auth-pages.js, profile.js, admin.js, home.js,
│   │   static-page.js        Lógica de cada página (todos módulos ES)
└── img/                    Logo, hero e ícono placeholder (SVG propios)
```

## Limitaciones a tener en cuenta

- El catálogo se muestra sin login (lectura pública en Firestore), pero comprar sí
  requiere cuenta. Las reglas de Firestore validan quién puede leer/escribir qué, pero
  los precios de un pedido no se re-validan server-side contra el catálogo real — para
  un volumen chico/mediano de pedidos esto es razonable, pero si el proyecto crece
  conviene sumar validación en un backend (Cloud Function) antes de confiar ciegamente
  en el subtotal que manda el navegador.
- El primer administrador se otorga a mano en la consola de Firebase (ver arriba); no
  hay una UI para promover a otros usuarios a admin todavía.
