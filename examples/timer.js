module.exports.initiatedTimer = (id) => {
  setTimeout(() => {
    console.log(`${id} initiatedTimer`)
  }, 1000);
}
module.exports.systemTimer = (() => {
  let isRunning = false;
  return () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    setInterval(() => {
      console.log('systemTimer')
    }, 1000);
  }
})();
