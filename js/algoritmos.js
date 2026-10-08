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

  function prologo(g, chamada, v = 'arr') {
    const n = g.arr.length;
    g.reg('decl', `main declara o vetor ${v} com ${n} valores: ${lista(g.arr)}.`);
    g.reg('nDecl', `n recebe o número de elementos: sizeof(${v}) / sizeof(${v}[0]) = ${n}.`, { vars: { n } });
    g.reg('chama', `main chama ${chamada}. O vetor é passado por referência, então a função altera o próprio ${v}.`, { vars: { n } });
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
  // Versão do usuário: float v[], troca inline com aux, pivô = último, i começa em inicio.
  function quick(entrada, L) {
    const g = criarGravador(entrada, L);
    g.rotuloTrocas = 'trocas';
    const { arr: a, st, reg } = g;
    const n = a.length;
    const ord = new Set();
    const pilha = g.pilha;
    const R = (tag, expl, o = {}) => reg(tag, expl, { ordenados: [...ord], ...o });
    const rotulo = (b, h) => `quickSort(v, ${b}, ${h})`;
    const f2 = (x) => x.toFixed(2);

    function qs(inicio, fim) {
      pilha.push(rotulo(inicio, fim));
      const intervalo = inicio <= fim ? [inicio, fim] : null;
      // variáveis locais: só aparecem depois de receberem valor (antes disso têm lixo na memória)
      const loc = { inicio, fim };
      R('qFn', `Entra em ${rotulo(inicio, fim)}: ordenar a fatia v[${inicio}..${fim}]. As variáveis i, j, pivo e aux são declaradas, mas ainda não têm valor.`,
        { vars: loc, intervalo });
      const base = inicio >= fim;
      if (base && inicio === fim) ord.add(inicio);
      R('qIf', `inicio (${inicio}) >= fim (${fim}) é ${base
        ? `verdadeiro: ${inicio === fim ? 'a fatia tem um só elemento, que já está no lugar.' : 'a fatia é vazia.'} É o caso base.`
        : `falso: a fatia tem ${fim - inicio + 1} elementos e precisa ser ordenada.`}`, { vars: loc, intervalo });
      if (base) {
        R('qRet', `return: não há nada a ordenar, então ${rotulo(inicio, fim)} volta para quem o chamou.`, { vars: loc, intervalo });
        pilha.pop();
        return;
      }

      loc.pivo = a[fim];
      const pivo = loc.pivo;
      R('pPivo', `pivo = v[${fim}] = ${pivo}: o pivô é o último elemento da fatia.`,
        { vars: loc, intervalo, marcas: { [fim]: 'pivo' }, ponteiros: { pivo: fim } });
      loc.i = inicio;
      // i = próxima posição livre da região dos menores, que é v[inicio..i-1]
      const dados = (marcas = {}, j) => {
        const ponteiros = { pivo: fim, i: loc.i };
        if (j !== undefined && j < fim) ponteiros.j = j;
        return {
          vars: loc, intervalo, ponteiros,
          zona: loc.i > inicio ? [inicio, loc.i - 1] : null,
          marcas: { [fim]: 'pivo', ...marcas },
        };
      };
      R('pI', `i = ${loc.i} (inicio): i marca a próxima posição onde vai entrar um valor menor que o pivô. A região dos menores, v[inicio..i-1], ainda está vazia.`, dados());

      for (let j = inicio; j < fim; j++) {
        loc.j = j;
        R('pFor', `j = ${j}: a condição j < ${fim} é verdadeira. Próximo elemento a examinar: v[${j}] = ${a[j]}.`, dados({ [j]: 'comparar' }, j));
        st.comp++;
        const menor = a[j] < pivo;
        R('pIf', `v[${j}] = ${a[j]} < pivo = ${pivo}? ${menor ? 'Sim. Ele pertence à região dos menores e vai para a posição i.' : 'Não. É maior ou igual ao pivô e fica onde está, do lado dos maiores.'}`,
          dados({ [j]: 'comparar' }, j));
        if (!menor) continue;
        const i = loc.i;
        const par = { [i]: 'trocar', [j]: 'trocar' };
        loc.aux = a[i];
        const flut = [{ nome: 'aux', valor: loc.aux }];
        R('s1', `aux guarda v[${i}] = ${loc.aux}, para esse valor não se perder.`, { ...dados(par, j), flutuantes: flut });
        a[i] = a[j];
        R('s2', `v[${i}] recebe v[${j}]: agora vale ${a[i]}.`, { ...dados(par, j), flutuantes: flut });
        a[j] = loc.aux;
        st.trocas++;
        R('s3', `v[${j}] recebe aux (${loc.aux}). ${i === j ? 'i e j são a mesma posição, então nada mudou de verdade.' : 'Os dois valores trocaram de lugar.'}`, { ...dados(par, j), flutuantes: flut });
        loc.i++;
        R('pInc', `i++ faz i valer ${loc.i}: a região dos menores cresceu uma casa.`, dados({}, j));
      }
      loc.j = fim;
      R('pFor', `j = ${fim}: a condição j < ${fim} é falsa e o laço termina. Toda a fatia foi examinada.`, dados());

      const i = loc.i;
      const par = { [i]: 'trocar', [fim]: 'trocar' };
      loc.aux = a[i];
      const flut = [{ nome: 'aux', valor: loc.aux }];
      R('f1', `aux guarda v[${i}] = ${loc.aux}. Agora o pivô vai ocupar a posição i, logo depois da região dos menores.`, { ...dados(par), flutuantes: flut });
      a[i] = a[fim];
      R('f2', `v[${i}] recebe v[${fim}] (o pivô, ${a[i]}).`, { ...dados(par), flutuantes: flut });
      a[fim] = loc.aux;
      st.trocas++;
      ord.add(i);
      R('f3', `v[${fim}] recebe aux (${loc.aux}). ${i === fim ? 'O pivô já era o maior da fatia e continua no fim.' : 'O valor que estava em i foi para o fim da fatia.'} O pivô ${pivo} está na posição ${i}, definitiva.`,
        { ...dados(par), flutuantes: flut, zona: null });
      R('pPrint', `printf escreve na tela: "Pivo: ${f2(pivo)} | inicio: ${inicio} | fim: ${fim} | posicao final do pivo: ${i}".`,
        { vars: loc, intervalo, ponteiros: { p: i } });
      R('qEsq', `Chama ${rotulo(inicio, i - 1)} para ordenar o lado esquerdo (só valores menores que ${pivo}).`, { vars: loc, intervalo, ponteiros: { p: i } });
      qs(inicio, i - 1);
      R('qDir', `De volta em ${rotulo(inicio, fim)}. Agora chama ${rotulo(i + 1, fim)} para ordenar o lado direito (valores maiores ou iguais a ${pivo}).`, { vars: loc, intervalo, ponteiros: { p: i } });
      qs(i + 1, fim);
      R('qFim', `${rotulo(inicio, fim)} termina e devolve o controle a quem o chamou.`, { vars: loc, intervalo });
      pilha.pop();
    }

    prologo(g, 'quickSort(v, 0, n - 1)', 'v');
    qs(0, n - 1);
    epilogo(g);
    return g.passos;
  }

  const GERADORES = { bubble, selection, insertion, quick };
  S.gerarPassos = (id, valores) => GERADORES[id](valores, S.mapaLinhas(id));
})();
