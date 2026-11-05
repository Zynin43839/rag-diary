<#
.SYNOPSIS
    One-click setup script สำหรับ RAG-Diary + Content Agent
.DESCRIPTION
    ตรวจสอบ prerequisites, ติดตั้ง dependencies, สร้าง .env, และ init database
    รันด้วย: powershell -ExecutionPolicy Bypass -File setup.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$CYAN = "`e[36m"
$RESET = "`e[0m"
$CHECK = "$GREEN✓$RESET"
$CROSS = "$RED✗$RESET"
$ARROW = "$CYAN➜$RESET"

function Write-Step($msg) { Write-Host "`n$ARROW $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "  $CHECK $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  $YELLOW ⚠ $msg$RESET" }
function Write-Err($msg) { Write-Host "  $CROSS $RED$msg$RESET" }

# ============================================================
# SECTION 1: Prerequisites Check
# ============================================================
Write-Host @"

╔══════════════════════════════════════════════╗
║     RAG-Diary + Content Agent — Setup        ║
║        One-Click Installation Script          ║
╚══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Step "🔍 ตรวจสอบ Prerequisites..."

$missingTools = @()
$autoInstall = $false

# --- Node.js ---
try { $nodeVer = node --version; Write-OK "Node.js $nodeVer" }
catch {
    Write-Warn "ไม่พบ Node.js — จำเป็นสำหรับ Frontend (Next.js)"
    $missingTools += "Node.js"
}

# --- Bun ---
try { $bunVer = bun --version; Write-OK "Bun $bunVer" }
catch {
    Write-Warn "ไม่พบ Bun runtime — จำเป็นสำหรับ Backend (ElysiaJS)"
    $missingTools += "Bun"
}

# --- Python ---
try {
    $pyVer = python --version 2>&1
    if ($pyVer -match "Python 3\.(1[1-9]|[2-9]\d)") {
        Write-OK "Python $($pyVer.Trim())"
    } elseif ($pyVer -match "Python 3\.(1[0]|9|8|7)") {
        Write-Warn "Python $($pyVer.Trim()) ต่ำกว่า 3.11 — อาจมีปัญหากับ notebooklm-py"
    } else {
        Write-Warn "Python $($pyVer.Trim()) — ต่ำกว่า 3.11 แนะนำให้อัปเกรด"
    }
}
catch {
    Write-Warn "ไม่พบ Python — จำเป็นสำหรับ Content Agent Core"
    $missingTools += "Python 3.11+"
}

# --- Git ---
try { $gitVer = git --version; Write-OK $gitVer }
catch { Write-Warn "ไม่พบ Git" }

# ============================================================
# SECTION 2: Auto-install Missing Tools
# ============================================================
if ($missingTools.Count -gt 0) {
    Write-Step "🛠️ เครื่องมือที่ขาด: $($missingTools -join ', ')"
    
    $choice = Read-Host "  ติดตั้งอัตโนมัติ? (Y/N, default=Y)"
    if ($choice -eq "" -or $choice -eq "Y" -or $choice -eq "y") {
        $autoInstall = $true
        
        if ($missingTools -contains "Node.js") {
            Write-Host "  กำลังติดตั้ง Node.js via winget..."
            try {
                winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                refreshenv 2>$null
                $nodeVer = node --version
                Write-OK "Node.js $nodeVer ติดตั้งเรียบร้อย"
            } catch {
                Write-Err "ติดตั้ง Node.js ไม่สำเร็จ — ไปดาวน์โหลดที่ https://nodejs.org/"
            }
        }
        
        if ($missingTools -contains "Bun") {
            Write-Host "  กำลังติดตั้ง Bun..."
            try {
                powershell -c "irm bun.sh/install.ps1 | iex"
                $env:BUN_INSTALL = "$env:USERPROFILE\.bun"
                $env:Path = "$env:BUN_INSTALL\bin;$env:Path"
                $bunVer = bun --version
                Write-OK "Bun $bunVer ติดตั้งเรียบร้อย (เปิด terminal ใหม่เพื่อใช้คำสั่ง bun)"
            } catch {
                Write-Err "ติดตั้ง Bun ไม่สำเร็จ — ลองรัน: powershell -c `"irm bun.sh/install.ps1 | iex`""
            }
        }
        
        if ($missingTools -contains "Python 3.11+") {
            Write-Host "  กำลังติดตั้ง Python 3.13 via winget..."
            try {
                winget install Python.Python.3.13 --silent --accept-package-agreements
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                refreshenv 2>$null
                $pyVer = python --version
                Write-OK "Python $($pyVer.Trim()) ติดตั้งเรียบร้อย"
            } catch {
                Write-Err "ติดตั้ง Python ไม่สำเร็จ — ไปดาวน์โหลดที่ https://www.python.org/downloads/"
            }
        }
    } else {
        Write-Warn "ข้ามการติดตั้ง — กรุณาติดตั้งเอง: $($missingTools -join ', ')"
    }
}

# ============================================================
# SECTION 3: Install Project Dependencies
# ============================================================
Write-Step "📦 ติดตั้ง Project Dependencies..."

# --- Root package.json ---
if (Test-Path "$ROOT_DIR\package.json") {
    Write-Host "  root dependencies..."
    try {
        bun install --cwd "$ROOT_DIR" 2>$null
        if ($?) { Write-OK "root dependencies installed" }
    } catch { Write-Warn "root dependencies — ลองรัน: bun install" }
}

# --- Server dependencies (Bun) ---
if (Test-Path "$ROOT_DIR\server\package.json") {
    Write-Host "  server dependencies (ElysiaJS)..."
    try {
        bun install --cwd "$ROOT_DIR\server"
        if ($?) { Write-OK "server dependencies installed" }
    } catch { Write-Err "server dependencies failed — ลองรัน: cd server && bun install" }
}

# --- Frontend dependencies (Bun) ---
if (Test-Path "$ROOT_DIR\frontend\package.json") {
    Write-Host "  frontend dependencies (RAG-Diary)..."
    try {
        bun install --cwd "$ROOT_DIR\frontend"
        if ($?) { Write-OK "frontend (RAG-Diary) installed" }
    } catch { Write-Err "frontend (RAG-Diary) failed" }
}

# ── Content Agent: Server (ElysiaJS) ──
$caServerPkg = "$ROOT_DIR\content-agent\server\package.json"
if (Test-Path $caServerPkg) {
    Write-Host "  content-agent server dependencies (ElysiaJS)..."
    try {
        bun install --cwd "$ROOT_DIR\content-agent\server"
        if ($?) { Write-OK "content-agent server installed" }
    } catch { Write-Err "content-agent server failed" }
}

# ── Content Agent: Frontend (Next.js) ──
$caFrontendPkg = "$ROOT_DIR\content-agent\frontend\package.json"
if (Test-Path $caFrontendPkg) {
    Write-Host "  content-agent frontend dependencies (Next.js)..."
    try {
        bun install --cwd "$ROOT_DIR\content-agent\frontend"
        if ($?) { Write-OK "content-agent frontend installed" }
    } catch { Write-Err "content-agent frontend failed — ลองรัน: cd content-agent/frontend && bun install" }
}

# --- Python dependencies ---
Write-Host "  Python dependencies (Content Agent Core)..."
$pythonPkgs = @(
    "notebooklm-py",
    "openai",                          # GPT-4o / Embeddings
    "apscheduler",
    "yfinance",
    "httpx",
    "sqlalchemy",
    "numpy",                           # Vector similarity search
    "pydantic",
    "pydantic-settings",
    "python-dotenv"
)

try {
    $installPkgs = $pythonPkgs -join " "
    python -m pip install $installPkgs --quiet 2>&1 | Out-Null
    if ($?) { Write-OK "Python packages installed" }
    else { Write-Warn "Python packages อาจติดตั้งไม่ครบ — ลองรัน: pip install $installPkgs" }
} catch {
    Write-Warn "Python packages failed — ลองรัน: pip install $installPkgs"
}

# --- NotebookLM browser dependencies ---
Write-Host "  NotebookLM browser dependencies..."
try {
    python -m playwright install chromium 2>&1 | Out-Null
    if ($?) { Write-OK "Playwright Chromium installed" }
    else { Write-Warn "Playwright Chromium ไม่สำเร็จ — ข้ามได้ถ้าไม่ต้องการ auth ผ่าน Playwright" }
} catch {
    Write-Warn "Playwright Chromium — ข้ามได้"
}

# --- Create .notebooklm directory (สำหรับ auth) ---
$notebooklmDir = "$env:USERPROFILE\.notebooklm"
if (-not (Test-Path $notebooklmDir)) {
    New-Item -ItemType Directory -Path $notebooklmDir -Force | Out-Null
    Write-OK "สร้าง $notebooklmDir แล้ว"
}

# ============================================================
# SECTION 4: Environment Files
# ============================================================
Write-Step "🔧 สร้าง Environment Files..."

# --- Server .env ---
$serverEnv = "$ROOT_DIR\server\.env"
$serverExample = "$ROOT_DIR\server\.env.example"
if (-not (Test-Path $serverEnv)) {
    if (Test-Path $serverExample) {
        Copy-Item -Path $serverExample -Destination $serverEnv
        Write-OK "คัดลอก server\.env จาก .env.example (กรุณาใส่ API keys จริง)"
    } else {
        Write-Err "ไม่พบ server\.env.example — สร้าง .env เอง"
    }
} else {
    Write-OK "server\.env มีอยู่แล้ว (ใช้ของเดิม)"
}

# --- Content Agent .env ---
$agentDir = "$ROOT_DIR\content-agent"
$agentEnv = "$agentDir\.env"
$agentExample = "$agentDir\.env.example"
if (-not (Test-Path $agentEnv)) {
    if (Test-Path $agentExample) {
        Copy-Item -Path $agentExample -Destination $agentEnv
        Write-OK "คัดลอก content-agent\.env จาก .env.example (กรุณาใส่ API keys จริง)"
    } else {
        Write-Err "ไม่พบ content-agent\.env.example"
    }
} else {
    Write-OK "content-agent\.env มีอยู่แล้ว"
}

# ============================================================
# SECTION 5: Initialize Data Directories + SQLite DB
# ============================================================
Write-Step "🗄️ สร้าง Data Directories + SQLite Databases..."

$dataDirs = @(
    "$ROOT_DIR\data",
    "$ROOT_DIR\content-agent\data"
)

foreach ($dir in $dataDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-OK "สร้าง $dir แล้ว"
    } else {
        Write-OK "$dir มีอยู่แล้ว"
    }
}

# --- SQLite: init rag_diary.db schema (RAG-Diary + Content Agent) ---
$ragDb = "$ROOT_DIR\data\rag_diary.db"
if (-not (Test-Path $ragDb)) {
    try {
        # Use python to create the SQLite schema (python usually available)
        python -c @"
import sqlite3, os

db_path = os.path.abspath(r'$ragDb')
os.makedirs(os.path.dirname(db_path), exist_ok=True)
conn = sqlite3.connect(db_path)
c = conn.cursor()

    c.executescript('''
    -- 👤 User Profile & Config (BYOD — ผู้ใช้กรอกเอง)
    CREATE TABLE IF NOT EXISTS user_profile (
        id          TEXT PRIMARY KEY,
        display_name TEXT,
        openai_key  TEXT,
        settings    TEXT DEFAULT '{}',
        created_at  TEXT DEFAULT (datetime('now'))
    );

    -- 📖 User-Configured Data Sources
    CREATE TABLE IF NOT EXISTS tracked_sources (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES user_profile(id),
        source_type TEXT NOT NULL,
        label       TEXT,
        uri         TEXT NOT NULL,
        config      TEXT DEFAULT '{}',
        notebook_id TEXT,
        fetch_interval INTEGER,
        last_fetched TEXT,
        is_active   INTEGER DEFAULT 1,
        created_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sources_user ON tracked_sources(user_id);

    -- 📓 Connected NotebookLM Notebooks (user's own notebooks)
    CREATE TABLE IF NOT EXISTS connected_notebooks (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES user_profile(id),
        notebook_id TEXT NOT NULL,
        title       TEXT,
        purpose     TEXT,
        source_count INTEGER DEFAULT 0,
        is_active   INTEGER DEFAULT 1,
        created_at  TEXT DEFAULT (datetime('now'))
    );

    -- 📝 Diary entries (demo/test data — ผู้ใช้จริงไม่มี)
    CREATE TABLE IF NOT EXISTS diary_entries (
        id         TEXT PRIMARY KEY,
        user_id    TEXT REFERENCES user_profile(id),
        content    TEXT NOT NULL,
        tag        TEXT DEFAULT 'General',
        created_at TEXT DEFAULT (datetime('now')),
        embedding  BLOB
    );
    CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_diary_tag ON diary_entries(tag);
    CREATE INDEX IF NOT EXISTS idx_diary_created ON diary_entries(created_at);

    -- Content Agent: generated content
    CREATE TABLE IF NOT EXISTS content_history (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES user_profile(id),
        content     TEXT NOT NULL,
        template    TEXT NOT NULL,
        platforms   TEXT NOT NULL,
        status      TEXT DEFAULT 'draft',
        source      TEXT,
        created_at  TEXT DEFAULT (datetime('now')),
        published_at TEXT,
        metadata    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_content_status ON content_history(status);
    CREATE INDEX IF NOT EXISTS idx_content_created ON content_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_user ON content_history(user_id);

    -- Content Agent: publish queue
    CREATE TABLE IF NOT EXISTS publish_queue (
        id          TEXT PRIMARY KEY,
        user_id     TEXT REFERENCES user_profile(id),
        content_id  TEXT NOT NULL REFERENCES content_history(id),
        platform    TEXT NOT NULL,
        status      TEXT DEFAULT 'pending',
        scheduled_at TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        result      TEXT,
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_queue_status ON publish_queue(status);
    CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON publish_queue(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_queue_user ON publish_queue(user_id);
''')

conn.commit()
conn.close()
print('OK')
"@ 2>&1 | Out-Null

        if ($?) {
            Write-OK "สร้าง data/rag_diary.db + schema เรียบร้อย"
        } else {
            Write-Warn "rag_diary.db init ล้มเหลว — จะสร้าง auto เมื่อรัน server ครั้งแรก"
        }
    } catch {
        Write-Warn "ไม่สามารถสร้าง rag_diary.db — ข้ามไป (server จะสร้างเองตอนรันครั้งแรก)"
    }
} else {
    Write-OK "data/rag_diary.db มีอยู่แล้ว"
}

# ============================================================
# SECTION 6: Git Hooks (แนะนำ)
# ============================================================
Write-Step "🔗 ตรวจสอบ Git Hooks..."
$gitHookDir = "$ROOT_DIR\.git\hooks"
if (Test-Path $gitHookDir) {
    $preCommit = "$gitHookDir\pre-commit"
    if (-not (Test-Path $preCommit)) {
        Write-Warn "ไม่มี pre-commit hook — แนะนำให้เพิ่มเพื่อป้องกันการ commit secrets (.env)"
    } else {
        Write-OK "มี pre-commit hook แล้ว"
    }
}

# ============================================================
# SECTION 7: Summary
# ============================================================
Write-Host @"

╔══════════════════════════════════════════════╗
║              Setup Complete! 🎉              ║
╚══════════════════════════════════════════════╝

"@ -ForegroundColor Green

$hasBun = $null -ne (bun --version 2>$null)
$hasPython = $null -ne (python --version 2>$null)

Write-Host "📋 สรุปสิ่งที่ต้องทำต่อ:" -ForegroundColor Cyan

if (-not $hasBun) {
    Write-Host "  $ARROW ติดตั้ง Bun ด้วย: powershell -c `"irm bun.sh/install.ps1 | iex`""
}
if (-not $hasPython) {
    Write-Host "  $ARROW ติดตั้ง Python 3.11+ จาก: https://www.python.org/downloads/"
}

Write-Host @"

  $ARROW เปิด terminal ใหม่ (ให้ PATH อัปเดต)
  $ARROW แก้ไข server/.env + content-agent/.env → ใส่ OpenAI key
  $ARROW init Content Agent database:
        cd content-agent
        python -m agent.main init-db

  $ARROW รันแบบแยก terminal (3 ตัว):

        # Terminal 1 — Content Agent API
        cd content-agent/server
        bun run dev          # → http://localhost:3002

        # Terminal 2 — Content Agent Frontend
        cd content-agent/frontend
        bun dev              # → http://localhost:3000

        # Terminal 3 — CLI (optional)
        cd content-agent
        python -m agent.main ask "ตลาดวันนี้เป็นไง"

  $ARROW RAG-Diary (ของเดิม) ยังรันได้ปกติ:
        cd server && bun run dev     # → localhost:3001
        cd frontend && bun dev       # → localhost:3000 (ถ้า port 3000 ไม่ตรง ให้เปลี่ยน port)

  $ARROW อ่าน doc ที่เกี่ยวข้อง:
        - content-agent\README.md                     — วิธีติดตั้ง Content Agent
        - content-agent\ARCHITECTURE_PROPOSAL.md      — Proposal ฉบับเต็ม
        - AGENTS_HUB.md                               — ภาพรวมโปรเจกต์

"@ -ForegroundColor Cyan

Write-Host "Happy coding! 🚀" -ForegroundColor Green
