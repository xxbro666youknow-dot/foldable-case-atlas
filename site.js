(async()=>{
 const sideExcluded=new Set(["HONOR 商店关联 PITAKA（壳制造方未直核）", "Helix（Flipkart 平台标示）"]);
 const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),isCase=location.pathname.endsWith('/case.html'),phoneKey=params.get('phone'),brandParam=params.get('brand')||'',phoneBrand=params.get('phoneBrand')||'';
 const isProductBrowser = Boolean($('#product-browser'));
 const duoKey = 'apple-iphone-duo';
 if (isCase && phoneKey === duoKey) {
  location.replace('duo.html');
  return;
 }
 const norm=s=>(s||'').trim().toLocaleLowerCase(),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
 let data;try{const r=await fetch('catalog.json', {cache: 'no-store'});if(!r.ok)throw Error();data=await r.json()}catch(e){$('#result').textContent='暂时无法加载，请稍后重试。';return}
 const phones=data.phones||[],products=(data.products||[]).filter(p=>p.brand&&!/待核|未核|待判|未明确|未知|无品牌|来源|零售|商家|店铺|店名|不明|未确认|待查|待确认|待验证|待识别|声称|未证|待审|品牌未|疑似|渠道/.test(p.brand)),phoneMap=new Map(phones.map(p=>[p.phone_key,p]));
 const brandAliases = new Map([
  ['loof / looco', 'LOOF'],
  ['imak / 艾美克（壳品牌，非手机厂原厂）', 'IMAK'],
  ['urban armor gear', 'UAG']
 ]);
 const brandName = name => brandAliases.get(norm(name)) || name.trim();
 const brandKey = name => norm(brandName(name));
 const brands = new Map();
 const phoneBrands = new Map();
 const phoneProducts = new Map();
 for (const product of products) {
  if (!phoneMap.has(product.phone_key)) continue;
  phoneProducts.set(product.phone_key, (phoneProducts.get(product.phone_key) || 0) + 1);
  if (sideExcluded.has(product.brand)) continue;
  const key = brandKey(product.brand);
  if (!key) continue;
  if (!brands.has(key)) brands.set(key, brandName(product.brand));
  if (!phoneBrands.has(product.phone_key)) phoneBrands.set(product.phone_key, new Set());
  phoneBrands.get(product.phone_key).add(key);
 }
 const siteBrandCount = $('#site-brand-count');
 const browseCount = $('#browse-count');
 if (browseCount) browseCount.textContent = `${products.length} 条适配记录`;
 let audit = null;
 if (siteBrandCount && !brandParam) {
  siteBrandCount.textContent = `${products.length} 条手机壳适配记录 · ${phones.length} 款机型 · ${brands.size} 个保护壳品牌`;
  siteBrandCount.hidden = false;
  try {
   const response = await fetch('count-audit.json', {cache: 'no-store'});
   if (response.ok) {
    const checked = await response.json();
    if (checked.relationship_count === data.products.length && Number.isInteger(checked.total_counted) && checked.total_counted === checked.non_duo_counted + checked.duo_counted) {
     audit = checked;
     const summary = el('p', 'site-product-count', `已计入 ${audit.total_counted} 件手机壳商品及明确机型变体`);
     const note = el('p', 'site-count-note', `非 Duo ${audit.non_duo_counted} 件 · Duo ${audit.duo_counted} 件。Duo 专题保留 ${audit.duo_display_records} 条原记录；同款颜色、重复卖家和套装内重复壳不累加。`);
     const detail = el('p', 'site-count-note', `核算日期 ${audit.checked_date}。适配记录含尚未计入商品数的条目；随盒壳与配件套装单列。售卖状态以来源页面为准。`);
     siteBrandCount.before(summary);
     siteBrandCount.after(note, detail);
    }
   }
  } catch (_) { /* 数量审计暂不可用时，仍保留品牌、机型与适配记录口径。 */ }
 }
 const phoneSampleCounts = new Map();
 if (audit && Array.isArray(audit.groups)) {
  const productsById = new Map(products.map(product => [product.id, product]));
  for (const group of audit.groups) {
   const coveredPhones = new Set((group.relationship_ids || []).map(id => productsById.get(id)?.phone_key).filter(Boolean));
   for (const key of coveredPhones) phoneSampleCounts.set(key, (phoneSampleCounts.get(key) || 0) + 1);
  }
 }
 const menu=$('#brands');let selectedBrand='',selectedFeature='';const title=$('#title'),input=$('#query'),grid=$('#grid'),result=$('#result'),empty=$('#empty');
 const safeLink=u=>/^https?:\/\//i.test(u||'');
 function picture(url, alt, productSource) {
  const frame = el('div', 'item-visual');
  function placeholder(message) {
   const label = el('span', '', message);
   if (safeLink(productSource)) {
    const link = el('a', 'image-source', '看商品来源 ↗');
    link.href = productSource;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    frame.replaceChildren(label, link);
   } else {
    frame.replaceChildren(label);
   }
  }
  if (typeof url === 'string' && url && !url.startsWith('/') && !url.includes('..')) {
   const image = el('img');
   image.src = url;
   image.alt = alt || '';
   image.loading = 'lazy';
   image.addEventListener('error', () => placeholder('图片加载失败'));
   frame.append(image);
  } else {
   placeholder(productSource ? '商品图未收录' : '暂无图片');
  }
  return frame;
 }
 function price(p){if(p.price===undefined||p.price===null||p.price==='')return '';return [p.currency||'',p.price].join(' ').trim()}
 function productCard(p,showPhone){let a=el('article','item');a.append(picture(p.image,p.product_name,p.product_url));a.append(el('div','item-brand',p.brand||''));a.append(el('div','item-name',p.product_name||''));if(showPhone)a.append(el('div','item-model',phoneMap.get(p.phone_key)?.model||''));let z=price(p);if(z)a.append(el('div','item-price',z));if(p.image_note)a.append(el('div','item-note',p.image_note));if(safeLink(p.product_url)){let link=el('a','item-source','查看来源 ↗');link.href=p.product_url;link.target='_blank';link.rel='noopener noreferrer';a.append(link)}return a}
 function phoneCard(p){let a=el('article','item');let link=el('a');link.href=p.phone_key===duoKey?'duo.html':'case.html?phone='+encodeURIComponent(p.phone_key);link.append(picture(p.image,p.model));a.append(link);let b=el('a','item-brand',p.brand||'');b.href='index.html?phoneBrand='+encodeURIComponent(p.brand||'');a.append(b);let n=el('a','item-name',p.model||'');n.href=link.href;a.append(n);
  const sampleCount = phoneSampleCounts.get(p.phone_key) || 0;
  a.append(el('div', 'item-brand-count', audit ? `已收录 ${sampleCount} 个有效手机壳样本` : '手机壳样本数待核'));
  return a
 }
 function setupProductBrowser() {
  const form = $('#product-filters'), phone = $('#product-phone'), scope = $('#product-scope'), more = $('#product-more');
  const pageSize = 36;
  let filtered = [], visible = 0;
  const sortedPhones = phones.slice().sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'zh-CN', {numeric: true}));
  for (const entry of sortedPhones) {
   const option = el('option', '', `${entry.brand} ${entry.model}（${phoneProducts.get(entry.phone_key) || 0}）`);
   option.value = entry.phone_key;
   phone.append(option);
  }
  if (phoneMap.has(phoneKey)) phone.value = phoneKey;
  const representatives = new Set(audit?.counted_representative_ids || []);
  const members = new Set(audit?.counted_product_ids || []);
  const groupById = new Map((audit?.groups || []).flatMap(group => group.relationship_ids.map(id => [id, group.count_key])));
  const visibleRepresentatives = products.filter(p => representatives.has(p.id)).length;
  const hasCountScope = representatives.size > 0 && visibleRepresentatives === audit?.total_counted;
  $('#product-scope-field').hidden = !hasCountScope;
  if (hasCountScope && params.get('scope') === 'counted') scope.value = 'counted';

  function appendPage() {
   const next = filtered.slice(visible, visible + pageSize);
   for (const product of next) {
    const card = productCard(product, true);
    card.dataset.productId = product.id;
    if (hasCountScope && scope.value !== 'counted' && !representatives.has(product.id)) {
     const status = members.has(product.id) ? '同款合并计数' : '未计入商品数';
     card.append(el('div', 'item-count-status', status));
    }
    grid.append(card);
   }
   visible += next.length;
   const unit = scope.value === 'counted' ? ' 件商品' : ' 条适配记录';
   result.textContent = `共 ${filtered.length}${unit} · 已显示 ${visible} ${scope.value === 'counted' ? '件' : '条'}`;
   empty.hidden = filtered.length > 0;
   more.hidden = visible >= filtered.length;
  }
  function applyFilters() {
   const query = norm(input.value);
   filtered = products.filter(product => {
    if (phone.value && product.phone_key !== phone.value) return false;
    if (scope.value === 'counted' && !members.has(product.id)) return false;
    const model = phoneMap.get(product.phone_key);
    const terms = norm([model?.brand, model?.model, product.brand, brandName(product.brand), product.product_name, product.series].join(' '));
    return !query || query.split(/\s+/).every(term => terms.includes(term));
   });
   if (scope.value === 'counted') {
    // 每组在当前机型与搜索范围内选一条，避免共用壳在其他适配机型下消失。
    const chosenByGroup = new Map();
    for (const product of filtered) {
     const key = groupById.get(product.id);
     if (!chosenByGroup.has(key) || representatives.has(product.id)) chosenByGroup.set(key, product.id);
    }
    filtered = filtered.filter(product => chosenByGroup.get(groupById.get(product.id)) === product.id);
   }
   visible = 0;
   grid.replaceChildren();
   appendPage();
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', event => {
   event.preventDefault();
   input.value = '';
   phone.value = '';
   scope.value = 'all';
   applyFilters();
  });
  input.addEventListener('input', applyFilters);
  phone.addEventListener('change', applyFilters);
  scope.addEventListener('change', applyFilters);
  more.addEventListener('click', appendPage);
  form.hidden = false;
  applyFilters();
 }
 if (isProductBrowser) {
  setupProductBrowser();
  return;
 }
 function asTags(p){return Array.isArray(p.tags)?p.tags:[]}
 function render(){let q=norm(input.value),items;if(isCase){items=products.filter(p=>p.phone_key===phoneKey&&(!selectedBrand||brandKey(p.brand)===brandKey(selectedBrand))&&(!selectedFeature||asTags(p).includes(selectedFeature))&&(!q||norm([p.brand,p.product_name,p.series].join(' ')).includes(q)))}else if(brandParam){items=products.filter(p=>brandKey(p.brand)===brandKey(brandParam)&&(!q||norm([p.product_name,phoneMap.get(p.phone_key)?.model].join(' ')).includes(q)))}else{items=phones.filter(p=>(!phoneBrand||norm(p.brand)===norm(phoneBrand))&&(!q||norm([p.brand,p.model].join(' ')).includes(q))).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}grid.replaceChildren(...items.map(p=>isCase||brandParam?productCard(p,!!brandParam):phoneCard(p)));result.textContent=items.length+(isCase?' 条适配记录':brandParam?' 条商品记录':' 款机型');empty.hidden=items.length!==0}
 if(isCase){let phone=phoneMap.get(phoneKey);title.textContent=phone?.model||'保护壳';$('#phone-brand').textContent=phone?.brand||'';let caseItems=products.filter(p=>p.phone_key===phoneKey);
 const bundleItems = (data.bundles || []).filter(item => item.phone_key === phoneKey && safeLink(item.product_url));
 if (phone && caseItems.length === 0) empty.textContent = bundleItems.length ? '暂未收录独立品牌保护壳' : '这个机型暂未收录保护壳';
 if (bundleItems.length) {
  const bundleList = $('#bundle-items');
  if (bundleList) {
   for (const item of bundleItems) {
    const link = el('a', 'item-source', item.product_name + ' ↗');
    link.href = item.product_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const row = el('li');
    row.append(link);
    bundleList.append(row);
   }
   $('#bundles').hidden = false;
  }
 }
 const modelBrands = [...(phoneBrands.get(phoneKey) || [])].map(key => brands.get(key));
 for(const name of modelBrands.sort((a,b)=>a.localeCompare(b))){let b=el('button','',name);b.onclick=()=>{selectedBrand=name;menu.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));$('#all-brands').classList.remove('on');render()};menu.append(b)}$('#all-brands').onclick=()=>{selectedBrand='';menu.querySelectorAll('button').forEach(x=>x.classList.remove('on'));$('#all-brands').classList.add('on');render()};let ts=new Set(caseItems.flatMap(asTags));for(const t of [...ts].slice(0,18)){let b=el('button','',t);b.onclick=()=>{selectedFeature=selectedFeature===t?'':t;document.querySelectorAll('#features button').forEach(x=>x.classList.toggle('on',x===b&&!!selectedFeature));render()};$('#features').append(b)}}else{if(brandParam)title.textContent=brandParam+' 保护壳';else if(phoneBrand)title.textContent=phoneBrand+' 折叠手机';for(const name of [...brands.values()].sort((a,b)=>a.localeCompare(b))){let a=el('a',brandKey(name)===brandKey(brandParam)?'on':'',name);a.href='index.html?brand='+encodeURIComponent(name);menu.append(a)}}
 $('#mobile-filter').onclick=()=>{let open=$('#sidebar').classList.toggle('open');$('#mobile-filter').setAttribute('aria-expanded',String(open))};input.addEventListener('input',render);render();
})();
