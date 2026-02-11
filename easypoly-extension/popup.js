// Popup UI logic

const connectBtn = document.getElementById('connectBtn');
const openPolymarketBtn = document.getElementById('openPolymarket');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const instructionsDiv = document.getElementById('instructions');

let currentTab = null;
let userId = null;

// Initialize popup
init();

async function init() {
  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];
  
  // Load saved userId from storage
  const stored = await chrome.storage.local.get(['userId', 'connectionStatus']);
  userId = stored.userId;
  
  if (stored.connectionStatus === 'connected') {
    setConnected();
  }
  
  // Check if we're on Polymarket
  const isPolymarket = currentTab.url?.includes('polymarket.com');
  
  if (!isPolymarket) {
    connectBtn.disabled = true;
    connectBtn.textContent = 'Open Polymarket first';
    openPolymarketBtn.style.display = 'block';
  }
  
  // Request userId if not saved
  if (!userId) {
    instructionsDiv.innerHTML = `
      To link your account, first sign up at <strong>easypoly.bet</strong>, 
      then return here to connect.
    `;
  }
}

connectBtn.addEventListener('click', async () => {
  // For testing: use test userId if not set
  if (!userId) {
    userId = 'test_user_' + Date.now();
    await chrome.storage.local.set({ userId });
    console.log('[EasyPoly] Created test userId:', userId);
  }
  
  const isPolymarket = currentTab.url?.includes('polymarket.com');
  if (!isPolymarket) {
    showError('Please navigate to polymarket.com first');
    return;
  }
  
  connectBtn.disabled = true;
  connectBtn.innerHTML = '<span class="loading"></span> Capturing auth...';
  hideMessages();
  
  try {
    // Send capture request to content script
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'captureAuth'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to capture auth');
    }
    
    console.log('[EasyPoly] Auth captured, sending to backend...');
    connectBtn.textContent = 'Sending to backend...';
    
    // Send to backend via background script
    const backendResponse = await chrome.runtime.sendMessage({
      action: 'sendAuthToBackend',
      authData: response.data,
      userId
    });
    
    if (!backendResponse.success) {
      throw new Error(backendResponse.error || 'Backend error');
    }
    
    // Save connection status
    await chrome.storage.local.set({ connectionStatus: 'connected' });
    
    setConnected();
    showSuccess('✓ Connected! You can now receive bet alerts on Telegram.');
    
  } catch (error) {
    console.error('[EasyPoly] Connection error:', error);
    showError(error.message);
    connectBtn.disabled = false;
    connectBtn.textContent = 'Connect Polymarket';
  }
});

openPolymarketBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://polymarket.com' });
  window.close();
});

function setConnected() {
  statusDot.classList.remove('disconnected');
  statusDot.classList.add('connected');
  statusText.textContent = 'Connected';
  connectBtn.textContent = '✓ Connected';
  connectBtn.disabled = true;
  instructionsDiv.textContent = 'Your Polymarket account is linked. Check Telegram for bet alerts!';
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  successDiv.style.display = 'none';
}

function showSuccess(message) {
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  errorDiv.style.display = 'none';
}

function hideMessages() {
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
}

// Listen for storage changes (if userId is set from landing page)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.userId) {
    userId = changes.userId.newValue;
    if (userId) {
      instructionsDiv.textContent = 'Click "Connect Polymarket" to link your account.';
    }
  }
});
