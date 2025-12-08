# Integrations Setup Guide

**Generator**: INTEGRATIONS  
**Status**: ✅ Complete

This document describes how to set up and use the various integrations for the Unified Commerce Platform.

## Available Integrations

1. **Shopify** - Webhook integration for orders and customers
2. **WooCommerce** - Webhook integration for orders and customers
3. **Twilio WhatsApp** - WhatsApp messaging and webhooks
4. **Generic POS** - REST API for point-of-sale systems
5. **CSV Import** - Bulk import via CSV file upload

---

## 1. Shopify Integration

### Setup

1. **Get Webhook Secret**
   - Go to Shopify Admin → Settings → Notifications
   - Create a webhook endpoint
   - Copy the webhook secret

2. **Configure Environment**
   ```bash
   SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"
   ```

3. **Configure Webhook in Shopify**
   - URL: `https://your-domain.com/api/integrations/shopify/webhook`
   - Format: JSON
   - Topics to subscribe:
     - `orders/create`
     - `orders/paid`
     - `orders/updated`
     - `customers/create`
     - `customers/update`

### Webhook Endpoint

```
POST /api/integrations/shopify/webhook
Headers:
  x-brand-id: your-brand-id
  x-shopify-topic: orders/create
  x-shopify-hmac-sha256: <signature>
Body: Shopify webhook payload
```

### Example cURL

```bash
curl -X POST http://localhost:3000/api/integrations/shopify/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -H "x-shopify-topic: orders/create" \
  -H "x-shopify-hmac-sha256: <signature>" \
  -d '{
    "id": 12345,
    "email": "customer@example.com",
    "phone": "1234567890",
    "total_spent": "99.99"
  }'
```

### Documentation
- [Shopify Webhooks](https://shopify.dev/docs/api/admin-rest/2024-01/resources/webhook)
- [Webhook Security](https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook)

---

## 2. WooCommerce Integration

### Setup

1. **Get Webhook Secret**
   - Go to WooCommerce → Settings → Advanced → Webhooks
   - Create a new webhook
   - Set delivery URL and copy the secret

2. **Configure Environment**
   ```bash
   WOOCOMMERCE_WEBHOOK_SECRET="your-webhook-secret"
   ```

3. **Configure Webhook in WooCommerce**
   - URL: `https://your-domain.com/api/integrations/woocommerce/webhook`
   - Topic: `Order created`, `Order updated`, etc.
   - Delivery method: Action

### Webhook Endpoint

```
POST /api/integrations/woocommerce/webhook
Headers:
  x-brand-id: your-brand-id
  x-wc-webhook-topic: order.created
  x-wc-webhook-signature: <signature>
Body: WooCommerce webhook payload
```

### Example cURL

```bash
curl -X POST http://localhost:3000/api/integrations/woocommerce/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -H "x-wc-webhook-topic: order.created" \
  -H "x-wc-webhook-signature: <signature>" \
  -d '{
    "id": 12345,
    "billing": {
      "email": "customer@example.com",
      "phone": "1234567890"
    },
    "total": "99.99"
  }'
```

### Documentation
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)

---

## 3. Twilio WhatsApp Integration

### Setup

1. **Get Twilio Credentials**
   - Sign up at [Twilio](https://www.twilio.com)
   - Get Account SID and Auth Token
   - Set up WhatsApp Business API

2. **Configure Environment**
   ```bash
   TWILIO_ACCOUNT_SID="your-account-sid"
   TWILIO_AUTH_TOKEN="your-auth-token"
   TWILIO_WHATSAPP_FROM="whatsapp:+1234567890"
   ```

3. **Configure Webhook in Twilio**
   - Go to Twilio Console → WhatsApp → Sandbox
   - Set webhook URL: `https://your-domain.com/api/integrations/twilio/webhook`

### Webhook Endpoint

```
POST /api/integrations/twilio/webhook
Headers:
  x-brand-id: your-brand-id
  x-twilio-signature: <signature>
Body: Twilio webhook payload (form-encoded)
```

### Send WhatsApp Message

```
POST /api/integrations/twilio/send
Body:
  {
    "to": "whatsapp:+1234567890",
    "message": "Hello from ConstIntel!",
    "from": "whatsapp:+0987654321" (optional)
  }
```

### Example cURL

```bash
# Receive webhook
curl -X POST http://localhost:3000/api/integrations/twilio/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-brand-id: test-brand" \
  -H "x-twilio-signature: <signature>" \
  -d "From=whatsapp:+1234567890&Body=Hello"

# Send message
curl -X POST http://localhost:3000/api/integrations/twilio/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+1234567890",
    "message": "Hello from ConstIntel!"
  }'
```

### Documentation
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp/api)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

---

## 4. Generic POS Integration

### Setup

No special configuration required. This is a generic endpoint that accepts various POS formats.

### Endpoint

```
POST /api/integrations/pos/event
Headers:
  x-brand-id: your-brand-id
Body: POS event payload
```

### Supported Payload Formats

