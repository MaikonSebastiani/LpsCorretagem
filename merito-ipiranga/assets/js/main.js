// IMPORTANTE: substitua pelo mesmo número de WhatsApp usado no site atual.
// Formato: código do país + DDD + número, somente dígitos. Ex.: 5511999999999
const WHATSAPP_NUMBER = '5511999999999';

const modal = document.getElementById('leadModal');
const form = document.getElementById('leadForm');
const progressBar = document.getElementById('progressBar');
const steps = [...document.querySelectorAll('.form-step')];
let currentStep = 1;

function setStep(step){
  currentStep = Math.max(1, Math.min(3, step));
  steps.forEach(el => el.classList.toggle('is-active', Number(el.dataset.step) === currentStep));
  progressBar.style.width = `${currentStep * 33.333}%`;
}

function openLead(trigger){
  const planta = trigger?.dataset?.planta || '';
  document.getElementById('plantaInteresse').value = planta;
  setStep(1);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  setTimeout(()=>document.getElementById('renda')?.focus(),80);
}
function closeLead(){
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.js-open-lead').forEach(btn => btn.addEventListener('click',()=>openLead(btn)));
document.querySelectorAll('.js-close-lead').forEach(btn => btn.addEventListener('click',closeLead));
document.querySelectorAll('.js-next').forEach(btn => btn.addEventListener('click',()=>{
  const active = steps[currentStep-1];
  const required = [...active.querySelectorAll('[required]')];
  const radios = [...active.querySelectorAll('input[type="radio"][required]')];
  const validRadio = radios.length === 0 || radios.some(r=>r.checked);
  const validInputs = required.filter(el=>el.type!=='radio').every(el=>el.checkValidity());
  if(!validRadio || !validInputs){
    active.querySelector(':invalid')?.reportValidity();
    return;
  }
  setStep(currentStep+1);
}));
document.querySelectorAll('.js-prev').forEach(btn => btn.addEventListener('click',()=>setStep(currentStep-1)));

document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLead()});

form.addEventListener('submit',e=>{
  e.preventDefault();
  if(!form.checkValidity()){ form.reportValidity(); return; }
  const renda = document.getElementById('renda').value.trim();
  const objetivo = form.querySelector('input[name="objetivo"]:checked')?.value || '';
  const fgts = document.getElementById('fgts').checked ? 'Sim' : 'Não / não sei';
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const planta = document.getElementById('plantaInteresse').value.trim();
  const msg = [
    'Olá! Tenho interesse no Mérito Ipiranga.',
    planta ? `Planta de interesse: ${planta}` : '',
    `Nome: ${nome}`,
    `Meu WhatsApp: ${telefone}`,
    `Renda familiar aproximada: ${renda}`,
    `Objetivo: ${objetivo}`,
    `FGTS disponível: ${fgts}`,
    'Gostaria de saber quais unidades e condições fazem sentido para o meu perfil.'
  ].filter(Boolean).join('\n');
  if(WHATSAPP_NUMBER === '5511999999999'){
    alert('Antes de publicar, configure o seu número de WhatsApp em assets/js/main.js.');
    return;
  }
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuToggle?.addEventListener('click',()=>{
  const open = nav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded',String(open));
});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('is-open')));

const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Máscaras leves, sem dependências externas.
const renda = document.getElementById('renda');
renda?.addEventListener('input',()=>{
  const digits = renda.value.replace(/\D/g,'');
  if(!digits){renda.value='';return}
  renda.value = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(Number(digits));
});
const tel = document.getElementById('telefone');
tel?.addEventListener('input',()=>{
  let v=tel.value.replace(/\D/g,'').slice(0,11);
  if(v.length>2) v=`(${v.slice(0,2)}) ${v.slice(2)}`;
  if(v.replace(/\D/g,'').length>6){
    const d=v.replace(/\D/g,'');
    v=`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }
  tel.value=v;
});
