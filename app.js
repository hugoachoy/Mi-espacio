const STORE='mi-espacio-v1';
const emptyData={reminders:[],shopping:[],meds:[],links:[],movies:[],codes:[]};
let data=loadData(),page='inicio',activeList=null;
function loadData(){try{return {...emptyData,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return structuredClone(emptyData)}}
function save(){localStorage.setItem(STORE,JSON.stringify(data));render()}
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateFmt=v=>v?new Date(v+'T12:00:00').toLocaleDateString('es-AR'):'';
const today=new Date();$('#today-label').textContent=today.toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'});
const configs={recordatorios:{title:'Recordatorios',desc:'Fechas, horarios y cosas que no querés olvidar.',key:'reminders',icon:'◷',add:'Nuevo recordatorio'},compras:{title:'Listas de compras',desc:'Organizá lo que necesitás comprar en cada lugar.',key:'shopping',icon:'☷',add:'Nueva lista'},medicacion:{title:'Medicación',desc:'Controlá existencias, vencimientos y próximos pedidos.',key:'meds',icon:'✚',add:'Agregar medicamento'},enlaces:{title:'Enlaces y videos',desc:'Guardá páginas y videos que quieras encontrar fácilmente.',key:'links',icon:'↗',add:'Guardar enlace o video'},peliculas:{title:'Películas y series',desc:'Una biblioteca personal de lo que querés ver y ya viste.',key:'movies',icon:'▣',add:'Agregar título'},codigos:{title:'Códigos útiles',desc:'Tené a mano códigos y datos que necesitás consultar.',key:'codes',icon:'⌘',add:'Guardar código'}};
function go(p){page=p;document.body.classList.remove('mobile-menu-open');document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===p));render()}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
$('#mobile-menu').onclick=()=>document.body.classList.toggle('mobile-menu-open');
$('#quick-add').onclick=()=>quickAdd();
function heading(title,desc,btn){return `<div class="page-heading"><div><div class="eyebrow">TU ORGANIZACIÓN PERSONAL</div><h1>${title}</h1><p>${desc}</p></div>${btn?`<button class="primary-btn" onclick="openForm('${page}')">＋ ${btn}</button>`:''}</div>`}
function render(){ $('#page-name').textContent=page==='inicio'?'Inicio':configs[page].title; $('#page-content').innerHTML=page==='inicio'?dashboard():listPage(page); }
function dashboard(){const upcoming=data.reminders.filter(x=>!x.done).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4);const low=data.meds.filter(x=>Number(x.stock)<=Number(x.min||0));const openLists=data.shopping.filter(x=>!x.done);return `${heading('Un lugar para todo.','Tu espacio personal para organizar, recordar y encontrar.')}<div class="stats-grid"><div class="stat-card" role="button" tabindex="0" style="cursor:pointer" aria-label="Ver recordatorios pendientes" onclick="go('recordatorios')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();go('recordatorios')}"><div class="stat-top">Recordatorios pendientes <span class="stat-icon">◷</span></div><div class="stat-number">${data.reminders.filter(x=>!x.done).length}</div><div class="stat-foot">Por resolver</div></div><div class="stat-card"><div class="stat-top">Listas activas <span class="stat-icon">☷</span></div><div class="stat-number">${openLists.length}</div><div class="stat-foot">Lugares de compra</div></div><div class="stat-card"><div class="stat-top">Medicamentos <span class="stat-icon">✚</span></div><div class="stat-number">${data.meds.length}</div><div class="stat-foot">En seguimiento</div></div><div class="stat-card"><div class="stat-top">Para reponer <span class="stat-icon">!</span></div><div class="stat-number">${low.length}</div><div class="stat-foot">En o debajo del mínimo</div></div></div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Próximos recordatorios</h2><button class="subtle-link" onclick="go('recordatorios')">Ver todos →</button></div>${upcoming.length?`<div class="list-stack">${upcoming.map(x=>`<div class="mini-row" role="button" tabindex="0" onclick="openReminder(${data.reminders.indexOf(x)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openReminder(${data.reminders.indexOf(x)})}"><span class="row-dot"></span><div class="row-main"><strong>${esc(x.title)}</strong><small>${esc(x.note||'Sin detalles')}</small></div><span class="row-date">${dateFmt(x.date)} ${esc(x.time||'')}</span></div>`).join('')}</div>`:`<div class="empty-state"><div class="empty-icon">◷</div><strong>Todo despejado por ahora</strong><p>Agregá un recordatorio para que no se te pase nada.</p><button class="secondary-btn" onclick="openForm('recordatorios')">Crear recordatorio</button></div>`}</section><section class="panel"><div class="panel-head"><h2>Accesos rápidos</h2><span class="tag">AGREGAR</span></div><div class="quick-grid"><button class="quick-tile" onclick="openForm('recordatorios')"><span class="tile-icon">◷</span><strong>Recordatorio</strong><small>Agendar fecha y hora</small></button><button class="quick-tile" onclick="openForm('compras')"><span class="tile-icon">☷</span><strong>Lista de compras</strong><small>Organizar por lugar</small></button><button class="quick-tile" onclick="openForm('medicacion')"><span class="tile-icon">✚</span><strong>Medicamento</strong><small>Controlar existencias</small></button><button class="quick-tile" onclick="openForm('enlaces')"><span class="tile-icon">↗</span><strong>Guardar enlace</strong><small>Web o YouTube</small></button></div></section></div><h2 class="section-title">Para revisar</h2><div class="cards-grid"><div class="item-card"><div class="item-symbol">✚</div><div class="item-content"><strong>Reposición de medicación</strong><p>${low.length?`${low.length} producto(s) llegaron al stock mínimo.`:'No hay medicamentos por debajo del mínimo.'}</p><button class="subtle-link" onclick="go('medicacion')">Revisar medicación →</button></div></div><div class="item-card"><div class="item-symbol">▤</div><div class="item-content"><strong>Tu biblioteca personal</strong><p>${data.links.length} enlaces y videos · ${data.movies.length} películas y series · ${data.codes.length} códigos.</p><button class="subtle-link" onclick="go('enlaces')">Abrir biblioteca →</button></div></div></div>`}
function listPage(p){const c=configs[p],arr=data[c.key];let body='';if(p==='recordatorios'){body=arr.length?'<div class="cards-grid">'+arr.map((x,i)=>'<article class="item-card reminder-card '+(x.done?'is-done':'')+'" role="button" tabindex="0" onclick="openReminder('+i+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openReminder('+i+')}"><div class="item-symbol">◷</div><div class="item-content"><strong>'+esc(x.title)+'</strong>'+(x.done?'<span class="reminder-status">REALIZADO</span>':'')+'<p>'+dateFmt(x.date)+' '+esc(x.time||'')+'</p><div class="item-meta">'+esc(x.advance?'Aviso anticipado: '+x.advance:'Sin anticipación configurada')+'</div><div class="item-actions" style="margin-top:10px"><button class="secondary-btn" onclick="event.stopPropagation();openReminder('+i+')">Ver detalle</button><button class="small-icon-btn" onclick="event.stopPropagation();editItem(\'recordatorios\','+i+')">✎</button></div></div></article>').join('')+'</div>':empty(c.icon,'Todavía no hay recordatorios.','Creá uno para agendar una fecha importante.');}else if(p==='compras'){body=arr.length?`<div class="cards-grid">${arr.map((x,i)=>`<article class="item-card"><div class="item-symbol">☷</div><div class="item-content"><strong>${esc(x.name)}</strong><p>${x.items.filter(y=>y.done).length} de ${x.items.length} artículos comprados</p><div class="med-stock"><span style="width:${x.items.length?100*x.items.filter(y=>y.done).length/x.items.length:0}%"></span></div><div class="item-meta">${esc(x.place||'Lugar sin especificar')}</div><div class="item-actions" style="margin-top:10px"><button class="secondary-btn" onclick="openShopping(${i})">Abrir lista</button><button class="small-icon-btn" onclick="deleteItem('shopping',${i})">×</button></div></div></article>`).join('')}</div>`:empty(c.icon,'Todavía no hay listas de compras.','Creá una lista para un comercio o lugar.');}else if(p==='medicacion'){body=arr.length?`<div class="cards-grid">${arr.map((x,i)=>`<article class="item-card"><div class="item-symbol">✚</div><div class="item-content"><strong>${esc(x.name)}</strong><p>${esc(x.presentation||'')} · Stock: ${esc(x.stock||'0')} ${esc(x.unit||'unidades')}</p><div class="item-meta">Mínimo: ${esc(x.min||'0')} · Vencimiento: ${dateFmt(x.expiry)||'No indicado'}</div><div class="item-actions" style="margin-top:10px"><button class="small-icon-btn" onclick="editItem('medicacion',${i})">✎</button><button class="small-icon-btn" onclick="deleteItem('meds',${i})">×</button></div></div></article>`).join('')}</div>`:empty(c.icon,'Todavía no agregaste medicamentos.','Registrá existencias y vencimientos.');}else{body=arr.length?`<div class="cards-grid">${arr.map((x,i)=>`<article class="item-card"><div class="item-symbol">${c.icon}</div><div class="item-content"><strong>${esc(x.title||x.name)}</strong><p>${esc(x.description||x.note||x.url||x.code||'')}</p><div class="item-meta">${esc(x.category||x.type||'')}</div>${x.url?`<p><a href="${esc(x.url)}" target="_blank" rel="noopener">Abrir enlace ↗</a></p>`:''}<div class="item-actions" style="margin-top:9px"><button class="small-icon-btn" onclick="editItem('${p}',${i})">✎</button><button class="small-icon-btn" onclick="deleteItem('${c.key}',${i})">×</button></div></div></article>`).join('')}</div>`:empty(c.icon,`Todavía no hay elementos en ${c.title.toLowerCase()}.`,'Agregá el primero para empezar.');}
return `${heading(c.title,c.desc,c.add)}<div class="toolbar"><input class="search-input" id="filter-input" placeholder="Buscar en ${c.title.toLowerCase()}..." oninput="filterCards(this.value)"></div><div id="list-results">${body}</div>`}
async function openReminderFromNotification(){
 const params=new URLSearchParams(location.search);
 const reminderHash=params.get('reminder');
 if(!reminderHash)return;
 params.delete('reminder');
 const cleanUrl=location.pathname+(params.toString()?'?'+params.toString():'')+location.hash;
 history.replaceState(null,'',cleanUrl);
 try{
  for(let i=0;i<data.reminders.length;i++){
   const x=data.reminders[i];
   const base=JSON.stringify({
    title:String(x.title??''),
    date:String(x.date??''),
    time:String(x.time??''),
    advance:String(x.advance??''),
    note:String(x.note??'')
   });
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(base));
   const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   if(fingerprint===reminderHash){
    go('recordatorios');
    openReminder(i);
    return;
   }
  }
  toast('El recordatorio de esta notificación ya no está disponible');
 }catch(err){console.error('No se pudo abrir el recordatorio desde la notificación:',err)}
}
function openReminder(i){const x=data.reminders[i];if(!x)return;$('#modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><div><div class="eyebrow">DETALLE DEL RECORDATORIO</div><h2>${esc(x.title)}</h2></div><button class="close-btn" onclick="closeModal()">×</button></div><div class="form-grid"><div class="form-field"><label>Fecha</label><div class="form-control">${dateFmt(x.date)||'Sin fecha'}</div></div><div class="form-field"><label>Horario</label><div class="form-control">${esc(x.time||'Sin horario')}</div></div><div class="form-field full"><label>Anticipación del aviso</label><div class="form-control">${esc(x.advance||'No configurada')}</div></div><div class="form-field full"><label>Detalles</label><div class="form-control" style="min-height:64px;white-space:pre-wrap">${esc(x.note||'Sin detalles adicionales')}</div></div><div class="form-field full"><label>Estado</label><div class="form-control">${x.done?'Realizado':'Pendiente'}</div></div></div><div class="form-actions" style="flex-wrap:wrap"><button class="secondary-btn" onclick="closeModal();editItem('recordatorios',${i})">Editar</button>${x.done?'':`<button class="secondary-btn" onclick="data.reminders[${i}].done=true;closeModal();save();toast('Recordatorio realizado')">Marcar realizado</button>`}<button class="secondary-btn" onclick="closeModal();deleteItem('reminders',${i})">Eliminar</button><button class="primary-btn" onclick="closeModal()">Cerrar</button></div></div></div>`}
function empty(icon,title,desc){return `<div class="empty-state"><div class="empty-icon">${icon}</div><strong>${title}</strong><p>${desc}</p></div>`}
function filterCards(q){const cards=[...document.querySelectorAll('#list-results .item-card')];cards.forEach(el=>el.style.display=el.innerText.toLowerCase().includes(q.toLowerCase())?'':'none')}
function fields(p,x={}){const f=(label,key,type='text',placeholder='',full=false)=>`<div class="form-field ${full?'full':''}"><label>${label}</label><input class="form-control" name="${key}" type="${type}" value="${esc(x[key]||'')}" placeholder="${placeholder}" ${key==='title'||key==='name'?'required':''}></div>`;const ta=(label,key,full=true)=>`<div class="form-field ${full?'full':''}"><label>${label}</label><textarea class="form-control" name="${key}" rows="2">${esc(x[key]||'')}</textarea></div>`;
if(p==='recordatorios')return f('Qué tenés que recordar','title','text','Ej. Retirar un pedido',true)+f('Fecha','date','date')+f('Horario','time','time')+f('Avisarme con anticipación','advance','text','Ej. 30 minutos, 1 día')+ta('Detalles','note');
if(p==='compras')return f('Nombre de la lista','name','text','Ej. Compras del súper',true)+f('Lugar o comercio','place','text','Ej. Supermercado',true)+ta('Notas','note');
if(p==='medicacion')return f('Nombre del medicamento','name','text','Nombre',true)+f('Presentación','presentation','text','Ej. Caja x 30 comprimidos')+f('Stock actual','stock','number','0')+f('Unidad','unit','text','unidades')+f('Stock mínimo','min','number','0')+f('Fecha de vencimiento','expiry','date')+f('Próximo pedido','orderDate','date')+f('Farmacia / proveedor','supplier','text','')+ta('Notas','note');
if(p==='enlaces')return f('Título','title','text','Nombre del sitio o video',true)+f('Tipo','type','text','Web / YouTube')+f('Dirección URL','url','url','https://...',true)+f('Categoría','category','text','')+ta('Descripción o nota','description');
if(p==='peliculas')return f('Título','title','text','Nombre de la película o serie',true)+f('Tipo','type','text','Película / Serie')+f('Año','year','number','')+f('Plataforma','platform','text','')+f('Estado','status','text','Pendiente / Viendo / Vista')+f('Género','category','text','')+ta('Comentario personal','description');
return f('Nombre','name','text','Nombre del código o aplicación',true)+f('Código','code','text','Código para copiar',true)+f('Categoría','category','text','')+f('Enlace opcional','url','url','https://...',true)+ta('Descripción','description');}
function openForm(p,idx=null){const c=configs[p],x=idx!==null?data[c.key][idx]:{};$('#modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><form class="modal" onsubmit="submitForm(event,'${p}',${idx===null?'null':idx})"><div class="modal-head"><h2>${idx===null?c.add:'Editar elemento'}</h2><button type="button" class="close-btn" onclick="closeModal()">×</button></div><div class="form-grid">${fields(p,x)}</div><div class="form-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button class="primary-btn" type="submit">Guardar</button></div></form></div>`}
function submitForm(e,p,idx){e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());const key=configs[p].key;if(p==='compras'&&idx===null)obj.items=[];if(idx===null)data[key].unshift(obj);else data[key][idx]={...data[key][idx],...obj};closeModal();save();toast('Guardado correctamente');}
function closeModal(){$('#modal-root').innerHTML=''}function editItem(p,i){openForm(p,i)}function deleteItem(key,i){if(confirm('¿Querés eliminar este elemento?')){data[key].splice(i,1);save();toast('Elemento eliminado')}}
function quickAdd(){const opts=Object.entries(configs).map(([p,c])=>`<button class="quick-tile" onclick="closeModal();openForm('${p}')"><span class="tile-icon">${c.icon}</span><strong>${c.title}</strong><small>${c.add}</small></button>`).join('');$('#modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h2>¿Qué querés agregar?</h2><button class="close-btn" onclick="closeModal()">×</button></div><div class="quick-grid">${opts}</div></div></div>`}
function openShopping(i){activeList=i;const x=data.shopping[i];$('#modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><div><h2>${esc(x.name)}</h2><small style="color:#8a949e">${esc(x.place||'')}</small></div><button class="close-btn" onclick="closeModal()">×</button></div><form onsubmit="addShoppingItem(event)"><div style="display:flex;gap:8px"><input class="form-control" name="item" placeholder="Agregar artículo..." required><input class="form-control" name="qty" placeholder="Cantidad" style="max-width:95px"><button class="primary-btn">＋</button></div></form><div style="margin-top:15px">${x.items.map((it,j)=>`<div class="check-row ${it.done?'done':''}"><input type="checkbox" ${it.done?'checked':''} onchange="toggleShopping(${i},${j})"><span class="check-name">${esc(it.name)}</span><span class="check-qty">${esc(it.qty||'')}</span><button class="small-icon-btn" onclick="removeShoppingItem(${i},${j})">×</button></div>`).join('')||'<p style="color:#89939e;font-size:12px">Todavía no agregaste artículos.</p>'}</div><div class="form-actions"><button class="secondary-btn" onclick="closeModal()" type="button">Cerrar</button></div></div></div>`}
function addShoppingItem(e){e.preventDefault();const f=new FormData(e.target);data.shopping[activeList].items.push({name:f.get('item'),qty:f.get('qty'),done:false});openShopping(activeList);saveQuiet()}
function toggleShopping(i,j){data.shopping[i].items[j].done=!data.shopping[i].items[j].done;openShopping(i);saveQuiet()}
function removeShoppingItem(i,j){data.shopping[i].items.splice(j,1);openShopping(i);saveQuiet()}
function saveQuiet(){localStorage.setItem(STORE,JSON.stringify(data));}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
$('#export-btn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mi-espacio-respaldo.json';a.click();URL.revokeObjectURL(a.href);toast('Copia de seguridad descargada')};
$('#import-file').onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{data={...emptyData,...JSON.parse(r.result)};save();toast('Copia restaurada')}catch{alert('El archivo no tiene un formato válido.')}};r.readAsText(file);e.target.value=''};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();


/* --- Cuenta y sincronización segura con Supabase --- */
const SUPABASE_URL='https://hpzhsiqghcaaxfrtrdvn.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_4nogSoAlGTJL7v22R2hXPg_gEzVDw_h';
const VAPID_PUBLIC_KEY='BO52i93wpkebzUtSrBm-0IV98t8SEvpEcc9M-RdoSEk9YocilU1q0dOXjSFGD9azebI3M8d4sJ2Vc0hcvDS3eD8';
let cloudClient=null, cloudUser=null, cloudReady=false, cloudApplying=false, syncTimer=null, syncBusy=false, localChangePending=false;
function localHasContent(){return Object.values(data).some(v=>Array.isArray(v)&&v.length>0)}
function setAccountLabel(label){const b=$('#account-btn');if(b)b.title=label}
function accountDialog(){
 const logged=!!cloudUser;
 $('#modal-root').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><div><div class="eyebrow">MI ESPACIO EN TUS DISPOSITIVOS</div><h2>${logged?'Cuenta y sincronización':'Conectar MI ESPACIO'}</h2></div><button class="close-btn" onclick="closeModal()">×</button></div>
 ${logged?`<p class="account-copy">Sesión iniciada con <strong>${esc(cloudUser.email||'tu cuenta')}</strong>.</p><p class="account-status" id="account-sync-status">Consultando sincronización…</p><div class="form-actions"><button class="secondary-btn" onclick="enablePushNotifications()">Activar notificaciones en este dispositivo</button><button class="secondary-btn" onclick="closeModal();syncNow(true)">Sincronizar ahora</button><button class="secondary-btn" onclick="signOut()">Cerrar sesión</button><button class="primary-btn" onclick="closeModal()">Listo</button></div>`:`<p class="account-copy">Usá el mismo correo y contraseña en Chrome del celular y de la computadora. Así ambos accederán a tus datos.</p><form class="account-form" onsubmit="authenticate(event)"><div class="form-field"><label>Correo electrónico</label><input class="form-control" type="email" name="email" autocomplete="email" required></div><div class="form-field"><label>Contraseña</label><input class="form-control" type="password" name="password" autocomplete="current-password" minlength="6" required></div><div id="auth-error" class="auth-error"></div><div class="form-actions"><button type="button" class="secondary-btn" onclick="closeModal()">Cancelar</button><button type="button" class="secondary-btn" onclick="authenticate(event,'signup')">Crear cuenta</button><button class="primary-btn" type="submit">Ingresar</button></div></form>`}</div></div>`;
}
async function authenticate(e,mode='signin'){
 if(e)e.preventDefault();
 const form=$('#modal-root form');if(!form)return;
 const fd=new FormData(form),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
 const err=$('#auth-error');if(err)err.textContent='';
 const btn=form.querySelector('button[type="submit"]');if(btn)btn.disabled=true;
 const result=mode==='signup'?await cloudClient.auth.signUp({email,password}):await cloudClient.auth.signInWithPassword({email,password});
 if(btn)btn.disabled=false;
 if(result.error){if(err)err.textContent=result.error.message;return}
 if(mode==='signup'&&!result.data.session){if(err)err.textContent='Cuenta creada. Revisá tu correo para confirmar el registro y después ingresá.';return}
 closeModal();toast(mode==='signup'?'Cuenta creada':'Sesión iniciada');
}
async function signOut(){await cloudClient.auth.signOut();cloudUser=null;cloudReady=false;setAccountLabel('Ingresar / crear cuenta');closeModal();toast('Sesión cerrada')}
function urlBase64ToUint8Array(base64String){
 const padding='='.repeat((4-base64String.length%4)%4);
 const raw=atob((base64String+padding).replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from([...raw].map(ch=>ch.charCodeAt(0)));
}
async function enablePushNotifications(){
 if(!cloudUser||!cloudClient){toast('Primero iniciá sesión');return}
 if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window)){alert('Este navegador no admite notificaciones push. Probá con Chrome actualizado.');return}
 try{
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){alert('No se concedió permiso para las notificaciones. Podés habilitarlo desde la configuración del navegador.');return}
  const registration=await navigator.serviceWorker.ready;
  let subscription=await registration.pushManager.getSubscription();
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
  const payload={user_id:cloudUser.id,endpoint:subscription.endpoint,subscription:subscription.toJSON(),updated_at:new Date().toISOString()};
  const {error}=await cloudClient.from('mi_espacio_push_subscriptions').upsert(payload,{onConflict:'endpoint'});
  if(error)throw error;
  toast('Notificaciones habilitadas en este dispositivo');
  const status=$('#account-sync-status');if(status)status.textContent+=' · Notificaciones activadas en este dispositivo';
 }catch(err){console.error(err);alert('No se pudieron activar las notificaciones: '+(err.message||err))}
}
function setSyncMessage(msg){const el=$('#account-sync-status');if(el)el.textContent=msg}
async function syncNow(showToast=false){
 if(!cloudClient||!cloudUser||syncBusy)return;
 if(cloudReady&&localChangePending){await pushCloud();return}
 syncBusy=true;
 try{
  const {data:row,error}=await cloudClient.from('mi_espacio').select('datos,updated_at').eq('user_id',cloudUser.id).maybeSingle();
  if(error)throw error;
  if(!row){
   const {error:upErr}=await cloudClient.from('mi_espacio').upsert({user_id:cloudUser.id,datos:data,updated_at:new Date().toISOString()});
   if(upErr)throw upErr;
  }else{
   cloudApplying=true;data={...emptyData,...(row.datos||{})};localStorage.setItem(STORE,JSON.stringify(data));render();cloudApplying=false;
  }
  cloudReady=true;setSyncMessage('Sincronización activa. Última comprobación: '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}));
  if(showToast)toast('Datos sincronizados');
 }catch(err){cloudApplying=false;setSyncMessage('No se pudo sincronizar: '+err.message);if(showToast)toast('Error de sincronización')}
 finally{syncBusy=false}
}
async function pushCloud(){
 if(!cloudReady||!cloudUser||cloudApplying)return;
 try{const {error}=await cloudClient.from('mi_espacio').upsert({user_id:cloudUser.id,datos:data,updated_at:new Date().toISOString()});if(error)throw error;localChangePending=false;setSyncMessage('Sincronizado · '+new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}))}
 catch(err){setSyncMessage('Pendiente de sincronizar: '+err.message)}
}
function scheduleCloudSync(){if(!cloudReady||cloudApplying)return;localChangePending=true;clearTimeout(syncTimer);syncTimer=setTimeout(pushCloud,700)}
async function startCloudSession(session){
 const nextUser=session?.user||null;
 if(!nextUser){cloudUser=null;cloudReady=false;setAccountLabel('Ingresar / crear cuenta');return}
 cloudUser=nextUser;setAccountLabel('Cuenta: '+(cloudUser.email||'conectada'));
 await syncNow(false);
 await openReminderFromNotification();
}
async function initCloud(){
 if(!window.supabase?.createClient){setAccountLabel('No se pudo cargar el servicio de sincronización');return}
 cloudClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 const {data:sessionData}=await cloudClient.auth.getSession();
 await startCloudSession(sessionData.session);
 cloudClient.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>startCloudSession(session),0)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&cloudUser)syncNow(false)});
 window.addEventListener('focus',()=>{if(cloudUser)syncNow(false)});
 setInterval(()=>{if(cloudUser&&!document.hidden)syncNow(false)},15000);
}
const originalSave=save;
save=function(){localStorage.setItem(STORE,JSON.stringify(data));render();scheduleCloudSync()};
saveQuiet=function(){localStorage.setItem(STORE,JSON.stringify(data));scheduleCloudSync()};
$('#account-btn')?.addEventListener('click',accountDialog);
initCloud();
