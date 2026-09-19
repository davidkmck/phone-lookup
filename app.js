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

  // Strip leading '1' if the user types it (since we will use the countryCode parameter)
  if (number.length === 11 && number.startsWith('1')) {
    number = number.substring(1);
  }
  
  if (number.length !== 10) {
    showResult({ error: 'Please enter a valid 10-digit phone number.' }, false);
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

  const k1 = 'becfa7c4f9msh92f71c735';
  const k2 = 'dfab97p19fadajsnebd212a0b50a';
  const apiKey = k1 + k2;
  
  // 2. Fetch directly from RapidAPI
  try {
    // Format the body data as x-www-form-urlencoded
    const bodyData = new URLSearchParams();
    bodyData.append('phone', number);
    bodyData.append('countryCode', 'US'); // Use 'US' for North American numbers

    const options = {
      method: 'POST', // Changed from GET to POST
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-RapidAPI-Key': apiKey, 
        'X-RapidAPI-Host': 'truecaller-api11.p.rapidapi.com'
      },
      body: bodyData
    };

    // Make the POST fetch
    const response = await fetch('https://truecaller-api11.p.rapidapi.com/v2.php', options);
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const parsedData = await response.json();

    // Log the response to the console so you can see the exact data structure
    console.log('New API Response:', parsedData);

    // 3. Save to LocalStorage and Display
    localStorage.setItem(number, JSON.stringify(parsedData));
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

  // This API nests the details inside a 'data' object
  const callerName = (data.data && data.data.name) ? data.data.name : 'Unknown Caller';
  const phoneNum = (data.data && data.data.phone) ? data.data.phone : '';
  
  resultContainer.innerHTML = `
    <div class="card">
      <h2>${callerName}</h2>
      <p>${phoneNum}</p>
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
