const toolDefinitions = {
    summarizer: {
        title: "AI Text Summarizer",
        icon: "📝",
        description: "Turn long paragraphs and articles into short, clear summaries.",
        label: "Text to summarize",
        placeholder: "Paste your article, notes or long paragraph here...",
        hint: "Paste the content you want to summarize.",
        instructions: "Enter a passage with several sentences to extract its most important points."
    },
    mcq: {
        title: "MCQ Generator",
        icon: "❓",
        description: "Prepare multiple-choice questions from your study material.",
        label: "Study material",
        placeholder: "Paste your chapter, notes or study material here...",
        hint: "Add study material containing useful facts.",
        instructions: "The generator creates practice questions by hiding important words from your material."
    },
    notes: {
        title: "AI Notes Generator",
        icon: "📚",
        description: "Organize study material into simple and structured notes.",
        label: "Study material or topic",
        placeholder: "Enter a topic or paste your study material here...",
        hint: "Enter the topic or content for your notes.",
        instructions: "Your material will be organized into headings, key points and a conclusion."
    },
    resume: {
        title: "Resume Builder",
        icon: "📄",
        description: "Create a clean and professional resume draft.",
        label: "Your information",
        placeholder: "Name: Your Name\nEmail: your@email.com\nEducation: Your degree\nSkills: Your skills\nProjects: Your projects\nExperience: Your experience...",
        hint: "Include your education, skills and project details.",
        instructions: "Enter your details using labels such as Name, Education, Skills, Projects and Experience."
    },
    rewriter: {
        title: "Paragraph Rewriter",
        icon: "✍️",
        description: "Improve paragraph clarity, formatting and wording.",
        label: "Paragraph to improve",
        placeholder: "Paste the paragraph you want to improve...",
        hint: "Enter the paragraph you want to improve.",
        instructions: "This free version applies basic wording and formatting improvements while preserving the original meaning."
    },
    flashcards: {
        title: "Flashcard Generator",
        icon: "🗂️",
        description: "Turn your study material into question-and-answer flashcards.",
        label: "Study material",
        placeholder: "Paste your notes or enter a topic for flashcards...",
        hint: "Enter content you want to revise.",
        instructions: "The generator turns definitions and important statements into question-and-answer cards."
    }
};

const params = new URLSearchParams(window.location.search);
const selectedTool = params.get("tool") || "summarizer";
const tool = toolDefinitions[selectedTool];

const input = document.getElementById("toolInput");
const generateButton = document.getElementById("generateButton");
const output = document.getElementById("toolOutput");
const copyButton = document.getElementById("copyButton");
const characterCount = document.getElementById("characterCount");
const stageNotice = document.getElementById("stageNotice");

let latestResult = "";

const stopWords = new Set((
    "the a an and or but if then is are was were be been being to of in on at " +
    "for from with by as this that these those it its into about than also " +
    "can could should would will may might has have had do does did not no " +
    "we they he she you your our their them his her which who what when where " +
    "why how such very more most some any all each other many much"
).split(/\s+/));

