const crypto = require("crypto");

const algorithm = process.env.SIGNATURE_ALGORITHM || "aes-256-cbc";
const key = Buffer.from(process.env.SIGNATURE_ENCRYPT_KEY, "hex"); // 32 bytes 

const encryptSignature = (data) => {
  if (!data || typeof data !== "string") {
    throw new Error("Invalid data to encrypt");
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv); 
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

const decryptSignature = (encryptedData, ivHex) => {
  if (!encryptedData || !ivHex) {
    throw new Error("Invalid encrypted data or IV");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encryptSignature, decryptSignature };
