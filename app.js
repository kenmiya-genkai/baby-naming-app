(function () {
  const data = window.KANJI_DATA;
  const exceptions = window.KANJI_EXCEPTIONS;
  const luck = window.LUCK_DATA;
  const $ = id => document.getElementById(id);
  const keys = ['ten', 'jin', 'chi', 'gai', 'sou'];
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
      detail.innerHTML = `<td colspan="10">${item.result.details.map(d=>`<span class="kanji-detail">${escapeHtml(d.char)}：${d.strokes ?? '不明'}画${d.exception ? ` <b title="${escapeHtml(d.note)}">例外辞書</b>` : ''}</span>`).join('')}</td>`;
      tr.querySelector('.expand').addEventListener('click', e => { detail.hidden = !detail.hidden; e.currentTarget.textContent = detail.hidden ? '詳細' : '閉じる'; });
      tbody.append(tr, detail);
    });
  }
  function score(result) { return result.fortunes ? Object.values(result.fortunes).filter(x => x.fortune === '大吉' || x.fortune === '吉').length : -1; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  ['surname','candidates','sort'].forEach(id => $(id).addEventListener('input', render));
  $('sort').addEventListener('change', render);
  $('favorites-only').addEventListener('change', e => { onlyFavorites=e.target.checked; render(); });
  render();
})();
