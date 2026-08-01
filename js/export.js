/* ==========================================================================
   CELAB — Exportação para Excel (XLSX) e PDF
   --------------------------------------------------------------------------
   SheetJS e jsPDF são carregados por CDN. Se algum não estiver disponível
   (offline), a exportação cai para CSV / janela de impressão em vez de
   simplesmente falhar.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var U = CELAB.util;

  /* ---------- Definição de colunas ----------------------------------------- */

  var COLS_ESTOQUE = [
    { chave: 'equipamento',       titulo: 'Equipamento',      largura: 20 },
    { chave: 'modelo',            titulo: 'Modelo',           largura: 28 },
    { chave: 'tomboNovo',         titulo: 'Tombo Novo',       largura: 14 },
    { chave: 'tomboAntigo',       titulo: 'Tombo Antigo',     largura: 14 },
    { chave: 'status',            titulo: 'Status',           largura: 16 },
    { chave: 'chamado',           titulo: 'Chamado',          largura: 13 },
    { chave: 'dataEntrada',       titulo: 'Data de Entrada',  largura: 15, tipo: 'data' },
    { chave: 'predioOrigem',      titulo: 'Prédio de Origem', largura: 30 },
    { chave: 'setorOrigem',       titulo: 'Setor/Unidade',    largura: 22 },
    { chave: 'dataSaida',         titulo: 'Data de Saída',    largura: 15, tipo: 'data' },
    { chave: 'predioDestino',     titulo: 'Prédio de Destino',largura: 30 },
    { chave: 'setorDestino',      titulo: 'Setor de Destino', largura: 22 },
    { chave: 'ttr',               titulo: 'TTR',              largura: 12 },
    { chave: 'servicoSolicitado', titulo: 'Serviço Solicitado', largura: 46 }
  ];

  var COLS_MOV = [
    { chave: 'data',              titulo: 'Data',             largura: 13, tipo: 'data' },
    { chave: 'tipo',              titulo: 'Movimentação',     largura: 15, tipo: 'tipoMov' },
    { chave: 'chamado',           titulo: 'Chamado',          largura: 13 },
    { chave: 'equipamento',       titulo: 'Equipamento',      largura: 20 },
    { chave: 'modelo',            titulo: 'Modelo',           largura: 28 },
    { chave: 'tomboNovo',         titulo: 'Tombo Novo',       largura: 14 },
    { chave: 'tomboAntigo',       titulo: 'Tombo Antigo',     largura: 14 },
    { chave: 'statusAnterior',    titulo: 'Status Anterior',  largura: 16 },
    { chave: 'statusResultante',  titulo: 'Status Atual',     largura: 16 },
    { chave: 'predio',            titulo: 'Prédio',           largura: 30 },
    { chave: 'setor',             titulo: 'Setor/Unidade',    largura: 22 },
    { chave: 'ttr',               titulo: 'TTR',              largura: 12 },
    { chave: 'usuario',           titulo: 'Usuário',          largura: 14 },
    { chave: 'servicoSolicitado', titulo: 'Serviço Solicitado', largura: 46 },
    { chave: 'observacao',        titulo: 'Observação',       largura: 40 }
  ];

  /** Converte um registro em uma linha de células já formatadas. */
  function linhaDe(registro, colunas) {
    return colunas.map(function (c) {
      var v = registro[c.chave];
      if (c.tipo === 'data') return v ? U.dataBR(v) : '';
      if (c.tipo === 'tipoMov') return CELAB.tipoMovMeta(v).rotulo;
      return v == null || v === '' ? '' : String(v);
    });
  }

  function matriz(registros, colunas) {
    return {
      cabecalho: colunas.map(function (c) { return c.titulo; }),
      linhas: registros.map(function (r) { return linhaDe(r, colunas); })
    };
  }

  /* ---------- Excel --------------------------------------------------------- */

  function temSheetJS() { return typeof window.XLSX !== 'undefined'; }

  /**
   * Gera um .xlsx com uma ou mais abas.
   * @param {Array<{nome:string, registros:Array, colunas:Array, resumo?:Array}>} abas
   */
  function paraExcel(abas, nomeArquivo) {
    if (!temSheetJS()) {
      CELAB.ui.toast('warn', 'Excel indisponível', 'Biblioteca não carregada (sem internet?). Exportando em CSV.');
      var primeira = abas[0];
      return paraCSV(primeira.registros, primeira.colunas, nomeArquivo.replace(/\.xlsx$/, '.csv'));
    }

    var XLSX = window.XLSX;
    var wb = XLSX.utils.book_new();

    abas.forEach(function (aba) {
      var m = matriz(aba.registros, aba.colunas);
      var dados = [];

      if (aba.tituloRelatorio) {
        dados.push([aba.tituloRelatorio]);
        dados.push(['Gerado em ' + U.dataHoraBR(new Date().toISOString()) +
                    ' · ' + m.linhas.length + ' registro(s)']);
        dados.push([]);
      }
      if (aba.resumo && aba.resumo.length) {
        aba.resumo.forEach(function (par) { dados.push([par[0], par[1]]); });
        dados.push([]);
      }

      dados.push(m.cabecalho);
      m.linhas.forEach(function (l) { dados.push(l); });

      var ws = XLSX.utils.aoa_to_sheet(dados);
      ws['!cols'] = aba.colunas.map(function (c) { return { wch: c.largura || 16 }; });

      // Congela o cabeçalho da tabela.
      var linhaCabecalho = dados.length - m.linhas.length - 1;
      ws['!freeze'] = { xSplit: 0, ySplit: linhaCabecalho + 1 };
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: linhaCabecalho, c: 0 },
          e: { r: dados.length - 1, c: aba.colunas.length - 1 }
        })
      };

      XLSX.utils.book_append_sheet(wb, ws, aba.nome.slice(0, 31));
    });

    XLSX.writeFile(wb, nomeArquivo);
    CELAB.ui.toast('success', 'Excel gerado', nomeArquivo);
  }

  /* ---------- CSV (fallback) ------------------------------------------------ */

  function paraCSV(registros, colunas, nomeArquivo) {
    var m = matriz(registros, colunas);
    function cel(v) {
      var s = String(v == null ? '' : v);
      return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var linhas = [m.cabecalho.map(cel).join(';')];
    m.linhas.forEach(function (l) { linhas.push(l.map(cel).join(';')); });
    // BOM para o Excel abrir acentuação corretamente.
    U.baixarArquivo('﻿' + linhas.join('\r\n'), nomeArquivo, 'text/csv;charset=utf-8');
    CELAB.ui.toast('success', 'CSV gerado', nomeArquivo);
  }

  /* ---------- PDF ------------------------------------------------------------ */

  function temJsPDF() {
    return !!(window.jspdf && window.jspdf.jsPDF);
  }

  /**
   * Gera um PDF paisagem com cabeçalho institucional e tabela paginada.
   * @param {{titulo, subtitulo, registros, colunas, resumo?}} cfg
   */
  function paraPDF(cfg, nomeArquivo) {
    if (!temJsPDF()) {
      CELAB.ui.toast('warn', 'PDF indisponível', 'Biblioteca não carregada. Abrindo a janela de impressão — escolha "Salvar como PDF".');
      return imprimirFallback(cfg);
    }

    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    var larguraPag = doc.internal.pageSize.getWidth();
    var m = matriz(cfg.registros, cfg.colunas);

    // Cabeçalho
    doc.setFillColor(20, 24, 31);
    doc.rect(0, 0, larguraPag, 54, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('CELAB', 40, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(190, 196, 204);
    doc.text('Controle de Estoque de Laboratório', 40, 39);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(cfg.titulo || 'Relatório', larguraPag - 40, 26, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(190, 196, 204);
    doc.text(
      'Gerado em ' + U.dataHoraBR(new Date().toISOString()) + ' · ' + m.linhas.length + ' registro(s)',
      larguraPag - 40, 39, { align: 'right' }
    );

    var y = 74;

    if (cfg.subtitulo) {
      doc.setTextColor(82, 81, 78);
      doc.setFontSize(8.5);
      doc.text(cfg.subtitulo, 40, y, { maxWidth: larguraPag - 80 });
      y += 16;
    }

    if (cfg.resumo && cfg.resumo.length) {
      doc.setFontSize(8.5);
      var x = 40;
      cfg.resumo.forEach(function (par) {
        doc.setTextColor(137, 135, 129);
        doc.text(String(par[0]).toUpperCase(), x, y);
        doc.setTextColor(11, 11, 11);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(String(par[1]), x, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        x += 118;
      });
      y += 30;
    }

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        head: [m.cabecalho],
        body: m.linhas,
        startY: y,
        margin: { left: 28, right: 28, top: 66 },
        styles: {
          font: 'helvetica', fontSize: 6.8, cellPadding: 3.4,
          textColor: [11, 11, 11], lineColor: [225, 224, 217], lineWidth: 0.4,
          overflow: 'linebreak', valign: 'middle'
        },
        headStyles: {
          fillColor: [242, 242, 238], textColor: [82, 81, 78],
          fontStyle: 'bold', fontSize: 6.6, lineWidth: 0.4
        },
        alternateRowStyles: { fillColor: [252, 252, 251] },
        columnStyles: colunasPDF(cfg.colunas),
        didDrawPage: function (dados) {
          var pag = doc.internal.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setTextColor(137, 135, 129);
          doc.text('CELAB · ' + (cfg.titulo || 'Relatório'), 28, doc.internal.pageSize.getHeight() - 16);
          doc.text('Página ' + dados.pageNumber + ' de ' + pag,
            larguraPag - 28, doc.internal.pageSize.getHeight() - 16, { align: 'right' });
        }
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(11, 11, 11);
      doc.text('Plugin de tabelas do PDF não carregado. Use a exportação em Excel.', 40, y + 20);
    }

    doc.save(nomeArquivo);
    CELAB.ui.toast('success', 'PDF gerado', nomeArquivo);
  }

  /** Distribui a largura das colunas proporcionalmente ao peso declarado. */
  function colunasPDF(colunas) {
    var estilos = {};
    var total = colunas.reduce(function (s, c) { return s + (c.largura || 16); }, 0);
    colunas.forEach(function (c, i) {
      estilos[i] = { cellWidth: (c.largura || 16) / total * 786 };
    });
    return estilos;
  }

  /** Sem jsPDF: monta uma página limpa e chama a impressão do navegador. */
  function imprimirFallback(cfg) {
    var m = matriz(cfg.registros, cfg.colunas);
    var win = window.open('', '_blank');
    if (!win) {
      CELAB.ui.toast('error', 'Bloqueado', 'O navegador bloqueou a janela. Libere pop-ups para este site.');
      return;
    }
    var html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<title>' + U.esc(cfg.titulo || 'Relatório CELAB') + '</title><style>' +
      'body{font:11px system-ui,sans-serif;margin:24px;color:#0b0b0b}' +
      'h1{font-size:16px;margin:0}h2{font-size:11px;font-weight:400;color:#52514e;margin:2px 0 16px}' +
      'table{width:100%;border-collapse:collapse;font-size:8.5px}' +
      'th{background:#f2f2ee;text-align:left;padding:5px;border:1px solid #e1e0d9;font-size:8px}' +
      'td{padding:5px;border:1px solid #e1e0d9;vertical-align:top}' +
      '@page{size:A4 landscape;margin:12mm}</style></head><body>' +
      '<h1>CELAB — ' + U.esc(cfg.titulo || 'Relatório') + '</h1>' +
      '<h2>Gerado em ' + U.dataHoraBR(new Date().toISOString()) + ' · ' + m.linhas.length + ' registro(s)</h2>' +
      '<table><thead><tr>' +
      m.cabecalho.map(function (h) { return '<th>' + U.esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      m.linhas.map(function (l) {
        return '<tr>' + l.map(function (c) { return '<td>' + U.esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></body></html>';
    win.document.write(html);
    win.document.close();
    setTimeout(function () { win.print(); }, 400);
  }

  /* ---------- Atalhos de alto nível ----------------------------------------- */

  function resumoParaExport() {
    var r = CELAB.store.resumo();
    return [
      ['Total no laboratório', r.totalNoLab],
      ['Em estoque',           r.porStatus['Estoque'] || 0],
      ['Em manutenção',        r.porStatus['Manutenção'] || 0],
      ['Com defeito',          r.porStatus['Defeito'] || 0],
      ['Para leilão',          r.porStatus['Leilão'] || 0],
      ['Disponibilizados',     r.porStatus['Disponibilizado'] || 0]
    ];
  }

  /** "Exportar Geral": inventário completo + histórico, em um único arquivo. */
  function exportarGeralExcel() {
    var equipamentos = CELAB.util.ordenarPor(CELAB.store.listarEquipamentos(), 'equipamento');
    var movs = CELAB.store.listarMovimentacoes();
    var r = CELAB.store.resumo();

    var porTipo = Object.keys(r.porTipo).sort().map(function (k) {
      return { equipamento: k, quantidade: r.porTipo[k] };
    });

    paraExcel([
      {
        nome: 'Inventário',
        tituloRelatorio: 'CELAB — Inventário Geral',
        registros: equipamentos,
        colunas: COLS_ESTOQUE,
        resumo: resumoParaExport()
      },
      {
        nome: 'Movimentações',
        tituloRelatorio: 'CELAB — Histórico de Movimentações',
        registros: movs,
        colunas: COLS_MOV
      },
      {
        nome: 'Resumo por tipo',
        tituloRelatorio: 'CELAB — Estoque do laboratório por tipo de equipamento',
        registros: porTipo,
        colunas: [
          { chave: 'equipamento', titulo: 'Equipamento', largura: 28 },
          { chave: 'quantidade',  titulo: 'Quantidade',  largura: 14 }
        ]
      }
    ], 'CELAB_Inventario_Geral_' + U.carimbo() + '.xlsx');
  }

  function exportarGeralPDF() {
    var equipamentos = CELAB.util.ordenarPor(CELAB.store.listarEquipamentos(), 'equipamento');
    paraPDF({
      titulo: 'Inventário Geral',
      subtitulo: 'Todos os equipamentos cadastrados no laboratório, incluindo os já disponibilizados.',
      registros: equipamentos,
      colunas: COLS_ESTOQUE,
      resumo: resumoParaExport().slice(0, 5)
    }, 'CELAB_Inventario_Geral_' + U.carimbo() + '.pdf');
  }

  CELAB.exportar = {
    COLS_ESTOQUE: COLS_ESTOQUE,
    COLS_MOV: COLS_MOV,
    matriz: matriz,
    paraExcel: paraExcel,
    paraPDF: paraPDF,
    paraCSV: paraCSV,
    exportarGeralExcel: exportarGeralExcel,
    exportarGeralPDF: exportarGeralPDF,
    resumoParaExport: resumoParaExport
  };

})(window.CELAB);
