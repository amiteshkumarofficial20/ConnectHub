# Running ConnectHub Locally on VS Code

This guide will help you set up and run ConnectHub on your local machine using VS Code.

---

## 📋 Prerequisites

Before starting, ensure you have these installed:

### Required Software
- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v15 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **VS Code** - [Download](https://code.visualstudio.com/)

### Verify Installations

Open your terminal and run:

```bash
node --version      # Should show v20.0.0 or higher
npm --version       # Should show 10.0.0 or higher
psql --version      # Should show PostgreSQL 15 or higher
git --version       # Should show git version
```

---

## 🚀 Step 1: Clone the Repository

```bash
# Open terminal and navigate to your desired directory
cd ~/projects

# Clone the ConnectHub repository
git clone https://github.com/yourusername/connecthub.git

# Navigate to project directory
cd connecthub
```

---

## 🔧 Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This may take 2-5 minutes depending on your internet speed
```

---

## 🗄️ Step 3: Set Up PostgreSQL Database

### Option A: Using PostgreSQL GUI (Recommended for Beginners)

1. **Open pgAdmin** (comes with PostgreSQL)
   - Usually runs on `http://localhost:5050`
   - Default login: `postgres` / `postgres`

2. **Create a new database:**
   - Right-click "Databases" → New → Database
   - Name: `connecthub`
   - Click "Save"

3. **Create a user:**
   - Right-click "Login/Group Roles" → New → Login/Group Role
   - Name: `connecthub_user`
   - Go to "Definition" tab
   - Password: `connecthub_password` (or use your own)
   - Click "Save"

4. **Grant permissions:**
   - Right-click your `connecthub_user` → Properties
   - Go to "Privileges" tab
   - Enable all privileges
   - Click "Save"

### Option B: Using Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# In the PostgreSQL prompt, run:
CREATE DATABASE connecthub;
CREATE USER connecthub_user WITH PASSWORD 'connecthub_password';
ALTER ROLE connecthub_user SET client_encoding TO 'utf8';
ALTER ROLE connecthub_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE connecthub_user SET default_transaction_deferrable TO on;
ALTER ROLE connecthub_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE connecthub TO connecthub_user;
\q
```

---

## 🔐 Step 4: Set Up Environment Variables

1. **In your project root directory, create a `.env` file:**

```bash
# Navigate to project root
cd ~/projects/connecthub

# Create .env file
touch .env
```

2. **Open `.env` in VS Code and add:**

```env
# Database Configuration
DATABASE_URL=postgresql://connecthub_user:connecthub_password@localhost:5432/connecthub
PGHOST=localhost
PGPORT=5432
PGUSER=connecthub_user
PGPASSWORD=connecthub_password
PGDATABASE=connecthub

# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=your_super_secret_session_key_change_this_in_production

# CORS
CORS_ORIGIN=http://localhost:5000

# Vite Configuration
VITE_API_URL=http://localhost:5000
```

### ⚠️ Important Security Note

The `.env` file contains sensitive information:
- **Never commit it to git** (already in `.gitignore`)
- **Never share it publicly**
- **Change secrets in production**

---

## 🗄️ Step 5: Initialize Database Schema

The project uses Drizzle ORM for database migrations.

```bash
# Push the schema to your database
npm run db:push

# You'll be prompted to confirm - type "yes"
```

This will create all necessary tables:
- users
- messages
- posts
- comments
- groups
- group_members
- notifications
- message_reactions
- calls

---

## 🎯 Step 6: Open Project in VS Code

```bash
# Open the project in VS Code
code .
```

Or manually:
1. Open VS Code
2. File → Open Folder
3. Select the `connecthub` folder
4. Click "Open"

---

## ▶️ Step 7: Run the Application

### Option A: Using VS Code Terminal (Recommended)

1. **Open integrated terminal:**
   - Press `Ctrl + `` (backtick)` or View → Terminal

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Wait for server to start:**
   You should see output like:
   ```
   ✓ built in 2.5s
   ➜  Local:   http://localhost:5000/
   ➜  press h to show help
   ```

### Option B: Using External Terminal

```bash
# In your terminal, navigate to project directory
cd ~/projects/connecthub

# Start development server
npm run dev
```

---

## 🌐 Step 8: Access the Application

1. **Open your browser** and go to:
   ```
   http://localhost:5000/
   ```

2. **You should see:**
   - ConnectHub landing page with hero section
   - Sign Up and Sign In buttons

3. **Create an account:**
   - Click "Get Started Free"
   - Fill in the signup form
   - Click "Create Account"

4. **Start using the app:**
   - Create posts
   - Send messages
   - Create groups
   - Make audio/video calls

---

## 🛠️ VS Code Recommended Extensions

Install these extensions for better development experience:

1. **ES7+ React/Redux/React-Native snippets**
   - Search: `dsznajder.es7-react-js-snippets`

2. **Prettier - Code formatter**
   - Search: `esbenp.prettier-vscode`

3. **ESLint**
   - Search: `dbaeumer.vscode-eslint`

4. **TypeScript Vue Plugin (Volar)**
   - Search: `vue.vscode-typescript-vue-plugin`

5. **Thunder Client** (for API testing)
   - Search: `rangav.vscode-thunder-client`

6. **PostgreSQL**
   - Search: `ckolkman.vscode-postgres`

### Installation:
- Click Extensions icon (or `Ctrl + Shift + X`)
- Search for extension name
- Click "Install"

---

## 📁 Project Structure for Local Development

```
connecthub/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── lib/          # Utilities (auth, websocket, calling)
│   │   └── App.tsx       # Main app component
│   ├── index.html
│   └── vite.config.ts
│
├── server/                 # Backend (Express + Node.js)
│   ├── index-dev.ts      # Development entry point
│   ├── index-prod.ts     # Production entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   └── websocket.ts      # WebSocket handler
│
├── shared/               # Shared code
│   └── schema.ts         # Database schema & types
│
├── .env                  # Environment variables (CREATE THIS)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── README.md             # Project documentation
```

---

## 🔄 Development Workflow

### Making Changes

1. **Edit files in VS Code**
   - Changes auto-save
   - Server auto-reloads
   - Browser auto-refreshes

2. **Check TypeScript errors:**
   ```bash
   npm run check
   ```

3. **View console logs:**
   - VS Code Terminal → shows server logs
   - Browser DevTools → shows client logs
   - Press `F12` to open DevTools

### Common Development Tasks

```bash
# Check for TypeScript errors
npm run check

# Build for production
npm run build

# Start production build locally
npm start

# Push database migrations
npm run db:push
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Error:** `could not connect to server: Connection refused`

**Solution:**
```bash
# Check if PostgreSQL is running
# On Windows: Services → PostgreSQL
# On Mac: brew services list
# On Linux: sudo systemctl status postgresql

# Start PostgreSQL if stopped
# Mac: brew services start postgresql
# Windows: Open Services and start PostgreSQL
# Linux: sudo systemctl start postgresql

# Verify connection
psql -U connecthub_user -d connecthub -h localhost
```

### Issue: Port 5000 Already in Use

**Error:** `listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
# On Mac/Linux:
lsof -i :5000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Module Not Found

**Error:** `Cannot find module '@shared/schema'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check vite.config.ts has correct alias
# Should have: '@': path.resolve(__dirname, './client/src')
```

### Issue: WebSocket Connection Failed

**Error:** `Failed to construct 'WebSocket': The URL is invalid`

**Solution:**
- Ensure server is running (`npm run dev`)
- Check browser console for errors
- Make sure localhost:5000 is accessible
- Try hard refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`)

