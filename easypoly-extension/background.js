// Background service worker
// Handles cookie access and communication with EasyPoly backend

// const EASYPOLY_API = 'https://easypoly.bet/api/capture-auth';
const EASYPOLY_API = 'http://localhost:3003/api/capture-auth'; // Dev

console.log('[EasyPoly] Background service worker loaded');

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCookies') {
    // Get all cookies for Polymarket domain
    chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
      console.log('[EasyPoly] Retrieved cookies:', cookies.length);
      sendResponse(cookies);
    });
    return true; // Keep channel open
  }
  
  if (request.action === 'sendAuthToBackend') {
    // Send captured auth to EasyPoly backend
    sendAuthToBackend(request.authData, request.userId)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open
  }
});

async function sendAuthToBackend(authData, userId) {
  console.log('[EasyPoly] Sending auth to backend...', { userId });
  
  try {
    const response = await fetch(EASYPOLY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        authData,
        source: 'chrome-extension',
        version: chrome.runtime.getManifest().version
      })
    });
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[EasyPoly] Backend response:', result);
    return result;
  } catch (error) {
    console.error('[EasyPoly] Error sending to backend:', error);
    throw error;
  }
}

// Handle extension icon click (open popup)
chrome.action.onClicked.addListener((tab) => {
  console.log('[EasyPoly] Extension icon clicked');
});
