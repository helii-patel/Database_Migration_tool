const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production!!';

const encrypt = (plainText) => {
  if (!plainText) return '';
  const encrypted = CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
  return encrypted;
};

const decrypt = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '';
  }
};

module.exports = { encrypt, decrypt };
