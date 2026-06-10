import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';

// ==========================================
// 1. CONSTANTS & APPLICATION STATE
// ==========================================

// List of target rice leaf disease classes (Length: 14)
const LABELS = [
  'Bacterial Blight',
  'Bacterial Leaf Streak',
  'Bacterial Panicle Blight',
  'Blast',
  'Brown Spot',
  'Dead Heart',
  'Downy Mildew',
  'Healthy',
  'Hispa',
  'Leaf Smut',
  'Narrow Brown Spot',
  'Tungro',
  'White Stem Borer',
  'Yellow Stem Borer'
];

// Rich descriptions & recommendations for local farmers (Philippine Agricultural context)
const DISEASE_DETAILS = {
  'Bacterial Blight': {
    desc: 'Water-soaked lesions on leaf tips that merge and turn yellow-white, drying up the leaf.',
    recommendation: 'Ensure proper field drainage. Avoid excess nitrogen fertilizer. Use resistant seed varieties.',
    severity: 'High Risk'
  },
  'Bacterial Leaf Streak': {
    desc: 'Narrow, translucent, dark-green streaks between leaf veins that turn brown and papery.',
    recommendation: 'Keep fields clean of crop weeds. Avoid flooded conditions. Implement crop rotation.',
    severity: 'Medium Risk'
  },
  'Bacterial Panicle Blight': {
    desc: 'Panicles turn brown and grain hulls rot or discolor, leading to severe yield loss.',
    recommendation: 'Use certified disease-free seeds. Avoid high-humidity planting periods. Clean equipment.',
    severity: 'High Risk'
  },
  'Blast': {
    desc: 'Spindle-shaped spots with gray centers and reddish-brown borders on leaves or necks.',
    recommendation: 'Avoid excess nitrogen. Apply recommended systemic fungicides if damage exceeds 10% threshold.',
    severity: 'High Risk'
  },
  'Brown Spot': {
    desc: 'Oval, dark-brown spots with yellow halos. Often indicates poor soil or nutrient deficiencies.',
    recommendation: 'Apply nitrogen in split doses. Improve soil potassium levels and field drainage.',
    severity: 'Medium Risk'
  },
  'Dead Heart': {
    desc: 'Stem drying and death of the central leaf whorl caused by early-stage stem borer larval boring.',
    recommendation: 'Release biological controls (Trichogramma wasps). Install light traps. Uproot dead hearts.',
    severity: 'High Risk'
  },
  'Downy Mildew': {
    desc: 'Pale yellow streaks and white powdery fungal growth on leaf surfaces under cool, humid conditions.',
    recommendation: 'Rogue infected hills. Use certified seeds. Apply copper fungicides if infection is widespread.',
    severity: 'Medium Risk'
  },
  'Healthy': {
    desc: 'Leaves are vibrant green and show no signs of infection, spotting, or insect damage.',
    recommendation: 'Maintain regular watering, weeding, and balanced nitrogen-potassium fertilizer applications.',
    severity: 'Optimal'
  },
  'Hispa': {
    desc: 'Insects scrape upper leaf tissue, creating white parallel lines resembling streaks.',
    recommendation: 'Handpick beetles. Avoid excess nitrogen. Maintain clean field borders to remove alternate hosts.',
    severity: 'Medium Risk'
  },
  'Leaf Smut': {
    desc: 'Small, slightly raised black spots on leaves resembling charcoal dust.',
    recommendation: 'Rarely causes severe loss. Implement crop rotation and destroy stubble after harvest.',
    severity: 'Low Risk'
  },
  'Narrow Brown Spot': {
    desc: 'Short, narrow, reddish-brown spots running parallel to the leaf veins.',
    recommendation: 'Use resistant crop cultivars. Ensure balanced nutrition (adequate potassium levels).',
    severity: 'Low Risk'
  },
  'Tungro': {
    desc: 'Viral disease causing yellow-orange leaves and stunted growth. Spread by green leafhoppers.',
    recommendation: 'Uproot infected hills. Set up light traps to control green leafhoppers. Plant resistant crops.',
    severity: 'High Risk'
  },
  'White Stem Borer': {
    desc: 'Empty, bleached-white panicles (whiteheads) caused by larvae boring into stem bases during flowering.',
    recommendation: 'Collect egg masses in seedbeds. Use light traps. Clip leaf tips before transplanting.',
    severity: 'High Risk'
  },
  'Yellow Stem Borer': {
    desc: 'Bores stems causing deadhearts or whiteheads. High occurrence in wet season irrigated fields.',
    recommendation: 'Set up pheromone traps. Conserve natural predators (spiders, dragonflies). Manage stubble.',
    severity: 'High Risk'
  }
};

