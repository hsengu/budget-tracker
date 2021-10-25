let db;

const request = indexedDB.open('budget_tracker', 1);

// Create new indexedDB database if offline
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// If connection to remote DB restored upload data in indexedDB to remote DB
request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadData();
    }
}

// If error occurs
request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// Save a new record to indexedDB
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    transactionObjectStore.add(record);
}

// Function to upload using fetch API
function uploadData() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {                  // If indexedDB is not empty push data to API endpoint
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_transaction'], 'readwrite');           // After data is uploaded to remote DB clear indexedDB

                const transactionObjectStore = transaction.objectStore('new_transaction');

                transactionObjectStore.clear();

                console.log('All saved transactions have been submitted!');
            }).catch(err => {
                console.log(err);
            });
        }
    }
};

// Event listener to listen is online connectivity is restored
window.addEventListener('online', uploadData);