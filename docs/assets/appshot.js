/* andralabs.org · Apps page · the DigiLIB name lifts out of the card and into
   the address bar, then the page follows it to digilib.andralabs.org.
   The scroll-in run is a demo: the name comes back. A click on the button is
   the real launch: 200ms after the name lands, the same page navigates. */
(function(){
  var stage = document.getElementById('appStage');
  if (!stage) return;

  var name = document.getElementById('appName');
  var bar = document.getElementById('appDomain');
  var text = document.getElementById('domText');
  var prefix = document.getElementById('domPrefix');
  var cta = document.getElementById('appCta');
  var replay = document.getElementById('appReplay');
  var SUB = 'digilib.';
  var HREF = 'https://digilib.andralabs.org';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var busy = false;
  var mode = 'demo';
  var runId = 0;

  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function easeInCubic(t){ return t * t * t; }
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function tween(ms, ease, frame){
    return new Promise(function(resolve){
      var t0 = 0;
      function step(now){
        if (!t0) t0 = now;
        var t = Math.min(1, (now - t0) / ms);
        frame(ease(t), t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  /* The flight is vertical: from the name's centre up to the middle of the
     address bar, at the point where the subdomain will appear. */
  function measure(){
    var s = stage.getBoundingClientRect();
    var t = name.getBoundingClientRect();
    var b = bar.getBoundingClientRect();
    var a = text.getBoundingClientRect();
    var start = { x: t.left - s.left + t.width / 2, y: t.top - s.top + t.height / 2 };
    var end = { x: a.left - s.left + Math.min(34, a.width / 2), y: b.top - s.top + b.height / 2 };
    return { dx: end.x - start.x, dy: end.y - start.y };
  }

  function showPrefix(){
    if (prefix.textContent === SUB) return;
    prefix.textContent = SUB;
    prefix.classList.remove('show');
    void prefix.offsetWidth;
    prefix.classList.add('show');
  }

  function reset(){
    runId++;
    busy = false;
    prefix.textContent = '';
    prefix.classList.remove('show');
    name.style.transform = '';
    name.style.opacity = '';
    bar.classList.remove('hit');
  }

  function play(nextMode){
    if (busy){
      if (nextMode === 'launch') reset();
      else return;
    }
    busy = true;
    mode = nextMode;
    var id = ++runId;
    var m = measure();
    var titlePx = parseFloat(window.getComputedStyle(name).fontSize) || 44;
    var barPx = parseFloat(window.getComputedStyle(bar).fontSize) || 13;
    var land = Math.max(0.16, Math.min(0.5, barPx / titlePx));

    /* Lift: straight up, accelerating, shrinking into the address bar. */
    tween(380, easeInCubic, function(e){
      if (id !== runId) return;
      name.style.transform = 'translate(' + (m.dx * e).toFixed(2) + 'px,' +
        (m.dy * e).toFixed(2) + 'px) scale(' + (1 + (land - 1) * e).toFixed(3) + ')';
      name.style.opacity = e > 0.72 ? String(1 - (e - 0.72) / 0.28) : '1';
    }).then(function(){
      if (id !== runId) return;

      name.style.opacity = '0';
      bar.classList.add('hit');
      showPrefix();

      /* The brief pause before the page follows the name. */
      return sleep(200);
    }).then(function(){
      if (id !== runId) return;
      if (mode === 'launch'){
        window.location.href = HREF;
        return;
      }

      /* Demo: the name drops back home, the bar keeps the new address. */
      return tween(420, easeOutCubic, function(e){
        if (id !== runId) return;
        name.style.opacity = e < 0.18 ? String(e / 0.18) : '1';
        name.style.transform = 'translate(' + (m.dx * (1 - e)).toFixed(2) + 'px,' +
          (m.dy * (1 - e)).toFixed(2) + 'px) scale(' + (land + (1 - land) * e).toFixed(3) + ')';
      });
    }).then(function(){
      if (id !== runId || mode === 'launch') return;
      name.style.transform = '';
      name.style.opacity = '';
      busy = false;
    }).catch(function(){
      if (mode !== 'launch') reset();
    });
  }

  function settle(){
    prefix.textContent = SUB;
    name.style.transform = '';
    name.style.opacity = '';
    busy = false;
  }

  if (reduce.matches){
    settle();
    if (replay) replay.hidden = true;
  } else if ('IntersectionObserver' in window){
    var seen = false;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting || seen) return;
        seen = true;
        io.disconnect();
        var start = function(){ setTimeout(function(){ play('demo'); }, 360); };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
        else start();
      });
    }, { threshold: 0.55 });
    io.observe(stage);
  } else {
    setTimeout(function(){ play('demo'); }, 900);
  }

  if (cta){
    cta.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      play('launch');
    });
  }

  if (replay){
    replay.addEventListener('click', function(){
      reset();
      setTimeout(function(){ play('demo'); }, 80);
    });
  }

  window.addEventListener('resize', function(){
    if (busy && mode !== 'launch') reset();
  });
})();
