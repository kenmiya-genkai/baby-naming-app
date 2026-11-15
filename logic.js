(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BabyNameLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function effectiveNumber(value) { let n = Number(value); while (n > 81) n -= 80; return n; }
  function calculate(surname, given, kanji, exceptions, luck) {
    const chars = [...surname, ...given];
    const details = chars.map(char => {
      const entry = kanji[char]; const exception = exceptions[char];
      if (!exception && !entry) return { char, strokes: null, unknown: true };
      return { char, strokes: Number(exception ? exception.strokes : entry.strokes), exception: !!exception, note: exception && exception.note };
    });
    if (details.some(x => x.unknown)) return { unknown: true, details };
    const s = details.slice(0, [...surname].length).map(x => x.strokes);
    const g = details.slice([...surname].length).map(x => x.strokes);
    if (!s.length || !g.length) return { invalid: true, details };
    const sum = a => a.reduce((x, y) => x + y, 0);
    const values = { ten: sum(s) + (s.length === 1 ? 1 : 0), jin: s[s.length - 1] + g[0], chi: sum(g) + (g.length === 1 ? 1 : 0) };
    values.sou = sum(s) + sum(g); values.gai = values.ten + values.chi - values.jin;
    const names = { ten: '天格', jin: '人格', chi: '地格', gai: '外格', sou: '総格' };
    const fortunes = {};
    for (const key of Object.keys(values)) fortunes[key] = { number: values[key], fortune: luck[String(effectiveNumber(values[key]))] || '半吉' };
    return { values, fortunes, details };
  }
  return { calculate, effectiveNumber };
});
