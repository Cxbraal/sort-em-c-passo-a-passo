// Colorização de sintaxe de C no estilo do tema Dark+ do VSCode.
(function () {
  const S = (globalThis.SortViz = globalThis.SortViz || {});

  const CONTROLE = new Set(['for', 'while', 'if', 'else', 'return', 'break', 'continue', 'do', 'switch', 'case']);
  const TIPO = new Set(['int', 'void', 'char', 'float', 'double', 'long', 'short', 'unsigned', 'const', 'static', 'sizeof']);

  const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (cls, s) => `<span class="${cls}">${escapar(s)}</span>`;

  // Grupos: comentário, string, diretiva, <header.h>, número, chamada, identificador, qualquer outro
  const RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(#\s*\w+)|(<[a-z_.]+\.h>)|(\b\d+\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|([\s\S])/g;

  function destacar(linha) {
    return linha.replace(RE, (m, com, str, dir, hdr, num, chamada, id) => {
      if (com) return span('tk-c', m);
      if (str || hdr) return span('tk-s', m);
      if (dir) return span('tk-d', m);
      if (num) return span('tk-n', m);
      const palavra = chamada || id;
      if (palavra) {
        if (CONTROLE.has(palavra)) return span('tk-d', m);
        if (TIPO.has(palavra)) return span('tk-k', m);
        return span(chamada ? 'tk-f' : 'tk-v', m);
      }
      return escapar(m);
    });
  }

  S.destacar = destacar;
})();
