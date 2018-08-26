function trackWorkerChange(registeredWorker) {
  registeredWorker.addEventListener('statechange', function () {
    if (registeredWorker.state === 'installed') {
      notifyUpdate(registeredWorker);
    }
  })
}

function notifyUpdate(serviceWorker) {
  showYesNoMessage("Incoming update: accept it now?", "Accept", "Later", function () {
    serviceWorker.postMessage({ action: 'skipWaiting' });
  })
}

function overlayClicked(event) {
  showModalDialog(false);
  overlay.removeEventListener('click', overlayClicked)
};

function toastKeyPressed(event) {
  if (event.keyCode === 9) {
    if (event.shiftKey) {
      if(document.activeElement === firstBtn) {
        event.preventDefault();
        lastBtn.focus();
      }
    } else {
      if (document.activeElement === lastBtn) {
        event.preventDefault();
        firstBtn.focus();
      }
    }
  }
  if (event.keyCode === 27)
    showModalDialog(false);
};
function preventWindowTab(event) {
}
let focusableItems, firstBtn, lastBtn, lastFocusedOnPage;

function showModalDialog(yesNo = true) {
  const toast = document.getElementById('toast');
  const overlay = document.getElementById('overlay');
  if (yesNo) {
    lastFocusedOnPage = document.activeElement;
    focusableItems = Array.prototype.slice.call(toast.querySelectorAll("button"));
    firstBtn = focusableItems[0];
    lastBtn = focusableItems[focusableItems.length - 1];
    toast.classList.add('show-transparent-element');
    overlay.classList.add('show-transparent-element');
    toast.addEventListener('keydown', toastKeyPressed)
    overlay.addEventListener('click', overlayClicked)
    firstBtn.focus();
  } else {
    toast.removeEventListener('keydown', toastKeyPressed)
    toast.classList.remove('show-transparent-element');
    overlay.classList.remove('show-transparent-element');
    lastFocusedOnPage.focus();
  }
}
/**
 * Shows a message as a modal dialog using the html provided
 *
 * @param {*} text
 * @param {*} yesText
 * @param {*} noText
 * @param {*} cb
 */
function showYesNoMessage(text, yesText, noText, cb) {
  const container = document.getElementById('toast');
  const messageContainer = document.getElementById('toast-message');
  messageContainer.innerText = text;
  container.setAttribute('aria-label', text);
  const yesButton = document.getElementById('left-btn');
  const noButton = document.getElementById('right-btn');
  yesButton.innerText = yesText;
  noButton.innerText = noText;

  const yesFun = (event) => {
    cb()
    yesButton.removeEventListener('click', yesFun);
  };

  const noFun = (event) => {
    showModalDialog(false);
    noButton.removeEventListener('click', noFun);
  };
  yesButton.addEventListener('click', yesFun);
  noButton.addEventListener('click', noFun);
  showModalDialog();
}
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(registeredWorker => {
      console.log('Service worker succesfully registered');
      if (!navigator.serviceWorker.controller) return;

      if (registeredWorker.installing) {
        trackWorkerChange(registeredWorker.installing);
      }

      if (registeredWorker.waiting) {
        notifyUpdate(registeredWorker.waiting);
      }

      registeredWorker.addEventListener('updatefound', function () {
        trackWorkerChange(registeredWorker.installing);
      })
    })
    .catch(err => {
      console.log(`Something went wrong ${err}`);
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    })
    navigator.serviceWorker.ready.then(function(swRegistration) {
      return swRegistration.sync.register('offline-data');
    });
  }
})