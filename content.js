const DARK_PATTERNS = {
  FORCED_CONTINUITY: {
    name: 'Forced Continuity',
    description: 'Making it difficult to cancel subscriptions or free trials',
    severity: 'high',
    keywords: ['cancel', 'subscription', 'trial', 'billing', 'unsubscribe'],
    patterns: [
      /cancel.*subscription/i,
      /end.*trial/i,
      /stop.*billing/i,
      /unsubscribe/i
    ]
  },
  HIDDEN_COSTS: {
    name: 'Hidden Costs',
    description: 'Revealing unexpected charges at the last step of checkout',
    severity: 'high',
    keywords: ['fee', 'charge', 'additional', 'extra', 'surcharge', 'handling'],
    patterns: [
      /additional.*fee/i,
      /handling.*charge/i,
      /service.*fee/i,
      /processing.*fee/i
    ]
  },
  CONFIRM_SHAMING: {
    name: 'Confirm Shaming',
    description: 'Guilting users into opting in by making the decline option sound negative',
    severity: 'medium',
    keywords: ['no thanks', 'no', 'decline', 'skip', 'maybe later'],
    patterns: [
      /no.*i.*don't.*want/i,
      /no.*thanks.*i.*prefer/i,
      /i.*don't.*want.*to.*save/i,
      /skip.*this.*offer/i
    ]
  },
  URGENCY: {
    name: 'False Urgency',
    description: 'Creating artificial time pressure to force quick decisions',
    severity: 'medium',
    keywords: ['hurry', 'limited', 'only', 'left', 'expires', 'ending soon', 'last chance'],
    patterns: [
      /only.*\d+.*left/i,
      /\d+.*people.*viewing/i,
      /expires.*in.*\d+/i,
      /limited.*time/i,
      /ending.*soon/i,
      /last.*chance/i,
      /hurry/i
    ]
  },
  SCARCITY: {
    name: 'Fake Scarcity',
    description: 'Falsely claiming limited availability to pressure purchases',
    severity: 'medium',
    keywords: ['sold out', 'almost gone', 'running out', 'low stock'],
    patterns: [
      /almost.*sold.*out/i,
      /running.*out/i,
      /low.*stock/i,
      /\d+.*left.*in.*stock/i
    ]
  },
  SNEAKING: {
    name: 'Sneaking',
    description: 'Adding items to cart or enabling options without clear consent',
    severity: 'high',
    keywords: ['added', 'included', 'automatically', 'pre-selected'],
    patterns: [
      /automatically.*added/i,
      /pre.*selected/i,
      /included.*by.*default/i
    ]
  },
  MISDIRECTION: {
    name: 'Misdirection',
    description: 'Designing UI to focus attention on one thing to distract from another',
    severity: 'medium',
    keywords: ['accept', 'agree', 'continue', 'next'],
    patterns: []
  },
  PRIVACY_ZUCKERING: {
    name: 'Privacy Zuckering',
    description: 'Tricking users into sharing more personal information than intended',
    severity: 'high',
    keywords: ['share', 'public', 'friends', 'everyone', 'allow access'],
    patterns: [
      /share.*with.*everyone/i,
      /make.*public/i,
      /allow.*access.*to/i
    ]
  },
  TRICK_QUESTIONS: {
    name: 'Trick Questions',
    description: 'Using confusing wording to get users to answer opposite of their intent',
    severity: 'high',
    keywords: ['don\'t', 'not', 'disable', 'opt out'],
    patterns: [
      /don't.*send/i,
      /opt.*out/i,
      /disable.*notifications/i,
      /uncheck.*to.*not/i
    ]
  },
  ROACH_MOTEL: {
    name: 'Roach Motel',
    description: 'Making it easy to get into a situation but hard to get out',
    severity: 'high',
    keywords: ['delete', 'remove', 'cancel', 'close account'],
    patterns: [
      /delete.*account/i,
      /close.*account/i,
      /remove.*data/i
    ]
  }
};

class DarkPatternDetector {
  constructor() {
    this.detectedPatterns = new Map();
    this.observer = null;
    this.isEnabled = true;
    this.init();
  }

