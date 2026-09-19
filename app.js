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
  let number = phoneInput.value.replace(/\D/g, '');

// Remove leading '1' for North American numbers
if (number.length === 11 && number.startsWith('1')) {
  number = number.substring(1);
}
  
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

// 2. Fetch if not in cache (Example using a generic RapidAPI endpoint)
  try {
    const options = {
      method: 'GET',
      headers: {
        // You will need to register for a free tier API key
        'X-RapidAPI-Key': 'c3116454e9mshbcf31a93163529fp1ee6e9jsn6149f2a509e5', 
        'X-RapidAPI-Host': 'truecaller18.p.rapidapi.com'
      }
    };


    // Make the direct fetch without a proxy
    const response = await fetch(`https://the-api-host.p.rapidapi.com/lookup?phone=${number}`, options);
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const parsedData = await response.json();

    // 3. Save to LocalStorage and Display
    localStorage.setItem(number, JSON.stringify(parsedData));
    showResult(parsedData, false);

  } catch (error) {
    console.error('Error fetching data:', error);
    showResult({ error: 'Lookup failed. Check API limits.' }, false);
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

// Register Service Worker for PWA offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
      .catch((error) => console.error('Service Worker registration failed:', error));
  });
}
