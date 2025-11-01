let isEnabled = true;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPatterns();
  setupEventListeners();
});

async function loadSettings() {
  const settings = await chrome.storage.sync.get(['enabled']);
  isEnabled = settings.enabled !== false;
  document.getElementById('toggleDetection').checked = isEnabled;
}

async function loadPatterns() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showNoPatterns('No active tab found');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'GET_PATTERNS' }, (response) => {
      if (chrome.runtime.lastError) {
        showNoPatterns('Unable to scan this page');
        return;
      }

      if (response && response.patterns) {
        displayPatterns(response.patterns);
      } else {
        showNoPatterns('No patterns detected on this page');
      }
    });
  } catch (error) {
    console.error('Error loading patterns:', error);
    showNoPatterns('Error loading patterns');
  }
}

function displayPatterns(patterns) {
  const patternsList = document.getElementById('patternsList');
  const totalCount = document.getElementById('totalCount');
  
  totalCount.textContent = patterns.length;
  
  if (patterns.length === 0) {
    showNoPatterns('No dark patterns detected! ✨');
    return;
  }

  const patternCounts = {};
  patterns.forEach(p => {
    if (!patternCounts[p.name]) {
      patternCounts[p.name] = {
        count: 0,
        description: p.description,
        severity: p.severity
      };
    }
    patternCounts[p.name].count++;
  });

  const uniquePatterns = Object.entries(patternCounts).map(([name, data]) => ({
    name: name,
    count: data.count,
    description: data.description,
    severity: data.severity
  }));

  uniquePatterns.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  patternsList.innerHTML = uniquePatterns.map(pattern => `
    <div class="pattern-item ${pattern.severity}">
      <div class="pattern-name">${pattern.name} ${pattern.count > 1 ? `(${pattern.count})` : ''}</div>
      <div class="pattern-description">${pattern.description}</div>
      <span class="pattern-severity ${pattern.severity}">${pattern.severity}</span>
    </div>
  `).join('');
}

function showNoPatterns(message) {
  const patternsList = document.getElementById('patternsList');
  const totalCount = document.getElementById('totalCount');
  
  totalCount.textContent = '0';
  patternsList.innerHTML = `
    <div class="no-patterns">
      <div class="no-patterns-icon">✅</div>
      <div>${message}</div>
    </div>
  `;
}

function setupEventListeners() {
  const toggle = document.getElementById('toggleDetection');
  toggle.addEventListener('change', async (e) => {
    isEnabled = e.target.checked;
    await chrome.storage.sync.set({ enabled: isEnabled });
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_DETECTION',
        enabled: isEnabled
      }, () => {
        if (!chrome.runtime.lastError) {
          loadPatterns();
        }
      });
    }
  });

  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.textContent = '🔄 Refreshing...';
    refreshBtn.disabled = true;
    
    await loadPatterns();
    
    setTimeout(() => {
      refreshBtn.textContent = '🔄 Refresh';
      refreshBtn.disabled = false;
    }, 500);
  });
}
