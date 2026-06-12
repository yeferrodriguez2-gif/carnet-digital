/*
  UWallet - Logica principal
  Arquitectura:
  1. Configuracion y utilidades
  2. Estado visual compartido
  3. Modulos de interfaz
  4. Inicializacion
*/

(() => {
  "use strict";

  /* 1. Configuracion y utilidades */
  const APP = {
    storage: {
      sesion: "uwallet_sesion",
      tema: "uwallet_tema"
    },
    credenciales: {
      usuario: "20251105",
      password: "Darwin2025*"
    },
    tiempos: {
      loader: 3200,
      salidaLogin: 650,
      avance: 80
    },
    media: {
      panelesMoviles: "(max-width: 480px)"
    }
  };

  const SELECTORES = {
    modal: ".modal",
    cerrarModal: "[data-cerrar-modal]",
    abrirModal: "[data-modal]",
    voltearCarnet: "[data-voltear-carnet]",
    nota: ".nota",
    panelMovil: "[data-panel-mobile]",
    panelToggle: "[data-panel-toggle]",
    panelContenido: "[data-panel-content]",
    focoModal: "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  };

  const $ = (selector, contexto = document) => contexto.querySelector(selector);
  const $$ = (selector, contexto = document) => Array.from(contexto.querySelectorAll(selector));

  const dom = {
    loader: $("#loader"),
    login: $("#login"),
    formLogin: $("#formLogin"),
    usuarioLogin: $("#usuarioLogin"),
    passwordLogin: $("#passwordLogin"),
    mensajeLogin: $("#mensajeLogin"),
    togglePassword: $("#togglePassword"),
    carnetInner: $("#carnetInner"),
    codigoBarras: $("#codigoBarras"),
    overlay: $("#overlay"),
    modales: $$(SELECTORES.modal),
    confirmarLogout: $("#confirmarLogout"),
    formSoporte: $("#formSoporte"),
    soporteExito: $("#soporteExito"),
    btnNotificaciones: $("#btnNotificaciones"),
    notifDropdown: $("#notifDropdown"),
    marcarLeidas: $("#marcarLeidas"),
    badgeNotificaciones: $("#badgeNotificaciones"),
    toggleTema: $("#toggleTema"),
    drawer: $("#drawer"),
    drawerOverlay: $("#drawerOverlay"),
    abrirDrawer: $("#abrirDrawer"),
    cerrarDrawerBoton: $("#cerrarDrawer"),
    panelesMoviles: $$(SELECTORES.panelMovil)
  };

  const mediaPaneles = window.matchMedia(APP.media.panelesMoviles);
  let ultimoFoco = null;

  function leerStorage(tipo, clave) {
    try {
      return tipo.getItem(clave);
    } catch (error) {
      return null;
    }
  }

  function guardarStorage(tipo, clave, valor) {
    try {
      tipo.setItem(clave, valor);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removerStorage(tipo, clave) {
    try {
      tipo.removeItem(clave);
      return true;
    } catch (error) {
      return false;
    }
  }

  function setIcon(elemento, claseIcono) {
    if (!elemento) return;
    const icono = elemento.querySelector("i") || document.createElement("i");
    icono.className = claseIcono;
    icono.setAttribute("aria-hidden", "true");
    elemento.replaceChildren(icono);
  }

  function setExpanded(elemento, expandido) {
    elemento?.setAttribute("aria-expanded", String(expandido));
  }

  function obtenerPrimerFoco(contenedor) {
    return $$(SELECTORES.focoModal, contenedor).find((elemento) => !elemento.disabled && elemento.offsetParent !== null);
  }

  /* 2. Estado visual compartido */
  function cerrarDropdownNotificaciones() {
    dom.notifDropdown?.classList.remove("notif-dropdown--activo");
    setExpanded(dom.btnNotificaciones, false);
  }

  function cerrarDrawer() {
    dom.drawer?.classList.remove("drawer--activo");
    dom.drawerOverlay?.classList.remove("drawer-overlay--activo");
    setExpanded(dom.abrirDrawer, false);
  }

  function cerrarModal() {
    dom.overlay?.classList.remove("overlay--activo");
    dom.modales.forEach((modal) => {
      modal.classList.remove("modal--activo");
      modal.setAttribute("aria-hidden", "true");
    });

    if (ultimoFoco instanceof HTMLElement) {
      ultimoFoco.focus();
    }
  }

  function prepararModales() {
    dom.modales.forEach((modal) => {
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-hidden", "true");
      modal.setAttribute("tabindex", "-1");
    });
  }

  function reiniciarFormularioSoporte() {
    if (!dom.formSoporte || !dom.soporteExito) return;
    dom.formSoporte.style.display = "";
    dom.formSoporte.reset();
    dom.soporteExito.classList.remove("soporte-exito--visible");
    $$("input, select, textarea", dom.formSoporte).forEach((campo) => campo.classList.remove("campo-error"));
  }

  function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (!modal) return;

    ultimoFoco = document.activeElement;
    cerrarDropdownNotificaciones();
    cerrarDrawer();
    cerrarModal();

    if (idModal === "modal-soporte") {
      reiniciarFormularioSoporte();
    }

    dom.overlay?.classList.add("overlay--activo");
    modal.classList.add("modal--activo");
    modal.setAttribute("aria-hidden", "false");

    if (idModal === "modal-historial") {
      animarAvance();
    }

    (obtenerPrimerFoco(modal) || modal).focus();
  }

  /* 3. Modulos de interfaz */
  function inicializarEntrada() {
    const sesionActiva = leerStorage(sessionStorage, APP.storage.sesion) === "activa";

    if (sesionActiva) {
      dom.loader?.classList.add("loader--oculto");
      dom.login?.classList.remove("login--activo");
      document.body.classList.add("portal-activo");
      return;
    }

    window.setTimeout(() => {
      dom.loader?.classList.add("loader--oculto");
      dom.login?.classList.add("login--activo");
    }, APP.tiempos.loader);
  }

  function ocultarLogin() {
    if (!dom.login) return;

    dom.login.classList.add("login--oculto");
    document.body.classList.add("portal-activo");

    window.setTimeout(() => {
      dom.login.classList.remove("login--activo");
    }, APP.tiempos.salidaLogin);
  }

  function validarLogin(evento) {
    evento.preventDefault();

    const usuarioCorrecto = dom.usuarioLogin?.value.trim() === APP.credenciales.usuario;
    const passwordCorrecto = dom.passwordLogin?.value === APP.credenciales.password;

    if (!usuarioCorrecto || !passwordCorrecto) {
      dom.mensajeLogin?.classList.remove("login__error--visible");
      void dom.mensajeLogin?.offsetWidth;
      dom.mensajeLogin?.classList.add("login__error--visible");
      dom.passwordLogin?.focus();
      return;
    }

    guardarStorage(sessionStorage, APP.storage.sesion, "activa");
    ocultarLogin();
  }

  function alternarPassword() {
    if (!dom.passwordLogin || !dom.togglePassword) return;

    const mostrar = dom.passwordLogin.type === "password";
    dom.passwordLogin.type = mostrar ? "text" : "password";
    dom.togglePassword.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
    setIcon(dom.togglePassword, mostrar ? "fa-solid fa-eye-slash" : "fa-solid fa-eye");
  }

  function alternarCarnet(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    dom.carnetInner?.classList.remove("volteado");
    dom.carnetInner?.classList.toggle("is-flipped");
  }

  function generarCodigoBarras() {
    if (!dom.codigoBarras) return;

    dom.codigoBarras.replaceChildren();

    for (let i = 0; i < 30; i += 1) {
      const barra = document.createElement("span");
      barra.style.width = `${2 + (i % 3)}px`;
      barra.style.height = `${34 + (i % 5) * 4}px`;
      dom.codigoBarras.appendChild(barra);
    }
  }

  function manejarClicModal(evento) {
    const disparador = evento.target.closest(SELECTORES.abrirModal);
    if (!disparador) return;

    evento.preventDefault();
    abrirModal(disparador.dataset.modal);
  }

  function conectarModal(selector, idModal) {
    $$(selector).forEach((elemento) => {
      elemento.addEventListener("click", (evento) => {
        evento.preventDefault();
        abrirModal(idModal);
      });
    });
  }

  function colorearNotas() {
    $$(SELECTORES.nota).forEach((celda) => {
      const valor = Number.parseFloat(celda.textContent);
      if (Number.isNaN(valor)) return;

      celda.classList.toggle("nota--alta", valor >= 4);
      celda.classList.toggle("nota--media", valor >= 3 && valor < 4);
      celda.classList.toggle("nota--baja", valor < 3);
    });
  }

  function animarAvance() {
    const barraAvance = $("#barraAvance");
    if (!barraAvance) return;

    barraAvance.style.width = "0%";
    window.setTimeout(() => {
      barraAvance.style.width = "32.9%";
    }, APP.tiempos.avance);
  }

  function cerrarSesion() {
    removerStorage(sessionStorage, APP.storage.sesion);
    window.location.reload();
  }

  function manejarSoporte(evento) {
    evento.preventDefault();
    if (!dom.formSoporte || !dom.soporteExito) return;

    const campos = $$("input, select, textarea", dom.formSoporte);
    const formularioValido = campos.every((campo) => {
      const valido = campo.value.trim().length > 0;
      campo.classList.toggle("campo-error", !valido);
      return valido;
    });

    if (!formularioValido) return;

    dom.formSoporte.style.display = "none";
    dom.soporteExito.classList.add("soporte-exito--visible");
  }

  function alternarDropdownNotificaciones(evento) {
    evento.stopPropagation();
    const activo = !dom.notifDropdown?.classList.contains("notif-dropdown--activo");
    dom.notifDropdown?.classList.toggle("notif-dropdown--activo", activo);
    setExpanded(dom.btnNotificaciones, activo);
  }

  function marcarNotificacionesLeidas() {
    $$(".notif-item").forEach((item) => item.classList.add("notif-item--leida"));
    dom.badgeNotificaciones?.classList.add("notif-badge--oculto");
  }

  function aplicarTemaOscuro(activar) {
    document.body.classList.toggle("modo-oscuro", activar);
    setIcon(dom.toggleTema, activar ? "fa-solid fa-sun" : "fa-solid fa-moon");
  }

  function alternarTema() {
    const activar = !document.body.classList.contains("modo-oscuro");
    aplicarTemaOscuro(activar);
    guardarStorage(localStorage, APP.storage.tema, activar ? "oscuro" : "claro");
  }

  function abrirDrawerMenu() {
    dom.drawer?.classList.add("drawer--activo");
    dom.drawerOverlay?.classList.add("drawer-overlay--activo");
    setExpanded(dom.abrirDrawer, true);
    dom.cerrarDrawerBoton?.focus();
  }

  function esVistaMovilPanel() {
    return mediaPaneles.matches;
  }

  function actualizarAlturaPanel(panel) {
    const contenido = $(SELECTORES.panelContenido, panel);
    const expandido = panel.classList.contains("panel-estudiante--abierto");
    if (!contenido) return;

    contenido.style.maxHeight = esVistaMovilPanel()
      ? expandido ? `${contenido.scrollHeight}px` : "0px"
      : "none";
  }

  function cambiarEstadoPanel(panel, expandir) {
    const toggle = $(SELECTORES.panelToggle, panel);
    const contenido = $(SELECTORES.panelContenido, panel);
    if (!toggle || !contenido) return;

    panel.classList.toggle("panel-estudiante--abierto", expandir);
    setExpanded(toggle, expandir);
    contenido.setAttribute("aria-hidden", String(!expandir));
    actualizarAlturaPanel(panel);
  }

  function cerrarOtrosPaneles(panelActivo) {
    dom.panelesMoviles.forEach((panel) => {
      if (panel !== panelActivo) {
        cambiarEstadoPanel(panel, false);
      }
    });
  }

  function sincronizarPanelesMoviles() {
    dom.panelesMoviles.forEach((panel) => {
      cambiarEstadoPanel(panel, !esVistaMovilPanel());
    });
  }

  function inicializarPanelesMoviles() {
    dom.panelesMoviles.forEach((panel) => {
      if (panel.dataset.panelReady) return;

      const toggle = $(SELECTORES.panelToggle, panel);
      toggle?.addEventListener("click", () => {
        if (!esVistaMovilPanel()) return;

        const expandido = panel.classList.contains("panel-estudiante--abierto");
        if (!expandido) {
          cerrarOtrosPaneles(panel);
        }
        cambiarEstadoPanel(panel, !expandido);
      });

      panel.dataset.panelReady = "true";
    });

    sincronizarPanelesMoviles();
  }

  function manejarTeclado(evento) {
    if (evento.key !== "Escape") return;

    cerrarModal();
    cerrarDropdownNotificaciones();
    cerrarDrawer();
  }

  function registrarEventos() {
    dom.formLogin?.addEventListener("submit", validarLogin);
    dom.togglePassword?.addEventListener("click", alternarPassword);
    $$(SELECTORES.voltearCarnet).forEach((boton) => boton.addEventListener("click", alternarCarnet));

    conectarModal("#abrirPerfil, #drawerPerfil", "modal-perfil");
    conectarModal("#abrirLogout, #drawerLogout", "modal-logout");
    conectarModal("#abrirSoporte", "modal-soporte");
    conectarModal("#abrirPortal", "modal-portal");
    document.addEventListener("click", manejarClicModal);
    dom.overlay?.addEventListener("click", cerrarModal);
    $$(SELECTORES.cerrarModal).forEach((boton) => boton.addEventListener("click", cerrarModal));

    dom.confirmarLogout?.addEventListener("click", cerrarSesion);
    dom.formSoporte?.addEventListener("submit", manejarSoporte);

    dom.btnNotificaciones?.addEventListener("click", alternarDropdownNotificaciones);
    dom.notifDropdown?.addEventListener("click", (evento) => evento.stopPropagation());
    dom.marcarLeidas?.addEventListener("click", marcarNotificacionesLeidas);
    document.addEventListener("click", cerrarDropdownNotificaciones);

    dom.toggleTema?.addEventListener("click", alternarTema);

    dom.abrirDrawer?.addEventListener("click", abrirDrawerMenu);
    dom.cerrarDrawerBoton?.addEventListener("click", cerrarDrawer);
    dom.drawerOverlay?.addEventListener("click", cerrarDrawer);

    document.addEventListener("keydown", manejarTeclado);
    window.addEventListener("resize", sincronizarPanelesMoviles);
    mediaPaneles.addEventListener?.("change", sincronizarPanelesMoviles);
  }

  /* 4. Inicializacion */
  function iniciarApp() {
    prepararModales();
    registrarEventos();
    generarCodigoBarras();
    colorearNotas();
    aplicarTemaOscuro(leerStorage(localStorage, APP.storage.tema) === "oscuro");
    inicializarPanelesMoviles();
    inicializarEntrada();
  }

  iniciarApp();
})();
