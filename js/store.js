/* ==========================================================================
   CELAB — Store: estado global, persistência e regras de negócio
   --------------------------------------------------------------------------
   Fonte única da verdade. Toda mutação passa por aqui e dispara `emit()`,
   que notifica (a) os assinantes desta aba e (b) as outras abas abertas via
   BroadcastChannel — é isso que faz Dashboard, Estoque e Relatórios se
   atualizarem no mesmo instante em que uma entrada ou saída é salva.
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var KEY = CELAB.APP.storageKey;

  /* ---------- Utilitários -------------------------------------------------- */

  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function agora() { return new Date().toISOString(); }

  function hoje() { return new Date().toISOString().slice(0, 10); }

  function norm(v) {
    return String(v == null ? '' : v).trim();
  }

  /** Chave de identidade do equipamento: tombo novo, senão tombo antigo. */
  function chaveTombo(reg) {
    var n = norm(reg.tomboNovo).toUpperCase();
    if (n) return 'N:' + n;
    var a = norm(reg.tomboAntigo).toUpperCase();
    if (a) return 'A:' + a;
    return '';
  }

  /* ---------- Estado ------------------------------------------------------- */

  var estado = {
    equipamentos: [],
    movimentacoes: [],
    usuarios: [],
    meta: { criadoEm: null, versao: 1 }
  };

  var ouvintes = [];
  var canal = null;
  var salvarPendente = null;
  var origemLocal = uid(); // identifica esta aba, para ignorar o próprio eco

  /* ---------- Persistência ------------------------------------------------- */

  function podeUsarLocalStorage() {
    try {
      var t = '__celab_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  var temLS = podeUsarLocalStorage();
  var memoria = null; // fallback quando localStorage está bloqueado (file:// restrito)

  function ler() {
    if (!temLS) return memoria;
    try {
      var bruto = window.localStorage.getItem(KEY);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      console.warn('[CELAB] Falha ao ler o armazenamento local:', e);
      return null;
    }
  }

  function gravar() {
    var payload = JSON.stringify(estado);
    if (!temLS) { memoria = JSON.parse(payload); return; }
    try {
      window.localStorage.setItem(KEY, payload);
    } catch (e) {
      console.error('[CELAB] Falha ao gravar (cota excedida?):', e);
      if (CELAB.ui && CELAB.ui.toast) {
        CELAB.ui.toast('error', 'Falha ao salvar', 'O navegador recusou a gravação local. Exporte os dados para não perdê-los.');
      }
    }
  }

  /** Grava com debounce: várias mutações seguidas viram uma escrita só. */
  function agendarGravacao() {
    if (salvarPendente) clearTimeout(salvarPendente);
    salvarPendente = setTimeout(function () { salvarPendente = null; gravar(); }, 120);
  }

  /* ---------- Pub/sub + realtime entre abas -------------------------------- */

  function emit(evento) {
    agendarGravacao();
    var detalhe = evento || { tipo: 'sync' };
    ouvintes.forEach(function (fn) {
      try { fn(detalhe, estado); } catch (e) { console.error('[CELAB] Erro em ouvinte:', e); }
    });
    if (canal) {
      try { canal.postMessage({ origem: origemLocal, evento: detalhe }); } catch (e) { /* ignora */ }
    }
  }

  function assinar(fn) {
    ouvintes.push(fn);
    return function cancelar() {
      var i = ouvintes.indexOf(fn);
      if (i > -1) ouvintes.splice(i, 1);
    };
  }

  /** Recarrega do storage e notifica só os ouvintes locais (sem re-emitir). */
  function recarregarDeFora(evento) {
    var dados = ler();
    if (dados) {
      estado.equipamentos = dados.equipamentos || [];
      estado.movimentacoes = dados.movimentacoes || [];
      estado.usuarios = dados.usuarios || [];
      estado.meta = dados.meta || estado.meta;
    }
    ouvintes.forEach(function (fn) {
      try { fn(evento || { tipo: 'sync', externo: true }, estado); } catch (e) { console.error(e); }
    });
  }

  function iniciarRealtime() {
    if ('BroadcastChannel' in window) {
      try {
        canal = new BroadcastChannel(CELAB.APP.channel);
        canal.onmessage = function (msg) {
          var d = msg.data || {};
          if (d.origem === origemLocal) return; // eco da própria aba
          recarregarDeFora(Object.assign({ externo: true }, d.evento));
        };
      } catch (e) { canal = null; }
    }
    // Fallback: o evento `storage` dispara nas OUTRAS abas da mesma origem.
    window.addEventListener('storage', function (e) {
      if (e.key !== KEY) return;
      recarregarDeFora({ tipo: 'sync', externo: true });
    });
  }

  /* ---------- Seed inicial -------------------------------------------------- */

  function usuariosPadrao() {
    return [
      { id: uid(), usuario: 'admin',  senha: 'admin123',  nome: 'Administrador CELAB', perfil: 'admin',   criadoEm: agora() },
      { id: uid(), usuario: 'tecnico', senha: 'tecnico123', nome: 'Técnico de Laboratório', perfil: 'tecnico', criadoEm: agora() }
    ];
  }

  /** Amostra pequena para a dashboard não nascer vazia. Zere em produção. */
  function seedDemo() {
    var base = new Date();
    function diasAtras(n) {
      var d = new Date(base.getTime() - n * 86400000);
      return d.toISOString().slice(0, 10);
    }
    var demo = [
      { cat: 'Monitor',    mod: 'LG 24BL550J-B',            tn: '045112', ta: '11233', st: 'Estoque',    pr: 'Sede Administrativa', se: 'DITEC', dias: 12 },
      { cat: 'Monitor',    mod: 'HP P22A G4',               tn: '045118', ta: '',      st: 'Estoque',    pr: 'Forum Civel',         se: '1ª Vara Cível', dias: 10 },
      { cat: 'Monitor',    mod: 'Positivo 22MP55PY',        tn: '045230', ta: '10877', st: 'Defeito',    pr: 'Palácio',             se: 'Gabinete', dias: 9 },
      { cat: 'Computador', mod: 'Lenovo ThinkCentre M75q',  tn: '046001', ta: '',      st: 'Estoque',    pr: 'Sede Administrativa', se: 'DITEC', dias: 8 },
      { cat: 'Computador', mod: 'Positivo Master 820',      tn: '046010', ta: '09912', st: 'Manutenção', pr: 'Forum Criminal',      se: '2ª Vara Criminal', dias: 7 },
      { cat: 'Computador', mod: 'Positivo Minipro 810',     tn: '046022', ta: '',      st: 'Manutenção', pr: 'CB - Comarca de Bonfim', se: 'Secretaria', dias: 6 },
      { cat: 'Impressora', mod: 'HP Pro M404DW',            tn: '047300', ta: '08820', st: 'Estoque',    pr: 'Forum Civel',         se: 'Protocolo', dias: 6 },
      { cat: 'Impressora', mod: 'OKI 5112',                 tn: '047311', ta: '',      st: 'Leilão',     pr: 'AG - Arquivo Geral',  se: 'Arquivo', dias: 5 },
      { cat: 'Nobreak',    mod: 'Ragtech Easy Way 1200',    tn: '048500', ta: '07741', st: 'Estoque',    pr: 'Sede Administrativa', se: 'CPD', dias: 5 },
      { cat: 'Nobreak',    mod: 'Ragtech Easy Way 1200',    tn: '048501', ta: '',      st: 'Defeito',    pr: 'NUPAC',               se: 'Atendimento', dias: 4 },
      { cat: 'Notebook',   mod: 'Positivo N6440',           tn: '049100', ta: '',      st: 'Estoque',    pr: 'Vara Infancia e Juventude', se: 'Cartório', dias: 4 },
      { cat: 'Scanner',    mod: 'Kodak ScanMate i1150',     tn: '050220', ta: '06630', st: 'Estoque',    pr: 'Forum Civel',         se: 'Digitalização', dias: 3 },
      { cat: 'Scanner',    mod: 'Avision AD345G',           tn: '050231', ta: '',      st: 'Manutenção', pr: 'CC - Comarca de Caracarai', se: 'Secretaria', dias: 3 },
      { cat: 'Headset',    mod: 'Logitech',                 tn: '051010', ta: '',      st: 'Estoque',    pr: 'NCTC - Nucleo de Conciliacao do Terminal do Centro', se: 'Conciliação', dias: 2 },
      { cat: 'Webcam',     mod: 'Logitech C925e',           tn: '051500', ta: '',      st: 'Estoque',    pr: 'Casa da Mulher Brasileira', se: 'Recepção', dias: 2 },
      { cat: 'HDMI',       mod: 'HDMI - 10M',               tn: '052001', ta: '',      st: 'Estoque',    pr: 'Conj. Desembargadores', se: 'Plenário', dias: 2 },
      { cat: 'Projetor Multimidia', mod: 'EPSON POWERLITE X29', tn: '053000', ta: '05512', st: 'Leilão', pr: 'Palácio',           se: 'Auditório', dias: 1 },
      { cat: 'Eq. Video Conf.', mod: 'GoPresence Teams 10x', tn: '054000', ta: '',     st: 'Estoque',    pr: 'Sede Administrativa', se: 'Sala de Reunião', dias: 1 }
    ];

    demo.forEach(function (d, i) {
      registrarEntrada({
        dataEntrada: diasAtras(d.dias),
        chamado: 'CH-' + (10450 + i),
        tomboNovo: d.tn,
        tomboAntigo: d.ta,
        equipamento: d.cat,
        modelo: d.mod,
        servicoSolicitado: 'Recolhimento para avaliação técnica e conferência de patrimônio.',
        status: d.st,
        predioOrigem: d.pr,
        setorOrigem: d.se,
        ttr: i % 3 === 0 ? 'Pendente' : 'Realizado'
      }, { silencioso: true, usuario: 'sistema' });
    });

    // Duas saídas para o histórico não nascer só com entradas.
    registrarSaida({
      dataSaida: diasAtras(1),
      chamado: 'CH-10480',
      tomboNovo: '045118',
      tomboAntigo: '',
      equipamento: 'Monitor',
      modelo: 'HP P22A G4',
      servicoSolicitado: 'Substituição de monitor com defeito na unidade.',
      predioDestino: 'Forum Criminal',
      setorDestino: '1ª Vara Criminal',
      ttr: 'Realizado'
    }, { silencioso: true, usuario: 'sistema' });

    registrarSaida({
      dataSaida: diasAtras(0),
      chamado: 'CH-10488',
      tomboNovo: '051010',
      tomboAntigo: '',
      equipamento: 'Headset',
      modelo: 'Logitech',
      servicoSolicitado: 'Atendimento a solicitação de novo posto de trabalho.',
      predioDestino: 'PA - Iracema',
      setorDestino: 'Atendimento',
      ttr: 'Pendente'
    }, { silencioso: true, usuario: 'sistema' });
  }

  function inicializar(opcoes) {
    var dados = ler();
    if (dados && dados.equipamentos) {
      estado.equipamentos = dados.equipamentos;
      estado.movimentacoes = dados.movimentacoes || [];
      estado.usuarios = (dados.usuarios && dados.usuarios.length) ? dados.usuarios : usuariosPadrao();
      estado.meta = dados.meta || { criadoEm: agora(), versao: 1 };
    } else {
      estado.usuarios = usuariosPadrao();
      estado.meta = { criadoEm: agora(), versao: 1 };
      if (!opcoes || opcoes.seed !== false) seedDemo();
      gravar();
    }
    iniciarRealtime();
  }

  /* ---------- Histórico ----------------------------------------------------- */

  function registrarMovimentacao(mov) {
    var registro = Object.assign({
      id: uid(),
      registradoEm: agora(),
      usuario: (CELAB.auth && CELAB.auth.usuarioAtual() && CELAB.auth.usuarioAtual().usuario) || 'sistema'
    }, mov);
    estado.movimentacoes.unshift(registro);
    return registro;
  }

  /* ---------- Equipamentos (estoque) --------------------------------------- */

  function listarEquipamentos() { return estado.equipamentos.slice(); }

  function acharPorTombo(reg) {
    var chave = chaveTombo(reg);
    if (!chave) return null;
    return estado.equipamentos.find(function (e) { return chaveTombo(e) === chave; }) || null;
  }

  function acharPorId(id) {
    return estado.equipamentos.find(function (e) { return e.id === id; }) || null;
  }

  /**
   * Cria um equipamento direto no estoque (aba Estoque Laboratório).
   */
  function criarEquipamento(dados, opcoes) {
    opcoes = opcoes || {};
    var duplicado = acharPorTombo(dados);
    if (duplicado) {
      return { ok: false, erro: 'Já existe um equipamento com o tombo ' + (dados.tomboNovo || dados.tomboAntigo) + '.', equipamento: duplicado };
    }

    var eq = {
      id: uid(),
      equipamento: norm(dados.equipamento),
      modelo: norm(dados.modelo),
      tomboNovo: norm(dados.tomboNovo),
      tomboAntigo: norm(dados.tomboAntigo),
      status: dados.status || 'Estoque',
      chamado: norm(dados.chamado),
      servicoSolicitado: norm(dados.servicoSolicitado),
      ttr: dados.ttr || 'Pendente',
      dataEntrada: dados.dataEntrada || hoje(),
      predioOrigem: norm(dados.predioOrigem),
      setorOrigem: norm(dados.setorOrigem),
      dataSaida: '',
      predioDestino: '',
      setorDestino: '',
      criadoEm: agora(),
      atualizadoEm: agora()
    };

    estado.equipamentos.push(eq);
    registrarMovimentacao({
      tipo: 'CADASTRO',
      data: eq.dataEntrada,
      equipamentoId: eq.id,
      equipamento: eq.equipamento,
      modelo: eq.modelo,
      tomboNovo: eq.tomboNovo,
      tomboAntigo: eq.tomboAntigo,
      chamado: eq.chamado,
      servicoSolicitado: eq.servicoSolicitado,
      statusResultante: eq.status,
      predio: eq.predioOrigem,
      setor: eq.setorOrigem,
      ttr: eq.ttr,
      observacao: 'Cadastro direto no estoque do laboratório.'
    });

    if (!opcoes.silencioso) emit({ tipo: 'equipamento:criado', id: eq.id });
    return { ok: true, equipamento: eq };
  }

  /**
   * Atualiza um equipamento existente e registra a alteração no histórico.
   */
  function atualizarEquipamento(id, mudancas, opcoes) {
    opcoes = opcoes || {};
    var eq = acharPorId(id);
    if (!eq) return { ok: false, erro: 'Equipamento não encontrado.' };

    // Bloqueia colisão de tombo com outro registro.
    var alvo = { tomboNovo: mudancas.tomboNovo != null ? mudancas.tomboNovo : eq.tomboNovo,
                 tomboAntigo: mudancas.tomboAntigo != null ? mudancas.tomboAntigo : eq.tomboAntigo };
    var chaveAlvo = chaveTombo(alvo);
    var colisao = chaveAlvo && estado.equipamentos.find(function (o) {
      return o.id !== id && chaveTombo(o) === chaveAlvo;
    });
    if (colisao) {
      return { ok: false, erro: 'O tombo informado já pertence a outro equipamento.' };
    }

    var statusAnterior = eq.status;
    Object.keys(mudancas).forEach(function (k) {
      if (mudancas[k] !== undefined) eq[k] = typeof mudancas[k] === 'string' ? norm(mudancas[k]) : mudancas[k];
    });
    eq.atualizadoEm = agora();

    registrarMovimentacao({
      tipo: 'AJUSTE',
      data: hoje(),
      equipamentoId: eq.id,
      equipamento: eq.equipamento,
      modelo: eq.modelo,
      tomboNovo: eq.tomboNovo,
      tomboAntigo: eq.tomboAntigo,
      chamado: eq.chamado,
      servicoSolicitado: eq.servicoSolicitado,
      statusAnterior: statusAnterior,
      statusResultante: eq.status,
      predio: eq.predioOrigem,
      setor: eq.setorOrigem,
      ttr: eq.ttr,
      observacao: statusAnterior !== eq.status
        ? 'Status alterado de "' + statusAnterior + '" para "' + eq.status + '".'
        : 'Dados do equipamento atualizados.'
    });

    if (!opcoes.silencioso) emit({ tipo: 'equipamento:atualizado', id: eq.id });
    return { ok: true, equipamento: eq };
  }

  function excluirEquipamento(id, opcoes) {
    opcoes = opcoes || {};
    var i = estado.equipamentos.findIndex(function (e) { return e.id === id; });
    if (i === -1) return { ok: false, erro: 'Equipamento não encontrado.' };
    var eq = estado.equipamentos[i];
    estado.equipamentos.splice(i, 1);

    registrarMovimentacao({
      tipo: 'EXCLUSAO',
      data: hoje(),
      equipamentoId: eq.id,
      equipamento: eq.equipamento,
      modelo: eq.modelo,
      tomboNovo: eq.tomboNovo,
      tomboAntigo: eq.tomboAntigo,
      chamado: eq.chamado,
      statusAnterior: eq.status,
      statusResultante: '—',
      predio: eq.predioOrigem,
      setor: eq.setorOrigem,
      ttr: eq.ttr,
      observacao: 'Equipamento removido do estoque do laboratório.'
    });

    if (!opcoes.silencioso) emit({ tipo: 'equipamento:excluido', id: id });
    return { ok: true, equipamento: eq };
  }

  /* ---------- Entrada -------------------------------------------------------
     Regra 1.4: salvar uma entrada CRIA ou ATUALIZA o item no estoque.
     A identidade é o tombo — reentrada do mesmo tombo atualiza o registro
     existente em vez de duplicar.
     ---------------------------------------------------------------------- */

  function registrarEntrada(dados, opcoes) {
    opcoes = opcoes || {};
    var existente = acharPorTombo(dados);
    var criado = false;
    var eq;

    if (existente) {
      eq = existente;
      var statusAnterior = eq.status;
      eq.equipamento = norm(dados.equipamento) || eq.equipamento;
      eq.modelo = norm(dados.modelo) || eq.modelo;
      eq.tomboNovo = norm(dados.tomboNovo) || eq.tomboNovo;
      eq.tomboAntigo = norm(dados.tomboAntigo) || eq.tomboAntigo;
      eq.status = dados.status || 'Estoque';
      eq.chamado = norm(dados.chamado);
      eq.servicoSolicitado = norm(dados.servicoSolicitado);
      eq.ttr = dados.ttr || 'Pendente';
      eq.dataEntrada = dados.dataEntrada || hoje();
      eq.predioOrigem = norm(dados.predioOrigem);
      eq.setorOrigem = norm(dados.setorOrigem);
      // Voltou ao laboratório: os dados de saída anterior deixam de valer.
      eq.dataSaida = '';
      eq.predioDestino = '';
      eq.setorDestino = '';
      eq.atualizadoEm = agora();
      eq._statusAnterior = statusAnterior;
    } else {
      criado = true;
      eq = {
        id: uid(),
        equipamento: norm(dados.equipamento),
        modelo: norm(dados.modelo),
        tomboNovo: norm(dados.tomboNovo),
        tomboAntigo: norm(dados.tomboAntigo),
        status: dados.status || 'Estoque',
        chamado: norm(dados.chamado),
        servicoSolicitado: norm(dados.servicoSolicitado),
        ttr: dados.ttr || 'Pendente',
        dataEntrada: dados.dataEntrada || hoje(),
        predioOrigem: norm(dados.predioOrigem),
        setorOrigem: norm(dados.setorOrigem),
        dataSaida: '',
        predioDestino: '',
        setorDestino: '',
        criadoEm: agora(),
        atualizadoEm: agora()
      };
      estado.equipamentos.push(eq);
    }

    var mov = registrarMovimentacao({
      tipo: 'ENTRADA',
      data: eq.dataEntrada,
      equipamentoId: eq.id,
      equipamento: eq.equipamento,
      modelo: eq.modelo,
      tomboNovo: eq.tomboNovo,
      tomboAntigo: eq.tomboAntigo,
      chamado: eq.chamado,
      servicoSolicitado: eq.servicoSolicitado,
      statusAnterior: criado ? '' : eq._statusAnterior,
      statusResultante: eq.status,
      predio: eq.predioOrigem,
      setor: eq.setorOrigem,
      ttr: eq.ttr,
      observacao: criado
        ? 'Entrada de equipamento novo no laboratório.'
        : 'Reentrada — registro de estoque atualizado.'
    });
    delete eq._statusAnterior;

    if (opcoes.usuario) mov.usuario = opcoes.usuario;
    if (!opcoes.silencioso) emit({ tipo: 'entrada', id: eq.id, movimentacaoId: mov.id });
    return { ok: true, equipamento: eq, criado: criado, movimentacao: mov };
  }

  /* ---------- Saída ---------------------------------------------------------
     Regra 1.5: salvar uma saída tira o item do estoque físico. O registro não
     é apagado — vira status "Disponibilizado" com destino preenchido, para
     que o histórico e a rastreabilidade patrimonial permaneçam íntegros.
     ---------------------------------------------------------------------- */

  function registrarSaida(dados, opcoes) {
    opcoes = opcoes || {};
    var eq = acharPorTombo(dados);

    if (!eq) {
      return {
        ok: false,
        erro: 'Nenhum equipamento com esse tombo está cadastrado no laboratório. Registre a entrada antes da saída.'
      };
    }
    if (eq.status === 'Disponibilizado') {
      return {
        ok: false,
        erro: 'Este equipamento já consta como disponibilizado em ' +
          (eq.dataSaida ? CELAB.util.dataBR(eq.dataSaida) : 'data anterior') +
          ' para ' + (eq.predioDestino || 'destino não informado') + '.'
      };
    }

    var statusAnterior = eq.status;
    eq.equipamento = norm(dados.equipamento) || eq.equipamento;
    eq.modelo = norm(dados.modelo) || eq.modelo;
    eq.status = 'Disponibilizado';
    eq.dataSaida = dados.dataSaida || hoje();
    eq.chamado = norm(dados.chamado) || eq.chamado;
    eq.servicoSolicitado = norm(dados.servicoSolicitado) || eq.servicoSolicitado;
    eq.predioDestino = norm(dados.predioDestino);
    eq.setorDestino = norm(dados.setorDestino);
    eq.ttr = dados.ttr || eq.ttr;
    eq.atualizadoEm = agora();

    var mov = registrarMovimentacao({
      tipo: 'SAIDA',
      data: eq.dataSaida,
      equipamentoId: eq.id,
      equipamento: eq.equipamento,
      modelo: eq.modelo,
      tomboNovo: eq.tomboNovo,
      tomboAntigo: eq.tomboAntigo,
      chamado: eq.chamado,
      servicoSolicitado: eq.servicoSolicitado,
      statusAnterior: statusAnterior,
      statusResultante: 'Disponibilizado',
      predio: eq.predioDestino,
      setor: eq.setorDestino,
      ttr: eq.ttr,
      observacao: 'Saída do laboratório para ' + (eq.predioDestino || 'destino não informado') + '.'
    });

    if (opcoes.usuario) mov.usuario = opcoes.usuario;
    if (!opcoes.silencioso) emit({ tipo: 'saida', id: eq.id, movimentacaoId: mov.id });
    return { ok: true, equipamento: eq, movimentacao: mov };
  }

  /* ---------- Consultas derivadas (alimentam a Dashboard) ------------------ */

  /** Itens fisicamente no laboratório. */
  function estoqueLaboratorio() {
    return estado.equipamentos.filter(function (e) {
      return CELAB.STATUS_NO_LAB.indexOf(e.status) > -1;
    });
  }

  function resumo() {
    var todos = estado.equipamentos;
    var noLab = estoqueLaboratorio();
    var contagem = {};
    CELAB.STATUS_TODOS.forEach(function (s) { contagem[s] = 0; });
    todos.forEach(function (e) {
      if (contagem[e.status] === undefined) contagem[e.status] = 0;
      contagem[e.status]++;
    });

    var porTipo = {};
    noLab.forEach(function (e) {
      var k = e.equipamento || 'Não informado';
      porTipo[k] = (porTipo[k] || 0) + 1;
    });

    var porModelo = {};
    noLab.forEach(function (e) {
      var k = e.modelo || 'Não informado';
      porModelo[k] = (porModelo[k] || 0) + 1;
    });

    var porPredio = {};
    noLab.forEach(function (e) {
      var k = e.predioOrigem || 'Não informado';
      porPredio[k] = (porPredio[k] || 0) + 1;
    });

    var ttrPendente = noLab.filter(function (e) { return e.ttr === 'Pendente'; }).length;

    return {
      totalCadastrado: todos.length,
      totalNoLab: noLab.length,
      porStatus: contagem,
      porTipo: porTipo,
      porModelo: porModelo,
      porPredio: porPredio,
      ttrPendente: ttrPendente
    };
  }

  /** Entradas x saídas por dia, para a série temporal da dashboard. */
  function serieMovimentacoes(dias) {
    dias = dias || 30;
    var hojeD = new Date();
    hojeD.setHours(0, 0, 0, 0);
    var labels = [];
    var mapa = {};
    for (var i = dias - 1; i >= 0; i--) {
      var d = new Date(hojeD.getTime() - i * 86400000);
      var iso = d.toISOString().slice(0, 10);
      labels.push(iso);
      mapa[iso] = { entradas: 0, saidas: 0 };
    }
    estado.movimentacoes.forEach(function (m) {
      var chave = (m.data || '').slice(0, 10);
      if (!mapa[chave]) return;
      if (m.tipo === 'ENTRADA') mapa[chave].entradas++;
      else if (m.tipo === 'SAIDA') mapa[chave].saidas++;
    });
    return {
      labels: labels,
      entradas: labels.map(function (l) { return mapa[l].entradas; }),
      saidas: labels.map(function (l) { return mapa[l].saidas; })
    };
  }

  function listarMovimentacoes() { return estado.movimentacoes.slice(); }

  /* ---------- Manutenção de dados ------------------------------------------ */

  function exportarJSON() {
    return JSON.stringify({
      app: CELAB.APP.nome,
      versao: CELAB.APP.versao,
      exportadoEm: agora(),
      equipamentos: estado.equipamentos,
      movimentacoes: estado.movimentacoes
    }, null, 2);
  }

  function importarJSON(texto) {
    var dados;
    try { dados = JSON.parse(texto); } catch (e) { return { ok: false, erro: 'Arquivo JSON inválido.' }; }
    if (!dados || !Array.isArray(dados.equipamentos)) {
      return { ok: false, erro: 'O arquivo não contém uma lista de equipamentos.' };
    }
    estado.equipamentos = dados.equipamentos;
    estado.movimentacoes = Array.isArray(dados.movimentacoes) ? dados.movimentacoes : [];
    emit({ tipo: 'import' });
    return { ok: true, total: estado.equipamentos.length };
  }

  function limparTudo() {
    estado.equipamentos = [];
    estado.movimentacoes = [];
    emit({ tipo: 'reset' });
  }

  /* ---------- API pública --------------------------------------------------- */

  CELAB.store = {
    inicializar: inicializar,
    assinar: assinar,
    estado: estado,

    listarEquipamentos: listarEquipamentos,
    estoqueLaboratorio: estoqueLaboratorio,
    acharPorId: acharPorId,
    acharPorTombo: acharPorTombo,
    criarEquipamento: criarEquipamento,
    atualizarEquipamento: atualizarEquipamento,
    excluirEquipamento: excluirEquipamento,

    registrarEntrada: registrarEntrada,
    registrarSaida: registrarSaida,

    listarMovimentacoes: listarMovimentacoes,
    resumo: resumo,
    serieMovimentacoes: serieMovimentacoes,

    exportarJSON: exportarJSON,
    importarJSON: importarJSON,
    limparTudo: limparTudo,

    _uid: uid,
    _agora: agora,
    _hoje: hoje
  };

  /* ---------- Autenticação --------------------------------------------------
     Sessão local, adequada a um app de uma máquina. Ao migrar para Supabase,
     troque este objeto por supabase.auth mantendo a mesma interface.
     ---------------------------------------------------------------------- */

  var sessao = null;

  function carregarSessao() {
    try {
      var bruto = window.sessionStorage.getItem(CELAB.APP.sessionKey) ||
                  window.localStorage.getItem(CELAB.APP.sessionKey);
      sessao = bruto ? JSON.parse(bruto) : null;
    } catch (e) { sessao = null; }
    return sessao;
  }

  CELAB.auth = {
    entrar: function (usuario, senha, lembrar) {
      var u = estado.usuarios.find(function (x) {
        return x.usuario.toLowerCase() === norm(usuario).toLowerCase() && x.senha === senha;
      });
      if (!u) return { ok: false, erro: 'Usuário ou senha inválidos.' };
      sessao = { id: u.id, usuario: u.usuario, nome: u.nome, perfil: u.perfil, entrouEm: agora() };
      var payload = JSON.stringify(sessao);
      try {
        if (lembrar) window.localStorage.setItem(CELAB.APP.sessionKey, payload);
        else window.sessionStorage.setItem(CELAB.APP.sessionKey, payload);
      } catch (e) { /* sessão só em memória */ }
      return { ok: true, usuario: sessao };
    },
    sair: function () {
      sessao = null;
      try {
        window.sessionStorage.removeItem(CELAB.APP.sessionKey);
        window.localStorage.removeItem(CELAB.APP.sessionKey);
      } catch (e) { /* ignora */ }
    },
    usuarioAtual: function () { return sessao || carregarSessao(); },
    autenticado: function () { return !!(sessao || carregarSessao()); },
    permissao: function (chave) {
      var u = CELAB.auth.usuarioAtual();
      if (!u) return false;
      var p = CELAB.PERFIS[u.perfil] || CELAB.PERFIS.leitura;
      return !!p[chave];
    }
  };

})(window.CELAB);
