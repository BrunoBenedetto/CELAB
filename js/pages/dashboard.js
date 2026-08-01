/* ==========================================================================
   CELAB — Dashboard
   --------------------------------------------------------------------------
   Reassina o store no `montar` e redesenha a cada evento: qualquer entrada,
   saída ou edição — inclusive vinda de outra aba — repinta os indicadores.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;
  var U = CELAB.util;

  var titulo = 'Dashboard';
  var subtitulo = 'Visão geral do estoque em tempo real';

  function esqueleto() {
    return '' +
      '<div class="page-head">' +
        '<div>' +
          '<h1 class="page-head__title">Visão geral</h1>' +
          '<p class="page-head__sub" id="dash-atualizado">Atualizado agora</p>' +
        '</div>' +
        '<div class="page-head__spacer"></div>' +
        '<div class="btn-group">' +
          '<button class="btn btn--outline" data-exportar="excel">' +
            UI.icone('excel', 16) + '<span>Exportar Geral · Excel</span>' +
          '</button>' +
          '<button class="btn btn--outline" data-exportar="pdf">' +
            UI.icone('pdf', 16) + '<span>Exportar Geral · PDF</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="quick-actions">' +
        atalho('entrada', '', 'entrada', 'Nova Entrada', 'Registrar chegada ao laboratório') +
        atalho('saida', 'quick-card__icon--out', 'saida', 'Nova Saída', 'Enviar equipamento a uma unidade') +
        atalho('relatorios', 'quick-card__icon--doc', 'relatorio', 'Relatórios', 'Histórico completo e filtros') +
      '</div>' +

      '<div class="kpi-row" id="dash-kpis"></div>' +

      '<div class="chart-grid">' +
        cartaoGrafico('Estoque por tipo de equipamento',
          'Itens fisicamente no laboratório, do maior para o menor',
          'grafico-tipo', 'tall', 'tipo') +
        cartaoGrafico('Composição do estoque',
          'Distribuição dos itens no laboratório por situação',
          'grafico-status', 'tall', 'status') +
      '</div>' +

      '<div class="chart-grid">' +
        cartaoGrafico('Entradas e saídas — últimos 30 dias',
          'Volume diário de movimentações registradas',
          'grafico-mov', '', 'mov') +
        cartaoGrafico('Prédios de origem',
          'De onde vieram os equipamentos hoje no laboratório',
          'grafico-predio', '', 'predio') +
      '</div>';
  }

  function atalho(rota, classeIcone, nomeIcone, titulo, sub) {
    return '<button class="quick-card" data-ir="' + rota + '">' +
      '<span class="quick-card__icon ' + classeIcone + '">' + UI.icone(nomeIcone, 19) + '</span>' +
      '<span class="quick-card__text">' +
        '<span class="quick-card__title">' + U.esc(titulo) + '</span>' +
        '<span class="quick-card__sub">' + U.esc(sub) + '</span>' +
      '</span></button>';
  }

  /** Cartão de gráfico com alternador Gráfico/Tabela (a11y: valor sem hover). */
  function cartaoGrafico(tit, sub, id, altura, chave) {
    return '' +
      '<figure class="card" style="margin:0">' +
        '<div class="card__head">' +
          '<div style="min-width:0">' +
            '<figcaption class="card__title">' + U.esc(tit) + '</figcaption>' +
            '<div class="card__sub">' + U.esc(sub) + '</div>' +
          '</div>' +
          '<div class="card__spacer"></div>' +
          '<div class="seg" role="group" aria-label="Modo de exibição">' +
            '<button type="button" class="is-active" data-vista="grafico" data-alvo="' + chave + '">Gráfico</button>' +
            '<button type="button" data-vista="tabela" data-alvo="' + chave + '">Tabela</button>' +
          '</div>' +
        '</div>' +
        '<div class="chart-legend" id="legenda-' + chave + '"></div>' +
        '<div class="card__body">' +
          // data-canvas/data-rotulo permitem recriar o canvas depois de um
          // estado vazio — ver charts.obterCanvas().
          '<div class="chart-box' + (altura === 'tall' ? ' chart-box--tall' : '') + '" ' +
            'data-vista-alvo="grafico" data-chave="' + chave + '" ' +
            'data-canvas="' + id + '" data-rotulo="' + U.esc(tit) + '">' +
            '<canvas id="' + id + '" role="img" aria-label="' + U.esc(tit) + '"></canvas>' +
          '</div>' +
          '<div class="table-wrap hidden" data-vista-alvo="tabela" data-chave="' + chave + '"></div>' +
        '</div>' +
      '</figure>';
  }

  /* ---------- KPIs ---------------------------------------------------------- */

  function kpisHTML(r) {
    function tile(classe, rotulo, valor, rodape, hero) {
      return '<div class="stat ' + classe + (hero ? ' stat--hero' : '') + '">' +
        '<div class="stat__label"><span class="dot"></span>' + U.esc(rotulo) + '</div>' +
        '<div class="stat__value">' + U.numero(valor) + '</div>' +
        '<div class="stat__foot">' + U.esc(rodape) + '</div>' +
        '</div>';
    }

    var s = r.porStatus;
    // Um hero por tela (o total no laboratório), seguido dos quatro estados
    // de saúde. "Disponibilizado" não é estado de saúde nem está no
    // laboratório — vai no rodapé do hero, não como um quinto tile.
    return '' +
      tile('stat--brand', 'Equipamentos no laboratório', r.totalNoLab,
        U.numero(r.totalCadastrado) + ' cadastrados · ' +
        U.numero(s['Disponibilizado'] || 0) + ' já disponibilizados', true) +
      tile('stat--good', 'Disponíveis em estoque', s['Estoque'] || 0, 'Prontos para disponibilização') +
      tile('stat--warning', 'Em manutenção', s['Manutenção'] || 0, 'Em reparo no laboratório') +
      tile('stat--critical', 'Com defeito', s['Defeito'] || 0, 'Aguardando destinação') +
      tile('stat--serious', 'Para leilão', s['Leilão'] || 0, 'Baixados do patrimônio ativo');
  }

  /* ---------- Render -------------------------------------------------------- */

  function desenhar(container) {
    var r = CELAB.store.resumo();
    var serie = CELAB.store.serieMovimentacoes(30);
    var p = CELAB.charts.paleta();

    container.querySelector('#dash-kpis').innerHTML = kpisHTML(r);
    container.querySelector('#dash-atualizado').textContent =
      'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    /* --- por tipo (barras, série única) --- */
    CELAB.charts.barrasPorTipo('grafico-tipo', r.porTipo);
    container.querySelector('#legenda-tipo').innerHTML = ''; // série única não leva legenda
    preencherTabela(container, 'tipo',
      ['Equipamento', 'Quantidade'],
      Object.keys(r.porTipo).sort(function (a, b) { return r.porTipo[b] - r.porTipo[a]; })
        .map(function (k) { return [{ texto: k, cor: p.series[0] }, U.numero(r.porTipo[k])]; })
    );

    /* --- por status (donut, paleta de status) --- */
    CELAB.charts.donutStatus('grafico-status', r.porStatus);
    var statusItens = [
      { rotulo: 'Estoque',    cor: p.status.good,     valor: r.porStatus['Estoque'] || 0 },
      { rotulo: 'Manutenção', cor: p.status.warning,  valor: r.porStatus['Manutenção'] || 0 },
      { rotulo: 'Leilão',     cor: p.status.serious,  valor: r.porStatus['Leilão'] || 0 },
      { rotulo: 'Defeito',    cor: p.status.critical, valor: r.porStatus['Defeito'] || 0 }
    ];
    container.querySelector('#legenda-status').innerHTML = CELAB.charts.legendaHTML(statusItens);
    preencherTabela(container, 'status',
      ['Situação', 'Quantidade'],
      statusItens.map(function (i) { return [{ texto: i.rotulo, cor: i.cor }, U.numero(i.valor)]; })
        .concat([[{ texto: 'Disponibilizado (fora do laboratório)', cor: p.status.neutral },
                  U.numero(r.porStatus['Disponibilizado'] || 0)]])
    );

    /* --- movimentações (2 séries, legenda obrigatória) --- */
    CELAB.charts.linhasMovimentacao('grafico-mov', serie);
    var totalEnt = serie.entradas.reduce(function (a, b) { return a + b; }, 0);
    var totalSai = serie.saidas.reduce(function (a, b) { return a + b; }, 0);
    container.querySelector('#legenda-mov').innerHTML = CELAB.charts.legendaHTML([
      { rotulo: 'Entradas', cor: p.series[0], valor: totalEnt },
      { rotulo: 'Saídas',   cor: p.series[1], valor: totalSai }
    ]);
    preencherTabela(container, 'mov',
      ['Data', 'Entradas', 'Saídas'],
      serie.labels.map(function (iso, i) {
        return [U.dataBR(iso), U.numero(serie.entradas[i]), U.numero(serie.saidas[i])];
      }).filter(function (l) { return l[1] !== '0' || l[2] !== '0'; }).reverse()
    );

    /* --- prédios --- */
    CELAB.charts.barrasPorPredio('grafico-predio', r.porPredio, 8);
    container.querySelector('#legenda-predio').innerHTML = '';
    preencherTabela(container, 'predio',
      ['Prédio de origem', 'Quantidade'],
      Object.keys(r.porPredio).sort(function (a, b) { return r.porPredio[b] - r.porPredio[a]; })
        .map(function (k) { return [{ texto: k, cor: p.series[0] }, U.numero(r.porPredio[k])]; })
    );
  }

  function preencherTabela(container, chave, colunas, linhas) {
    var alvo = container.querySelector('[data-vista-alvo="tabela"][data-chave="' + chave + '"]');
    if (!alvo) return;
    alvo.innerHTML = linhas.length
      ? CELAB.charts.tabelaHTML(colunas, linhas)
      : '<div style="padding:28px;text-align:center;color:var(--text-muted);font-size:13px">Sem dados.</div>';
  }

  /* ---------- Montagem ------------------------------------------------------ */

  function montar(container, navegar) {
    container.innerHTML = esqueleto();

    container.addEventListener('click', function (e) {
      var ir = e.target.closest('[data-ir]');
      if (ir) return navegar(ir.getAttribute('data-ir'));

      var exp = e.target.closest('[data-exportar]');
      if (exp) {
        if (exp.getAttribute('data-exportar') === 'excel') CELAB.exportar.exportarGeralExcel();
        else CELAB.exportar.exportarGeralPDF();
        return;
      }

      var vista = e.target.closest('[data-vista]');
      if (vista) {
        var chave = vista.getAttribute('data-alvo');
        var modo = vista.getAttribute('data-vista');
        var grupo = vista.parentElement;
        grupo.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
        vista.classList.add('is-active');
        container.querySelectorAll('[data-vista-alvo][data-chave="' + chave + '"]').forEach(function (painel) {
          painel.classList.toggle('hidden', painel.getAttribute('data-vista-alvo') !== modo);
        });
      }
    });

    desenhar(container);

    // Tempo real: qualquer mutação do store repinta a dashboard inteira.
    var cancelar = CELAB.store.assinar(function () { desenhar(container); });

    return { destruir: function () { cancelar(); CELAB.charts.destruirTodos(); } };
  }

  CELAB.pages = CELAB.pages || {};
  CELAB.pages.dashboard = { titulo: titulo, subtitulo: subtitulo, montar: montar };

})(window.CELAB);
