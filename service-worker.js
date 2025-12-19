self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("silencio-pro").then(c =>
      c.addAll(["./","index.html","worker.js"])
    )
  );
});
