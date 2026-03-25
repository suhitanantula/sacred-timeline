#!/bin/bash
# Sacred Timeline — one-line install
# Usage: curl -fsSL https://raw.githubusercontent.com/suhitanantula/sacred-timeline/main/install.sh | bash
# Or: bash install.sh

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}Sacred Timeline${NC} — Git for humans"
echo ""

# 1. Install the CLI
echo "Installing sacred CLI..."
npm install -g @suhit/sacred-timeline

# 2. Install the skill for any supported agents
SKILL_SRC="$(dirname "$0")/skills/sacred-timeline.md"
SKILL_INSTALLED=0

install_skill() {
    local AGENT_NAME=$1
    local SKILL_DIR=$2
    mkdir -p "$SKILL_DIR"
    if [ ! -f "$SKILL_SRC" ]; then
        curl -fsSL https://raw.githubusercontent.com/suhitanantula/sacred-timeline/main/skills/sacred-timeline.md \
             -o "$SKILL_DIR/SKILL.md"
    else
        cp "$SKILL_SRC" "$SKILL_DIR/SKILL.md"
    fi
    echo -e "${GREEN}✓${NC} $AGENT_NAME skill installed"
    SKILL_INSTALLED=1
}

if [ -d "$HOME/.claude/skills" ]; then
    install_skill "Claude Code" "$HOME/.claude/skills/sacred-timeline"
fi

if [ -d "$HOME/.codex/skills" ]; then
    install_skill "Codex" "$HOME/.codex/skills/sacred-timeline"
fi

if [ "$SKILL_INSTALLED" -eq 0 ]; then
    echo -e "${YELLOW}○${NC} No agent skill folders found — skipping skill install"
    echo "  (Install Claude Code or Codex first, then re-run this script)"
fi

# 3. Shell integration
echo ""
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    echo -e "Want Sacred Timeline to show status automatically when you cd into a project? (y/n)"
    read -r REPLY </dev/tty
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
        sacred init-shell >> "$SHELL_RC"
        echo -e "${GREEN}✓${NC} Shell integration added to $SHELL_RC"
        echo -e "${YELLOW}  Run: source $SHELL_RC${NC}"
    else
        echo -e "${YELLOW}○${NC} Skipped — run 'sacred init-shell >> $SHELL_RC && source $SHELL_RC' any time to enable it."
    fi
fi

# 4. Done
echo ""
echo -e "${GREEN}✓${NC} Sacred Timeline installed!"
echo ""
echo "  sacred capture \"started something new\""
echo "  sacred experiment \"bold-new-idea\""
echo "  sacred narrate"
echo ""
echo "  In Claude Code, the /sacred-timeline skill is now available."
echo ""
