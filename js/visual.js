// Desenho da página: editor, colunas (barras + memória), painel e barra de status.
(function () {
  const S = globalThis.SortViz;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const LEGENDA = [
    ['comparar', 'Comparando'],
    ['trocar', 'Trocando ou escrevendo'],
    ['pivo', 'Pivô'],
    ['min', 'Menor encontrado'],
    ['chave', 'Chave ou destino'],
    ['zona', 'Região organizada'],
    ['ordenado', 'Posição final'],
  ];

  let colunas = [];
  let maxValor = 1;

  function montarLegenda() {
    $('legenda').innerHTML = LEGENDA.map(([k, t]) => `<li class="m-${k}">${t}</li>`).join('');
  }

  function montarEditor(linhas) {
    $('editor').innerHTML = linhas.map((txt, i) =>
      `<div class="linha" id="L${i + 1}"><span class="seta" aria-hidden="true"></span><span class="num">${i + 1}</span><span class="cod">${S.destacar(txt) || ' '}</span></div>`,
    ).join('');
    $('editor').scrollTop = 0;
  }

  function destacarLinha(n) {
    const ed = $('editor');
    const ant = ed.querySelector('.linha.ativa');
    if (ant) ant.classList.remove('ativa');
    const el = $(`L${n}`);
    if (!el) return;
    el.classList.add('ativa');
    // rola só o editor (nunca a página) e só se a linha saiu da área visível
    if (el.offsetTop < ed.scrollTop + 20 || el.offsetTop + el.offsetHeight > ed.scrollTop + ed.clientHeight - 20) {
      ed.scrollTop = Math.max(0, el.offsetTop - ed.clientHeight / 2);
    }
  }

  function montarColunas(valores) {
    maxValor = Math.max(...valores);
    const viz = $('viz');
    viz.innerHTML = valores.map((_, i) =>
      `<div class="col m-normal"><div class="barra-area"><div class="barra"></div></div><div class="celula"></div><div class="idx">${i}</div><div class="ptrs"></div></div>`,
    ).join('');
    colunas = [...viz.children].map((col) => ({
      col, barra: col.querySelector('.barra'), celula: col.querySelector('.celula'), ptrs: col.querySelector('.ptrs'),
    }));
  }

  function pintarColunas(p) {
    const ord = new Set(p.ordenados);
    const porIdx = {};
    for (const [nome, k] of Object.entries(p.ponteiros)) {
      if (k >= 0 && k < p.arr.length) (porIdx[k] = porIdx[k] || []).push(nome);
    }
    colunas.forEach((c, i) => {
      const marca = p.marcas[i];
      const naZona = p.zona && i >= p.zona[0] && i <= p.zona[1];
      const tipo = marca || (ord.has(i) ? 'ordenado' : naZona ? 'zona' : 'normal');
      const fora = p.intervalo && !marca && !ord.has(i) && (i < p.intervalo[0] || i > p.intervalo[1]);
      c.col.className = `col m-${tipo}${fora ? ' fora' : ''}`;
      c.barra.style.height = `${Math.max(4, (p.arr[i] / maxValor) * 100)}%`;
      c.celula.textContent = p.arr[i];
      c.ptrs.innerHTML = (porIdx[i] || []).map((nome) => `<span class="ptr">${esc(nome)}</span>`).join('');
    });
    $('viz').setAttribute('aria-label', `Vetor: ${p.arr.join(', ')}`);
    $('flutuantes').innerHTML = p.flutuantes.map((f) =>
      `<span class="flut"><b>${esc(f.nome)}</b> = <span class="v">${esc(f.valor)}</span></span>`).join('');
    $('intervalo').textContent = p.intervalo ? `fatia ativa: arr[${p.intervalo[0]}..${p.intervalo[1]}]` : '';
  }

  function pintarPainel(p, ant, ctx) {
    $('p-linha').innerHTML = `<span class="p-ln">linha ${p.linha}</span>${S.destacar(ctx.linhas[p.linha - 1].trim())}`;
    $('p-texto').textContent = p.expl;
    const nomes = Object.keys(p.vars);
    $('p-vars').innerHTML = nomes.length
      ? nomes.map((k) => {
        const v = p.vars[k];
        const mudou = ant && ant.vars[k] !== v;
        return `<tr class="${mudou ? 'mudou' : ''}"><td class="v-nome">${esc(k)}</td><td class="v-valor ${typeof v === 'string' ? 'tk-s' : 'tk-n'}">${esc(v)}</td></tr>`;
      }).join('')
      : '<tr><td class="vazio" colspan="2">Nenhuma variável criada ainda.</td></tr>';
    $('p-pilha').innerHTML = p.pilha.map((f, i) => `<li class="${i === p.pilha.length - 1 ? 'topo' : ''}">${esc(f)}</li>`).join('');
    $('painel-info').textContent =
      `passo ${ctx.indice + 1} de ${ctx.total} · comparações: ${p.comp} · ${ctx.algo.rotuloTrocas}: ${p.trocas}`;
  }

  function montarResumo(algo) {
    const c = algo.complexidade;
    $('painel-resumo').innerHTML =
      `<h3>${esc(algo.nome)}</h3>${algo.resumo.map((t) => `<p>${esc(t)}</p>`).join('')}` +
      `<dl><dt>Melhor caso</dt><dt>Caso médio</dt><dt>Pior caso</dt><dt>Memória extra</dt><dt>Estável</dt>` +
      `<dd>${c.melhor}</dd><dd>${c.medio}</dd><dd>${c.pior}</dd><dd>${c.espaco}</dd><dd>${c.estavel}</dd></dl>`;
  }

  function montarStatus() {
    $('statusbar').innerHTML =
      '<span class="sb-item" id="sb-arquivo"></span><span class="sb-item" id="sb-linha"></span>' +
      '<span class="sb-item" id="sb-passo"></span><span class="sb-item sb-dir">C</span>';
  }

  function mostrarPasso(p, ant, ctx) {
    destacarLinha(p.linha);
    pintarColunas(p);
    pintarPainel(p, ant, ctx);
    $('sb-arquivo').textContent = ctx.algo.arquivo;
    $('sb-linha').textContent = `Ln ${p.linha}, Col 1`;
    $('sb-passo').textContent = `Passo ${ctx.indice + 1}/${ctx.total}`;
  }

  S.visual = { montarLegenda, montarEditor, montarColunas, montarResumo, montarStatus, mostrarPasso };
})();
