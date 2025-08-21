const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();
console.log("Public Key:\n", keys.publicKey);
console.log("Private Key:\n", keys.privateKey);