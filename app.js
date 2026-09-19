const phoneInput = document.getElementById('phoneInput');
const lookupBtn = document.getElementById('lookupBtn');
const resultContainer = document.getElementById('resultContainer');

// Using AllOrigins as the free public CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/get?url=';
// Replace with your chosen free API endpoint
const API_BASE_URL = 'https://freecnam.org/dip?q='; 

lookupBtn.addEventListener('click', performLookup);

async function performLookup() {
  // Strip non-numeric characters for consistent caching and API requests
  const number = phoneInput.value.replace(/\D/g, '');
  
  if (number.length < 10) {
    showResult({ error: 'Please enter a valid phone number.' }, false);
    return;
  }

  resultContainer.innerHTML = '<p>Searching...</p>';
  resultContainer.classList.remove('hidden');

  // 1. Check LocalStorage Cache
  const cachedData = localStorage.getItem(number);
  if (cachedData) {
    showResult(JSON.parse(cachedData), true);
    return;
  }

  // 2. Fetch if not in cache
  try {
    const targetUrl = encodeURIComponent(`${API_BASE_URL}${number}`);
    const response = await fetch(`${CORS_PROXY}${targetUrl}`);
    
    if (!response.ok) throw new Error('Network response failed');
    
    const data = await response.json();
    
    // AllOrigins wraps the actual response text in a 'contents' property
    // If you use a different proxy or an API that returns JSON directly, adjust this parsing
    let parsedData;
    try {
      parsedData = JSON.parse(data.contents);
    } catch (e) {
      // Fallback if the API returns plain text (like some basic CNAMs)
      parsedData = { name: data.contents };
    }

    // 3. Save to LocalStorage and Display
    localStorage.setItem(number, JSON.stringify(parsedData));
    showResult(parsedData, false);

  } catch (error) {
    console.error('Error fetching data:', error);
    showResult({ error: 'Lookup failed. Try again later.' }, false);
  }
}

function showResult(data, isCached) {
  if (data.error) {
    resultContainer.innerHTML = `<p class="error">${data.error}</p>`;
    return;
  }

  // Adjust these fields based on the specific API you end up choosing
  const callerName = data.name || data.CNAM || 'Unknown Caller';
  
  resultContainer.innerHTML = `
    <div class="card">
      <h2>${callerName}</h2>
      <span class="badge ${isCached ? 'cached' : 'new'}">
        ${isCached ? 'Loaded from Cache' : 'New Lookup'}
      </span>
    </div>
  `;
}
