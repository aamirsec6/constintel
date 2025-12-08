# Integration Tests

Integration tests require a test database to be running.

## Setup

1. Create a test database:
   ```bash
   createdb constintel_test
   ```

2. Set test environment:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/constintel_test"
   ```

3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Test Structure

- Unit tests: `backend/src/**/__tests__/**/*.test.ts`
- Integration tests: `tests/integration/**/*.test.ts`

