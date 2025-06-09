#!/usr/bin/env bash

# CodeRabbit Review Helper Script
# Helps capture and process CodeRabbit feedback

echo "🐰 CodeRabbit Review Helper"
echo "=========================="

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <PR_NUMBER>"
    echo "Example: $0 1"
    exit 1
fi

PR_NUMBER="$1"

echo "📋 Checking PR #$PR_NUMBER for CodeRabbit feedback..."

# Try to get CodeRabbit comments if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "🔍 Fetching CodeRabbit comments..."
    
    CODERABBIT_COMMENTS=$(gh pr view "$PR_NUMBER" --comments --json comments --jq '.comments[] | select(.author.login == "coderabbitai") | {author: .author.login, body: .body, createdAt: .createdAt}')
    
    if [[ -n "$CODERABBIT_COMMENTS" ]]; then
        echo "🐰 CodeRabbit Feedback Found:"
        echo "================================"
        echo "$CODERABBIT_COMMENTS" | jq -r '.body'
        echo "================================"
        
        # Save to file for analysis
        echo "$CODERABBIT_COMMENTS" | jq -r '.body' > "/tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt"
        echo "💾 Feedback saved to: /tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt"
        
        # Analyze feedback
        echo ""
        echo "🔧 Analysis:"
        
        if grep -i "security" "/tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt" &>/dev/null; then
            echo "  🛡️  Security issues detected"
        fi
        
        if grep -i "performance" "/tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt" &>/dev/null; then
            echo "  ⚡ Performance improvements suggested"
        fi
        
        if grep -i "error" "/tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt" &>/dev/null; then
            echo "  ❌ Error handling improvements needed"
        fi
        
        if grep -i "style\|format" "/tmp/coderabbit_feedback_pr_${PR_NUMBER}.txt" &>/dev/null; then
            echo "  🎨 Code style/formatting suggestions"
        fi
        
        echo ""
        echo "📝 Next steps:"
        echo "  1. Review the feedback above"
        echo "  2. Apply necessary changes to the code"
        echo "  3. Commit and push changes"
        echo "  4. CodeRabbit will re-review automatically"
        
    else
        echo "✅ No CodeRabbit feedback found (yet)"
        echo "💡 CodeRabbit might still be analyzing the PR"
    fi
else
    echo "❌ GitHub CLI not found"
    echo "📝 Manual steps:"
    echo "  1. Go to: https://github.com/adeavid/degenie/pull/$PR_NUMBER"
    echo "  2. Look for comments from @coderabbitai"
    echo "  3. Copy the feedback and share it"
fi

echo ""
echo "🔗 PR Link: https://github.com/adeavid/degenie/pull/$PR_NUMBER"