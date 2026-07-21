<#
.SYNOPSIS
Dev helper script. Usage: .\dev.ps1 <command> [options]

.EXAMPLE  .\dev.ps1 build
.EXAMPLE  .\dev.ps1 run
.EXAMPLE  .\dev.ps1 draft -Path "_drafts/my-post.md"
.EXAMPLE  .\dev.ps1 draft -Path "_drafts" -Remove
.EXAMPLE  .\dev.ps1 covers
.EXAMPLE  .\dev.ps1 social-images -Path "_posts/web/example.md"
.EXAMPLE  .\dev.ps1 git-setup
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('build', 'run', 'draft', 'covers', 'social-images', 'git-setup')]
    [string]$Command,

    # Options forwarded to 'draft'
    [string]$Path,
    [switch]$Remove
)

function Invoke-Build {
    docker build . -t srungtagithub:debug
}

function Invoke-Run {
    docker run --rm -v ${PWD}:/srv/jekyll -p 8080:4000 -e JEKYLL_ENV=production -it jekyll/minimal:3.8 jekyll serve --force_polling
}

function Invoke-Draft {
    if (-not $Path) { throw "'-Path' is required for the 'draft' command." }

    $currentDate = Get-Date -Format "yyyy-MM-dd"

    function Rename-DraftFile([System.IO.FileInfo]$File) {
        if ($Remove) {
            if ($File.Name -match "^(\d{4}-\d{2}-\d{2}-)(.+)") {
                Rename-Item -Path $File.FullName -NewName $Matches[2] -Force
                Write-Host "Renamed '$($File.Name)' -> '$($Matches[2])'"
            } else {
                Write-Host "Skipped '$($File.Name)', no date prefix found."
            }
        } else {
            if ($File.Name -notmatch "^\d{4}-\d{2}-\d{2}-") {
                $newName = "$currentDate-$($File.Name)"
                Rename-Item -Path $File.FullName -NewName $newName -Force
                Write-Host "Renamed '$($File.Name)' -> '$newName'"
            } else {
                Write-Host "Skipped '$($File.Name)', already has a date prefix."
            }
        }
    }

    if (Test-Path -Path $Path -PathType Leaf) {
        Rename-DraftFile (Get-Item $Path)
    } elseif (Test-Path -Path $Path -PathType Container) {
        Get-ChildItem -Path $Path -File | ForEach-Object { Rename-DraftFile $_ }
    } else {
        throw "Path '$Path' is not a valid file or directory."
    }
}

function Invoke-GitSetup {
    git config user.name "Shaswat Rungta"
    git config user.email "shaswatrungta@hotmail.com"
    Write-Host "Git user config updated."
}

function Invoke-Covers {
    node scripts/generate-covers.mjs
}

function Invoke-SocialImages {
    if ($Path) {
        node scripts/render-social-images.mjs $Path
    } else {
        node scripts/render-social-images.mjs
    }
}

# --- dispatch ---
switch ($Command.ToLower()) {
    "build"     { Invoke-Build }
    "run"       { Invoke-Run }
    "draft"     { Invoke-Draft }
    "covers"    { Invoke-Covers }
    "social-images" { Invoke-SocialImages }
    "git-setup" { Invoke-GitSetup }
    default     { Write-Error "Unknown command '$Command'. Available: build, run, draft, covers, social-images, git-setup" }
}
