// This script runs in the webview
(function () {
    const vscode = acquireVsCodeApi();
    const problemViewer = document.getElementById('problem-viewer');
    const themeToggle = document.getElementById('theme-toggle');

    // Handle theme toggling
    themeToggle.addEventListener('click', () => {
        const html = document.documentElement;
        html.classList.toggle('dark');
        themeToggle.textContent = html.classList.contains('dark') ? '🌞' : '🌙';
    });

    // Listen for messages from the extension
    window.addEventListener('message', event => {
        console.log('--- Webview received a message from the extension! ---', event.data);
        const message = event.data;
        if (message.command === 'problem') {
            renderProblem(message.html);
        }
    });

    /**
     * Parses the problem HTML and injects it into the DOM.
     * @param {string} htmlContent The raw HTML of the .problem-statement div.
     */
    function renderProblem(htmlContent) {
        if (!htmlContent) {
            problemViewer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500 p-8">Waiting for problem HTML...</div>`;
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // Helper function to fix LaTeX expressions for MathJax
        const fixLatex = (content) => {
            if (!content) return "";
            return content
                .replace(/\(\)/g, "$(t)$")
                .replace(/\(\)/g, "$(n)$")
                .replace(/\(\)/g, "$(k_i)$")
                .replace(/\(\)/g, "$(a_{i_j})$");
        };

        const processHTML = (html) => {
            if (!html) return "";
            const div = document.createElement("div");
            div.innerHTML = html;
            div.innerHTML = fixLatex(div.innerHTML);
            return div.innerHTML;
        };

        const problem = {
            title: doc.querySelector(".header .title")?.textContent?.trim() || "",
            timeLimit: doc.querySelector(".time-limit")?.textContent?.trim() || "",
            memoryLimit: doc.querySelector(".memory-limit")?.textContent?.trim() || "",
            statementHTML: processHTML(doc.querySelector(".header + div")?.innerHTML || ""),
            inputSpecHTML: processHTML(doc.querySelector(".input-specification")?.innerHTML || ""),
            outputSpecHTML: processHTML(doc.querySelector(".output-specification")?.innerHTML || ""),
            samplesHTML: processHTML(doc.querySelector(".sample-tests")?.innerHTML || ""),
            notesHTML: processHTML(doc.querySelector(".note")?.innerHTML || ""),
        };

        problemViewer.innerHTML = `
            <div class="text-center mb-8">
                <h1 class="text-3xl md:text-4xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">${problem.title}</h1>
                <div class="flex justify-center flex-wrap gap-4 text-sm">
                    <span class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">${problem.timeLimit}</span>
                    <span class="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">${problem.memoryLimit}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div class="lg:col-span-3">
                    ${createCollapsibleSection("Problem Statement", problem.statementHTML, true)}
                    ${createCollapsibleSection("Input Specification", problem.inputSpecHTML)}
                    ${createCollapsibleSection("Output Specification", problem.outputSpecHTML)}
                    ${createCollapsibleSection("Note", problem.notesHTML)}
                </div>
                <div class="lg:col-span-2 prose dark:prose-invert max-w-none">${problem.samplesHTML}</div>
            </div>
        `;

        // Add event listeners for new collapsible sections
        document.querySelectorAll('.collapsible .title').forEach(title => {
            title.addEventListener('click', () => {
                const collapsible = title.parentElement;
                collapsible.classList.toggle('open');
            });
        });

        // Retrigger MathJax to render the new content
        if (window.MathJax && window.MathJax.typeset) {
            window.MathJax.typeset();
        }
    }

    /**
     * Helper to generate HTML for a collapsible section.
     */
    function createCollapsibleSection(title, htmlContent, defaultOpen = false) {
        if (!htmlContent) return "";
        return `
            <div class="collapsible ${defaultOpen ? 'open' : ''} mb-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
                <div class="title" style="display: flex; width: 100%; justify-content: space-between; padding: 1rem; text-align: left; font-size: 1.125rem; font-weight: 500; color: var(--color-cyan-800); cursor: pointer;">
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
}());