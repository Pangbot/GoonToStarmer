// A hastily-put-together "screw you" to the online safety act. Ironically works better than the act itself.

// Globals
const REPLACEMENT_TEXT = "Thanks Online Safety Act!";
const REPLACEMENT_LINK_URL = 'https://petition.parliament.uk/petitions/722903?reveal_response=yes';
const MIN_IMAGE_DIMENSION = 50;
const CHECK_INTERVAL = 1000;
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const REPLACEMENT_ICON_URL = browserAPI.runtime.getURL('keir.png');

// Replaces a single image element with the replacement icon and disables lazy-loading cues.
function replaceImage(element) {
  if (element.dataset.replaced === 'true') {
    return;
  }
  
  if (element.tagName === 'IMG' && (element.naturalWidth < MIN_IMAGE_DIMENSION || element.naturalHeight < MIN_IMAGE_DIMENSION)) {
    return;
  }
  
  element.dataset.replaced = 'true';

  if (element.tagName === 'IMG') {
    element.removeAttribute('loading');
    element.removeAttribute('data-src');
    element.removeAttribute('data-original');
    element.removeAttribute('srcset');
    
    element.src = REPLACEMENT_ICON_URL;

    element.style.setProperty('object-fit', 'contain', 'important');
    element.style.setProperty('background-color', 'white', 'important');
    element.style.setProperty('width', '100%', 'important');
    element.style.setProperty('height', '100%', 'important');
    element.style.setProperty('display', 'block', 'important');
  } else if (element.tagName === 'DIV') {
    element.style.setProperty('background-image', `url(${REPLACEMENT_ICON_URL})`, 'important');
    element.style.setProperty('background-size', 'contain', 'important');
    element.style.setProperty('background-repeat', 'no-repeat', 'important');
    element.style.setProperty('background-position', 'center', 'important');
  }
}

// Finds and replaces the title within a given element.
function replaceItemTitle(itemElement) {
  if (itemElement.dataset.titleReplaced) {
    return;
  }

  const titleSelectors = [
    '.title',
    '.thumb__title',
    'strong',
    'h1, h2, h3, h4, h5, h6',
    'div, span, p'
  ];
  
  let replaced = false;

  for (const selector of titleSelectors) {
    const titleCandidate = itemElement.querySelector(selector);
    
    if (titleCandidate && titleCandidate.textContent.trim().length > 2) {
      titleCandidate.textContent = REPLACEMENT_TEXT;
      replaced = true;
      break;
    }
  }

  if (!replaced && itemElement.textContent.trim().length > 2) {
    const childImages = itemElement.querySelectorAll('img').length > 0;
    const childInputs = itemElement.querySelectorAll('input').length > 0;

    if (!childImages && !childInputs) {
      itemElement.textContent = REPLACEMENT_TEXT;
      replaced = true;
    }
  }

  if (replaced) {
    itemElement.dataset.titleReplaced = 'true';
    return;
  }

  if (itemElement.hasAttribute('title') && itemElement.getAttribute('title').trim().length > 2) {
      itemElement.setAttribute('title', REPLACEMENT_TEXT);
      itemElement.dataset.titleReplaced = 'true';
  }
}

// Processes all relevant elements on a given scope.
function processElements(scope) {
  const videoItems = scope.querySelectorAll('.item, .video-container, .media-card, .list-videos, .list-albums, .core-page__units-grid div, a, .thumb_item', '.phimage');
  
  videoItems.forEach(item => {
    // Process titles
    replaceItemTitle(item);

    // Process images
    const imageElements = item.querySelectorAll('img, div');
    imageElements.forEach(element => {
      const hasSrc = element.tagName === 'IMG' && element.src;
      const hasDataSrc = element.hasAttribute('data-src') || element.hasAttribute('data-original');
      const style = window.getComputedStyle(element);
      const hasBgImage = style.backgroundImage && style.backgroundImage !== 'none';
      
      if ((hasSrc || hasDataSrc || hasBgImage) && !element.dataset.replaced) {
        replaceImage(element);
      }
    });

    // Process links
    // Check if the item itself is a link and replace its href
    if (item.tagName === 'A' && !item.dataset.linkReplaced) {
      item.href = REPLACEMENT_LINK_URL;
      item.dataset.linkReplaced = 'true';
    }

    // Then, look for any nested links
    const linkElements = item.querySelectorAll('a');
    linkElements.forEach(link => {
      if (!link.dataset.linkReplaced) {
        link.href = REPLACEMENT_LINK_URL;
        link.dataset.linkReplaced = 'true';
      }
    });
  });
}

function main() {
  processElements(document.body);
  
  setInterval(() => {
    processElements(document.body);
  }, CHECK_INTERVAL);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            processElements(node);
          }
        });
      }
      else if (mutation.type === 'attributes' && (mutation.attributeName === 'src' || mutation.attributeName === 'data-src' || mutation.attributeName === 'data-original' || mutation.attributeName === 'srcset')) {
        const target = mutation.target;
        if (target.tagName === 'IMG' && target.closest('.item, .video-container, .media-card, .list-videos, .list-albums, .core-page__units-grid div, a, .thumb_item', '.latestThumb')) {
           replaceImage(target);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'data-src', 'data-original', 'srcset']
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}