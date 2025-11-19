// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || "Budget Planner", {
    body: data.body || "You have a reminder",
    icon: "/icon-192.png"
  });
});
