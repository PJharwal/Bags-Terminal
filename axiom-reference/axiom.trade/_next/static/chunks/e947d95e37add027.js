!(function () {
  try {
    var e =
        "undefined" != typeof globalThis
          ? globalThis
          : "undefined" != typeof global
          ? global
          : "undefined" != typeof window
          ? window
          : "undefined" != typeof self
          ? self
          : {},
      n = new e.Error().stack;
    n &&
      ((e._debugIds || (e._debugIds = {}))[n] =
        "36cdb5ae-dba5-bc73-4fd0-ec90b10dc722");
  } catch (e) {}
})();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  178875,
  (e) => {
    "use strict";
    var t,
      s,
      r = e.i(247167),
      a = e.i(504764),
      i = e.i(626335);
    class n {
      ws = null;
      url;
      userId;
      reconnectAttempts = 0;
      reconnectTimer = null;
      maxReconnectDelay = 5e3;
      baseReconnectDelay = 250;
      shouldReconnect = !0;
      visibilityTimer = null;
      isTabHidden = !1;
      hiddenDisconnectDelay = 6e5;
      onMessageCallback = null;
      onConnectionCallback = null;
      onErrorCallback = null;
      currentUserState = null;
      constructor(e, t) {
        (this.url = e), (this.userId = t);
      }
      connect() {
        if (
          !this.ws ||
          (this.ws.readyState !== WebSocket.CONNECTING &&
            this.ws.readyState !== WebSocket.OPEN)
        )
          try {
            let e = this.buildUrlWithAuth();
            (this.ws = new WebSocket(e)), this.setupEventHandlers();
          } catch (e) {
            this.handleError(e), this.scheduleReconnect();
          }
      }
      buildUrlWithAuth() {
        let e = new URL(this.url);
        return (
          r.default.env.NEXT_PUBLIC_LOCAL_PULSE_WS_PASS &&
            1 &&
            "wss://pulse.axiom.trade/ws,wss://pulse2.axiom.trade/ws"
              .split(",")
              .map((e) => e.trim())
              .some((e) => this.url.startsWith(e)) &&
            (e.searchParams.append(
              "localhost-password",
              r.default.env.NEXT_PUBLIC_LOCAL_PULSE_WS_PASS
            ),
            e.searchParams.append("user-id", this.userId)),
          e.toString()
        );
      }
      disconnect() {
        (this.shouldReconnect = !1),
          this.clearTimers(),
          this.ws && (this.ws.close(), (this.ws = null)),
          this.onConnectionCallback && this.onConnectionCallback(!1);
      }
      sendUserState(e) {
        (this.currentUserState = e),
          this.sendMessage({ type: "userState", state: e });
      }
      sendUserStateUpdate(e) {
        this.currentUserState
          ? (this.currentUserState = { ...this.currentUserState, ...e })
          : (this.currentUserState = e),
          this.isConnected() &&
            this.sendMessage({ type: "userState", state: e });
      }
      setVisibility(e) {
        (this.isTabHidden = e),
          e
            ? (this.clearVisibilityTimer(),
              (this.visibilityTimer = self.setTimeout(() => {
                this.isTabHidden && this.disconnect();
              }, this.hiddenDisconnectDelay)))
            : (this.clearVisibilityTimer(),
              (this.ws && this.ws.readyState !== WebSocket.CLOSED) ||
                ((this.shouldReconnect = !0), this.connect()));
      }
      onMessage(e) {
        this.onMessageCallback = e;
      }
      onConnectionChange(e) {
        this.onConnectionCallback = e;
      }
      onError(e) {
        this.onErrorCallback = e;
      }
      isConnected() {
        return null !== this.ws && this.ws.readyState === WebSocket.OPEN;
      }
      setupEventHandlers() {
        this.ws &&
          ((this.ws.onopen = () => {
            if (
              ((this.reconnectAttempts = 0),
              this.onConnectionCallback && this.onConnectionCallback(!0),
              this.currentUserState)
            ) {
              let e = { type: "userState", state: this.currentUserState };
              this.sendMessage(e);
            }
          }),
          (this.ws.onclose = () => {
            this.onConnectionCallback && this.onConnectionCallback(!1),
              this.shouldReconnect && this.scheduleReconnect();
          }),
          (this.ws.onerror = (e) => {
            let t = Error(`WebSocket error: ${e.type}`);
            this.handleError(t);
          }),
          (this.ws.onmessage = (e) => {
            try {
              let t;
              if (e.data instanceof Blob)
                return void e.data
                  .arrayBuffer()
                  .then((e) => {
                    let t = new Uint8Array(e),
                      s = (0, i.decode)(t);
                    this.onMessageCallback && this.onMessageCallback(s);
                  })
                  .catch((e) => {
                    this.handleError(Error(`Failed to decode Blob: ${e}`));
                  });
              if (e.data instanceof ArrayBuffer) {
                let s = new Uint8Array(e.data);
                t = (0, i.decode)(s);
              } else t = JSON.parse(e.data);
              this.onMessageCallback && this.onMessageCallback(t);
            } catch (e) {
              this.handleError(Error(`Failed to parse message: ${e}`));
            }
          }));
      }
      sendMessage(e) {
        this.isConnected() && this.ws?.send(JSON.stringify(e));
      }
      scheduleReconnect() {
        if (null !== this.reconnectTimer) return;
        this.reconnectAttempts++;
        let e = Math.min(
          this.baseReconnectDelay * 2 ** (this.reconnectAttempts - 1),
          this.maxReconnectDelay
        );
        this.reconnectTimer = self.setTimeout(() => {
          (this.reconnectTimer = null), this.shouldReconnect && this.connect();
        }, e);
      }
      clearVisibilityTimer() {
        null !== this.visibilityTimer &&
          (clearTimeout(this.visibilityTimer), (this.visibilityTimer = null));
      }
      clearTimers() {
        this.clearVisibilityTimer(),
          null !== this.reconnectTimer &&
            (clearTimeout(this.reconnectTimer), (this.reconnectTimer = null));
      }
      handleError(e) {
        console.error("[PulseWebSocketManager] Error:", e),
          this.onErrorCallback && this.onErrorCallback(e);
      }
      cleanup() {
        this.disconnect(),
          (this.onMessageCallback = null),
          (this.onConnectionCallback = null),
          (this.onErrorCallback = null),
          (this.currentUserState = null);
      }
    }
    var o = e.i(898892);
    class l {
      static buildOperations(e, t) {
        let s = [],
          r = Math.min(t.length, a.MAX_PULSE_ROWS),
          i = new Map();
        for (let t = 0, s = e.length; t < s; t++) {
          let s = e[t];
          i.set(s.pairAddress, { item: s, index: t });
        }
        let n = new Set();
        for (let e = 0; e < r; e++) n.add(t[e].pairAddress);
        let l = new Set();
        for (let e = 0; e < r; e++) {
          let r = t[e],
            a = i.get(r.pairAddress);
          if (a) {
            l.add(r.pairAddress);
            let { hasChanges: t, changes: i } = (function (e, t) {
                let s = {},
                  r = !1;
                if (e === t) return { hasChanges: !1, changes: s };
                if (null == e) return { hasChanges: !0, changes: t };
                for (let a of d) {
                  let i = e[a],
                    n = t[a];
                  i !== n &&
                    (void 0 === n ||
                      (0, o.default)(i, n) ||
                      ((s[a] = n), (r = !0)));
                }
                return { hasChanges: r, changes: s };
              })(a.item, r),
              n = a.index !== e;
            (t || n) &&
              s.push({
                type: "update",
                item: {
                  ...i,
                  pairAddress: r.pairAddress,
                  tokenAddress: r.tokenAddress,
                },
                index: n ? e : void 0,
              });
          } else s.push({ type: "insert", index: e, item: r });
        }
        for (let t = 0, r = e.length; t < r; t++) {
          let r = e[t];
          n.has(r.pairAddress) ||
            l.has(r.pairAddress) ||
            s.push({ type: "remove", pairAddress: r.pairAddress });
        }
        return s;
      }
    }
    let d = [
      "pairAddress",
      "tokenAddress",
      "tokenName",
      "tokenTicker",
      "tokenImage",
      "tokenDecimals",
      "protocol",
      "protocolDetails",
      "devAddress",
      "extra",
      "website",
      "twitter",
      "twitterHandle",
      "twitterFollowers",
      "twitterFollowing",
      "telegram",
      "discord",
      "twitterHandleHistory",
      "createdAt",
      "volumeSol",
      "marketCapSol",
      "liquiditySol",
      "liquidityToken",
      "userCount",
      "top10Holders",
      "top10HoldersPercent",
      "numHolders",
      "numBotUsers",
      "devHoldsPercent",
      "snipersHoldPercent",
      "insidersHoldPercent",
      "bundlersHoldPercent",
      "bondingCurvePercent",
      "lpBurned",
      "freezeAuthority",
      "mintAuthority",
      "dexPaid",
      "deployerAddress",
      "openTrading",
      "updatedAt",
      "slot",
      "signature",
      "tokenUri",
      "pairSolAccount",
      "pairTokenAccount",
      "initialLiquiditySol",
      "initialLiquidityToken",
      "feesSol",
      "numTxns",
      "numBuys",
      "numSells",
      "numTradingBotUsers",
      "migrationCount",
      "devSold",
      "devWalletFunding",
      "kolCount",
      "devPairCount",
      "tweetCreatedAt",
      "tweetPreview",
      "isPumpLive",
      "imgReuseCount",
      "translation",
      "thumbnail",
    ];
    var c = e.i(91554);
    ((t = {})[(t.ReplaceTables = 0)] = "ReplaceTables"),
      (t[(t.UpdateRow = 1)] = "UpdateRow"),
      (t[(t.AddRow = 2)] = "AddRow"),
      (t[(t.RemoveRow = 3)] = "RemoveRow"),
      (t[(t.RemoveMigratedFromBlacklist = 4)] = "RemoveMigratedFromBlacklist");
    let u = [
      "pairAddress",
      "tokenAddress",
      "devAddress",
      "tokenName",
      "tokenTicker",
      "tokenImage",
      "tokenDecimals",
      "protocol",
      "protocolDetails",
      "website",
      "twitter",
      "telegram",
      "discord",
      "top10HoldersPercent",
      "devHoldsPercent",
      "snipersHoldPercent",
      "insidersHoldPercent",
      "bundlersHoldPercent",
      "volumeSol",
      "marketCapSol",
      "feesSol",
      "liquiditySol",
      "liquidityToken",
      "numTxns",
      "numBuys",
      "numSells",
      "bondingCurvePercent",
      "supply",
      "numHolders",
      "numTradingBotUsers",
      "createdAt",
      "extra",
      "slot",
      "migrationCount",
      "openTrading",
      "isPumpLive",
      "twitterHandleHistory",
      "devSold",
      "dexPaid",
      "devWalletFunding",
      "kolCount",
      "devPairCount",
      "tweetCreatedAt",
      "imgReuseCount",
      "translation",
      "userCount",
      "twitterHandle",
      "twitterFollowers",
      "twitterFollowing",
    ];
    function h(e, t) {
      return e.bondingCurvePercent === t.bondingCurvePercent
        ? 0
        : t.bondingCurvePercent - e.bondingCurvePercent;
    }
    function p(e, t) {
      let s = e.createdAt,
        r = t.createdAt;
      if (!s || !r) return 0;
      let a = s instanceof Date ? s.getTime() : new Date(s).getTime();
      return (r instanceof Date ? r.getTime() : new Date(r).getTime()) - a;
    }
    function g(e) {
      return {
        pairAddress: e[0],
        tokenAddress: e[1],
        devAddress: e[2],
        tokenName: e[3],
        tokenTicker: e[4],
        tokenImage: e[5],
        tokenDecimals: e[6],
        protocol: e[7],
        protocolDetails: e[8],
        website: e[9],
        twitter: e[10],
        telegram: e[11],
        discord: e[12],
        top10HoldersPercent: e[13],
        devHoldsPercent: e[14],
        snipersHoldPercent: e[15],
        insidersHoldPercent: e[16],
        bundlersHoldPercent: e[17],
        volumeSol: e[18],
        marketCapSol: e[19],
        feesSol: e[20],
        liquiditySol: e[21],
        liquidityToken: e[22],
        numTxns: e[23],
        numBuys: e[24],
        numSells: e[25],
        bondingCurvePercent: e[26],
        numHolders: e[28],
        numTradingBotUsers: e[29],
        createdAt: e[30] ? new Date(e[30]) : null,
        extra: e[31],
        migrationCount: e[33],
        openTrading: e[34] ? new Date(e[34]) : null,
        isPumpLive: e[35],
        twitterHandleHistory: e[36],
        devSold: e[37],
        dexPaid: e[38],
        devWalletFunding: e[39],
        kolCount: e[40],
        devPairCount: e[41],
        tweetCreatedAt: e[42] ? new Date(e[42]) : null,
        imgReuseCount: e[43],
        translation: e[44],
        userCount: e[45] ?? 0,
        twitterHandle: e[46] ?? null,
        twitterFollowers: e[47] ?? null,
        twitterFollowing: e[48] ?? null,
      };
    }
    function m(e, t) {
      let s = { ...e };
      for (let e = 0, r = t.length; e < r; e++) {
        let [r, a] = t[e],
          i = u[r];
        i && "supply" !== i && "slot" !== i && (s[i] = a);
      }
      return s;
    }
    class S {
      regularState = { newPairs: [], finalStretch: [], migrated: [] };
      pausedState = { newPairs: null, finalStretch: null, migrated: null };
      pause(e, t) {
        let s = new Map(),
          r = [];
        for (let e of t) s.set(e.pairAddress, e), r.push(e.pairAddress);
        return (this.pausedState[e] = s), (this.regularState[e] = [...t]), r;
      }
      unpause(e) {
        this.pausedState[e] = null;
      }
      isPaused(e) {
        return null !== this.pausedState[e];
      }
      updatePausedRow(e, t, s) {
        let r = this.pausedState[e];
        if (!r) return !1;
        let a = r.get(t);
        if (!a) return !1;
        let i = { ...a, ...s };
        return r.set(t, i), !0;
      }
      getPausedRows(e) {
        let t = this.pausedState[e];
        return t ? Array.from(t.values()) : [];
      }
      getPausedRow(e, t) {
        let s = this.pausedState[e];
        if (s) return s.get(t);
      }
      getPausedPairAddresses(e) {
        let t = this.pausedState[e];
        return t ? Array.from(t.keys()) : [];
      }
      getRegularRows(e) {
        return this.regularState[e];
      }
      setRegularRows(e, t) {
        this.regularState[e] = t;
      }
      updateRegularRow(e, t, s) {
        let r = this.regularState[e],
          a = r.findIndex((e) => e.pairAddress === t);
        return -1 !== a && ((r[a] = { ...r[a], ...s }), !0);
      }
      addRegularRow(e, t, s) {
        this.regularState[e].splice(s, 0, t);
      }
      removeRegularRow(e, t) {
        let s = this.regularState[e],
          r = s.findIndex((e) => e.pairAddress === t);
        return -1 !== r && (s.splice(r, 1), !0);
      }
      clearAll() {
        (this.regularState = { newPairs: [], finalStretch: [], migrated: [] }),
          (this.pausedState = {
            newPairs: null,
            finalStretch: null,
            migrated: null,
          });
      }
      clearTable(e) {
        (this.regularState[e] = []), (this.pausedState[e] = null);
      }
    }
    var f = e.i(447800),
      w = e.i(323954),
      b = e.i(944325),
      P =
        (((s = {})[(s.CONNECTING = 0)] = "CONNECTING"),
        (s[(s.OPEN = 1)] = "OPEN"),
        (s[(s.CLOSING = 2)] = "CLOSING"),
        (s[(s.CLOSED = 3)] = "CLOSED"),
        (s[(s.UNINSTANTIATED = -1)] = "UNINSTANTIATED"),
        s);
    class R {
      ws = null;
      url;
      queryParams;
      instanceId;
      activeRooms = new Set();
      reconnectAttempts = 0;
      maxReconnectAttempts;
      reconnectInterval;
      reconnectTimer = null;
      heartbeatTimer = null;
      retryOnError;
      visibilityTimer = null;
      isTabHidden = !1;
      tabHiddenTimestamp = null;
      autoRefreshDisabled = !1;
      shouldAutoReconnect = !0;
      onMessage;
      onStateChange;
      onError;
      onConnected;
      onDisconnected;
      constructor(e, t, s = {}, r, a = {}) {
        (this.url = e),
          (this.instanceId = t),
          (this.queryParams = s),
          (this.onMessage = r.onMessage),
          (this.onStateChange = r.onStateChange),
          (this.onError = r.onError),
          (this.onConnected = r.onConnected),
          (this.onDisconnected = r.onDisconnected),
          (this.maxReconnectAttempts = a.maxReconnectAttempts ?? 50),
          (this.reconnectInterval = a.reconnectInterval ?? 250),
          (this.retryOnError = a.retryOnError ?? !0);
      }
      connect() {
        if (!(this.isConnected() || this.isConnecting()))
          try {
            let e = this.buildUrlWithParams();
            (this.ws = new WebSocket(e)),
              this.setupEventHandlers(),
              this.onStateChange(P.CONNECTING);
          } catch (e) {
            this.handleError(e);
          }
      }
      disconnect() {
        (this.shouldAutoReconnect = !1),
          this.clearTimers(),
          this.ws &&
            (this.activeRooms.forEach((e) => {
              this.sendLeaveMessage(e);
            }),
            this.ws.close(),
            (this.ws = null)),
          this.activeRooms.clear(),
          this.onStateChange(P.CLOSED),
          this.onDisconnected();
      }
      joinRoom(e) {
        !this.activeRooms.has(e) &&
          (this.activeRooms.add(e),
          this.isConnected() && this.sendJoinMessage(e));
      }
      leaveRoom(e) {
        this.activeRooms.has(e) &&
          (this.activeRooms.delete(e),
          this.isConnected() && this.sendLeaveMessage(e));
      }
      sendMessage(e) {
        this.isConnected() && this.ws?.send(JSON.stringify(e));
      }
      ping() {
        this.sendMessage({ method: "ping" });
      }
      setVisibility(e, t = Date.now()) {
        (this.isTabHidden = e),
          e
            ? ((this.tabHiddenTimestamp = t), this.startVisibilityTimer())
            : (this.clearVisibilityTimer(),
              (this.tabHiddenTimestamp = null),
              !this.isConnected() &&
                this.shouldAutoReconnect &&
                this.connect());
      }
      setAutoRefresh(e) {
        (this.autoRefreshDisabled = e),
          e
            ? this.clearVisibilityTimer()
            : this.isTabHidden &&
              this.tabHiddenTimestamp &&
              this.startVisibilityTimer();
      }
      setupEventHandlers() {
        this.ws &&
          ((this.ws.onopen = () => {
            (this.reconnectAttempts = 0),
              this.onStateChange(P.OPEN),
              this.onConnected(),
              this.activeRooms.forEach((e) => {
                this.sendJoinMessage(e);
              }),
              this.startHeartbeat();
          }),
          (this.ws.onclose = () => {
            this.onStateChange(P.CLOSED),
              this.stopHeartbeat(),
              this.shouldAutoReconnect &&
              this.reconnectAttempts < this.maxReconnectAttempts
                ? this.scheduleReconnect()
                : this.onDisconnected();
          }),
          (this.ws.onerror = (e) => {
            let t = Error(`WebSocket error: ${e.type}`);
            this.handleError(t),
              this.retryOnError &&
                this.shouldAutoReconnect &&
                this.reconnectAttempts < this.maxReconnectAttempts &&
                this.scheduleReconnect();
          }),
          (this.ws.onmessage = (e) => {
            try {
              let t = JSON.parse(e.data);
              this.onMessage(t);
            } catch (e) {
              this.handleError(Error(`Failed to parse message: ${e}`));
            }
          }));
      }
      buildUrlWithParams() {
        let e = new URL(this.url);
        return (
          r.default.env.NEXT_PUBLIC_LOCAL_WS_PASSWORD &&
            Object.values(b.REGION_MAP).some((e) =>
              e.some((e) => e === this.url)
            ) &&
            e.searchParams.append(
              "localhost-password",
              r.default.env.NEXT_PUBLIC_LOCAL_WS_PASSWORD
            ),
          Object.entries(this.queryParams).forEach(([t, s]) => {
            e.searchParams.append(t, s);
          }),
          e.toString()
        );
      }
      sendJoinMessage(e) {
        this.sendMessage({ action: "join", room: e });
      }
      sendLeaveMessage(e) {
        this.sendMessage({ action: "leave", room: e });
      }
      startHeartbeat() {
        this.stopHeartbeat(),
          (this.heartbeatTimer = self.setInterval(() => {
            this.isConnected() && this.ping();
          }, 3e4));
      }
      stopHeartbeat() {
        this.heartbeatTimer &&
          (clearInterval(this.heartbeatTimer), (this.heartbeatTimer = null));
      }
      startVisibilityTimer() {
        this.autoRefreshDisabled ||
          (this.clearVisibilityTimer(),
          (this.visibilityTimer = self.setInterval(() => {
            this.tabHiddenTimestamp &&
              Date.now() - this.tabHiddenTimestamp >= 6e5 &&
              (this.activeRooms.forEach((e) => {
                this.leaveRoom(e);
              }),
              this.clearVisibilityTimer());
          }, 1e3)));
      }
      clearVisibilityTimer() {
        this.visibilityTimer &&
          (clearInterval(this.visibilityTimer), (this.visibilityTimer = null));
      }
      scheduleReconnect() {
        this.reconnectAttempts++;
        let e = this.reconnectInterval;
        this.reconnectTimer = self.setTimeout(() => {
          this.shouldAutoReconnect && this.connect();
        }, e);
      }
      clearTimers() {
        this.stopHeartbeat(),
          this.clearVisibilityTimer(),
          this.reconnectTimer &&
            (clearTimeout(this.reconnectTimer), (this.reconnectTimer = null));
      }
      handleError(e) {
        console.error(`[RegionalWebSocketManager][${this.instanceId}] Error:`, {
          message: e.message,
          url: this.url,
          readyState: this.ws ? P[this.ws.readyState] : "No connection",
          timestamp: new Date().toISOString(),
        }),
          this.onError(e);
      }
      isConnected() {
        return null !== this.ws && this.ws.readyState === P.OPEN;
      }
      isConnecting() {
        return null !== this.ws && this.ws.readyState === P.CONNECTING;
      }
      getReadyState() {
        return this.ws ? this.ws.readyState : P.CLOSED;
      }
      getActiveRooms() {
        return Array.from(this.activeRooms);
      }
    }
    let y = new (class {
        state;
        pausedStateManager;
        sharedPauseState = null;
        constructor() {
          (this.state = this.createInitialState()),
            (this.pausedStateManager = new S());
        }
        createInitialState() {
          return {
            websocketManager: null,
            connectionStatus: "disconnected",
            userState: null,
            pauseStates: { newPairs: !1, finalStretch: !1, migrated: !1 },
            tableVersions: { newPairs: 0, finalStretch: 0, migrated: 0 },
            isTabHidden: !1,
            isPageActive: !0,
            searchQueries: { newPairs: "", finalStretch: "", migrated: "" },
            usdPerSol: f.FALLBACK_USD_PER_SOL,
          };
        }
        getState() {
          return this.state;
        }
        getWebSocketManager() {
          return this.state.websocketManager;
        }
        getConnectionStatus() {
          return this.state.connectionStatus;
        }
        getUserState() {
          return this.state.userState;
        }
        isTablePaused(e) {
          return this.sharedPauseState
            ? this.sharedPauseState.isPaused(e)
            : this.state.pauseStates[e];
        }
        isTabHidden() {
          return this.state.isTabHidden;
        }
        isPageActive() {
          return this.state.isPageActive;
        }
        getSearchQuery(e) {
          return this.state.searchQueries[e];
        }
        getUsdPerSol() {
          return this.state.usdPerSol;
        }
        setWebSocketManager(e) {
          this.state.websocketManager = e;
        }
        setConnectionStatus(e) {
          this.state.connectionStatus = e;
        }
        setUserState(e) {
          this.state.userState = e;
        }
        updateUserState(e) {
          this.state.userState
            ? (this.state.userState = { ...this.state.userState, ...e })
            : (this.state.userState = e);
        }
        setPauseState(e, t) {
          this.state.pauseStates[e] = t;
        }
        setSharedPauseState(e) {
          if (((this.sharedPauseState = e), this.sharedPauseState)) {
            let e = this.sharedPauseState.getAllPauseStates();
            this.state.pauseStates = e;
          }
        }
        hasSharedPauseState() {
          return null !== this.sharedPauseState;
        }
        setTabHidden(e) {
          this.state.isTabHidden = e;
        }
        setPageActive(e) {
          this.state.isPageActive = e;
        }
        setSearchQuery(e, t) {
          this.state.searchQueries[e] = t;
        }
        setUsdPerSol(e) {
          this.state.usdPerSol = e;
        }
        reset() {
          let e = this.state.websocketManager;
          (this.state = this.createInitialState()),
            e && (this.state.websocketManager = e),
            this.pausedStateManager.clearAll();
        }
        getPausedStateManager() {
          return this.pausedStateManager;
        }
        getTableVersion(e) {
          return this.state.tableVersions[e];
        }
        setTableVersion(e, t) {
          this.state.tableVersions[e] = t;
        }
        resetTableVersions() {
          this.state.tableVersions = {
            newPairs: 0,
            finalStretch: 0,
            migrated: 0,
          };
        }
      })(),
      T = y.getPausedStateManager(),
      A = null,
      k = new Map(),
      C = new Set(),
      v = [],
      E = new Set(),
      M = [],
      U = new Map(),
      O = 0,
      H = new Map(),
      L = new Set(),
      _ = [],
      D = new Set(["tweet", "profile", "community"]);
    function I(e) {
      try {
        self.postMessage(e);
      } catch (t) {
        if (
          (console.error("[PulseWorker] Failed to send message:", t),
          "ERROR" === e.type)
        )
          return void console.error(
            "[PulseWorker] Original error payload:",
            e.payload
          );
        try {
          self.postMessage({
            type: "ERROR",
            payload: {
              error: "Failed to send message due to DataCloneError",
              details: {
                messageType: e.type,
                errorMessage: t instanceof Error ? t.message : String(t),
              },
            },
          });
        } catch {
          console.error(
            "[PulseWorker] Could not send error notification to main thread"
          );
        }
      }
    }
    function N(e, t) {
      I({
        type: "ERROR",
        payload: {
          error: e,
          details: (function e(t) {
            if (t instanceof Error)
              return {
                name: t.name,
                message: t.message,
                stack: t.stack,
                cause: "cause" in t && t.cause ? e(t.cause) : void 0,
              };
            if (null === t) return "null";
            if (void 0 === t) return "undefined";
            if ("string" == typeof t) return t;
            if ("number" == typeof t || "boolean" == typeof t) return String(t);
            try {
              let e = new WeakSet();
              return {
                type: "unknown",
                value: JSON.stringify(t, (t, s) => {
                  if ("object" == typeof s && null !== s) {
                    if (e.has(s)) return "[Circular]";
                    e.add(s);
                  }
                  return "function" == typeof s
                    ? "[Function]"
                    : "symbol" == typeof s || "bigint" == typeof s
                    ? s.toString()
                    : s;
                }),
              };
            } catch {
              return { type: "unknown", value: String(t) };
            }
          })(t),
        },
      });
    }
    function W(e) {
      0 !== e.length && I({ type: "REMOVE_BLACKLIST", payload: { keys: e } });
    }
    function x(e, t) {
      0 === t.length ||
        (y.isPageActive() &&
          I({
            type: "DATA_OPERATIONS",
            payload: { table: e, operations: t, version: y.getTableVersion(e) },
          }));
    }
    function V(e, t) {
      y.isPageActive() && I({ type: "REPLACE", table: e, items: t });
    }
    function B(e) {
      return "finalStretch" === e ? h : p;
    }
    function F(e, t) {
      let s = y.getSearchQuery(t);
      if (!s || "" === s.trim()) return e;
      let r = s.trim().toLowerCase(),
        a = r.includes(" "),
        i = [];
      for (let t = 0, s = e.length; t < s; t++) {
        let s = e[t],
          n = (s.tokenName || "").toLowerCase();
        if (n.includes(r)) {
          i.push(s);
          continue;
        }
        let o = (s.tokenTicker || "").toLowerCase();
        if (o.includes(r)) {
          i.push(s);
          continue;
        }
        a && `${n} ${o}`.includes(r) && i.push(s);
      }
      return i;
    }
    function Q(e, t, s) {
      return e.filter((e) => (0, w.applyBlacklistTokenFilterOnly)(e, t, s));
    }
    function $(e, t) {
      let s = y.getUserState();
      if (!s) return e;
      let r = y.getSearchQuery(t),
        a = s.filters[t],
        i = y.getUsdPerSol();
      return e.filter((e) =>
        (0, w.applyFilters)(e, a, t, i, s.showHiddenPulseTokens, s.blacklist, r)
      );
    }
    function q(e, t) {
      let s = y.getSearchQuery(t);
      if (!s || "" === s.trim()) return !0;
      let r = s.trim().toLowerCase(),
        a = r.includes(" "),
        i = (e.tokenName || "").toLowerCase();
      if (i.includes(r)) return !0;
      let n = (e.tokenTicker || "").toLowerCase();
      return !!(n.includes(r) || (a && `${i} ${n}`.includes(r)));
    }
    function X(e) {
      var t;
      try {
        let s = e[0];
        switch (s) {
          case 0:
            !(function (e) {
              for (let t of Object.keys(e)) {
                let s = e[t];
                if (!s) continue;
                let r = [...s.map(g)].sort(B(t)).slice(0, a.MAX_PULSE_ROWS);
                T.setRegularRows(t, r);
                let i = $(r, t);
                if (y.isTablePaused(t))
                  if (0 === T.getPausedRows(t).length) {
                    T.pause(t, r);
                    let e = $(T.getPausedRows(t), t);
                    V(t, e);
                  } else {
                    let e = [];
                    for (let s of r)
                      T.updatePausedRow(t, s.pairAddress, s) && e.push(s);
                    e.length > 0 &&
                      x(
                        t,
                        e.map((e) => ({ type: "update", item: e }))
                      );
                  }
                else V(t, i);
              }
            })(e[1]);
            break;
          case 1:
            !(function (e, t) {
              let s = new Map(),
                r = !1;
              for (let a of ["newPairs", "finalStretch", "migrated"]) {
                let i,
                  n = T.getRegularRows(a),
                  o = -1;
                for (let t = 0; t < n.length; t++)
                  if (n[t].pairAddress === e) {
                    (i = n[t]), (o = t);
                    break;
                  }
                if (
                  (!i && y.isTablePaused(a) && (i = T.getPausedRow(a, e)), i)
                ) {
                  r = !0;
                  let e = m(i, t);
                  s.set(a, { updatedRow: e, regularIndex: o });
                }
              }
              if (!r) {
                let s = k.get(e);
                if (s) {
                  let r = new Map();
                  for (let [e, t] of s.changes) r.set(e, t);
                  for (let [e, s] of t) r.set(e, s);
                  let a = Array.from(r, ([e, t]) => [e, t]);
                  k.set(e, { changes: a, timestamp: s.timestamp });
                } else {
                  let s = Date.now();
                  k.set(e, { changes: t, timestamp: s }),
                    setTimeout(() => {
                      let t = k.get(e);
                      t && t.timestamp === s && k.delete(e);
                    }, 1e4);
                }
                return;
              }
              for (let [t, { updatedRow: r, regularIndex: i }] of s)
                if (y.isTablePaused(t)) {
                  let s = T.updatePausedRow(t, e, r);
                  i >= 0 && (T.getRegularRows(t)[i] = r),
                    s && q(r, t) && x(t, [{ type: "update", item: r }]);
                } else {
                  let e = T.getRegularRows(t),
                    s = [...e];
                  i >= 0 && (s[i] = r);
                  let n = s.sort(B(t)).slice(0, a.MAX_PULSE_ROWS);
                  T.setRegularRows(t, n);
                  let o = F(e, t),
                    d = F(n, t);
                  x(t, l.buildOperations(o, d));
                }
            })(e[1], e[2]);
            break;
          case 2:
            !(function (e) {
              let t,
                [s, r] = e,
                i = g(r),
                n = y.isTablePaused(s),
                o = T.getRegularRows(s),
                d = -1;
              for (let e = 0; e < o.length; e++)
                if (o[e].pairAddress === i.pairAddress) {
                  d = e;
                  break;
                }
              if (
                (d >= 0 ? ((t = [...o])[d] = i) : (t = [i, ...o]),
                (t = t.sort(B(s)).slice(0, a.MAX_PULSE_ROWS)),
                T.setRegularRows(s, t),
                n)
              )
                return;
              let c = F(o, s),
                u = F(t, s);
              x(s, l.buildOperations(c, u));
            })(e[1]);
            break;
          case 3:
            !(function (e) {
              let [t, s] = e;
              if (y.isTablePaused(t)) T.removeRegularRow(t, s);
              else {
                let e = T.getRegularRows(t),
                  r = e.filter((e) => e.pairAddress !== s);
                T.setRegularRows(t, r);
                let a = F(e, t),
                  i = F(r, t);
                x(t, l.buildOperations(a, i));
              }
            })(e[1]);
            break;
          case 4:
            (t = e[1]), W([`ca-${t}`]);
            break;
          default:
            console.warn("Unknown message type:", s);
        }
      } catch (e) {
        N("Error handling WebSocket message", e);
      }
    }
    function j(e) {
      if (e.room)
        switch (e.room) {
          case "thumbnail": {
            let { pairAddress: t, base64Image: s } = e.content;
            if (C.has(t)) return;
            if ((C.add(t), v.push(t), v.length > 100)) {
              let e = v.shift();
              C.delete(e);
            }
            !(function (e, t) {
              let s,
                r = "newPairs",
                a = T.getRegularRows(r),
                i = -1;
              for (let t = 0; t < a.length; t++)
                if (a[t].pairAddress === e) {
                  (s = a[t]), (i = t);
                  break;
                }
              if (!s || i < 0) return;
              let n = { ...s, thumbnail: t },
                o = y.isTablePaused(r);
              (a[i] = n),
                o
                  ? T.updatePausedRow(r, e, n) &&
                    q(n, r) &&
                    x(r, [{ type: "update", item: n }])
                  : q(n, r) && x(r, [{ type: "update", item: n }]);
            })(t, s);
            return;
          }
          case "token-thumbnails": {
            let { tokenAddress: t, base64Image: s } = e.content;
            if (E.has(t)) return;
            if ((E.add(t), M.push(t), M.length > 100)) {
              let e = M.shift();
              E.delete(e);
            }
            !(function (e, t) {
              let s,
                r = "newPairs",
                a = T.getRegularRows(r),
                i = -1;
              for (let t = 0; t < a.length; t++)
                if (a[t].tokenAddress === e) {
                  (s = a[t]), (i = t);
                  break;
                }
              if (!s || i < 0) {
                if (U.size >= 10) {
                  let e = U.keys().next().value;
                  e && U.delete(e);
                }
                U.set(e, { thumbnail: t, timestamp: Date.now() });
                return;
              }
              let n = { ...s, thumbnail: t },
                o = y.isTablePaused(r);
              (a[i] = n),
                o
                  ? T.updatePausedRow(r, s.pairAddress, n) &&
                    q(n, r) &&
                    x(r, [{ type: "update", item: n }])
                  : q(n, r) && x(r, [{ type: "update", item: n }]);
            })(t, s);
            return;
          }
          case "twitter-preview": {
            let { pairAddress: t, type: s, data: r } = e.content;
            if (!D.has(s) || L.has(t)) return;
            if ((L.add(t), _.push(t), _.length > 100)) {
              let e = _.shift();
              L.delete(e);
            }
            !(function (e, t, s) {
              let r,
                a =
                  "tweet" === t
                    ? { type: "tweet", data: s }
                    : "profile" === t
                    ? { type: "profile", data: s }
                    : { type: "community", data: s },
                i = "newPairs",
                n = T.getRegularRows(i),
                o = -1;
              for (let t = 0; t < n.length; t++)
                if (n[t].pairAddress === e) {
                  (r = n[t]), (o = t);
                  break;
                }
              if (!r || o < 0) {
                if (H.size >= 10) {
                  let e = H.keys().next().value;
                  e && H.delete(e);
                }
                H.set(e, { preview: a, timestamp: Date.now() });
                return;
              }
              let l = { ...r, tweetPreview: a },
                d = y.isTablePaused(i);
              (n[o] = l),
                d
                  ? T.updatePausedRow(i, e, l) &&
                    q(l, i) &&
                    x(i, [{ type: "update", item: l }])
                  : q(l, i) && x(i, [{ type: "update", item: l }]);
            })(t, s, r);
            return;
          }
          case "new_pairs": {
            let t = e.content;
            if (
              !t.pair_address ||
              !t.token_address ||
              !t.token_name ||
              !t.token_ticker ||
              !t.protocol ||
              t.freeze_authority ||
              t.extra?.isBlacklisted ||
              ("Raydium V4" !== t.protocol &&
                "Pump V1" !== t.protocol &&
                "Raydium CPMM" !== t.protocol &&
                "Pump AMM" !== t.protocol &&
                "Moonshot" !== t.protocol &&
                "LaunchLab" !== t.protocol &&
                "Virtual Curve" !== t.protocol &&
                "Heaven" !== t.protocol &&
                "Boop" !== t.protocol &&
                "Sugar" !== t.protocol &&
                "Meteora AMM" !== t.protocol &&
                "Meteora AMM V2" !== t.protocol)
            )
              return;
            let s = (0, w.convertNewPairToPulseRow)(t),
              r = y.getUserState();
            if (!r) return;
            let i = k.get(s.pairAddress);
            i && ((s = m(s, i.changes)), k.delete(s.pairAddress)),
              t.extra?.migratedFrom
                ? (function (e, t) {
                    let s = T.getRegularRows("newPairs"),
                      r = T.getRegularRows("finalStretch"),
                      i = s.filter((t) => t.tokenAddress !== e.tokenAddress),
                      n = r.filter((t) => t.tokenAddress !== e.tokenAddress);
                    i.length !== s.length &&
                      (T.setRegularRows("newPairs", i),
                      y.isTablePaused("newPairs") ||
                        V("newPairs", F(i, "newPairs"))),
                      n.length !== r.length &&
                        (T.setRegularRows("finalStretch", n),
                        y.isTablePaused("finalStretch") ||
                          V("finalStretch", F(n, "finalStretch")));
                    let o = y.getUsdPerSol(),
                      d = y.getSearchQuery("migrated"),
                      c = t.blacklist;
                    if (t.unhideMigrated && e.tokenAddress) {
                      let s = `ca-${e.tokenAddress}`,
                        r = t.blacklist[s];
                      if (r) {
                        let a = e.createdAt
                          ? new Date(e.createdAt).getTime()
                          : 0;
                        r.time < a &&
                          ((c = { ...t.blacklist }),
                          delete c[s],
                          y.updateUserState({ blacklist: c }),
                          W([s]));
                      }
                    }
                    if (
                      !(0, w.applyFilters)(
                        e,
                        t.filters.migrated,
                        "migrated",
                        o,
                        t.showHiddenPulseTokens,
                        c,
                        d
                      )
                    )
                      return;
                    let u = T.getRegularRows("migrated");
                    if (!G(u, e.pairAddress))
                      if (y.isTablePaused("migrated")) {
                        let t = [e, ...u].sort(p).slice(0, a.MAX_PULSE_ROWS);
                        T.setRegularRows("migrated", t);
                      } else {
                        let t = [e, ...u].sort(p).slice(0, a.MAX_PULSE_ROWS);
                        T.setRegularRows("migrated", t);
                        let s = F(u, "migrated"),
                          r = F(t, "migrated");
                        x("migrated", l.buildOperations(s, r));
                      }
                  })(s, r)
                : (function (e, t) {
                    if (++O >= 10) {
                      O = 0;
                      let e = Date.now();
                      for (let [t, s] of U)
                        e - s.timestamp > 3e3 && U.delete(t);
                      let t = Date.now();
                      for (let [e, s] of H)
                        t - s.timestamp > 3e3 && (H.delete(e), L.delete(e));
                    }
                    let s = U.get(e.tokenAddress);
                    s &&
                      ((e = { ...e, thumbnail: s.thumbnail }),
                      U.delete(e.tokenAddress));
                    let r = H.get(e.pairAddress);
                    r &&
                      ((e = { ...e, tweetPreview: r.preview }),
                      H.delete(e.pairAddress));
                    let i = y.getUsdPerSol(),
                      n = y.getSearchQuery("newPairs");
                    if (
                      (0, w.applyFilters)(
                        e,
                        t.filters.newPairs,
                        "newPairs",
                        i,
                        t.showHiddenPulseTokens,
                        t.blacklist,
                        n
                      )
                    ) {
                      let t = y.isTablePaused("newPairs"),
                        s = T.getRegularRows("newPairs");
                      if (!G(s, e.pairAddress)) {
                        let r = [e, ...s].sort(p).slice(0, a.MAX_PULSE_ROWS);
                        if ((T.setRegularRows("newPairs", r), !t)) {
                          let e = F(s, "newPairs"),
                            t = F(r, "newPairs");
                          x("newPairs", l.buildOperations(e, t));
                        }
                      }
                    }
                    let o = y.getSearchQuery("finalStretch");
                    if (
                      (0, w.applyFilters)(
                        e,
                        t.filters.finalStretch,
                        "finalStretch",
                        i,
                        t.showHiddenPulseTokens,
                        t.blacklist,
                        o
                      )
                    ) {
                      let t = y.isTablePaused("finalStretch"),
                        s = T.getRegularRows("finalStretch");
                      if (!G(s, e.pairAddress)) {
                        let r = [e, ...s].sort(h).slice(0, a.MAX_PULSE_ROWS);
                        if ((T.setRegularRows("finalStretch", r), !t)) {
                          let e = F(s, "finalStretch"),
                            t = F(r, "finalStretch");
                          x("finalStretch", l.buildOperations(e, t));
                        }
                      }
                    }
                  })(s, r);
            return;
          }
          default:
            return;
        }
    }
    function G(e, t) {
      for (let s = 0; s < e.length; s++) if (e[s].pairAddress === t) return !0;
      return !1;
    }
    self.addEventListener("message", (e) => {
      let t = e.data;
      try {
        switch (t.type) {
          case "INIT":
            t.payload &&
              (function (e) {
                if (e.pauseStateBuffer) {
                  let t = new c.SharedPauseState(e.pauseStateBuffer);
                  y.setSharedPauseState(t);
                }
                y.setUserState(e.userState), y.setUsdPerSol(e.usdPerSol);
                let t = "wss://pulse.axiom.trade/ws,wss://pulse2.axiom.trade/ws"
                    .split(",")
                    .map((e) => e.trim()),
                  s = t[0];
                if (t.length > 1) {
                  let r = 0;
                  for (let t = 0; t < e.userId.length; t++)
                    (r = (r << 5) - r + e.userId.charCodeAt(t)), (r &= r);
                  let a = Math.abs(r) % t.length;
                  s = t[a];
                }
                let r = new n(s, e.userId);
                r.onMessage(X),
                  r.onConnectionChange((e) => {
                    var t;
                    (t = e ? "connected" : "disconnected"),
                      y.setConnectionStatus(t),
                      I({ type: "CONNECTION_STATUS", payload: { status: t } });
                  }),
                  r.onError((e) => {
                    N(e.message, e);
                  }),
                  y.setWebSocketManager(r),
                  r.connect(),
                  r.sendUserState(e.userState),
                  (A = new R(
                    e.regionUrl,
                    "pulse-regional",
                    {},
                    {
                      onMessage: j,
                      onStateChange: () => {},
                      onError: (e) => console.error("[Regional WS]", e),
                      onConnected: () => console.log("[Regional WS] Connected"),
                      onDisconnected: () =>
                        console.log("[Regional WS] Disconnected"),
                    },
                    {
                      maxReconnectAttempts: 50,
                      reconnectInterval: 250,
                      retryOnError: !0,
                    }
                  )).connect(),
                  A.joinRoom("new_pairs"),
                  A.joinRoom("thumbnail"),
                  A.joinRoom("token-thumbnails"),
                  A.joinRoom("twitter-preview");
              })(t.payload);
            break;
          case "UPDATE_USER_STATE":
            t.payload &&
              (function (e) {
                if (
                  (y.updateUserState(e),
                  e.filters || e.blacklist || e.showHiddenPulseTokens)
                )
                  for (let e of ["newPairs", "finalStretch", "migrated"])
                    if (y.isTablePaused(e)) {
                      let t = $(T.getPausedRows(e), e);
                      V(e, t);
                    } else {
                      let t = $(T.getRegularRows(e), e);
                      V(e, t);
                    }
                let t = y.getWebSocketManager();
                t && t.sendUserStateUpdate(e);
              })(t.payload.update);
            break;
          case "SET_PAUSE_STATE":
            t.payload &&
              (function (e, t) {
                let s = y.isTablePaused(e);
                if ((y.setPauseState(e, t), t && !s)) {
                  let t = T.getRegularRows(e),
                    s = T.pause(e, t),
                    r = y.getUserState();
                  if (r) {
                    let t = { ...r.pausedPairs, [e]: s };
                    y.updateUserState({ pausedPairs: t });
                    let a = y.getWebSocketManager();
                    a &&
                      a.isConnected() &&
                      a.sendUserStateUpdate({ pausedPairs: t });
                  }
                } else if (!t && s) {
                  let t = y.getUserState();
                  if (t) {
                    let s = { ...t.pausedPairs, [e]: [] };
                    y.updateUserState({ pausedPairs: s });
                    let r = y.getWebSocketManager();
                    r &&
                      r.isConnected() &&
                      r.sendUserStateUpdate({ pausedPairs: s });
                  }
                  let s = $(T.getRegularRows(e), e);
                  T.unpause(e), V(e, s);
                }
              })(t.payload.table, t.payload.isPaused);
            break;
          case "UPDATE_SEARCH_QUERY":
            t.payload &&
              (function (e, t) {
                y.setSearchQuery(e, t);
                let s = T.getRegularRows(e);
                if (y.isTablePaused(e)) {
                  let t = F(T.getPausedRows(e), e);
                  V(e, t);
                } else {
                  let t = F(s, e);
                  V(e, t);
                }
              })(t.payload.table, t.payload.query);
            break;
          case "UPDATE_USD_PER_SOL":
            t.payload && y.setUsdPerSol(t.payload.usdPerSol);
            break;
          case "UPDATE_BLACKLIST":
            t.payload &&
              (function (e, t) {
                for (let s of (y.updateUserState({
                  blacklist: e,
                  showHiddenPulseTokens: t,
                }),
                ["newPairs", "finalStretch", "migrated"]))
                  if (y.isTablePaused(s)) {
                    let r = F(Q(T.getPausedRows(s), e, t), s);
                    V(s, r);
                  } else {
                    let r = F(Q(T.getRegularRows(s), e, t), s);
                    V(s, r);
                  }
              })(t.payload.blacklist, t.payload.showHiddenPulseTokens);
            break;
          case "SET_VISIBILITY":
            var s;
            let e;
            t.payload &&
              ((s = t.payload.hidden),
              y.setTabHidden(s),
              (e = y.getWebSocketManager()) && e.setVisibility(s));
            break;
          case "SET_PAGE_ACTIVE":
            if (t.payload) {
              let e = y.isPageActive();
              y.setPageActive(t.payload.active),
                t.payload.active &&
                  !e &&
                  (function () {
                    for (let e of ["newPairs", "finalStretch", "migrated"])
                      if (y.isTablePaused(e)) {
                        let t = $(T.getPausedRows(e), e);
                        I({ type: "REPLACE", table: e, items: t });
                      } else {
                        let t = $(T.getRegularRows(e), e);
                        I({ type: "REPLACE", table: e, items: t });
                      }
                  })();
            }
            break;
          case "CLEANUP":
            let r;
            (r = y.getWebSocketManager()) && r.cleanup(),
              A && (A.disconnect(), (A = null)),
              y.reset(),
              T.clearAll(),
              k.clear(),
              C.clear(),
              (v.length = 0),
              E.clear(),
              (M.length = 0),
              U.clear(),
              H.clear(),
              L.clear(),
              (_.length = 0),
              (O = 0);
        }
      } catch (e) {
        N(`Error handling message ${t.type}`, e);
      }
    }),
      e.s([], 178875);
  },
]);

//# debugId=36cdb5ae-dba5-bc73-4fd0-ec90b10dc722
//# sourceMappingURL=0ec8a5e449acce9a.js.map
