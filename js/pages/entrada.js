/* ==========================================================================
   CELAB — Aba: Entrada de Equipamentos
   --------------------------------------------------------------------------
   Salvar aqui cria ou atualiza o item no Estoque Laboratório e repinta a
   Dashboard no mesmo instante (via CELAB.store.registrarEntrada -> emit).
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;
  var U = CELAB.util;

  function esqueleto() {
    return '' +
      '<div class="page-head">' +
        '<div>' +
          '<h1 class="page-head__title">Entrada de Equipamentos</h1>' +
          '<p class="page-head__sub">Registre a chegada de itens ao laboratório</p>' +
        '</div>' +
      '</div>' +

      '<div class="alert alert--info">' + UI.icone('info', 17) +
        '<span>Ao salvar, o equipamento é criado no <strong>Estoque Laboratório</strong> e a ' +
        '<strong>Dashboard</strong> é atualizada na hora. Se o tombo já existir, o registro ' +
        'existente é atualizado em vez de duplicado.</span>' +
      '</div>' +

      '<div class="card" style="margin-bottom:18px">' +
        '<div class="card__head">' +
          '<div>' +
            '<div class="card__title">Dados da entrada</div>' +
            '<div class="card__sub">Campos com <span class="req" style="color:var(--status-critical)">*</span> são obrigatórios</div>' +
          '</div>' +
        '</div>' +
        '<div class="card__body">' +
          '<form id="form-entrada" novalidate>' +
            '<div class="form-grid">' +

              '<div class="field">' +
                '<label for="en-data">Data de entrada <span class="req">*</span></label>' +
                '<input class="input" type="date" id="en-data" name="dataEntrada" ' +
                  'value="' + U.hoje() + '" max="' + U.hoje() + '" data-obrigatorio>' +
                '<span class="field__error">Informe a data de entrada.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-chamado">Chamado</label>' +
                '<input class="input" type="text" id="en-chamado" name="chamado" placeholder="Ex.: CH-10450">' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-tombo-novo">Tombo Novo</label>' +
                '<input class="input" type="text" id="en-tombo-novo" name="tomboNovo" ' +
                  'inputmode="numeric" placeholder="Ex.: 045112" autocomplete="off">' +
                '<span class="field__help" id="en-aviso-tombo"></span>' +
                '<span class="field__error">Informe o tombo novo ou o antigo.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-tombo-antigo">Tombo Antigo</label>' +
                '<input class="input" type="text" id="en-tombo-antigo" name="tomboAntigo" ' +
                  'inputmode="numeric" placeholder="Ex.: 11233" autocomplete="off">' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-equipamento">Equipamento <span class="req">*</span></label>' +
                '<select class="select" id="en-equipamento" name="equipamento" data-obrigatorio>' +
                  UI.opcoes(CELAB.EQUIPAMENTOS) + '</select>' +
                '<span class="field__error">Selecione o equipamento.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-modelo">Modelo <span class="req">*</span></label>' +
                '<select class="select" id="en-modelo" name="modelo" data-obrigatorio></select>' +
                '<span class="field__error">Selecione o modelo.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-status">Status <span class="req">*</span></label>' +
                '<select class="select" id="en-status" name="status" data-obrigatorio>' +
                  UI.opcoes(CELAB.STATUS_ENTRADA, 'Estoque', false) + '</select>' +
                '<span class="field__help" id="en-desc-status">Disponível para uso</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-ttr">TTR <span class="req">*</span></label>' +
                '<select class="select" id="en-ttr" name="ttr" data-obrigatorio>' +
                  UI.opcoes(CELAB.TTR, 'Pendente', false) + '</select>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-predio">Prédio de onde veio <span class="req">*</span></label>' +
                '<select class="select" id="en-predio" name="predioOrigem" data-obrigatorio>' +
                  UI.opcoes(CELAB.PREDIOS) + '</select>' +
                '<span class="field__error">Selecione o prédio de origem.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="en-setor">Setor / Unidade</label>' +
                '<input class="input" type="text" id="en-setor" name="setorOrigem" ' +
                  'placeholder="Ex.: 1ª Vara Cível" list="lista-setores">' +
                '<datalist id="lista-setores"></datalist>' +
              '</div>' +

              '<div class="field field--full">' +
                '<label for="en-servico">Serviço solicitado</label>' +
                '<textarea class="textarea" id="en-servico" name="servicoSolicitado" ' +
                  'placeholder="Descreva o serviço solicitado, o defeito relatado ou o motivo do recolhimento…"></textarea>' +
              '</div>' +

            '</div>' +

            '<div class="form-actions">' +
              '<button type="submit" class="btn btn--primary">' +
                UI.icone('entrada', 16) + '<span>Registrar entrada</span></button>' +
              '<button type="reset" class="btn btn--ghost">' +
                UI.icone('limpar', 16) + '<span>Limpar formulário</span></button>' +
              '<span class="spacer"></span>' +
              '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--text-secondary)">' +
                '<input type="checkbox" id="en-continuar" checked style="width:15px;height:15px;accent-color:var(--brand)">' +
                'Manter dados para o próximo lançamento' +
              '</label>' +
            '</div>' +

          '</form>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">' +
          '<div>' +
            '<div class="card__title">Últimas entradas registradas</div>' +
            '<div class="card__sub">20 lançamentos mais recentes</div>' +
          '</div>' +
          '<div class="card__spacer"></div>' +
          '<button class="btn btn--outline btn--sm" data-acao="excel">' +
            UI.icone('excel', 14) + '<span>Excel</span></button>' +
          '<button class="btn btn--outline btn--sm" data-acao="pdf">' +
            UI.icone('pdf', 14) + '<span>PDF</span></button>' +
        '</div>' +
        '<div class="card__body card__body--flush">' +
          '<div class="table-wrap" id="entrada-recentes"></div>' +
        '</div>' +
      '</div>';
  }

  function entradas() {
    return CELAB.store.listarMovimentacoes().filter(function (m) { return m.tipo === 'ENTRADA'; });
  }

  function desenharRecentes(container) {
    var lista = entradas().slice(0, 20);
    var alvo = container.querySelector('#entrada-recentes');

    if (!lista.length) {
      alvo.innerHTML = UI.estadoVazio('Nenhuma entrada registrada',
        'O primeiro lançamento aparece aqui automaticamente.');
      return;
    }

    var html = '<table class="table"><thead><tr>' +
      '<th>Data</th><th>Chamado</th><th>Equipamento</th><th>Modelo</th>' +
      '<th>Tombo Novo</th><th>Tombo Antigo</th><th>Status</th><th>Origem</th>' +
      '<th>Setor</th><th>TTR</th><th>Registrado por</th>' +
      '</tr></thead><tbody>';

    lista.forEach(function (m) {
      html += '<tr>' +
        '<td class="num">' + U.dataBR(m.data) + '</td>' +
        '<td class="num">' + (m.chamado ? U.esc(m.chamado) : '<span class="muted">—</span>') + '</td>' +
        '<td class="strong">' + U.esc(m.equipamento || '—') + '</td>' +
        '<td>' + U.esc(m.modelo || '—') + '</td>' +
        '<td class="num tombo">' + (m.tomboNovo ? U.esc(m.tomboNovo) : '<span class="muted">—</span>') + '</td>' +
        '<td class="num tombo">' + (m.tomboAntigo ? U.esc(m.tomboAntigo) : '<span class="muted">—</span>') + '</td>' +
        '<td>' + UI.chipStatus(m.statusResultante) + '</td>' +
        '<td>' + U.esc(m.predio || '—') + '</td>' +
        '<td>' + U.esc(m.setor || '—') + '</td>' +
        '<td>' + UI.tagTTR(m.ttr) + '</td>' +
        '<td class="muted">' + U.esc(m.usuario || '—') + '</td>' +
      '</tr>';
    });

    alvo.innerHTML = html + '</tbody></table>';
  }

  /** Sugere setores já usados, para reduzir digitação e divergência. */
  function atualizarSugestoes(container) {
    var vistos = {};
    CELAB.store.listarEquipamentos().forEach(function (e) {
      if (e.setorOrigem) vistos[e.setorOrigem] = true;
      if (e.setorDestino) vistos[e.setorDestino] = true;
    });
    var dl = container.querySelector('#lista-setores');
    if (dl) {
      dl.innerHTML = Object.keys(vistos).sort().map(function (s) {
        return '<option value="' + U.esc(s) + '"></option>';
      }).join('');
    }
  }

  function montar(container, navegar) {
    container.innerHTML = esqueleto();

    var form = container.querySelector('#form-entrada');
    var selEquip = container.querySelector('#en-equipamento');
    var selModelo = container.querySelector('#en-modelo');
    var selStatus = container.querySelector('#en-status');
    var descStatus = container.querySelector('#en-desc-status');
    var tomboNovo = container.querySelector('#en-tombo-novo');
    var tomboAntigo = container.querySelector('#en-tombo-antigo');
    var aviso = container.querySelector('#en-aviso-tombo');

    UI.ligarEquipamentoModelo(selEquip, selModelo);

    selStatus.addEventListener('change', function () {
      descStatus.textContent = CELAB.statusMeta(this.value).desc;
    });

    /* Avisa quando o tombo já existe e pré-preenche a categoria/modelo. */
    function checarTombo() {
      var existente = CELAB.store.acharPorTombo({
        tomboNovo: tomboNovo.value, tomboAntigo: tomboAntigo.value
      });
      if (!existente) { aviso.textContent = ''; aviso.style.color = ''; return; }

      aviso.textContent = 'Tombo já cadastrado (' + existente.equipamento + ' · ' +
        existente.modelo + ', status "' + existente.status + '"). Salvar atualiza este registro.';
      aviso.style.color = 'var(--status-warning)';

      if (!selEquip.value) {
        selEquip.value = existente.equipamento;
        selEquip.dispatchEvent(new Event('change'));
        selModelo.value = existente.modelo;
      }
    }

    tomboNovo.addEventListener('blur', checarTombo);
    tomboAntigo.addEventListener('blur', checarTombo);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!CELAB.auth.permissao('podeEditar')) {
        return UI.toast('warn', 'Sem permissão', 'Seu perfil é somente de consulta.');
      }
      if (!UI.validarForm(form)) {
        return UI.toast('warn', 'Campos obrigatórios', 'Preencha os campos destacados.');
      }

      var dados = UI.dadosForm(form);

      if (!dados.tomboNovo && !dados.tomboAntigo) {
        UI.marcarErro(tomboNovo, 'Informe o tombo novo ou o antigo.');
        return UI.toast('warn', 'Tombo obrigatório', 'Informe ao menos um número de tombo.');
      }

      var r = CELAB.store.registrarEntrada(dados);
      if (!r.ok) return UI.toast('error', 'Não foi possível registrar', r.erro);

      UI.toast('success',
        r.criado ? 'Entrada registrada' : 'Reentrada registrada',
        r.equipamento.equipamento + ' · tombo ' + (r.equipamento.tomboNovo || r.equipamento.tomboAntigo) +
        ' — estoque e dashboard atualizados.');

      var manter = container.querySelector('#en-continuar').checked;
      if (manter) {
        // Preserva data/prédio/setor/chamado; zera o que identifica o item.
        tomboNovo.value = '';
        tomboAntigo.value = '';
        container.querySelector('#en-servico').value = '';
        aviso.textContent = '';
        tomboNovo.focus();
      } else {
        form.reset();
        container.querySelector('#en-data').value = U.hoje();
        UI.ligarEquipamentoModelo(selEquip, selModelo);
        aviso.textContent = '';
      }
    });

    form.addEventListener('reset', function () {
      setTimeout(function () {
        container.querySelector('#en-data').value = U.hoje();
        UI.ligarEquipamentoModelo(selEquip, selModelo);
        aviso.textContent = '';
        container.querySelectorAll('.field').forEach(function (f) { f.classList.remove('has-error'); });
      }, 0);
    });

    container.addEventListener('click', function (e) {
      var acao = e.target.closest('[data-acao]');
      if (!acao) return;
      var lista = entradas();
      if (!lista.length) return UI.toast('warn', 'Nada a exportar', 'Nenhuma entrada registrada.');

      if (acao.getAttribute('data-acao') === 'excel') {
        CELAB.exportar.paraExcel([{
          nome: 'Entradas',
          tituloRelatorio: 'CELAB — Entradas de Equipamentos',
          registros: lista,
          colunas: CELAB.exportar.COLS_MOV
        }], 'CELAB_Entradas_' + U.carimbo() + '.xlsx');
      } else {
        CELAB.exportar.paraPDF({
          titulo: 'Entradas de Equipamentos',
          subtitulo: 'Todas as entradas registradas no laboratório',
          registros: lista,
          colunas: CELAB.exportar.COLS_MOV
        }, 'CELAB_Entradas_' + U.carimbo() + '.pdf');
      }
    });

    desenharRecentes(container);
    atualizarSugestoes(container);

    var cancelar = CELAB.store.assinar(function () {
      desenharRecentes(container);
      atualizarSugestoes(container);
    });

    return { destruir: cancelar };
  }

  CELAB.pages = CELAB.pages || {};
  CELAB.pages.entrada = {
    titulo: 'Entrada de Equipamentos',
    subtitulo: 'Registro de chegada ao laboratório',
    montar: montar
  };

})(window.CELAB);
