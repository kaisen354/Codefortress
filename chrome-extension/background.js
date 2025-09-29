// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "FETCH_PROBLEM") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (!tabs[0]) {
//         console.error("No active tab found");
//         sendResponse({ success: false, error: "No active tab found" });
//         return;
//       }

//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         { type: "SCRAPE_PROBLEM" },
//         (response) => {
//           if (chrome.runtime.lastError) {
//             console.error("Runtime error:", chrome.runtime.lastError);
//             sendResponse({
//               success: false,
//               error: chrome.runtime.lastError.message,
//             });
//             return;
//           }
//           if (!response) {
//             console.error("No response from content script");
//             sendResponse({
//               success: false,
//               error: "No response from content script",
//             });
//             return;
//           }
//           sendResponse(response);
//         }
//       );
//     });

//     return true; // Keep the connection open for async response
//   }
// });



// Establish the WebSocket connection once, when the background script starts.
// const socket = new WebSocket('ws://localhost:8080');

// socket.onopen = () => {
//   console.log('Background script connected to WebSocket server.');
// };

// socket.onmessage = (event) => {
//   console.log('Message from server:', event.data);
// };

// socket.onerror = (error) => {
//   console.error('Background WebSocket Error:', error);
// };

// socket.onclose = () => {
//   console.log('Background WebSocket connection closed.');
// };

// // Listen for the trigger message from the popup.
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "fetchProblem") {
//     console.log('Received fetch request from popup.');
//     sendResponse({ status: "Fetching problem from page..." }); // Immediately reply to the popup.

//     // Query for the active tab to message the content script.
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs.length === 0) {
//         console.error('Could not find active tab.');
//         return;
//       }
      
//       const activeTab = tabs[0];
      
//       // Now, the persistent background script safely waits for the response.
//       chrome.tabs.sendMessage(activeTab.id, { action: "getProblem" }, (response) => {
//         if (chrome.runtime.lastError) {
//           // This can happen if the content script is not injected.
//           // e.g., user needs to refresh the Codeforces tab.
//           console.error('Error messaging content script:', chrome.runtime.lastError.message);
//           return;
//         }

//         if (response && response.html) {
//           console.log('Received HTML from content script. Sending to server.');
          
//           // Ensure the socket is ready before sending.
//           if (socket.readyState === WebSocket.OPEN) {
//             const message = JSON.stringify({ type: 'problem', payload: response.html });
//             socket.send(message);
//           } else {
//             console.error('WebSocket is not open. readyState:', socket.readyState);
//           }
//         } else {
//           console.log('Did not receive HTML from content script.');
//         }
//       });
//     });

//     // Return true because we are responding asynchronously from the tabs.sendMessage callback.
//     return true;
//   }
// });





// Establish the WebSocket connection when the extension starts up.
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
  console.log('✅ Background script connected to WebSocket server.');
};

socket.onerror = (error) => {
  console.error('🚨 WebSocket Error:', error);
};

socket.onclose = () => {
  console.log('🔌 WebSocket connection closed. Attempting to reconnect...');
  // Optional: Add reconnection logic if needed.
};

// This function will be injected into the Codeforces page to get the HTML.
function scrapeProblemStatement() {
  const problemStatement = document.querySelector('.problem-statement');
  if (problemStatement) {
    return problemStatement.innerHTML;
  }
  return null; // Return null if the element isn't found.
}

// Listen for a click on the extension's action icon (the toolbar button).
chrome.action.onClicked.addListener((tab) => {
  // Ensure we are on a valid Codeforces problem page.
  if (tab.url && tab.url.startsWith("https://codeforces.com/problemset/problem/")) {
    console.log('Action icon clicked. Injecting script into tab:', tab.id);

    // Use the Scripting API to execute our function on the page.
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeProblemStatement
    }, (injectionResults) => {
      // This callback runs after the script has executed on the page.
      if (chrome.runtime.lastError) {
        console.error('Scripting execution failed:', chrome.runtime.lastError.message);
        return;
      }
      
      // injectionResults is an array of results, one for each frame the script was injected into.
      // We are interested in the first (and usually only) result from the main frame.
      const result = injectionResults[0].result;

      if (result) {
        console.log('✅ Successfully scraped HTML. Sending to server...');
        if (socket.readyState === WebSocket.OPEN) {
          const message = JSON.stringify({ type: 'problem', payload: result });
          socket.send(message);
        } else {
          console.error('❌ WebSocket is not open. Cannot send data.');
        }
      } else {
        console.warn('⚠️ Could not find the .problem-statement element on the page.');
      }
    });
  } else {
    console.warn('This is not a Codeforces problem page.');
  }
});