// Remove Loading Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        loading.style.opacity = '0';
        setTimeout(() => loading.style.display = 'none', 800);
    }, 1500); // Simulate initial loading
});

// Navigation Menu Toggle (Mobile)
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Animate hamburger
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(span => span.style.background = navLinks.classList.contains('active') ? 'var(--primary)' : 'var(--text-main)');
});

// Single Page Application Routing
const links = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.page-section');

links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Mobile close menu
        if (window.innerWidth <= 768) {
            navLinks.classList.remove('active');
        }

        // Update active link
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show right section
        const targetId = link.getAttribute('href').substring(1);

        sections.forEach(section => {
            if (section.id === targetId) {
                // Quick reset for animation trigger
                section.classList.remove('hidden-section');
                section.style.animation = 'none';
                section.offsetHeight; /* trigger reflow */
                section.style.animation = null;
            } else {
                section.classList.add('hidden-section');
            }
        });
    });
});

// Typing Effect for Headline
const phrases = ["AI World", "Creative Future", "Digital Canvas", "Smart Mind"];
let currentPhraseIndex = 0;
let isDeleting = false;
let charIndex = 0;
const typingTextElement = document.querySelector('.typing-text .gradient-text');

function typeEffect() {
    const currentPhrase = phrases[currentPhraseIndex];

    if (isDeleting) {
        typingTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 50 : 150;

    if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        typeSpeed = 500; // Pause before new word
    }

    setTimeout(typeEffect, typeSpeed);
}

// Start typing effect shortly after load
setTimeout(typeEffect, 2000);


// AI Chat Logic
const searchInput = document.getElementById('ai-search');
const searchBtn = document.getElementById('ai-search-btn');
const responseBox = document.getElementById('ai-response-box');
const userQueryText = document.getElementById('user-query-text');
const aiTypingIndicator = document.getElementById('ai-typing');
const aiAnswerContent = document.getElementById('ai-answer-content');

const aiCache = {};

// If you deploy the Python backend to the cloud (e.g. Render/Vercel), replace 'http://127.0.0.1:8000' with your new real Cloud URL like 'https://my-zona-ai.onrender.com'
const API_BASE = 'http://127.0.0.1:8000';

async function fetchAnswerFromSource(query) {
    if (aiCache[query]) return aiCache[query];

    try {
        const response = await fetch(API_BASE + '/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feature: 'chat', input: query })
        });
        const data = await response.json();

        if (data.error) {
            return `Error: ${data.error}`;
        }

        aiCache[query] = data.result;
        return data.result;
    } catch (error) {
        console.error("Error fetching data from backend:", error);
        return "I encountered a network error while trying to fetch the answer. Is your Python FastAPI backend server running on port 8000?";
    }
}

async function handleAISearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    responseBox.classList.remove('hidden');
    userQueryText.textContent = query;
    searchInput.value = '';

    aiAnswerContent.classList.add('hidden');
    aiTypingIndicator.classList.remove('hidden');

    // Handle basic greetings
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('zona')) {
        setTimeout(() => {
            aiTypingIndicator.classList.add('hidden');
            aiAnswerContent.classList.remove('hidden');
            aiAnswerContent.textContent = "Yes! I am ZonaAI. I am connected to live knowledge databases to assist you. Ask me anything!";
        }, 1000);
        return;
    } else if (lowerQuery === 'hello' || lowerQuery === 'hi' || lowerQuery.includes('مرحبا')) {
        setTimeout(() => {
            aiTypingIndicator.classList.add('hidden');
            aiAnswerContent.classList.remove('hidden');
            aiAnswerContent.textContent = "Hello there! Welcome to ZonaAI. I am ready to fetch reliable answers for you.";
        }, 1000);
        return;
    }

    // Fetch real answer from reliable source (Wikipedia/AI)
    const answer = await fetchAnswerFromSource(query);

    // Simulate thinking time lightly (min 1 second)
    setTimeout(async () => {
        aiTypingIndicator.classList.add('hidden');
        aiAnswerContent.classList.remove('hidden');

        // Use Streaming Typewriter Effect
        await streamMarkdown(aiAnswerContent, answer);

        // Save to chat memory
        localStorage.setItem('lastQuery', query);
        localStorage.setItem('lastAnswer', answer);
    }, 1000);
}

