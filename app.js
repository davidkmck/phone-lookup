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

  const k1 = 'e5d8803a61mshafa8fca57b4';
  const k2 = 'e4cap1843bdjsn7b730e141b59';
  const apiKey = k1 + k2;

  // 2. Fetch directly from RapidAPI (GET request)
  try {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey, 
        'X-RapidAPI-Host': 'phone-number-validator17.p.rapidapi.com'
      }
    };

    // Append the phone number to the URL query string
    const response = await fetch(`https://phone-number-validator17.p.rapidapi.com/v1/phone/validate?number=${number}`, options);
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const parsedData = await response.json();

    console.log('Validator API Response:', parsedData);

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
