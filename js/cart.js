// ===== Modo de compra (mayorista / minorista) =====
const MODE_KEY = "koda_mode";

function getMode() {
    return localStorage.getItem(MODE_KEY) === "mayorista" ? "mayorista" : "minorista";
}

function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode === "mayorista" ? "mayorista" : "minorista");
}

// ===== Carrito (persistido por usuario logueado, o como invitado) =====
function getCartKey() {
    const user = getCurrentUser();
    return user ? ("koda_cart_" + user.id) : "koda_cart_guest";
}

function getCart() {
    return getJSON(getCartKey(), []);
}

function saveCart(cart) {
    setJSON(getCartKey(), cart);
}

function addToCart(productId, cantidad) {
    const product = getProductById(productId);
    if (!product || product.consultar) return;
    cantidad = Math.max(1, parseInt(cantidad, 10) || 1);
    const cart = getCart();
    const existing = cart.find(i => i.productId === Number(productId));
    if (existing) {
        existing.cantidad += cantidad;
    } else {
        cart.push({ productId: Number(productId), cantidad: cantidad });
    }
    saveCart(cart);
}

function updateCartQty(productId, cantidad) {
    cantidad = parseInt(cantidad, 10);
    let cart = getCart();
    if (!cantidad || cantidad < 1) {
        cart = cart.filter(i => i.productId !== Number(productId));
    } else {
        const item = cart.find(i => i.productId === Number(productId));
        if (item) item.cantidad = cantidad;
    }
    saveCart(cart);
}

function removeFromCart(productId) {
    const cart = getCart().filter(i => i.productId !== Number(productId));
    saveCart(cart);
}

function clearCart() {
    saveCart([]);
}

function mergeGuestCartIntoUser(userId) {
    const guestCart = getJSON("koda_cart_guest", []);
    if (guestCart.length === 0) return;
    const userKey = "koda_cart_" + userId;
    const userCart = getJSON(userKey, []);
    guestCart.forEach(item => {
        const existing = userCart.find(i => i.productId === item.productId);
        if (existing) {
            existing.cantidad += item.cantidad;
        } else {
            userCart.push(item);
        }
    });
    setJSON(userKey, userCart);
    localStorage.removeItem("koda_cart_guest");
}

// ===== Calculo de totales segun el modo activo =====
function getUnitPrice(product, mode) {
    if (product.consultar) return null;
    return mode === "mayorista" ? product.precioMayorista : product.precioMinorista;
}

function getCartDetails() {
    const mode = getMode();
    const cart = getCart();
    const items = cart.map(item => {
        const product = getProductById(item.productId);
        if (!product) return null;
        const unitPrice = getUnitPrice(product, mode);
        return {
            product: product,
            cantidad: item.cantidad,
            unitPrice: unitPrice,
            lineTotal: unitPrice * item.cantidad
        };
    }).filter(Boolean);

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const readyForMayorista = subtotal >= MAYORISTA_MIN;
    const missingForMayorista = Math.max(0, MAYORISTA_MIN - subtotal);

    return {
        mode: mode,
        items: items,
        subtotal: subtotal,
        readyForMayorista: readyForMayorista,
        missingForMayorista: missingForMayorista
    };
}

// ===== Pedidos =====
const ORDERS_KEY = "koda_orders";

function getAllOrders() {
    return getJSON(ORDERS_KEY, []);
}

function getOrdersForUser(userId) {
    return getAllOrders().filter(o => o.userId === userId).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function createOrder(order) {
    const orders = getAllOrders();
    orders.push(order);
    setJSON(ORDERS_KEY, orders);
}

function updateOrderStatus(orderId, estado) {
    const orders = getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.estado = estado;
        setJSON(ORDERS_KEY, orders);
    }
}
