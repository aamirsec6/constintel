/**
 * Seed a demo brand with customers and transactions via API.
 * - Creates brand via /api/auth/signup
 * - Generates 1000 customers (CSV written to brand-data/demo-brand-01/customers.csv)
 * - Generates transactions (~2 per customer) (CSV written to brand-data/demo-brand-01/transactions.csv)
 * - Sends profile and purchase events to /api/events
 *
 * Usage:
 *   node scripts/seed-brand-demo.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const BRAND_NAME = 'Demo Brand 01';
const BRAND_EMAIL = `demo.brand01+${Date.now()}@example.com`;
const BRAND_PASSWORD = 'StrongPass!123';
const BRAND_DOMAIN = 'demobrand01.com';

const OUTPUT_DIR = path.join(__dirname, '..', 'brand-data', 'demo-brand-01');
const CUSTOMERS_CSV = path.join(OUTPUT_DIR, 'customers.csv');
const TRANSACTIONS_CSV = path.join(OUTPUT_DIR, 'transactions.csv');

const cities = ['New York', 'San Francisco', 'Austin', 'Seattle', 'Chicago', 'Miami', 'Denver', 'Boston'];
const countries = ['USA'];
const channels = ['web', 'app', 'store'];
const statuses = ['completed', 'pending', 'refunded'];

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCustomers(count = 1000) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    const id = `C${String(i + 1).padStart(5, '0')}`;
    const first = `First${i + 1}`;
    const last = `Last${i + 1}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@demo-brand01.com`;
    const phone = `+1-555-01${String(i + 1).padStart(4, '0')}`;
    const loyalty = `L${String(i + 1).padStart(6, '0')}`;
    const city = randItem(cities);
    const country = randItem(countries);
    const createdAt = new Date(Date.now() - randInt(0, 90) * 24 * 3600 * 1000).toISOString();
    customers.push({ id, first, last, email, phone, loyalty, city, country, createdAt });
  }
  return customers;
}

function generateTransactions(customers) {
  const txns = [];
  customers.forEach((c, idx) => {
    const txnCount = randInt(1, 2);
    for (let t = 0; t < txnCount; t++) {
      const orderId = `O${String(idx + 1).padStart(5, '0')}-${t + 1}`;
      const amount = (randInt(20, 200) + Math.random()).toFixed(2);
      const channel = randItem(channels);
      const status = randItem(statuses);
      const orderDate = new Date(Date.now() - randInt(0, 60) * 24 * 3600 * 1000).toISOString();
      txns.push({
        orderId,
        customerId: c.id,
        email: c.email,
        phone: c.phone,
        amount,
        currency: 'USD',
        channel,
        status,
        orderDate,
      });
    }
  });
  return txns;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const vals = headers.map((h) => {
      const v = row[h] ?? '';
      const needsQuote = typeof v === 'string' && (v.includes(',') || v.includes('"'));
      if (needsQuote) {
        return `"${String(v).replace(/"/g, '""')}"`;
      }
      return v;
    });
    lines.push(vals.join(','));
  });
  fs.writeFileSync(filePath, lines.join('\n'));
}

async function signupBrand() {
  const res = await axios.post(`${API_BASE}/api/auth/signup`, {
    email: BRAND_EMAIL,
    password: BRAND_PASSWORD,
    brandName: BRAND_NAME,
    domain: BRAND_DOMAIN,
  });
  const { accessToken, user } = res.data.data;
  if (!user?.brandId) {
    throw new Error('brandId missing from signup response');
  }
  return { accessToken, brandId: user.brandId };
}

async function postEvent(event) {
  return axios.post(`${API_BASE}/api/events`, event);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output dir: ${OUTPUT_DIR}`);

  console.log('Signing up brand...');
  const { brandId, accessToken } = await signupBrand();
  console.log(`Brand created. brandId=${brandId}, email=${BRAND_EMAIL}`);

  console.log('Generating customers...');
  const customers = generateCustomers(1000);
  writeCsv(CUSTOMERS_CSV, ['id', 'first', 'last', 'email', 'phone', 'loyalty', 'city', 'country', 'createdAt'], customers);
  console.log(`Wrote customers CSV: ${CUSTOMERS_CSV}`);

  console.log('Generating transactions...');
  const transactions = generateTransactions(customers);
  writeCsv(TRANSACTIONS_CSV, ['orderId', 'customerId', 'email', 'phone', 'amount', 'currency', 'channel', 'status', 'orderDate'], transactions);
  console.log(`Wrote transactions CSV: ${TRANSACTIONS_CSV}`);

  console.log('Ingesting customers via /api/events ...');
  const profileEvents = customers.map((c) => ({
    brand_id: brandId,
    event_type: 'profile_create',
    payload: {
      email: c.email,
      phone: c.phone,
      loyalty_id: c.loyalty,
      first_name: c.first,
      last_name: c.last,
      city: c.city,
      country: c.country,
      created_at: c.createdAt,
    },
  }));

  // send in batches
  const batchSize = 100;
  for (let i = 0; i < profileEvents.length; i += batchSize) {
    const batch = profileEvents.slice(i, i + batchSize);
    await Promise.all(batch.map((ev) => postEvent(ev)));
    console.log(`Profiles ingested: ${Math.min(i + batchSize, profileEvents.length)}/${profileEvents.length}`);
  }

  console.log('Ingesting transactions via /api/events ...');
  const txnEvents = transactions.map((t) => ({
    brand_id: brandId,
    event_type: 'purchase',
    payload: {
      order_id: t.orderId,
      email: t.email,
      phone: t.phone,
      amount: Number(t.amount),
      currency: t.currency,
      channel: t.channel,
      status: t.status,
      order_date: t.orderDate,
      items: randInt(1, 5),
    },
  }));

  for (let i = 0; i < txnEvents.length; i += batchSize) {
    const batch = txnEvents.slice(i, i + batchSize);
    await Promise.all(batch.map((ev) => postEvent(ev)));
    console.log(`Transactions ingested: ${Math.min(i + batchSize, txnEvents.length)}/${txnEvents.length}`);
  }

  console.log('Done. You can view profiles at http://localhost:3001/profiles (ensure x-brand-id set or logged in as this brand).');
  console.log(`Brand login: email=${BRAND_EMAIL} password=${BRAND_PASSWORD}`);
}

main().catch((err) => {
  console.error('Seed failed:', err.response?.data || err.message || err);
  process.exit(1);
});

