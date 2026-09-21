/* One bridge for all frameworks. Quartz navigation may replace the body. */
(() => {
  if (window.__jthewlBrandHost) return;
  const script = document.currentScript;
  const profile = script?.dataset.brandProfile || 'home';
  const sceneUrl = new URL(`index.html?profile=${encodeURIComponent(profile)}`, script.src).href;
  const ensureFrame = () => {
    document.body.dataset.brandProfile = profile;
    let frame = document.querySelector('iframe[data-jthewl-scene]');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.src = sceneUrl;
      frame.title = '虚空水母与垃圾场背景';
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.dataset.jthewlScene = '';
      frame.dataset.persist = '';
      frame.dataset.brandProfile = profile;
      frame.className = 'jthewl-scene';
      document.body.prepend(frame);
    }
    return frame;
  };
  window.__jthewlBrandHost = { profile, ensureFrame };
  ensureFrame();
  document.addEventListener('nav', ensureFrame);
  if (profile === 'stars') {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let activeCard;
    const resetCard = () => {
      activeCard?.style.removeProperty('--card-rx');
      activeCard?.style.removeProperty('--card-ry');
      activeCard = null;
    };
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || motion.matches) return;
      const card = event.target.closest('main a.term-animate');
      if (activeCard !== card) resetCard();
      if (!card) return;
      activeCard = card;
      const box = card.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - box.left) / box.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - box.top) / box.height - .5));
      card.style.setProperty('--card-rx', `${-y * 9}deg`);
      card.style.setProperty('--card-ry', `${x * 9}deg`);
    }, { passive: true });
    document.addEventListener('pointerout', event => {
      if (activeCard && !activeCard.contains(event.relatedTarget)) resetCard();
    });
    window.addEventListener('blur', resetCard);
    document.addEventListener('scroll', resetCard, true);
    motion.addEventListener('change', resetCard);
  }
  if (profile === 'blog') {
    // A desktop-open directory should not cover the article after rotation.
    const mobile = matchMedia('(max-width: 800px)');
    mobile.addEventListener('change', () => {
      document.querySelectorAll('.explorer').forEach(explorer => {
        explorer.classList.toggle('collapsed', mobile.matches);
        explorer.setAttribute('aria-expanded', String(!mobile.matches));
      });
      document.documentElement.classList.remove('mobile-no-scroll');
    });
  }
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    document.querySelector('iframe[data-jthewl-scene]')?.contentWindow?.postMessage({
      type: 'junkyard-pointer', clientX: event.clientX, clientY: event.clientY,
    }, location.origin);
  }, { passive: true });
})();
