(async()=>{
 const sideExcluded=new Set(["HONOR 商店关联 PITAKA（壳制造方未直核）", "Helix（Flipkart 平台标示）"]);
 const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),isCase=location.pathname.endsWith('/case.html'),phoneKey=params.get('phone'),brandParam=params.get('brand')||'',phoneBrand=params.get('phoneBrand')||'';
 const duoKey = 'apple-iphone-duo';
 if (isCase && phoneKey === duoKey) {
  location.replace('duo.html');
  return;
 }
 const norm=s=>(s||'').trim().toLocaleLowerCase(),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
 let data;try{const r=await fetch('catalog.json');if(!r.ok)throw Error();data=await r.json()}catch(e){$('#result').textContent='暂时无法加载，请稍后重试。';return}
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
 for (const product of products) {
  if (!phoneMap.has(product.phone_key) || sideExcluded.has(product.brand)) continue;
  const key = brandKey(product.brand);
  if (!key) continue;
  if (!brands.has(key)) brands.set(key, brandName(product.brand));
  if (!phoneBrands.has(product.phone_key)) phoneBrands.set(product.phone_key, new Set());
  phoneBrands.get(product.phone_key).add(key);
 }
 const siteBrandCount = $('#site-brand-count');
 if (siteBrandCount && !brandParam) {
  siteBrandCount.textContent = `${brands.size} 个保护壳品牌 · ${phones.length} 款机型 · ${products.length} 条适配记录`;
  siteBrandCount.hidden = false;
  try {
   const response = await fetch('count-audit.json');
   if (response.ok) {
    const audit = await response.json();
    if (audit.relationship_count === data.products.length && Number.isInteger(audit.total_counted) && audit.total_counted === audit.non_duo_counted + audit.duo_counted) {
     const summary = el('p', 'site-product-count', `按现有证据核算，至少 ${audit.total_counted} 件商品及明确机型变体`);
     const note = el('p', 'site-count-note', `非 Duo ${audit.non_duo_counted} 件 · Duo ${audit.duo_counted} 件。Duo 专题保留 186 条原记录；同款颜色、重复卖家和套装内重复壳不累加。`);
     const detail = el('p', 'site-count-note', `核算日期 ${audit.checked_date}。未核实记录不计入上述数量；随盒壳与配件套装单列。售卖状态以来源页面为准。`);
     siteBrandCount.before(summary);
     siteBrandCount.after(note, detail);
    }
   }
  } catch (_) { /* 数量审计暂不可用时，仍保留品牌、机型与适配记录口径。 */ }
 }
 const menu=$('#brands');let selectedBrand='',selectedFeature='';const title=$('#title'),input=$('#query'),grid=$('#grid'),result=$('#result'),empty=$('#empty');
 const safeLink=u=>/^https?:\/\//i.test(u||'');
 function picture(url,alt){let d=el('div','item-visual');if(url&&typeof url==='string'&&!url.startsWith('/')&&!url.includes('..')){let img=el('img');img.src=url;img.alt=alt||'';img.loading='lazy';img.addEventListener('error',()=>{img.remove();d.textContent='暂无图片'});d.append(img)}else d.textContent='暂无图片';return d}
 function price(p){if(p.price===undefined||p.price===null||p.price==='')return '';return [p.currency||'',p.price].join(' ').trim()}
 function productCard(p,showPhone){let a=el('article','item');a.append(picture(p.image,p.product_name));a.append(el('div','item-brand',p.brand||''));a.append(el('div','item-name',p.product_name||''));if(showPhone)a.append(el('div','item-model',phoneMap.get(p.phone_key)?.model||''));let z=price(p);if(z)a.append(el('div','item-price',z));if(p.image_note)a.append(el('div','item-note',p.image_note));if(safeLink(p.product_url)){let link=el('a','item-source','查看来源 ↗');link.href=p.product_url;link.target='_blank';link.rel='noopener noreferrer';a.append(link)}return a}
 function phoneCard(p){let a=el('article','item');let link=el('a');link.href=p.phone_key===duoKey?'duo.html':'case.html?phone='+encodeURIComponent(p.phone_key);link.append(picture(p.image,p.model));a.append(link);let b=el('a','item-brand',p.brand||'');b.href='index.html?phoneBrand='+encodeURIComponent(p.brand||'');a.append(b);let n=el('a','item-name',p.model||'');n.href=link.href;a.append(n);
  const count = phoneBrands.get(p.phone_key)?.size || 0;
  a.append(el('div', 'item-brand-count', count ? `已收录 ${count} 个保护壳品牌` : '暂未收录保护壳品牌'));
  return a
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
