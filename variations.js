'use strict';

/* ==========================================
   Shared utilities
   ========================================== */

const coverLabels = ['₹10L', '₹25L', '₹50L', '₹1Cr'];

const cityPremium = {
  bengaluru: 2000, mumbai: 3000, delhi: 2500, chennai: 1800,
  hyderabad: 1500, kolkata: 1200, pune: 1600, ahmedabad: 1000,
  jaipur: 800, other: 0
};

function calcPremium(age, coverIdx, city, adults, children, parents) {
  const base = 7000;
  const ageFactor  = Math.max(0, (age - 25)) * 120;
  const coverFactor = coverIdx * 800;
  const cityFactor  = cityPremium[city] || 0;
  const familyFactor = ((adults - 1) * 1200) + (children * 800) + (parents * 2000);
  return Math.round(base + ageFactor + coverFactor + cityFactor + familyFactor);
}

function fmtRs(n) {
  if (n >= 100000) {
    const l = n / 100000;
    return '₹\u2009' + (Number.isInteger(l) ? l : l.toFixed(1)) + '\u2009L';
  }
  return '₹\u2009' + n.toLocaleString('en-IN');
}

function fmtImpact(n) {
  return (n >= 0 ? '+' : '') + fmtRs(n);
}

function setSliderProgress(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--progress', pct + '%');
}

function isValidPhone(val) {
  return /^[6-9]\d{9}$/.test(val);
}

/* ==========================================
   Tab switcher
   ========================================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.calculator-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ==========================================
   Searchable select (city dropdown)
   ========================================== */
function initCitySelect(selectId, onChange) {
  const wrap    = document.getElementById(selectId);
  if (!wrap) return;
  const trigger = wrap.querySelector('.searchable-select-trigger');
  const dropdown= wrap.querySelector('.searchable-select-dropdown');
  const textEl  = wrap.querySelector('.searchable-select-text');
  const input   = wrap.querySelector('.searchable-select-input');
  const options = wrap.querySelectorAll('.searchable-select-options li');
  const noRes   = wrap.querySelector('.searchable-select-no-results');

  trigger.addEventListener('click', () => {
    wrap.classList.toggle('open');
    if (wrap.classList.contains('open')) input.focus();
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) wrap.classList.remove('open');
  });

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    let any = false;
    options.forEach(li => {
      const match = li.textContent.toLowerCase().includes(q);
      li.style.display = match ? '' : 'none';
      if (match) any = true;
    });
    noRes.style.display = any ? 'none' : 'block';
  });

  options.forEach(li => {
    li.addEventListener('click', () => {
      wrap.dataset.value = li.dataset.value;
      textEl.textContent = li.textContent;
      wrap.classList.remove('open');
      input.value = '';
      options.forEach(o => o.style.display = '');
      noRes.style.display = 'none';
      if (onChange) onChange(li.dataset.value);
    });
  });
}

/* ==========================================
   Member stepper helper
   ========================================== */
function initStepper(decId, incId, valId, min, max, onChange) {
  const dec = document.getElementById(decId);
  const inc = document.getElementById(incId);
  const val = document.getElementById(valId);
  let count = parseInt(val.textContent);

  function update() {
    val.textContent = count;
    dec.disabled = count <= min;
    if (onChange) onChange(count);
  }

  dec.addEventListener('click', () => { if (count > min) { count--; update(); } });
  inc.addEventListener('click', () => { if (count < max) { count++; update(); } });
  update();

  return () => count;
}

/* ==========================================
   VARIATION A — Mandatory phone in form
   ========================================== */
