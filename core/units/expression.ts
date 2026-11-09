/**
 * Tiny, safe arithmetic expression evaluator for numeric fields.
 * Supports + - * / parentheses, unary signs and unit suffixes ("2.5*3", "3m + 20cm", "10' 6\"").
 * Tracks the dimension of each value so "2.5ft * 3" stays a length while bare numbers adopt the
 * field's default unit.
 */
export interface EvalOptions {
  /** Unit name -> factor to base unit (e.g. { m: 1, cm: 0.01 }). */
  units: Record<string, number>;
  /** Factor applied to unit-less results (e.g. 0.3048 when the user works in feet). */
  defaultFactor: number;
}

interface Quantity {
  value: number;
  dim: number;
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'unit'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'lp' }
  | { t: 'rp' };

function tokenize(input: string): Token[] | null {
  const out: Token[] = [];
  let i = 0;
  const s = input.replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/′/g, "'").replace(/″/g, '"');
  while (i < s.length) {
    const c = s[i]!;
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j]!)) j++;
      // scientific notation
      if ((s[j] === 'e' || s[j] === 'E') && /[0-9+-]/.test(s[j + 1] ?? '')) {
        j++;
        if (s[j] === '+' || s[j] === '-') j++;
        while (j < s.length && /[0-9]/.test(s[j]!)) j++;
      }
      const num = Number(s.slice(i, j));
      if (!Number.isFinite(num)) return null;
      out.push({ t: 'num', v: num });
      i = j;
      continue;
    }
    if (c === "'" || c === '"' || c === '°') {
      out.push({ t: 'unit', v: c });
      i++;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j]!)) j++;
      out.push({ t: 'unit', v: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ t: 'lp' });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ t: 'rp' });
      i++;
      continue;
    }
    return null;
  }
  return out;
}

export function evaluate(input: string, opts: EvalOptions): number | null {
  const tokens = tokenize(input.trim());
  if (!tokens || tokens.length === 0) return null;
  let pos = 0;
  const peek = () => tokens[pos];

  const toDim1 = (q: Quantity): Quantity => (q.dim === 0 ? { value: q.value * opts.defaultFactor, dim: 1 } : q);

  function parseExpr(): Quantity | null {
    let left = parseTerm();
    if (!left) return null;
    for (;;) {
      const tk = peek();
      if (tk?.t === 'op' && (tk.v === '+' || tk.v === '-')) {
        pos++;
        let right = parseTerm();
        if (!right) return null;
        if (left.dim !== right.dim) {
          left = toDim1(left);
          right = toDim1(right);
          if (left.dim !== right.dim) return null;
        }
        left = { value: tk.v === '+' ? left.value + right.value : left.value - right.value, dim: left.dim };
      } else return left;
    }
  }

  function parseTerm(): Quantity | null {
    let left = parseFactor();
    if (!left) return null;
    for (;;) {
      const tk = peek();
      if (tk?.t === 'op' && (tk.v === '*' || tk.v === '/')) {
        pos++;
        const right = parseFactor();
        if (!right) return null;
        if (tk.v === '*') left = { value: left.value * right.value, dim: left.dim + right.dim };
        else {
          if (right.value === 0) return null;
          left = { value: left.value / right.value, dim: left.dim - right.dim };
        }
      } else return left;
    }
  }

  function parseFactor(): Quantity | null {
    const tk = peek();
    if (tk?.t === 'op' && (tk.v === '-' || tk.v === '+')) {
      pos++;
      const f = parseFactor();
      if (!f) return null;
      return tk.v === '-' ? { value: -f.value, dim: f.dim } : f;
    }
    return parsePrimary();
  }

  function readUnit(q: Quantity): Quantity | null {
    const tk = peek();
    if (tk?.t !== 'unit') return q;
    const factor = opts.units[tk.v];
    if (factor === undefined) return null;
    pos++;
    if (q.dim !== 0) return null;
    return { value: q.value * factor, dim: 1 };
  }

  function parsePrimary(): Quantity | null {
    const tk = peek();
    if (!tk) return null;
    if (tk.t === 'lp') {
      pos++;
      const e = parseExpr();
      if (!e || peek()?.t !== 'rp') return null;
      pos++;
      return readUnit(e);
    }
    if (tk.t === 'num') {
      pos++;
      let q = readUnit({ value: tk.v, dim: 0 });
      if (!q) return null;
      // Compound quantities: 10' 6"  or  1m 20cm
      while (q.dim === 1 && peek()?.t === 'num' && tokens[pos + 1]?.t === 'unit') {
        const n = peek() as { t: 'num'; v: number };
        pos++;
        const next = readUnit({ value: n.v, dim: 0 });
        if (!next) return null;
        q = { value: q.value + next.value, dim: 1 };
      }
      return q;
    }
    return null;
  }

  const result = parseExpr();
  if (!result || pos !== tokens.length) return null;
  if (result.dim === 0) return result.value * opts.defaultFactor;
  if (result.dim === 1) return result.value;
  return null;
}
