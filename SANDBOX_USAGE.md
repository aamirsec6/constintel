# SANDBOX Generator - Usage Guide

**Generator**: SANDBOX  
**Status**: ✅ Complete

This guide explains how to use the test data generators, sample CSV files, and verification scripts.

## Generated Components

1. **Test Data Generator** (`backend/src/scripts/generateTestData.ts`)
   - Generates customer profiles with realistic data
   - Creates purchase events, page views, and WhatsApp events
   - Configurable number of customers and events

2. **Sample CSV File** (`backend/src/scripts/sample.csv`)
   - Pre-formatted CSV with 15 sample customer records
   - Ready for CSV import testing

3. **Verification Script** (`backend/src/scripts/verifyIntegrations.ts`)
   - Tests all integration endpoints
   - Verifies API functionality
   - Provides colored output for easy reading

---

## Test Data Generator

### Basic Usage

```bash
cd backend
npm run seed
```

This generates:
- 50 customer profiles
- 3 purchase events per customer
- 10 page view events per customer
- WhatsApp events for 30% of customers

### Custom Parameters

```bash
# Generate 100 customers with 5 purchases and 20 page views each
npm run seed:custom 100 5 20
```

Or directly:
```bash
tsx src/scripts/generateTestData.ts 100 5 20
```

### Parameters

1. **Customer Count** (default: 50)
   - Number of customer profiles to generate

2. **Purchases Per Customer** (default: 3)
   - Number of purchase events per customer

3. **Page Views Per Customer** (default: 10)
   - Number of page view events per customer

### Example Output

```
🎲 Generating test data...
Brand ID: test-brand
Customers: 50
Purchases per customer: 3
Page views per customer: 10

Generating 50 customer profiles...
  Created 10/50 profiles...
  Created 20/50 profiles...
  ...
✅ Generated 50 customer profiles

Generating purchase events (3 per profile)...
✅ Generated 150 purchase events

Generating page view events (10 per profile)...
✅ Generated 500 page view events

Generating WhatsApp events...
✅ Generated 15 WhatsApp events

📊 Summary:
  Total Profiles: 50
  Total Events: 665

✅ Test data generation complete!
```

### Generated Data Structure

**Customer Profiles**:
- Random first/last names
- Generated phone numbers (US format)
- Email addresses (various domains)
- Optional loyalty IDs (50% chance)

**Purchase Events**:
- Random order IDs
- 1-5 items per order
- Prices between $10-$200
- Categories: Electronics, Clothing, Books, Home, Sports, Toys, Food, Beauty
- Payment methods: card, cash, paypal, apple_pay
- Timestamps within last 90 days

**Page View Events**:
- Various page URLs and categories
- Timestamps within last 30 days

**WhatsApp Events**:
- Realistic message content
- Purchase intent detection
- Support requests
- Timestamps within last 14 days

---

## Sample CSV File

### Location

`backend/src/scripts/sample.csv`

### Format

```csv
phone,email,loyalty_id,event_type,total,timestamp,product_id,product_name,category
1234567890,customer1@example.com,LOY001,purchase,99.99,2024-01-15T10:30:00Z,PROD123,Wireless Headphones,Electronics
...
```

### Using the Sample CSV

```bash
# Upload via API
curl -X POST http://localhost:3000/api/integrations/csv/upload \
  -H "x-brand-id: test-brand" \
  -F "file=@backend/src/scripts/sample.csv" \
  -F "default_event_type=purchase"
```

### Custom CSV Format

You can create your own CSV with different column names and use column mapping:

```bash
curl -X POST http://localhost:3000/api/integrations/csv/upload \
  -H "x-brand-id: test-brand" \
  -F "file=@your-file.csv" \
  -F "column_mapping={\"phone\":\"customer_phone\",\"email\":\"customer_email\"}" \
  -F "default_event_type=purchase"
```

---

## Verification Script

### Basic Usage

```bash
cd backend
npm run verify:integrations
```

### What It Tests

1. **Health Check** - Backend API health endpoint
2. **POS Integration** - Generic POS event endpoint
3. **Shopify Webhook** - Shopify webhook handler
4. **WooCommerce Webhook** - WooCommerce webhook handler
5. **CSV Upload** - CSV import functionality
6. **Event Ingestion** - Direct event ingestion API
7. **Profiles API** - Customer profiles listing

### Example Output

```
🧪 Starting Integration Verification Tests...
API URL: http://localhost:3000
Brand ID: test-brand

📡 Testing Health Check...
  ✅ Health check passed

🏪 Testing POS Integration...
  ✅ POS integration test passed
  Event ID: abc123-def456-...

🛍️  Testing Shopify Webhook...
  ✅ Shopify webhook test passed
  Event ID: xyz789-uvw012-...

🛒 Testing WooCommerce Webhook...
  ✅ WooCommerce webhook test passed
  Event ID: mno345-pqr678-...

📄 Testing CSV Upload...
  ✅ CSV upload test passed
  Processed: 15 rows

📥 Testing Event Ingestion...
  ✅ Event ingestion test passed
  Event ID: stu901-vwx234-...

👥 Testing Profiles API...
  ✅ Profiles API test passed
  Total Profiles: 50

📊 Test Results:
  Passed: 7/7

✅ All tests passed!
```

### Environment Variables

```bash
# API URL (default: http://localhost:3000)
export API_URL="http://localhost:3000"

# Brand ID (default: test-brand)
export TEST_BRAND_ID="your-brand-id"
```

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

---

## Complete Workflow

### 1. Start Services

```bash
docker-compose -f infra/docker-compose.yml up -d
```

### 2. Run Migrations

```bash
cd backend
npx prisma migrate dev
```

### 3. Generate Test Data

```bash
npm run seed
```

### 4. Verify Integrations

```bash
npm run verify:integrations
```

### 5. Check Results

```bash
# View profiles
curl http://localhost:3000/api/profiles -H "x-brand-id: test-brand"

# View events
# (Use Prisma Studio or direct database query)
npx prisma studio
```

---

## Advanced Usage

### Generate Large Dataset

```bash
# Generate 1000 customers with 10 purchases each
tsx src/scripts/generateTestData.ts 1000 10 50
```

### Generate Specific Event Types Only

Modify `generateTestData.ts` to comment out unwanted event types:

```typescript
// Comment out to skip
// await generateWhatsAppEvents(profileIds);
```

### Custom Brand ID

```bash
TEST_BRAND_ID="production-brand" npm run seed
```

---

## Troubleshooting

### "Database connection failed"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify migrations have run

### "Sample CSV not found"

- Check file exists at `backend/src/scripts/sample.csv`
- Use absolute path if needed

### "API connection refused"

- Ensure backend server is running
- Check `API_URL` environment variable
- Verify port 3000 is accessible

### "No profiles found"

- Run seed script first
- Check brand ID matches
- Verify events were ingested

---

## Integration with CI/CD

The verification script can be used in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Verify Integrations
  run: |
    cd backend
    npm run verify:integrations
  env:
    API_URL: http://localhost:3000
    TEST_BRAND_ID: ci-test-brand
```

---

## Next Steps

1. **Generate Test Data**: Run `npm run seed` to populate database
2. **Verify Setup**: Run `npm run verify:integrations` to test all endpoints
3. **Explore Data**: Use Prisma Studio to browse generated data
4. **Test ML Service**: Generate features and predictions for test profiles

---

**Status**: ✅ SANDBOX generator complete. Ready for testing and development!

