const bcrypt = require("bcrypt");
const crypto = require("crypto");

const saltRounds = 10;

// Backward-compatible helpers (bcrypt internally manages its own salt)
const hashPassword = async (password) => {
    return await bcrypt.hash(password, saltRounds);
}
const comparePassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
}

// Explicit salt flow per requested logic
const generateSalt = (numBytes = 16) => {
    return crypto.randomBytes(numBytes).toString("hex");
}

const hashPasswordWithSalt = async (plainPassword, salt) => {
    const passwordWithSalt = `${plainPassword}${salt}`;
    return await bcrypt.hash(passwordWithSalt, saltRounds);
}

const comparePasswordWithSalt = async (plainPassword, salt, hashedPassword) => {
    const passwordWithSalt = `${plainPassword}${salt}`;
    return await bcrypt.compare(passwordWithSalt, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword,
    generateSalt,
    hashPasswordWithSalt,
    comparePasswordWithSalt
}