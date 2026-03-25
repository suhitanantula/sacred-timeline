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

# 2. Install the Claude Code skill
SKILL_DIR="$HOME/.claude/skills"
if [ -d "$SKILL_DIR" ]; then
    echo "Installing Claude Code skill..."
    SKILL_SRC="$(dirname "$0")/skills/sacred-timeline.md"

    # If running via curl (not from repo), fetch the skill file
    if [ ! -f "$SKILL_SRC" ]; then
        curl -fsSL https://raw.githubusercontent.com/suhitanantula/sacred-timeline/main/skills/sacred-timeline.md \

             -o "$SKILL_DIR/sacred-timeline.md"
    else
        cp "$SKILL_SRC" "$SKILL_DIR/sacred-timeline.md"
    fi
    echo -e "${GREEN}✓${NC} Claude Code skill installed"
else
    echo -e "${YELLOW}○${NC} ~/.claude/skills not found — skipping Claude Code skill"
    echo "  (Install Claude Code first, then copy skills/sacred-timeline.md to ~/.claude/skills/)"
fi

# 3. Done
echo ""
echo -e "${GREEN}✓${NC} Sacred Timeline installed!"
echo ""
echo "  sacred capture \"started something new\""
echo "  sacred experiment \"bold-new-idea\""
echo "  sacred narrate"
echo ""
echo "  In Claude Code: /sacred-timeline"
echo ""
