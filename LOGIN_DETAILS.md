# Login Details & Account Setup

## ⚠️ Important: No Default Credentials

**There are NO default login credentials.** You must create accounts manually.

---

## 🔐 Admin Login

### Step 1: Create Admin User

Run the admin creation script:

```bash
cd backend
npm run create:admin admin@constintel.com YourSecurePassword123
```

Or directly with tsx:

```bash
cd backend
tsx src/scripts/createAdmin.ts admin@constintel.com YourSecurePassword123
```

**Requirements:**
- Email: Any valid email address
- Password: Minimum 8 characters

### Step 2: Login to Admin Panel

- **URL:** http://localhost:3001/admin/login
- **Email:** The email you used in step 1
- **Password:** The password you used in step 1

**Example:**
- Email: `admin@constintel.com`
- Password: `YourSecurePassword123`

---

## 👤 Brand User Login

### Option 1: Sign Up (Recommended)

1. Navigate to: http://localhost:3001/signup
2. Fill in the form:
   - **Brand Name:** Your brand name (e.g., "My Store")
   - **Email:** Your email address
   - **Password:** Minimum 8 characters
   - **Domain:** (Optional) Your website domain
3. Click "Sign Up"
4. You'll be automatically logged in and redirected to the dashboard

### Option 2: Login (If Already Registered)

1. Navigate to: http://localhost:3001/login
2. Enter your email and password
3. Click "Login"

---

## 📋 Quick Setup Commands

### Create Admin User
```bash
cd backend
npm run create:admin admin@constintel.com AdminPass123!
```

### Create Test Brand User (via Signup Page)
1. Go to http://localhost:3001/signup
2. Use:
   - Brand Name: `Test Brand`
   - Email: `test@example.com`
   - Password: `TestPass123!`

---

## 🔍 Verify Your Account

### Check Admin User Exists
```bash
cd backend
npx prisma studio
```
Then navigate to the `User` table and verify your admin user exists with `role: 'admin'`

### Check Brand User Exists
```bash
cd backend
npx prisma studio
```
Then navigate to:
- `User` table - verify your brand user exists with `role: 'brand_owner'`
- `Brand` table - verify your brand was created

---

## 🚨 Troubleshooting

### "Admin user already exists"
- Only one admin user can exist initially
- To reset password, update the database directly or use password reset functionality

### "Authentication failed"
- Verify email and password are correct
- Check that the user exists in the database
- Ensure password is at least 8 characters

### "Access denied"
- For admin: Ensure user role is `admin` (not `brand_owner`)
- For brand user: Ensure user has a `brandId` associated

### Can't Access Login Pages
- Ensure frontend is running: `cd frontend && npm run dev`
- Check frontend is on http://localhost:3001
- Verify backend is running: `cd backend && npm run dev`

---

## 📝 Example Credentials (After Setup)

### Admin Account
```
URL: http://localhost:3001/admin/login
Email: admin@constintel.com
Password: AdminPass123!
```

### Brand Account
```
URL: http://localhost:3001/login
Email: test@example.com
Password: TestPass123!
```

**⚠️ Remember:** These are examples. Use your own secure credentials!

---

## 🔒 Security Notes

1. ⚠️ **Change default passwords** after first login
2. ⚠️ **Use strong passwords** (min 8 chars, mix of upper/lower case, numbers)
3. ⚠️ **Keep credentials secure** - don't commit to version control
4. ⚠️ **Admin users have full access** to all brands - use carefully

---

## 📚 Related Documentation

- [Admin Setup Guide](./ADMIN_SETUP.md) - Detailed admin setup instructions
- [Quick Start Guide](./QUICK_START.md) - Platform setup instructions
- [Frontend Setup](./FRONTEND_SETUP_INSTRUCTIONS.md) - Frontend configuration

