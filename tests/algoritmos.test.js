// Rodar com: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/codigos.js');
require('../js/destaque.js');
require('../js/entrada.js');
require('../js/algoritmos.js');
const S = globalThis.SortViz;

const ordenado = (v) => v.slice().sort((x, y) => x - y);
const mesmoConjunto = (a, b) => assert.deepEqual(ordenado(a), ordenado(b));

const CASOS = [
  [64, 34, 25, 12, 22, 11, 90],
  [2, 1],
  [5, 5, 5, 5],
  [1, 2, 3, 4, 5, 6],
  [9, 8, 7, 6, 5, 4, 3, 2, 1],
  [3, 1, 3, 2, 1, 2, 3],
  S.aleatorios(20),
  S.aleatorios(13),
];

for (const id of S.ORDEM) {
  test(`${id}: ordena todos os casos e termina no print`, () => {
    for (const caso of CASOS) {
      const passos = S.gerarPassos(id, caso);
      const ultimo = passos[passos.length - 1];
      assert.deepEqual(ultimo.arr, ordenado(caso), `falhou para ${caso}`);
      assert.equal(ultimo.tag, 'print');
      assert.equal(ultimo.ordenados.length, caso.length);
      assert.equal(ultimo.pilha.join(' > '), 'main');
    }
  });

  test(`${id}: todo passo aponta para uma linha existente do código`, () => {
    for (const caso of CASOS) {
      const linhas = S.montarCodigo(id, caso);
      for (const p of S.gerarPassos(id, caso)) {
        assert.ok(p.linha >= 1 && p.linha <= linhas.length, `${p.tag} fora do arquivo`);
        assert.ok(linhas[p.linha - 1].trim().length > 0, `${p.tag} aponta para linha vazia`);
        assert.ok(p.expl.length > 0);
      }
    }
  });

  test(`${id}: contadores nunca diminuem e índices dos passos são válidos`, () => {
    for (const caso of CASOS) {
      const n = caso.length;
      let comp = 0;
      let trocas = 0;
      for (const p of S.gerarPassos(id, caso)) {
        assert.ok(p.comp >= comp && p.trocas >= trocas);
        comp = p.comp;
        trocas = p.trocas;
        assert.equal(p.arr.length, n);
        for (const k of Object.keys(p.marcas)) assert.ok(+k >= 0 && +k < n, `marca ${k} fora do vetor`);
        for (const [nome, k] of Object.entries(p.ponteiros)) {
          assert.ok(Number.isInteger(k) && k < n, `ponteiro ${nome}=${k} fora do vetor`);
        }
        for (const k of p.ordenados) assert.ok(k >= 0 && k < n);
      }
    }
  });
}

test('código exibido: toda tag usada pelos geradores existe e nenhuma ⟦tag⟧ vaza para o texto', () => {
  for (const id of S.ORDEM) {
    const linhas = S.montarCodigo(id, [3, 1, 2]);
    assert.ok(!linhas.some((l) => l.includes('⟦') || l.includes('__ARR__')), `${id} vazou marcador`);
    assert.ok(linhas.some((l) => l.includes('int arr[] = {3, 1, 2};')));
  }
});

test('troca por temp (bubble/selection/quick): vetor volta a ser permutação ao fim da troca', () => {
  for (const id of ['bubble', 'selection', 'quick']) {
    for (const caso of CASOS) {
      for (const p of S.gerarPassos(id, caso)) {
        if (p.tag === 't3') mesmoConjunto(p.arr, caso);
      }
    }
  }
});

test('insertion: ao inserir a chave, o vetor é permutação e o prefixo fica ordenado', () => {
  for (const caso of CASOS) {
    for (const p of S.gerarPassos('insertion', caso)) {
      if (p.tag !== 'coloca') continue;
      mesmoConjunto(p.arr, caso);
      const [, fim] = p.zona;
      const prefixo = p.arr.slice(0, fim + 1);
      assert.deepEqual(prefixo, ordenado(prefixo));
    }
  }
});

test('quick: cada pivô fixado está no lugar certo (menores à esquerda, maiores à direita)', () => {
  for (const caso of CASOS) {
    const alvo = ordenado(caso);
    for (const p of S.gerarPassos('quick', caso)) {
      if (p.tag !== 'pRet') continue;
      const pos = p.ponteiros.p;
      assert.equal(p.arr[pos], alvo[pos], `pivô em ${pos} não bate com o ordenado`);
    }
  }
});

test('contagem de comparações bate com a fórmula do bubble e do selection', () => {
  for (const caso of CASOS) {
    const n = caso.length;
    const esperado = (n * (n - 1)) / 2;
    assert.equal(S.gerarPassos('bubble', caso).at(-1).comp, esperado);
    assert.equal(S.gerarPassos('selection', caso).at(-1).comp, esperado);
  }
});

test('insertion: vetor já ordenado não faz deslocamentos', () => {
  const ult = S.gerarPassos('insertion', [1, 2, 3, 4, 5]).at(-1);
  assert.equal(ult.trocas, 0);
  assert.equal(ult.comp, 4);
});

test('validarEntrada: aceita separadores variados e rejeita entradas ruins', () => {
  assert.deepEqual(S.validarEntrada('5, 3;8 1').valores, [5, 3, 8, 1]);
  assert.match(S.validarEntrada('').erro, /pelo menos 2/);
  assert.match(S.validarEntrada('7').erro, /pelo menos 2/);
  assert.match(S.validarEntrada('1, abc').erro, /abc/);
  assert.match(S.validarEntrada('1, 100').erro, /100/);
  assert.match(S.validarEntrada('1, 0').erro, /0/);
  assert.match(S.validarEntrada('1, -3').erro, /-3/);
  assert.match(S.validarEntrada('1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21').erro, /no máximo 20/);
});

test('aleatorios: quantidade certa, valores distintos dentro do intervalo', () => {
  for (const q of [2, 8, 20]) {
    const v = S.aleatorios(q);
    assert.equal(v.length, q);
    assert.equal(new Set(v).size, q);
    assert.ok(v.every((x) => x >= 5 && x <= 99));
  }
});

test('destacar: escapa HTML e classifica tokens do C', () => {
  const html = S.destacar('for (int i = 0; i < n; i++) { // oi <b>');
  assert.match(html, /<span class="tk-d">for<\/span>/);
  assert.match(html, /<span class="tk-k">int<\/span>/);
  assert.match(html, /<span class="tk-n">0<\/span>/);
  assert.match(html, /&lt; <span class="tk-v">n<\/span>/);
  assert.ok(!html.includes('<b>'));
  assert.match(S.destacar('#include <stdio.h>'), /tk-d">#include.*tk-s">&lt;stdio\.h&gt;/);
});
