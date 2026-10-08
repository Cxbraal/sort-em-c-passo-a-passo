// Estado da página e controles: escolha do algoritmo, entrada de valores e reprodução.
(function () {
  const S = globalThis.SortViz;
  const V = S.visual;
  const $ = (id) => document.getElementById(id);

  const ICONE_PLAY = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 2v12l10-6z"/></svg>';
  const ICONE_PAUSA = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3.5 2h3.5v12H3.5zM9 2h3.5v12H9z"/></svg>';

  const estado = {
    algoId: 'bubble',
    valores: [64, 34, 25, 12, 22, 11, 90],
    linhas: [],
    passos: [],
    i: 0,
    tocando: false,
    timer: 0,
  };

  const algo = () => S.ALGORITMOS[estado.algoId];
  const ultimo = () => estado.passos.length - 1;
  const atraso = () => 1400 * Math.pow(0.72, Number($('campo-vel').value) - 1);

  // ---------------------------------------------------------- reprodução
  function mostrar() {
    const ant = estado.i > 0 ? estado.passos[estado.i - 1] : null;
    V.mostrarPasso(estado.passos[estado.i], ant, { algo: algo(), linhas: estado.linhas, indice: estado.i, total: estado.passos.length });
    $('linha-tempo').value = estado.i;
    $('btn-reset').disabled = estado.i === 0;
    $('btn-voltar').disabled = estado.i === 0;
    $('btn-avancar').disabled = estado.i === ultimo();
  }

  function ir(i) {
    estado.i = Math.max(0, Math.min(ultimo(), i));
    mostrar();
  }

  function atualizarBotaoPlay() {
    const b = $('btn-play');
    b.innerHTML = estado.tocando ? ICONE_PAUSA : ICONE_PLAY;
    b.setAttribute('aria-label', estado.tocando ? 'Pausar' : 'Executar');
    // leitores de tela não devem narrar cada passo durante a execução automática
    $('p-texto').setAttribute('aria-live', estado.tocando ? 'off' : 'polite');
  }

  function agendar() {
    clearTimeout(estado.timer);
    estado.timer = setTimeout(() => {
      if (estado.i >= ultimo()) return pausar();
      ir(estado.i + 1);
      agendar();
    }, atraso());
  }

  function tocar() {
    if (estado.i >= ultimo()) estado.i = 0;
    estado.tocando = true;
    atualizarBotaoPlay();
    ir(estado.i);
    agendar();
  }

  function pausar() {
    clearTimeout(estado.timer);
    estado.tocando = false;
    atualizarBotaoPlay();
  }

  const alternar = () => (estado.tocando ? pausar() : tocar());
  const avancar = () => { pausar(); ir(estado.i + 1); };
  const voltar = () => { pausar(); ir(estado.i - 1); };
  const reiniciar = () => { pausar(); ir(0); };

  // ----------------------------------------------------- algoritmo e dados
  function recalcular() {
    clearTimeout(estado.timer);
    estado.tocando = false;
    atualizarBotaoPlay();
    const a = algo();
    estado.linhas = S.montarCodigo(a.id, estado.valores);
    estado.passos = S.gerarPassos(a.id, estado.valores);
    estado.i = 0;
    $('linha-tempo').max = ultimo();
    $('breadcrumb').textContent = `algoritmos  ›  ${a.arquivo}  ›  ${a.funcao}`;
    document.title = `${a.nome} em C passo a passo`;
    V.montarEditor(estado.linhas);
    V.montarColunas(estado.valores);
    V.montarResumo(a);
    marcarAtivo();
    mostrar();
  }

  function escolherAlgoritmo(id) {
    if (id === estado.algoId) return;
    estado.algoId = id;
    recalcular();
  }

  function montarAbas() {
    $('abas').innerHTML = S.ORDEM.map((id) =>
      `<button type="button" role="tab" class="aba" data-id="${id}"><span class="ico-c" aria-hidden="true">C</span>${S.ALGORITMOS[id].arquivo}</button>`,
    ).join('');
    $('arquivos').innerHTML = S.ORDEM.map((id) =>
      `<li><button type="button" class="arquivo" data-id="${id}"><span class="ico-c" aria-hidden="true">C</span>${S.ALGORITMOS[id].arquivo}</button></li>`,
    ).join('');
  }

  function marcarAtivo() {
    document.querySelectorAll('.aba[data-id], .arquivo[data-id]').forEach((el) => {
      const ativo = el.dataset.id === estado.algoId;
      el.classList.toggle('ativa', ativo);
      if (el.classList.contains('aba')) {
        el.setAttribute('aria-selected', String(ativo));
        el.tabIndex = ativo ? 0 : -1;
      }
    });
  }

  function mostrarErro(msg) {
    const campo = $('campo-valores');
    const caixa = $('erro-entrada');
    caixa.hidden = !msg;
    caixa.textContent = msg || '';
    campo.setAttribute('aria-invalid', String(Boolean(msg)));
  }

  function aplicarValores(valores) {
    estado.valores = valores;
    $('campo-valores').value = valores.join(', ');
    mostrarErro('');
    recalcular();
  }

  // -------------------------------------------------------------- eventos
  function ligarEventos() {
    document.addEventListener('click', (e) => {
      const alvo = e.target.closest('[data-id]');
      if (alvo) escolherAlgoritmo(alvo.dataset.id);
    });

    $('abas').addEventListener('keydown', (e) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!passo) return;
      const i = S.ORDEM.indexOf(estado.algoId);
      escolherAlgoritmo(S.ORDEM[(i + passo + S.ORDEM.length) % S.ORDEM.length]);
      $('abas').querySelector('.aba.ativa').focus();
    });

    $('form-entrada').addEventListener('submit', (e) => {
      e.preventDefault();
      const r = S.validarEntrada($('campo-valores').value);
      if (r.erro) return mostrarErro(r.erro);
      aplicarValores(r.valores);
    });
    $('campo-valores').addEventListener('input', () => mostrarErro(''));
    $('campo-qtd').addEventListener('input', (e) => { $('saida-qtd').textContent = e.target.value; });
    $('btn-aleatorio').addEventListener('click', () => aplicarValores(S.aleatorios(Number($('campo-qtd').value))));

    $('btn-play').addEventListener('click', alternar);
    $('btn-avancar').addEventListener('click', avancar);
    $('btn-voltar').addEventListener('click', voltar);
    $('btn-reset').addEventListener('click', reiniciar);
    $('linha-tempo').addEventListener('input', (e) => { pausar(); ir(Number(e.target.value)); });
    $('btn-explorer').addEventListener('click', () => {
      const oculto = $('app').classList.toggle('sem-sidebar');
      $('btn-explorer').setAttribute('aria-pressed', String(!oculto));
      $('btn-explorer').classList.toggle('ativa', !oculto);
    });

    document.querySelectorAll('.painel-aba').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('.painel-aba').forEach((x) => {
        const ativa = x === b;
        x.classList.toggle('ativa', ativa);
        x.setAttribute('aria-selected', String(ativa));
      });
      $('painel-passo').hidden = b.dataset.aba !== 'passo';
      $('painel-resumo').hidden = b.dataset.aba !== 'resumo';
    }));

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input[type="text"], textarea')) return;
      if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); alternar(); }
      else if (e.key === 'ArrowRight' && !e.target.closest('[role="tablist"], input[type="range"]')) avancar();
      else if (e.key === 'ArrowLeft' && !e.target.closest('[role="tablist"], input[type="range"]')) voltar();
      else if (e.key === 'Home' && !e.target.closest('input[type="range"]')) reiniciar();
    });
  }

  // ------------------------------------------------------------- partida
  V.montarLegenda();
  V.montarStatus();
  montarAbas();
  ligarEventos();
  $('campo-valores').value = estado.valores.join(', ');
  recalcular();
})();
