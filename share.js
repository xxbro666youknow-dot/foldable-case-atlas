/* 保留原网址；普通分享与当前筛选分开。 */
(() => {
  function pageURL(){
    const url=new URL(location.href),phone=url.searchParams.get('phone'),brand=url.searchParams.get('brand'),phoneBrand=url.searchParams.get('phoneBrand');
    url.search='';url.hash='';
    if(url.pathname.endsWith('/case.html')&&phone)url.searchParams.set('phone',phone);
    if(url.pathname.endsWith('/index.html')){if(brand)url.searchParams.set('brand',brand);if(phoneBrand)url.searchParams.set('phoneBrand',phoneBrand);}
    return url.href;
  }
  async function copy(url,button){
    try{await navigator.clipboard.writeText(url);const text=button.textContent;button.textContent='链接已复制';setTimeout(()=>button.textContent=text,1800);}
    catch(_){
      const box=document.createElement('dialog');box.className='share-dialog';
      const label=document.createElement('p');label.textContent='复制下面的链接';
      const input=document.createElement('input');input.value=url;input.readOnly=true;input.setAttribute('aria-label','分享链接');
      const close=document.createElement('button');close.textContent='关闭';close.type='button';close.onclick=()=>box.close();
      box.append(label,input,close);document.body.append(box);box.addEventListener('close',()=>box.remove());box.showModal();input.select();
    }
  }
  for(const b of document.querySelectorAll('[data-share]'))b.addEventListener('click',()=>copy(b.dataset.share==='current'?location.href:pageURL(),b));
})();

