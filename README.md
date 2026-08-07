# KODA BEBIDAS — Sitio web mayorista / minorista

Sitio de venta mayorista y minorista de bebidas para KODA BEBIDAS (Córdoba, Argentina).
Construido en **HTML + CSS + JavaScript puro**, sin build ni backend: todo el estado
(usuarios, carrito, pedidos, catálogo editado desde el admin) se guarda en el
`localStorage` del navegador.

## Cómo correrlo

**Opción recomendada:** abrí la carpeta en VS Code e instalá la extensión **Live Server**,
click derecho sobre `index.html` → "Open with Live Server". Esto evita las restricciones
que algunos navegadores aplican a los archivos abiertos con `file://`.

**Opción simple:** doble click en `index.html` para abrirlo directo en el navegador.
Funciona igual, pero si tu navegador restringe `localStorage` en `file://` (poco común,
pero puede pasar en algunas configuraciones), usá la opción de Live Server.

No hace falta `npm install` ni ningún paso de compilación.

## Cuenta de administrador

El sitio crea automáticamente un usuario admin la primera vez que se carga:

- **Email:** `admin@kodabebidas.com`
- **Contraseña:** `admin123`

Con esa cuenta se accede a `admin.html` (o al ícono de engranaje que aparece en el
header cuando estás logueado como admin) para cargar, editar o eliminar productos,
y para ver los pedidos entrantes.

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

## Catálogo de productos

`js/data/products.js` contiene ~1159 productos generados a partir de los dos Excel
provistos (`Vinos Mayorista Minorista.xlsx` y `Otras Bebidas Mayorista Minorista.xlsx`,
lista base "F&F" del 05/08/2026): 812 vinos agrupados por bodega y 347 productos más
repartidos en Fernet, Vodka, Whisky, Espumantes, Licores, Aperitivos, Cervezas,
Gaseosas, Gin, Ron, Cognac, Tequila y Otros.

Como no había fotos reales para ~1160 productos, todos usan el mismo placeholder
genérico (`img/placeholder-botella.svg`). Podés reemplazar la imagen de un producto
puntual desde el panel de administración (campo "imagen" al editar, o directamente en
`js/data/products.js` para cambios masivos).

Los cambios hechos desde el panel de administración (editar, eliminar, crear producto)
**no modifican `products.js`**: se guardan como overrides en `localStorage`
(`koda_product_overrides`, `koda_product_deleted`, `koda_product_custom`) y se combinan
con la base al mostrar el catálogo. Si necesitás cambios masivos y permanentes en el
catálogo, es más simple editar `js/data/products.js` directamente.

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
├── css/style.css          Estilos de todo el sitio
├── js/
│   ├── data/products.js   Catálogo (generado desde los Excel)
│   ├── utils.js            Helpers (moneda, localStorage, WhatsApp, header)
│   ├── auth.js              Registro / login / recuperación de contraseña
│   ├── cart.js               Carrito, modo mayorista/minorista, pedidos
│   ├── catalog.js, product.js, cart-page.js, checkout.js,
│   │   auth-pages.js, profile.js, admin.js   Lógica de cada página
└── img/                    Logo, hero e ícono placeholder (SVG propios)
```

## Limitaciones a tener en cuenta

- Es un esquema 100% del lado del cliente: las contraseñas se guardan hasheadas de
  forma simple en el navegador del propio usuario, no en un servidor. Está pensado
  como demo funcional, no como un sistema de autenticación listo para producción.
- La recuperación de contraseña es simulada: como no hay servidor de emails, el
  "código" se muestra en pantalla en vez de enviarse por correo.
- Los usuarios, carritos y pedidos viven en el `localStorage` de cada navegador: no se
  comparten entre dispositivos ni entre distintos navegadores de la misma persona.
