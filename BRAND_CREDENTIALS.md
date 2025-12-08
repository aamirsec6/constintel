# Brand Account Credentials

## Brand 1: Acme Corporation

**Email:** `acme-corp@test.com`  
**Password:** `AcmeCorp123`  
**Brand Name:** Acme Corporation  
**Domain:** acme.com  
**Industry:** Retail  

**Login URL:** http://localhost:3001/login

---

## Brand 2: TechStart Inc

**Email:** `techstart-inc@test.com`  
**Password:** `TechStart123`  
**Brand Name:** TechStart Inc  
**Domain:** techstart.io  
**Industry:** Technology  

**Login URL:** http://localhost:3001/login

---

## Important Notes

- Each brand has **isolated infrastructure** (separate database, Redis, and Docker instance)
- Each brand gets automatically provisioned infrastructure upon signup
- Brands can access their own data only
- These are brand owner accounts (not admin accounts)
- For admin access, use: `admin@constintel.com` / `Admin123456`

## Access

- **Brand Login:** http://localhost:3001/login
- **Admin Login:** http://localhost:3001/admin/login
- **Homepage:** http://localhost:3001

