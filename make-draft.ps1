
<#
.SYNOPSIS
Renames files in a specified folder (or a single file) by adding the current date to the beginning of the filename, unless the filename already starts with the date.

.DESCRIPTION
This script takes a file or folder path as input. It then iterates through the files 
in the specified folder (or renames the single file) and renames them by adding the 
current date in "yyyy-MM-dd-" format to the beginning of the original filename.
If a file already starts with the date in the specified format, it is skipped.

.PARAMETER Path
The path to the file or folder to process. If a folder is specified, all files 
in that folder will be renamed.

.EXAMPLE
.\make-draft.ps1 -Path "C:\MyFolder"
Renames all files in the "C:\MyFolder" directory, unless they already start with the date. 
For example, "image.jpg" becomes "2024-01-15-image.jpg", but "2024-01-15-image.jpg" is not changed.

.EXAMPLE
.\make-draft.ps1 -Path "C:\MyFolder\document.txt"
Renames the single file "C:\MyFolder\document.txt" to "2024-01-15-document.txt", unless it already starts with the date.

.EXAMPLE
.\make-draft.ps1 -Path "C:\MyFolder\document.txt" -Remove
Renames the single file "C:\MyFolder\2024-01-15-document.txt" to "document.txt", unless it already starts with the date.

.INPUTS
String.  The path to the file or folder.

.OUTPUTS
None.  The script renames files in place.

.NOTES
Requires PowerShell v3.0 or later.
#>
param(
    [Parameter(Mandatory = $true,
        ValueFromPipeline = $true,
        ValueFromPipelineByPropertyName = $true,
        Position = 0)]
    [Alias("PSPath")]
    [string]$Path,

    [Parameter(Mandatory = $false)]
    [switch]$Remove
)

begin {
    # Get the current date in YYYY-MM-DD format
    $currentDate = Get-Date -Format "yyyy-MM-dd"
    
    # Function to rename a file
    function Rename-File {
        param(
            [Parameter(Mandatory = $true)]
            [System.IO.FileInfo]$File,
            [Parameter(Mandatory = $true)]
            [string]$NewDate
        )
        $ShouldRename = $false
        if ($Remove) {
            # Remove the date if present
            if ($file.Name -match "^(\d{4}-\d{2}-\d{2}-)(.+)") {
                $newFileName = $matches[2]  # Get the part after the date
                $ShouldRename = $true
            }
            else {
                Write-Verbose "Skipped '$($file.FullName)', does not start with a date."
            }
        }
        else {
            if ($File.Name -notmatch "^\d{4}-\d{2}-\d{2}-") {
                $newFileName = "$NewDate-$($File.Name)"
                $ShouldRename = $true           
            }
            else {
                Write-Host "Skipped '$($file.FullName)', already starts with date."
            }
        }
        

        if ($ShouldRename) {
            try {
                Rename-Item -Path $File.FullName -NewName $newFileName -Force
                Write-Host "Renamed '$($File.Name)' to '$newFileName'"
            }
            catch {
                Write-Host "Error renaming '$($File.FullName)': $($_.Exception.Message)"
            }
        }
    }
}


process {
    Write-Host "Processing folder '$Path'"
    # Check if the path is a file or a directory
    if (Test-Path -Path $Path -PathType 'Leaf') {
        # It's a file
        $file = Get-Item $Path
        # Check if the filename already starts with the date
        Rename-File -File $file -NewDate $currentDate
    }
    elseif (Test-Path -Path $Path -PathType 'Container') {
        # It's a directory
        $files = Get-ChildItem -Path $Path -File  # Get only files, not directories

        # Iterate through each file in the directory
        foreach ($file in $files) {
            # Check if the filename already starts with the date
            Rename-File -File $file -NewDate $currentDate 
        }
    }
    else {
        # Path is invalid
        Write-Host "Error: The specified path '$Path' is not a valid file or directory."
    }
}

end {
    # Optional:  Add any cleanup or summary here
}
