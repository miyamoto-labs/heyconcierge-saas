// Content script injected into polymarket.com pages
// Captures auth when user triggers connection

console.log('[EasyPoly] Content script loaded on Polymarket');

// Listen for capture request from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureAuth') {
    console.log('[EasyPoly] Capturing Polymarket auth...');
    
    try {
      // Extract localStorage (Magic auth token, user data)
      const localStorage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        localStorage[key] = window.localStorage.getItem(key);
      }
      
      // Extract sessionStorage
      const sessionStorage = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        sessionStorage[key] = window.sessionStorage.getItem(key);
      }
      
      // Get cookies via background script (content scripts can't access cookies directly)
      chrome.runtime.sendMessage({
        action: 'getCookies',
        domain: '.polymarket.com'
      }, (cookies) => {
        const authData = {
          localStorage,
          sessionStorage,
          cookies,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        
        console.log('[EasyPoly] Auth captured:', {
          localStorageKeys: Object.keys(localStorage),
          sessionStorageKeys: Object.keys(sessionStorage),
          cookieCount: cookies.length
        });
        
        sendResponse({ success: true, data: authData });
      });
      
      return true; // Keep channel open for async response
    } catch (error) {
      console.error('[EasyPoly] Error capturing auth:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
});
