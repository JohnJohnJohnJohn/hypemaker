# VS Code/Cursor terminal initialization script for Windows PowerShell
# Automatically creates and activates Python virtual environment

# Get the workspace folder (script is in .vscode/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceDir = Split-Path -Parent $ScriptDir
$VenvDir = Join-Path $WorkspaceDir ".venv"

# Function to create venv if it doesn't exist
function Create-VenvIfNeeded {
    if (-not (Test-Path $VenvDir)) {
        Write-Host "🐍 Creating Python virtual environment at .venv..." -ForegroundColor Cyan
        python -m venv $VenvDir
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Virtual environment created successfully!" -ForegroundColor Green
            # Upgrade pip in the new venv
            & "$VenvDir\Scripts\pip.exe" install --upgrade pip --quiet
        } else {
            Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
            return
        }
    }
}

# Function to activate the venv
function Activate-Venv {
    $ActivateScript = Join-Path $VenvDir "Scripts\Activate.ps1"
    if (Test-Path $ActivateScript) {
        & $ActivateScript
        Write-Host "🐍 Activated virtual environment: $VenvDir" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Virtual environment activation script not found" -ForegroundColor Yellow
    }
}

# Main execution
Create-VenvIfNeeded
Activate-Venv

# Change to workspace directory
Set-Location $WorkspaceDir
