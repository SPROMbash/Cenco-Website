/* Cenco · interacción de la página (sin dependencias) */
(() => {
  'use strict';

  const WHATSAPP_NUMBER = '34639687333';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /*=============== MENÚ MÓVIL ===============*/
  const navMenu = $('#nav-menu');
  const navToggle = $('#nav-toggle');

  const setMenu = (open) => {
    navMenu.classList.toggle('show-menu', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    navToggle.querySelector('i').className = open ? 'ri-close-large-line' : 'ri-menu-3-line';
  };

  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('show-menu')));
  $$('#nav-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('show-menu')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /*=============== HEADER, BOTÓN SUBIR Y ENLACE ACTIVO ===============*/
  const header = $('#header');
  const scrollUp = $('#scroll-up');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY >= 50);
    scrollUp.classList.toggle('show-scroll', window.scrollY >= 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav__link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('active-link', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObserver.observe(s));

  /*=============== FILTRO DE CATÁLOGOS ===============*/
  const filters = $$('.filter');
  const catalogos = $$('.catalogo');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter;
      filters.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      catalogos.forEach((c) => {
        c.hidden = cat !== 'todos' && c.dataset.category !== cat;
      });
    });
  });

  /*=============== GALERÍA + LIGHTBOX ===============*/
  const lightbox = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCaption = $('#lightbox-caption');
  const items = $$('.gallery__item');
  let current = 0;

  const show = (i) => {
    current = (i + items.length) % items.length;
    const img = items[current].querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = items[current].querySelector('span').textContent;
  };

  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      show(i);
      lightbox.showModal();
    });
  });
  $('.lightbox__prev').addEventListener('click', () => show(current - 1));
  $('.lightbox__next').addEventListener('click', () => show(current + 1));
  $('.lightbox__close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  lightbox.addEventListener('close', () => items[current].focus());

  /*=============== FORMULARIO DE PRESUPUESTO → WHATSAPP ===============*/
  const form = $('#form-presupuesto');

  const messages = {
    nombre: 'Escribe tu nombre.',
    producto: 'Elige un tipo de producto.',
    cantidad: 'Indica un número de unidades válido.',
    mensaje: 'Cuéntanos un poco más (mínimo 10 caracteres).',
  };

  const validateField = (field) => {
    const wrapper = field.closest('.form__field');
    const error = wrapper.querySelector('.form__error');
    const valid = field.checkValidity();
    wrapper.classList.toggle('has-error', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    if (error) error.textContent = valid ? '' : (messages[field.name] || field.validationMessage);
    return valid;
  };

  const fields = $$('input, select, textarea', form).filter((f) => f.willValidate);
  fields.forEach((f) => {
    f.addEventListener('blur', () => validateField(f));
    f.addEventListener('input', () => {
      if (f.closest('.form__field').classList.contains('has-error')) validateField(f);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = fields.map(validateField);
    if (results.includes(false)) {
      fields[results.indexOf(false)].focus();
      return;
    }
    const val = (name) => String(form.elements[name].value).trim();
    const details = [
      `• Nombre: ${val('nombre')}`,
      val('empresa') && `• Empresa: ${val('empresa')}`,
      `• Producto: ${val('producto')}`,
      val('cantidad') && `• Unidades: ${val('cantidad')}`,
    ].filter(Boolean);
    const text = ['Hola, me gustaría pedir un presupuesto.', '', ...details, '', val('mensaje')].join('\n');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });

  /*=============== HORARIO: ¿ABIERTO AHORA? (hora de Canarias) ===============*/
  const status = $('#open-status');
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Atlantic/Canary', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    const weekday = !['Sat', 'Sun'].includes(get('weekday'));
    const open = weekday && minutes >= 8 * 60 && minutes < 17 * 60;
    status.textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
    status.classList.add(open ? 'is-open' : 'is-closed');
    status.hidden = false;
  } catch (_) { /* navegador sin soporte de zonas horarias: no se muestra */ }

  /*=============== MAPA BAJO DEMANDA (sin cookies hasta que se pide) ===============*/
  $('#load-map').addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps?q=' +
      encodeURIComponent('Calle Pedro González 14, 38206 San Cristóbal de La Laguna, Santa Cruz de Tenerife') +
      '&output=embed';
    iframe.title = 'Mapa de la ubicación de Cenco';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    $('#map').replaceChildren(iframe);
  });

  /*=============== ANIMACIÓN SUAVE AL APARECER ===============*/
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = $$('.section__title, .section__subtitle, .catalogo, .about__data, .about__images, .gallery li, .presupuesto__intro, .form, .contacto__card, .contacto__map');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealTargets.forEach((el) => el.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // solo una vez: sin repetir al volver a hacer scroll
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /*=============== AÑO DEL FOOTER ===============*/
  $('#year').textContent = new Date().getFullYear();
})();