```json
{
  "transaction_id": "TXN123",
  "store_id": "STORE001",
  "customer": {
    "phone": "1234567890",
    "email": "customer@example.com",
    "loyalty_id": "LOY123"
  },
  "items": [
    {
      "product_id": "PROD123",
      "name": "Product Name",
      "quantity": 2,
      "price": 29.99,
      "category": "Electronics"
    }
  ],
  "total": 59.98,
  "payment_method": "card",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Example cURL

```bash
curl -X POST http://localhost:3000/api/integrations/pos/event \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -d '{
    "transaction_id": "TXN123",
    "customer": {
      "phone": "1234567890",
      "email": "customer@example.com"
    },
    "total": 99.99,
    "items": [
      {"product_id": "PROD123", "quantity": 1, "price": 99.99}
    ]
  }'
```

---

## 5. CSV Import

### Setup

No special configuration required. Upload CSV files via multipart form data.

### Endpoint

```
POST /api/integrations/csv/upload
Headers:
  x-brand-id: your-brand-id
Content-Type: multipart/form-data
Body:
  file: <CSV file>
  delimiter: "," (optional, default: comma)
  default_event_type: "csv_import" (optional)
  column_mapping: JSON string (optional)
```

### CSV Format

Expected columns (flexible mapping):
- `phone` - Customer phone number
- `email` - Customer email
- `loyalty_id` - Loyalty program ID
- `event_type` - Event type (or use default_event_type)
- `total` - Transaction total
- `timestamp` - Event timestamp

### Column Mapping

If your CSV has different column names, provide a mapping:

```json
{
  "phone": "customer_phone",
  "email": "customer_email",
  "total": "amount",
  "event_type": "transaction_type"
}
```

### Example cURL

```bash
curl -X POST http://localhost:3000/api/integrations/csv/upload \
  -H "x-brand-id: test-brand" \
  -F "file=@customers.csv" \
  -F "default_event_type=purchase" \
  -F "delimiter=,"
```

### Example CSV

```csv
phone,email,loyalty_id,total,timestamp
1234567890,customer1@example.com,LOY001,99.99,2024-01-01T12:00:00Z
0987654321,customer2@example.com,LOY002,149.99,2024-01-01T13:00:00Z
```

---

## Testing Integrations

### 1. Test Shopify Webhook

```bash
curl -X POST http://localhost:3000/api/integrations/shopify/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -H "x-shopify-topic: orders/create" \
  -d '{
    "id": 12345,
    "email": "test@example.com",
    "phone": "1234567890",
    "total_spent": "99.99"
  }'
```

### 2. Test WooCommerce Webhook

```bash
curl -X POST http://localhost:3000/api/integrations/woocommerce/webhook \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -H "x-wc-webhook-topic: order.created" \
  -d '{
    "id": 12345,
    "billing": {
      "email": "test@example.com",
      "phone": "1234567890"
    },
    "total": "99.99"
  }'
```

### 3. Test POS Event

```bash
curl -X POST http://localhost:3000/api/integrations/pos/event \
  -H "Content-Type: application/json" \
  -H "x-brand-id: test-brand" \
  -d '{
    "transaction_id": "TXN123",
    "customer": {
      "phone": "1234567890",
      "email": "test@example.com"
    },
    "total": 99.99
  }'
```

### 4. Test CSV Import

Create a test CSV file `test.csv`:
```csv
phone,email,total
1234567890,test@example.com,99.99
```

Then upload:
```bash
curl -X POST http://localhost:3000/api/integrations/csv/upload \
  -H "x-brand-id: test-brand" \
  -F "file=@test.csv"
```

---

## Security Notes

1. **Webhook Verification**: All webhooks support signature verification. Always configure secrets in production.

2. **HTTPS**: Use HTTPS in production for all webhook endpoints.

3. **Rate Limiting**: Consider adding rate limiting for webhook endpoints.

4. **PII Handling**: All integrations log only hashed identifiers, never raw PII.

---

## Troubleshooting

### Webhook Signature Verification Fails

- Check that the secret in `.env` matches the one configured in the platform
- Ensure the request body is not modified before verification
- For Twilio, ensure the URL matches exactly (including query params)

### CSV Import Errors

- Check CSV encoding (should be UTF-8)
- Verify column names match expected format
- Use column_mapping if your CSV has different column names
- Check file size (max 10MB)

### Twilio Send Fails

- Verify Twilio credentials are correct
- Ensure WhatsApp number is in correct format (`whatsapp:+1234567890`)
- Check Twilio account has WhatsApp API enabled

---

## Next Steps

After setting up integrations:

1. **Verify Events**: Check that events are being ingested:
   ```bash
   curl http://localhost:3000/api/profiles -H "x-brand-id: test-brand"
   ```

2. **Check Profiles**: Verify customer profiles are being created/merged correctly

3. **Monitor Logs**: Watch backend logs for integration errors

4. **Set Up Monitoring**: Add alerts for failed webhook deliveries

---

**Status**: ✅ All integrations ready for use!

