/* ==========================================================================
   CELAB — Aba: Estoque Laboratório
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;
  var U = CELAB.util;

  var POR_PAGINA = 25;

  // Estado da view (persiste enquanto a aba está montada)
  var filtros = { busca: '', status: '', equipamento: '', modelo: '', ttr: '', local: 'lab' };
  var ordem = { campo: 'atualizadoEm', direcao: 'desc' };
  var pagina = 1;

  /* ---------- Filtro -------------------------------------------------------- */

  function filtrar() {
    var lista = CELAB.store.listarEquipamentos();

    if (filtros.local === 'lab') {
      lista = lista.filter(function (e) { return CELAB.STATUS_NO_LAB.indexOf(e.status) > -1; });
    } else if (filtros.local === 'fora') {
      lista = lista.filter(function (e) { return e.status === 'Disponibilizado'; });
    }

    if (filtros.status) lista = lista.filter(function (e) { return e.status === filtros.status; });
    if (filtros.equipamento) lista = lista.filter(function (e) { return e.equipamento === filtros.equipamento; });
    if (filtros.modelo) lista = lista.filter(function (e) { return e.modelo === filtros.modelo; });
    if (filtros.ttr) lista = lista.filter(function (e) { return e.ttr === filtros.ttr; });

    if (filtros.busca) {
      var termo = U.slug(filtros.busca);
      lista = lista.filter(function (e) {
        return U.slug([
          e.tomboNovo, e.tomboAntigo, e.equipamento, e.modelo,
          e.chamado, e.predioOrigem, e.setorOrigem, e.predioDestino,
          e.setorDestino, e.servicoSolicitado
        ].join(' ')).indexOf(termo) > -1;
      });
    }

    return U.ordenarPor(lista, ordem.campo, ordem.direcao);
  }

  /* ---------- Esqueleto ----------------------------------------------------- */

  function esqueleto() {
    return '' +
      '<div class="page-head">' +
        '<div>' +
          '<h1 class="page-head__title">Estoque Laboratório</h1>' +
          '<p class="page-head__sub">Equipamentos sob guarda do laboratório, com situação atual</p>' +
        '</div>' +
        '<div class="page-head__spacer"></div>' +
        '<div class="btn-group">' +
          '<button class="btn btn--outline btn--sm" data-acao="excel">' +
            UI.icone('excel', 14) + '<span>Excel</span></button>' +
          '<button class="btn btn--outline btn--sm" data-acao="pdf">' +
            UI.icone('pdf', 14) + '<span>PDF</span></button>' +
          '<button class="btn btn--primary" data-acao="novo">' +
            UI.icone('plus', 16) + '<span>Adicionar Equipamento</span></button>' +
        '</div>' +
      '</div>' +

      '<div class="filter-bar">' +
        '<div class="field field--grow">' +
          '<label for="f-busca">Buscar</label>' +
          '<input class="input" type="search" id="f-busca" placeholder="Tombo, modelo, chamado, prédio, setor…">' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-local">Localização</label>' +
          '<select class="select" id="f-local">' +
            '<option value="lab">No laboratório</option>' +
            '<option value="fora">Disponibilizados</option>' +
            '<option value="todos">Todos</option>' +
          '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-status">Status</label>' +
          '<select class="select" id="f-status">' + UI.opcoes(CELAB.STATUS_TODOS, '', 'Todos os status') + '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-equip">Equipamento</label>' +
          '<select class="select" id="f-equip">' + UI.opcoes(CELAB.EQUIPAMENTOS, '', 'Todos') + '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-modelo">Modelo</label>' +
          '<select class="select" id="f-modelo">' + UI.opcoes(CELAB.MODELOS, '', 'Todos') + '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-ttr">TTR</label>' +
          '<select class="select" id="f-ttr">' + UI.opcoes(CELAB.TTR, '', 'Todos') + '</select>' +
        '</div>' +
        '<button class="btn btn--ghost btn--sm" data-acao="limpar-filtros" style="margin-bottom:1px">' +
          UI.icone('limpar', 14) + '<span>Limpar</span></button>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__body card__body--flush">' +
          '<div class="table-wrap" id="estoque-tabela"></div>' +
        '</div>' +
        '<div class="table-foot" id="estoque-rodape"></div>' +
      '</div>';
  }

  /* ---------- Tabela -------------------------------------------------------- */

  var COLUNAS = [
    { chave: 'equipamento',  titulo: 'Equipamento',  ordenavel: true },
    { chave: 'modelo',       titulo: 'Modelo',       ordenavel: true },
    { chave: 'tomboNovo',    titulo: 'Tombo Novo',   ordenavel: true },
    { chave: 'tomboAntigo',  titulo: 'Tombo Antigo', ordenavel: true },
    { chave: 'status',       titulo: 'Status',       ordenavel: true },
    { chave: 'predioOrigem', titulo: 'Origem',       ordenavel: true },
    { chave: 'chamado',      titulo: 'Chamado',      ordenavel: true },
    { chave: 'dataEntrada',  titulo: 'Entrada',      ordenavel: true },
    { chave: 'ttr',          titulo: 'TTR',          ordenavel: true }
  ];

  function desenharTabela(container) {
    var lista = filtrar();
    var totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (pagina > totalPaginas) pagina = totalPaginas;
    var fatia = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

    var alvo = container.querySelector('#estoque-tabela');

    if (!lista.length) {
      alvo.innerHTML = UI.estadoVazio(
        'Nenhum equipamento encontrado',
        temFiltroAtivo()
          ? 'Ajuste ou limpe os filtros para ver mais resultados.'
          : 'Comece adicionando um equipamento ou registrando uma entrada.',
        '<button class="btn btn--primary btn--sm" data-acao="novo" style="margin-top:6px">' +
          UI.icone('plus', 14) + '<span>Adicionar Equipamento</span></button>'
      );
      container.querySelector('#estoque-rodape').innerHTML =
        '<span>0 equipamentos</span><span class="spacer"></span>';
      return;
    }

    var html = '<table class="table"><thead><tr>';
    COLUNAS.forEach(function (c) {
      var ativo = ordem.campo === c.chave;
      html += '<th' + (c.ordenavel ? ' class="sortable' + (ativo ? ' is-sorted' : '') +
        '" data-ordenar="' + c.chave + '" role="button" tabindex="0"' +
        ' aria-sort="' + (ativo ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none') + '"' : '') + '>' +
        U.esc(c.titulo) +
        (c.ordenavel ? '<span class="sort-ind">' + (ativo ? (ordem.direcao === 'asc' ? '▲' : '▼') : '↕') + '</span>' : '') +
        '</th>';
    });
    html += '<th class="col-actions">Ações</th></tr></thead><tbody>';

    fatia.forEach(function (e) {
      html += '<tr data-id="' + U.esc(e.id) + '">' +
        '<td class="strong">' + U.esc(e.equipamento || '—') + '</td>' +
        '<td>' + U.esc(e.modelo || '—') + '</td>' +
        '<td class="num tombo">' + (e.tomboNovo ? U.esc(e.tomboNovo) : '<span class="muted">—</span>') + '</td>' +
        '<td class="num tombo">' + (e.tomboAntigo ? U.esc(e.tomboAntigo) : '<span class="muted">—</span>') + '</td>' +
        '<td>' + UI.chipStatus(e.status) + '</td>' +
        '<td>' + (e.status === 'Disponibilizado'
                    ? '<span class="muted">→ ' + U.esc(e.predioDestino || '—') + '</span>'
                    : U.esc(e.predioOrigem || '—')) + '</td>' +
        '<td class="num">' + (e.chamado ? U.esc(e.chamado) : '<span class="muted">—</span>') + '</td>' +
        '<td class="num">' + U.dataBR(e.dataEntrada) + '</td>' +
        '<td>' + UI.tagTTR(e.ttr) + '</td>' +
        '<td class="col-actions">' +
          '<button class="icon-btn" data-ver="' + U.esc(e.id) + '" title="Ver detalhes" aria-label="Ver detalhes">' +
            UI.icone('olho', 15) + '</button> ' +
          (CELAB.auth.permissao('podeEditar')
            ? '<button class="icon-btn" data-editar="' + U.esc(e.id) + '" title="Editar" aria-label="Editar">' +
              UI.icone('editar', 15) + '</button> ' : '') +
          (CELAB.auth.permissao('podeExcluir')
            ? '<button class="icon-btn" data-excluir="' + U.esc(e.id) + '" title="Excluir" aria-label="Excluir">' +
              UI.icone('lixeira', 15) + '</button>' : '') +
        '</td>' +
      '</tr>';
    });

    html += '</tbody></table>';
    alvo.innerHTML = html;

    var inicio = (pagina - 1) * POR_PAGINA + 1;
    var fim = Math.min(pagina * POR_PAGINA, lista.length);
    container.querySelector('#estoque-rodape').innerHTML =
      '<span>Exibindo <strong>' + inicio + '–' + fim + '</strong> de <strong>' +
        U.numero(lista.length) + '</strong> equipamento(s)</span>' +
      '<span class="spacer"></span>' +
      UI.paginador(pagina, totalPaginas);
  }

  function temFiltroAtivo() {
    return !!(filtros.busca || filtros.status || filtros.equipamento || filtros.modelo ||
              filtros.ttr || filtros.local !== 'lab');
  }

  /* ---------- Formulário (criar / editar) ------------------------------------ */

  /** Opções de status do formulário, preservando o estado atual do item. */
  function statusDisponiveis(statusAtual) {
    var lista = CELAB.STATUS_ESTOQUE.slice();
    if (statusAtual && lista.indexOf(statusAtual) === -1) lista.push(statusAtual);
    return lista;
  }

  function formHTML(eq) {
    var ed = eq || {};
    return '' +
      '<form id="form-eq" novalidate>' +
        '<div class="form-grid">' +

          '<div class="field">' +
            '<label for="eq-equipamento">Categoria / Equipamento <span class="req">*</span></label>' +
            '<select class="select" id="eq-equipamento" name="equipamento" data-obrigatorio>' +
              UI.opcoes(CELAB.EQUIPAMENTOS, ed.equipamento) + '</select>' +
            '<span class="field__error">Selecione o equipamento.</span>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-modelo">Modelo <span class="req">*</span></label>' +
            '<select class="select" id="eq-modelo" name="modelo" data-obrigatorio></select>' +
            '<span class="field__help">A lista é filtrada pela categoria escolhida.</span>' +
            '<span class="field__error">Selecione o modelo.</span>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-tombo-novo">Tombo Novo</label>' +
            '<input class="input" type="text" id="eq-tombo-novo" name="tomboNovo" inputmode="numeric" ' +
              'value="' + U.esc(ed.tomboNovo || '') + '" placeholder="Ex.: 045112">' +
            '<span class="field__error">Informe o tombo novo ou o antigo.</span>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-tombo-antigo">Tombo Antigo</label>' +
            '<input class="input" type="text" id="eq-tombo-antigo" name="tomboAntigo" inputmode="numeric" ' +
              'value="' + U.esc(ed.tomboAntigo || '') + '" placeholder="Ex.: 11233">' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-status">Status <span class="req">*</span></label>' +
            // A lista base é a do requisito (Defeito, Leilão, Estoque,
            // Disponibilizado). "Manutenção" só entra quando o item já está
            // nesse estado — vindo de uma entrada — para a edição não rebaixar
            // silenciosamente o status ao salvar.
            '<select class="select" id="eq-status" name="status" data-obrigatorio>' +
              UI.opcoes(statusDisponiveis(ed.status), ed.status || 'Estoque', false) + '</select>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-ttr">TTR</label>' +
            '<select class="select" id="eq-ttr" name="ttr">' +
              UI.opcoes(CELAB.TTR, ed.ttr || 'Pendente', false) + '</select>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-chamado">Chamado</label>' +
            '<input class="input" type="text" id="eq-chamado" name="chamado" ' +
              'value="' + U.esc(ed.chamado || '') + '" placeholder="Ex.: CH-10450">' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-data">Data de entrada</label>' +
            '<input class="input" type="date" id="eq-data" name="dataEntrada" ' +
              'value="' + U.esc(ed.dataEntrada || U.hoje()) + '">' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-predio">Prédio de origem</label>' +
            '<select class="select" id="eq-predio" name="predioOrigem">' +
              UI.opcoes(CELAB.PREDIOS, ed.predioOrigem) + '</select>' +
          '</div>' +

          '<div class="field">' +
            '<label for="eq-setor">Setor / Unidade</label>' +
            '<input class="input" type="text" id="eq-setor" name="setorOrigem" ' +
              'value="' + U.esc(ed.setorOrigem || '') + '" placeholder="Ex.: 1ª Vara Cível">' +
          '</div>' +

          '<div class="field field--full">' +
            '<label for="eq-servico">Serviço solicitado</label>' +
            '<textarea class="textarea" id="eq-servico" name="servicoSolicitado" ' +
              'placeholder="Descreva o serviço ou a observação técnica…">' +
              U.esc(ed.servicoSolicitado || '') + '</textarea>' +
          '</div>' +

        '</div>' +
      '</form>';
  }

  function abrirForm(container, eq) {
    var edicao = !!eq;
    var ref = UI.modal({
      titulo: edicao ? 'Editar equipamento' : 'Adicionar equipamento',
      subtitulo: edicao
        ? 'Alterações ficam registradas no histórico de movimentações'
        : 'O item entra direto no estoque do laboratório',
      corpo: formHTML(eq),
      botoes: [
        { texto: 'Cancelar', classe: 'btn--ghost' },
        {
          texto: edicao ? 'Salvar alterações' : 'Adicionar',
          classe: 'btn--primary',
          icone: 'check',
          acao: function (caixa) { return salvar(container, caixa, eq); }
        }
      ]
    });

    UI.ligarEquipamentoModelo(
      ref.el.querySelector('#eq-equipamento'),
      ref.el.querySelector('#eq-modelo'),
      eq && eq.modelo
    );
  }

  /** Retorna false para manter o modal aberto quando houver erro. */
  function salvar(container, caixa, eq) {
    var form = caixa.querySelector('#form-eq');
    if (!UI.validarForm(form)) {
      UI.toast('warn', 'Campos obrigatórios', 'Preencha os campos destacados.');
      return false;
    }

    var dados = UI.dadosForm(form);

    if (!dados.tomboNovo && !dados.tomboAntigo) {
      UI.marcarErro(caixa.querySelector('#eq-tombo-novo'), 'Informe o tombo novo ou o antigo.');
      UI.toast('warn', 'Tombo obrigatório', 'O equipamento precisa de ao menos um número de tombo.');
      return false;
    }

    var r = eq
      ? CELAB.store.atualizarEquipamento(eq.id, dados)
      : CELAB.store.criarEquipamento(dados);

    if (!r.ok) {
      UI.toast('error', 'Não foi possível salvar', r.erro);
      return false;
    }

    UI.toast('success',
      eq ? 'Equipamento atualizado' : 'Equipamento adicionado',
      (r.equipamento.equipamento || '') + ' · tombo ' +
      (r.equipamento.tomboNovo || r.equipamento.tomboAntigo));
  }

  /* ---------- Detalhes ------------------------------------------------------- */

  function abrirDetalhes(eq) {
    function linha(k, v) {
      return '<div class="result-preview__row"><span class="result-preview__k">' + U.esc(k) +
        '</span><span class="result-preview__v">' + (v || '<span class="muted">—</span>') + '</span></div>';
    }

    var historico = CELAB.store.listarMovimentacoes()
      .filter(function (m) { return m.equipamentoId === eq.id; })
      .slice(0, 8);

    var corpo =
      '<div class="result-preview" style="margin-bottom:16px">' +
        linha('Equipamento', U.esc(eq.equipamento)) +
        linha('Modelo', U.esc(eq.modelo)) +
        linha('Tombo novo', U.esc(eq.tomboNovo)) +
        linha('Tombo antigo', U.esc(eq.tomboAntigo)) +
        linha('Status', UI.chipStatus(eq.status)) +
        linha('TTR', UI.tagTTR(eq.ttr)) +
        linha('Chamado', U.esc(eq.chamado)) +
        linha('Entrada', U.dataBR(eq.dataEntrada)) +
        linha('Origem', U.esc([eq.predioOrigem, eq.setorOrigem].filter(Boolean).join(' · '))) +
        (eq.status === 'Disponibilizado'
          ? linha('Saída', U.dataBR(eq.dataSaida)) +
            linha('Destino', U.esc([eq.predioDestino, eq.setorDestino].filter(Boolean).join(' · ')))
          : '') +
        linha('Serviço solicitado', U.esc(eq.servicoSolicitado)) +
        linha('Última atualização', U.dataHoraBR(eq.atualizadoEm)) +
      '</div>' +
      '<div class="section-title" style="margin-top:0">Histórico deste equipamento</div>' +
      (historico.length
        ? '<div class="table-wrap"><table class="chart-table"><thead><tr>' +
          '<th>Data</th><th>Movimentação</th><th>Situação</th><th>Local</th></tr></thead><tbody>' +
          historico.map(function (m) {
            return '<tr><td>' + U.dataBR(m.data) + '</td>' +
              '<td>' + UI.chipTipoMov(m.tipo) + '</td>' +
              '<td>' + U.esc(m.statusResultante || '—') + '</td>' +
              '<td style="text-align:left">' + U.esc(m.predio || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<p style="font-size:12.5px;color:var(--text-muted)">Sem movimentações registradas.</p>');

    UI.modal({
      titulo: eq.equipamento + ' — ' + eq.modelo,
      subtitulo: 'Tombo ' + (eq.tomboNovo || eq.tomboAntigo || 'não informado'),
      corpo: corpo,
      botoes: [{ texto: 'Fechar', classe: 'btn--ghost' }]
    });
  }

  /* ---------- Exportação ------------------------------------------------------ */

  function rotuloFiltro() {
    var partes = [];
    if (filtros.local === 'lab') partes.push('Somente itens no laboratório');
    if (filtros.local === 'fora') partes.push('Somente disponibilizados');
    if (filtros.status) partes.push('Status: ' + filtros.status);
    if (filtros.equipamento) partes.push('Equipamento: ' + filtros.equipamento);
    if (filtros.modelo) partes.push('Modelo: ' + filtros.modelo);
    if (filtros.ttr) partes.push('TTR: ' + filtros.ttr);
    if (filtros.busca) partes.push('Busca: "' + filtros.busca + '"');
    return partes.length ? partes.join(' · ') : 'Sem filtros aplicados';
  }

  function exportar(formato) {
    var lista = filtrar();
    if (!lista.length) {
      UI.toast('warn', 'Nada a exportar', 'Nenhum equipamento corresponde aos filtros atuais.');
      return;
    }
    var nome = 'CELAB_Estoque_' + U.carimbo();
    if (formato === 'excel') {
      CELAB.exportar.paraExcel([{
        nome: 'Estoque',
        tituloRelatorio: 'CELAB — Estoque Laboratório',
        registros: lista,
        colunas: CELAB.exportar.COLS_ESTOQUE,
        resumo: [['Filtros', rotuloFiltro()], ['Registros', lista.length]]
      }], nome + '.xlsx');
    } else {
      CELAB.exportar.paraPDF({
        titulo: 'Estoque Laboratório',
        subtitulo: rotuloFiltro(),
        registros: lista,
        colunas: CELAB.exportar.COLS_ESTOQUE
      }, nome + '.pdf');
    }
  }

  /* ---------- Montagem -------------------------------------------------------- */

  function montar(container) {
    container.innerHTML = esqueleto();

    // Restaura os filtros da sessão anterior da aba
    container.querySelector('#f-busca').value = filtros.busca;
    container.querySelector('#f-local').value = filtros.local;
    container.querySelector('#f-status').value = filtros.status;
    container.querySelector('#f-equip').value = filtros.equipamento;
    container.querySelector('#f-modelo').value = filtros.modelo;
    container.querySelector('#f-ttr').value = filtros.ttr;

    var redesenhar = function () { desenharTabela(container); };

    var buscaDebounce = U.debounce(function (v) {
      filtros.busca = v; pagina = 1; redesenhar();
    }, 200);

    container.querySelector('#f-busca').addEventListener('input', function () {
      buscaDebounce(this.value);
    });

    [['#f-local', 'local'], ['#f-status', 'status'], ['#f-equip', 'equipamento'],
     ['#f-modelo', 'modelo'], ['#f-ttr', 'ttr']].forEach(function (par) {
      container.querySelector(par[0]).addEventListener('change', function () {
        filtros[par[1]] = this.value;
        pagina = 1;
        redesenhar();
      });
    });

    container.addEventListener('click', function (e) {
      var alvo;

      if ((alvo = e.target.closest('[data-acao="novo"]'))) {
        if (!CELAB.auth.permissao('podeEditar')) {
          return UI.toast('warn', 'Sem permissão', 'Seu perfil é somente de consulta.');
        }
        return abrirForm(container);
      }

      if ((alvo = e.target.closest('[data-acao="limpar-filtros"]'))) {
        filtros = { busca: '', status: '', equipamento: '', modelo: '', ttr: '', local: 'lab' };
        pagina = 1;
        container.querySelector('#f-busca').value = '';
        container.querySelector('#f-local').value = 'lab';
        container.querySelector('#f-status').value = '';
        container.querySelector('#f-equip').value = '';
        container.querySelector('#f-modelo').value = '';
        container.querySelector('#f-ttr').value = '';
        return redesenhar();
      }

      if ((alvo = e.target.closest('[data-acao="excel"]'))) return exportar('excel');
      if ((alvo = e.target.closest('[data-acao="pdf"]')))   return exportar('pdf');

      if ((alvo = e.target.closest('[data-ver]'))) {
        var eqV = CELAB.store.acharPorId(alvo.getAttribute('data-ver'));
        if (eqV) abrirDetalhes(eqV);
        return;
      }

      if ((alvo = e.target.closest('[data-editar]'))) {
        var eqE = CELAB.store.acharPorId(alvo.getAttribute('data-editar'));
        if (eqE) abrirForm(container, eqE);
        return;
      }

      if ((alvo = e.target.closest('[data-excluir]'))) {
        var id = alvo.getAttribute('data-excluir');
        var eqX = CELAB.store.acharPorId(id);
        if (!eqX) return;
        UI.confirmar({
          titulo: 'Excluir equipamento',
          mensagem: 'Remover ' + eqX.equipamento + ' — ' + eqX.modelo + ' (tombo ' +
                    (eqX.tomboNovo || eqX.tomboAntigo) + ')? A exclusão fica registrada no histórico.',
          confirmar: 'Excluir',
          perigo: true
        }).then(function (ok) {
          if (!ok) return;
          var r = CELAB.store.excluirEquipamento(id);
          if (r.ok) UI.toast('success', 'Equipamento excluído', 'Registro removido do estoque.');
          else UI.toast('error', 'Falha ao excluir', r.erro);
        });
        return;
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

    // Teclado nos cabeçalhos ordenáveis
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var th = e.target.closest('[data-ordenar]');
      if (!th) return;
      e.preventDefault();
      th.click();
    });

    desenharTabela(container);

    // Tempo real: entradas e saídas em qualquer aba repintam esta tabela.
    var cancelar = CELAB.store.assinar(function () { desenharTabela(container); });

    return { destruir: cancelar };
  }

  CELAB.pages = CELAB.pages || {};
  CELAB.pages.estoque = {
    titulo: 'Estoque Laboratório',
    subtitulo: 'Equipamentos sob guarda do laboratório',
    montar: montar
  };

})(window.CELAB);
