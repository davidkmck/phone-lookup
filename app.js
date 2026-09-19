const phoneInput = document.getElementById('phoneInput');
const lookupBtn = document.getElementById('lookupBtn');
const resultContainer = document.getElementById('resultContainer');

// Using AllOrigins as the free public CORS proxy
//const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const CORS_PROXY = 'https://corsproxy.io/?';

// Replace with your chosen free API endpoint
const API_BASE_URL = 'https://freecnam.org/dip?q='; 

lookupBtn.addEventListener('click', performLookup);

async function performLookup() {
  let rawInput = phoneInput.value.trim();
  let digits = rawInput.replace(/\D/g, '');

  // Handle North American numbers cleanly
  let formattedNumber = '';
  if (digits.length === 10) {
    formattedNumber = '+1' + digits;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    formattedNumber = '+' + digits;
  } else if (digits.length > 11) {
    // If it already has an international country code
    formattedNumber = '+' + digits;
  } else {
    showResult({ error: 'Please enter a valid 10-digit phone number.' }, false);
    return;
  }

  resultContainer.innerHTML = '<p>Searching...</p>';
  resultContainer.classList.remove('hidden');

  // 1. Check LocalStorage Cache (using the 10-digit core as the key for consistency)
  let cacheKey = digits.length === 11 ? digits.substring(1) : digits;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    showResult(JSON.parse(cachedData), true);
    return;
  }

  const k1 = 'e5d8803a61mshafa8fca57b4';
  const k2 = 'e4cap1843bdjsn7b730e141b59';
  const apiKey = k1 + k2;

  // 2. Fetch directly from RapidAPI using the properly formatted number
  try {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey, 
        'X-RapidAPI-Host': 'phone-number-validator17.p.rapidapi.com'
      }
    };

    const response = await fetch(`https://phone-number-validator17.p.rapidapi.com/v1/phone/validate?number=${encodeURIComponent(formattedNumber)}`, options);
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const parsedData = await response.json();

    console.log('Validator API Response:', parsedData);

    // 3. Save to LocalStorage and Display
    localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    showResult(parsedData, false);

  } catch (error) {
    console.error('Error fetching data:', error);
    showResult({ error: 'Lookup failed. Check API limits.' }, false);
  }
}

function showResult(data, isCached) {
  if (data.error) {
    resultContainer.innerHTML = `<p class="error">${data.error}</p>`;
    return;
  }

  const isValid = data.valid ? 'Valid Number' : 'Invalid Number';
  const validClass = data.valid ? 'valid-badge' : 'invalid-badge';
  
  const phoneNum = data.international || data.input || '';
  const lineType = data.line_type ? data.line_type.replace(/_/g, ' ') : 'Unknown';
  const location = data.location ? `${data.location}, ${data.region || ''}` : (data.region || 'Unknown');
  const timezone = (data.timezones && data.timezones.length > 0) ? data.timezones[0] : '';

  let digits = phoneNum.replace(/\D/g, '');
  let cacheKey = digits.length === 11 && digits.startsWith('1') ? digits.substring(1) : digits;
  
  const existingRecord = JSON.parse(localStorage.getItem(cacheKey)) || {};
  const savedComment = existingRecord.comment || '';
  const savedTimestamp = existingRecord.timestamp || '';

  resultContainer.innerHTML = `
    <div class="card" data-key="${cacheKey}">
      <div class="header-row">
        <h2>${phoneNum}</h2>
        <span class="status-badge ${validClass}">${isValid}</span>
      </div>
      <div class="details-grid">
        <p><strong>Type:</strong> <span class="capitalize">${lineType}</span></p>
        <p><strong>Location:</strong> ${location}</p>
        ${timezone ? `<p><strong>Timezone:</strong> ${timezone}</p>` : ''}
      </div>

      <div class="comment-section">
        <label for="caller-comment"><strong>Notes / Tag:</strong></label>
        <div class="comment-input-row">
          <input type="text" id="caller-comment" placeholder="e.g. scammer, dentist..." value="${savedComment}">
          <button id="save-comment-btn" class="save-btn">Save Note</button>
        </div>
        ${savedTimestamp ? `<small class="timestamp">Last saved: ${savedTimestamp}</small>` : ''}
      </div>

      <div class="card-actions">
        <button id="delete-entry-btn" class="delete-btn">Delete Entry & Bypass Cache</button>
      </div>

      <span class="badge ${isCached ? 'cached' : 'new'}">
        ${isCached ? 'Loaded from Cache' : 'New Lookup'}
      </span>
    </div>
  `;

  // Attach event listeners
  document.getElementById('save-comment-btn').addEventListener('click', () => {
    saveCommentAndData(data, cacheKey);
  });

  document.getElementById('delete-entry-btn').addEventListener('click', () => {
    localStorage.removeItem(cacheKey);
    resultContainer.innerHTML = `<p class="success-msg">Entry deleted from local storage. Next search will fetch fresh data from the API.</p>`;
    phoneInput.value = '';
  });
}
function saveCommentAndData(apiData, cacheKey) {
  const commentInput = document.getElementById('caller-comment');
  const commentText = commentInput ? commentInput.value.trim() : '';
  
  // Generate a clean human-readable timestamp (e.g., "Sept 19, 2026, 2:45 PM")
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Bundle everything together
  const recordToSave = {
    ...apiData,
    comment: commentText,
    timestamp: timestamp
  };

  // Save back to localStorage
  localStorage.setItem(cacheKey, JSON.stringify(recordToSave));

  // Visual confirmation feedback
  const btn = document.getElementById('save-comment-btn');
  btn.textContent = 'Saved!';
  btn.style.backgroundColor = '#28a745';
  setTimeout(() => {
    btn.textContent = 'Save Note';
    btn.style.backgroundColor = '';
  }, 1500);
}

// Register Service Worker for PWA offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
      .catch((error) => console.error('Service Worker registration failed:', error));
  });
}
