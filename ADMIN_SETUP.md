# Admin Panel Setup Guide

## Creating an Admin User

There is **no default admin user** created automatically. You need to create one manually.

### Option 1: Using the Script (Recommended)

1. **Make sure your database is running and migrations are applied:**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. **Create an admin user:**
   ```bash
   npm run create:admin admin@constintel.com YourSecurePassword123
   ```
   
   Or directly with tsx:
   ```bash
   tsx src/scripts/createAdmin.ts admin@constintel.com YourSecurePassword123
   ```

3. **Login to admin panel:**
   - URL: http://localhost:3001/admin/login
   - Email: The email you used in step 2
   - Password: The password you used in step 2

### Option 2: Using Prisma Studio (Manual)

1. Open Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```

2. Go to the `User` table and click "Add record"

3. Fill in the fields:
   - `email`: Your admin email (e.g., `admin@constintel.com`)
   - `passwordHash`: You need to hash the password first
     ```bash
     # In Node.js REPL or script:
     const bcrypt = require('bcryptjs');
     bcrypt.hash('YourPassword123', 12).then(hash => console.log(hash));
     ```
   - `role`: `admin`
   - `emailVerified`: `true`
   - `brandId`: Leave as `null` (admins don't belong to brands)

4. Save the record

### Option 3: Using SQL Directly

```sql
-- First, generate a password hash (use Node.js or the script)
-- Then insert:
INSERT INTO "user" (id, email, password_hash, role, "email_verified", created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@constintel.com',
  '$2a$12$...', -- Replace with actual bcrypt hash
  'admin',
  true,
  NOW(),
  NOW()
);
```

## Default Credentials

**There are NO default credentials.** You must create an admin user using one of the methods above.

## Security Notes

1. ⚠️ **Change the password after first login**
2. ⚠️ **Use a strong password** (min 8 characters, mix of upper/lower case, numbers)
3. ⚠️ **Keep admin credentials secure** - they have full access to all brands
4. ⚠️ **Only create admin users for trusted personnel**

## Accessing Admin Panel

Once you have created an admin user:

1. Navigate to: http://localhost:3001/admin/login
2. Enter your admin email and password
3. You'll be redirected to the admin dashboard

## Admin Panel Features

- **Dashboard**: View platform statistics (total brands, active brands, new signups)
- **Brands Management**: List all brands, view details, suspend/activate brands
- **Market View**: Stock market-style visualization of brand performance metrics
- **Metrics**: View detailed brand performance metrics and trends

## Troubleshooting

### "Admin user already exists"
- Only one admin user can exist initially (this is by design for security)
- To reset password, use password reset functionality or update the database directly

### "Authentication failed"
- Make sure you're using the correct email and password
- Check that the user exists in the database: `npx prisma studio` → User table

### "Access denied"
- Make sure the user role is set to `admin` (not `brand_owner` or `brand_user`)

