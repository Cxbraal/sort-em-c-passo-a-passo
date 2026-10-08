// Validação dos valores digitados e geração de valores aleatórios.
(function () {
  const S = (globalThis.SortViz = globalThis.SortViz || {});

  const LIMITES = { min: 1, max: 99, qtdMin: 2, qtdMax: 20 };

  function validarEntrada(texto) {
    const partes = String(texto).split(/[\s,;]+/).filter(Boolean);
    if (partes.length < LIMITES.qtdMin) return { erro: `Digite pelo menos ${LIMITES.qtdMin} valores.` };
    if (partes.length > LIMITES.qtdMax) {
      return { erro: `Use no máximo ${LIMITES.qtdMax} valores (foram ${partes.length}).` };
    }
    const valores = [];
    for (const p of partes) {
      if (!/^\d+$/.test(p)) return { erro: `"${p}" não é um número inteiro positivo.` };
      const v = Number(p);
      if (v < LIMITES.min || v > LIMITES.max) {
        return { erro: `${v} está fora do intervalo de ${LIMITES.min} a ${LIMITES.max}.` };
      }
      valores.push(v);
    }
    return { valores };
  }

  // Sorteia valores distintos entre 5 e 99 (Fisher-Yates parcial).
  function aleatorios(qtd) {
    const pool = Array.from({ length: LIMITES.max - 4 }, (_, i) => i + 5);
    for (let i = 0; i < qtd; i++) {
      const k = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[k]] = [pool[k], pool[i]];
    }
    return pool.slice(0, qtd);
  }

  S.LIMITES = LIMITES;
  S.validarEntrada = validarEntrada;
  S.aleatorios = aleatorios;
})();