### Issue: Database Tables Not Created

**Error:** `relation "users" does not exist`

**Solution:**
```bash
# Run migrations
npm run db:push

# If that fails, manually create tables using pgAdmin
# Or drop and recreate database:
psql -U postgres -c "DROP DATABASE connecthub;"
psql -U postgres -c "CREATE DATABASE connecthub;"
npm run db:push
```

---

## 📱 Testing Locally

### Create Test Accounts

1. **User 1:**
   - Username: alice
   - Email: alice@example.com
   - Password: password123

2. **User 2:**
   - Username: bob
   - Email: bob@example.com
   - Password: password123

3. **User 3:**
   - Username: charlie
   - Email: charlie@example.com
   - Password: password123

### Test Features

- **Messages:** Login as Alice, send message to Bob (open in another browser)
- **Posts:** Create a post, like and comment on it
- **Groups:** Create a group, add members, send group messages
- **Calling:** Click phone icon in messages to start audio/video call
- **Notifications:** Trigger notifications through interactions

---

## 🌐 Accessing from Other Devices

### On Same WiFi Network

1. **Find your machine's IP:**
   ```bash
   # Mac/Linux:
   ifconfig | grep "inet "
   
   # Windows:
   ipconfig
   ```

2. **Note the IP (usually starts with 192.168...)**

