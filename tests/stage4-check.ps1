$ErrorActionPreference = "Stop"

Write-Host "`nAI TOOLS HUB - AUTOMATED QUALITY TESTS" -ForegroundColor Cyan
Write-Host "========================================"

$checks = @()

function Check-File($path) {
    $passed = Test-Path $path
    $script:checks += [PSCustomObject]@{
        Test = "File exists: $path"
        Result = if ($passed) { "PASS" } else { "FAIL" }
    }
}

function Check-Content($path, $pattern, $description) {
    $content = Get-Content $path -Raw
    $passed = $content -match $pattern

    $script:checks += [PSCustomObject]@{
        Test = $description
        Result = if ($passed) { "PASS" } else { "FAIL" }
    }
}

Check-File "index.html"
Check-File "tools.html"
Check-File "tool.html"
Check-File "about.html"
Check-File "contact.html"
Check-File "privacy.html"
Check-File "css/style.css"
Check-File "js/script.js"
Check-File "js/tool.js"

Check-Content "js/tool.js" "summarizeText" "Text summarizer logic"
Check-Content "js/tool.js" "generateMCQs" "MCQ generator logic"
Check-Content "js/tool.js" "generateNotes" "Notes generator logic"
Check-Content "js/tool.js" "buildResume" "Resume builder logic"
Check-Content "js/tool.js" "rewriteParagraph" "Paragraph rewriter logic"
Check-Content "js/tool.js" "generateFlashcards" "Flashcard generator logic"
Check-Content "js/tool.js" "navigator.clipboard" "Copy functionality"
Check-Content "js/tool.js" "createObjectURL" "Download functionality"
Check-Content "js/tool.js" "clearButton" "Clear input functionality"

$ids = @("summarizer", "mcq", "notes", "resume", "rewriter", "flashcards")

foreach ($id in $ids) {
    $found = (Get-Content "js/tool.js" -Raw) -match [regex]::Escape("${id}:")
    $checks += [PSCustomObject]@{
        Test = "Tool configuration: $id"
        Result = if ($found) { "PASS" } else { "FAIL" }
    }
}

$checks | Format-Table -AutoSize

$passedCount = @($checks | Where-Object Result -eq "PASS").Count
$failedCount = @($checks | Where-Object Result -eq "FAIL").Count

Write-Host "`nPassed: $passedCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Green" })

$checks | Export-Csv "tests\stage4-report.csv" -NoTypeInformation

if ($failedCount -gt 0) {
    Write-Host "`nSome checks failed. Please review the report." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll automated checks passed!" -ForegroundColor Green
Write-Host "Report saved to tests\stage4-report.csv"