let model = null;
let stream = null;

// ==========================================
// 2. DOM ELEMENT SELECTORS
// ==========================================
const videoEl = document.getElementById('camera-stream');
const imgPreviewEl = document.getElementById('image-preview');
const cameraGuideEl = document.getElementById('camera-guide');
const scannerLineEl = document.getElementById('scanner-line');
const cameraErrorBannerEl = document.getElementById('camera-error-banner');
const dismissErrorBtn = document.getElementById('dismiss-error-btn');
const analysisLoaderEl = document.getElementById('analysis-loader');

const statusPill = document.getElementById('status-pill');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

const captureBtn = document.getElementById('capture-btn');
const uploadTriggerBtn = document.getElementById('upload-trigger');
const fileInput = document.getElementById('file-input');
const resetBtn = document.getElementById('reset-btn');

const resultsCard = document.getElementById('results-card');
const resultDiseaseText = document.getElementById('result-disease');
const resultConfidenceText = document.getElementById('result-confidence');
const resultDescText = document.getElementById('result-desc');
const resultRecText = document.getElementById('result-desc'); // Maps recommendations
const resultSeverityText = document.getElementById('result-severity');

const hiddenCanvas = document.getElementById('hidden-canvas');
const hiddenImgLoader = document.getElementById('hidden-img-loader');

const closeResultsBtn = document.getElementById('close-results-btn');
const navGalleryBtn = document.getElementById('nav-gallery-btn');
const navCaptureBtn = document.getElementById('nav-capture-btn');
const navHistoryBtn = document.getElementById('nav-history-btn');

const historyList = document.getElementById('history-list');
const historyEmptyState = document.getElementById('history-empty-state');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history-btn');

// ==========================================
// 3. STORAGE LOGIC (IndexedDB)
// ==========================================
const DB_NAME = 'RiceCareHistoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

let db;
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveScanToHistory = async (scanData) => {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(scanData);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};