// Load Chat Memory on Start
window.addEventListener('DOMContentLoaded', () => {
    const cachedQuery = localStorage.getItem('lastQuery');
    const cachedAnswer = localStorage.getItem('lastAnswer');
    if (cachedQuery && cachedAnswer) {
        document.getElementById('ai-response-box').classList.remove('hidden');
        document.getElementById('user-query-text').textContent = cachedQuery;

        const answerContent = document.getElementById('ai-answer-content');
        answerContent.classList.remove('hidden');

        const isArabic = /[\u0600-\u06FF]/.test(cachedAnswer);
        answerContent.style.direction = isArabic ? 'rtl' : 'ltr';
        answerContent.style.textAlign = isArabic ? 'right' : 'left';

        answerContent.innerHTML = marked.parse(cachedAnswer);
        highlightAndAddCopyButtons(answerContent);
    }
});

// Streaming Markdown Effect
async function streamMarkdown(container, text) {
    container.innerHTML = '';

    // Simple RTL detection for Arabic
    const isArabic = /[\u0600-\u06FF]/.test(text);
    container.style.direction = isArabic ? 'rtl' : 'ltr';
    container.style.textAlign = isArabic ? 'right' : 'left';

    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        container.innerHTML = marked.parse(currentText);

        // Highlight logic on every few words or at the end to avoid flickering
        if (i % 5 === 0 || i === words.length - 1) {
            highlightAndAddCopyButtons(container);
        }

        // Scroll to the response to keep it in view
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        await new Promise(resolve => setTimeout(resolve, 30)); // 30ms per word
    }
}

// Helper function for highlighting and copy buttons
function highlightAndAddCopyButtons(container) {
    container.querySelectorAll('pre code').forEach((block) => {
        if (block.dataset.highlighted) return;

        hljs.highlightElement(block);
        block.dataset.highlighted = 'true';

        // Add Copy Button
        const pre = block.parentElement;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerText = 'Copy';

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(block.innerText).then(() => {
                copyBtn.innerText = 'Copied!';
                setTimeout(() => copyBtn.innerText = 'Copy', 2000);
            });
        });

        pre.appendChild(copyBtn);
    });
}

searchBtn.addEventListener('click', handleAISearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAISearch();
});


// Video Creation Logic
const videoUploadArea = document.getElementById('video-upload-area');
const videoFileInput = document.getElementById('video-image-input');
const videoPreviewArea = document.getElementById('video-preview-area');
const videoImgPreview = document.getElementById('video-img-preview');
const generateBtn = document.getElementById('generate-video-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const previewContainer = document.querySelector('.preview-container');
const videoResultArea = document.getElementById('video-result-area');
const resetVideoBtn = document.querySelector('.reset-video-btn');

// Handle drag and drop for video creation
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    videoUploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

videoUploadArea.addEventListener('dragover', () => videoUploadArea.classList.add('dragover'));
videoUploadArea.addEventListener('dragleave', () => videoUploadArea.classList.remove('dragover'));
videoUploadArea.addEventListener('drop', (e) => {
    videoUploadArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleVideoImage(e.dataTransfer.files[0]);
    }
});

videoUploadArea.addEventListener('click', () => videoFileInput.click());
videoFileInput.addEventListener('change', function () {
    if (this.files && this.files[0]) handleVideoImage(this.files[0]);
});

function handleVideoImage(file) {
    if (!file.type.match('image.*')) return alert('Please upload an image file.');

    const reader = new FileReader();
    reader.onload = (e) => {
        videoImgPreview.src = e.target.result;
        videoUploadArea.classList.add('hidden');
        videoPreviewArea.classList.remove('hidden');
    }
    reader.readAsDataURL(file);
}

