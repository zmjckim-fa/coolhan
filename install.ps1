# CoolHan Framework Installer for Windows PowerShell
#
# Usage:
#   .\install.ps1
#   or from URL:
#   iex (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/zmjckim-fa/coolhan/main/install.ps1')

param(
    [switch]$Force = $false
)

# Color functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    exit 1
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Copy-Directory {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -Path $Source)) {
        Write-Warn "Source directory not found: $Source"
        return
    }

    if (-not (Test-Path -Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $RelativePath = $_.FullName.Substring($Source.Length + 1)
        $DestPath = Join-Path -Path $Destination -ChildPath $RelativePath

        if ($_.PSIsContainer) {
            if (-not (Test-Path -Path $DestPath)) {
                New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
            }
        } else {
            Copy-Item -Path $_.FullName -Destination $DestPath -Force
        }
    }
}

function main {
    Write-Host "`n🚀 CoolHan Framework Installer`n" -ForegroundColor Cyan -BackgroundColor Black

    $CurrentDir = Get-Location
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

    Write-Info "Installation location: $CurrentDir"

    # Step 1: Check Node.js (optional)
    try {
        $NodeVersion = (node --version 2>$null)
        Write-Success "Node.js installed: $NodeVersion"
    } catch {
        Write-Warn "Node.js is not installed (optional)"
    }

    # Step 2: Create directories
    Write-Host "`n📁 Step 1: Creating directory structure..." -ForegroundColor Cyan

    $Dirs = @(
        '.claude',
        '.claude\agents',
        '.claude\skills',
        '.claude\hooks',
        '.claude\parsed',
        '.claude\analysis',
        '.claude\logs',
        '.claude\locks'
    )

    foreach ($Dir in $Dirs) {
        $FullPath = Join-Path -Path $CurrentDir -ChildPath $Dir
        if (-not (Test-Path -Path $FullPath)) {
            New-Item -ItemType Directory -Path $FullPath -Force | Out-Null
            Write-Success "Created: $Dir"
        } else {
            Write-Info "Already exists: $Dir"
        }
    }

    # Step 3: Copy main files
    Write-Host "`n📋 Step 2: Copying core files..." -ForegroundColor Cyan

    $FilesToCopy = @(
        'CLAUDE.md',
        'LICENSE',
        'README.md',
        'GITHUB_UPLOAD_CHECKLIST.md',
        'DOCUMENT_GUIDE.md'
    )

    foreach ($File in $FilesToCopy) {
        $Source = Join-Path -Path $ScriptDir -ChildPath $File
        $Destination = Join-Path -Path $CurrentDir -ChildPath $File

        if (Test-Path -Path $Source) {
            if (-not (Test-Path -Path $Destination)) {
                Copy-Item -Path $Source -Destination $Destination -Force
                Write-Success "Copied: $File"
            } else {
                Write-Warn "Already exists: $File (skipped)"
            }
        }
    }

    # Step 4: Copy .claude files
    Write-Host "`n⚙️  Step 3: Copying Claude Code settings..." -ForegroundColor Cyan

    $ClaudeFiles = @(
        'settings.json',
        'COMMIT_PROTOCOL.md',
        'DEPLOY_PROTOCOL.md',
        'FILE_MANIFEST.md',
        'DEPLOYMENT_MANIFEST.md',
        'LOCAL_ENVIRONMENT_CONFIG.md',
        'STAGING_ENVIRONMENT_CONFIG.md',
        'PRODUCTION_ENVIRONMENT_CONFIG.md',
        '00_MASTER_SPECIFICATION_MODULE.md'
    )

    $ClaudeDir = Join-Path -Path $CurrentDir -ChildPath '.claude'

    foreach ($File in $ClaudeFiles) {
        $Source = Join-Path -Path $ScriptDir -ChildPath '.claude' -AdditionalChildPath $File
        $Destination = Join-Path -Path $ClaudeDir -ChildPath $File

        if (Test-Path -Path $Source) {
            Copy-Item -Path $Source -Destination $Destination -Force
            Write-Success "Copied: $File"
        }
    }

    # Step 5: Copy hooks
    Write-Host "`n🔧 Step 4: Copying validation hooks..." -ForegroundColor Cyan

    $HooksSource = Join-Path -Path $ScriptDir -ChildPath '.claude\hooks'
    $HooksDest = Join-Path -Path $ClaudeDir -ChildPath 'hooks'

    if (Test-Path -Path $HooksSource) {
        Copy-Directory -Source $HooksSource -Destination $HooksDest
        Write-Success "Hooks copied successfully"
    }

    # Step 6: Copy agents
    Write-Host "`n👥 Step 5: Copying agent configurations..." -ForegroundColor Cyan

    $AgentsSource = Join-Path -Path $ScriptDir -ChildPath '.claude\agents'
    $AgentsDest = Join-Path -Path $ClaudeDir -ChildPath 'agents'

    if (Test-Path -Path $AgentsSource) {
        Copy-Directory -Source $AgentsSource -Destination $AgentsDest
        Write-Success "Agents copied successfully"
    }

    # Step 7: Copy skills
    Write-Host "`n💡 Step 6: Copying Claude Code skills..." -ForegroundColor Cyan

    $SkillsSource = Join-Path -Path $ScriptDir -ChildPath '.claude\skills'
    $SkillsDest = Join-Path -Path $ClaudeDir -ChildPath 'skills'

    if (Test-Path -Path $SkillsSource) {
        Copy-Directory -Source $SkillsSource -Destination $SkillsDest
        Write-Success "Skills copied successfully"
    }

    # Step 8: Copy knowledge base
    Write-Host "`n📚 Step 7: Copying knowledge base..." -ForegroundColor Cyan

    $KbSource = Join-Path -Path $ScriptDir -ChildPath 'knowledge_base'
    $KbDest = Join-Path -Path $CurrentDir -ChildPath 'knowledge_base'

    if (Test-Path -Path $KbSource) {
        Copy-Directory -Source $KbSource -Destination $KbDest
        Write-Success "Knowledge base copied successfully"
    }

    # Step 9: Update package.json
    Write-Host "`n📦 Step 8: Validating package.json..." -ForegroundColor Cyan

    $PackageJsonPath = Join-Path -Path $CurrentDir -ChildPath 'package.json'

    if (Test-Path -Path $PackageJsonPath) {
        $PackageJson = Get-Content -Path $PackageJsonPath -Raw | ConvertFrom-Json

        if (-not $PackageJson.scripts) {
            $PackageJson | Add-Member -Type NoteProperty -Name 'scripts' -Value @{}
        }

        $Scripts = @{
            'spec:parse' = 'node .claude/hooks/spec-parser.js'
            'spec:analyze' = 'node .claude/hooks/code-analyzer.js'
            'spec:validate' = 'node .claude/hooks/spec-validator.js'
            'env:validate' = 'node .claude/hooks/environment-validator.js'
            'lock:status' = 'node .claude/hooks/deploy-lock.js list'
            'lock:cleanup' = 'node .claude/hooks/deploy-lock.js cleanup'
        }

        foreach ($Key in $Scripts.Keys) {
            $PackageJson.scripts | Add-Member -Type NoteProperty -Name $Key -Value $Scripts[$Key] -Force
        }

        $PackageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $PackageJsonPath -Encoding UTF8
        Write-Success "package.json updated"
    } else {
        Write-Info "package.json not found (non-Node.js project)"
    }

    # Step 10: Git setup
    Write-Host "`n📝 Step 9: Git configuration check..." -ForegroundColor Cyan

    try {
        git --version | Out-Null

        $GitignorePath = Join-Path -Path $CurrentDir -ChildPath '.gitignore'
        $GitignoreContent = @'
# CoolHan Generated
.claude/parsed/
.claude/analysis/
.claude/logs/
.claude/locks/

# Environment
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
npm-debug.log*

# Build
dist/
build/
*.tsbuildinfo
'@

        if (-not (Test-Path -Path $GitignorePath)) {
            Set-Content -Path $GitignorePath -Value $GitignoreContent -Encoding UTF8
            Write-Success ".gitignore created"
        } else {
            Write-Info ".gitignore already exists"
        }
    } catch {
        Write-Warn "Git is not installed"
    }

    # Final summary
    Write-Host ("`n" + "=" * 60)
    Write-Host "`n✨ CoolHan Framework Installation Complete!`n" -ForegroundColor Green

    Write-Host "📂 Installed items:" -ForegroundColor Cyan
    Write-Host "  ✅ .claude/ - Claude Code settings"
    Write-Host "  ✅ .claude/hooks/ - Validation hook scripts (8)"
    Write-Host "  ✅ .claude/agents/ - Agent definitions (5)"
    Write-Host "  ✅ .claude/skills/ - Claude Code skills"
    Write-Host "  ✅ knowledge_base/ - Core documents and modules"
    Write-Host "  ✅ CLAUDE.md - Project operations guide"

    Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Read CLAUDE.md"
    Write-Host "  2. Read knowledge_base/00_AI_MASTER_RULES.md"
    Write-Host "  3. Read knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md"
    Write-Host "  4. Start writing project-specific documents"

    Write-Host "`n📖 Useful commands:" -ForegroundColor Cyan
    Write-Host "  npm run spec:validate  - Validate specifications"
    Write-Host "  npm run env:validate   - Detect environment"
    Write-Host "  npm run lock:status    - Check deployment lock status"

    Write-Host "`n$(("=" * 60))`n" -ForegroundColor Cyan

    Write-Host "Begin perfect rule-based development with CoolHan Framework! 🎯`n" -ForegroundColor Green
}

main
