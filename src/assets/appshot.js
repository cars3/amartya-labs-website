/* andralabs.org · Apps page · DigiLIB breaks out of the card and flies up
   into the browser's address bar. 200ms after it lands up there, the same
   page follows it to digilib.andralabs.org. */
(function(){
  var name = document.getElementById('appName');
  var cta = document.getElementById('appCta');
  if (!name || !cta) return;

  var HREF = 'https://digilib.andralabs.org';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var busy = false;

  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function easeInOutCubic(t){
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

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

  function launch(){
    if (busy) return;
    busy = true;

    var r = name.getBoundingClientRect();
    /* The address bar sits above the viewport, so the name travels to the top
       edge and a little past it. A short page still gets a visible rise. */
    var dy = Math.min(-80, -(r.top + r.height / 2 + 36));
    var endScale = 0.24;

    var scrim = document.getElementById('appScrim');
    if (scrim) scrim.classList.add('on');

    /* Lift the name above the sticky header for the length of the flight. */
    name.classList.add('lifting');

    tween(760, easeInOutCubic, function(e){
      var sc = 1 - (1 - endScale) * e * e * e;
      name.style.transform = 'translateY(' + (dy * e).toFixed(2) + 'px) scale(' + sc.toFixed(3) + ')';
      name.style.opacity = e > 0.86 ? String(1 - (e - 0.86) / 0.14) : '1';
    }).then(function(){
      name.style.opacity = '0';
      /* The beat between the name reaching the bar and the page following. */
      return sleep(200);
    }).then(function(){
      window.location.href = HREF;
    }).catch(function(){
      window.location.href = HREF;
    });
  }

  if (!reduce.matches){
    cta.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      launch();
    });
  }

  /* Going back from digilib.andralabs.org can restore this page from the
     back-forward cache with the launch state frozen in place: title gone,
     scrim up. Put the card back the way it was. */
  function restore(){
    busy = false;
    name.classList.remove('lifting');
    name.style.transform = '';
    name.style.opacity = '';
    var scrim = document.getElementById('appScrim');
    if (scrim) scrim.classList.remove('on');
  }

  window.addEventListener('pageshow', function(e){
    if (e.persisted) restore();
  });
  window.addEventListener('pagehide', restore);
})();
