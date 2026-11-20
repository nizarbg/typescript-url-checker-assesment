// Import CSS for styling the application.
// Vite handles CSS imports automatically.
// @ts-ignore
import './style.css';


// ==========================================
// 1. TYPE DEFINITIONS
// ==========================================

// A URL can represent either a file or a folder.
type ResourceType = 'file' | 'folder';

// Define the possible responses from the server.
// If the URL exists, we also receive its type.
// Otherwise, the server returns exists: false.
type CheckResult =
  | { exists: true; type: ResourceType }
  | { exists: false };


// ==========================================
// 2. GET HTML ELEMENTS
// ==========================================

// Get the input field where the user enters a URL.
// The ! tells TypeScript that the element exists.
const input = document.querySelector<HTMLInputElement>('#url')!;

// Get the HTML element where we display the result.
const result = document.querySelector<HTMLDivElement>('#result')!;


// ==========================================
// 3. MOCK SERVER DATA
// ==========================================

// Simulate a database containing existing URLs.
// The key is the URL and the value is its resource type.
// In a real application, this information would come
// from a backend server.
const mockResources = new Map<string, ResourceType>([
  ['https://example.com/', 'folder'],
  ['https://example.com/docs/', 'folder'],
  ['https://example.com/docs/readme.pdf', 'file'],
  ['https://example.com/images/logo.png', 'file'],
]);


// ==========================================
// 4. ASYNCHRONOUS MOCK SERVER CALL
// ==========================================

// Simulate calling a server to check whether a URL exists.
// async means the function returns a Promise.
async function mockServerCheck(url: string): Promise<CheckResult> {

  // Simulate a network delay of 350 milliseconds.
  // await waits without blocking the browser interface.
  await new Promise<void>((resolve) =>
    setTimeout(resolve, 350)
  );

  // Search for the URL in our mock data.
  const type = mockResources.get(url);

  // Return whether the URL exists and its type.
  // If the URL is unknown, return exists: false.
  return type
    ? { exists: true, type }
    : { exists: false };
}


// ==========================================
// 5. URL FORMAT VALIDATION
// ==========================================

// Check if the entered string is a valid HTTP/HTTPS URL.
// This validation happens immediately as the user types.
function isValidUrl(value: string): boolean {

  try {
    // Try to convert the input string into a URL object.
    // If the format is incorrect, the constructor may throw.
    const url = new URL(value);

    // Only accept HTTP and HTTPS URLs.
    // Also require a hostname and reject whitespace.
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname) &&
      !/\s/.test(value)
    );

  } catch {
    // If URL construction fails, the URL is invalid.
    return false;
  }
}


// ==========================================
// 6. DISPLAY STATUS MESSAGES
// ==========================================

// Update the message displayed to the user.
// kind determines the CSS styling of the message.
function setStatus(
  message: string,
  kind: 'neutral' | 'error' | 'success' = 'neutral'
): void {

  // Display the message in the HTML element.
  result.textContent = message;

  // Apply the corresponding CSS class.
  // Example: error = red, success = green.
  result.className = kind;
}


// ==========================================
// 7. THROTTLING VARIABLES
// ==========================================

// Minimum time between server request starts.
// This prevents excessive calls while typing.
const THROTTLE_MS = 700;

// Store when the last server request started.
// -Infinity allows the first request to run immediately.
let lastRequestStart = -Infinity;

// Store the timeout for a scheduled server request.
// We can cancel it when the user types something new.
let trailingTimer: ReturnType<typeof setTimeout> | undefined;

// Track input changes using a revision number.
// This prevents old server responses from replacing
// the result of a newer input.
let revision = 0;


// ==========================================
// 8. CHECK URL EXISTENCE
// ==========================================

// Call the mock server and display the result.
async function checkUrl(
  url: string,
  currentRevision: number
): Promise<void> {

  // Record the start time of this request.
  lastRequestStart = Date.now();

  // Inform the user that the check is running.
  setStatus('Checking URL…');

  try {
    // Call the asynchronous mock server.
    const response = await mockServerCheck(url);

    // If the user has typed something new while we
    // were waiting, ignore this old response.
    if (currentRevision !== revision) return;

    // URL was not found in the mock database.
    if (!response.exists) {
      setStatus('URL does not exist.', 'error');

    } else {
      // URL exists: display whether it is a file or folder.
      setStatus(
        `URL exists — ${response.type}.`,
        'success'
      );
    }

  } catch {
    // Handle possible errors during the server call.
    // Only show the error if this is still the latest input.
    if (currentRevision === revision) {
      setStatus('Could not check the URL.', 'error');
    }
  }
}


// ==========================================
// 9. THROTTLE SERVER REQUESTS
// ==========================================

// Control when the existence check can be executed.
// Requests must be at least 700 ms apart.
function scheduleThrottledCheck(
  url: string,
  currentRevision: number
): void {

  // Cancel an older scheduled check if one exists.
  // We only want to check the most recent URL.
  if (trailingTimer !== undefined) {
    clearTimeout(trailingTimer);
  }

  // Calculate how much time remains before
  // we are allowed to send another request.
  const remaining =
    THROTTLE_MS - (Date.now() - lastRequestStart);

  if (remaining <= 0) {

    // Enough time has passed.
    // Start the request immediately.
    void checkUrl(url, currentRevision);

  } else {

    // We must wait before making another request.
    setStatus('Valid URL. Waiting to check…');

    // Schedule one request after the remaining delay.
    trailingTimer = setTimeout(() => {

      // The scheduled timer has now executed.
      trailingTimer = undefined;

      // Check the latest URL.
      void checkUrl(url, currentRevision);

    }, remaining);
  }
}


// ==========================================
// 10. LISTEN FOR USER INPUT
// ==========================================

// Execute this function every time the user types,
// deletes, or pastes something into the input field.
input.addEventListener('input', () => {

  // Increase the revision to mark a new input version.
  // Any previous server response is now outdated.
  revision++;

  // Cancel any scheduled request for an older URL.
  if (trailingTimer !== undefined) {
    clearTimeout(trailingTimer);
    trailingTimer = undefined;
  }

  // Get the current input and remove extra spaces
  // at the beginning and end.
  const url = input.value.trim();

  if (!url) {

    // Case 1: Input is empty.
    setStatus('Start typing a URL.');

  } else if (!isValidUrl(url)) {

    // Case 2: Invalid URL format.
    // Do not send a server request.
    setStatus(
      'Invalid URL. Enter a full http:// or https:// URL.',
      'error'
    );

  } else {

    // Case 3: URL format is valid.
    // Schedule the existence check using throttling.
    scheduleThrottledCheck(url, revision);
  }
});