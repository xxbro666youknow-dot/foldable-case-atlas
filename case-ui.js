/* 公开商品卡与有依据的特征；缺失字段保持未知。 */
window.CaseUI = (() => {
  const make = (tag, cls, text) => { const n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; };
  const safe = url => /^https?:\/\//i.test(url || '');
  let db={taxonomy:[],product_feature_tags:{},device_tags_by_phone_key:{}}, details={by_product_id:{}};
  let lightbox;
  const link = (url,text,cls='') => { const a=make('a',cls,text); a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a; };
  async function load() {
    const fetchJSON=async file=>{const r=await fetch(file,{cache:'no-store'});if(!r.ok)throw Error(file);return r.json();};
    const result=await Promise.allSettled([fetchJSON('features.json'),fetchJSON('product-details.json')]);
    if(result[0].status==='fulfilled')db=result[0].value;
    if(result[1].status==='fulfilled')details=result[1].value;
    return {featuresAvailable:result[0].status==='fulfilled'};
  }
  const fields = p => details.by_product_id?.[p.id] || {};
  const tags = p => [...new Set([...(db.product_feature_tags?.[p.id]||[]),...(fields(p).feature_tags||[])])];
  const label = id => db.taxonomy.find(t=>t.id===id)?.label || id;
  function zoom(image,title,button) {
    if(!lightbox) {
      lightbox=make('dialog','case-lightbox');
      const close=make('button','lightbox-close','关闭 ×');close.type='button';close.addEventListener('click',()=>lightbox.close());
      const img=make('img'),caption=make('p');
      lightbox.append(close,img,caption);document.body.append(lightbox);
      lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
    }
    lightbox.querySelector('img').src=image;lightbox.querySelector('img').alt=title;lightbox.querySelector('p').textContent=title;
    lightbox.addEventListener('close',()=>button.focus(),{once:true});lightbox.showModal();
  }
  function visual(p) {
    const frame=make('div','item-visual product-visual');
    const placeholder=message=>{
      const parts=[make('span','',message)];
      if(safe(p.product_url))parts.push(link(p.product_url,'看商品来源 ↗','image-source'));
      frame.replaceChildren(...parts);frame.classList.add('image-missing');
    };
    if(typeof p.image!=='string'||!p.image||p.image.startsWith('/')||p.image.includes('..')){placeholder('商品图未收录');return frame;}
    const button=make('button','product-zoom');button.type='button';button.setAttribute('aria-label','放大 '+p.brand+' '+p.product_name+' 商品图');
    const image=make('img');image.src=p.image;image.alt=p.brand+' '+p.product_name;image.loading='lazy';image.decoding='async';
    image.addEventListener('error',()=>placeholder('图片加载失败'));
    button.append(image);button.addEventListener('click',()=>zoom(p.image,p.brand+' · '+p.product_name,button));frame.append(button);
    return frame;
  }
  function card(p,phoneMap) {
    const d=fields(p),a=make('article','item product-card');a.dataset.productId=p.id;
    a.append(visual(p));
    if(/共用|跨机/.test(p.image_note||''))a.append(make('p','item-note image-caption','同商品共用示意图 · 详见来源')); 
    const content=make('div','product-content');
    content.append(make('div','item-brand',p.brand),make('h2','item-name',d.display_name||p.product_name));
    const variant=[d.variant,phoneMap.get(p.phone_key)?.model].filter(Boolean).join(' · ');
    content.append(make('p','item-model',variant));
    if(d.variants_note)content.append(make('p','item-note',d.variants_note));
    const value=Object.hasOwn(d,'price')?d.price:p.price,currency=Object.hasOwn(d,'currency')?(d.currency||''):(p.currency||''),date=d.checked_date||d.verified_date||'';
    const priceRow=make('div','product-price-row');
    const hasPrice=value!==undefined&&value!==null&&value!=='';
    priceRow.append(make('strong',hasPrice?'item-price':'price-unknown',hasPrice?currency+' '+value+(d.price_kind==='from'?' 起':''):'价格待核'));
    priceRow.append(make('span','sale-status',d.sale_status||d.status_type||'售卖状态待核'));
    content.append(priceRow);
    if(d.price_note)content.append(make('p','record-date',d.price_note));
    if(hasPrice||date)content.append(make('p','record-date',(date?'资料核验 '+date:'收录标价 · 日期待核')+' · 当前价格以商品页为准'));
    const sourceParts=[d.region,d.channel?.label||({'brand_store':'品牌商品页','resale_retailer':'分级零售商品'}[d.source_type]||d.source_type)].filter(Boolean);
    if(!sourceParts.length&&safe(p.product_url))sourceParts.push('来源：'+new URL(p.product_url).hostname.replace(/^www\./,''));
    if(sourceParts.length)content.append(make('p','product-channel',sourceParts.join(' · ')));
    const ids=tags(p).filter(id=>id!=='leather-family');
    if(ids.length){const row=make('div','product-tags');ids.forEach(id=>row.append(make('span','product-tag',label(id))));content.append(row);}
    else content.append(make('p','feature-pending','特征资料待补'));
    if(d.summary)content.append(make('p','product-summary',d.summary));
    if(safe(p.product_url))content.append(link(p.product_url,'查看商品详情与当前价格 ↗','product-link'));
    const disclosure=make('details','product-evidence');disclosure.append(make('summary','','版本、售卖状态与来源'));
    const list=make('dl');
    const row=(title,text)=>{if(text){list.append(make('dt','',title),make('dd','',text));}};
    row('原始名称',p.product_name);
    row('图片说明',p.image_note);
    row('系列／版本',[p.series,d.variant,d.variants_note].filter(Boolean).join(' · '));
    row('适配机型',phoneMap.get(p.phone_key)?.model||p.phone_key);
    row('售卖状态说明',d.status_note||d.availability_note||'尚未核实当前库存与发货情况，请查看商品页。');
    row('核验日期',date||'本条资料日期待补');
    row('已记录特征',ids.length?ids.map(label).join('、'):'暂无已核特征；未标注不代表没有。');
    for(const [key,value] of Object.entries(d.evidence||{})){
      const title={model:'机型依据',price:'价格依据',availability:'状态依据',features:'特征依据'}[key]||key;
      if(typeof value==='string')row(title,value);
    }
    if(safe(p.product_url)){list.append(make('dt','','商品来源'));const dd=make('dd');dd.append(link(p.product_url,'打开原商品页 ↗'));list.append(dd);}
    for(const source of (d.sources||[])){
      if(!safe(source.url))continue;
      list.append(make('dt','',source.label||'补充依据'));const dd=make('dd');dd.append(link(source.url,source.title||'查看来源 ↗'));
      if(source.note)dd.append(document.createTextNode(' · '+source.note));list.append(dd);
    }
    disclosure.append(list);content.append(disclosure);a.append(content);return a;
  }
  function groups() {
    const grouped=[
      {id:'material',label:'材质',items:[]},
      {id:'structure',label:'保护结构',items:[]},
      {id:'transparency',label:'透明部位',items:[]},
      {id:'function',label:'功能',items:[]},
      {id:'style',label:'外观',items:[]},
      {id:'device_form',label:'适配手机形态',items:[]}
    ];
    const structures=new Set(['hinge','hinge-uncovered','front','folio','detachable']);
    for(const tag of db.taxonomy){
      let group=tag.dimension;
      if(structures.has(tag.id))group='structure';
      if(['clear','front-clear','back-clear','both-clear','opaque'].includes(tag.id))group='transparency';
      grouped.find(g=>g.id===group)?.items.push(tag);
    }
    grouped.push({id:'knowledge',label:'资料状态',items:[{id:'unknown-features',label:'特征待补'}]});
    return grouped.filter(g=>g.items.length);
  }
  function matches(p,selected) {
    const known=tags(p),available=new Set([...known,...(db.device_tags_by_phone_key?.[p.phone_key]||[])]);
    if(!known.length)available.add('unknown-features');
    return groups().every(group=>{const chosen=group.items.filter(t=>selected.has(t.id));return !chosen.length||chosen.some(t=>available.has(t.id));});
  }
  return {load,card,tags,label,groups,matches};
})();