3. **On other device, visit:**
   ```
   http://<YOUR_IP>:5000/
   ```

### Using Ngrok for External Access

```bash
# Install ngrok
npm install -g ngrok

# In another terminal, expose localhost:5000
ngrok http 5000

# Use the public URL to access from anywhere
# https://xxxxxx.ngrok.io
```

---

## 📊 Monitoring & Debugging

### VS Code Debugger Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/server/index-dev.ts",
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Browser DevTools

1. **Press `F12`** to open DevTools
2. **Console tab:** View client-side logs
3. **Network tab:** Monitor API requests
4. **Application tab:** Check localStorage for tokens
5. **Performance tab:** Profile app performance

### Terminal Logs

- **Server logs:** See requests and errors in VS Code terminal
- **Database queries:** Enable in Drizzle config if needed

---

## 🚢 Next Steps

Once you're running locally:

1. **Explore the codebase:**
   - Start with `client/src/App.tsx`
   - Understand the routing structure
   - Review component architecture

2. **Make changes:**
   - Modify components
   - Add new features
   - Experiment with styling

3. **Test thoroughly:**
   - Create accounts
   - Test all features
   - Check error handling

4. **Deploy to production:**
   - See [README.md](README.md) for deployment options
   - Consider using Replit, Vercel, or Heroku

---

## 💡 Tips & Best Practices

### Development Workflow
- Keep terminal open to see logs
- Use VS Code's debugger for backend issues
- Browser DevTools for frontend debugging
- Hot reload makes testing fast

### Git Workflow
```bash
# Create a new branch for features
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

### Database Tips
- Don't modify database directly unless necessary
- Use migrations for schema changes
- Keep `.env` file secure and not in git
- Backup database before major changes

---

## 🆘 Getting Help

1. **Check logs:** Terminal and browser DevTools
2. **Read error messages:** Usually indicate the issue
3. **Check GitHub Issues:** Look for similar problems
4. **Ask in Discord:** Community support
5. **Search Stack Overflow:** For common issues

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Node.js installed and version 20+
- [ ] PostgreSQL installed and running
- [ ] `.env` file created with database credentials
- [ ] `npm install` completed without errors
- [ ] `npm run db:push` executed successfully
- [ ] `npm run dev` starts without errors
- [ ] Browser opens to http://localhost:5000
- [ ] Can create account and log in
- [ ] Can create posts and messages
- [ ] Can create groups
- [ ] Can test audio/video calls
- [ ] Dark mode toggle works
- [ ] Responsive design on mobile view

---

## 🎉 You're All Set!

Your ConnectHub development environment is ready. Start building amazing features!

For questions or issues, refer to:
- [README.md](README.md) - Project overview
- [Package.json](package.json) - Available scripts
- Official documentation - https://docs.connecthub.app

Happy coding! 🚀