function getSentences(text) {
    return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function getWords(text) {
    return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function getKeywords(text) {
    const frequency = {};

    getWords(text).forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    return frequency;
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 1. TEXT SUMMARIZER
function summarizeText(text) {
    const sentences = getSentences(text);

    if (sentences.length < 2) {
        throw new Error("Please enter at least two complete sentences.");
    }

    const frequencies = getKeywords(text);

    const scored = sentences.map((sentence, index) => {
        const words = getWords(sentence);
        let score = 0;

        words.forEach(word => {
            score += frequencies[word] || 0;
        });

        score = score / Math.max(words.length, 1);

        if (index === 0) score *= 1.15;

        return { sentence, index, score };
    });

    const count = Math.max(1, Math.ceil(sentences.length * 0.35));

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence)
        .join(" ");
}

// 2. MCQ GENERATOR
function generateMCQs(text) {
    const sentences = getSentences(text)
        .filter(sentence => getWords(sentence).length >= 7);

    if (sentences.length === 0) {
        throw new Error("Please enter longer study material with complete sentences.");
    }

    const allCandidates = [...new Set(
        getWords(text).filter(word =>
            word.length > 4 && !stopWords.has(word)
        )
    )];

    const questions = [];

    for (const sentence of sentences) {
        if (questions.length >= 10) break;

        const candidates = [...new Set(
            getWords(sentence).filter(word =>
                word.length > 4 && !stopWords.has(word)
            )
        )];

        if (candidates.length === 0) continue;

        const answer = candidates.sort((a, b) => b.length - a.length)[0];

        const distractors = allCandidates
            .filter(word => word !== answer && !candidates.includes(word))
            .slice(0, 3);

        const choices = [answer, ...distractors].slice(0, 4);

        // A question needs at least two choices to be useful.
        if (choices.length < 2) continue;

        const shuffled = [...choices].sort((a, b) =>
            (a.length % 3) - (b.length % 3)
        );

        const blankSentence = sentence.replace(
            new RegExp("\\b" + escapeRegExp(answer) + "\\b", "i"),
            "________"
        );

        const labels = ["A", "B", "C", "D"];

        let result = `${questions.length + 1}. ${blankSentence}\n`;

        shuffled.forEach((choice, index) => {
            result += `   ${labels[index]}. ${choice}\n`;
        });

        result += `   Correct answer: ${labels[shuffled.indexOf(answer)]}. ${answer}\n`;

        questions.push(result);
    }

    if (questions.length === 0) {
        throw new Error("Not enough suitable keywords were found. Please enter more detailed material.");
    }

    return "PRACTICE MULTIPLE-CHOICE QUESTIONS\n\n" +
        questions.join("\n") +
        "\nNote: These questions are generated automatically from your text. Please verify the answers.";
}

// 3. NOTES GENERATOR
function generateNotes(text) {
    const sentences = getSentences(text);

    if (sentences.length === 0) {
        throw new Error("Please enter some study material.");
    }

    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);

    const title = paragraphs[0].length <= 90
        ? paragraphs[0].replace(/[.!?]$/, "")
        : "Study Notes";

    const points = sentences.map(sentence =>
        sentence.replace(/\s+/g, " ")
    );

    const keyPoints = points.slice(0, Math.min(5, points.length));
    const remaining = points.slice(5);

    let result = `STUDY NOTES: ${title.toUpperCase()}\n\n`;
    result += "1. KEY POINTS\n\n";

    keyPoints.forEach(point => {
        result += `• ${point}\n`;
    });

    if (remaining.length > 0) {
        result += "\n2. ADDITIONAL INFORMATION\n\n";

        remaining.forEach(point => {
            result += `• ${point}\n`;
        });
    }

    result += "\n3. CONCLUSION\n\n";
    result += points[points.length - 1];

    return result;
}

// 4. RESUME BUILDER
function buildResume(text) {
    const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);

    if (lines.length < 2) {
        throw new Error("Please enter more details, such as your education, skills and projects.");
    }

    const knownSections = {
        name: "NAME",
        email: "EMAIL",
        phone: "PHONE",
        contact: "CONTACT",
        location: "LOCATION",
        education: "EDUCATION",
        qualification: "EDUCATION",
        skills: "TECHNICAL SKILLS",
        technicalskills: "TECHNICAL SKILLS",
        projects: "PROJECTS",
        project: "PROJECTS",
        experience: "EXPERIENCE",
        internship: "INTERNSHIPS",
        internships: "INTERNSHIPS",
        certifications: "CERTIFICATIONS",
        achievements: "ACHIEVEMENTS",
        objective: "CAREER OBJECTIVE",
        summary: "PROFILE SUMMARY",
        languages: "LANGUAGES"
    };

    const sections = {};
    let currentSection = "PROFILE DETAILS";

    lines.forEach(line => {
        const match = line.match(/^([a-zA-Z ]+)\s*:\s*(.*)$/);

        if (match) {
            const key = match[1].toLowerCase().replace(/\s+/g, "");
            currentSection = knownSections[key] || match[1].toUpperCase();
            if (!sections[currentSection]) sections[currentSection] = [];
            if (match[2]) sections[currentSection].push(match[2]);
        } else {
            if (!sections[currentSection]) sections[currentSection] = [];
            sections[currentSection].push(line);
        }
    });

    let result = "PROFESSIONAL RESUME DRAFT\n";
    result += "================================\n\n";

    Object.entries(sections).forEach(([heading, values]) => {
        if (values.length === 0) return;

        result += `${heading}\n`;
        result += "-".repeat(Math.min(heading.length, 35)) + "\n";

        values.forEach(value => {
            result += `${value}\n`;
        });

        result += "\n";
    });

    result += "================================\n";
    result += "Review all details, dates and contact information before submitting.";

    return result;
}

