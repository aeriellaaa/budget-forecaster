const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'data.json');

function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    const initial = { balance: 0, transactions: [] };
    fs.writeFileSync(DATA_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('data.json is corrupted or not valid JSON');
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readData, writeData };