# How to Upload Files from Your Disk to This Repository

There are three ways to upload files. Pick the one that suits you best.

---

## Method 1 — GitHub Website (easiest, no tools needed)

This works for uploading individual files or entire folders without installing anything.

### Upload a single file or a few files

1. Go to the repository on GitHub:  
   👉 https://github.com/priyanshukumarcse123094-commits/Stationery_World

2. Navigate to the folder where you want to place the file  
   (e.g. click into `Desktop/Code/.../frontend/src/pages/`)

3. Click the **Add file** button (top-right of the file list)

4. Choose **Upload files**

5. **Drag and drop** your files onto the page, or click **choose your files** to browse your disk

6. Scroll down to the **Commit changes** section:
   - Add a short description (e.g. `Add updated Cart page`)
   - Keep *Commit directly to the `main` branch* selected

7. Click **Commit changes** — your files are now in the repo ✅

### Upload a whole folder

GitHub's web UI does **not** support uploading entire folder trees in one step.  
For that, use **Method 2** (VS Code) or **Method 3** (Git CLI) below.

---

## Method 2 — VS Code Source Control (recommended for VS Code users)

This is the best option if you already have VS Code open with this project.

### One-time setup (only if you haven't cloned yet)

```bash
git clone https://github.com/priyanshukumarcse123094-commits/Stationery_World.git
cd Stationery_World
code Stationery_World.code-workspace
```

### Uploading / updating files

1. **Copy or save your updated file(s)** into the correct location inside the cloned repo folder on your disk.

   After cloning, your local copy of the repository will be at a path like:
   - Windows: `C:\Users\YourName\Stationery_World\`
   - Mac/Linux: `/home/YourName/Stationery_World/`

   The frontend and backend source code live deep inside that folder:
   ```
   Stationery_World/
   └── Desktop/
       └── Code/
           └── Web_Developoment/
               └── 1._HTML_CSS/
                   └── Projects/
                       └── stationery-world/
                           ├── frontend/   ← React app goes here
                           └── backend/    ← Node.js API goes here
   ```
   Copy your files into whichever subfolder they belong to.

2. **Open the Source Control panel** in VS Code  
   Click the branch icon in the left sidebar, or press `Ctrl + Shift + G` (Windows/Linux) / `Cmd + Shift + G` (Mac)

3. You will see your changed/new files listed under **Changes**

4. **Stage the files** — click the **+** icon next to each file, or click **+** next to "Changes" to stage all at once

5. **Write a commit message** in the text box at the top (e.g. `Update Cart page with new design`)

6. Click the **✓ Commit** button

7. Click **Sync Changes** (or the **↑ Push** button) to upload to GitHub

Your files are now live on GitHub ✅

---

## Method 3 — Git Command Line (most powerful)

Use this if you prefer the terminal or need to upload many files at once.

### One-time setup

```bash
# Install Git if you don't have it: https://git-scm.com/downloads

# Clone the repository (skip if already cloned)
git clone https://github.com/priyanshukumarcse123094-commits/Stationery_World.git
cd Stationery_World
```

### Before running `git add .` — check what will be staged

Running `git add .` stages **everything** that has changed, including things you don't want (see [What NOT to commit](#-what-not-to-commit) below). Always preview first:

```bash
git status          # see which files are new/changed
git diff --stat     # see a summary of changes
```

### Uploading / updating files

```bash
# Step 1: Copy your updated files into the repo folder on your disk
# (just paste them in using File Explorer / Finder — no command needed)

# Step 2: Preview what has changed — do this before staging!
git status

# Step 3: Stage only your source code (NOT node_modules, .env, etc.)
git add path/to/your/file.js        # stage a specific file (safest)
git add src/                        # stage an entire source folder
# OR, if you are sure nothing bad is untracked:
git add .

# Step 4: Commit with a message
git commit -m "Add updated frontend pages"

# Step 5: Push to GitHub
git push origin main
```

Your files are now live on GitHub ✅

---

## ⚠️ What NOT to commit

These files **must never** be committed. They bloat the repo, may expose secrets, and can cause CI failures:

| Files / folders | Why |
|-----------------|-----|
| `node_modules/` | Hundreds of MB of packages — recreated with `npm install` |
| `.env` | Contains your database password and JWT secret |
| `*.zip`, `*.tar.gz` | Large binary archives with no diff value |
| `uploads/` (product images) | Runtime-generated content |
| `.DS_Store` | macOS junk files |
| `*.dylib.node`, `*.wasm` | Platform-specific binary engine files |

The `.gitignore` files in this repo already block all of these. If they appear in `git status` as untracked, that means git is correctly ignoring them — do **not** force-add them with `git add -f`.

---

## Which method should I use?

| Situation | Best method |
|-----------|-------------|
| Upload 1–5 files quickly, no tools | **Method 1** — GitHub website |
| You use VS Code and already have the repo open | **Method 2** — VS Code Source Control |
| Uploading many files or whole folders | **Method 3** — Git CLI |
| You want to replace large parts of the project | **Method 3** — Git CLI |

---

## Troubleshooting

### ❌ "remote: Permission to … denied" or error 403

This means your local `origin` remote is pointing to the **wrong repository**.

**Check your current remote:**
```bash
git remote -v
```

If it shows a URL for an org/repo you don't have write access to (e.g. `Coding-gurukul-8/Stationery_World`), fix it:

```bash
git remote set-url origin https://github.com/priyanshukumarcse123094-commits/Stationery_World.git
```

Confirm the fix:
```bash
git remote -v
# should now show: priyanshukumarcse123094-commits/Stationery_World.git
```

Then push again:
```bash
git push origin main
```

### ❌ "Permission denied" or "Authentication failed" when pushing

You need to sign in to GitHub in VS Code or configure Git credentials:

- **VS Code**: `Ctrl/Cmd + Shift + P` → **GitHub: Sign In**
- **Git CLI**: Use a [Personal Access Token](https://github.com/settings/tokens) as your password,  
  or run `gh auth login` if you have the [GitHub CLI](https://cli.github.com/) installed.

### ❌ I accidentally committed `node_modules/`, `.env`, or `.DS_Store`

Remove them from git's tracking (they stay on your disk but git stops watching them):

```bash
# Remove node_modules
git rm --cached -r node_modules

# Remove .env file
git rm --cached .env

# Remove .DS_Store files
git rm --cached -r --ignore-unmatch $(git ls-files --ignored --exclude-standard)

# Remove a specific zip backup
git rm --cached Backend_21_Feb_2026_23_27.zip

# Commit the removals
git commit -m "Remove accidentally committed build artifacts and secrets"

# Push
git push origin main
```

> ⚠️ **Important:** If you committed a real `.env` file with database passwords or JWT secrets, treat those secrets as **compromised**. Change your database password and generate a new `JWT_SECRET` immediately.

### ❌ "Your branch is behind 'origin/main'"

Someone else pushed changes since you last pulled. Run:

```bash
git pull origin main
# then push again
git push origin main
```

### ❌ I accidentally uploaded the wrong file — how do I remove it?

```bash
git rm path/to/wrong/file.js
git commit -m "Remove wrong file"
git push origin main
```

---

> 💡 **Tip:** Never commit your `.env` file — it contains database passwords and secret keys.  
> The `.gitignore` in this repo already blocks `.env` files from being uploaded.