// 5. PARAGRAPH REWRITER
function rewriteParagraph(text) {
    let result = text.trim().replace(/\s+/g, " ");

    const replacements = [
        [/\bin order to\b/gi, "to"],
        [/\bdue to the fact that\b/gi, "because"],
        [/\bat this point in time\b/gi, "currently"],
        [/\ba lot of\b/gi, "many"],
        [/\butilize\b/gi, "use"],
        [/\bbasically\b/gi, ""],
        [/\bactually\b/gi, ""],
        [/\bvery unique\b/gi, "unique"],
        [/\bdont\b/gi, "don't"],
        [/\bcant\b/gi, "can't"],
        [/\bwont\b/gi, "won't"],
        [/\bdoesnt\b/gi, "doesn't"],
        [/\bisnt\b/gi, "isn't"],
        [/\barent\b/gi, "aren't"]
    ];

    replacements.forEach(([pattern, replacement]) => {
        result = result.replace(pattern, replacement);
    });

    result = result
        .replace(/\s+([,.!?;:])/g, "$1")
        .replace(/([,.!?])(?=[A-Za-z])/g, "$1 ")
        .replace(/\s{2,}/g, " ")
        .trim();

    result = result.charAt(0).toUpperCase() + result.slice(1);

    if (result && !/[.!?]$/.test(result)) {
        result += ".";
    }

    return result +
        "\n\nNote: This version uses basic rule-based editing, not an advanced AI grammar model.";
}

// 6. FLASHCARD GENERATOR
function generateFlashcards(text) {
    const sentences = getSentences(text);
    const cards = [];

    for (const sentence of sentences) {
        if (getWords(sentence).length < 5) continue;

        // Look for simple definition-style statements.
        const definition = sentence.match(
            /^(.{2,60}?)\s+(?:is|are|means|refers to)\s+(.+)$/i
        );

        if (definition) {
            cards.push({
                question: `What is ${definition[1].trim()}?`,
                answer: sentence
            });
        } else {
            const candidates = getWords(sentence).filter(word =>
                word.length > 4 && !stopWords.has(word)
            );

            if (candidates.length === 0) continue;

            const answer = candidates.sort((a, b) => b.length - a.length)[0];

            const question = sentence.replace(
                new RegExp("\\b" + escapeRegExp(answer) + "\\b", "i"),
                "________"
            );

            cards.push({
                question: `Complete the statement: ${question}`,
                answer: answer
            });
        }

        if (cards.length >= 15) break;
    }

    if (cards.length === 0) {
        throw new Error("Please enter longer study material containing definitions or complete sentences.");
    }

    return "FLASHCARDS FOR REVISION\n\n" +
        cards.map((card, index) =>
            `CARD ${index + 1}\nQ: ${card.question}\nA: ${card.answer}\n`
        ).join("\n") +
        "\nReview the original material to verify each answer.";
}

// PROCESS SELECTED TOOL
function processTool(text) {
    switch (selectedTool) {
        case "summarizer":
            return summarizeText(text);
        case "mcq":
            return generateMCQs(text);
        case "notes":
            return generateNotes(text);
        case "resume":
            return buildResume(text);
        case "rewriter":
            return rewriteParagraph(text);
        case "flashcards":
            return generateFlashcards(text);
        default:
            throw new Error("This tool is not available.");
    }
}

