# PowerShell script to handle git operations with Arabic path
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Navigate to project directory
$projectPath = "D:\منصة صحتي\Sahatu-main"
Set-Location -LiteralPath $projectPath

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..."
    git init
}

# Add all files
Write-Host "Adding files..."
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..."
    git commit -m "Update project files"
    Write-Host "Changes committed successfully!"
    
    # Check if remote exists
    $remote = git remote -v
    if ($remote) {
        Write-Host "Pushing to remote..."
        git push
        Write-Host "Changes pushed successfully!"
    } else {
        Write-Host "No remote repository configured. Please add remote with: git remote add origin <url>"
    }
} else {
    Write-Host "No changes to commit."
}