(function () {
  const ageSlider   = document.getElementById('a-ageSlider');
  const coverSlider = document.getElementById('a-coverSlider');
  const ageValue    = document.getElementById('a-ageValue');
  const coverValue  = document.getElementById('a-coverValue');
  const phone       = document.getElementById('a-phone');
  const phoneWrapper= document.getElementById('a-phoneWrapper');
  const phoneError  = document.getElementById('a-phoneError');
  const cta         = document.getElementById('a-cta');
  const premiumAmt  = document.getElementById('a-premiumAmount');
  const locked      = document.getElementById('a-locked');
  const revealed    = document.getElementById('a-revealed');
  const ageImpact   = document.getElementById('a-ageImpact');
  const cityImpact  = document.getElementById('a-cityImpact');
  const famImpact   = document.getElementById('a-familyImpact');

  let city = 'bengaluru';
  const getAdults   = initStepper('a-adults-dec',   'a-adults-inc',   'a-adults-val',   1, 6);
  const getChildren = initStepper('a-children-dec', 'a-children-inc', 'a-children-val', 0, 6);
  const getParents  = initStepper('a-parents-dec',  'a-parents-inc',  'a-parents-val',  0, 4);

  initCitySelect('a-citySelect', v => { city = v; });

  function updateSliders() {
    ageValue.textContent   = ageSlider.value;
    coverValue.textContent = coverLabels[coverSlider.value];
    setSliderProgress(ageSlider);
    setSliderProgress(coverSlider);
  }

  ageSlider.addEventListener('input', updateSliders);
  coverSlider.addEventListener('input', updateSliders);

  phone.addEventListener('input', () => {
    phoneWrapper.classList.remove('error');
    phoneError.style.display = 'none';
  });

  cta.addEventListener('click', () => {
    if (!isValidPhone(phone.value)) {
      phoneWrapper.classList.add('error');
      phoneError.style.display = 'block';
      phone.focus();
      return;
    }
    const age      = parseInt(ageSlider.value);
    const ci       = parseInt(coverSlider.value);
    const adults   = getAdults();
    const children = getChildren();
    const parents  = getParents();
    const premium  = calcPremium(age, ci, city, adults, children, parents);
    const ageFact  = Math.max(0, (age - 25)) * 120;
    const cityFact = cityPremium[city] || 0;
    const famFact  = ((adults - 1) * 1200) + (children * 800) + (parents * 2000);

    premiumAmt.textContent = fmtRs(premium);
    ageImpact.textContent  = fmtImpact(ageFact);
    cityImpact.textContent = fmtImpact(cityFact);
    famImpact.textContent  = fmtImpact(famFact);

    locked.style.display   = 'none';
    revealed.style.display = 'block';
  });

  updateSliders();
})();

/* ==========================================
   VARIATION B — Results first + WhatsApp
   ========================================== */
(function () {
  const ageSlider   = document.getElementById('b-ageSlider');
  const coverSlider = document.getElementById('b-coverSlider');
  const ageValue    = document.getElementById('b-ageValue');
  const coverValue  = document.getElementById('b-coverValue');
  const premiumAmt  = document.getElementById('b-premiumAmount');
  const ageImpact   = document.getElementById('b-ageImpact');
  const cityImpact  = document.getElementById('b-cityImpact');
  const famImpact   = document.getElementById('b-familyImpact');
  const waBtn       = document.getElementById('b-waBtn');
  const waPhone     = document.getElementById('b-phone');
  const phoneWrapper= document.getElementById('b-phoneWrapper');
  const waSuccess   = document.getElementById('b-waSuccess');

  let city = 'bengaluru';
  const getAdults   = initStepper('b-adults-dec',   'b-adults-inc',   'b-adults-val',   1, 6, recalc);
  const getChildren = initStepper('b-children-dec', 'b-children-inc', 'b-children-val', 0, 6, recalc);
  const getParents  = initStepper('b-parents-dec',  'b-parents-inc',  'b-parents-val',  0, 4, recalc);

  initCitySelect('b-citySelect', v => { city = v; recalc(); });

  document.getElementById('b-cta').addEventListener('click', recalc);

  function recalc() {
    const age      = parseInt(ageSlider.value);
    const ci       = parseInt(coverSlider.value);
    const adults   = getAdults();
    const children = getChildren();
    const parents  = getParents();
    const premium  = calcPremium(age, ci, city, adults, children, parents);
    const ageFact  = Math.max(0, (age - 25)) * 120;
    const cityFact = cityPremium[city] || 0;
    const famFact  = ((adults - 1) * 1200) + (children * 800) + (parents * 2000);

    premiumAmt.textContent = fmtRs(premium);
    ageImpact.textContent  = fmtImpact(ageFact);
    cityImpact.textContent = fmtImpact(cityFact);
    famImpact.textContent  = fmtImpact(famFact);
    ageValue.textContent   = age;
    coverValue.textContent = coverLabels[ci];
    setSliderProgress(ageSlider);
    setSliderProgress(coverSlider);
  }

  ageSlider.addEventListener('input', recalc);
  coverSlider.addEventListener('input', recalc);

  waBtn.addEventListener('click', () => {
    if (!isValidPhone(waPhone.value)) {
      phoneWrapper.classList.add('error');
      return;
    }
    phoneWrapper.classList.remove('error');
    const age     = parseInt(ageSlider.value);
    const ci      = parseInt(coverSlider.value);
    const premium = calcPremium(age, ci, city, getAdults(), getChildren(), getParents());
    const waMsg   = encodeURIComponent(
      `Hi! My estimated health premium is ${fmtRs(premium)}/yr (Age: ${age}, Cover: ${coverLabels[ci]}). Please send me plans.`
    );
    window.open(`https://wa.me/91${waPhone.value}?text=${waMsg}`, '_blank');
    waSuccess.style.display = 'flex';
    setTimeout(() => { waSuccess.style.display = 'none'; }, 5000);
  });

  waPhone.addEventListener('input', () => phoneWrapper.classList.remove('error'));

  recalc();
})();

