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

/* copy-to-clipboard for the MCP page setup blocks */
(function(){
  function legacyCopy(text, done){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (ok && done) done();
  }
  function copyText(text, done){
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(done, function(){ legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }
  document.addEventListener('click', function(e){
    var blk = e.target && e.target.closest ? e.target.closest('.copyblk') : null;
    if (!blk) return;
    if (window.getSelection && String(window.getSelection()).length) return;
    var cmd = blk.querySelector('.cmd');
    if (!cmd) return;
    copyText(cmd.textContent.trim(), function(){
      var btn = blk.querySelector('.copybtn');
      if (!btn) return;
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
      btn.textContent = 'copied';
      btn.classList.add('done');
      clearTimeout(btn._t);
      btn._t = setTimeout(function(){
        btn.textContent = btn.dataset.label;
        btn.classList.remove('done');
      }, 1600);
    });
  });
})();
