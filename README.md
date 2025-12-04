## Deployment & Bootstrap (Render + MongoDB Atlas)

- Backend env required: set `PORT`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`.
- No auto-seeding is performed. Create the first admin manually.

### One-time Admin Creation

1) Set envs and run the script:

```powershell
$env:MONGO_URI="YOUR_MONGODB_ATLAS_URI"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="StrongPassword123"
node scripts/createAdmin.js
```

This creates a `User` with role `admin` and a linked `Admin` record.

### Start the API Server (Render or local)

```powershell
$env:PORT="5000"
$env:MONGO_URI="YOUR_MONGODB_ATLAS_URI"
$env:JWT_SECRET="a-strong-secret"
$env:FRONTEND_URL="https://your-frontend.vercel.app"
node src/server.js
```

- Health endpoints: `GET /api/status`, `GET /health`
- Auth endpoint: `POST /api/auth/login` (identifier + password)

### Login Identifiers

- Admin/Teacher: `email`; Teacher also supports `staffCode`/`employee_id`.
- Student: `email`, `roll_no`, `admissionNo`/`admission_number`.

### Seeders

- `src/seeders/seed.js` is disabled from auto-run and exports `seedData` for manual usage.
