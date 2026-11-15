(function () {
  const data = window.KANJI_DATA;
  const exceptions = window.KANJI_EXCEPTIONS;
  const luck = window.LUCK_DATA;
  const $ = id => document.getElementById(id);
  const keys = ['ten', 'jin', 'chi', 'gai', 'sou'];
  const 格意味 = { ten: '姓の画数の合計。家系や先祖から受け継ぐ運を表します。自分では変えられない部分で、吉凶そのものより他の格との関係を見ます。', jin: '姓の最後の字と名の最初の字の合計。性格や才能を表す中心の格で、中年期までの運勢（主運）を見ます。五格の中で最も重要とされます。', chi: '名の画数の合計。幼少期から青年期の運勢を表し、家庭運や健康運にも関係するとされます。', gai: '天格＋地格－人格で求めます。対人関係や社会との関わり、周囲から受ける助けの大きさを表します。', sou: '姓名すべての画数の合計。人生全体の流れと、晩年期の運勢を表します。' };
  const 格名 = { ten: '天格', jin: '人格', chi: '地格', gai: '外格', sou: '総格' };
  let favorites = new Set();
  try { favorites = new Set(JSON.parse(localStorage.getItem('baby-name-favorites') || '[]')); } catch (_) {}
  let onlyFavorites = false;
  const parseRows = value => value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const match = line.match(/^(\S+)(?:\s+(.+))?$/u);
    return match && { name: match[1], reading: match[2] || '' };
  }).filter(Boolean);
  function render() {
    const surname = $('surname').value.trim(); const rows = parseRows($('candidates').value);
    const tbody = $('results'); tbody.replaceChildren();
    if (!surname || !rows.length) { $('empty').hidden = false; $('empty').textContent = '名字と候補を入力すると結果を表示します。'; return; }
    const isKanji = value => [...value].every(ch => /[\p{Script=Han}々〆]/u.test(ch));
    const items = rows.map((row, i) => ({...row, i, result: !isKanji(surname) || !isKanji(row.name) ? { invalid: true, details: [] } : BabyNameLogic.calculate(surname, row.name, data, exceptions, luck)}));
    let visible = items.filter(item => !onlyFavorites || favorites.has(item.name));
    const sort = $('sort').value;
    visible.sort((a,b) => sort === 'sou' ? a.result.values?.sou - b.result.values?.sou : sort === 'name' ? a.name.localeCompare(b.name, 'ja') : score(b.result) - score(a.result));
    $('empty').hidden = visible.length > 0;
    $('empty').textContent = onlyFavorites && !visible.length ? 'お気に入りはありません。' : '画数不明の漢字があります。漢字データを確認してください。';
    visible.forEach(item => {
      const tr = document.createElement('tr');
      if (item.result.unknown || item.result.invalid) { tr.className = 'warning'; tr.innerHTML = `<td>${escapeHtml(item.name)} <span class="warning-text">${item.result.unknown ? '画数不明の漢字があります' : '名字と候補は漢字で入力してください'}</span></td><td>${escapeHtml(item.reading)}</td><td colspan="6">計算できません</td><td><button class="star" aria-label="お気に入り">☆</button></td><td><button class="expand">詳細</button></td>`; }
      else {
        const f = item.result.fortunes;
        tr.innerHTML = `<td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.reading)}</td>${keys.map(k=>`<td>${f[k].number}<span class="badge ${f[k].fortune}">${f[k].fortune}</span></td>`).join('')}<td>${score(item.result)}/5</td><td><button class="star" aria-label="お気に入り">${favorites.has(item.name) ? '★' : '☆'}</button></td><td><button class="expand">詳細</button></td>`;
      }
      tr.querySelector('.star').addEventListener('click', () => { favorites.has(item.name) ? favorites.delete(item.name) : favorites.add(item.name); localStorage.setItem('baby-name-favorites', JSON.stringify([...favorites])); render(); });
      const detail = document.createElement('tr'); detail.className='detail'; detail.hidden=true;
      if (!item.result.values) {
        detail.innerHTML = `<td colspan="10">${item.result.details.map(d=>`<span class="kanji-detail">${escapeHtml(d.char)}：${d.strokes ?? '不明'}画${d.exception ? ' <b>例外辞書</b>' : ''}</span>`).join('')}</td>`;
      } else {
        detail.innerHTML = `<td colspan="10">${detailContent(item, surname)}</td>`;
      }
      tr.querySelector('.expand').addEventListener('click', e => { detail.hidden = !detail.hidden; e.currentTarget.textContent = detail.hidden ? '詳細' : '閉じる'; });
      tbody.append(tr, detail);
    });
  }
  function detailContent(item, surname) {
    const surnameChars = [...surname], givenChars = [...item.name], chars = [...surnameChars, ...givenChars];
    const ds = item.result.details, values = item.result.values, fortunes = item.result.fortunes;
    const label = key => `<span class="diagram-label"><b>${格名[key]} ${values[key]}</b><span class="badge ${escapeHtml(fortunes[key].fortune)}">${escapeHtml(fortunes[key].fortune)}</span></span>`;
    const totalRows = chars.length;
    const rows = chars.map((ch, i) => `<div class="diagram-char" style="grid-row:${i + 1}"><strong>${escapeHtml(ch)}</strong><small>${ds[i].strokes}画</small></div>`).join('');
    const diagram = `<div class="diagram-scroll"><div class="five-grid" style="--rows:${totalRows}"><div class="diagram-slot outer" style="grid-row:1 / span ${totalRows}">${label('gai')}</div><div class="diagram-slot person" style="grid-row:${surnameChars.length} / span 2">${label('jin')}</div>${rows}<div class="diagram-slot ten" style="grid-row:1 / span ${surnameChars.length}">${label('ten')}</div><div class="diagram-slot chi" style="grid-row:${surnameChars.length + 1} / span ${givenChars.length}">${label('chi')}</div><div class="diagram-slot total" style="grid-row:1 / span ${totalRows}">${label('sou')}</div></div></div>`;
    const list = `<ul class="five-list">${keys.map(k=>`<li><b>${格名[k]}</b><span>${values[k]}</span><span class="badge ${escapeHtml(fortunes[k].fortune)}">${escapeHtml(fortunes[k].fortune)}</span><span>${格意味[k]}</span></li>`).join('')}</ul>`;
    const table = `<div class="meaning-table-wrap"><table class="meaning-table"><thead><tr><th>漢字</th><th>画数</th><th>読み</th><th>意味（KANJIDIC2・英語）</th></tr></thead><tbody>${chars.map((ch,i)=>{ const entry=data[ch] || {}; const readings=[['音',entry.on],['訓',entry.kun],['名乗り',entry.nanori]].map(([n,a])=>`${n}：${Array.isArray(a)&&a.length ? a.slice(0,6).map(escapeHtml).join('・') : '—'}`).join('／'); const meaning=Array.isArray(entry.meaning)&&entry.meaning.length ? entry.meaning.slice(0,3).map(escapeHtml).join('; ') : '—'; return `<tr><th>${escapeHtml(ch)}</th><td>${ds[i].strokes}画${ds[i].exception?'（例外辞書）':''}</td><td>${readings}</td><td>${meaning}</td></tr>`;}).join('')}</tbody></table></div>`;
    return `<section class="candidate-detail"><h3>五格配置図</h3>${diagram}<h3>五格の意味</h3>${list}<h3>漢字の意味</h3>${table}</section>`;
  }
  function score(result) { return result.fortunes ? Object.values(result.fortunes).filter(x => x.fortune === '大吉' || x.fortune === '吉').length : -1; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  ['surname','candidates','sort'].forEach(id => $(id).addEventListener('input', render));
  $('sort').addEventListener('change', render);
  $('favorites-only').addEventListener('change', e => { onlyFavorites=e.target.checked; render(); });
  render();
})();
