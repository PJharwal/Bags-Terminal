// Capture keyboard events in the TradingView iframe
(function() {
  // Store original event handlers
  const originalKeydown = window.onkeydown;
  const originalKeyup = window.onkeyup;

  // Function to forward events to parent window without logging
  function forwardEvent(event) {
    window.parent.postMessage({
      type: 'keyEvent',
      eventType: event.type,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      which: event.which,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      repeat: event.repeat
    }, '*');
  }

  // Override keyboard event handlers
  window.addEventListener('keydown', function(event) {
    // Forward the event first
    forwardEvent(event);
    
    // Then call original handler if it exists
    if (originalKeydown) {
      originalKeydown.call(window, event);
    }
  }, true);

  window.addEventListener('keyup', function(event) {
    // Forward the event first
    forwardEvent(event);
    
    // Then call original handler if it exists
    if (originalKeyup) {
      originalKeyup.call(window, event);
    }
  }, true);

  // Also capture events on the document level
  document.addEventListener('keydown', forwardEvent, true);
  document.addEventListener('keyup', forwardEvent, true);

  // Add blur event handling (window only)
  window.addEventListener('blur', forwardEvent, true);

  // Modify iframe injection to only include window blur
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.tagName === 'IFRAME') {
          try {
            const iframe = node;
            iframe.addEventListener('load', function() {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.addEventListener('keydown', forwardEvent, true);
                iframeDoc.addEventListener('keyup', forwardEvent, true);
                iframe.contentWindow.addEventListener('blur', forwardEvent, true); // Changed to use contentWindow instead of document
              } catch { }
            });
          } catch { }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})(); 