const vscode = require('vscode');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

/**
 * This is the main activation function for your extension.
 * It's called when your extension is activated (e.g., when the command is run).
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let panel = undefined;

    context.subscriptions.push(vscode.commands.registerCommand('codeforces-problem-viewer.showProblem', () => {
        if (panel) {
            // If the panel already exists, just reveal it.
            panel.reveal(vscode.ViewColumn.One);
        } else {
            // Otherwise, create a new webview panel.
            panel = vscode.window.createWebviewPanel(
                'codeforcesProblem',    // Internal ID for the webview
                'Codeforces Problem',   // Title shown in the UI
                vscode.ViewColumn.One,  // Show the panel in the first column
                {
                    // Enable scripts in the webview
                    enableScripts: true,
                    // Restrict the webview to only loading content from our 'webview' directory
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
                }
            );

            // Set the HTML content for the webview.
            panel.webview.html = getWebviewContent(context, panel.webview);

            // Connect to the WebSocket server
            const ws = new WebSocket('ws://localhost:8080');

            ws.on('open', () => {
                console.log('Connected to WebSocket server');
                panel.webview.postMessage({ command: 'status', text: 'Connected and listening...' });
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    // Check for the 'problem' type message from your server
                    if (data.type === 'problem' && data.payload) {
                        // Send the HTML payload to the webview to be rendered
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

            // When the panel is closed, clean up our resources
            panel.onDidDispose(() => {
                panel = undefined;
                ws.close();
            }, null, context.subscriptions);
        }
    }));
}

/**
 * Reads the HTML file from the 'webview' directory, injects the correct paths
 * for CSS and JS, and returns it as a string.
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Webview} webview
 */
function getWebviewContent(context, webview) {
    // Path to the webview's content folder
    const webviewPath = path.join(context.extensionPath, 'webview');
    const htmlPath = path.join(webviewPath, 'index.html');

    // Read the HTML file from disk
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Create webview-compatible URIs for the CSS and JS files
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'style.css')));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'script.js')));

    // Replace the placeholder paths in the HTML with the correct URIs
    html = html.replace('href="style.css"', `href="${styleUri}"`);
    html = html.replace('src="script.js"', `src="${scriptUri}"`);

    return html;
}


// This function is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};