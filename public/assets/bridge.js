// eslint-disable-next-line no-unused-vars
const callback = (...args) => {
  if (typeof window.respondToApp === 'function') {
    console.log('respondToApp:', ...args);
    window.respondToApp(...args);
  } else {
    console.log('local:', ...args);
  }
};