// PAGE INITIALIZATION
if (!tool) {
    document.title = "Tool Not Found | AI Tools Hub";
    document.getElementById("toolTitle").textContent = "Tool not found";
    document.getElementById("toolDescription").textContent =
        "Please return to the tool directory and select a valid tool.";

    if (input) input.disabled = true;
    if (generateButton) generateButton.disabled = true;
} else {
    document.title = `${tool.title} | AI Tools Hub`;
    document.getElementById("toolIcon").textContent = tool.icon;
    document.getElementById("toolTitle").textContent = tool.title;
    document.getElementById("toolDescription").textContent = tool.description;
    document.getElementById("inputLabel").textContent = tool.label;
    input.placeholder = tool.placeholder;
    document.getElementById("inputHint").textContent = tool.hint;
    document.getElementById("toolInstructions").textContent = tool.instructions;
}

if (input && generateButton && tool) {
    input.addEventListener("input", () => {
        characterCount.textContent = `${input.value.length} characters`;
        generateButton.disabled = input.value.trim().length === 0;
    });

    generateButton.disabled = true;

    generateButton.addEventListener("click", () => {
        const text = input.value.trim();

        if (!text) {
            alert("Please enter some content first.");
            return;
        }

        try {
            generateButton.disabled = true;
            generateButton.textContent = "Processing...";

            const result = processTool(text);

            latestResult = result;

            const resultText = document.createElement("pre");
            resultText.className = "generated-result";
            resultText.textContent = result;

            output.replaceChildren(resultText);
            copyButton.disabled = false;

            stageNotice.textContent =
                "Result generated successfully in your browser. Review it before using.";

        } catch (error) {
            output.textContent = error.message;
            latestResult = "";
            copyButton.disabled = true;
            stageNotice.textContent = "Please check your input and try again.";
        } finally {
            generateButton.disabled = input.value.trim().length === 0;
            generateButton.innerHTML = 'Generate <span>→</span>';
        }
    });
}

// COPY RESULT
if (copyButton) {
    copyButton.disabled = true;

    copyButton.addEventListener("click", async () => {
        if (!latestResult) return;

        try {
            await navigator.clipboard.writeText(latestResult);
            copyButton.textContent = "Copied!";
        } catch {
            const temp = document.createElement("textarea");
            temp.value = latestResult;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand("copy");
            temp.remove();
            copyButton.textContent = "Copied!";
        }

        setTimeout(() => {
            copyButton.textContent = "Copy";
        }, 1500);
    });
}

// DOWNLOAD RESULT
if (copyButton && copyButton.parentElement) {
    const downloadButton = document.createElement("button");
    downloadButton.className = "copy-button";
    downloadButton.textContent = "Download .txt";
    downloadButton.type = "button";
    downloadButton.disabled = true;

    copyButton.parentElement.appendChild(downloadButton);

    downloadButton.addEventListener("click", () => {
        if (!latestResult) return;

        const blob = new Blob([latestResult], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `${selectedTool}-result.txt`;
        link.click();

        URL.revokeObjectURL(url);
    });

    const originalGenerate = generateButton;

    if (originalGenerate) {
        originalGenerate.addEventListener("click", () => {
            setTimeout(() => {
                downloadButton.disabled = !latestResult;
            }, 0);
        });
    }
}

// ==========================================
// STAGE 4 - QUALITY AND USABILITY IMPROVEMENTS
// ==========================================

if (input && tool) {
    input.maxLength = 20000;

    const clearButton = document.getElementById("clearButton");

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            input.value = "";
            input.dispatchEvent(new Event("input"));

            latestResult = "";

            output.innerHTML = `
                <div class="empty-output-icon">✧</div>
                <h3>Your result will appear here</h3>
                <p>Enter your content in the input area to get started.</p>
            `;

            copyButton.disabled = true;

            const download = document.querySelector(".output-heading .copy-button:last-child");
            if (download && download.textContent.includes("Download")) {
                download.disabled = true;
            }

            stageNotice.textContent = "Input and output cleared.";
            input.focus();
        });
    }

    // Keyboard shortcut: Ctrl + Enter
    input.addEventListener("keydown", event => {
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();

            if (generateButton && !generateButton.disabled) {
                generateButton.click();
            }
        }
    });
}
