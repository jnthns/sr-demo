export const waitForIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const checkIndexedDB = () => {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        resolve(true);
      } else {
        setTimeout(checkIndexedDB, 100); // Check again after 100ms
      }
    };
    checkIndexedDB();
  });
};