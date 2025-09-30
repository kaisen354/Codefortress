// This script runs in the webview
(function () {
    const vscode = acquireVsCodeApi();
    const problemViewer = document.getElementById('problem-viewer');

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

            // --- FIX FOR DOUBLE MATHJAX RENDER ---
            // Find and remove any script tags in the received HTML that call MathJax.
            // This prevents the rogue script from running.
            tempDiv.querySelectorAll('script').forEach(script => {
                if (script.textContent.includes('MathJax.Hub.Queue(["Typeset",MathJax.Hub])')) {
                    script.remove();
                }
            });
            // --- END OF FIX ---

            const problem = {
                title: tempDiv.querySelector(".header .title")?.textContent?.trim() || "Untitled Problem",
                timeLimit: tempDiv.querySelector(".time-limit")?.textContent?.trim() || "N/A",
                memoryLimit: tempDiv.querySelector(".memory-limit")?.textContent?.trim() || "N/A",
                statementHTML: tempDiv.querySelector(".header + div")?.innerHTML || "<p>No statement found.</p>",
                inputSpecHTML: tempDiv.querySelector(".input-specification")?.innerHTML || "",
                outputSpecHTML: tempDiv.querySelector(".output-specification")?.innerHTML || "",
                notesHTML: tempDiv.querySelector(".note")?.innerHTML || "",
            };

            let samplesHTML = "<h3>Sample Tests</h3>";
            const sampleTestNodes = tempDiv.querySelectorAll('.sample-tests .sample-test');

            if (sampleTestNodes.length > 0) {
                samplesHTML += Array.from(sampleTestNodes).map((node, index) => {
                    const inputContent = node.querySelector('.input pre')?.outerHTML || '<pre>Not found</pre>';
                    const outputContent = node.querySelector('.output pre')?.outerHTML || '<pre>Not found</pre>';
                    const rawInputForCopy = node.querySelector('.input pre')?.innerText || '';

                    return `
                        <div class="sample-test-container">
                            <div class="sample-header">
                                <span class="sample-title">Input ${index + 1}</span>
                                <button class="copy-button" data-input="${escape(rawInputForCopy)}">Copy</button>
                            </div>
                            <div class="sample-content">${inputContent}</div>
                        </div>
                        <div class="sample-test-container">
                            <div class="sample-header">
                                 <span class="sample-title">Output ${index + 1}</span>
                            </div>
                            <div class="sample-content">${outputContent}</div>
                        </div>
                    `;
                }).join('');
            } else {
                 samplesHTML += tempDiv.querySelector(".sample-tests")?.innerHTML || "No samples found.";
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
            renderMath();

        } catch (error) {
            console.error("Failed to render problem:", error);
            problemViewer.innerHTML = `<p>Error rendering problem. Check the Webview Developer Tools console for details.</p><pre>${error.stack}</pre>`;
        }
    }

    function addCollapsibleListeners() {
        document.querySelectorAll('.collapsible .title').forEach(title => {
            title.addEventListener('click', () => {
                const collapsible = title.parentElement;
                collapsible.classList.toggle('open');
            });
        });
    }

    function addCopyButtonListeners() {
        document.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const textToCopy = unescape(event.currentTarget.dataset.input);
                navigator.clipboard.writeText(textToCopy).then(() => {
                    event.currentTarget.textContent = 'Copied!';
                    setTimeout(() => {
                        event.currentTarget.textContent = 'Copy';
                    }, 2000);
                });
            });
        });
    }
    
    function renderMath() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            console.log("Rendering MathJax...");
            window.MathJax.typesetPromise().catch(err => console.error("MathJax typesetting failed:", err));
        }
    }

    function createCollapsibleSection(title, htmlContent, defaultOpen = false) {
        if (!htmlContent) return "";
        return `
            <div class="collapsible ${defaultOpen ? 'open' : ''} mb-4 rounded-lg bg-white shadow-sm border border-gray-200">
                <div class="title" style="display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 1rem; text-align: left; font-size: 1.125rem; font-weight: 500; cursor: pointer;">
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