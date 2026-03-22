import { addChild, deleteChild, getAllChildren, updateChild } from "./database";

const PORT = Number.parseInt(process.env.PORT || "3000");

const sseClients = new Set<ReadableStreamDefaultController>();

function broadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);
  for (const client of sseClients) {
    try {
      client.enqueue(encoded);
    } catch {
      sseClients.delete(client);
    }
  }
}

const buildResult = await Bun.build({
  entrypoints: ["./src/client/main.tsx"],
  outdir: "./dist",
  naming: "[name]-[hash].[ext]",
  minify: process.env.NODE_ENV === "production",
});

if (!buildResult.success) {
  console.error("Client build failed:");
  for (const log of buildResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

const jsOutput = buildResult.outputs.find((o) => o.kind === "entry-point");
const cssOutput = buildResult.outputs.find((o) => o.path.endsWith(".css"));
const jsPath = `/${jsOutput!.path.split("/dist/")[1]}`;
const cssPath = cssOutput ? `/${cssOutput.path.split("/dist/")[1]}` : null;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Birthday Tracker</title>
  ${cssPath ? `<link rel="stylesheet" href="${cssPath}">` : ""}
</head>
<body>
  <div id="root"></div>
  <script src="${jsPath}"></script>
</body>
</html>`;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") {
      return new Response(HTML, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
        },
      });
    }

    if (path === jsPath) {
      return new Response(Bun.file(`./dist/${path.slice(1)}`), {
        headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      });
    }

    if (cssPath && path === cssPath) {
      return new Response(Bun.file(`./dist/${path.slice(1)}`), {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (path === "/api/events" && req.method === "GET") {
      let controller: ReadableStreamDefaultController;
      const stream = new ReadableStream({
        start(c) {
          controller = c;
          sseClients.add(controller);
        },
        cancel() {
          sseClients.delete(controller);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    if (path === "/api/children" && req.method === "GET") {
      return json(getAllChildren());
    }

    if (path === "/api/children" && req.method === "POST") {
      const body = (await req.json()) as {
        name: string;
        birthdate: string;
        note?: string;
      };
      if (!body.name?.trim()) {
        return json({ error: "Name is required" }, 400);
      }
      if (!body.birthdate) {
        return json({ error: "Birthdate is required" }, 400);
      }
      const child = addChild(body.name.trim(), body.birthdate, body.note);
      broadcast("birthday-added", child);
      return json(child, 201);
    }

    const deleteMatch = path.match(/^\/api\/children\/(\d+)$/);
    if (deleteMatch && req.method === "DELETE") {
      deleteChild(Number(deleteMatch[1]));
      broadcast("birthday-deleted", { id: deleteMatch[1] });
      return new Response(null, { status: 204 });
    }

    const updateMatch = path.match(/^\/api\/children\/(\d+)$/);
    if (updateMatch && req.method === "PUT") {
      const body = (await req.json()) as {
        name: string;
        birthdate: string;
        note?: string;
      };
      if (!body.name?.trim()) {
        return json({ error: "Name is required" }, 400);
      }
      if (!body.birthdate) {
        return json({ error: "Birthdate is required" }, 400);
      }
      updateChild(Number(updateMatch[1]), body.name.trim(), body.birthdate, body.note);
      const updated = getAllChildren();
      broadcast("birthday-updated", updated);
      return json(updated);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Birthday Tracker running at http://localhost:${server.port}`);