generateBtn.addEventListener('click', async () => {
    generateBtn.disabled = true;
    btnText.textContent = 'Generating...';
    btnLoader.classList.remove('hidden');
    previewContainer.classList.add('scanning');

    try {
        const file = videoFileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(API_BASE + '/api/generate_video', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        previewContainer.classList.remove('scanning');
        videoPreviewArea.classList.add('hidden');
        videoResultArea.classList.remove('hidden');
        console.log("Video URL generated:", data.video_url);

    } catch (e) {
        console.error(e);
        alert("Wait for real integration to get video from backend.");
        previewContainer.classList.remove('scanning');
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = 'Generate Video Effect';
        btnLoader.classList.add('hidden');
    }
});

resetVideoBtn.addEventListener('click', () => {
    videoResultArea.classList.add('hidden');
    videoUploadArea.classList.remove('hidden');
    videoFileInput.value = '';
});


// Editing Logic
const editUploadArea = document.getElementById('edit-upload-area');
const editMediaInput = document.getElementById('edit-media-input');
const editMediaContainer = document.getElementById('edit-media-container');
const editImgPreview = document.getElementById('edit-img-preview');
const downloadEditBtn = document.getElementById('download-edit-btn');
const resetEditsBtn = document.getElementById('reset-edits-btn');

const brightnessCtrl = document.getElementById('brightness');
const contrastCtrl = document.getElementById('contrast');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'none';

editUploadArea.addEventListener('click', () => editMediaInput.click());
editMediaInput.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            editImgPreview.src = e.target.result;
            editUploadArea.classList.add('hidden');
            editMediaContainer.classList.remove('hidden');
            downloadEditBtn.disabled = false;
            applyEdits();
        }
        reader.readAsDataURL(file);
    }
});

function applyEdits() {
    let filterString = `brightness(${brightnessCtrl.value}%) contrast(${contrastCtrl.value}%)`;

    switch (currentFilter) {
        case 'cyberpunk':
            filterString += ' hue-rotate(90deg) saturate(200%)';
            break;
        case 'cinematic':
            filterString += ' sepia(30%) contrast(120%) saturate(80%)';
            break;
        case 'ethereal':
            filterString += ' blur(1px) brightness(120%) saturate(150%) hue-rotate(-20deg)';
            break;
    }

    editImgPreview.style.filter = filterString;
}

brightnessCtrl.addEventListener('input', applyEdits);
contrastCtrl.addEventListener('input', applyEdits);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyEdits();
    });
});

resetEditsBtn.addEventListener('click', () => {
    brightnessCtrl.value = 100;
    contrastCtrl.value = 100;
    currentFilter = 'none';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="none"]').classList.add('active');

    if (editImgPreview.src) applyEdits();
});


// Books & Quotes Logic
const motivationalQuotes = [
    "Thinking is difficult, that’s why most people judge. – C.G. Jung",
    "We suffer more often in imagination than in reality. – Seneca",
    "Knowing your own darkness is the best method for dealing with the darkness of others. – Carl Jung",
    "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven. – John Milton",
    "What you seek is seeking you. – Rumi",
    "He who has a why to live for can bear almost any how. – Friedrich Nietzsche",
    "The curious paradox is that when I accept myself just as I am, then I can change. – Carl Rogers",
    "Everything that irritates us about others can lead us to an understanding of ourselves. – Carl Jung"
];

async function updateQuoteTranslation(quoteText, lang) {
    const translatedEl = document.getElementById('quote-text-translated');
    if (!translatedEl) return;

    translatedEl.textContent = "جاري الترجمة... (Translating...)";
    try {
        const response = await fetch(API_BASE + '/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feature: 'translate_quote', input: quoteText, language: lang })
        });
        const data = await response.json();
        if (data.error) {
            translatedEl.textContent = "[Translation Error - Check Backend]";
        } else {
            translatedEl.textContent = data.result;
        }
    } catch (e) {
        translatedEl.textContent = "[Connection Error]";
    }
}

function setDailyQuote() {
    // Generate a consistent index based on the current date
    const today = new Date();
    const dateInteger = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = dateInteger % motivationalQuotes.length;

    const quoteStr = motivationalQuotes[index];
    document.getElementById('quote-text').textContent = quoteStr;

    const langSelect = document.getElementById('quote-lang');
    if (langSelect) {
        updateQuoteTranslation(quoteStr, langSelect.value);
        langSelect.addEventListener('change', () => {
            updateQuoteTranslation(quoteStr, langSelect.value);
        });
    }
}

