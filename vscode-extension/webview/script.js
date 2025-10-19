// This script runs in the webview
(function () {
    const vscode = acquireVsCodeApi();
    const problemViewer = document.getElementById('problem-viewer');

    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        createThemeToggle(savedTheme);
    }

    function createThemeToggle(currentTheme) {
        // Check if button already exists to prevent duplicates
        if (document.querySelector('.theme-toggle')) {
            return;
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        toggleBtn.onclick = toggleTheme;
        document.body.appendChild(toggleBtn);
    }

    function toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        const btn = document.querySelector('.theme-toggle');
        btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';

        // Add ripple effect
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            btn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }, 150);
    }

    window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'problem' && message.html) {
            renderProblem(message.html);
        }
    });

    /**
     * Parses and renders the problem HTML.
     * @param {string} htmlContent The raw HTML of the problem.
     */
    function renderProblem(htmlContent) {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Remove all elements with MJX_Assistive_MathML class
            tempDiv.querySelectorAll('.MJX_Assistive_MathML').forEach(el => el.remove());

            // Fix image URLs - Convert relative URLs to absolute Codeforces URLs
            fixImageUrls(tempDiv);

            const problem = {
                title: tempDiv.querySelector(".header .title")?.textContent?.trim() || "Untitled Problem",
                timeLimit: tempDiv.querySelector(".time-limit")?.textContent?.trim() || "N/A",
                memoryLimit: tempDiv.querySelector(".memory-limit")?.textContent?.trim() || "N/A",
                statementHTML: tempDiv.querySelector(".header + div")?.innerHTML || "<p>No statement found.</p>",
                inputSpecHTML: tempDiv.querySelector(".input-specification")?.innerHTML || "",
                outputSpecHTML: tempDiv.querySelector(".output-specification")?.innerHTML || "",
                notesHTML: tempDiv.querySelector(".note")?.innerHTML || "",
            };

            // LeetCode-style Sample Rendering - Plain text format
            let samplesHTML = "<h3 style='margin-bottom: 1.5rem; color: var(--text-primary);'>Examples</h3>";
            const sampleTestNodes = tempDiv.querySelectorAll('.sample-tests .sample-test');

            if (sampleTestNodes.length > 0) {
                samplesHTML += Array.from(sampleTestNodes).map((node, index) => {
                    const rawInputForCopy = node.querySelector('.input pre')?.innerText || '';
                    const rawOutputForCopy = node.querySelector('.output pre')?.innerText || '';
                    const inputContent = node.querySelector('.input pre')?.innerHTML || 'Not found';
                    const outputContent = node.querySelector('.output pre')?.innerHTML || 'Not found';

                    return `
                        <div class="leetcode-example">
                            <div class="example-header">Example ${index + 1}:</div>
                            <div class="example-section">
                                <div class="example-label-wrapper">
                                    <strong class="example-label">Input:</strong>
                                    <button class="copy-button-leetcode" data-content="${encodeURIComponent(rawInputForCopy)}" title="Copy Input">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="example-content"><pre>${inputContent}</pre></div>
                            </div>
                            <div class="example-section">
                                <div class="example-label-wrapper">
                                    <strong class="example-label">Output:</strong>
                                    <button class="copy-button-leetcode" data-content="${encodeURIComponent(rawOutputForCopy)}" title="Copy Output">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div class="example-content"><pre>${outputContent}</pre></div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                samplesHTML += tempDiv.querySelector(".sample-tests")?.innerHTML || "No examples found.";
            }

            problemViewer.innerHTML = `
                <div class="text-center mb-8">
                    <h1 class="text-3xl md:text-4xl font-bold mb-4 text-cyan-600">${problem.title}</h1>
                    <div class="flex justify-center flex-wrap gap-4 text-sm">
                        <span class="bg-gray-200 px-3 py-1 rounded-full">${problem.timeLimit}</span>
                        <span class="bg-gray-200 px-3 py-1 rounded-full">${problem.memoryLimit}</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div class="lg:col-span-3">
                        ${createCollapsibleSection("Problem Statement", problem.statementHTML, true)}
                        ${createCollapsibleSection("Input Specification", problem.inputSpecHTML)}
                        ${createCollapsibleSection("Output Specification", problem.outputSpecHTML)}
                        ${createCollapsibleSection("Note", problem.notesHTML)}
                    </div>
                    <div class="lg:col-span-2">${samplesHTML}</div>
                </div>
            `;

            addCollapsibleListeners();
            addCopyButtonListeners();
            addImageErrorHandling();
            renderMath();
        } catch (error) {
            console.error("Failed to render problem:", error);
            problemViewer.innerHTML = `<p>Error rendering problem. Check the Webview Developer Tools console for details.</p><pre>${error.stack}</pre>`;
        }
    }

    /**
     * Fixes image URLs to use absolute paths from Codeforces
     * @param {HTMLElement} element 
     */
    function fixImageUrls(element) {
        const images = element.querySelectorAll('img');
        images.forEach(img => {
            let src = img.getAttribute('src');
            if (src) {
                // If the URL is relative, make it absolute
                if (src.startsWith('//')) {
                    img.setAttribute('src', 'https:' + src);
                } else if (src.startsWith('/')) {
                    img.setAttribute('src', 'https://codeforces.com' + src);
                } else if (!src.startsWith('http')) {
                    img.setAttribute('src', 'https://codeforces.com/' + src);
                }

                // Add loading and error handling attributes
                img.setAttribute('loading', 'lazy');
                img.setAttribute('alt', 'Problem image');
                img.classList.add('problem-image');
            }
        });
    }

    /**
     * Add error handling for images that fail to load
     */
    function addImageErrorHandling() {
        const images = problemViewer.querySelectorAll('img');
        images.forEach(img => {
            // Remove old error listener if exists
            img.removeEventListener('error', handleImageError);
            // Add new error listener
            img.addEventListener('error', handleImageError);
        });
    }

    function handleImageError(event) {
        const img = event.target;
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            background: var(--bg-tertiary);
            border: 2px dashed var(--border-color);
            padding: 20px;
            text-align: center;
            color: var(--text-secondary);
            border-radius: 8px;
            margin: 10px auto;
            max-width: 100%;
            transition: all 0.3s ease;
        `;
        placeholder.innerHTML = `
            <p>⚠️ Image failed to load</p>
            <p style="font-size: 12px; margin-top: 8px;">
                <a href="${img.src}" target="_blank" style="color: var(--color-cyan-600); text-decoration: underline;">
                    View image in browser
                </a>
            </p>
        `;
        img.parentNode.replaceChild(placeholder, img);
    }

    function addCollapsibleListeners() {
        problemViewer.querySelectorAll('.collapsible .title').forEach(title => {
            const newTitle = title.cloneNode(true);
            title.parentNode.replaceChild(newTitle, title);

            newTitle.addEventListener('click', () => {
                const collapsible = newTitle.parentElement;
                const wasOpen = collapsible.classList.contains('open');

                collapsible.classList.toggle('open');

                newTitle.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    newTitle.style.transform = '';
                }, 100);

                const content = collapsible.querySelector('.content');
                if (!wasOpen) {
                    content.style.animation = 'slideDown 0.3s ease-out';
                }
            });
        });
    }

    function addCopyButtonListeners() {
        problemViewer.querySelectorAll('.copy-button-leetcode').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener('click', (event) => {
                const textToCopy = decodeURIComponent(event.currentTarget.dataset.content);
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const btn = event.currentTarget;
                    const originalHTML = btn.innerHTML;

                    btn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    btn.classList.add('copied');

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
            });
        });
    }

    function renderMath() {
        if (!window.MathJax || !window.MathJax.typesetPromise) {
            console.log("MathJax not available");
            return;
        }

        const container = document.getElementById('problem-viewer');
        if (!container) return;

        try {
            console.log("Rendering MathJax...");

            if (window.MathJax.typesetClear) {
                window.MathJax.typesetClear([container]);
            }

            window.MathJax.typesetPromise([container])
                .then(() => console.log("MathJax render complete"))
                .catch(err => console.error("MathJax render failed:", err));
        } catch (err) {
            console.error("Error during MathJax rendering:", err);
        }
    }

    function createCollapsibleSection(title, htmlContent, defaultOpen = false) {
        if (!htmlContent) return "";
        return `
            <div class="collapsible ${defaultOpen ? 'open' : ''} mb-4 rounded-lg shadow-sm border">
                <div class="title" style="display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 1rem; text-align: left; font-size: 1.125rem; font-weight: 500; cursor: pointer; background: var(--bg-secondary); border-radius: 8px;">
                    <span>${title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 1.5rem; height: 1.5rem;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                <div class="content" style="padding: 1rem; padding-top: 0;">
                    ${htmlContent}
                </div>
            </div>
        `;
    }

    // Add CSS animations and styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .copy-button-leetcode {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            display: inline-flex;
            align-items: center;
            color: var(--text-secondary);
            transition: all 0.2s ease;
            opacity: 0.7;
        }
        
        .copy-button-leetcode:hover {
            opacity: 1;
            color: var(--color-cyan-600);
        }
        
        .copy-button-leetcode.copied {
            color: #22c55e;
        }
        
        .theme-toggle {
            transition: transform 0.2s ease !important;
        }
        
        .problem-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
        }
        
        .problem-image:hover {
            transform: scale(1.05);
        }
        
        /* LeetCode-style example sections */
        .leetcode-example {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .example-header {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 0.75rem;
            color: var(--text-primary);
        }
        
        .example-section {
            margin-bottom: 0.75rem;
        }
        
        .example-section:last-child {
            margin-bottom: 0;
        }
        
        .example-label-wrapper {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        
        .example-label {
            color: var(--text-primary);
            font-size: 0.875rem;
        }
        
        .example-content {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 0.75rem;
        }
        
        .example-content pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            color: var(--text-primary);
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    `;
    document.head.appendChild(style);

    // Initialize theme on load
    initTheme();
}());
