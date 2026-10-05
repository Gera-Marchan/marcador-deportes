/**
 * Control Remoto OBS Studio v5.x - Marcador de Béisbol
 * Ubicación Local: C:\Users\gerardo_marchan\Downloads\bocinas pruebas
 */

class BaseballOBSApp {
  constructor() {
    this.obs = null;
    this.connected = false;
    try {
      this.broadcastChannel = new BroadcastChannel('baseball_scoreboard_channel');
    } catch (e) {
      this.broadcastChannel = null;
    }

    this.config = {
      host: 'localhost',
      port: '4455',
      password: '',
      streamServer: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      streamKey: '',
      sources: {
        visitaName: 'Txt_EquipoVisita',
        localName: 'Txt_EquipoLocal',
        visitaScore: 'Txt_CarrerasVisita',
        localScore: 'Txt_CarrerasLocal',
        visitaHits: 'Txt_HitsVisita',
        localHits: 'Txt_HitsLocal',
        visitaErrors: 'Txt_ErroresVisita',
        localErrors: 'Txt_ErroresLocal',
        inning: 'Txt_Inning',
        conteo: 'Txt_Conteo',
        audioNarrador: 'NARRADOR',
        audioMic2: 'Mic 2',
        audioAmbiente: 'AMBIENTE',
        audioAux4: 'Mezclador 4'
      }
    };

    this.state = {
      activeSport: 'baseball', // 'baseball' o 'soccer'
      visitaInningScores: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      localInningScores: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      screenMode: 'marcador', // 'marcador', 'espera', 'bienvenida', 'medio_tiempo', 'patrocinadores_full', 'problemas'
      showCameraFrame: false,
      showObsScenesSection: false,
      scorebugTheme: 'dark-pro', // 'dark-pro', 'champions', 'red-flame', 'minimal'
      soccerState: {
        period: '1T', // '1T', '2T', 'ET1', 'ET2', 'PEN'
        seconds: 0,
        timerRunning: false,
        addedMinutes: 0,
        visitaYellow: 0,
        visitaRed: 0,
        localYellow: 0,
        localRed: 0,
        visitaFouls: 0,
        localFouls: 0,
        visitaCorners: 0,
        localCorners: 0
      },
      visitaName: 'VISITA',
      visitaLogo: null,
      localLogo: null,
      visitaColor: '#38BDF8',
      localColor: '#EF4444',
      localName: 'LOCAL',
      visitaScore: 0,
      localScore: 0,
      visitaHits: 0,
      localHits: 0,
      visitaErrors: 0,
      localErrors: 0,
      inningNumber: 1,
      inningHalf: 'alta', // 'alta' o 'baja'
      balls: 0,
      strikes: 0,
      outs: 0,
      bases: { b1: false, b2: false, b3: false },
      activeScene: 'ESPERA',
      isStreaming: false,
      mobileMode: false,
      sponsorsState: {
        visible: true,
        currentIndex: 0,
        intervalSeconds: 10,
        autoRotate: true,
        list: [
          { id: 1, name: 'Deportes Max', slogan: 'Tu Tienda Deportiva', logo: 'https://cdn-icons-png.flaticon.com/512/861/861506.png' },
          { id: 2, name: 'Tacos & Béisbol', slogan: 'El Sabor del Juego', logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
          { id: 3, name: 'Bebidas Campeón', slogan: 'Hidratación Oficial', logo: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' }
        ]
      },
      tickerState: {
        visible: false,
        text: '¡BIENVENIDOS A LA TRANSMISIÓN EN VIVO! | SUSCRÍBETE A NUESTRO CANAL Y SÍGUENOS EN REDES SOCIALES | COMENTA TU EQUIPO FAVORITO'
      }
    };

    this.sponsorTimer = null;
    this.soccerTimerInterval = null;
    this.tempSponsorLogo = null;
    this.init();
  }

  init() {
    this.loadLocalStorage();
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
    this.setupOBS();
    this.startSponsorAutoRotation();
    this.startSoccerTimerLoop();
    this.initRealtimeSSE();
    this.startOBSAutoReconnect();
  }

  startSoccerTimerLoop() {
    if (this.soccerTimerInterval) clearInterval(this.soccerTimerInterval);
    this.soccerTimerInterval = setInterval(() => {
      if (this.state.activeSport === 'soccer' && this.state.soccerState && this.state.soccerState.timerRunning) {
        this.state.soccerState.seconds += 1;
        this.updateSoccerTimerUI();
        if (this.state.soccerState.seconds % 3 === 0) {
          this.saveLocalStorage();
        }
      }
    }, 1000);
  }

  loadLocalStorage() {
    const savedConfig = localStorage.getItem('obs_baseball_config');
    if (savedConfig) {
      try { this.config = { ...this.config, ...JSON.parse(savedConfig) }; } catch (e) {}
    }

    const savedState = localStorage.getItem('obs_baseball_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      } catch (e) {}
    }

    if (!this.state.activeSport) this.state.activeSport = 'baseball';
    if (!this.state.soccerState) {
      this.state.soccerState = {
        period: '1T',
        seconds: 0,
        timerRunning: false,
        addedMinutes: 0,
        visitaYellow: 0,
        visitaRed: 0,
        localYellow: 0,
        localRed: 0,
        visitaFouls: 0,
        localFouls: 0,
        visitaCorners: 0,
        localCorners: 0
      };
    }
    if (!this.state.bases) this.state.bases = { b1: false, b2: false, b3: false };
    if (!this.state.sponsorsState) {
      this.state.sponsorsState = {
        visible: true,
        currentIndex: 0,
        intervalSeconds: 10,
        autoRotate: true,
        list: [
          { id: 1, name: 'Deportes Max', slogan: 'Tu Tienda Deportiva', logo: 'https://cdn-icons-png.flaticon.com/512/861/861506.png' },
          { id: 2, name: 'Tacos & Béisbol', slogan: 'El Sabor del Juego', logo: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
          { id: 3, name: 'Bebidas Campeón', slogan: 'Hidratación Oficial', logo: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' }
        ]
      };
    }
    if (!this.state.tickerState) {
      this.state.tickerState = {
        visible: false,
        text: '¡BIENVENIDOS A LA TRANSMISIÓN EN VIVO! | SUSCRÍBETE A NUESTRO CANAL Y SÍGUENOS EN REDES SOCIALES | COMENTA TU EQUIPO FAVORITO'
      };
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('obsIpInput', this.config.host);
    setVal('cfgHost', this.config.host);
    setVal('obsPortInput', this.config.port);
    setVal('cfgPort', this.config.port);
    setVal('obsPassInput', this.config.password);
    setVal('srcAudioNarrador', this.config.sources.audioNarrador);
    setVal('srcAudioAmbiente', this.config.sources.audioAmbiente);
    setVal('srcAudioMic2', this.config.sources.audioMic2);
    setVal('srcAudioAux4', this.config.sources.audioAux4);
    setVal('cfgPassword', this.config.password);
    setVal('streamServerInput', this.config.streamServer || 'rtmps://live-api-s.facebook.com:443/rtmp/');
    setVal('streamKeyInput', this.config.streamKey || '');
  }

  saveLocalStorage() {
    try {
      localStorage.setItem('obs_baseball_config', JSON.stringify(this.config));
    } catch (e) {}

    try {
      localStorage.setItem('obs_baseball_state', JSON.stringify(this.state));
      localStorage.setItem('baseball_obs_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('QuotaExceededError al guardar estado en localStorage, reduciendo payload:', e);
      try {
        const cleanState = JSON.parse(JSON.stringify(this.state));
        if (cleanState.customSounds) {
          cleanState.customSounds = cleanState.customSounds.map(s => ({
            id: s.id,
            name: s.name,
            url: (s.url && s.url.startsWith('data:')) ? '' : s.url
          }));
        }
        if (cleanState.sponsorsState && cleanState.sponsorsState.list) {
          cleanState.sponsorsState.list = cleanState.sponsorsState.list.map(s => ({
            id: s.id,
            name: s.name,
            slogan: s.slogan,
            logo: (s.logo && s.logo.startsWith('data:')) ? 'https://cdn-icons-png.flaticon.com/512/861/861506.png' : s.logo
          }));
        }
        localStorage.setItem('obs_baseball_state', JSON.stringify(cleanState));
        localStorage.setItem('baseball_obs_state', JSON.stringify(cleanState));
      } catch (err2) {
        console.error('Error al guardar estado comprimido en localStorage:', err2);
      }
    }

    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'STATE_UPDATE', state: this.state });
        this.broadcastChannel.postMessage(this.state);
      }
    } catch (e) {}

    try {
      const key = localStorage.getItem('overlayKey') || 'default';
      const apiUrl = window.location.protocol.startsWith('http') 
        ? `/api/state?key=${encodeURIComponent(key)}` 
        : `http://localhost:8080/api/state?key=${encodeURIComponent(key)}`;
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      }).catch(() => {});
    } catch (e) {}
  }