  async init() {
    const settings = await chrome.storage.sync.get(['enabled']);
    this.isEnabled = settings.enabled !== false;
    
    if (this.isEnabled) {
      this.scanPage();
      this.setupObserver();
    }
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (this.isEnabled) {
        this.scanPage();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
  }

  scanPage() {
    this.scanButtons();
    this.scanLinks();
    this.scanForms();
    this.scanCheckboxes();
    this.scanText();
    this.scanPricing();
    this.updateBadge();
  }

  scanButtons() {
    const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
    
    buttons.forEach(button => {
      if (button.hasAttribute('data-patch-analyzed')) return;
      
      const text = this.getElementText(button).toLowerCase();
      const style = window.getComputedStyle(button);
      
      if (this.detectConfirmShaming(text)) {
        this.flagElement(button, DARK_PATTERNS.CONFIRM_SHAMING);
      }
      
      if (this.detectUrgency(text)) {
        this.flagElement(button, DARK_PATTERNS.URGENCY);
      }
      
      if (this.detectMisdirection(button, style)) {
        this.flagElement(button, DARK_PATTERNS.MISDIRECTION);
      }
      
      button.setAttribute('data-patch-analyzed', 'true');
    });
  }

  scanLinks() {
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
      if (link.hasAttribute('data-patch-analyzed')) return;
      
      const text = this.getElementText(link).toLowerCase();
      const href = link.getAttribute('href') || '';
      
      if (this.detectRoachMotel(text, href)) {
        this.flagElement(link, DARK_PATTERNS.ROACH_MOTEL);
      }
      
      if (this.detectConfirmShaming(text)) {
        this.flagElement(link, DARK_PATTERNS.CONFIRM_SHAMING);
      }
      
      link.setAttribute('data-patch-analyzed', 'true');
    });
  }

  scanForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      if (form.hasAttribute('data-patch-analyzed')) return;
      
      const inputs = form.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      inputs.forEach(input => {
        if (input.checked && !input.hasAttribute('data-user-interaction')) {
          const label = this.findLabelForInput(input);
          const labelText = label ? this.getElementText(label).toLowerCase() : '';
          
          if (this.detectSneaking(labelText)) {
            this.flagElement(input.parentElement || input, DARK_PATTERNS.SNEAKING);
            this.modifyPreselectedInput(input);
          }
        }
      });
      
      form.setAttribute('data-patch-analyzed', 'true');
    });
  }

  scanCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      if (checkbox.hasAttribute('data-patch-analyzed')) return;
      
      const label = this.findLabelForInput(checkbox);
      const labelText = label ? this.getElementText(label).toLowerCase() : '';
      
      if (this.detectTrickQuestion(labelText)) {
        this.flagElement(label || checkbox.parentElement, DARK_PATTERNS.TRICK_QUESTIONS);
        this.clarifyTrickQuestion(label || checkbox.parentElement, labelText);
      }
      
      checkbox.addEventListener('change', () => {
        checkbox.setAttribute('data-user-interaction', 'true');
      });
      
      checkbox.setAttribute('data-patch-analyzed', 'true');
    });
  }

  scanText() {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li');
    
    textElements.forEach(element => {
      if (element.hasAttribute('data-patch-analyzed')) return;
      if (element.children.length > 3) return;
      
      const text = this.getElementText(element).toLowerCase();
      
      if (this.detectScarcity(text)) {
        this.flagElement(element, DARK_PATTERNS.SCARCITY);
      }
      
      if (this.detectUrgency(text)) {
        this.flagElement(element, DARK_PATTERNS.URGENCY);
      }
      
      if (this.detectPrivacyZuckering(text)) {
        this.flagElement(element, DARK_PATTERNS.PRIVACY_ZUCKERING);
      }
      
      element.setAttribute('data-patch-analyzed', 'true');
    });
  }

  scanPricing() {
    const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [class*="fee"], [id*="price"], [id*="cost"]');
    
    priceElements.forEach(element => {
      if (element.hasAttribute('data-patch-analyzed')) return;
      
      const text = this.getElementText(element).toLowerCase();
      
      if (this.detectHiddenCosts(text)) {
        this.flagElement(element, DARK_PATTERNS.HIDDEN_COSTS);
        this.highlightHiddenCost(element);
      }
      
      element.setAttribute('data-patch-analyzed', 'true');
    });
  }

  detectConfirmShaming(text) {
    return DARK_PATTERNS.CONFIRM_SHAMING.patterns.some(pattern => pattern.test(text)) ||
           (text.includes('no') && (text.includes('don\'t want') || text.includes('prefer')));
  }

  detectUrgency(text) {
    return DARK_PATTERNS.URGENCY.patterns.some(pattern => pattern.test(text));
  }

  detectScarcity(text) {
    return DARK_PATTERNS.SCARCITY.patterns.some(pattern => pattern.test(text));
  }

  detectSneaking(text) {
    return DARK_PATTERNS.SNEAKING.patterns.some(pattern => pattern.test(text)) ||
           text.includes('automatically') || text.includes('pre-selected');
  }

  detectTrickQuestion(text) {
    const hasNegation = text.includes('don\'t') || text.includes('not') || text.includes('disable');
    const hasAction = text.includes('send') || text.includes('share') || text.includes('notify');
    return hasNegation && hasAction;
  }

  detectMisdirection(element, style) {
    const fontSize = parseFloat(style.fontSize);
    const opacity = parseFloat(style.opacity);
    const color = style.color;
    
    const siblings = Array.from(element.parentElement?.children || []);
    const otherButtons = siblings.filter(s => s !== element && (s.tagName === 'BUTTON' || s.getAttribute('role') === 'button'));
    
    if (otherButtons.length > 0) {
      const otherStyles = otherButtons.map(b => window.getComputedStyle(b));
      const avgFontSize = otherStyles.reduce((sum, s) => sum + parseFloat(s.fontSize), 0) / otherStyles.length;
      
      if (fontSize < avgFontSize * 0.7 || opacity < 0.7) {
        return true;
      }
    }
    
    return false;
  }

  detectRoachMotel(text, href) {
    return DARK_PATTERNS.ROACH_MOTEL.patterns.some(pattern => pattern.test(text)) ||
           (text.includes('cancel') && href.includes('#')) ||
           (text.includes('delete') && href.length === 0);
  }

  detectHiddenCosts(text) {
    return DARK_PATTERNS.HIDDEN_COSTS.patterns.some(pattern => pattern.test(text));
  }

  detectPrivacyZuckering(text) {
    return DARK_PATTERNS.PRIVACY_ZUCKERING.patterns.some(pattern => pattern.test(text));
  }

  flagElement(element, pattern) {
    if (element.hasAttribute('data-patch-flagged')) return;
    
    element.classList.add('patch-flagged');
    element.setAttribute('data-patch-flagged', 'true');
    element.setAttribute('data-patch-pattern', pattern.name);
    element.setAttribute('data-patch-severity', pattern.severity);
    
    const key = `${pattern.name}-${this.getElementPath(element)}`;
    this.detectedPatterns.set(key, {
      pattern: pattern,
      element: element,
      timestamp: Date.now()
    });
    
    this.addWarningIndicator(element, pattern);
  }

  addWarningIndicator(element, pattern) {
    const indicator = document.createElement('div');
    indicator.className = 'patch-indicator';
    indicator.setAttribute('data-patch-tooltip', `${pattern.name}: ${pattern.description}`);
    indicator.innerHTML = '⚠️';
    
    const rect = element.getBoundingClientRect();
    indicator.style.position = 'absolute';
    indicator.style.zIndex = '999999';
    
    element.style.position = 'relative';
    element.appendChild(indicator);
  }

  modifyPreselectedInput(input) {
    input.checked = false;
    input.style.outline = '2px solid #ff6b6b';
    
    const notice = document.createElement('span');
    notice.className = 'patch-notice';
    notice.textContent = ' (Pre-selected by default - Patch unchecked this for you)';
    notice.style.color = '#ff6b6b';
    notice.style.fontSize = '0.9em';
    notice.style.marginLeft = '8px';
    
    const label = this.findLabelForInput(input);
    if (label) {
      label.appendChild(notice);
    }
  }

  clarifyTrickQuestion(element, text) {
    const clarification = document.createElement('div');
    clarification.className = 'patch-clarification';
    clarification.innerHTML = `
      <strong>⚠️ Confusing wording detected</strong><br>
      <span style="font-size: 0.9em;">This question uses negative language that may be confusing.</span>
    `;
    clarification.style.backgroundColor = '#fff3cd';
    clarification.style.border = '1px solid #ffc107';
    clarification.style.padding = '8px';
    clarification.style.marginTop = '4px';
    clarification.style.borderRadius = '4px';
    
    element.parentElement?.insertBefore(clarification, element.nextSibling);
  }

  highlightHiddenCost(element) {
    element.style.backgroundColor = '#fff3cd';
    element.style.border = '2px solid #ffc107';
    element.style.padding = '4px';
    element.style.borderRadius = '4px';
  }

  getElementText(element) {
    return element.textContent || element.innerText || element.value || '';
  }

  findLabelForInput(input) {
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label;
    }
    
    let parent = input.parentElement;
    while (parent && parent.tagName !== 'FORM') {
      if (parent.tagName === 'LABEL') return parent;
      parent = parent.parentElement;
    }
    
    return null;
  }

  getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  async updateBadge() {
    const count = this.detectedPatterns.size;
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      count: count
    });
  }

  disable() {
    this.isEnabled = false;
    if (this.observer) {
      this.observer.disconnect();
    }
    
    document.querySelectorAll('.patch-flagged').forEach(el => {
      el.classList.remove('patch-flagged');
      el.removeAttribute('data-patch-flagged');
      el.removeAttribute('data-patch-pattern');
      el.removeAttribute('data-patch-severity');
    });
    
    document.querySelectorAll('.patch-indicator, .patch-notice, .patch-clarification').forEach(el => {
      el.remove();
    });
    
    this.detectedPatterns.clear();
    this.updateBadge();
  }

  enable() {
    this.isEnabled = true;
    this.scanPage();
    this.setupObserver();
  }
}

const detector = new DarkPatternDetector();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_DETECTION') {
    if (message.enabled) {
      detector.enable();
    } else {
      detector.disable();
    }
    sendResponse({ success: true });
  } else if (message.type === 'GET_PATTERNS') {
    const patterns = Array.from(detector.detectedPatterns.values()).map(p => ({
      name: p.pattern.name,
      description: p.pattern.description,
      severity: p.pattern.severity,
      timestamp: p.timestamp
    }));
    sendResponse({ patterns: patterns });
  }
  
  return true;
});
