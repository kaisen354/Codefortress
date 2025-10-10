const vscode = require('vscode');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

class CodeforcesViewProvider {
    constructor(context) {
        this._context = context;
        this._view = undefined;
        this._ws = undefined;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'webview')]
        };

        webviewView.webview.html = this._getWebviewContent(webviewView.webview);

        // Connect to WebSocket
        this._connectWebSocket();

        // Handle view disposal
        webviewView.onDidDispose(() => {
            if (this._ws) {
                this._ws.close();
            }
        });
    }

    _connectWebSocket() {
        if (this._ws) {
            this._ws.close();
        }

        this._ws = new WebSocket('ws://localhost:8080');

        this._ws.on('open', () => {
            console.log('Connected to WebSocket server');
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'status',
                    text: 'Connected and listening...'
                });
            }
        });

        this._ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'problem' && data.payload && this._view) {
                    this._view.webview.postMessage({
                        command: 'problem',
                        html: data.payload
                    });
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });

        this._ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            vscode.window.showErrorMessage('WebSocket connection error. Make sure the server is running on port 8080.');
        });

        this._ws.on('close', () => {
            console.log('WebSocket closed');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (this._view) {
                    this._connectWebSocket();
                }
            }, 5000);
        });
    }

    _getWebviewContent(webview) {
        const webviewPath = path.join(this._context.extensionPath, 'webview');
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
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Register the webview view provider
    const provider = new CodeforcesViewProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'codeforcesProblemView',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Optional: Keep the command to manually focus the view
    context.subscriptions.push(
        vscode.commands.registerCommand('codeforces-problem-viewer.showProblem', () => {
            vscode.commands.executeCommand('codeforcesProblemView.focus');
        })
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};