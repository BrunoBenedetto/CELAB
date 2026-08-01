/* ==========================================================================
   CELAB — Tela de Login
   ========================================================================== */

(function (CELAB) {
  'use strict';

  var UI = CELAB.ui;

  function montar(raiz, aoEntrar) {
    raiz.className = 'login-screen';
    raiz.innerHTML =
      '<main class="login-card">' +

        // --- Espaço reservado para a logo do sistema -----------------------
        // Para usar a logo definitiva, troque o conteúdo de .logo-slot__box
        // por: <img src="assets/logo.png" alt="Logo CELAB">
        '<div class="logo-slot">' +
          '<div class="logo-slot__box" id="logo-slot">CELAB</div>' +
          '<div class="logo-slot__caption">Espaço reservado para a logo do sistema</div>' +
        '</div>' +

        '<h1 class="login-title">Controle de Estoque de Laboratório</h1>' +
        '<p class="login-sub">Informe suas credenciais para acessar o sistema</p>' +

        '<form id="form-login" novalidate autocomplete="on">' +
          '<div style="display:grid;gap:16px">' +

            '<div class="field">' +
              '<label for="login-usuario">Usuário</label>' +
              '<input class="input" type="text" id="login-usuario" name="usuario" ' +
                'autocomplete="username" placeholder="seu.usuario" data-obrigatorio required>' +
              '<span class="field__error">Informe o usuário.</span>' +
            '</div>' +

            '<div class="field">' +
              '<label for="login-senha">Senha</label>' +
              '<div style="position:relative">' +
                '<input class="input" type="password" id="login-senha" name="senha" ' +
                  'autocomplete="current-password" placeholder="••••••••" ' +
                  'style="padding-right:40px" data-obrigatorio required>' +
                '<button type="button" id="ver-senha" aria-label="Mostrar senha" ' +
                  'style="position:absolute;right:6px;top:50%;transform:translateY(-50%);' +
                  'border:0;background:transparent;color:var(--text-muted);padding:5px;' +
                  'display:grid;place-items:center;border-radius:6px">' +
                  UI.icone('olho', 17) +
                '</button>' +
              '</div>' +
              '<span class="field__error">Informe a senha.</span>' +
            '</div>' +

            '<label style="display:flex;align-items:center;gap:8px;font-size:12.5px;' +
              'color:var(--text-secondary);cursor:pointer">' +
              '<input type="checkbox" id="lembrar" name="lembrar" style="width:15px;height:15px;accent-color:var(--brand)">' +
              'Manter conectado neste computador' +
            '</label>' +

            '<div id="login-erro" class="alert hidden" style="margin:0" role="alert">' +
              UI.icone('alerta', 17) + '<span></span>' +
            '</div>' +

            '<button type="submit" class="btn btn--primary btn--lg" id="btn-entrar">' +
              UI.icone('cadeado', 16) + '<span>Entrar</span>' +
            '</button>' +

          '</div>' +
        '</form>' +

        '<div class="login-hint">' +
          'Acesso de demonstração: <code>admin</code> / <code>admin123</code>' +
          '<br>Perfil técnico: <code>tecnico</code> / <code>tecnico123</code>' +
        '</div>' +

      '</main>';

    var form = raiz.querySelector('#form-login');
    var erro = raiz.querySelector('#login-erro');
    var campoSenha = raiz.querySelector('#login-senha');

    raiz.querySelector('#ver-senha').addEventListener('click', function () {
      var mostrando = campoSenha.type === 'text';
      campoSenha.type = mostrando ? 'password' : 'text';
      this.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Ocultar senha');
      campoSenha.focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      erro.classList.add('hidden');

      if (!UI.validarForm(form)) return;

      var dados = UI.dadosForm(form);
      var r = CELAB.auth.entrar(dados.usuario, dados.senha, !!dados.lembrar);

      if (!r.ok) {
        erro.querySelector('span').textContent = r.erro;
        erro.classList.remove('hidden');
        campoSenha.value = '';
        campoSenha.focus();
        return;
      }
      aoEntrar(r.usuario);
    });

    setTimeout(function () { raiz.querySelector('#login-usuario').focus(); }, 60);
  }

  CELAB.pages = CELAB.pages || {};
  CELAB.pages.login = { montar: montar };

})(window.CELAB);
