const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = process.env.PORT || 3333;
const FIREBASE_DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL || "https://boer-373bc-default-rtdb.firebaseio.com";
const DATA_DIR = path.join(__dirname);
const DATA_FILE = path.join(DATA_DIR, "db.json");

const emptyDatabase = {
  products: {},
  orders: {},
  users: {},
  favorites: {},
  pushTokens: {},
  coupons: {
    TURBO10: {
      code: "TURBO10",
      discountPercent: 10,
      active: true,
      description: "10% de desconto no carrinho"
    }
  }
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeDatabase(emptyDatabase);
  }
}

async function readDatabase() {
  await ensureDataFile();
  const raw = (await fs.readFile(DATA_FILE, "utf-8")).replace(/^\uFEFF/, "");
  return {
    ...emptyDatabase,
    ...(raw ? JSON.parse(raw) : {})
  };
}

async function writeDatabase(database) {
  await fs.writeFile(DATA_FILE, JSON.stringify({ ...emptyDatabase, ...database }, null, 2));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(data, null, 2));
}

async function readBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function firebaseRequest(pathname, method = "GET", body) {
  const url = `${FIREBASE_DATABASE_URL}/${pathname}.json`;
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Firebase ${method} ${pathname} falhou com status ${response.status}`);
  }

  return response.json();
}

async function syncFirebasePath(pathname, value) {
  try {
    if (value === null) {
      await firebaseRequest(pathname, "DELETE");
    } else {
      await firebaseRequest(pathname, "PUT", value);
    }

    return true;
  } catch (error) {
    console.warn(`[sync] ${error.message}`);
    return false;
  }
}

async function sendExpoPushNotification(token, title, body, data = {}) {
  if (!token || !String(token).startsWith("ExponentPushToken[")) {
    console.warn("[push] Token Expo ausente ou invalido.");
    return false;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        data
      })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`Expo push falhou com status ${response.status}`);
    }

    if (result?.data?.status === "error") {
      throw new Error(result.data.message || "Expo push retornou erro");
    }

    return true;
  } catch (error) {
    console.warn(`[push] ${error.message}`);
    return false;
  }
}

async function getPushTokens(database) {
  const localTokens = database.pushTokens || {};

  try {
    const remoteTokens = await firebaseRequest("pushTokens");

    if (remoteTokens && Object.keys(remoteTokens).length > 0) {
      database.pushTokens = { ...localTokens, ...remoteTokens };
      await writeDatabase(database);
      return database.pushTokens;
    }
  } catch (error) {
    console.warn(`[push] Nao foi possivel buscar tokens no Firebase: ${error.message}`);
  }

  return localTokens;
}

async function notifyAdmins(database, order) {
  const pushTokens = await getPushTokens(database);
  const adminTokens = Object.values(pushTokens)
    .filter((item) => item.role === "admin")
    .map((item) => item.token);

  if (adminTokens.length === 0) {
    console.warn("[push] Nenhum token de admin encontrado para notificar nova compra.");
  }

  await Promise.all(
    adminTokens.map((token) =>
      sendExpoPushNotification(
        token,
        "Nova compra concluida",
        `${order.customerName} concluiu o pedido ${order.id}. Total: R$ ${Number(order.total || 0).toFixed(2)}.`,
        { type: "new-order", orderId: order.id }
      )
    )
  );
}

async function notifyOrderCustomer(database, order, status) {
  const pushTokens = await getPushTokens(database);
  const token = pushTokens?.[order.userId]?.token;

  if (!token) {
    console.warn(`[push] Token nao encontrado para usuario ${order.userId}.`);
  }

  await sendExpoPushNotification(
    token,
    "Status do pedido atualizado",
    `Seu pedido ${order.id} mudou para ${status}.`,
    { type: "order-status", orderId: order.id, status }
  );
}

async function pullFirebaseIntoLocal() {
  try {
    const [products, orders, users, favorites, pushTokens, coupons] = await Promise.all([
      firebaseRequest("products"),
      firebaseRequest("orders"),
      firebaseRequest("users"),
      firebaseRequest("favorites"),
      firebaseRequest("pushTokens"),
      firebaseRequest("coupons")
    ]);
    const database = await readDatabase();

    await writeDatabase({
      products: { ...database.products, ...(products || {}) },
      orders: { ...database.orders, ...(orders || {}) },
      users: { ...database.users, ...(users || {}) },
      favorites: { ...database.favorites, ...(favorites || {}) },
      pushTokens: { ...database.pushTokens, ...(pushTokens || {}) },
      coupons: { ...database.coupons, ...(coupons || {}) }
    });

    return true;
  } catch (error) {
    console.warn(`[sync] Nao foi possivel puxar dados do Firebase: ${error.message}`);
    return false;
  }
}

function valuesByDateDesc(records) {
  return Object.values(records).sort((a, b) => {
    const dateA = Date.parse(a.createdAt || "") || 0;
    const dateB = Date.parse(b.createdAt || "") || 0;
    return dateB - dateA;
  });
}

function routeParts(pathname) {
  return pathname.split("/").filter(Boolean);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const parts = routeParts(url.pathname);

    if (request.method === "OPTIONS") {
      return sendJson(response, 200, { ok: true });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return sendJson(response, 200, {
        name: "Tuning Shop API JSON",
        dataFile: DATA_FILE,
        endpoints: [
          "/products",
          "/coupons",
          "/orders",
          "/checkout",
          "/users/:uid",
          "/push-tokens",
          "/push-tokens/:uid/test",
          "/favorites/:uid",
          "/sync/firebase"
        ]
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return sendJson(response, 200, { ok: true });
    }

    if (url.pathname === "/sync/firebase" && request.method === "POST") {
      const direction = url.searchParams.get("direction") || "pull";
      const database = await readDatabase();

      if (direction === "push") {
        const synced = await Promise.all([
          syncFirebasePath("products", database.products),
          syncFirebasePath("orders", database.orders),
          syncFirebasePath("users", database.users),
          syncFirebasePath("favorites", database.favorites),
          syncFirebasePath("pushTokens", database.pushTokens),
          syncFirebasePath("coupons", database.coupons)
        ]);

        return sendJson(response, 200, { ok: synced.every(Boolean), direction });
      }

      const ok = await pullFirebaseIntoLocal();
      return sendJson(response, 200, { ok, direction: "pull" });
    }

    if (parts[0] === "products") {
      const database = await readDatabase();
      const productId = parts[1];

      if (!productId && request.method === "GET") {
        return sendJson(response, 200, Object.values(database.products));
      }

      if (!productId && request.method === "POST") {
        const body = await readBody(request);
        const id = body.id || `p${Date.now()}`;
        const product = { ...body, id };
        database.products[id] = product;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`products/${id}`, product);
        return sendJson(response, 201, { ...product, synced });
      }

      if (productId && request.method === "GET") {
        return sendJson(
          response,
          database.products[productId] ? 200 : 404,
          database.products[productId] || { error: "Produto nao encontrado" }
        );
      }

      if (productId && (request.method === "PUT" || request.method === "PATCH")) {
        const body = await readBody(request);
        const product = {
          ...(request.method === "PATCH" ? database.products[productId] || {} : {}),
          ...body,
          id: productId
        };
        database.products[productId] = product;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`products/${productId}`, product);
        return sendJson(response, 200, { ...product, synced });
      }

      if (productId && request.method === "DELETE") {
        delete database.products[productId];
        await writeDatabase(database);
        const synced = await syncFirebasePath(`products/${productId}`, null);
        return sendJson(response, 200, { ok: true, synced });
      }
    }

    if (parts[0] === "coupons" && request.method === "GET") {
      const database = await readDatabase();
      await syncFirebasePath("coupons", database.coupons);
      return sendJson(response, 200, Object.values(database.coupons));
    }

    if (parts[0] === "orders") {
      const database = await readDatabase();
      const orderId = parts[1];

      if (!orderId && request.method === "GET") {
        return sendJson(response, 200, valuesByDateDesc(database.orders));
      }

      if (!orderId && request.method === "POST") {
        const body = await readBody(request);
        const id = body.id || `o${Date.now()}`;
        const order = { ...body, id };
        database.orders[id] = order;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`orders/${id}`, order);
        await notifyAdmins(database, order);
        return sendJson(response, 201, { ...order, synced });
      }

      if (orderId && request.method === "PATCH") {
        const body = await readBody(request);
        const previousOrder = database.orders[orderId];
        const order = { ...(database.orders[orderId] || {}), ...body, id: orderId };
        database.orders[orderId] = order;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`orders/${orderId}`, order);
        if (body.status && previousOrder?.status !== body.status) {
          await notifyOrderCustomer(database, order, body.status);
        }
        return sendJson(response, 200, { ...order, synced });
      }

      if (orderId && request.method === "DELETE") {
        delete database.orders[orderId];
        await writeDatabase(database);
        const synced = await syncFirebasePath(`orders/${orderId}`, null);
        return sendJson(response, 200, { ok: true, synced });
      }
    }

    if (url.pathname === "/checkout" && request.method === "POST") {
      const database = await readDatabase();
      const body = await readBody(request);
      const order = body.order;
      const stockUpdates = body.stockUpdates || {};

      if (!order?.id) {
        return sendJson(response, 400, { error: "Pedido invalido" });
      }

      for (const [productId, stock] of Object.entries(stockUpdates)) {
        if (database.products[productId]) {
          database.products[productId] = { ...database.products[productId], stock };
        }
      }

      database.orders[order.id] = order;
      await writeDatabase(database);

      const syncedProducts = await Promise.all(
        Object.entries(stockUpdates).map(([productId, stock]) =>
          syncFirebasePath(`products/${productId}/stock`, stock)
        )
      );
      const syncedOrder = await syncFirebasePath(`orders/${order.id}`, order);
      await notifyAdmins(database, order);

      return sendJson(response, 201, {
        ...order,
        synced: syncedOrder && syncedProducts.every(Boolean)
      });
    }

    if (parts[0] === "users") {
      const database = await readDatabase();
      const uid = parts[1];

      if (!uid) {
        return sendJson(response, 400, { error: "UID obrigatorio" });
      }

      if (request.method === "GET") {
        return sendJson(
          response,
          database.users[uid] ? 200 : 404,
          database.users[uid] || { error: "Usuario nao encontrado" }
        );
      }

      if (request.method === "PUT" || request.method === "PATCH") {
        const body = await readBody(request);
        const user = {
          ...(request.method === "PATCH" ? database.users[uid] || {} : {}),
          ...body,
          uid
        };
        database.users[uid] = user;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`users/${uid}`, user);
        return sendJson(response, 200, { ...user, synced });
      }
    }

    if (parts[0] === "push-tokens") {
      const database = await readDatabase();
      const uid = parts[1];

      if (!uid && request.method === "GET") {
        const pushTokens = await getPushTokens(database);
        return sendJson(response, 200, Object.values(pushTokens));
      }

      if (!uid) {
        return sendJson(response, 400, { error: "UID obrigatorio" });
      }

      if (request.method === "PUT") {
        const body = await readBody(request);
        const pushToken = {
          uid,
          token: body.token,
          role: body.role,
          updatedAt: new Date().toISOString()
        };

        database.pushTokens[uid] = pushToken;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`pushTokens/${uid}`, pushToken);
        return sendJson(response, 200, { ...pushToken, synced });
      }

      if (parts[2] === "test" && request.method === "POST") {
        const pushTokens = await getPushTokens(database);
        const pushToken = pushTokens?.[uid];

        if (!pushToken?.token) {
          return sendJson(response, 404, { ok: false, error: "Token nao encontrado" });
        }

        const ok = await sendExpoPushNotification(
          pushToken.token,
          "Teste Tuning Shop",
          "Se chegou no iPhone, as notificacoes reais estao funcionando.",
          { type: "test" }
        );

        return sendJson(response, ok ? 200 : 500, { ok });
      }
    }

    if (parts[0] === "favorites") {
      const database = await readDatabase();
      const uid = parts[1];
      const productId = parts[2];

      if (!uid) {
        return sendJson(response, 400, { error: "UID obrigatorio" });
      }

      database.favorites[uid] = database.favorites[uid] || {};

      if (!productId && request.method === "GET") {
        return sendJson(response, 200, Object.keys(database.favorites[uid]));
      }

      if (productId && request.method === "PUT") {
        database.favorites[uid][productId] = true;
        await writeDatabase(database);
        const synced = await syncFirebasePath(`favorites/${uid}/${productId}`, true);
        return sendJson(response, 200, { ok: true, synced });
      }

      if (productId && request.method === "DELETE") {
        delete database.favorites[uid][productId];
        await writeDatabase(database);
        const synced = await syncFirebasePath(`favorites/${uid}/${productId}`, null);
        return sendJson(response, 200, { ok: true, synced });
      }
    }

    return sendJson(response, 404, { error: "Rota nao encontrada" });
  } catch (error) {
    return sendJson(response, 500, { error: error.message });
  }
});

pullFirebaseIntoLocal().finally(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`API JSON local rodando em http://localhost:${PORT}`);
    console.log(`Arquivo JSON: ${DATA_FILE}`);
  });
});