const getHistoryScans = async () => {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const data = request.result || [];
      resolve(data.sort((a, b) => b.id - a.id));
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

const renderHistory = async () => {
  try {
    const scans = await getHistoryScans();
    historyList.innerHTML = '';
    
    if (scans.length === 0) {
      historyEmptyState.classList.remove('hidden');
      historyEmptyState.classList.add('flex');
    } else {
      historyEmptyState.classList.add('hidden');
      historyEmptyState.classList.remove('flex');
      
      scans.forEach(scan => {
        const dateStr = new Date(scan.id).toLocaleString();
        let badgeClass = 'bg-tertiary-container text-on-tertiary-container';
        if (scan.severity === 'High Risk') badgeClass = 'bg-error-container text-on-error-container';
        if (scan.severity === 'Optimal') badgeClass = 'bg-primary-container text-on-primary-container';
        
        const card = document.createElement('div');
        card.className = 'flex gap-stack-md p-stack-md bg-surface border border-outline-variant rounded-xl shadow-sm items-center';
        card.innerHTML = `
          <img src="${scan.thumbnail}" class="w-16 h-16 object-cover rounded-lg border border-outline-variant shrink-0" alt="Scan thumbnail">
          <div class="flex-1 min-w-0">
            <h3 class="font-label-xl text-label-xl font-bold text-on-surface truncate">${scan.diseaseName}</h3>
            <p class="font-label-md text-label-md text-on-surface-variant truncate">${dateStr}</p>
            <div class="mt-1 inline-flex items-center px-2 py-0.5 rounded-sm ${badgeClass} font-label-md text-[10px] font-bold uppercase tracking-wider">
              ${scan.confidence}% • ${scan.severity}
            </div>
          </div>
        `;
        historyList.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Failed to load history', err);
  }
};

// ==========================================
// 3.1. SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Check network status to update status indicators
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
  if (!navigator.onLine && !model) {
    setStatus('Offline', 'bg-error', 'text-error bg-error-container border-error');
  } else if (model) {
    setStatus('Ready (Offline AI)', 'bg-primary', 'text-on-surface-variant bg-surface-container border-outline-variant');
  }
}

// Helper to set PWA status indicators
function setStatus(text, dotColorClass, pillColorClass) {
  statusText.textContent = text;
  
  // Clean old status colors
  statusDot.className = 'shrink-0 block h-2 w-2 rounded-full ' + dotColorClass;
  
  statusPill.className = 'flex items-center justify-center gap-1.5 px-3 h-[32px] rounded-full border ' + pillColorClass;
}

// ==========================================
// 4. MODEL LOADER
// ==========================================
async function loadModel() {
  try {
    setStatus('Loading AI...', 'bg-tertiary', 'text-on-surface-variant bg-surface-container border-outline-variant');
    console.log('[AI] Loading TFLite model from /philippines_rice_disease_edge_v2.tflite');
    
    // Set WASM path for local offline binaries (served at root /)
    tflite.setWasmPath('/');
    
    // Load local TFLite model
    model = await tflite.loadTFLiteModel('/philippines_rice_disease_edge_v2.tflite');
    
    console.log('[AI] TFLite model loaded successfully.');
    setStatus('Ready', 'bg-primary', 'text-on-surface-variant bg-surface-container border-outline-variant');
    
    // Enable controls
    captureBtn.removeAttribute('disabled');
    uploadTriggerBtn.removeAttribute('disabled');
  } catch (error) {
    console.error('[AI] Error loading TFLite model:', error);
    setStatus('Model Error', 'bg-error', 'text-error bg-error-container border-error');
    
    // Keep buttons disabled but output logs for inspection
    alert('Failed to load local TFLite model. Verify the file philippines_rice_disease_edge_v2.tflite is in the public directory.');
  }
}

// ==========================================
// 5. CAMERA SYSTEM
// ==========================================
async function startCamera() {
  if (stream) {
    stopCamera();
  }

  const constraints = {
    video: {
      facingMode: 'environment', // Request back-facing camera
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  try {
    console.log('[Camera] Initializing stream...');
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    videoEl.classList.remove('hidden');
    imgPreviewEl.classList.add('hidden');
    cameraGuideEl.classList.remove('hidden');
    cameraErrorBannerEl.classList.add('hidden');
    console.log('[Camera] Stream started successfully.');
  } catch (error) {
    console.error('[Camera] Access failed:', error);
    // Show user-friendly error and guide to fallback file upload
    cameraErrorBannerEl.classList.remove('hidden');
    videoEl.classList.add('hidden');
    cameraGuideEl.classList.add('hidden');
  }
}

function stopCamera() {
  if (stream) {
    console.log('[Camera] Stopping camera streams...');
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// ==========================================
// 6. PREPROCESSING & INFERENCE PIPELINE
// ==========================================
async function runInference(sourceElement) {
  if (!model) {
    alert('Model is not loaded yet.');
    return;
  }

  // Show loader overlay & scanner laser animation
  analysisLoaderEl.classList.remove('hidden');
  scannerLineEl.classList.remove('hidden');

  // Perform draw with center crop to maintain aspect ratio and prevent squashing
  const ctx = hiddenCanvas.getContext('2d');
  const srcWidth = sourceElement.videoWidth || sourceElement.naturalWidth || sourceElement.width || 224;
  const srcHeight = sourceElement.videoHeight || sourceElement.naturalHeight || sourceElement.height || 224;
  const size = Math.min(srcWidth, srcHeight);
  
  // Calculate source square coordinates (center crop)
  const sx = (srcWidth - size) / 2;
  const sy = (srcHeight - size) / 2;
  
  ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
  ctx.drawImage(sourceElement, sx, sy, size, size, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

  // Small delay to let the UI render the loading overlays nicely (aesthetic micro-delay)
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    // 1. Prepare input tensor using tf.tidy to avoid WebGL memory leaks
    const batched = tf.tidy(() => {
      // Read pixels from canvas
      const pixels = tf.browser.fromPixels(hiddenCanvas);
      
      // Resize to MobileNetV2 target [224, 224] using nearest neighbor
      const resized = tf.image.resizeNearestNeighbor(pixels, [224, 224]);
      
      // Cast values to float32
      const floatImg = resized.toFloat();
      
      // Divide by 255.0 for 0-1 range normalization
      const normalized = floatImg.div(tf.scalar(255.0));
      
      // Expand dimensions to [1, 224, 224, 3] for batched input representation
      return normalized.expandDims(0);
    });

    // 2. Predict using TFLite model
    const prediction = model.predict(batched);
    
    // 3. Extract data from prediction tensor (handle output formats dynamically)
    let outputData;
    if (prediction instanceof tf.Tensor) {
      outputData = await prediction.data();
      prediction.dispose();
    } else if (Array.isArray(prediction)) {
      outputData = await prediction[0].data();
      prediction.forEach(t => t.dispose());
    } else {
      const keys = Object.keys(prediction);
      outputData = await prediction[keys[0]].data();
      Object.values(prediction).forEach(t => t.dispose());
    }
    
    // 4. Dispose the input tensor
    batched.dispose();

    // Process output array (Length 14)
    let maxIdx = 0;
    let maxVal = -1.0;
    for (let i = 0; i < outputData.length; i++) {
      if (outputData[i] > maxVal) {
        maxVal = outputData[i];
        maxIdx = i;
      }
    }

    const confidence = Math.round(maxVal * 100);
    const diseaseName = LABELS[maxIdx];
    const details = DISEASE_DETAILS[diseaseName] || {
      desc: 'No details available for this label.',
      recommendation: 'Please seek assistance from your local agricultural extension officer.',
      severity: 'Unknown'
    };

    console.log(`[AI] Diagnosis: ${diseaseName} (${confidence}%)`);

    // Render results
    resultDiseaseText.textContent = diseaseName;
    resultConfidenceText.textContent = confidence;
    resultDescText.textContent = `${details.desc} ${details.recommendation}`;
    
    resultSeverityText.textContent = details.severity;

    // Apply color depending on severity
    const severityContainer = document.getElementById('result-severity-container');
    const severityBg = document.getElementById('result-severity-bg');
    const resultIcon = document.getElementById('result-icon');
    const confidenceTextContainer = document.getElementById('result-confidence-text-container');
    const confidenceBar = document.getElementById('result-confidence-bar');

    confidenceBar.style.width = `${confidence}%`;
    const baseContainerClass = 'p-stack-md rounded-lg border flex flex-col gap-stack-md relative overflow-hidden';
    const baseBgClass = 'absolute top-0 right-0 w-24 h-24 rounded-bl-full';
    
    if (details.severity === 'High Risk') {
      resultDiseaseText.className = 'font-headline-lg-mobile text-headline-lg-mobile font-bold text-error leading-tight';
      resultIcon.className = 'material-symbols-outlined text-error text-3xl';
      severityContainer.className = baseContainerClass + ' bg-error-container/30 border-error/30';
      severityBg.className = baseBgClass + ' bg-error/5';
      confidenceTextContainer.className = 'flex justify-between font-label-md text-label-md text-on-error-container';
      confidenceBar.className = 'h-full bg-error rounded-full relative';
      resultIcon.textContent = 'warning';
    } else if (details.severity === 'Optimal') {
      resultDiseaseText.className = 'font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary leading-tight';
      resultIcon.className = 'material-symbols-outlined text-primary text-3xl';
      severityContainer.className = baseContainerClass + ' bg-primary-container/30 border-primary/30';
      severityBg.className = baseBgClass + ' bg-primary/5';
      confidenceTextContainer.className = 'flex justify-between font-label-md text-label-md text-on-primary-container';
      confidenceBar.className = 'h-full bg-primary rounded-full relative';
      resultIcon.textContent = 'check_circle';
    } else {
      resultDiseaseText.className = 'font-headline-lg-mobile text-headline-lg-mobile font-bold text-tertiary leading-tight';
      resultIcon.className = 'material-symbols-outlined text-tertiary text-3xl';
      severityContainer.className = baseContainerClass + ' bg-tertiary-container/30 border-tertiary/30';
      severityBg.className = baseBgClass + ' bg-tertiary/5';
      confidenceTextContainer.className = 'flex justify-between font-label-md text-label-md text-on-tertiary-container';
      confidenceBar.className = 'h-full bg-tertiary rounded-full relative';
      resultIcon.textContent = 'info';
    }

    // Reveal Results & Toggle Buttons
    resultsCard.classList.remove('hidden');
    captureBtn.classList.add('hidden');
    uploadTriggerBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
    cameraGuideEl.classList.add('hidden');

    // Save to history
    try {
      // Downscale image for thumbnail to save IndexedDB space
      const thumbCanvas = document.createElement('canvas');
      const ctx = thumbCanvas.getContext('2d');
      const MAX_SIZE = 150;
      let width = hiddenCanvas.width;
      let height = hiddenCanvas.height;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      thumbCanvas.width = width;
      thumbCanvas.height = height;
      ctx.drawImage(hiddenCanvas, 0, 0, width, height);
      
      const thumbnailData = thumbCanvas.toDataURL('image/jpeg', 0.7);
      
      await saveScanToHistory({
        id: Date.now(),
        diseaseName: diseaseName,
        confidence: confidence,
        severity: details.severity,
        thumbnail: thumbnailData
      });
    } catch (dbError) {
      console.error('[DB] Failed to save scan to history:', dbError);
    }

  } catch (error) {
    console.error('[AI] Inference failed:', error);
    alert('An error occurred during inference. See developer console.');
  } finally {
    // Hide loader overlay & scanner line
    analysisLoaderEl.classList.add('hidden');
    scannerLineEl.classList.add('hidden');
  }
}

// ==========================================
// 7. EVENT LISTENERS & UI TRANSITIONS
// ==========================================

// Click Capture: Snap frame from video stream, pause camera, run prediction
captureBtn.addEventListener('click', async () => {
  if (!stream || !model) return;

  // 1. Draw frame to preview image to "freeze" the view
  const ctx = hiddenCanvas.getContext('2d');
  hiddenCanvas.width = videoEl.videoWidth;
  hiddenCanvas.height = videoEl.videoHeight;
  ctx.drawImage(videoEl, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
  
  imgPreviewEl.src = hiddenCanvas.toDataURL('image/jpeg');
  imgPreviewEl.classList.remove('hidden');
  videoEl.classList.add('hidden');
  
  // 2. Stop camera stream to preserve battery and resources
  stopCamera();

  // 3. Run prediction pipeline
  await runInference(imgPreviewEl);
});

// Click Upload Trigger
uploadTriggerBtn.addEventListener('click', () => {
  fileInput.click();
});

// File input selection: Read file, render preview, stop camera, and predict
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Assign Base64 URL to preview and hidden preprocessor image loaders
    imgPreviewEl.src = e.target.result;
    hiddenImgLoader.src = e.target.result;
    
    hiddenImgLoader.onload = async () => {
      // Show preview element
      imgPreviewEl.classList.remove('hidden');
      videoEl.classList.add('hidden');
      cameraGuideEl.classList.add('hidden');
      stopCamera();

      // Run prediction
      await runInference(hiddenImgLoader);
    };
  };
  reader.readAsDataURL(file);
});

// Reset Scan Button: Restart camera stream and return to primary viewfinder UI state
resetBtn.addEventListener('click', async () => {
  resultsCard.classList.add('hidden');
  resetBtn.classList.add('hidden');
  captureBtn.classList.remove('hidden');
  uploadTriggerBtn.classList.remove('hidden');
  imgPreviewEl.classList.add('hidden');
  fileInput.value = ''; // Reset file input

  // Restart camera view
  await startCamera();
});

// Dismiss camera error banner
dismissErrorBtn.addEventListener('click', () => {
  cameraErrorBannerEl.classList.add('hidden');
});

// Close Results Button
closeResultsBtn.addEventListener('click', () => {
  resetBtn.click();
});

// Navigation Bar Actions
navGalleryBtn.addEventListener('click', (e) => {
  e.preventDefault();
  uploadTriggerBtn.click();
});

navCaptureBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!captureBtn.disabled && !captureBtn.classList.contains('hidden')) {
    captureBtn.click();
  }
});

navHistoryBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  await renderHistory();
  historyModal.classList.remove('hidden');
  // Small delay to allow display:block to apply before animating transform
  setTimeout(() => {
    historyModal.classList.remove('translate-y-full');
  }, 10);
});

closeHistoryBtn.addEventListener('click', () => {
  historyModal.classList.add('translate-y-full');
  setTimeout(() => {
    historyModal.classList.add('hidden');
  }, 300); // Wait for transition to complete
});

// ==========================================
// 8. INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  // Load local model
  await loadModel();
  
  // Launch Camera
  await startCamera();
});
