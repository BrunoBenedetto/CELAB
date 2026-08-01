/* ==========================================================================
   CELAB — Configuração e listas estáticas
   Namespace global: window.CELAB
   ========================================================================== */

window.CELAB = window.CELAB || {};

(function (CELAB) {
  'use strict';

  CELAB.APP = {
    nome: 'CELAB',
    descricao: 'Controle de Estoque de Laboratório',
    versao: '1.0.0',
    storageKey: 'celab.db.v1',
    sessionKey: 'celab.session.v1',
    themeKey: 'celab.theme',
    channel: 'celab-realtime'
  };

  /* ---------- Equipamentos (categorias) ---------------------------------- */

  CELAB.EQUIPAMENTOS = [
    'Computador',
    'Eq. Video Conf.',
    'Headset',
    'Impressora',
    'Monitor',
    'Nobreak',
    'Baterias Nobreak',
    'Notebook',
    'Webcam',
    'HDMI',
    'Scanner',
    'Tela de projeção',
    'Projetor Multimidia',
    'Microfone de Expansão'
  ];

  /* ---------- Modelos ----------------------------------------------------- */

  CELAB.MODELOS = [
    'Ragtech Easy Way 1200',
    'Lenovo ThinkCentre M75q',
    'Positivo Minipro 810',
    'Positivo Master 820',
    'Avision AD345G',
    'HP Pro M404DW',
    'HP Pro 4003DW',
    'OKI 5112',
    'HP P22A G4',
    'Positivo 23MB35PH',
    'Positivo 22MP55PY',
    'LG E2241VP',
    'GoPresence Teams 10x',
    'Logitech',
    'Logitech C925e',
    'Agem',
    'HDMI - 5M',
    'HDMI - 10M',
    'HDMI - 15M',
    'HDMI - 20M',
    'HDMI - 25M',
    'HDMI - 30M',
    'DG-100',
    'EPSON POWERLITE X29',
    'Samsung Galaxy Tab A7',
    'Logitech V-U0037',
    'Positivo N6440',
    'Positivo Master MiniPro C8400',
    'Positivo 24BL550J',
    'NARDELLI',
    'Daten 20m35pd-m',
    'Dell p2014ht',
    'Itautec w1942pe',
    'LG 24BL550J-B',
    'LG 22MP55PY',
    'LG E2241PX',
    'HP Le2001w',
    'EPSON GT-S50',
    'Kodak ScanMate i1150',
    'Samsung ProXpress SL-M4070FR',
    'Filtro de Linha 8T Intelbras',
    'Filtro de Linha 5T Intelbras',
    'AOC e2023pwd',
    'Positivo E2241PX',
    'Canon DR-C130'
  ];

  /* ---------- Modelos por equipamento -------------------------------------
     Alimenta o select de Modelo filtrado pela categoria escolhida.
     Todo modelo não mapeado continua acessível no grupo "Outros modelos",
     então nenhum item fica inalcançável se a classificação divergir.
     Ajuste livremente este mapa conforme o inventário real do laboratório.
     ---------------------------------------------------------------------- */

  CELAB.MODELOS_POR_EQUIPAMENTO = {
    'Computador': [
      'Lenovo ThinkCentre M75q',
      'Positivo Minipro 810',
      'Positivo Master 820',
      'Positivo Master MiniPro C8400'
    ],
    'Eq. Video Conf.': [
      'GoPresence Teams 10x'
    ],
    'Headset': [
      'Logitech',
      'Agem'
    ],
    'Impressora': [
      'HP Pro M404DW',
      'HP Pro 4003DW',
      'OKI 5112',
      'Samsung ProXpress SL-M4070FR'
    ],
    'Monitor': [
      'HP P22A G4',
      'Positivo 23MB35PH',
      'Positivo 22MP55PY',
      'Positivo 24BL550J',
      'Positivo E2241PX',
      'LG E2241VP',
      'LG E2241PX',
      'LG 24BL550J-B',
      'LG 22MP55PY',
      'HP Le2001w',
      'Daten 20m35pd-m',
      'Dell p2014ht',
      'Itautec w1942pe',
      'AOC e2023pwd'
    ],
    'Nobreak': [
      'Ragtech Easy Way 1200',
      'Filtro de Linha 8T Intelbras',
      'Filtro de Linha 5T Intelbras'
    ],
    'Baterias Nobreak': [
      'Ragtech Easy Way 1200'
    ],
    'Notebook': [
      'Positivo N6440',
      'Samsung Galaxy Tab A7'
    ],
    'Webcam': [
      'Logitech C925e',
      'Logitech V-U0037'
    ],
    'HDMI': [
      'HDMI - 5M',
      'HDMI - 10M',
      'HDMI - 15M',
      'HDMI - 20M',
      'HDMI - 25M',
      'HDMI - 30M'
    ],
    'Scanner': [
      'Avision AD345G',
      'EPSON GT-S50',
      'Kodak ScanMate i1150',
      'Canon DR-C130'
    ],
    'Tela de projeção': [
      'NARDELLI'
    ],
    'Projetor Multimidia': [
      'EPSON POWERLITE X29'
    ],
    'Microfone de Expansão': [
      'DG-100'
    ]
  };

  /* ---------- Prédios ------------------------------------------------------ */

  CELAB.PREDIOS = [
    'Sede Administrativa',
    'Forum Civel',
    'Palácio',
    'Forum Criminal',
    'Conj. Desembargadores',
    'CA - Comarca de Alto Alegre',
    'CB - Comarca de Bonfim',
    'CC - Comarca de Caracarai',
    'CP - Comarca de Pacaraima',
    'CM - Comarca de Mucajai',
    'CS - Comarca de Sao Luiz do Anaua',
    'CRO - Comarca de Rorainopolis',
    'Vara Infancia e Juventude',
    'Casa da Mulher Brasileira',
    'PA - Amajari',
    'PA - Iracema',
    'PA - Normandia',
    'PA - Triagem PETRIG',
    'PA - Uiramutã',
    'PA - Wamiri',
    'NCTC - Nucleo de Conciliacao do Terminal do Centro',
    'PAMC',
    'NUPAC',
    'VISITA TÉCNICA COMARCA',
    'TC - Terminal Caimbe',
    'CPM - Cadeia Publica Masculina',
    'AG - Arquivo Geral',
    'CA - Casa Alferes',
    'CPF - Cadeia Publica Feminina',
    'CSE',
    'Fórum da Cidadania',
    'PAC - Posto Avancado de Caroebe'
  ];

  /* ---------- Status -------------------------------------------------------
     `noLab: true`  => o item está fisicamente no laboratório e conta no estoque.
     `noLab: false` => o item saiu (expedido) e não compõe o estoque físico.
     `chip` casa com as classes .chip--* do CSS.
     `tone` casa com os tokens de status da paleta de dados.
     ---------------------------------------------------------------------- */

  CELAB.STATUS = [
    { valor: 'Estoque',         chip: 'estoque',         tone: 'good',     noLab: true,  desc: 'Disponível para uso' },
    { valor: 'Manutenção',      chip: 'manutencao',      tone: 'warning',  noLab: true,  desc: 'Em reparo no laboratório' },
    { valor: 'Defeito',         chip: 'defeito',         tone: 'critical', noLab: true,  desc: 'Com defeito, aguardando destino' },
    { valor: 'Leilão',          chip: 'leilao',          tone: 'serious',  noLab: true,  desc: 'Baixado para leilão' },
    { valor: 'Disponibilizado', chip: 'disponibilizado', tone: 'neutral',  noLab: false, desc: 'Expedido para a unidade destino' }
  ];

  /** Status oferecidos no formulário de Entrada (requisito 1.4). */
  CELAB.STATUS_ENTRADA = ['Estoque', 'Manutenção', 'Defeito', 'Leilão'];

  /** Status oferecidos no cadastro/edição do Estoque (requisito 1.3). */
  CELAB.STATUS_ESTOQUE = ['Defeito', 'Leilão', 'Estoque', 'Disponibilizado'];

  /** Todos os status, para os filtros. */
  CELAB.STATUS_TODOS = CELAB.STATUS.map(function (s) { return s.valor; });

  /** Status que mantêm o item fisicamente no laboratório. */
  CELAB.STATUS_NO_LAB = CELAB.STATUS
    .filter(function (s) { return s.noLab; })
    .map(function (s) { return s.valor; });

  CELAB.TTR = ['Realizado', 'Pendente'];

  CELAB.TIPOS_MOV = [
    { valor: 'ENTRADA',  rotulo: 'Entrada',   chip: 'entrada' },
    { valor: 'SAIDA',    rotulo: 'Saída',     chip: 'saida' },
    { valor: 'CADASTRO', rotulo: 'Cadastro',  chip: 'ajuste' },
    { valor: 'AJUSTE',   rotulo: 'Alteração', chip: 'ajuste' },
    { valor: 'EXCLUSAO', rotulo: 'Exclusão',  chip: 'ajuste' }
  ];

  /* ---------- Consultas auxiliares ---------------------------------------- */

  CELAB.statusMeta = function (valor) {
    return CELAB.STATUS.find(function (s) { return s.valor === valor; }) ||
      { valor: valor || '—', chip: 'ajuste', tone: 'neutral', noLab: false, desc: '' };
  };

  CELAB.tipoMovMeta = function (valor) {
    return CELAB.TIPOS_MOV.find(function (t) { return t.valor === valor; }) ||
      { valor: valor, rotulo: valor, chip: 'ajuste' };
  };

  /** Modelos sugeridos para uma categoria + o restante em "Outros modelos". */
  CELAB.modelosDe = function (equipamento) {
    var sugeridos = CELAB.MODELOS_POR_EQUIPAMENTO[equipamento] || [];
    var resto = CELAB.MODELOS.filter(function (m) { return sugeridos.indexOf(m) === -1; });
    return { sugeridos: sugeridos, outros: resto };
  };

  /* ---------- Perfis de acesso -------------------------------------------- */

  CELAB.PERFIS = {
    admin:   { rotulo: 'Administrador', podeExcluir: true,  podeEditar: true },
    tecnico: { rotulo: 'Técnico',       podeExcluir: false, podeEditar: true },
    leitura: { rotulo: 'Consulta',      podeExcluir: false, podeEditar: false }
  };

})(window.CELAB);
