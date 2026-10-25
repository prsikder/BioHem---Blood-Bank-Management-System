# BioHem — Blood Bank Management System 🩸

A **Node.js + Express + MySQL** based Blood Bank Management System built using **EJS** and **Bootstrap**.
This application helps manage donors, hospitals, donations, blood requests, and stock through dedicated user dashboards.

---

## 🚀 Features

- Separate donor and hospital registration
- Session-based authentication with bcrypt password hashing
- Administrator, hospital staff, and donor workflows
- Add, update, and delete donor records with access controls
- Donor profiles with photos, blood groups, and contact details
- Donation history and eligibility indicators based on stored age and donation dates
- Search donors and hospitals by name, email, or city
- Paginated donor and hospital directories
- Hospital registration and profile management
- Blood requests with **Emergency** and **General** priority
- Hospital dashboard with request statistics and recent requests
- Administrator dashboard with donor, hospital, user, and inventory totals
- Administrator-controlled donation recording and stock updates
- Blood inventory management and low-stock alerts
- Fulfill or reject requests, with stock validation during fulfillment
- Database transactions for donations and request fulfillment
- Export donor records and inventory to CSV
- Audit logs for selected administrative and hospital activities
- Responsive interface, flash messages, and custom error pages

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS, EJS Mate, HTML, CSS, JavaScript
- **UI:** Bootstrap 5.3, Bootstrap Icons, Animate.css
- **Database:** MySQL / MariaDB, mysql2
- **Authentication:** bcryptjs, express-session
- **Uploads:** Multer
- **CSV:** csv-parser, json2csv
- **Server Events:** Socket.IO
- **Security Headers:** Helmet
- **Logging:** Morgan
- **Configuration:** dotenv
- **Forms & Feedback:** body-parser, connect-flash
- **Supporting Modules:** Nodemailer SMTP helper, Leaflet assets

Exact dependency versions are available in [`package.json`](package.json) and [`package-lock.json`](package-lock.json).

---

## 👥 User Roles

| Role | Capabilities |
| --- | --- |
| **Administrator** | Manage inventory, record donations, process requests, manage records, export data, and view audit logs |
| **Hospital Staff** | Manage the linked hospital, request blood, track requests, and create/export donor records |
| **Donor** | Register, update the linked profile, and view donation history and eligibility |

Hospital registration creates a linked staff account. No public administrator registration form is included.

---

## 📁 Project Structure

```text
app.js                 → Application entry point and HTTP/Socket.IO server
config/database.js     → MySQL connection pool
db/blood-bank.sql      → Database schema and bundled records
middleware/            → Authentication, uploads, and cache middleware
routes/                → Authentication, donor, hospital, admin, and API routes
views/                 → EJS pages and shared layouts
public/css/            → Application styles
public/js/             → Browser JavaScript
public/images/         → Branding and interface assets
public/uploads/        → Uploaded photos and files
utils/                 → CSV, eligibility, and email helpers
db_test.js             → Database connection diagnostic
.env.example           → Environment configuration template
package.json           → Dependencies and startup script
```

---

## ⚙️ How to Run (Source Code)

### 1. Install the Requirements

- A supported **Node.js LTS** release and **npm**
- **MySQL** or **MariaDB**
- **Git** to clone the repository
- Optional: **XAMPP / phpMyAdmin** for database management

### 2. Clone the Repository

Replace `YOUR_USERNAME` and the repository name as needed:

```bash
git clone https://github.com/YOUR_USERNAME/bloodbank-ultimate.git
cd bloodbank-ultimate
```

If already downloaded, open the project folder in your editor and terminal.

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up the Database

1. Start MySQL/MariaDB. If using XAMPP with phpMyAdmin, start **Apache** and **MySQL**.
2. Open **phpMyAdmin** or your preferred database client.
3. Create a database named **`blood-bank`**.
4. Select the database and import **`db/blood-bank.sql`**.

The SQL dump includes existing records. Import into an empty database and sanitize the records before sharing or using them for a new installation.

### 5. Configure the Environment

Copy `.env.example` to `.env` if `.env` does not already exist.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Update the database settings and session secret:

```dotenv
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_database_password
DB_NAME=blood-bank
SESSION_SECRET=replace_with_a_long_random_secret
```

Leave `DB_PASS` empty only if your local database account has no password. Keep `.env` out of GitHub.

### 6. Test the Database Connection

```bash
node db_test.js
```

### 7. Start the Application

```bash
npm start
```

Open **http://localhost:3000** in your browser.

This runs `node app.js`. There is no `npm run dev` script. Press **Ctrl+C** to stop the server.

---

## 🔄 Application Workflow

1. **Register:** Create a donor or hospital account.
2. **Record Donations:** An administrator records a donation and updates stock.
3. **Request Blood:** A hospital submits blood group, units, urgency, and optional notes.
4. **Process Requests:** An administrator fulfills the request when stock is sufficient or rejects it.
5. **Track Activity:** Review donation history, request statistics, and audit logs.

The administrator dashboard's **Approve** action directly fulfills the request and deducts inventory.

---

## 🗄️ Database Tables

| Table | Purpose |
| --- | --- |
| `users` | Credentials, roles, and profile links |
| `donors` | Donor profiles and last donation dates |
| `hospitals` | Hospital profiles and contact details |
| `blood_stock` | Available units by blood group |
| `donations` | Donation history and recording actor |
| `requests` | Hospital requests, urgency, and status |
| `audit_logs` | Recorded actions and timestamps |

Passwords use bcrypt hashes. For a clean installation, provision an administrator through a controlled database setup process with a bcrypt-hashed password and the `admin` role. No administrator setup script or documented default password is included.

---

## 🌐 Deployment

Use Node.js hosting with a hosted **MySQL-compatible database** and support for the HTTP/Socket.IO server.

```text
Install Command  → npm ci
Start Command    → npm start
Application Port → process.env.PORT
```

For production:

- Configure database variables and a unique `SESSION_SECRET` in the hosting dashboard.
- Enable HTTPS and set `NODE_ENV=production`.
- Set `TRUST_PROXY=true` when appropriate for the host's trusted reverse proxy.
- Replace in-memory sessions with persistent session storage.
- Use persistent disk or object storage for uploads.
- Configure database TLS if required by your provider.

**Vercel:** Review the Socket.IO server, local uploads, sessions, database connections, and static assets before deployment. See the [Vercel Express documentation](https://vercel.com/docs/frameworks/backend/express).

---

## 📝 Development Notes

- **CSV import:** POST processing exists, but the import page needs a missing template and a route-order fix.
- **Hospital maps:** Leaflet assets and location APIs exist; the SQL dump lacks location columns and map initialization is incomplete.
- **Live updates:** The server emits stock events; automatic frontend refresh is not implemented.
- **Email:** The Nodemailer helper is not called by current routes.
- **Eligibility:** Application indicators do not replace clinical screening.
- **Privacy:** Donor detail pages are public. Review access rules, database records, and uploads before publishing or handling personal data.
- **Testing:** A database diagnostic is included; no automated test suite is configured.

---

## 🤝 Contributing

Issues and pull requests are welcome. Describe changes, verify affected workflows, and use synthetic data in examples. Never commit credentials, `.env` files, or personal records.

---

## 📄 License

No license file is currently included. The repository owner should add a license to define reuse and distribution permissions.
