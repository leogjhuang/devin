let detectionEnabled = true;
let patternCounts = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ enabled: true });
  console.log('Patch - Dark Pattern Detector installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    const count = message.count || 0;
    const tabId = sender.tab?.id;
    
    if (tabId) {
      if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString(), tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b', tabId: tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId: tabId });
      }
      
      patternCounts[tabId] = count;
    }
    
    sendResponse({ success: true });
  } else if (message.type === 'ANALYZE_WITH_AI') {
    analyzeWithAI(message.data).then(result => {
      sendResponse({ result: result });
    });
    return true;
  } else if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['enabled', 'sensitivity'], (settings) => {
      sendResponse({ 
        enabled: settings.enabled !== false,
        sensitivity: settings.sensitivity || 'medium'
      });
    });
    return true;
  }
  
  return true;
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  const count = patternCounts[activeInfo.tabId] || 0;
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString(), tabId: activeInfo.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b', tabId: activeInfo.tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete patternCounts[tabId];
});

async function analyzeWithAI(data) {
  const { text, context, elementType } = data;
  
  const patterns = await inferDarkPatterns(text, context, elementType);
  
  return {
    detected: patterns.length > 0,
    patterns: patterns,
    confidence: calculateConfidence(patterns)
  };
}

async function inferDarkPatterns(text, context, elementType) {
  const detectedPatterns = [];
  
  const textLower = text.toLowerCase();
  const contextLower = (context || '').toLowerCase();
  
  if (elementType === 'button' || elementType === 'link') {
    if (isConfirmShaming(textLower)) {
      detectedPatterns.push({
        type: 'CONFIRM_SHAMING',
        confidence: 0.85,
        reason: 'Negative framing detected in action text'
      });
    }
    
    if (isFalseUrgency(textLower, contextLower)) {
      detectedPatterns.push({
        type: 'URGENCY',
        confidence: 0.80,
        reason: 'Time pressure language detected'
      });
    }
  }
  
  if (elementType === 'checkbox' || elementType === 'radio') {
    if (isTrickQuestion(textLower)) {
      detectedPatterns.push({
        type: 'TRICK_QUESTIONS',
        confidence: 0.90,
        reason: 'Confusing double-negative detected'
      });
    }
    
    if (isSneaking(contextLower)) {
      detectedPatterns.push({
        type: 'SNEAKING',
        confidence: 0.75,
        reason: 'Pre-selected option with unclear consent'
      });
    }
  }
  
  if (elementType === 'text') {
    if (isFakeScarcity(textLower)) {
      detectedPatterns.push({
        type: 'SCARCITY',
        confidence: 0.70,
        reason: 'Artificial scarcity indicators detected'
      });
    }
    
    if (isPrivacyZuckering(textLower, contextLower)) {
      detectedPatterns.push({
        type: 'PRIVACY_ZUCKERING',
        confidence: 0.85,
        reason: 'Privacy-invasive language detected'
      });
    }
  }
  
  if (elementType === 'price' || elementType === 'cost') {
    if (isHiddenCost(textLower, contextLower)) {
      detectedPatterns.push({
        type: 'HIDDEN_COSTS',
        confidence: 0.88,
        reason: 'Unexpected fees or charges detected'
      });
    }
  }
  
  return detectedPatterns;
}

function isConfirmShaming(text) {
  const shamingPhrases = [
    'no, i don\'t want',
    'no thanks, i prefer',
    'i don\'t want to save',
    'no, i\'ll pay full price',
    'no, i hate',
    'skip this offer',
    'i don\'t want to be',
    'no, i\'m not interested in'
  ];
  
  return shamingPhrases.some(phrase => text.includes(phrase));
}

function isFalseUrgency(text, context) {
  const urgencyIndicators = [
    /only \d+ left/i,
    /\d+ people (are )?viewing/i,
    /expires in \d+/i,
    /limited time/i,
    /ending soon/i,
    /last chance/i,
    /hurry/i,
    /act now/i,
    /don't miss out/i,
    /today only/i
  ];
  
  const combined = text + ' ' + context;
  return urgencyIndicators.some(pattern => pattern.test(combined));
}

function isFakeScarcity(text) {
  const scarcityIndicators = [
    /almost sold out/i,
    /running out/i,
    /low stock/i,
    /\d+ left in stock/i,
    /only \d+ remaining/i,
    /selling fast/i,
    /high demand/i
  ];
  
  return scarcityIndicators.some(pattern => pattern.test(text));
}

function isTrickQuestion(text) {
  const hasNegation = /\b(don't|do not|don\'t|dont|not|never|disable|uncheck)\b/i.test(text);
  const hasAction = /\b(send|share|notify|subscribe|email|contact|call|message)\b/i.test(text);
  
  return hasNegation && hasAction;
}

function isSneaking(text) {
  const sneakingIndicators = [
    /automatically added/i,
    /pre-?selected/i,
    /included by default/i,
    /added to (your )?cart/i,
    /we've added/i,
    /default option/i
  ];
  
  return sneakingIndicators.some(pattern => pattern.test(text));
}

function isPrivacyZuckering(text, context) {
  const privacyIndicators = [
    /share with everyone/i,
    /make (it )?public/i,
    /allow access to/i,
    /share (your )?location/i,
    /access (your )?contacts/i,
    /share (your )?data/i,
    /visible to all/i
  ];
  
  const combined = text + ' ' + context;
  return privacyIndicators.some(pattern => pattern.test(combined));
}

function isHiddenCost(text, context) {
  const costIndicators = [
    /additional fee/i,
    /handling charge/i,
    /service fee/i,
    /processing fee/i,
    /convenience fee/i,
    /surcharge/i,
    /extra charge/i,
    /\+ \$\d+/i,
    /taxes and fees/i
  ];
  
  const combined = text + ' ' + context;
  return costIndicators.some(pattern => pattern.test(combined));
}

function calculateConfidence(patterns) {
  if (patterns.length === 0) return 0;
  
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  return Math.round(avgConfidence * 100) / 100;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.enabled) {
    detectionEnabled = changes.enabled.newValue;
    
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_DETECTION',
          enabled: detectionEnabled
        }).catch(() => {});
      });
    });
  }
});