/* ==========================================
   VARIATION C — Popup gate before result
   ========================================== */
(function () {
  const ageSlider   = document.getElementById('c-ageSlider');
  const coverSlider = document.getElementById('c-coverSlider');
  const ageValue    = document.getElementById('c-ageValue');
  const coverValue  = document.getElementById('c-coverValue');
  const premiumAmt  = document.getElementById('c-premiumAmount');
  const locked      = document.getElementById('c-locked');
  const revealed    = document.getElementById('c-revealed');
  const ageImpact   = document.getElementById('c-ageImpact');
  const cityImpact  = document.getElementById('c-cityImpact');
  const famImpact   = document.getElementById('c-familyImpact');

  const modal       = document.getElementById('c-modal');
  const modalClose  = document.getElementById('c-modalClose');
  const modalSubmit = document.getElementById('c-modalSubmit');
  const modalSkip   = document.getElementById('c-skip');
  const phone       = document.getElementById('c-phone');
  const phoneWrapper= document.getElementById('c-phoneWrapper');
  const phoneError  = document.getElementById('c-phoneError');

  let city = 'bengaluru';
  const getAdults   = initStepper('c-adults-dec',   'c-adults-inc',   'c-adults-val',   1, 6);
  const getChildren = initStepper('c-children-dec', 'c-children-inc', 'c-children-val', 0, 6);
  const getParents  = initStepper('c-parents-dec',  'c-parents-inc',  'c-parents-val',  0, 4);

  initCitySelect('c-citySelect', v => { city = v; });

  function updateSliders() {
    ageValue.textContent   = ageSlider.value;
    coverValue.textContent = coverLabels[coverSlider.value];
    setSliderProgress(ageSlider);
    setSliderProgress(coverSlider);
  }

  ageSlider.addEventListener('input', updateSliders);
  coverSlider.addEventListener('input', updateSliders);

  function showResult() {
    const age      = parseInt(ageSlider.value);
    const ci       = parseInt(coverSlider.value);
    const adults   = getAdults();
    const children = getChildren();
    const parents  = getParents();
    const premium  = calcPremium(age, ci, city, adults, children, parents);
    const ageFact  = Math.max(0, (age - 25)) * 120;
    const cityFact = cityPremium[city] || 0;
    const famFact  = ((adults - 1) * 1200) + (children * 800) + (parents * 2000);

    premiumAmt.textContent = fmtRs(premium);
    ageImpact.textContent  = fmtImpact(ageFact);
    cityImpact.textContent = fmtImpact(cityFact);
    famImpact.textContent  = fmtImpact(famFact);
    locked.style.display   = 'none';
    revealed.style.display = 'block';
  }

  function openModal() {
    phone.value = '';
    phoneWrapper.classList.remove('error');
    phoneError.style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => phone.focus(), 300);
  }

  function closeModal() { modal.style.display = 'none'; }

  document.getElementById('c-cta').addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  modalSubmit.addEventListener('click', () => {
    if (!isValidPhone(phone.value)) {
      phoneWrapper.classList.add('error');
      phoneError.style.display = 'block';
      return;
    }
    closeModal();
    showResult();
  });

  modalSkip.addEventListener('click', () => { closeModal(); showResult(); });

  phone.addEventListener('input', () => {
    phoneWrapper.classList.remove('error');
    phoneError.style.display = 'none';
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  });

  updateSliders();
})();
