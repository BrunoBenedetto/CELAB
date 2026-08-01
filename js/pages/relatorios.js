/* ==========================================================================
   CELAB — Aba: Relatórios e Filtros
   --------------------------------------------------------------------------
   Histórico completo: entradas, saídas, cadastros diretos, alterações de
   status e exclusões. Uma linha do filtro escopa tudo — indicadores, tabela
   e exportação leem sempre a mesma fatia.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;
  var U = CELAB.util;

  var POR_PAGINA = 30;

  var filtros = {
    de: '', ate: '', tipo: '', predio: '', status: '',
    equipamento: '', modelo: '', tombo: '', chamado: '', busca: ''
  };
  var ordem = { campo: 'registradoEm', direcao: 'desc' };
  var pagina = 1;

  /* ---------- Filtro --------------------------------------------------------- */

  function filtrar() {
    var lista = CELAB.store.listarMovimentacoes();

    if (filtros.de)  lista = lista.filter(function (m) { return (m.data || '') >= filtros.de; });
    if (filtros.ate) lista = lista.filter(function (m) { return (m.data || '') <= filtros.ate; });
    if (filtros.tipo)        lista = lista.filter(function (m) { return m.tipo === filtros.tipo; });
    if (filtros.predio)      lista = lista.filter(function (m) { return m.predio === filtros.predio; });
    if (filtros.status)      lista = lista.filter(function (m) { return m.statusResultante === filtros.status; });
    if (filtros.equipamento) lista = lista.filter(function (m) { return m.equipamento === filtros.equipamento; });
    if (filtros.modelo)      lista = lista.filter(function (m) { return m.modelo === filtros.modelo; });

    if (filtros.tombo) {
      var t = U.slug(filtros.tombo);
      lista = lista.filter(function (m) {
        return U.slug(m.tomboNovo).indexOf(t) > -1 || U.slug(m.tomboAntigo).indexOf(t) > -1;
      });
    }
    if (filtros.chamado) {
      var c = U.slug(filtros.chamado);
      lista = lista.filter(function (m) { return U.slug(m.chamado).indexOf(c) > -1; });
    }
    if (filtros.busca) {
      var b = U.slug(filtros.busca);
      lista = lista.filter(function (m) {
        return U.slug([
          m.equipamento, m.modelo, m.tomboNovo, m.tomboAntigo, m.chamado,
          m.predio, m.setor, m.servicoSolicitado, m.observacao, m.usuario
        ].join(' ')).indexOf(b) > -1;
      });
    }

    return U.ordenarPor(lista, ordem.campo, ordem.direcao);
  }

  function temFiltroAtivo() {
    return Object.keys(filtros).some(function (k) { return !!filtros[k]; });
  }

  function rotuloFiltro() {
    var p = [];
    if (filtros.de || filtros.ate) {
      p.push('Período: ' + (filtros.de ? U.dataBR(filtros.de) : 'início') +
             ' a ' + (filtros.ate ? U.dataBR(filtros.ate) : 'hoje'));
    }
    if (filtros.tipo)        p.push('Tipo: ' + CELAB.tipoMovMeta(filtros.tipo).rotulo);
    if (filtros.predio)      p.push('Prédio: ' + filtros.predio);
    if (filtros.status)      p.push('Status: ' + filtros.status);
    if (filtros.equipamento) p.push('Equipamento: ' + filtros.equipamento);
    if (filtros.modelo)      p.push('Modelo: ' + filtros.modelo);
    if (filtros.tombo)       p.push('Tombo: ' + filtros.tombo);
    if (filtros.chamado)     p.push('Chamado: ' + filtros.chamado);
    if (filtros.busca)       p.push('Busca: "' + filtros.busca + '"');
    return p.length ? p.join(' · ') : 'Sem filtros aplicados — histórico completo';
  }

  /* ---------- Esqueleto ------------------------------------------------------- */

  function esqueleto() {
    return '' +
      '<div class="page-head">' +
        '<div>' +
          '<h1 class="page-head__title">Relatórios e Filtros</h1>' +
          '<p class="page-head__sub">Histórico completo de entradas, saídas e alterações de estoque</p>' +
        '</div>' +
        '<div class="page-head__spacer"></div>' +
        '<div class="btn-group">' +
          '<button class="btn btn--outline" data-acao="excel">' +
            UI.icone('excel', 16) + '<span>Exportar Excel</span></button>' +
          '<button class="btn btn--outline" data-acao="pdf">' +
            UI.icone('pdf', 16) + '<span>Exportar PDF</span></button>' +
        '</div>' +
      '</div>' +

      // Uma única linha de filtros acima de tudo que ela escopa.
      '<div class="filter-bar">' +
        '<div class="field"><label for="r-de">De</label>' +
          '<input class="input" type="date" id="r-de"></div>' +
        '<div class="field"><label for="r-ate">Até</label>' +
          '<input class="input" type="date" id="r-ate"></div>' +
        '<div class="field"><label for="r-tipo">Movimentação</label>' +
          '<select class="select" id="r-tipo">' +
            UI.opcoes(CELAB.TIPOS_MOV.map(function (t) { return { valor: t.valor, rotulo: t.rotulo }; }), '', 'Todas') +
          '</select></div>' +
        '<div class="field field--grow"><label for="r-predio">Prédio</label>' +
          '<select class="select" id="r-predio">' + UI.opcoes(CELAB.PREDIOS, '', 'Todos') + '</select></div>' +
        '<div class="field"><label for="r-status">Status</label>' +
          '<select class="select" id="r-status">' + UI.opcoes(CELAB.STATUS_TODOS, '', 'Todos') + '</select></div>' +
        '<div class="field"><label for="r-equip">Equipamento</label>' +
          '<select class="select" id="r-equip">' + UI.opcoes(CELAB.EQUIPAMENTOS, '', 'Todos') + '</select></div>' +
        '<div class="field"><label for="r-modelo">Modelo</label>' +
          '<select class="select" id="r-modelo">' + UI.opcoes(CELAB.MODELOS, '', 'Todos') + '</select></div>' +
        '<div class="field"><label for="r-tombo">Tombo</label>' +
          '<input class="input" type="search" id="r-tombo" placeholder="Novo ou antigo"></div>' +
        '<div class="field"><label for="r-chamado">Chamado</label>' +
          '<input class="input" type="search" id="r-chamado" placeholder="Ex.: CH-10450"></div>' +
        '<div class="field field--grow"><label for="r-busca">Busca livre</label>' +
          '<input class="input" type="search" id="r-busca" placeholder="Setor, serviço, observação, usuário…"></div>' +
        '<div style="display:flex;gap:8px;margin-bottom:1px">' +
          '<button class="btn btn--ghost btn--sm" data-acao="periodo" data-dias="7">7 dias</button>' +
          '<button class="btn btn--ghost btn--sm" data-acao="periodo" data-dias="30">30 dias</button>' +
          '<button class="btn btn--ghost btn--sm" data-acao="limpar">' +
            UI.icone('limpar', 14) + '<span>Limpar</span></button>' +
        '</div>' +
      '</div>' +

      '<div class="kpi-row" id="r-kpis"></div>' +

      '<div class="card">' +
        '<div class="card__head">' +
          '<div>' +
            '<div class="card__title">Movimentações</div>' +
            '<div class="card__sub" id="r-legenda-filtro"></div>' +
          '</div>' +
        '</div>' +
        '<div class="card__body card__body--flush">' +
          '<div class="table-wrap" id="r-tabela"></div>' +
        '</div>' +
        '<div class="table-foot" id="r-rodape"></div>' +
      '</div>';
  }

  /* ---------- Render ---------------------------------------------------------- */

  var COLUNAS = [
    { chave: 'data',             titulo: 'Data',         ordenavel: true },
    { chave: 'tipo',             titulo: 'Movimentação', ordenavel: true },
    { chave: 'chamado',          titulo: 'Chamado',      ordenavel: true },
    { chave: 'equipamento',      titulo: 'Equipamento',  ordenavel: true },
    { chave: 'modelo',           titulo: 'Modelo',       ordenavel: true },
    { chave: 'tomboNovo',        titulo: 'Tombo Novo',   ordenavel: true },
    { chave: 'tomboAntigo',      titulo: 'Tombo Antigo', ordenavel: true },
    { chave: 'statusResultante', titulo: 'Situação',     ordenavel: true },
    { chave: 'predio',           titulo: 'Prédio',       ordenavel: true },
    { chave: 'setor',            titulo: 'Setor',        ordenavel: true },
    { chave: 'ttr',              titulo: 'TTR',          ordenavel: true },
    { chave: 'usuario',          titulo: 'Usuário',      ordenavel: true }
  ];

  function desenhar(container) {
    var lista = filtrar();

    /* --- indicadores da fatia filtrada --- */
    var conta = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, CADASTRO: 0, EXCLUSAO: 0 };
    lista.forEach(function (m) { if (conta[m.tipo] != null) conta[m.tipo]++; });

    function tile(classe, rotulo, valor, rodape) {
      return '<div class="stat ' + classe + '">' +
        '<div class="stat__label"><span class="dot"></span>' + U.esc(rotulo) + '</div>' +
        '<div class="stat__value">' + U.numero(valor) + '</div>' +
        '<div class="stat__foot">' + U.esc(rodape) + '</div></div>';
    }

    container.querySelector('#r-kpis').innerHTML =
      tile('stat--brand', 'Movimentações no filtro', lista.length, 'Total de registros encontrados') +
      tile('stat--good', 'Entradas', conta.ENTRADA, 'Chegadas ao laboratório') +
      tile('stat--serious', 'Saídas', conta.SAIDA, 'Envios às unidades') +
      tile('stat--neutral', 'Cadastros e alterações', conta.CADASTRO + conta.AJUSTE + conta.EXCLUSAO,
        'Ajustes diretos no estoque');

    container.querySelector('#r-legenda-filtro').textContent = rotuloFiltro();

    /* --- tabela --- */
    var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;
    var fatia = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    var alvo = container.querySelector('#r-tabela');

    if (!lista.length) {
      alvo.innerHTML = UI.estadoVazio('Nenhuma movimentação encontrada',
        temFiltroAtivo()
          ? 'Ajuste ou limpe os filtros para ampliar o resultado.'
          : 'Registre uma entrada ou saída para começar o histórico.');
      container.querySelector('#r-rodape').innerHTML = '<span>0 registros</span><span class="spacer"></span>';
      return;
    }

    var html = '<table class="table"><thead><tr>';
    COLUNAS.forEach(function (c) {
      var ativo = ordem.campo === c.chave;
      html += '<th class="sortable' + (ativo ? ' is-sorted' : '') + '" data-ordenar="' + c.chave +
        '" role="button" tabindex="0" aria-sort="' +
        (ativo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
        U.esc(c.titulo) + '<span class="sort-ind">' +
        (ativo ? (ordem.direcao === 'asc' ? '▲' : '▼') : '↕') + '</span></th>';
    });
    html += '<th class="col-actions">Detalhes</th></tr></thead><tbody>';

    fatia.forEach(function (m) {
      html += '<tr>' +
        '<td class="num">' + U.dataBR(m.data) + '</td>' +
        '<td>' + UI.chipTipoMov(m.tipo) + '</td>' +
        '<td class="num">' + (m.chamado ? U.esc(m.chamado) : '<span class="muted">—</span>') + '</td>' +
        '<td class="strong">' + U.esc(m.equipamento || '—') + '</td>' +
        '<td>' + U.esc(m.modelo || '—') + '</td>' +
        '<td class="num tombo">' + (m.tomboNovo ? U.esc(m.tomboNovo) : '<span class="muted">—</span>') + '</td>' +
        '<td class="num tombo">' + (m.tomboAntigo ? U.esc(m.tomboAntigo) : '<span class="muted">—</span>') + '</td>' +
        '<td>' + (m.statusResultante && m.statusResultante !== '—'
                    ? UI.chipStatus(m.statusResultante) : '<span class="muted">—</span>') + '</td>' +
        '<td>' + U.esc(m.predio || '—') + '</td>' +
        '<td>' + U.esc(m.setor || '—') + '</td>' +
        '<td>' + UI.tagTTR(m.ttr) + '</td>' +
        '<td class="muted">' + U.esc(m.usuario || '—') + '</td>' +
        '<td class="col-actions">' +
          '<button class="icon-btn" data-detalhe="' + U.esc(m.id) + '" title="Ver detalhes" aria-label="Ver detalhes">' +
            UI.icone('olho', 15) + '</button></td>' +
      '</tr>';
    });

    alvo.innerHTML = html + '</tbody></table>';

    var inicio = (pagina - 1) * POR_PAGINA + 1;
    var fim = Math.min(pagina * POR_PAGINA, lista.length);
    container.querySelector('#r-rodape').innerHTML =
      '<span>Exibindo <strong>' + inicio + '–' + fim + '</strong> de <strong>' +
        U.numero(lista.length) + '</strong> movimentação(ões)</span>' +
      '<span class="spacer"></span>' + UI.paginador(pagina, totalPaginas);
  }

  /* ---------- Detalhe --------------------------------------------------------- */

  function abrirDetalhe(id) {
    var m = CELAB.store.listarMovimentacoes().find(function (x) { return x.id === id; });
    if (!m) return;

    function linha(k, v) {
      return '<div class="result-preview__row"><span class="result-preview__k">' + U.esc(k) +
        '</span><span class="result-preview__v">' + (v || '<span class="muted">—</span>') + '</span></div>';
    }

    UI.modal({
      titulo: CELAB.tipoMovMeta(m.tipo).rotulo + ' — ' + (m.equipamento || 'Equipamento'),
      subtitulo: 'Registrado em ' + U.dataHoraBR(m.registradoEm) + ' por ' + (m.usuario || '—'),
      corpo:
        '<div class="result-preview">' +
          linha('Data da movimentação', U.dataBR(m.data)) +
          linha('Chamado', U.esc(m.chamado)) +
          linha('Equipamento', U.esc(m.equipamento)) +
          linha('Modelo', U.esc(m.modelo)) +
          linha('Tombo novo', U.esc(m.tomboNovo)) +
          linha('Tombo antigo', U.esc(m.tomboAntigo)) +
          (m.statusAnterior ? linha('Situação anterior', UI.chipStatus(m.statusAnterior)) : '') +
          linha('Situação resultante', m.statusResultante && m.statusResultante !== '—'
            ? UI.chipStatus(m.statusResultante) : '') +
          linha('Prédio', U.esc(m.predio)) +
          linha('Setor / Unidade', U.esc(m.setor)) +
          linha('TTR', UI.tagTTR(m.ttr)) +
          linha('Serviço solicitado', U.esc(m.servicoSolicitado)) +
          linha('Observação', U.esc(m.observacao)) +
        '</div>',
      botoes: [{ texto: 'Fechar', classe: 'btn--ghost' }]
    });
  }

  /* ---------- Exportação ------------------------------------------------------ */

  function exportar(formato) {
    var lista = filtrar();
    if (!lista.length) {
      return UI.toast('warn', 'Nada a exportar', 'Nenhuma movimentação corresponde aos filtros.');
    }
    var nome = 'CELAB_Relatorio_' + U.carimbo();

    if (formato === 'excel') {
      CELAB.exportar.paraExcel([{
        nome: 'Movimentações',
        tituloRelatorio: 'CELAB — Relatório de Movimentações',
        registros: lista,
        colunas: CELAB.exportar.COLS_MOV,
        resumo: [['Filtros', rotuloFiltro()], ['Registros', lista.length]]
      }], nome + '.xlsx');
    } else {
      CELAB.exportar.paraPDF({
        titulo: 'Relatório de Movimentações',
        subtitulo: rotuloFiltro(),
        registros: lista,
        colunas: CELAB.exportar.COLS_MOV
      }, nome + '.pdf');
    }
  }

  /* ---------- Montagem -------------------------------------------------------- */

  var CAMPOS = [
    ['#r-de', 'de', 'change'], ['#r-ate', 'ate', 'change'],
    ['#r-tipo', 'tipo', 'change'], ['#r-predio', 'predio', 'change'],
    ['#r-status', 'status', 'change'], ['#r-equip', 'equipamento', 'change'],
    ['#r-modelo', 'modelo', 'change'], ['#r-tombo', 'tombo', 'input'],
    ['#r-chamado', 'chamado', 'input'], ['#r-busca', 'busca', 'input']
  ];

  function sincronizarCampos(container) {
    CAMPOS.forEach(function (c) { container.querySelector(c[0]).value = filtros[c[1]] || ''; });
  }

  function montar(container) {
    container.innerHTML = esqueleto();
    sincronizarCampos(container);

    var redesenhar = function () { desenhar(container); };
    var redesenharDebounce = U.debounce(redesenhar, 200);

    CAMPOS.forEach(function (c) {
      container.querySelector(c[0]).addEventListener(c[2], function () {
        filtros[c[1]] = this.value;
        pagina = 1;
        if (c[2] === 'input') redesenharDebounce();
        else redesenhar();
      });
    });

    container.addEventListener('click', function (e) {
      var alvo;

      if ((alvo = e.target.closest('[data-acao="periodo"]'))) {
        var dias = Number(alvo.getAttribute('data-dias'));
        var fim = new Date();
        var ini = new Date(fim.getTime() - (dias - 1) * 86400000);
        filtros.de = ini.toISOString().slice(0, 10);
        filtros.ate = fim.toISOString().slice(0, 10);
        pagina = 1;
        sincronizarCampos(container);
        return redesenhar();
      }

      if ((alvo = e.target.closest('[data-acao="limpar"]'))) {
        Object.keys(filtros).forEach(function (k) { filtros[k] = ''; });
        pagina = 1;
        sincronizarCampos(container);
        return redesenhar();
      }

      if ((alvo = e.target.closest('[data-acao="excel"]'))) return exportar('excel');
      if ((alvo = e.target.closest('[data-acao="pdf"]')))   return exportar('pdf');

      if ((alvo = e.target.closest('[data-detalhe]'))) {
        return abrirDetalhe(alvo.getAttribute('data-detalhe'));
      }

      if ((alvo = e.target.closest('[data-ordenar]'))) {
        var campo = alvo.getAttribute('data-ordenar');
        if (ordem.campo === campo) ordem.direcao = ordem.direcao === 'asc' ? 'desc' : 'asc';
        else { ordem.campo = campo; ordem.direcao = 'asc'; }
        return redesenhar();
      }

      if ((alvo = e.target.closest('[data-pagina]'))) {
        var p = Number(alvo.getAttribute('data-pagina'));
        if (p >= 1) { pagina = p; redesenhar(); }
      }
    });

    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var th = e.target.closest('[data-ordenar]');
      if (!th) return;
      e.preventDefault();
      th.click();
    });

    desenhar(container);

    var cancelar = CELAB.store.assinar(function () { desenhar(container); });
    return { destruir: cancelar };
  }

  CELAB.pages = CELAB.pages || {};
  CELAB.pages.relatorios = {
    titulo: 'Relatórios e Filtros',
    subtitulo: 'Histórico completo de movimentações',
    montar: montar
  };

})(window.CELAB);
