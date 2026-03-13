# Stationery World

An e-commerce application for stationery items and academic books.

---

## 🚀 Quick Start

### 1 · Open the Workspace in VS Code

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/priyanshukumarcse123094-commits/Stationery_World.git
cd Stationery_World

# Open the multi-root workspace — this gives you Frontend and Backend as separate folders
code Stationery_World.code-workspace
```

> **Tip:** When prompted *"Do you want to install the recommended extensions?"*, click **Install All** to get ESLint, Prettier, Prisma, GitLens, and **GitHub Copilot** set up automatically.

---

## 🤖 Enabling GitHub Copilot in VS Code

1. **Sign in to GitHub** in VS Code  
   `Ctrl/Cmd + Shift + P` → **GitHub: Sign in**  
   Use the same GitHub account that has Copilot enabled.

2. **Install the Copilot extensions** (auto-suggested when you open the workspace):
   - `GitHub.copilot` — inline code completions
   - `GitHub.copilot-chat` — AI chat panel (`Ctrl/Cmd + Shift + I`)

3. **Verify Copilot is active**  
   Look for the Copilot icon (✦) in the bottom-right status bar. If it shows a red circle, click it to sign in.

4. **Project context for Copilot** is stored in [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — Copilot Chat reads this automatically to understand the project architecture, conventions, and tech stack.

---

## 🛠️ Running the Project

### Backend (Express + Prisma)

```bash
cd Desktop/Code/Web_Developoment/1._HTML_CSS/Projects/stationery-world/backend
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET (if .env.example exists)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev                   # starts on http://localhost:5000
```

### Frontend (React + Vite)

```bash
cd Desktop/Code/Web_Developoment/1._HTML_CSS/Projects/stationery-world/frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

Or use the VS Code task: `Ctrl/Cmd + Shift + B` → **Full Stack: Start Both Servers**

---

## 📤 How to Upload Files from Your Disk

New to Git or want to update the repo with files you've edited locally?  
See the step-by-step guide: **[UPLOADING_FILES.md](UPLOADING_FILES.md)**

It covers:
- GitHub website drag-and-drop (no tools needed)
- VS Code Source Control panel
- Git command line (`git add → commit → push`)

---

## 📁 Project Structure

```
stationery-world/
├── backend/        # Node.js + Express + Prisma + PostgreSQL
└── frontend/       # React 19 + Vite + React Router v7
```

Full architecture details are in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
 