  initRealtimeSSE() {
    try {
      const host = window.location.host || 'localhost:8080';
      const protocol = window.location.protocol.startsWith('https') ? 'https' : 'http';
      const key = localStorage.getItem('overlayKey') || 'default';
      const sseUrl = `${protocol}://${host}/api/events?key=${encodeURIComponent(key)}`;
      const es = new EventSource(sseUrl);

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.clientsCount !== undefined) {
            this.updateClientsBadge(payload.clientsCount);
          }
          const newState = payload.state;
          if (newState && typeof newState === 'object' && Object.keys(newState).length > 0) {
            const currentStr = JSON.stringify(this.state);
            const newStr = JSON.stringify(newState);
            if (currentStr !== newStr) {
              this.state = { ...this.state, ...newState };
              this.renderUI();
            }
          }
        } catch (e) {}
      };

      es.onerror = () => {
        this.updateClientsBadge(0);
      };
    } catch (e) {
      console.warn('SSE no soportado:', e);
    }
  }

  updateClientsBadge(count) {
    const badge = document.getElementById('realtimeSyncBadge');
    const textEl = document.getElementById('realtimeSyncText');
    if (badge) {
      badge.style.display = 'inline-flex';
    }
    if (textEl) {
      textEl.textContent = count > 0 ? `⚡ REALTIME (${count} DISP.)` : '⚡ REALTIME (CONECTANDO)';
    }
  }

  startOBSAutoReconnect() {
    if (this.reconnectTimer) clearInterval(this.reconnectTimer);
    this.reconnectTimer = setInterval(() => {
      if (!this.connected) {
        this.setupOBS();
      }
    }, 8000);
  }

  async setupOBS() {
    const OBSWebSocketLib = window.OBSWebSocket || (typeof OBSWebSocket !== 'undefined' ? OBSWebSocket : null);
    if (!OBSWebSocketLib) {
      this.updateConnectionStatus(false, 'SIN LIBRERÍA');
      return;
    }

    if (this.connected) return;

    try {
      this.obs = new OBSWebSocketLib();
      this.updateConnectionStatus(false, 'CONECTANDO...');
      
      const address = `ws://${this.config.host}:${this.config.port}`;
      await this.obs.connect(address, this.config.password || undefined);

      this.connected = true;
      this.updateConnectionStatus(true, 'CONECTADO');
      this.bindOBSEvents();
      this.syncFromOBS();

    } catch (error) {
      this.connected = false;
      this.updateConnectionStatus(false, 'DESCONECTADO');
    }
  }

  bindOBSEvents() {
    if (!this.obs) return;

    this.obs.on('CurrentProgramSceneChanged', (data) => {
      if (data && data.sceneName) {
        this.setActiveSceneUI(data.sceneName);
      }
    });

    this.obs.on('StreamStateChanged', (data) => {
      if (data) {
        this.setStreamStatusUI(!!data.outputActive);
      }
    });

    this.obs.on('RecordStateChanged', (data) => {
      if (data) {
        this.setRecordStatusUI(!!data.outputActive);
      }
    });

    this.obs.on('ConnectionClosed', () => {
      this.connected = false;
      this.updateConnectionStatus(false, 'DESCONECTADO');
    });

    this.obs.on('InputVolumeChanged', (data) => {
      this.handleAudioVolumeEvent(data.inputName, data.inputVolumeMul);
    });

    this.obs.on('InputMuteStateChanged', (data) => {
      this.handleAudioMuteEvent(data.inputName, data.inputMuted);
    });
  }

  handleAudioVolumeEvent(inputName, volMul) {
    const channelMap = {
      [this.config.sources.audioNarrador]: 1,
      [this.config.sources.audioAmbiente]: 2,
      [this.config.sources.audioMic2]: 3,
      [this.config.sources.audioAux4]: 4
    };

    const ch = channelMap[inputName];
    if (ch) {
      const sliderEl = document.getElementById(`audioSlider${ch}`);
      if (sliderEl) sliderEl.value = Math.round(volMul * 100);
      this.updateAudioDbLabel(ch, volMul);
    }
  }

  handleAudioMuteEvent(inputName, isMuted) {
    const muteMap = {
      [this.config.sources.audioNarrador]: 1,
      [this.config.sources.audioAmbiente]: 2,
      [this.config.sources.audioMic2]: 3,
      [this.config.sources.audioAux4]: 4
    };

    const ch = muteMap[inputName];
    if (ch) {
      const btn = document.getElementById(`audioMute${ch}`);
      if (btn) btn.classList.toggle('muted', isMuted);
    }
  }

  async syncFromOBS() {
    if (!this.connected) return;
    try {
      const currentScene = await this.obs.call('GetCurrentProgramScene');
      if (currentScene && currentScene.currentProgramSceneName) {
        this.setActiveSceneUI(currentScene.currentProgramSceneName);
      }
      const sceneList = await this.obs.call('GetSceneList');
      if (sceneList && sceneList.scenes) {
        this.renderDynamicScenes(sceneList.scenes);
      }
      const streamStatus = await this.obs.call('GetStreamStatus');
      this.setStreamStatusUI(streamStatus.outputActive);
      try {
        const recStatus = await this.obs.call('GetRecordStatus');
        if (recStatus) this.setRecordStatusUI(recStatus.outputActive);
      } catch (e) {}
      
      this.sendAllToOBS();
      await this.autoDetectOBSAudioSources();
      this.syncAudioMixerFromOBS();
    } catch (e) {}
  }

  
  async autoDetectOBSAudioSources() {
    if (!this.connected || !this.obs) return;
    try {
      const res = await this.obs.call('GetInputList');
      if (res && res.inputs) {
        const inputs = res.inputs;
        console.log('Fuentes de audio detectadas en OBS:', inputs.map(i => i.inputName));
        
        const narrador = inputs.find(i => /narrador|narr|mic|aux/i.test(i.inputName));
        const ambiente = inputs.find(i => /ambiente|desktop|escritorio|audio/i.test(i.inputName));
        
        if (narrador) this.config.sources.audioNarrador = narrador.inputName;
        if (ambiente) this.config.sources.audioAmbiente = ambiente.inputName;

        const setLabel = (id, text) => {
          const el = document.getElementById(id);
          if (el) {
            // Keep SVG icon if present
            const svg = el.querySelector('svg');
            el.textContent = text;
            if (svg) el.prepend(svg);
          }
        };

        if (narrador) setLabel('channelLabel1', narrador.inputName);
        if (ambiente) setLabel('channelLabel2', ambiente.inputName);

        // Also populate modal inputs if present
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        };
        if (narrador) setVal('srcAudioNarrador', narrador.inputName);
        if (ambiente) setVal('srcAudioAmbiente', ambiente.inputName);
      }
    } catch (e) {
      console.warn('Auto-detección audio OBS:', e);
    }
  }

  async syncAudioMixerFromOBS() {
    if (!this.connected || !this.obs) return;
    const channels = [
      { num: 1, name: this.config.sources.audioNarrador },
      { num: 2, name: this.config.sources.audioAmbiente },
      { num: 3, name: this.config.sources.audioMic2 },
      { num: 4, name: this.config.sources.audioAux4 }
    ];

    for (const ch of channels) {
      if (!ch.name) continue;
      try {
        const inputName = await this.resolveOBSInputName(ch.name);
        const volRes = await this.obs.call('GetInputVolume', { inputName: inputName });
        if (volRes) {
          this.handleAudioVolumeEvent(ch.name, volRes.inputVolumeMul);
        }
        const muteRes = await this.obs.call('GetInputMute', { inputName: inputName });
        if (muteRes) {
          this.handleAudioMuteEvent(ch.name, muteRes.inputMuted);
        }
      } catch (e) {}
    }
  }

  updateConnectionStatus(isConnected, text) {
    const badge = document.getElementById('obsStatusBadge');
    const textEl = document.getElementById('obsStatusText');
    if (badge) badge.className = `badge ${isConnected ? 'connected' : 'disconnected'}`;
    if (textEl) textEl.textContent = text;
  }

  async changeScene(sceneName) {
    this.setActiveSceneUI(sceneName);
    if (this.connected && this.obs) {
      try {
        await this.obs.call('SetCurrentProgramScene', { sceneName: sceneName });
      } catch (err) {}
    }
  }

  setActiveSceneUI(sceneName) {
    this.state.activeScene = sceneName;

    const defaultBtns = {
      'ESPERA': 'btnSceneEspera',
      'CAMPO': 'btnSceneCampo',
      'HOME': 'btnSceneHome',
      'REPETICIÓN': 'btnSceneRepeticion',
      'MEDIO INNING': 'btnSceneMedioInning'
    };

    Object.values(defaultBtns).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    if (defaultBtns[sceneName]) {
      const activeEl = document.getElementById(defaultBtns[sceneName]);
      if (activeEl) activeEl.classList.add('active');
    }

    document.querySelectorAll('.btn-dynamic-scene').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenename === sceneName);
    });

    this.saveLocalStorage();
  }

  renderDynamicScenes(scenes) {
    const container = document.getElementById('dynamicSceneContainer');
    const grid = document.getElementById('dynamicSceneGrid');
    if (!grid || !container) return;

    grid.innerHTML = '';
    
    // Filtrar escenas principales por defecto para evitar duplicados
    const defaultScenes = ['ESPERA', 'CAMPO', 'HOME', 'REPETICIÓN', 'MEDIO INNING'];
    const otherScenes = scenes.filter(sc => !defaultScenes.includes(sc.sceneName.toUpperCase().trim()));

    if (otherScenes.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    otherScenes.forEach(sc => {
      const btn = document.createElement('button');
      btn.className = `btn-scene btn-dynamic-scene ${sc.sceneName === this.state.activeScene ? 'active' : ''}`;
      btn.dataset.scenename = sc.sceneName;
      btn.onclick = () => this.changeScene(sc.sceneName);
      btn.innerHTML = `<span class="scene-name">${sc.sceneName}</span><span class="scene-status-tag">OBS</span>`;
      grid.appendChild(btn);
    });
  }

  renderUI() {
    const setVal = (id, val) => {
      const el = document.getElementById(id) || document.getElementById(`${id}Input`);
      if (el) el.value = val;
    };
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('visitaName', this.state.visitaName);
    setVal('visitaColorInput', this.state.visitaColor || '#38BDF8');
    setVal('localColorInput', this.state.localColor || '#EF4444');
    setVal('localName', this.state.localName);
    setTxt('visitaScore', this.state.visitaScore);
    setTxt('localScore', this.state.localScore);
    setTxt('visitaHits', this.state.visitaHits);
    setTxt('localHits', this.state.localHits);
    setTxt('visitaErrors', this.state.visitaErrors);
    setTxt('localErrors', this.state.localErrors);

    const isBaseball = (this.state.activeSport || 'baseball') === 'baseball';
    const tabBaseball = document.getElementById('tabSportBaseball');
    const tabSoccer = document.getElementById('tabSportSoccer');
    if (tabBaseball) tabBaseball.classList.toggle('active', isBaseball);
    if (tabSoccer) tabSoccer.classList.toggle('active', !isBaseball);

    const baseballPanel = document.getElementById('baseballControlPanel');
    const soccerPanel = document.getElementById('soccerControlPanel');
    if (baseballPanel) baseballPanel.style.display = isBaseball ? 'block' : 'none';
    if (soccerPanel) soccerPanel.style.display = !isBaseball ? 'block' : 'none';

    const btnGoalVisita = document.getElementById('btnGoalVisita');
    const btnGoalLocal = document.getElementById('btnGoalLocal');
    if (btnGoalVisita) btnGoalVisita.textContent = `⚽ GOL (${this.state.visitaName || 'VISITA'})`;
    if (btnGoalLocal) btnGoalLocal.textContent = `⚽ GOL (${this.state.localName || 'LOCAL'})`;

    const imgVisita = document.getElementById('previewVisitaLogo');
    const btnRemoveVisita = document.getElementById('btnRemoveVisitaLogo');
    if (imgVisita) {
      if (this.state.visitaLogo) {
        imgVisita.src = this.state.visitaLogo;
        imgVisita.style.display = 'inline-block';
        if (btnRemoveVisita) btnRemoveVisita.style.display = 'inline-block';
      } else {
        imgVisita.style.display = 'none';
        if (btnRemoveVisita) btnRemoveVisita.style.display = 'none';
      }
    }

    const imgLocal = document.getElementById('previewLocalLogo');
    const btnRemoveLocal = document.getElementById('btnRemoveLocalLogo');
    if (imgLocal) {
      if (this.state.localLogo) {
        imgLocal.src = this.state.localLogo;
        imgLocal.style.display = 'inline-block';
        if (btnRemoveLocal) btnRemoveLocal.style.display = 'inline-block';
      } else {
        imgLocal.style.display = 'none';
        if (btnRemoveLocal) btnRemoveLocal.style.display = 'none';
      }
    }

    const currentTheme = this.state.scorebugTheme || 'dark-pro';
    document.querySelectorAll('.btn-theme-selector').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    this.updateInningUI();
    this.updateCountUI();
    this.updateBasesUI();
    this.updateSoccerTimerUI();
    this.renderCustomSoundButtons();
    this.setAudioRouting(this.state.audioRouting || 'both');
    this.updateSponsorDisplayUI();

    
    const showObs = !!this.state.showObsScenesSection;
    const obsSec = document.getElementById('obsScenesOptionalSection');
    if (obsSec) obsSec.style.display = showObs ? 'block' : 'none';

    const btnCfgObs = document.getElementById('btnToggleObsScenesConfig');
    if (btnCfgObs) {
      btnCfgObs.textContent = showObs ? '⚙️ MOSTRAR ESCENAS OBS EN PANEL: ON (VISIBLE)' : '⚙️ MOSTRAR ESCENAS OBS EN PANEL: OFF (OCULTO)';
      btnCfgObs.style.background = showObs ? 'rgba(34, 197, 94, 0.2)' : 'rgba(30, 41, 59, 0.8)';
      btnCfgObs.style.borderColor = showObs ? '#34D399' : 'rgba(255, 255, 255, 0.2)';
      btnCfgObs.style.color = showObs ? '#4ADE80' : '#94A3B8';
    }

    const currentMode = this.state.screenMode || 'marcador';
    const modeMap = {
      'marcador': 'btnModeMarcador',
      'espera': 'btnModeEspera',
      'bienvenida': 'btnModeBienvenida',
      'medio_tiempo': 'btnModeMedioTiempo',
      'patrocinadores_full': 'btnModePatrocinadores',
      'problemas': 'btnModeProblemas'
    };
    Object.keys(modeMap).forEach(m => {
      const btn = document.getElementById(modeMap[m]);
      if (btn) btn.classList.toggle('active', currentMode === m);
    });
    const btnFrame = document.getElementById('btnToggleFrame');
    if (btnFrame) {
      btnFrame.textContent = this.state.showCameraFrame ? '🖼️ MARCO CÁMARA: ACTIVADO (ON)' : '🖼️ MARCO CÁMARA: DESACTIVADO (OFF)';
      btnFrame.style.background = this.state.showCameraFrame ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)';
      btnFrame.style.borderColor = this.state.showCameraFrame ? '#34D399' : 'rgba(56, 189, 248, 0.4)';
      btnFrame.style.color = this.state.showCameraFrame ? '#4ADE80' : '#38BDF8';
    }

    this.renderTickerUI();
  }

  
  setScreenMode(mode) {
    this.state.screenMode = mode;
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  
  toggleObsScenesSection() {
    this.state.showObsScenesSection = !this.state.showObsScenesSection;
    this.renderUI();
    this.saveLocalStorage();
  }

  toggleCameraFrame() {
    this.state.showCameraFrame = !this.state.showCameraFrame;
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  setScorebugTheme(themeName) {
    this.state.scorebugTheme = themeName;
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  
  updateTeamColors() {
    const vColorEl = document.getElementById('visitaColorInput');
    const lColorEl = document.getElementById('localColorInput');
    if (vColorEl) this.state.visitaColor = vColorEl.value;
    if (lColorEl) this.state.localColor = lColorEl.value;
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  uploadTeamLogo(team, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 160;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/png', 0.85);

        if (team === 'visita') {
          this.state.visitaLogo = compressedDataUrl;
        } else {
          this.state.localLogo = compressedDataUrl;
        }
        this.renderUI();
        this.saveLocalStorage();
        this.sendAllToOBS();
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  }

  removeTeamLogo(team) {
    if (team === 'visita') {
      this.state.visitaLogo = null;
    } else {
      this.state.localLogo = null;
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickHit() {
    this.state.lastAction = 'HIT_' + Date.now();
    const isTop = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
    const statKey = isTop ? 'visitaHits' : 'localHits';
    this.state[statKey] = Math.max(0, this.state[statKey] + 1);
    this.state.balls = 0;
    this.state.strikes = 0;
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickStrikeout() {
    this.state.lastAction = 'PONCHE_' + Date.now();
    this.state.outs = this.state.outs + 1;
    this.state.balls = 0;
    this.state.strikes = 0;
    if (this.state.outs >= 3) {
      alert('¡3 Outs! Cambio de Inning');
      this.state.outs = 0;
      this.state.bases = { b1: false, b2: false, b3: false };
      if (this.state.inningHalf === 'alta' || this.state.inningHalf === 'top') {
        this.state.inningHalf = 'baja';
      } else {
        this.state.inningHalf = 'alta';
        this.state.inningNumber += 1;
      }
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickHomeRun() {
    const isGrandSlam = this.state.bases && this.state.bases.b1 && this.state.bases.b2 && this.state.bases.b3;
    if (isGrandSlam) {
      this.state.lastAction = 'GRANDSLAM_' + Date.now();
    } else {
      this.state.lastAction = 'HOMERUN_' + Date.now();
    }
    const isTop = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
    const team = isTop ? 'visita' : 'local';
    const runnersOnBase = (this.state.bases.b1 ? 1 : 0) + (this.state.bases.b2 ? 1 : 0) + (this.state.bases.b3 ? 1 : 0);
    const runsScored = 1 + runnersOnBase;
    
    if (team === 'visita') {
      this.state.visitaScore = Math.max(0, this.state.visitaScore + runsScored);
      this.state.visitaHits = Math.max(0, this.state.visitaHits + 1);
    } else {
      this.state.localScore = Math.max(0, this.state.localScore + runsScored);
      this.state.localHits = Math.max(0, this.state.localHits + 1);
    }
    this.state.bases = { b1: false, b2: false, b3: false };
    this.state.balls = 0;
    this.state.strikes = 0;
    
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickGrandSlam() {
    this.state.bases = { b1: true, b2: true, b3: true };
    this.quickHomeRun();
  }

  setSport(sport) {
    this.state.activeSport = sport;
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  formatSoccerTime(totalSeconds) {
    const mins = Math.floor((totalSeconds || 0) / 60);
    const secs = (totalSeconds || 0) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  toggleSoccerTimer() {
    if (!this.state.soccerState) return;
    this.state.soccerState.timerRunning = !this.state.soccerState.timerRunning;
    this.updateSoccerTimerUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  setSoccerTimerSeconds(secs) {
    if (!this.state.soccerState) return;
    this.state.soccerState.seconds = Math.max(0, secs);
    this.updateSoccerTimerUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  setSoccerPeriod(period) {
    if (!this.state.soccerState) return;
    this.state.soccerState.period = period;
    if (period === '1T') this.state.soccerState.seconds = 0;
    if (period === '2T') this.state.soccerState.seconds = 2700; // 45:00
    if (period === 'ET1') this.state.soccerState.seconds = 5400; // 90:00
    if (period === 'ET2') this.state.soccerState.seconds = 6300; // 105:00
    this.updateSoccerTimerUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  setSoccerAddedMinutes(mins) {
    if (!this.state.soccerState) return;
    this.state.soccerState.addedMinutes = Math.max(0, mins);
    this.updateSoccerTimerUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  updateSoccerTimerUI() {
    const clockEl = document.getElementById('soccerClockDisplay');
    if (clockEl && this.state.soccerState) {
      clockEl.textContent = this.formatSoccerTime(this.state.soccerState.seconds);
    }
    const playPauseBtn = document.getElementById('btnSoccerPlayPause');
    if (playPauseBtn && this.state.soccerState) {
      playPauseBtn.textContent = this.state.soccerState.timerRunning ? '⏸ PAUSAR' : '▶ INICIAR';
      playPauseBtn.classList.toggle('running', this.state.soccerState.timerRunning);
    }
    const periodBadge = document.getElementById('soccerPeriodDisplay');
    if (periodBadge && this.state.soccerState) {
      periodBadge.textContent = this.state.soccerState.period || '1T';
    }
    const addedEl = document.getElementById('soccerAddedMinutesDisplay');
    if (addedEl && this.state.soccerState) {
      addedEl.textContent = this.state.soccerState.addedMinutes > 0 ? `+${this.state.soccerState.addedMinutes}'` : '';
    }
  }

  quickGoal(team) {
    const targetTeam = team || 'local';
    this.state.lastAction = 'GOL_' + targetTeam.toUpperCase() + '_' + Date.now();
    if (targetTeam === 'visita') {
      this.state.visitaScore = Math.max(0, this.state.visitaScore + 1);
    } else {
      this.state.localScore = Math.max(0, this.state.localScore + 1);
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickYellowCard(team) {
    this.state.lastAction = 'AMARILLA_' + Date.now();
    if (this.state.soccerState) {
      if (team === 'visita') this.state.soccerState.visitaYellow += 1;
      else this.state.soccerState.localYellow += 1;
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickRedCard(team) {
    this.state.lastAction = 'ROJA_' + Date.now();
    if (this.state.soccerState) {
      if (team === 'visita') this.state.soccerState.visitaRed += 1;
      else this.state.soccerState.localRed += 1;
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickVAR() {
    this.state.lastAction = 'VAR_' + Date.now();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickPenalty() {
    this.state.lastAction = 'PENALTY_' + Date.now();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  quickRun() {
    this.state.lastAction = 'CARRERA_' + Date.now();
    const isTop = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
    if (isTop) {
      this.state.visitaScore = Math.max(0, this.state.visitaScore + 1);
    } else {
      this.state.localScore = Math.max(0, this.state.localScore + 1);
    }
    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  updateTeamNames() {
    const vEl = document.getElementById('visitaNameInput') || document.getElementById('visitaName');
    const hEl = document.getElementById('localNameInput') || document.getElementById('localName');
    if (vEl) this.state.visitaName = vEl.value.trim() || 'VISITA';
    if (hEl) this.state.localName = hEl.value.trim() || 'LOCAL';
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  
  updateInningScoreArray(team, delta) {
    const inningIdx = Math.max(0, Math.min(8, (this.state.inningNumber || 1) - 1));
    if (team === 'visita') {
      if (!this.state.visitaInningScores) this.state.visitaInningScores = [0,0,0,0,0,0,0,0,0];
      this.state.visitaInningScores[inningIdx] = Math.max(0, (this.state.visitaInningScores[inningIdx] || 0) + delta);
    } else {
      if (!this.state.localInningScores) this.state.localInningScores = [0,0,0,0,0,0,0,0,0];
      this.state.localInningScores[inningIdx] = Math.max(0, (this.state.localInningScores[inningIdx] || 0) + delta);
    }
  }

  changeScore(team, delta) {
    this.updateInningScoreArray(team, delta);
    if (team === 'visita') {
      this.state.visitaScore = Math.max(0, this.state.visitaScore + delta);
      const el = document.getElementById('visitaScore');
      if (el) el.textContent = this.state.visitaScore;
    } else {
      this.state.localScore = Math.max(0, this.state.localScore + delta);
      const el = document.getElementById('localScore');
      if (el) el.textContent = this.state.localScore;
    }
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  changeStat(statKey, delta) {
    this.state[statKey] = Math.max(0, this.state[statKey] + delta);
    const el = document.getElementById(statKey);
    if (el) el.textContent = this.state[statKey];
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  swapTeams() {
    const tempName = this.state.visitaName;
    const tempScore = this.state.visitaScore;
    const tempHits = this.state.visitaHits;
    const tempErrors = this.state.visitaErrors;
    const tempColor = this.state.visitaColor;

    this.state.visitaName = this.state.localName;
    this.state.visitaScore = this.state.localScore;
    this.state.visitaHits = this.state.localHits;
    this.state.visitaErrors = this.state.localErrors;
    this.state.visitaColor = this.state.localColor;

    this.state.localName = tempName;
    this.state.localScore = tempScore;
    this.state.localHits = tempHits;
    this.state.localErrors = tempErrors;
    this.state.localColor = tempColor;

    this.renderUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  startNewGame() {
    if (confirm('⚠️ ¿Estás seguro de reiniciar todo el partido para comenzar un NUEVO JUEGO?\n\n(Se restablecerán los nombres a "VISITA" y "LOCAL", colores, carreras, hits, errores, conteo B-S-O a 0, inning a 1ª Alta y bases libres)')) {
      this.state.visitaName = 'VISITA';
      this.state.localName = 'LOCAL';
      this.state.visitaColor = '#38BDF8';
      this.state.localColor = '#EF4444';
      this.state.visitaScore = 0;
      this.state.localScore = 0;
      this.state.visitaHits = 0;
      this.state.localHits = 0;
      this.state.visitaErrors = 0;
      this.state.localErrors = 0;
      this.state.inningNumber = 1;
      this.state.inningHalf = 'alta';
      this.state.balls = 0;
      this.state.strikes = 0;
      this.state.outs = 0;
      this.state.bases = { b1: false, b2: false, b3: false };

      this.renderUI();
      this.saveLocalStorage();
      this.sendAllToOBS();
    }
  }

  setInningHalf(half) {
    this.state.inningHalf = (half === 'alta' || half === 'top') ? 'alta' : 'baja';
    this.updateInningUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  changeInning(delta) {
    this.state.inningNumber = Math.max(1, this.state.inningNumber + delta);
    this.updateInningUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  updateInningUI() {
    const isAlta = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
    const arrowEl = document.getElementById('inningHalfArrow') || document.getElementById('inningArrow');
    if (arrowEl) arrowEl.textContent = isAlta ? '▲' : '▼';
    
    const numEl = document.getElementById('inningNumDisplay') || document.getElementById('inningNum') || document.getElementById('inningText');
    if (numEl) numEl.textContent = this.state.inningNumber;

    const btnAlta = document.getElementById('btnInningAlta') || document.getElementById('btnInningTop');
    const btnBaja = document.getElementById('btnInningBaja') || document.getElementById('btnInningBot');
    if (btnAlta) btnAlta.classList.toggle('active', isAlta);
    if (btnBaja) btnBaja.classList.toggle('active', !isAlta);

    // Indicador visual de quién está AL BATE (Solo en Béisbol)
    const isBaseball = (this.state.activeSport || 'baseball') === 'baseball';
    const boxVisita = document.getElementById('teamBoxVisita');
    const boxLocal = document.getElementById('teamBoxLocal');
    const badgeVisita = document.getElementById('atBatBadgeVisita');
    const badgeLocal = document.getElementById('atBatBadgeLocal');

    if (boxVisita) boxVisita.classList.toggle('at-bat', isBaseball && isAlta);
    if (boxLocal) boxLocal.classList.toggle('at-bat', isBaseball && !isAlta);
    if (badgeVisita) badgeVisita.style.display = (isBaseball && isAlta) ? 'inline-block' : 'none';
    if (badgeLocal) badgeLocal.style.display = (isBaseball && !isAlta) ? 'inline-block' : 'none';
  }

  toggleCount(type, index) {
    if (type === 'balls') {
      this.state.balls = (this.state.balls === index) ? index - 1 : index;
      if (this.state.balls >= 4) {
        this.advanceRunnersOnWalk();
        setTimeout(() => this.resetCount(), 400);
      }
    } else if (type === 'strikes') {
      this.state.strikes = (this.state.strikes === index) ? index - 1 : index;
      if (this.state.strikes >= 3) {
        this.toggleCount('outs', this.state.outs + 1);
        this.resetCount();
      }
    } else if (type === 'outs') {
      this.state.outs = (this.state.outs === index) ? index - 1 : index;
      if (this.state.outs >= 3) {
        alert('¡3 Outs! Cambio de Inning');
        this.state.outs = 0;
        this.resetCount();
        this.clearBases();
        if (this.state.inningHalf === 'alta' || this.state.inningHalf === 'top') {
          this.setInningHalf('baja');
        } else {
          this.setInningHalf('alta');
          this.changeInning(1);
        }
      }
    }
    this.updateCountUI();
  }

  advanceRunnersOnWalk() {
    const { b1, b2, b3 } = this.state.bases;
    if (!b1) {
      // 1ra base libre -> el bateador avanza a 1ra base
      this.state.bases.b1 = true;
    } else if (!b2) {
      // 1ra ocupada, 2da libre -> fuerza 2da base
      this.state.bases.b2 = true;
      this.state.bases.b1 = true;
    } else if (!b3) {
      // 1ra y 2da ocupadas, 3ra libre -> fuerza 3ra base
      this.state.bases.b3 = true;
      this.state.bases.b2 = true;
      this.state.bases.b1 = true;
    } else {
      // Bases llenas -> carrera forzada (base por bolas impulsadora)
      const isTop = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
      const teamToScore = isTop ? 'visita' : 'local';
      this.changeScore(teamToScore, 1);
    }
    this.updateBasesUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  updateCountUI() {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`dotB${i}`) || document.getElementById(`ball-${i}`) || document.getElementById(`b${i}`);
      if (el) {
        const isOn = i <= this.state.balls;
        el.classList.toggle('ball-active', isOn);
        el.classList.toggle('active', isOn);
      }
    }
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`dotS${i}`) || document.getElementById(`strike-${i}`) || document.getElementById(`s${i}`);
      if (el) {
        const isOn = i <= this.state.strikes;
        el.classList.toggle('strike-active', isOn);
        el.classList.toggle('active', isOn);
      }
    }
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`dotO${i}`) || document.getElementById(`out-${i}`) || document.getElementById(`o${i}`);
      if (el) {
        const isOn = i <= this.state.outs;
        el.classList.toggle('out-active', isOn);
        el.classList.toggle('active', isOn);
      }
    }

    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  resetCount() {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.updateCountUI();
  }

  toggleBase(baseKey) {
    this.state.bases[baseKey] = !this.state.bases[baseKey];
    this.updateBasesUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  clearBases() {
    this.state.bases = { b1: false, b2: false, b3: false };
    this.updateBasesUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  fillBases() {
    this.state.bases = { b1: true, b2: true, b3: true };
    this.updateBasesUI();
    this.saveLocalStorage();
    this.sendAllToOBS();
  }

  updateBasesUI() {
    ['b1', 'b2', 'b3'].forEach((bKey, idx) => {
      const baseNum = idx + 1;
      const el = document.getElementById(`base${baseNum}`);
      if (el) {
        el.classList.toggle('occupied', !!this.state.bases[bKey]);
        el.classList.toggle('active', !!this.state.bases[bKey]);
      }
    });
  }

  async sendOverlayToOBS() {
    if (!this.connected || !this.obs) return;
    try {
      const targetName = await this.resolveOBSInputName('Scorebug_Beisbol');
      if (targetName) {
        const hashData = Date.now() + '=' + encodeURIComponent(JSON.stringify(this.state));
        const overlayUrl = `http://localhost:8080/overlay.html#${hashData}`;
        await this.obs.call('SetInputSettings', {
          inputName: targetName,
          inputSettings: { url: overlayUrl }
        });
      }
    } catch (err) {}
  }

  async broadcastStateToOBS() {
    if (!this.connected || !this.obs) return;
    try {
      await this.obs.call('BroadcastCustomEvent', {
        eventData: {
          type: 'BASEBALL_STATE_UPDATE',
          state: this.state
        }
      });
    } catch (e) {}
  }

  async sendTextToOBS(sourceName, textValue) {
    if (!this.connected || !this.obs || !sourceName) return;
    try {
      const realInputName = await this.resolveOBSInputName(sourceName);
      if (realInputName) {
        await this.obs.call('SetInputSettings', {
          inputName: realInputName,
          inputSettings: { text: textValue }
        });
      }
    } catch (err) {}
  }

  sendInningToOBS() {
    const isAlta = this.state.inningHalf === 'alta' || this.state.inningHalf === 'top';
    const halfSymbol = isAlta ? '▲' : '▼';
    const text = `${halfSymbol} ${this.state.inningNumber}`;
    this.sendTextToOBS(this.config.sources.inning, text);
  }

  sendConteoToOBS() {
    const text = `B:${this.state.balls} S:${this.state.strikes} O:${this.state.outs}`;
    this.sendTextToOBS(this.config.sources.conteo, text);
  }

  sendAllToOBS() {
    if (!this.connected || !this.obs) return;
    try {
      this.sendTextToOBS(this.config.sources.visitaName, this.state.visitaName);
      this.sendTextToOBS(this.config.sources.localName, this.state.localName);
      this.sendTextToOBS(this.config.sources.visitaScore, String(this.state.visitaScore));
      this.sendTextToOBS(this.config.sources.localScore, String(this.state.localScore));
      this.sendTextToOBS(this.config.sources.visitaHits, String(this.state.visitaHits));
      this.sendTextToOBS(this.config.sources.localHits, String(this.state.localHits));
      this.sendTextToOBS(this.config.sources.visitaErrors, String(this.state.visitaErrors));
      this.sendTextToOBS(this.config.sources.localErrors, String(this.state.localErrors));
      this.sendInningToOBS();
      this.sendConteoToOBS();
      this.sendOverlayToOBS();
      this.broadcastStateToOBS();
    } catch(e) {}
  }

  async resolveOBSInputName(configuredName) {
    if (!this.connected || !this.obs) return configuredName;
    try {
      const res = await this.obs.call('GetInputList');
      if (res && res.inputs) {
        const target = (configuredName || '').toLowerCase().trim();
        if (!target) return configuredName;

        // 1. Coincidencia exacta
        let found = res.inputs.find(i => i.inputName === configuredName);
        if (found) return found.inputName;

        // 2. Coincidencia ignorando mayúsculas
        found = res.inputs.find(i => i.inputName.toLowerCase().trim() === target);
        if (found) return found.inputName;

        // 3. Coincidencia de subcadena o caracteres alfanuméricos (ej. NARRADOR vs NAR...DOR)
        const cleanTarget = target.replace(/[^a-z0-9]/g, '');
        found = res.inputs.find(i => {
          const cleanInput = i.inputName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanInput.includes(cleanTarget) || cleanTarget.includes(cleanInput);
        });
        if (found) return found.inputName;

        // 4. Si busca narrador o mic, tomar el primer micrófono disponible
        if (/narrador|mic|aux/i.test(target)) {
          found = res.inputs.find(i => /narrador|mic|aux/i.test(i.inputName));
          if (found) return found.inputName;
        }

        // 5. Si busca ambiente, tomar ambiente o escritorio
        if (/ambiente|desktop|escritorio|audio/i.test(target)) {
          found = res.inputs.find(i => /ambiente|desktop|escritorio|audio/i.test(i.inputName));
          if (found) return found.inputName;
        }
      }
    } catch (e) {}
    return configuredName;
  }

  async setVolume(channelKey, val) {
    const channelNames = { 1: 'audioNarrador', 2: 'audioAmbiente', 3: 'audioMic2', 4: 'audioAux4' };
    const defaultNames = { 1: 'NARRADOR', 2: 'AMBIENTE', 3: 'Música', 4: 'Mezclador 4' };
    const sourceKey = channelNames[channelKey] || channelKey;
    const volNum = parseFloat(val) / 100;

    this.updateAudioDbLabel(channelKey, volNum);

    if (this.connected && this.obs) {
      const targetConfigName = this.config.sources[sourceKey] || defaultNames[channelKey] || '';
      const inputName = await this.resolveOBSInputName(targetConfigName);
      if (inputName) {
        try {
          await this.obs.call('SetInputVolume', {
            inputName: inputName,
            inputVolumeMul: volNum
          });
        } catch (err) {
          try {
            await this.obs.call('SetVolume', { source: inputName, volume: volNum });
          } catch (e2) {}
        }
      }
    }
  }

  async toggleMute(channelKey) {
    const btn = document.getElementById(`audioMute${channelKey}`);
    const isMuted = btn ? !btn.classList.contains('muted') : false;
    if (btn) btn.classList.toggle('muted', isMuted);

    const channelNames = { 1: 'audioNarrador', 2: 'audioAmbiente', 3: 'audioMic2', 4: 'audioAux4' };
    const defaultNames = { 1: 'NARRADOR', 2: 'AMBIENTE', 3: 'Música', 4: 'Mezclador 4' };
    const sourceKey = channelNames[channelKey] || channelKey;

    if (this.connected && this.obs) {
      const targetConfigName = this.config.sources[sourceKey] || defaultNames[channelKey] || '';
      const inputName = await this.resolveOBSInputName(targetConfigName);
      if (inputName) {
        try {
          await this.obs.call('SetInputMuteState', {
            inputName: inputName,
            inputMuted: isMuted
          });
        } catch (err) {
          try {
            await this.obs.call('SetMute', { source: inputName, mute: isMuted });
          } catch (e2) {}
        }
      }
    }
  }

  updateAudioDbLabel(channelKey, mulValue) {
    const el = document.getElementById(`audioDb${channelKey}`);
    const percentage = Math.round(mulValue * 100);
    const db = mulValue > 0 ? (20 * Math.log10(mulValue)).toFixed(1) : '-∞';
    if (el) el.textContent = `${db} dB (${percentage}%)`;
    
    const fillEl = document.getElementById(`audioMeter${channelKey}`);
    if (fillEl) fillEl.style.width = `${percentage}%`;
  }

  
  async toggleRecording() {
    if (!this.connected) {
      alert('Conéctate a OBS WebSocket primero para controlar la grabación.');
      return;
    }

    if (this.state.isRecording) {
      if (confirm('Confirmar: ¿Detener la grabación en vivo en la PC?')) {
        try {
          await this.obs.call('StopRecord');
          this.setRecordStatusUI(false);
        } catch (e) { alert('Error al detener grabación: ' + e.message); }
      }
    } else {
      if (confirm('Confirmar: ¿Iniciar grabación local de la transmisión en alta definición?')) {
        try {
          await this.obs.call('StartRecord');
          this.setRecordStatusUI(true);
        } catch (e) { alert('Error al iniciar grabación: ' + e.message); }
      }
    }
  }

  setRecordStatusUI(isRecording) {
    this.state.isRecording = isRecording;
    const btn = document.getElementById('btnRecordToggle');
    const badgeText = document.getElementById('recordStatusText');
    if (btn) {
      btn.className = `btn-stream ${isRecording ? 'on' : 'off'}`;
      btn.style.background = isRecording ? 'linear-gradient(135deg, #EF4444, #B91C1C)' : 'rgba(15, 23, 42, 0.8)';
      btn.style.borderColor = isRecording ? '#F87171' : 'rgba(255, 255, 255, 0.2)';
    }
    if (badgeText) badgeText.textContent = isRecording ? '🔴 GRABANDO (REC)' : '📹 GRABAR';
  }

  async toggleStream() {
    if (!this.connected) {
      alert('Conéctate a OBS WebSocket primero para iniciar la transmisión.');
      return;
    }

    if (this.state.isStreaming) {
      if (confirm('Confirmar: Detener la transmisión en vivo?')) {
        try {
          await this.obs.call('StopStream');
          this.setStreamStatusUI(false);
        } catch (e) { alert('Error al detener stream: ' + e.message); }
      }
    } else {
      if (confirm('Confirmar: Iniciar la transmisión en vivo?')) {
        try {
          await this.obs.call('StartStream');
          this.setStreamStatusUI(true);
        } catch (e) { alert('Error al iniciar stream: ' + e.message); }
      }
    }
  }

  setStreamStatusUI(isLive) {
    this.state.isStreaming = isLive;
    const btn = document.getElementById('btnStreamToggle');
    const badgeText = document.getElementById('streamStatusText');
    if (btn) btn.className = `btn-stream ${isLive ? 'on' : 'off'}`;
    if (badgeText) badgeText.textContent = isLive ? 'EN VIVO' : 'TRANSMISIÓN';
  }

  toggleMobileView() {
    this.state.mobileMode = !this.state.mobileMode;
    document.body.classList.toggle('mobile-mode', this.state.mobileMode);
    document.body.classList.toggle('mobile-view-active', this.state.mobileMode);
  }

  openConfigModal() {
    const modal = document.getElementById('settingsModal') || document.getElementById('configModal');
    if (modal) modal.classList.add('open');
    if (modal) modal.classList.add('active');
  }

  closeConfigModal() {
    const modal = document.getElementById('settingsModal') || document.getElementById('configModal');
    if (modal) modal.classList.remove('open');
    if (modal) modal.classList.remove('active');
  }

  saveObsSettings() {
    this.saveConfigAndConnect();
  }

  saveConfigAndConnect() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    this.config.host = getVal('obsIpInput') || getVal('cfgHost') || 'localhost';
    this.config.port = getVal('obsPortInput') || getVal('cfgPort') || '4455';
    this.config.password = getVal('obsPassInput') || getVal('cfgPassword');
    this.config.sources.audioNarrador = getVal('srcAudioNarrador') || 'NARRADOR';
    this.config.sources.audioAmbiente = getVal('srcAudioAmbiente') || 'AMBIENTE';
    this.config.sources.audioMic2 = getVal('srcAudioMic2') || 'Música';
    this.config.sources.audioAux4 = getVal('srcAudioAux4') || 'Mezclador 4';
    this.config.streamServer = getVal('streamServerInput') || 'rtmps://live-api-s.facebook.com:443/rtmp/';
    this.config.streamKey = getVal('streamKeyInput');

    this.saveLocalStorage();
    this.closeConfigModal();
    this.setupOBS();
  }

  selectStreamPlatform(platform) {
    this.config.streamPlatform = platform;
    const serverInput = document.getElementById('streamServerInput');
    
    const servers = {
      facebook: 'rtmps://live-api-s.facebook.com:443/rtmp/',
      youtube: 'rtmp://a.rtmp.youtube.com/live2',
      tiktok: 'rtmp://push-rtmp-f5-tt.tiktokcdn.com/game/',
      custom: serverInput ? serverInput.value : ''
    };

    if (serverInput && platform !== 'custom') {
      serverInput.value = servers[platform] || '';
      this.config.streamServer = serverInput.value;
    }

    const btnFB = document.getElementById('btnPlatFB');
    const btnYT = document.getElementById('btnPlatYT');
    const btnTT = document.getElementById('btnPlatTT');
    const btnCustom = document.getElementById('btnPlatCustom');

    if (btnFB) btnFB.classList.toggle('active', platform === 'facebook');
    if (btnYT) btnYT.classList.toggle('active', platform === 'youtube');
    if (btnTT) btnTT.classList.toggle('active', platform === 'tiktok');
    if (btnCustom) btnCustom.classList.toggle('active', platform === 'custom');
  }

  toggleShowStreamKey() {
    const input = document.getElementById('streamKeyInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  async applyStreamSettingsToOBS() {
    if (!this.connected || !this.obs) return;
    const server = this.config.streamServer || 'rtmps://live-api-s.facebook.com:443/rtmp/';
    const key = this.config.streamKey;
    if (!key) return;

    try {
      await this.obs.call('SetStreamServiceSettings', {
        streamServiceType: 'rtmp_custom',
        streamServiceSettings: {
          server: server,
          key: key
        }
      });
      console.log('Servicio y Clave de Transmisión actualizados en OBS WebSocket.');
    } catch (err) {
      try {
        await this.obs.call('SetStreamServiceSettings', {
          streamServiceType: 'rtmp_common',
          streamServiceSettings: {
            service: 'Custom...',
            server: server,
            key: key
          }
        });
      } catch (e2) {
        console.warn('Error al configurar Stream Service en OBS:', e2);
      }
    }
  }

  // --- SISTEMA DE EFECTOS DE SONIDO Y RUTEO DE AUDIO ---
  setAudioRouting(mode) {
    this.state.audioRouting = mode; // 'local', 'obs', 'both'
    const btnLocal = document.getElementById('btnRouteLocal');
    const btnOBS = document.getElementById('btnRouteOBS');
    const btnBoth = document.getElementById('btnRouteBoth');

    if (btnLocal) btnLocal.classList.toggle('active', mode === 'local');
    if (btnOBS) btnOBS.classList.toggle('active', mode === 'obs');
    if (btnBoth) btnBoth.classList.toggle('active', mode === 'both');

    this.saveLocalStorage();
  }

  async playSound(soundKey, customUrl = null) {
    const mode = this.state.audioRouting || 'both';
    const soundFileMap = {
      'aplausos': 'sounds/aplausos.wav',
      'organo': 'sounds/organo.wav',
      'batazo': 'sounds/batazo.wav',
      'out_bell': 'sounds/out_bell.wav'
    };

    const targetUrl = customUrl || soundFileMap[soundKey] || `sounds/${soundKey}.wav`;

    // 1. Reproducir Localmente (Celular / Navegador PC)
    if (mode === 'local' || mode === 'both') {
      try {
        const audio = new Audio(targetUrl);
        audio.play().catch(() => {
          if (!customUrl) this.playSynthesizedSound(soundKey);
        });
      } catch (e) {
        if (!customUrl) this.playSynthesizedSound(soundKey);
      }
    }

    // 2. Enviar a OBS (Transmisión en Vivo)
    if (mode === 'obs' || mode === 'both') {
      if (this.connected && this.obs) {
        try {
          const targetName = await this.resolveOBSInputName('FX_Audio');
          if (targetName) {
            await this.obs.call('TriggerMediaInputAction', {
              inputName: targetName,
              mediaAction: 'OBS_MEDIA_INPUT_ACTION_RESTART'
            });
          }
          await this.obs.call('BroadcastCustomEvent', {
            eventData: {
              type: 'BASEBALL_PLAY_SOUND',
              soundKey: soundKey,
              customUrl: targetUrl
            }
          });
        } catch (e) {}
      }
    }
  }

  playSynthesizedSound(key) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (key === 'aplausos') {
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        noise.connect(filter);
        filter.connect(ctx.destination);
        noise.start();
      } else if (key === 'organo') {
        const notes = [392, 523.25, 659.25, 783.99, 659.25, 783.99]; // G4, C5, E5, G5, E5, G5
        const times = [0, 0.15, 0.3, 0.45, 0.7, 0.85];
        const durations = [0.12, 0.12, 0.12, 0.2, 0.12, 0.4];

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, ctx.currentTime + times[i]);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + times[i] + durations[i]);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + times[i]);
          osc.stop(ctx.currentTime + times[i] + durations[i]);
        });
      } else if (key === 'batazo') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (key === 'out_bell') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch (e) {}
  }

  openAddSoundModal() {
    const modal = document.getElementById('addSoundModal');
    if (modal) modal.classList.add('open', 'active');
  }

  closeAddSoundModal() {
    const modal = document.getElementById('addSoundModal');
    if (modal) modal.classList.remove('open', 'active');
  }

  handleSoundFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.tempSoundData = {
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: e.target.result
      };
      const nameInput = document.getElementById('soundNameInput');
      if (nameInput && !nameInput.value) nameInput.value = this.tempSoundData.name;
    };
    reader.readAsDataURL(file);
  }

  saveCustomSound() {
    const nameInput = document.getElementById('soundNameInput');
    const urlInput = document.getElementById('soundUrlInput');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const url = (this.tempSoundData ? this.tempSoundData.url : (urlInput ? urlInput.value.trim() : ''));

    if (!name) {
      alert('Ingresa un nombre para el botón de sonido.');
      return;
    }

    const newSound = {
      id: 'custom_' + Date.now(),
      name: name,
      url: url || 'sounds/' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.mp3'
    };

    if (!this.state.customSounds) this.state.customSounds = [];
    this.state.customSounds.push(newSound);

    this.renderCustomSoundButtons();
    this.saveLocalStorage();
    this.closeAddSoundModal();

    this.tempSoundData = null;
    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
  }

  renderCustomSoundButtons() {
    const grid = document.getElementById('soundFxGrid');
    if (!grid) return;

    grid.querySelectorAll('.btn-custom-sound').forEach(el => el.remove());

    const addBtn = grid.querySelector('.btn-add-sound');

    (this.state.customSounds || []).forEach(snd => {
      const btn = document.createElement('button');
      btn.className = 'btn-sound-fx btn-custom-sound';
      btn.innerHTML = `🎵 ${snd.name}`;
      btn.onclick = () => this.playSound(snd.id, snd.url);
      if (addBtn) grid.insertBefore(btn, addBtn);
      else grid.appendChild(btn);
    });
  }

  /* ==========================================================================
     MÓDULO DE PATROCINADORES / SPONSOR BANNERS
     ========================================================================== */
  startSponsorAutoRotation() {
    this.stopSponsorAutoRotation();
    const spState = this.state.sponsorsState;
    if (spState && spState.autoRotate && spState.list && spState.list.length > 1) {
      const intervalMs = Math.max(3, (spState.intervalSeconds || 10)) * 1000;
      this.sponsorTimer = setInterval(() => {
        this.nextSponsor();
      }, intervalMs);
    }
  }

  stopSponsorAutoRotation() {
    if (this.sponsorTimer) {
      clearInterval(this.sponsorTimer);
      this.sponsorTimer = null;
    }
  }

  nextSponsor() {
    const spState = this.state.sponsorsState;
    if (!spState || !spState.list || spState.list.length === 0) return;
    spState.currentIndex = (spState.currentIndex + 1) % spState.list.length;
    this.updateSponsorDisplayUI();
    this.saveLocalStorage();
  }

  toggleSponsorVisibility() {
    const spState = this.state.sponsorsState;
    if (!spState) return;
    spState.visible = !spState.visible;
    this.updateSponsorDisplayUI();
    this.saveLocalStorage();
  }

  toggleSponsorAutoRotate() {
    const spState = this.state.sponsorsState;
    if (!spState) return;
    spState.autoRotate = !spState.autoRotate;
    if (spState.autoRotate) {
      this.startSponsorAutoRotation();
    } else {
      this.stopSponsorAutoRotation();
    }
    this.updateSponsorDisplayUI();
    this.saveLocalStorage();
  }

  updateSponsorInterval(sec) {
    const val = parseInt(sec, 10);
    if (isNaN(val) || val < 3) return;
    if (!this.state.sponsorsState) return;
    this.state.sponsorsState.intervalSeconds = val;
    if (this.state.sponsorsState.autoRotate) {
      this.startSponsorAutoRotation();
    }
    this.saveLocalStorage();
  }

  updateSponsorDisplayUI() {
    try {
      if (!this.state.sponsorsState) return;
      const spState = this.state.sponsorsState;

      const current = (spState.list && spState.list.length > 0) 
        ? (spState.list[spState.currentIndex] || spState.list[0]) 
        : { name: 'Sin Patrocinador', slogan: '', logo: '' };

      if (!current) return;

      const nameEl = document.getElementById('currentSponsorDisplay');
      const sloganEl = document.getElementById('currentSloganDisplay');
      const logoEl = document.getElementById('currentSponsorLogoDisplay');
      const badgeEl = document.getElementById('sponsorStatusBadge');
      const visBtn = document.getElementById('btnToggleSponsorVis');
      const autoBtn = document.getElementById('btnToggleAutoRotate');

      if (nameEl) nameEl.textContent = current.name || 'Sin Patrocinador';
      if (sloganEl) sloganEl.textContent = current.slogan || '';
      if (logoEl) {
        if (current.logo) {
          logoEl.src = current.logo;
          logoEl.style.display = 'block';
        } else {
          logoEl.style.display = 'none';
        }
      }

      if (badgeEl) {
        if (spState.visible) {
          badgeEl.textContent = 'VISIBLE';
          badgeEl.style.background = 'rgba(34,197,94,0.2)';
          badgeEl.style.color = '#4ADE80';
        } else {
          badgeEl.textContent = 'OCULTO';
          badgeEl.style.background = 'rgba(239,68,68,0.2)';
          badgeEl.style.color = '#F87171';
        }
      }

      if (visBtn) {
        visBtn.textContent = spState.visible ? '👁️ OCULTAR' : '👁️ MOSTRAR';
      }

      if (autoBtn) {
        autoBtn.textContent = spState.autoRotate ? `🔄 AUTO (${spState.intervalSeconds}s): ON` : '🔄 AUTO: OFF';
      }
    } catch (e) {
      console.error('Error en updateSponsorDisplayUI:', e);
    }
  }

  openSponsorsModal() {
    const modal = document.getElementById('sponsorsModal');
    if (modal) {
      modal.classList.add('open');
      modal.classList.add('active');
      modal.style.display = 'flex';
      this.renderSponsorsListUI();
      const intervalInput = document.getElementById('sponsorIntervalInput');
      if (intervalInput && this.state.sponsorsState) {
        intervalInput.value = this.state.sponsorsState.intervalSeconds || 10;
      }
    }
  }

  closeSponsorsModal() {
    const modal = document.getElementById('sponsorsModal');
    if (modal) {
      modal.classList.remove('open');
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  renderSponsorsListUI() {
    const container = document.getElementById('sponsorsListContainer');
    if (!container || !this.state.sponsorsState) return;

    container.innerHTML = '';

    const list = this.state.sponsorsState.list || [];
    if (list.length === 0) {
      container.innerHTML = '<div style="color:#94A3B8; font-size:0.8rem; text-align:center; padding:10px;">No hay patrocinadores registrados. Agrega uno arriba.</div>';
      return;
    }

    list.forEach((sp, idx) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:rgba(30,41,59,0.8); padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);';
      const isCurrent = idx === this.state.sponsorsState.currentIndex;
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;">
          <img src="${sp.logo || 'https://cdn-icons-png.flaticon.com/512/861/861506.png'}" style="width:28px; height:28px; object-fit:contain; border-radius:4px;" alt="Logo">
          <div style="display:flex; flex-direction:column; overflow:hidden;">
            <span style="font-size:0.82rem; font-weight:800; color:#FFF;">${sp.name} ${isCurrent ? '<span style="color:#F59E0B; font-size:0.65rem;">(ACTUAL)</span>' : ''}</span>
            <span style="font-size:0.68rem; color:#94A3B8;">${sp.slogan || 'Sin slogan'}</span>
          </div>
        </div>
        <button class="btn-action-sm danger" style="padding:4px 8px; font-size:0.65rem;" onclick="app.deleteSponsor(${sp.id})">🗑️ ELIMINAR</button>
      `;
      container.appendChild(item);
    });
  }

  handleSponsorLogoFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a formato WebP comprimido (peso menor a 30KB)
        this.tempSponsorLogo = canvas.toDataURL('image/webp', 0.85);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  addSponsor() {
    const nameInput = document.getElementById('sponsorNameInput');
    const sloganInput = document.getElementById('sponsorSloganInput');
    const urlInput = document.getElementById('sponsorLogoUrlInput');

    const name = nameInput ? nameInput.value.trim() : '';
    const slogan = sloganInput ? sloganInput.value.trim() : '';
    const logo = this.tempSponsorLogo || (urlInput ? urlInput.value.trim() : '');

    if (!name) {
      alert('Ingresa el nombre del patrocinador o marca.');
      return;
    }

    const newSponsor = {
      id: Date.now(),
      name: name,
      slogan: slogan,
      logo: logo || 'https://cdn-icons-png.flaticon.com/512/861/861506.png'
    };

    if (!this.state.sponsorsState) {
      this.state.sponsorsState = { visible: true, currentIndex: 0, intervalSeconds: 10, autoRotate: true, list: [] };
    }

    this.state.sponsorsState.list.push(newSponsor);
    this.tempSponsorLogo = null;
    if (nameInput) nameInput.value = '';
    if (sloganInput) sloganInput.value = '';
    if (urlInput) urlInput.value = '';

    this.renderSponsorsListUI();
    this.updateSponsorDisplayUI();
    this.startSponsorAutoRotation();
    this.saveLocalStorage();
  }

  deleteSponsor(id) {
    if (!this.state.sponsorsState) return;
    this.state.sponsorsState.list = this.state.sponsorsState.list.filter(sp => sp.id !== id);
    if (this.state.sponsorsState.currentIndex >= this.state.sponsorsState.list.length) {
      this.state.sponsorsState.currentIndex = 0;
    }
    this.renderSponsorsListUI();
    this.updateSponsorDisplayUI();
    this.saveLocalStorage();
  }

  /* ==========================================================================
     MÓDULO DE CINTILLO EN MOVIMIENTO (TICKER TAPE)
     ========================================================================== */
  setTickerPreset(type) {
    const presets = {
      bienvenida: '📢 ¡BIENVENIDOS A LA TRANSMISIÓN EN VIVO! | SUSCRÍBETE Y COMPARTE EL STREAM CON TUS AMIGOS ⚾⚽',
      redes: '📱 SÍGUENOS EN NUESTRAS REDES SOCIALES: FACEBOOK, YOUTUBE Y TIKTOK | COMENTA TU EQUIPO FAVORITO EN VIVO',
      patrocinadores: '🏆 AGRADECIMIENTO ESPECIAL A TODOS NUESTROS PATROCINADORES OFICIALES POR HACER POSIBLE ESTE TORNEO',
      aviso: '⚡ REVISIÓN DE JUGADA EN VIVO EN PANTALLA | MANTÉN LA SINTONÍA DE LA TRANSMISIÓN'
    };

    const text = presets[type] || '';
    if (text) {
      const input = document.getElementById('tickerTextInput');
      if (input) input.value = text;
      this.updateTickerText();
    }
  }

  toggleTickerVisibility() {
    if (!this.state.tickerState) {
      this.state.tickerState = { visible: false, text: '¡BIENVENIDOS A LA TRANSMISIÓN EN VIVO!' };
    }
    this.state.tickerState.visible = !this.state.tickerState.visible;
    this.renderTickerUI();
    this.saveLocalStorage();
  }

  updateTickerText() {
    const input = document.getElementById('tickerTextInput');
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) {
      alert('Ingresa un texto para el cintillo de noticias.');
      return;
    }
    if (!this.state.tickerState) {
      this.state.tickerState = { visible: true, text: txt };
    } else {
      this.state.tickerState.text = txt;
      this.state.tickerState.visible = true;
    }
    this.renderTickerUI();
    this.saveLocalStorage();
  }

  renderTickerUI() {
    try {
      if (!this.state.tickerState) return;
      const tkState = this.state.tickerState;

      const input = document.getElementById('tickerTextInput');
      const badge = document.getElementById('tickerStatusBadge');
      const btn = document.getElementById('btnToggleTicker');

      if (input && tkState.text && document.activeElement !== input) {
        input.value = tkState.text;
      }

      if (badge) {
        if (tkState.visible) {
          badge.textContent = 'VISIBLE';
          badge.style.background = 'rgba(34,197,94,0.2)';
          badge.style.color = '#4ADE80';
        } else {
          badge.textContent = 'OCULTO';
          badge.style.background = 'rgba(239,68,68,0.2)';
          badge.style.color = '#F87171';
        }
      }

      if (btn) {
        btn.textContent = tkState.visible ? '👁️ OCULTAR CINTILLO' : '👁️ MOSTRAR CINTILLO';
      }
    } catch (e) {
      console.error('Error en renderTickerUI:', e);
    }
  }

  /* ==========================================================================
     MÓDULO DE FONDOS DE ESCENAS PERSONALIZADOS
     ========================================================================== */
  openSceneBackgroundsModal() {
    const modal = document.getElementById('sceneBackgroundsModal');
    if (modal) {
      modal.classList.add('open');
      modal.classList.add('active');
      modal.style.display = 'flex';
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
    }
  }

  closeSceneBackgroundsModal() {
    const modal = document.getElementById('sceneBackgroundsModal');
    if (modal) {
      modal.classList.remove('open');
      modal.classList.remove('active');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
    }
  }

  handleSceneBgUpload(sceneKey, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxW = 1280;
        const maxH = 720;

        if (width > maxW || height > maxH) {
          if (width / height > maxW / maxH) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedWebP = canvas.toDataURL('image/webp', 0.82);

        if (!this.state.customSceneBackgrounds) {
          this.state.customSceneBackgrounds = {};
        }

        this.state.customSceneBackgrounds[sceneKey] = compressedWebP;
        this.renderUI();
        this.saveLocalStorage();
        alert(`✅ ¡Fondo personalizado para "${sceneKey.toUpperCase()}" guardado exitosamente!`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  resetSceneBackground(sceneKey) {
    if (this.state.customSceneBackgrounds && this.state.customSceneBackgrounds[sceneKey]) {
      delete this.state.customSceneBackgrounds[sceneKey];
      this.renderUI();
      this.saveLocalStorage();
      alert(`✅ Fondo de "${sceneKey.toUpperCase()}" restablecido a la imagen por defecto.`);
    }
  }
}

// Inicializar la aplicación globalmente (window.app)
var app;
function initBaseballApp() {
  try {
    window.app = new BaseballOBSApp();
    app = window.app;
  } catch (e) {
    console.error('Error al inicializar BaseballOBSApp:', e);
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initBaseballApp();
} else {
  window.addEventListener('DOMContentLoaded', initBaseballApp);
}
