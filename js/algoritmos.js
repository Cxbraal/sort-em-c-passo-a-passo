// Geradores de passos. Cada algoritmo roda de verdade sobre uma cópia do vetor e
// tira uma "foto" (passo) a cada linha de C executada. A tag diz qual linha do
// código exibido está sendo explicada (veja codigos.js).
//
// Campos de cada passo:
//   linha, expl, arr, vars, comp, trocas
//   ponteiros  { nome: índice }       rótulos desenhados sob as colunas
//   marcas     { índice: tipo }       tipo: comparar|trocar|pivo|min|chave
//   ordenados  [índices]              posições definitivas (verde)
//   zona       [de, ate] | null       região já organizada (azul)
//   intervalo  [de, ate] | null       fatia ativa; o resto fica apagado
//   flutuantes [{nome, valor}]        variáveis soltas (temp, chave)
//   pilha      [frames] | null        pilha de chamadas (só no Quick Sort)
(function () {
  const S = (globalThis.SortViz = globalThis.SortViz || {});

  const lista = (a) => `[${a.join(', ')}]`;
  const todos = (n) => Array.from({ length: n }, (_, i) => i);

  function criarGravador(entrada, L) {
    const arr = entrada.slice();
    const st = { comp: 0, trocas: 0 };
    const passos = [];
    const pilha = ['main'];
    function reg(tag, expl, o = {}) {
      if (!(tag in L)) throw new Error(`Tag de linha desconhecida: ${tag}`);
      passos.push({
        linha: L[tag], tag, expl,
        arr: arr.slice(),
        vars: { ...o.vars },
        ponteiros: { ...o.ponteiros },
        marcas: { ...o.marcas },
        ordenados: o.ordenados ? o.ordenados.slice() : [],
        zona: o.zona || null,
        intervalo: o.intervalo || null,
        flutuantes: o.flutuantes || [],
        pilha: pilha.slice(),
        comp: st.comp, trocas: st.trocas,
      });
    }
    return { arr, st, reg, passos, pilha };
  }

  function prologo(g, chamada) {
    const n = g.arr.length;
    g.reg('decl', `main declara o vetor arr com ${n} valores: ${lista(g.arr)}.`);
    g.reg('nDecl', `n recebe o número de elementos: sizeof(arr) / sizeof(arr[0]) = ${n}.`, { vars: { n } });
    g.reg('chama', `main chama ${chamada}. O vetor é passado por referência, então a função altera o próprio arr.`, { vars: { n } });
  }

  function epilogo(g) {
    const n = g.arr.length;
    g.reg('print', `De volta ao main, o laço com printf mostra o vetor ordenado: ${lista(g.arr)}. Foram ${g.st.comp} comparações e ${g.st.trocas} ${g.rotuloTrocas}.`,
      { vars: { n }, ordenados: todos(n) });
  }

  // ---------------------------------------------------------------- Bubble
  function bubble(entrada, L) {
    const g = criarGravador(entrada, L);
    g.rotuloTrocas = 'trocas';
    const { arr: a, st, reg } = g;
    const n = a.length;
    const ord = [];
    prologo(g, 'bubbleSort(arr, n)');
    g.pilha.push('bubbleSort(arr, n)');
    reg('fn', `Entra em bubbleSort com n = ${n}.`, { vars: { n } });
    for (let i = 0; i < n - 1; i++) {
      const fim = n - i - 1;
      reg('forI', `i = ${i}: começa a passada ${i + 1}. Ao final dela, o maior dos ${n - i} valores restantes estará na posição ${fim}.`,
        { vars: { n, i }, ordenados: ord });
      for (let j = 0; j < fim; j++) {
        const vars = { n, i, j };
        const base = { vars, ponteiros: { j, 'j+1': j + 1 }, marcas: { [j]: 'comparar', [j + 1]: 'comparar' }, ordenados: ord };
        reg('forJ', `j = ${j}: a condição j < ${fim} é verdadeira. Vamos olhar os vizinhos arr[${j}] e arr[${j + 1}].`, base);
        st.comp++;
        const troca = a[j] > a[j + 1];
        reg('if', `Compara arr[${j}] = ${a[j]} com arr[${j + 1}] = ${a[j + 1]}: ${a[j]} > ${a[j + 1]} é ${troca ? 'verdadeiro. Os dois estão fora de ordem e vão trocar.' : 'falso. Já estão em ordem, nada muda.'}`, base);
        if (!troca) continue;
        const tr = { ...base, marcas: { [j]: 'trocar', [j + 1]: 'trocar' } };
        const temp = a[j];
        const flut = [{ nome: 'temp', valor: temp }];
        const vt = { ...vars, temp };
        reg('t1', `temp guarda uma cópia de arr[${j}] (${temp}) para o valor não se perder durante a troca.`, { ...tr, vars: vt, flutuantes: flut });
        a[j] = a[j + 1];
        reg('t2', `arr[${j}] recebe o valor de arr[${j + 1}]: agora vale ${a[j]}. Por um instante, o vetor tem ${a[j]} repetido.`, { ...tr, vars: vt, flutuantes: flut });
        a[j + 1] = temp;
        st.trocas++;
        reg('t3', `arr[${j + 1}] recebe temp (${temp}). Troca concluída: ${a[j]} e ${temp} trocaram de lugar.`, { ...tr, vars: vt, flutuantes: flut });
      }
      ord.push(fim);
      reg('forJ', `j = ${fim}: a condição j < ${fim} é falsa e a passada acaba. arr[${fim}] = ${a[fim]} já está na posição definitiva.`,
        { vars: { n, i, j: fim }, ordenados: ord });
    }
    ord.push(0);
    reg('forI', `i = ${n - 1}: a condição i < ${n - 1} é falsa e o laço termina. O único elemento que sobrou, arr[0] = ${a[0]}, já está no lugar.`,
      { vars: { n, i: n - 1 }, ordenados: ord });
    reg('fim', 'bubbleSort termina e devolve o controle ao main.', { vars: { n }, ordenados: ord });
    g.pilha.pop();
    epilogo(g);
    return g.passos;
  }

  // ------------------------------------------------------------- Selection
  function selection(entrada, L) {
    const g = criarGravador(entrada, L);
    g.rotuloTrocas = 'trocas';
    const { arr: a, st, reg } = g;
    const n = a.length;
    const ord = [];
    prologo(g, 'selectionSort(arr, n)');
    g.pilha.push('selectionSort(arr, n)');
    reg('fn', `Entra em selectionSort com n = ${n}.`, { vars: { n } });
    for (let i = 0; i < n - 1; i++) {
      reg('forI', `i = ${i}: vamos descobrir o menor valor entre arr[${i}] e arr[${n - 1}] e colocá-lo na posição ${i}.`,
        { vars: { n, i }, ponteiros: { i }, marcas: { [i]: 'chave' }, ordenados: ord });
      let min = i;
      const alvo = (m, extra = {}) => ({ [i]: 'chave', [m]: 'min', ...extra });
      reg('min', `min = ${i}: por enquanto, o menor valor conhecido é arr[${i}] = ${a[i]}.`,
        { vars: { n, i, min }, ponteiros: { i, min }, marcas: alvo(min), ordenados: ord });
      for (let j = i + 1; j < n; j++) {
        const vars = () => ({ n, i, min, j });
        const pont = () => ({ i, min, j });
        reg('forJ', `j = ${j}: a condição j < ${n} é verdadeira. Próximo candidato: arr[${j}] = ${a[j]}.`,
          { vars: vars(), ponteiros: pont(), marcas: alvo(min, { [j]: 'comparar' }), ordenados: ord });
        st.comp++;
        const menor = a[j] < a[min];
        reg('if', `Compara arr[${j}] = ${a[j]} com o menor atual arr[${min}] = ${a[min]}: ${a[j]} < ${a[min]} é ${menor ? 'verdadeiro. Achamos um valor menor.' : 'falso. O menor continua o mesmo.'}`,
          { vars: vars(), ponteiros: pont(), marcas: alvo(min, { [j]: 'comparar' }), ordenados: ord });
        if (menor) {
          min = j;
          reg('setMin', `min = ${j}: agora o menor valor conhecido é arr[${j}] = ${a[j]}.`,
            { vars: vars(), ponteiros: pont(), marcas: alvo(min), ordenados: ord });
        }
      }
      reg('forJ', `j = ${n}: a condição j < ${n} é falsa e a busca acaba. O menor valor do trecho é arr[${min}] = ${a[min]}.`,
        { vars: { n, i, min, j: n }, ponteiros: { i, min }, marcas: alvo(min), ordenados: ord });
      const precisa = min !== i;
      reg('ifTroca', `min (${min}) ${precisa ? 'é diferente de' : 'é igual a'} i (${i}): ${precisa ? `o menor valor (${a[min]}) não está na posição certa. Vai trocar com arr[${i}].` : `arr[${i}] já é o menor do trecho. Não precisa trocar.`}`,
        { vars: { n, i, min }, ponteiros: { i, min }, marcas: alvo(min), ordenados: ord });
      if (precisa) {
        const tr = { ponteiros: { i, min }, marcas: { [i]: 'trocar', [min]: 'trocar' }, ordenados: ord };
        const temp = a[i];
        const vt = { n, i, min, temp };
        const flut = [{ nome: 'temp', valor: temp }];
        reg('t1', `temp guarda uma cópia de arr[${i}] (${temp}).`, { ...tr, vars: vt, flutuantes: flut });
        a[i] = a[min];
        reg('t2', `arr[${i}] recebe o menor valor, arr[${min}] = ${a[i]}.`, { ...tr, vars: vt, flutuantes: flut });
        a[min] = temp;
        st.trocas++;
        reg('t3', `arr[${min}] recebe temp (${temp}). O menor valor, ${a[i]}, está agora na posição definitiva ${i}.`, { ...tr, vars: vt, flutuantes: flut });
      }
      ord.push(i);
    }
    ord.push(n - 1);
    reg('forI', `i = ${n - 1}: a condição i < ${n - 1} é falsa e o laço termina. O último elemento, arr[${n - 1}] = ${a[n - 1]}, sobrou no lugar certo.`,
      { vars: { n, i: n - 1 }, ordenados: ord });
    reg('fim', 'selectionSort termina e devolve o controle ao main.', { vars: { n }, ordenados: ord });
    g.pilha.pop();
    epilogo(g);
    return g.passos;
  }

  // ------------------------------------------------------------- Insertion
  function insertion(entrada, L) {
    const g = criarGravador(entrada, L);
    g.rotuloTrocas = 'deslocamentos';
    const { arr: a, st, reg } = g;
    const n = a.length;
    prologo(g, 'insertionSort(arr, n)');
    g.pilha.push('insertionSort(arr, n)');
    reg('fn', `Entra em insertionSort com n = ${n}.`, { vars: { n } });
    for (let i = 1; i < n; i++) {
      const zona = [0, i - 1];
      reg('forI', `i = ${i}: vamos inserir arr[${i}] = ${a[i]} na parte da esquerda, arr[0..${i - 1}], que já está ordenada entre si.`,
        { vars: { n, i }, ponteiros: { i }, marcas: { [i]: 'chave' }, zona });
      const chave = a[i];
      const flut = [{ nome: 'chave', valor: chave }];
      reg('chave', `chave guarda ${chave}, o valor de arr[${i}]. Assim a posição ${i} pode ser sobrescrita sem perder o valor.`,
        { vars: { n, i, chave }, ponteiros: { i }, marcas: { [i]: 'chave' }, zona, flutuantes: flut });
      let j = i - 1;
      reg('jInit', `j = ${j}: começamos comparando a chave com o vizinho da esquerda, arr[${j}] = ${a[j]}.`,
        { vars: { n, i, chave, j }, ponteiros: { i, j }, marcas: { [i]: 'chave', [j]: 'comparar' }, zona, flutuantes: flut });
      for (;;) {
        const dentro = j >= 0;
        if (dentro) st.comp++;
        const segue = dentro && a[j] > chave;
        const expl = !dentro
          ? `j = ${j}: a condição j >= 0 é falsa. Chegamos ao início do vetor, então a chave é o menor valor até aqui.`
          : segue
            ? `arr[${j}] = ${a[j]} > chave = ${chave}? Verdadeiro. ${a[j]} precisa andar uma casa para a direita.`
            : `arr[${j}] = ${a[j]} > chave = ${chave}? Falso. ${a[j]} já é menor ou igual, então achamos o lugar da chave.`;
        const marcas = { [j + 1]: 'chave' };
        if (dentro) marcas[j] = 'comparar';
        reg('while', expl, { vars: { n, i, chave, j }, ponteiros: { i, j }, marcas, zona, flutuantes: flut });
        if (!segue) break;
        a[j + 1] = a[j];
        st.trocas++;
        reg('shift', `arr[${j + 1}] recebe arr[${j}] (${a[j]}): o valor andou uma casa para a direita. A posição ${j} agora é o "buraco" onde a chave pode entrar.`,
          { vars: { n, i, chave, j }, ponteiros: { i, j }, marcas: { [j + 1]: 'trocar', [j]: 'chave' }, zona, flutuantes: flut });
        j--;
        const marcasJ = { [j + 1]: 'chave' };
        if (j >= 0) marcasJ[j] = 'comparar';
        reg('jDec', `j-- faz j valer ${j}. ${j >= 0 ? `O próximo vizinho a comparar é arr[${j}] = ${a[j]}.` : 'Não há mais vizinhos à esquerda.'}`,
          { vars: { n, i, chave, j }, ponteiros: { i, j }, marcas: marcasJ, zona, flutuantes: flut });
      }
      a[j + 1] = chave;
      reg('coloca', `arr[${j + 1}] = chave: o ${chave} é inserido na posição ${j + 1}. Agora arr[0..${i}] está ordenado.`,
        { vars: { n, i, chave, j }, ponteiros: { i, j }, marcas: { [j + 1]: 'chave' }, zona: [0, i] });
    }
    reg('forI', `i = ${n}: a condição i < ${n} é falsa e o laço termina. Todo o vetor está ordenado.`,
      { vars: { n, i: n }, ordenados: todos(n) });
    reg('fim', 'insertionSort termina e devolve o controle ao main.', { vars: { n }, ordenados: todos(n) });
    g.pilha.pop();
    epilogo(g);
    return g.passos;
  }

  // ----------------------------------------------------------------- Quick
  function quick(entrada, L) {
    const g = criarGravador(entrada, L);
    g.rotuloTrocas = 'trocas';
    const { arr: a, st, reg } = g;
    const n = a.length;
    const ord = new Set();
    const pilha = g.pilha;
    const R = (tag, expl, o = {}) => reg(tag, expl, { ordenados: [...ord], ...o });
    const rotulo = (b, h) => `quickSort(${b}, ${h})`;

    function troca(ia, ib, ctx) {
      pilha.push(`troca(&arr[${ia}], &arr[${ib}])`);
      const base = { ...ctx, marcas: { ...ctx.marcas, [ia]: 'trocar', [ib]: 'trocar' } };
      R('tFn', `Entra em troca: a aponta para arr[${ia}] e b aponta para arr[${ib}].`,
        { ...base, vars: { ...ctx.vars, a: `&arr[${ia}]`, b: `&arr[${ib}]` } });
      const temp = a[ia];
      const vt = { ...ctx.vars, a: `&arr[${ia}]`, b: `&arr[${ib}]`, temp };
      const flut = [{ nome: 'temp', valor: temp }];
      R('t1', `temp guarda *a, ou seja, arr[${ia}] = ${temp}.`, { ...base, vars: vt, flutuantes: flut });
      a[ia] = a[ib];
      R('t2', `*a recebe *b: arr[${ia}] passa a valer ${a[ia]}, cópia de arr[${ib}].`, { ...base, vars: vt, flutuantes: flut });
      a[ib] = temp;
      st.trocas++;
      R('t3', `*b recebe temp: arr[${ib}] passa a valer ${temp}. ${ia === ib ? 'a e b apontam para a mesma posição, então nada mudou de verdade.' : 'Os dois valores trocaram de lugar.'}`,
        { ...base, vars: vt, flutuantes: flut });
      pilha.pop();
    }

    function particiona(baixo, alto) {
      pilha.push(`particiona(${baixo}, ${alto})`);
      const intervalo = [baixo, alto];
      R('pFn', `Entra em particiona(arr, ${baixo}, ${alto}): vai separar a fatia arr[${baixo}..${alto}] em menores e maiores que um pivô.`,
        { vars: { baixo, alto }, intervalo });
      const pivo = a[alto];
      R('pPivo', `O pivô é o último elemento da fatia: pivo = arr[${alto}] = ${pivo}.`,
        { vars: { baixo, alto, pivo }, intervalo, marcas: { [alto]: 'pivo' }, ponteiros: { pivo: alto } });
      let i = baixo - 1;
      const dados = (j) => {
        const ponteiros = { pivo: alto };
        if (i >= 0) ponteiros.i = i;
        if (j !== undefined && j < alto) ponteiros.j = j;
        return {
          vars: j === undefined ? { baixo, alto, pivo, i } : { baixo, alto, pivo, i, j },
          intervalo, ponteiros, zona: i >= baixo ? [baixo, i] : null,
          marcas: { [alto]: 'pivo' },
        };
      };
      R('pI', `i = ${i} (baixo - 1): i marca o fim da região dos menores que o pivô. Por enquanto ela está vazia.`, dados());
      for (let j = baixo; j < alto; j++) {
        const d = dados(j);
        R('pFor', `j = ${j}: a condição j < ${alto} é verdadeira. Próximo elemento a examinar: arr[${j}] = ${a[j]}.`,
          { ...d, marcas: { ...d.marcas, [j]: 'comparar' } });
        st.comp++;
        const menor = a[j] < pivo;
        R('pIf', `arr[${j}] = ${a[j]} < pivo = ${pivo}? ${menor ? 'Sim. Ele pertence à região dos menores.' : 'Não. É maior ou igual ao pivô e fica onde está, do lado dos maiores.'}`,
          { ...d, marcas: { ...d.marcas, [j]: 'comparar' } });
        if (!menor) continue;
        i++;
        const d2 = dados(j);
        R('pInc', `i++ faz i valer ${i}: a região dos menores cresce uma casa.`, { ...d2, marcas: { ...d2.marcas, [j]: 'comparar' } });
        R('pTroca', `Chama troca(&arr[${i}], &arr[${j}]): leva arr[${j}] = ${a[j]} para dentro da região dos menores.`,
          { ...d2, marcas: { ...d2.marcas, [j]: 'comparar', [i]: 'trocar' } });
        troca(i, j, d2);
      }
      const dFim = dados(alto);
      R('pFor', `j = ${alto}: a condição j < ${alto} é falsa e o laço termina. Toda a fatia foi examinada.`, { ...dFim, ponteiros: { ...dFim.ponteiros } });
      R('pFinal', `Chama troca(&arr[${i + 1}], &arr[${alto}]): coloca o pivô logo depois da região dos menores.`, { ...dFim, marcas: { [alto]: 'pivo', [i + 1]: 'trocar' } });
      troca(i + 1, alto, dFim);
      ord.add(i + 1);
      R('pRet', `return ${i + 1}: o pivô ${pivo} está na posição ${i + 1}, definitiva. À esquerda só há valores menores, à direita só maiores ou iguais.`,
        { vars: { baixo, alto, pivo, i }, intervalo, ponteiros: { p: i + 1 } });
      pilha.pop();
      return i + 1;
    }

    function qs(baixo, alto) {
      pilha.push(rotulo(baixo, alto));
      const intervalo = baixo <= alto ? [baixo, alto] : null;
      R('qFn', `Entra em ${rotulo(baixo, alto)}: ordenar a fatia arr[${baixo}..${alto}].`, { vars: { baixo, alto }, intervalo });
      if (baixo < alto) {
        R('qIf', `baixo (${baixo}) < alto (${alto}) é verdadeiro: a fatia tem ${alto - baixo + 1} elementos e ainda precisa ser ordenada.`, { vars: { baixo, alto }, intervalo });
        const p = particiona(baixo, alto);
        R('qPart', `p recebe ${p}: o pivô já está no lugar certo. Faltam a fatia da esquerda, arr[${baixo}..${p - 1}], e a da direita, arr[${p + 1}..${alto}].`,
          { vars: { baixo, alto, p }, intervalo, ponteiros: { p } });
        R('qEsq', `Chama ${rotulo(baixo, p - 1)} para ordenar o lado esquerdo.`, { vars: { baixo, alto, p }, intervalo, ponteiros: { p } });
        qs(baixo, p - 1);
        R('qDir', `De volta em ${rotulo(baixo, alto)}. Agora chama ${rotulo(p + 1, alto)} para ordenar o lado direito.`, { vars: { baixo, alto, p }, intervalo, ponteiros: { p } });
        qs(p + 1, alto);
      } else {
        if (baixo === alto) ord.add(baixo);
        R('qIf', `baixo (${baixo}) < alto (${alto}) é falso: ${baixo === alto ? 'a fatia tem um só elemento, que já está no lugar.' : 'a fatia é vazia.'} É o caso base: nada a fazer.`,
          { vars: { baixo, alto }, intervalo });
      }
      R('qFim', `${rotulo(baixo, alto)} termina e devolve o controle a quem o chamou.`, { vars: { baixo, alto }, intervalo });
      pilha.pop();
    }

    prologo(g, 'quickSort(arr, 0, n - 1)');
    qs(0, n - 1);
    epilogo(g);
    return g.passos;
  }

  const GERADORES = { bubble, selection, insertion, quick };
  S.gerarPassos = (id, valores) => GERADORES[id](valores, S.mapaLinhas(id));
})();
