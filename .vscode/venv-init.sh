#!/bin/bash
# VS Code/Cursor terminal initialization script
# Automatically creates and activates Python virtual environment

# Source the user's bashrc first for normal shell setup
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi

# Get the workspace folder (script is in .vscode/)
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$WORKSPACE_DIR/.venv"

# Function to create venv if it doesn't exist
create_venv_if_needed() {
    if [ ! -d "$VENV_DIR" ]; then
        echo "🐍 Creating Python virtual environment at .venv..."
        python3 -m venv "$VENV_DIR"
        if [ $? -eq 0 ]; then
            echo "✅ Virtual environment created successfully!"
            # Upgrade pip in the new venv
            "$VENV_DIR/bin/pip" install --upgrade pip --quiet
        else
            echo "❌ Failed to create virtual environment"
            return 1
        fi
    fi
}

# Function to activate the venv
activate_venv() {
    if [ -f "$VENV_DIR/bin/activate" ]; then
        source "$VENV_DIR/bin/activate"
        echo "🐍 Activated virtual environment: $VENV_DIR"
    else
        echo "⚠️  Virtual environment activation script not found"
    fi
}

# Main execution
create_venv_if_needed
activate_venv

# Change to workspace directory
cd "$WORKSPACE_DIR"
