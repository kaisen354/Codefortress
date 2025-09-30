const vscode = require('vscode');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let panel = undefined;

    context.subscriptions.push(vscode.commands.registerCommand('codeforces-problem-viewer.showProblem', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
        } else {
            panel = vscode.window.createWebviewPanel(
                'codeforcesProblem',
                'Codeforces Problem',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    // IMPORTANT: We need localResourceRoots for the local MathJax library
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview')]
                }
            );

            panel.webview.html = getWebviewContent(context, panel.webview);

            const ws = new WebSocket('ws://localhost:8080');

            ws.on('open', () => {
                console.log('Connected to WebSocket server');
                panel.webview.postMessage({ command: 'status', text: 'Connected and listening...' });
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'problem' && data.payload) {
                        panel.webview.postMessage({
                            command: 'problem',
                            html: data.payload
                        });
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            });

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                vscode.window.showErrorMessage('WebSocket connection error. Make sure the server is running on port 8080.');
            };

            panel.onDidDispose(() => {
                panel = undefined;
                ws.close();
            }, null, context.subscriptions);
        }
    }));
}

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Webview} webview
 */
function getWebviewContent(context, webview) {
    const webviewPath = path.join(context.extensionPath, 'webview');
    const htmlPath = path.join(webviewPath, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Create URIs for local resources
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'style.css')));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'script.js')));
    const mathjaxUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'lib', 'mathjax', 'tex-mml-chtml.js')));

    // Get the special CSP source from the webview API
    const cspSource = webview.cspSource;

    // Replace placeholders in the HTML with the correct URIs and CSP source
    html = html.replace(/{{CSP_SOURCE}}/g, cspSource);
    html = html.replace('{{STYLE_URI}}', styleUri);
    html = html.replace('{{SCRIPT_URI}}', scriptUri);
    html = html.replace('{{MATHJAX_URI}}', mathjaxUri);

    return html;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};