const booksData = [
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        desc: "A groundbreaking tour of the mind and explains the two systems that drive the way we think."
    },
    {
        title: "The Body Keeps the Score",
        author: "Bessel van der Kolk",
        desc: "Brain, mind, and body in the healing of trauma and unlocking human potential."
    },
    {
        title: "Man's Search for Meaning",
        author: "Viktor E. Frankl",
        desc: "A psychiatrist's memoir of life in Nazi death camps and its lessons for spiritual survival."
    },
    {
        title: "Flow",
        author: "Mihaly Csikszentmihalyi",
        desc: "The psychology of optimal experience and how to achieve a state of deep focus and joy."
    },
    {
        title: "Influence",
        author: "Robert B. Cialdini",
        desc: "The psychology of persuasion, explaining the fundamental principles of why people say yes."
    },
    {
        title: "Atomic Habits",
        author: "James Clear",
        desc: "An easy & proven way to build good habits & break bad ones using behavioral psychology."
    }
];

function renderBooks() {
    const booksContainer = document.querySelector('.books-grid');
    booksContainer.innerHTML = '';

    booksData.forEach((book, index) => {
        const delay = index * 0.1;
        const bookHTML = `
            <div class="book-card glass-panel" style="animation: fadeInUp 0.6s ease ${delay}s backwards;">
                <h3 class="book-title">${book.title}</h3>
                <span class="book-author">By ${book.author}</span>
                <p class="book-desc">${book.desc}</p>
                <button class="read-btn" onclick="openBookSummaryModal('${book.title}', '${book.author}')">Read Summary</button>
            </div>
        `;
        booksContainer.innerHTML += bookHTML;
    });
}

function openBookSummaryModal(title, author) {
    const feature = 'book_summary';
    const modalTitle = `Summary: ${title}`;
    const modalDesc = `Get comprehensive insights and takeaways for ${title} by ${author}.`;

    openFeatureModal(feature, modalTitle, modalDesc);

    // Pre-fill the input with the book title and author to send to the backend
    document.getElementById('modal-input').value = `${title} by ${author}`;
}

// Initialize
setDailyQuote();
renderBooks();

// ==========================================
// Python Backend Modal Logic
// ==========================================
let currentPythonFeature = '';

function openFeatureModal(feature, title, desc) {
    currentPythonFeature = feature;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-input').value = '';

    // reset output
    const output = document.getElementById('modal-output');
    output.classList.add('hidden');
    output.textContent = '';

    // open
    document.getElementById('ai-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('ai-modal').classList.add('hidden');
}

async function runBackendFeature() {
    const input = document.getElementById('modal-input').value.trim();
    if (!input) {
        alert("Please enter some text first.");
        return;
    }

    const loader = document.getElementById('modal-loader');
    const output = document.getElementById('modal-output');
    const btnText = document.getElementById('modal-btn-text');

    loader.classList.remove('hidden');
    output.classList.add('hidden');
    btnText.textContent = "Processing...";

    try {
        const response = await fetch(API_BASE + '/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feature: currentPythonFeature, input: input })
        });

        const data = await response.json();

        output.classList.remove('hidden');
        if (data.error) {
            output.innerHTML = `<b>Error:</b> ${data.error}<br><br><small style="color:red">- Is your Python FastAPI server running? (تشغيل_السيرفر.bat)<br>- Did you add your Gemini API Key in backend.py?</small>`;
        } else {
            // Render Markdown for Modal Output with streaming
            await streamMarkdown(output, data.result);
        }
    } catch (e) {
        output.classList.remove('hidden');
        output.innerHTML = `<b>Connection Error:</b> Cannot connect to Backend.<br><br>Make sure you have:<br>1. Installed libraries: <code>pip install -r requirements.txt</code><br>2. Ran the server using: <code>تشغيل_السيرفر.bat</code> or <code>uvicorn backend:app --reload</code>`;
    } finally {
        loader.classList.add('hidden');
        btnText.textContent = "Generate with Python Backend ✨";
    }
}
