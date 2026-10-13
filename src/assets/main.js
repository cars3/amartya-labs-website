/* andralabs.org · v1 · local clock in the footer */
(function(){
  function tick(){
    var d = new Date();
    var s = d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:false});
    var c = document.getElementById('clockd');
    if (c) c.textContent = s + ' local';
  }
  tick(); setInterval(tick, 30000);
})();
