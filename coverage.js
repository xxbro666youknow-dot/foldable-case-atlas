/* 仅展示随本次发布核验的公开数量和来源；不访问本机研究资料。 */
(() => {
  const query = document.getElementById('coverage-query');
  const scope = document.getElementById('coverage-scope');
  const sort = document.getElementById('coverage-sort');
  const grid = document.getElementById('coverage-grid');
  const status = document.getElementById('coverage-status');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeURL = value => { try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; } };
  const number = value => Number(value).toLocaleString('zh-CN');
  const metric = (value, label) => `<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`;
  fetch('coverage-data.json', {cache:'no-store'}).then(response => { if (!response.ok) throw Error('载入失败'); return response.json(); }).then(data => {
    const total = data.summary;
    document.getElementById('image-progress').textContent = `本轮填补期初缺图 ${total.baseline_missing_images_filled} 条；新增适配中 ${total.new_relationships_with_images} 条已有图（其中 ${total.new_relationships_reusing_images} 条复用既有图）；另更换 ${total.existing_images_replaced} 条图片，因使用依据不足撤下 ${total.existing_images_withdrawn || 0} 条既有图片。当前仍有 ${total.missing_image_relationships} 条适配记录缺图。`;
    document.getElementById('updated').textContent = `核验日期 ${data.checked_date} · 72 款机型 · 点击机型查看已收录商品`;
    document.getElementById('summary').innerHTML = metric(number(total.effective),'全站有效手机壳样本') + metric('+' + number(total.net_added),'本轮净增有效样本') + metric(data.phones.length,'现有已收录机型') + metric(number(total.image_updates),'本轮补图适配记录');
    const gapBox = document.getElementById('image-gap-summary');
    if (gapBox && Array.isArray(data.image_gap_reasons)) {
      gapBox.innerHTML = '<strong>剩余缺图原因</strong><ul>' + data.image_gap_reasons.map(row => `<li>${escape(row.reason)}：${number(row.count)} 条</li>`).join('') + '</ul><a href="missing-image-status.json" download>下载逐条缺图状态与来源</a>';
    }
    function render() {
      const needle = query.value.trim().toLocaleLowerCase();
      const rows = data.phones.filter(row => (!needle || `${row.brand} ${row.model}`.toLocaleLowerCase().includes(needle)) && (scope.value === 'all' || scope.value === 'gap' && row.current < 30 || scope.value === 'zero' && row.current === 0 || scope.value === 'met' && row.current >= 30));
      rows.sort((a,b) => sort.value === 'gain' ? b.net_added-a.net_added || a.current-b.current : sort.value === 'model' ? `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`) : a.current-b.current || `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
      status.textContent = `${rows.length} 款机型 · ${number(rows.reduce((sum,row)=>sum+row.with_image,0))} 条适配已有图 · ${number(rows.reduce((sum,row)=>sum+row.without_image,0))} 条缺图`;
      grid.innerHTML = rows.map(row => {
        const link = row.phone_key === 'apple-iphone-duo' ? 'duo.html' : `case.html?phone=${encodeURIComponent(row.phone_key)}`;
        const sourceList = row.sources.map(source => {
          const url = safeURL(source.url);
          const name = source.site || (url ? new URL(url).hostname : '来源记录');
          return `<li>${url ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(name)}</a>` : escape(name)}<span class="coverage-source-state">${escape(source.status)}</span>${source.note ? `<span class="coverage-source-note">${escape(source.note)}</span>` : ''}</li>`;
        }).join('');
        return `<article class="coverage-card" data-phone="${escape(row.phone_key)}"><p class="coverage-phone-brand">${escape(row.brand)}</p><h2><a href="${link}">${escape(row.model)} →</a></h2><div class="coverage-metrics">${metric(row.current,'有效手机壳样本')}${metric((row.net_added >= 0 ? '+' : '') + row.net_added,'本轮净增')}${metric(row.with_image,'已有图适配')}</div><p class="coverage-meta">期初 ${row.baseline} 个样本 · ${row.effective_brands} 个有效品牌<br>${row.relationships} 条公开适配记录 · ${row.with_image} 条已有图 · ${row.without_image} 条缺图</p><details class="coverage-details"><summary>查看已查来源与缺口说明（${row.sources.length}）</summary><p class="coverage-gap">${escape(row.gap_note)}</p>${sourceList ? `<ul>${sourceList}</ul>` : '<p class="coverage-gap">本轮尚无可单独列示的新查源记录；保留已有商品的来源入口。</p>'}</details></article>`;
      }).join('') || '<p class="coverage-empty">暂无匹配机型</p>';
    }
    [query,scope,sort].forEach(element => element.addEventListener('input',render));
    render();
  }).catch(() => { status.textContent = '逐机型进度暂时无法载入，请刷新重试。'; });
})();
