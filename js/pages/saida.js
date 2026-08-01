/* ==========================================================================
   CELAB — Aba: Saída de Equipamentos
   --------------------------------------------------------------------------
   Salvar aqui tira o item do estoque físico: o status vira "Disponibilizado"
   com destino preenchido. O registro não é apagado, para preservar a
   rastreabilidade patrimonial — e some da aba Estoque (filtro "No laboratório")
   e dos indicadores da Dashboard no mesmo instante.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;
  var U = CELAB.util;

  function esqueleto() {
    return '' +
      '<div class="page-head">' +
        '<div>' +
          '<h1 class="page-head__title">Saída de Equipamentos</h1>' +
          '<p class="page-head__sub">Registre o envio de itens do laboratório para as unidades</p>' +
        '</div>' +
      '</div>' +

      '<div class="alert alert--info">' + UI.icone('info', 17) +
        '<span>Informe o <strong>tombo</strong> e o sistema localiza o equipamento no estoque. ' +
        'Ao salvar, ele sai do estoque do laboratório (status <strong>Disponibilizado</strong>) ' +
        'e os indicadores são recalculados na hora.</span>' +
      '</div>' +

      '<div class="card" style="margin-bottom:18px">' +
        '<div class="card__head">' +
          '<div>' +
            '<div class="card__title">Dados da saída</div>' +
            '<div class="card__sub">Campos com <span style="color:var(--status-critical)">*</span> são obrigatórios</div>' +
          '</div>' +
        '</div>' +
        '<div class="card__body">' +
          '<form id="form-saida" novalidate>' +
            '<div class="form-grid">' +

              '<div class="field">' +
                '<label for="sa-data">Data de saída <span class="req">*</span></label>' +
                '<input class="input" type="date" id="sa-data" name="dataSaida" ' +
                  'value="' + U.hoje() + '" data-obrigatorio>' +
                '<span class="field__error">Informe a data de saída.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-chamado">Chamado</label>' +
                '<input class="input" type="text" id="sa-chamado" name="chamado" placeholder="Ex.: CH-10488">' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-tombo-novo">Tombo Novo</label>' +
                '<input class="input" type="text" id="sa-tombo-novo" name="tomboNovo" ' +
                  'inputmode="numeric" placeholder="Digite para localizar…" ' +
                  'list="lista-tombos" autocomplete="off">' +
                '<datalist id="lista-tombos"></datalist>' +
                '<span class="field__error">Informe o tombo novo ou o antigo.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-tombo-antigo">Tombo Antigo</label>' +
                '<input class="input" type="text" id="sa-tombo-antigo" name="tomboAntigo" ' +
                  'inputmode="numeric" placeholder="Ex.: 11233" autocomplete="off">' +
              '</div>' +

              '<div class="field field--full" id="sa-achado-wrap" style="display:none">' +
                '<div class="result-preview" id="sa-achado"></div>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-equipamento">Equipamento <span class="req">*</span></label>' +
                '<select class="select" id="sa-equipamento" name="equipamento" data-obrigatorio>' +
                  UI.opcoes(CELAB.EQUIPAMENTOS) + '</select>' +
                '<span class="field__error">Selecione o equipamento.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-modelo">Modelo <span class="req">*</span></label>' +
                '<select class="select" id="sa-modelo" name="modelo" data-obrigatorio></select>' +
                '<span class="field__error">Selecione o modelo.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-predio">Prédio de destino <span class="req">*</span></label>' +
                '<select class="select" id="sa-predio" name="predioDestino" data-obrigatorio>' +
                  UI.opcoes(CELAB.PREDIOS) + '</select>' +
                '<span class="field__error">Selecione o prédio de destino.</span>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-setor">Setor / Unidade de destino</label>' +
                '<input class="input" type="text" id="sa-setor" name="setorDestino" ' +
                  'placeholder="Ex.: 2ª Vara Criminal" list="lista-setores-saida">' +
                '<datalist id="lista-setores-saida"></datalist>' +
              '</div>' +

              '<div class="field">' +
                '<label for="sa-ttr">TTR <span class="req">*</span></label>' +
                '<select class="select" id="sa-ttr" name="ttr" data-obrigatorio>' +
                  UI.opcoes(CELAB.TTR, 'Pendente', false) + '</select>' +
              '</div>' +

              '<div class="field field--full">' +
                '<label for="sa-servico">Serviço solicitado</label>' +
                '<textarea class="textarea" id="sa-servico" name="servicoSolicitado" ' +
                  'placeholder="Descreva o serviço atendido ou o motivo da disponibilização…"></textarea>' +
              '</div>' +

            '</div>' +

            '<div class="form-actions">' +
              '<button type="submit" class="btn btn--primary" id="sa-enviar">' +
                UI.icone('saida', 16) + '<span>Registrar saída</span></button>' +
              '<button type="reset" class="btn btn--ghost">' +
                UI.icone('limpar', 16) + '<span>Limpar formulário</span></button>' +
            '</div>' +

          '</form>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card__head">' +
          '<div>' +
            '<div class="card__title">Últimas saídas registradas</div>' +
            '<div class="card__sub">20 lançamentos mais recentes</div>' +
          '</div>' +
          '<div class="card__spacer"></div>' +
          '<button class="btn btn--outline btn--sm" data-acao="excel">' +
            UI.icone('excel', 14) + '<span>Excel</span></button>' +
          '<button class="btn btn--outline btn--sm" data-acao="pdf">' +
            UI.icone('pdf', 14) + '<span>PDF</span></button>' +
        '</div>' +
        '<div class="card__body card__body--flush">' +
          '<div class="table-wrap" id="saida-recentes"></div>' +
        '</div>' +
      '</div>';
  }

  function saidas() {
    return CELAB.store.listarMovimentacoes().filter(function (m) { return m.tipo === 'SAIDA'; });
  }

  function desenharRecentes(container) {
    var lista = saidas().slice(0, 20);
    var alvo = container.querySelector('#saida-recentes');

    if (!lista.length) {
      alvo.innerHTML = UI.estadoVazio('Nenhuma saída registrada',
        'O primeiro lançamento aparece aqui automaticamente.');
      return;
    }

    var html = '<table class="table"><thead><tr>' +
      '<th>Data</th><th>Chamado</th><th>Equipamento</th><th>Modelo</th>' +
      '<th>Tombo Novo</th><th>Tombo Antigo</th><th>Prédio de destino</th>' +
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
        '<td>' + U.esc(m.predio || '—') + '</td>' +
        '<td>' + U.esc(m.setor || '—') + '</td>' +
        '<td>' + UI.tagTTR(m.ttr) + '</td>' +
        '<td class="muted">' + U.esc(m.usuario || '—') + '</td>' +
      '</tr>';
    });

    alvo.innerHTML = html + '</tbody></table>';
  }

  /** Preenche o datalist com os tombos que ainda estão no laboratório. */
  function atualizarSugestoes(container) {
    var noLab = CELAB.store.estoqueLaboratorio();

    var dlTombos = container.querySelector('#lista-tombos');
    if (dlTombos) {
      dlTombos.innerHTML = noLab.map(function (e) {
        var t = e.tomboNovo || e.tomboAntigo;
        if (!t) return '';
        return '<option value="' + U.esc(t) + '">' +
          U.esc(e.equipamento + ' · ' + e.modelo) + '</option>';
      }).join('');
    }

    var vistos = {};
    CELAB.store.listarEquipamentos().forEach(function (e) {
      if (e.setorOrigem) vistos[e.setorOrigem] = true;
      if (e.setorDestino) vistos[e.setorDestino] = true;
    });
    var dlSetores = container.querySelector('#lista-setores-saida');
    if (dlSetores) {
      dlSetores.innerHTML = Object.keys(vistos).sort().map(function (s) {
        return '<option value="' + U.esc(s) + '"></option>';
      }).join('');
    }
  }

  function montar(container, navegar) {
    container.innerHTML = esqueleto();

    var form = container.querySelector('#form-saida');
    var selEquip = container.querySelector('#sa-equipamento');
    var selModelo = container.querySelector('#sa-modelo');
    var tomboNovo = container.querySelector('#sa-tombo-novo');
    var tomboAntigo = container.querySelector('#sa-tombo-antigo');
    var achadoWrap = container.querySelector('#sa-achado-wrap');
    var achado = container.querySelector('#sa-achado');

    UI.ligarEquipamentoModelo(selEquip, selModelo);

    /* Localiza o equipamento pelo tombo e preenche o restante do formulário. */
    function localizar() {
      var eq = CELAB.store.acharPorTombo({
        tomboNovo: tomboNovo.value, tomboAntigo: tomboAntigo.value
      });

      if (!eq) {
        achadoWrap.style.display = 'none';
        return null;
      }

      function linha(k, v) {
        return '<div class="result-preview__row"><span class="result-preview__k">' + U.esc(k) +
          '</span><span class="result-preview__v">' + v + '</span></div>';
      }

      var jaSaiu = eq.status === 'Disponibilizado';
      achado.innerHTML =
        linha('Equipamento localizado', U.esc(eq.equipamento + ' · ' + eq.modelo)) +
        linha('Situação atual', UI.chipStatus(eq.status)) +
        linha('Origem', U.esc([eq.predioOrigem, eq.setorOrigem].filter(Boolean).join(' · ') || '—')) +
        linha('Entrada em', U.dataBR(eq.dataEntrada)) +
        (jaSaiu
          ? linha('Atenção', '<span style="color:var(--status-critical)">Já disponibilizado em ' +
              U.dataBR(eq.dataSaida) + ' para ' + U.esc(eq.predioDestino || '—') + '</span>')
          : '');
      achadoWrap.style.display = '';

      // Sincroniza categoria e modelo com o cadastro.
      if (eq.equipamento) {
        selEquip.value = eq.equipamento;
        selEquip.dispatchEvent(new Event('change'));
        selModelo.value = eq.modelo || '';
      }
      if (!container.querySelector('#sa-chamado').value && eq.chamado) {
        container.querySelector('#sa-chamado').value = eq.chamado;
      }
      // Completa o tombo que estiver faltando.
      if (!tomboNovo.value && eq.tomboNovo) tomboNovo.value = eq.tomboNovo;
      if (!tomboAntigo.value && eq.tomboAntigo) tomboAntigo.value = eq.tomboAntigo;

      return eq;
    }

    var localizarDebounce = U.debounce(localizar, 260);
    tomboNovo.addEventListener('input', localizarDebounce);
    tomboAntigo.addEventListener('input', localizarDebounce);
    tomboNovo.addEventListener('change', localizar);
    tomboAntigo.addEventListener('change', localizar);

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

      var r = CELAB.store.registrarSaida(dados);
      if (!r.ok) {
        UI.marcarErro(tomboNovo, 'Equipamento não disponível para saída.');
        return UI.toast('error', 'Saída não registrada', r.erro);
      }

      UI.toast('success', 'Saída registrada',
        r.equipamento.equipamento + ' · tombo ' + (r.equipamento.tomboNovo || r.equipamento.tomboAntigo) +
        ' → ' + (r.equipamento.predioDestino || 'destino') + '. Estoque e dashboard atualizados.');

      form.reset();
      container.querySelector('#sa-data').value = U.hoje();
      UI.ligarEquipamentoModelo(selEquip, selModelo);
      achadoWrap.style.display = 'none';
      tomboNovo.focus();
    });

    form.addEventListener('reset', function () {
      setTimeout(function () {
        container.querySelector('#sa-data').value = U.hoje();
        UI.ligarEquipamentoModelo(selEquip, selModelo);
        achadoWrap.style.display = 'none';
        container.querySelectorAll('.field').forEach(function (f) { f.classList.remove('has-error'); });
      }, 0);
    });

    container.addEventListener('click', function (e) {
      var acao = e.target.closest('[data-acao]');
      if (!acao) return;
      var lista = saidas();
      if (!lista.length) return UI.toast('warn', 'Nada a exportar', 'Nenhuma saída registrada.');

      if (acao.getAttribute('data-acao') === 'excel') {
        CELAB.exportar.paraExcel([{
          nome: 'Saídas',
          tituloRelatorio: 'CELAB — Saídas de Equipamentos',
          registros: lista,
          colunas: CELAB.exportar.COLS_MOV
        }], 'CELAB_Saidas_' + U.carimbo() + '.xlsx');
      } else {
        CELAB.exportar.paraPDF({
          titulo: 'Saídas de Equipamentos',
          subtitulo: 'Todas as saídas registradas do laboratório',
          registros: lista,
          colunas: CELAB.exportar.COLS_MOV
        }, 'CELAB_Saidas_' + U.carimbo() + '.pdf');
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
  CELAB.pages.saida = {
    titulo: 'Saída de Equipamentos',
    subtitulo: 'Envio de itens para as unidades',
    montar: montar
  };

})(window.CELAB);
