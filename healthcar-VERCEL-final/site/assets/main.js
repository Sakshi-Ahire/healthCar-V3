(function(){
  var d=document,root=d.documentElement;
  root.classList.remove('no-js');

  // New pages always start at the top; #anchor links and back/forward keep their own position
  try{var nv=performance.getEntriesByType('navigation')[0];if(!location.hash&&(!nv||nv.type==='navigate'))window.scrollTo({top:0,left:0,behavior:'instant'})}catch(e){}
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header state + mobile menu
  var header=d.querySelector('.site-header'),btn=d.querySelector('.menu-btn'),nav=d.getElementById('nav');
  function onScroll(){header&&header.classList.toggle('scrolled',window.scrollY>8)}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  if(btn&&nav){
    btn.addEventListener('click',function(){
      var o=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',String(!o));nav.classList.toggle('open',!o);
    });
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){btn.click();btn.focus()}});
    nav.addEventListener('click',function(e){if(e.target.closest('a')&&nav.classList.contains('open'))btn.click()});
  }

  // Scroll reveal
  var rv=[].slice.call(d.querySelectorAll('.rv'));
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){io.observe(el)});
  }else rv.forEach(function(el){el.classList.add('in')});

  // Quote rotator (one at a time)
  var stage=d.querySelector('.q-stage');
  if(stage){
    var items=[].slice.call(stage.querySelectorAll('.q-item')),dots=[].slice.call(d.querySelectorAll('.q-dot')),i=0,t=null,paused=false;
    function show(n){
      i=(n+items.length)%items.length;
      items.forEach(function(el,k){el.classList.toggle('on',k===i);el.setAttribute('aria-hidden',k===i?'false':'true')});
      dots.forEach(function(b,k){b.setAttribute('aria-selected',k===i?'true':'false')});
    }
    function loop(){clearInterval(t);if(reduce)return;t=setInterval(function(){if(!paused)show(i+1)},7000)}
    dots.forEach(function(b,k){b.addEventListener('click',function(){show(k);loop()})});
    var prev=d.querySelector('.q-arrow--prev'),next=d.querySelector('.q-arrow--next');
    if(prev)prev.addEventListener('click',function(){show(i-1);loop()});
    if(next)next.addEventListener('click',function(){show(i+1);loop()});
    stage.parentNode.addEventListener('mouseenter',function(){paused=true});
    stage.parentNode.addEventListener('mouseleave',function(){paused=false});
    stage.parentNode.addEventListener('focusin',function(){paused=true});
    stage.parentNode.addEventListener('focusout',function(){paused=false});
    show(0);loop();
  }


  // Services sub-nav: mark the section in view
  var sub=d.querySelectorAll('.subnav a');
  if(sub.length&&'IntersectionObserver' in window){
    var map={};[].slice.call(sub).forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
    var so=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){[].slice.call(sub).forEach(function(a){a.removeAttribute('aria-current')});var a=map[e.target.id];if(a){a.setAttribute('aria-current','true');(function(ul){ul.scrollLeft=Math.max(0,a.offsetLeft-ul.clientWidth/2+a.offsetWidth/2)})(a.closest('ul'))}}
    })},{rootMargin:'-35% 0px -55% 0px'});
    Object.keys(map).forEach(function(id){var el=d.getElementById(id);if(el)so.observe(el)});
  }

  // Contact form: endpoint if configured, otherwise opens the visitor's mail app
  var f=d.getElementById('contact-form');
  if(f){
    var btnEl=f.querySelector('button[type=submit]'),st=f.querySelector('.status');
    function setErr(name,msg){
      var inp=f.elements[name],p=d.getElementById('e-'+name);if(!inp||!p)return;
      p.textContent=msg||'';inp.setAttribute('aria-invalid',msg?'true':'false');
    }
    function check(){
      var v={name:f.elements.name.value.trim(),email:f.elements.email.value.trim(),message:f.elements.message.value.trim()},bad=null;
      var e={name:v.name?'':'Please add your name.',email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)?'':'Please enter a valid email address.',message:v.message.length>2?'':'Please add a short message.'};
      ['name','email','message'].forEach(function(k){setErr(k,e[k]);if(e[k]&&!bad)bad=k});
      return bad;
    }
    // Blur-first validation: show a problem when leaving a field, clear it as soon as it is fixed
    ['name','email','message'].forEach(function(k){
      f.elements[k].addEventListener('blur',function(){if(f.elements[k].value||f.elements[k].getAttribute('aria-invalid')==='true')check()});
      f.elements[k].addEventListener('input',function(){if(f.elements[k].getAttribute('aria-invalid')==='true')check()});
    });
    if(/[?&]error=1/.test(location.search)&&st)st.textContent='Something went wrong sending your message. Please try again or use the booking button.';
    f.addEventListener('submit',function(e){
      var bad=check();
      if(bad){e.preventDefault();f.elements[bad].focus();st.textContent='';return}
      var ep=f.dataset.endpoint;
      if(!ep||!window.fetch)return; // no JS fetch: the form posts normally and the server redirects to the thank-you page
      e.preventDefault();
      var payload={name:f.elements.name.value,email:f.elements.email.value,message:f.elements.message.value,page:location.pathname,company_website:f.elements.company_website.value};
      btnEl.disabled=true;btnEl.setAttribute('aria-busy','true');st.textContent='Sending…';
      fetch(ep,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)}).then(function(r){
        return r.json().catch(function(){return{}}).then(function(j){
          if(r.ok&&j.ok){location.href='/thank-you/';return}
          if(j.errors){Object.keys(j.errors).forEach(function(k){setErr(k,j.errors[k])});st.textContent='';}
          else st.textContent=j.error||'Something went wrong. Please use the booking button instead.';
          btnEl.disabled=false;btnEl.removeAttribute('aria-busy');
        });
      }).catch(function(){st.textContent='Could not reach the server. Please check your connection or use the booking button.';btnEl.disabled=false;btnEl.removeAttribute('aria-busy')});
    });
  }

  // Count-up for plain numerals (35, 21, 25), and pillar rule draw-in
  if('IntersectionObserver' in window&&!reduce){
    var nums=[].slice.call(d.querySelectorAll('.hero-stats .num,.proof .num,.q-stat .num,.survey .num')).filter(function(n){return /^\d+$/.test(n.firstChild&&n.firstChild.nodeType===3?n.firstChild.textContent.trim():'')});
    var co=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;co.unobserve(e.target);
      var n=e.target,t=n.firstChild,end=parseInt(t.textContent,10),st=null;
      function step(ts){st=st||ts;var p=Math.min(1,(ts-st)/1100),v=Math.round(end*(1-Math.pow(1-p,3)));t.textContent=v+(t.textContent.slice(String(end).length)||'');if(p<1)requestAnimationFrame(step)}
      t.textContent='0';requestAnimationFrame(step);
    })},{threshold:.6});
    nums.forEach(function(n){co.observe(n)});
    var po=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');po.unobserve(e.target)}})},{threshold:.3});
    [].forEach.call(d.querySelectorAll('.pillar'),function(el){po.observe(el)});
  }else [].forEach.call(d.querySelectorAll('.pillar'),function(el){el.classList.add('in')});

  // Garden photos: wipe in once, then a slight parallax drift on the tall photo
  var gd=d.querySelector('.garden');
  if(gd){
    if('IntersectionObserver' in window&&!reduce){
      var go=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){gd.classList.add('in');go.disconnect()}})},{threshold:.2});
      go.observe(gd);
      var tall=gd.querySelector('.g-tall img'),tick=false;
      function drift(){tick=false;var r=gd.getBoundingClientRect(),h=window.innerHeight;
        if(r.bottom<0||r.top>h)return;
        var p=(r.top+r.height/2-h/2)/h;tall.style.translate='0 '+(p*-20).toFixed(1)+'px'}
      window.addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(drift)}},{passive:true});
    }else gd.classList.add('in');
  }
})();
