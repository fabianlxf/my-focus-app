const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();
console.log("Public Key:\n", keys.publicKey);
console.log("Private Key:\n", keys.privateKey);
VITE_VAPID_PUBLIC_KEY=BLe3iJOHwg1zf5iTDXUuLQVpXC5VE0AEIyi_g1rBuOrbPxVIe7oy5aSWM1yJ9H-aLOghUypBlonTyvfTgwvRKIk