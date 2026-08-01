/* ==========================================================================
   CELAB — Camada de gráficos (Chart.js)
   --------------------------------------------------------------------------
   Decisões de forma e cor:
   · "Por tipo de equipamento" tem 14 classes possíveis -> BARRAS HORIZONTAIS
     em uma única cor (o comprimento já codifica a magnitude). Um donut de 14
     fatias seria ilegível e um degradê por valor duplicaria a codificação.
   · "Composição do estoque" tem 4 estados de saúde -> DONUT (parte-do-todo,
     <= 6 segmentos) com a paleta de STATUS, que é reservada para estado.
     "Disponibilizado" fica fora: não está no laboratório e não é estado de
     saúde — aparece como stat tile próprio.
   · "Entradas x Saídas" são duas identidades -> LINHAS nos slots categóricos
     1 e 2, com legenda sempre presente.
   Toda cor sai de variáveis CSS, então o modo escuro é um conjunto de passos
   selecionado — não uma inversão automática.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var instancias = {};   // id do canvas -> Chart
  var construtores = {}; // id do canvas -> função que redesenha

  function css(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  }

  function paleta() {
    return {
      surface:   css('--surface-1'),
      texto:     css('--text-primary'),
      secundario:css('--text-secondary'),
      muted:     css('--text-muted'),
      grid:      css('--gridline'),
      baseline:  css('--baseline'),
      series: [
        css('--series-1'), css('--series-2'), css('--series-3'), css('--series-4'),
        css('--series-5'), css('--series-6'), css('--series-7'), css('--series-8')
      ],
      status: {
        good:     css('--status-good'),
        warning:  css('--status-warning'),
        serious:  css('--status-serious'),
        critical: css('--status-critical'),
        neutral:  css('--status-neutral')
      }
    };
  }

  function disponivel() { return typeof window.Chart !== 'undefined'; }

  /**
   * Devolve o canvas do gráfico, recriando-o se um estado vazio o tiver
   * substituído. Sem isso, uma dashboard que nasce vazia nunca voltaria a
   * desenhar depois do primeiro registro.
   * O contêiner precisa declarar data-canvas="<id>" (e opcionalmente
   * data-rotulo) — ver o cartão de gráfico em pages/dashboard.js.
   */
  function obterCanvas(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (canvas) return canvas;

    var box = document.querySelector('[data-canvas="' + canvasId + '"]');
    if (!box) return null;

    box.innerHTML = '';
    canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', box.getAttribute('data-rotulo') || 'Gráfico');
    box.appendChild(canvas);
    return canvas;
  }

  /** Substitui o canvas por uma mensagem, preservando o contêiner. */
  function mensagemNoLugar(canvas, iconeNome, texto, complemento) {
    var box = canvas.parentElement;
    if (!box) return;
    destruir(canvas.id);
    box.innerHTML = '<div class="chart-empty">' + CELAB.ui.icone(iconeNome, 34) +
      '<div>' + CELAB.util.esc(texto) + '</div>' +
      (complemento ? '<div style="font-size:11.5px">' + CELAB.util.esc(complemento) + '</div>' : '') +
      '</div>';
  }

  function semBiblioteca(canvas, mensagem) {
    mensagemNoLugar(canvas, 'grafico',
      mensagem || 'Biblioteca de gráficos indisponível.',
      'Os mesmos números estão na visão "Tabela" deste cartão.');
  }

  function vazio(canvas, mensagem) {
    mensagemNoLugar(canvas, 'vazio', mensagem || 'Sem dados no período.');
  }

  function destruir(id) {
    if (instancias[id]) { instancias[id].destroy(); delete instancias[id]; }
  }

  /** Tooltip com a mesma tinta do resto da interface. */
  function tooltipBase(p) {
    return {
      backgroundColor: p.surface,
      titleColor: p.texto,
      bodyColor: p.secundario,
      borderColor: p.grid,
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
      titleFont: { size: 12.5, weight: '600', family: 'system-ui, sans-serif' },
      bodyFont: { size: 12.5, family: 'system-ui, sans-serif' },
      displayColors: true,
      boxWidth: 9,
      boxHeight: 9,
      boxPadding: 5,
      usePointStyle: true
    };
  }

  var FONTE = { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', size: 11.5 };

  /* ---------- 1. Barras horizontais: estoque por tipo ---------------------- */

  function barrasPorTipo(canvasId, dados) {
    var canvas = obterCanvas(canvasId);
    if (!canvas) return;
    destruir(canvasId);
    construtores[canvasId] = function () { barrasPorTipo(canvasId, dados); };

    var itens = Object.keys(dados)
      .map(function (k) { return { rotulo: k, valor: dados[k] }; })
      .filter(function (i) { return i.valor > 0; })
      .sort(function (a, b) { return b.valor - a.valor; });

    if (!itens.length) return vazio(canvas, 'Nenhum equipamento no laboratório.');
    if (!disponivel()) return semBiblioteca(canvas);

    var p = paleta();

    instancias[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: itens.map(function (i) { return i.rotulo; }),
        datasets: [{
          label: 'Equipamentos',
          data: itens.map(function (i) { return i.valor; }),
          backgroundColor: p.series[0],       // série única: uma cor para todas as barras
          borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 4, bottomRight: 4 },
          borderSkipped: 'start',             // ponta arredondada, base quadrada
          barThickness: 'flex',
          maxBarThickness: 18,
          categoryPercentage: 0.82,
          barPercentage: 0.9
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 26, left: 2, top: 4, bottom: 2 } },
        plugins: {
          legend: { display: false },        // série única não pede legenda
          tooltip: Object.assign(tooltipBase(p), {
            callbacks: {
              label: function (ctx) {
                var total = itens.reduce(function (s, i) { return s + i.valor; }, 0);
                var pct = total ? Math.round(ctx.parsed.x / total * 100) : 0;
                return ' ' + CELAB.util.numero(ctx.parsed.x) + ' un. · ' + pct + '% do estoque';
              }
            }
          }),
          datalabels: false
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: p.grid, drawTicks: false, lineWidth: 1 },
            border: { color: p.baseline },
            ticks: { color: p.muted, font: FONTE, precision: 0, padding: 6 }
          },
          y: {
            grid: { display: false },
            border: { color: p.baseline },
            ticks: { color: p.secundario, font: FONTE, padding: 6, autoSkip: false }
          }
        },
        animation: { duration: 380 }
      },
      plugins: [rotuloNaPonta(p)]
    });
  }

  /** Valor na ponta da barra — rótulo direto, sem número em cima de tudo. */
  function rotuloNaPonta(p) {
    return {
      id: 'rotuloNaPonta',
      afterDatasetsDraw: function (chart) {
        var ctx = chart.ctx;
        var meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = '600 11.5px ' + FONTE.family;
        ctx.fillStyle = p.secundario;          // texto usa tinta, nunca a cor da série
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        meta.data.forEach(function (barra, i) {
          var v = chart.data.datasets[0].data[i];
          if (!v) return;
          ctx.fillText(CELAB.util.numero(v), barra.x + 7, barra.y);
        });
        ctx.restore();
      }
    };
  }

  /* ---------- 2. Donut: composição do estoque por status ------------------- */

  function donutStatus(canvasId, porStatus) {
    var canvas = obterCanvas(canvasId);
    if (!canvas) return;
    destruir(canvasId);
    construtores[canvasId] = function () { donutStatus(canvasId, porStatus); };

    var p = paleta();
    var ordem = [
      { rotulo: 'Estoque',    cor: p.status.good },
      { rotulo: 'Manutenção', cor: p.status.warning },
      { rotulo: 'Leilão',     cor: p.status.serious },
      { rotulo: 'Defeito',    cor: p.status.critical }
    ];
    var itens = ordem
      .map(function (o) { return { rotulo: o.rotulo, cor: o.cor, valor: porStatus[o.rotulo] || 0 }; })
      .filter(function (i) { return i.valor > 0; });

    if (!itens.length) return vazio(canvas, 'Nenhum equipamento no laboratório.');
    if (!disponivel()) return semBiblioteca(canvas);

    var total = itens.reduce(function (s, i) { return s + i.valor; }, 0);

    instancias[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: itens.map(function (i) { return i.rotulo; }),
        datasets: [{
          data: itens.map(function (i) { return i.valor; }),
          backgroundColor: itens.map(function (i) { return i.cor; }),
          borderColor: p.surface,   // o "borda" aqui é o vão de 2px na cor da superfície
          borderWidth: 2,
          hoverOffset: 6,
          spacing: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        layout: { padding: 8 },
        plugins: {
          legend: { display: false }, // legenda desenhada em HTML, com os valores
          tooltip: Object.assign(tooltipBase(p), {
            callbacks: {
              label: function (ctx) {
                var pct = total ? Math.round(ctx.parsed / total * 100) : 0;
                return ' ' + CELAB.util.numero(ctx.parsed) + ' un. · ' + pct + '%';
              }
            }
          })
        },
        animation: { duration: 380 }
      },
      plugins: [{
        id: 'centro',
        afterDraw: function (chart) {
          var ctx = chart.ctx;
          var area = chart.chartArea;
          if (!area) return;
          var cx = (area.left + area.right) / 2;
          var cy = (area.top + area.bottom) / 2;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = p.texto;
          ctx.font = '620 26px ' + FONTE.family;   // figuras proporcionais
          ctx.fillText(CELAB.util.numero(total), cx, cy + 2);
          ctx.fillStyle = p.muted;
          ctx.font = '11.5px ' + FONTE.family;
          ctx.fillText('no laboratório', cx, cy + 20);
          ctx.restore();
        }
      }]
    });
  }

  /* ---------- 3. Linhas: entradas x saídas --------------------------------- */

  function linhasMovimentacao(canvasId, serie) {
    var canvas = obterCanvas(canvasId);
    if (!canvas) return;
    destruir(canvasId);
    construtores[canvasId] = function () { linhasMovimentacao(canvasId, serie); };

    var houve = serie.entradas.some(Boolean) || serie.saidas.some(Boolean);
    if (!houve) return vazio(canvas, 'Sem movimentações no período.');
    if (!disponivel()) return semBiblioteca(canvas);

    var p = paleta();
    var rotulos = serie.labels.map(function (iso) { return CELAB.util.dataBR(iso).slice(0, 5); });

    instancias[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: rotulos,
        datasets: [
          {
            label: 'Entradas',
            data: serie.entradas,
            borderColor: p.series[0],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.28,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: p.surface,   // anel de 2px na cor da superfície
            pointHoverBackgroundColor: p.series[0]
          },
          {
            label: 'Saídas',
            data: serie.saidas,
            borderColor: p.series[1],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.28,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 2,
            pointHoverBorderColor: p.surface,
            pointHoverBackgroundColor: p.series[1]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },  // alvo generoso, sem mira
        layout: { padding: { top: 6, right: 8 } },
        plugins: {
          legend: { display: false }, // legenda em HTML, sempre presente
          tooltip: Object.assign(tooltipBase(p), {
            callbacks: {
              title: function (itens) {
                var i = itens[0].dataIndex;
                return CELAB.util.dataBR(serie.labels[i]);
              },
              label: function (ctx) { return ' ' + ctx.dataset.label + ': ' + ctx.parsed.y; }
            }
          })
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: p.baseline },
            ticks: {
              color: p.muted, font: FONTE, maxRotation: 0, autoSkip: true,
              maxTicksLimit: 10, padding: 6
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: p.grid, drawTicks: false, lineWidth: 1 },
            border: { display: false },
            ticks: { color: p.muted, font: FONTE, precision: 0, padding: 8 }
          }
        },
        animation: { duration: 380 }
      }
    });
  }

  /* ---------- 4. Barras: top prédios de origem ----------------------------- */

  function barrasPorPredio(canvasId, porPredio, limite) {
    var canvas = obterCanvas(canvasId);
    if (!canvas) return;
    destruir(canvasId);
    construtores[canvasId] = function () { barrasPorPredio(canvasId, porPredio, limite); };

    limite = limite || 8;
    var todos = Object.keys(porPredio)
      .map(function (k) { return { rotulo: k, valor: porPredio[k] }; })
      .filter(function (i) { return i.valor > 0; })
      .sort(function (a, b) { return b.valor - a.valor; });

    if (!todos.length) return vazio(canvas, 'Nenhuma origem registrada.');

    // Cauda vira "Outros" — nunca se resolve excesso de classes gerando cores.
    var itens = todos.slice(0, limite);
    var cauda = todos.slice(limite);
    if (cauda.length) {
      itens.push({
        rotulo: 'Outros (' + cauda.length + ')',
        valor: cauda.reduce(function (s, i) { return s + i.valor; }, 0)
      });
    }

    if (!disponivel()) return semBiblioteca(canvas);
    var p = paleta();

    instancias[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: itens.map(function (i) {
          return i.rotulo.length > 30 ? i.rotulo.slice(0, 29) + '…' : i.rotulo;
        }),
        datasets: [{
          label: 'Equipamentos',
          data: itens.map(function (i) { return i.valor; }),
          backgroundColor: p.series[0],
          borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 4, bottomRight: 4 },
          borderSkipped: 'start',
          maxBarThickness: 18,
          categoryPercentage: 0.82
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 26 } },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign(tooltipBase(p), {
            callbacks: {
              title: function (ctx) { return itens[ctx[0].dataIndex].rotulo; },
              label: function (ctx) { return ' ' + CELAB.util.numero(ctx.parsed.x) + ' un.'; }
            }
          })
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: p.grid, drawTicks: false },
            border: { color: p.baseline },
            ticks: { color: p.muted, font: FONTE, precision: 0, padding: 6 }
          },
          y: {
            grid: { display: false },
            border: { color: p.baseline },
            ticks: { color: p.secundario, font: FONTE, padding: 6, autoSkip: false }
          }
        },
        animation: { duration: 380 }
      },
      plugins: [rotuloNaPonta(p)]
    });
  }

  /* ---------- Legenda HTML e tabela-gêmea ----------------------------------- */

  /** Legenda com swatch + rótulo + valor (identidade nunca depende só da cor). */
  function legendaHTML(itens) {
    return itens.map(function (i) {
      return '<span class="chart-legend__item">' +
        '<span class="chart-legend__swatch" style="background:' + i.cor + '"></span>' +
        CELAB.util.esc(i.rotulo) +
        (i.valor != null ? ' <span class="chart-legend__val">' + CELAB.util.numero(i.valor) + '</span>' : '') +
        '</span>';
    }).join('');
  }

  /** Tabela equivalente ao gráfico — todo valor é alcançável sem hover. */
  function tabelaHTML(colunas, linhas) {
    var html = '<table class="chart-table"><thead><tr>';
    colunas.forEach(function (c) { html += '<th>' + CELAB.util.esc(c) + '</th>'; });
    html += '</tr></thead><tbody>';
    linhas.forEach(function (l) {
      html += '<tr>';
      l.forEach(function (celula, i) {
        if (i === 0 && typeof celula === 'object') {
          html += '<td><span class="chart-table__key" style="background:' + celula.cor + '"></span>' +
            CELAB.util.esc(celula.texto) + '</td>';
        } else {
          html += '<td>' + CELAB.util.esc(celula) + '</td>';
        }
      });
      html += '</tr>';
    });
    return html + '</tbody></table>';
  }

  /** Redesenha todos os gráficos vivos — usado na troca de tema. */
  function repintarTodos() {
    Object.keys(construtores).forEach(function (id) {
      if (document.getElementById(id)) {
        try { construtores[id](); } catch (e) { /* canvas já removido */ }
      } else {
        destruir(id);
        delete construtores[id];
      }
    });
  }

  /** Libera todos os canvases ao trocar de página. */
  function destruirTodos() {
    Object.keys(instancias).forEach(destruir);
    construtores = {};
  }

  CELAB.charts = {
    barrasPorTipo: barrasPorTipo,
    donutStatus: donutStatus,
    linhasMovimentacao: linhasMovimentacao,
    barrasPorPredio: barrasPorPredio,
    legendaHTML: legendaHTML,
    tabelaHTML: tabelaHTML,
    repintarTodos: repintarTodos,
    destruirTodos: destruirTodos,
    paleta: paleta,
    disponivel: disponivel
  };

})(window.CELAB);
