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
        "db9b745a-ba6d-3c3d-3e80-45f2f5ce032f");
  } catch (e) {}
})();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  567283,
  (e) => {
    "use strict";
    var t = e.i(843476),
      l = e.i(672464),
      r = e.i(271645),
      a = e.i(447800),
      s = e.i(592846),
      i = e.i(741124),
      n = e.i(182781),
      o = e.i(754825),
      u = e.i(885438),
      d = e.i(458768),
      c = e.i(711858),
      m = e.i(321207);
    let h = (0, r.memo)(({ className: e = "", variant: h = "default" }) => {
      let { t: g } = (0, s.useTranslation)(),
        p = (0, l.useAtomValue)(i.currentChainAtom);
      (0, r.useRef)(null);
      let [x] = (0, n.useSettings)("solWalletsAndGroups", []),
        [A] = (0, n.useSettings)("evmWalletsAndGroups", []),
        f = "sol" === p ? x : A,
        v = (0, l.useAtomValue)(o.allSolWalletsAtom),
        b = (0, l.useAtomValue)(u.allEvmWalletsAtom),
        w = "sol" === p ? v : b,
        y = (0, r.useMemo)(
          () => new Map(w.map((e) => [e.walletAddress, e])),
          [w]
        ),
        S = (0, l.useAtomValue)(o.selectedSolWalletsAtom),
        T = (0, l.useAtomValue)(u.selectedEvmWalletsAtom),
        $ = (0, l.useSetAtom)(o.selectedSolWalletsAtom),
        W = (0, l.useSetAtom)(u.selectedEvmWalletsAtom),
        k = "sol" === p ? S : T,
        j = "sol" === p ? $ : W,
        C = (0, r.useMemo)(
          () => f.filter((e) => "group" === e.type).map((e) => e.group),
          [f]
        ),
        M = (0, r.useCallback)(
          (e) => {
            let t = e.wallets.filter((e) => {
              let t = y.get(e);
              return t && !t.isArchived;
            });
            return 0 !== t.length && t.every((e) => k.includes(e));
          },
          [k, y]
        ),
        N = (0, r.useCallback)(
          (e) => {
            let t = e.wallets.filter((e) => {
              let t = y.get(e);
              return t && !t.isArchived;
            });
            if (0 === t.length) return !1;
            let l = t.filter((e) => k.includes(e)).length;
            return l > 0 && l < t.length;
          },
          [k, y]
        ),
        E = (0, r.useCallback)(
          (e) => {
            let t = e.wallets.filter((e) => {
              let t = y.get(e);
              return t && !t.isArchived;
            });
            if (0 === t.length)
              return void d.default.error(
                g("All wallets in this group are archived")
              );
            if (t.filter((e) => k.includes(e)).length > 0)
              j(k.filter((e) => !t.includes(e)));
            else {
              let e = t.filter((e) => !k.includes(e)),
                l = a.MAX_TRADING_WALLETS - k.length,
                r = e.slice(0, l);
              if (0 === r.length)
                return void d.default.error(
                  `Maximum of ${a.MAX_TRADING_WALLETS} wallets can be active`
                );
              r.length < e.length &&
                d.default.warn(
                  `Maximum of ${a.MAX_TRADING_WALLETS} wallets can be active. Only ${r.length} of ${e.length} wallets activated`
                ),
                j([...k, ...r]);
            }
          },
          [g, k, j, y]
        );
      if (0 === C.length) return null;
      let L = (0, t.jsx)(m.HorizontalScrollContainer, {
        children: C.map((e) => {
          let l = e.wallets.filter((e) => {
              let t = y.get(e);
              return t && !t.isArchived;
            }),
            r = l.length,
            a = l.filter((e) => k.includes(e)).length,
            s = M(e),
            i = N(e);
          return (0, t.jsx)(
            c.Tooltip,
            {
              content:
                0 === a
                  ? `${r} wallet${1 !== r ? "s" : ""}`
                  : `${a}/${r} wallet${1 !== r ? "s" : ""} active`,
              position: "top",
              children: (0, t.jsxs)("button", {
                type: "button",
                onClick: () => E(e),
                className: `
                flex-shrink-0 flex flex-row items-center gap-[4px]
                px-[8px] h-[24px] rounded-[4px]
                text-[12px] font-medium whitespace-nowrap
                transition-all duration-150 ease-in-out
                ${
                  s
                    ? "bg-primaryBlue/15 text-primaryBlue"
                    : i
                    ? "bg-transparent border border-primaryOrange/50 text-primaryOrange/80"
                    : "bg-secondaryStroke/30 text-textSecondary hover:bg-secondaryStroke/50 hover:text-textPrimary"
                }
              `,
                children: [
                  (0, t.jsx)("i", {
                    className: `ri-folder-3-line text-[12px] ${
                      s
                        ? "text-primaryBlue"
                        : i
                        ? "text-primaryOrange/80"
                        : "text-textTertiary"
                    }`,
                  }),
                  (0, t.jsx)("span", {
                    className: "max-w-[72px] truncate",
                    children: e.name,
                  }),
                ],
              }),
            },
            e.groupId
          );
        }),
      });
      return "header" === h
        ? (0, t.jsx)("div", { className: e, children: L })
        : (0, t.jsx)("div", {
            className: `
        bg-backgroundTertiary border border-secondaryStroke rounded-[4px]
        shadow-lg overflow-hidden
        ${e}
      `,
            children: L,
          });
    });
    e.s(["default", 0, h]);
  },
]);

//# debugId=db9b745a-ba6d-3c3d-3e80-45f2f5ce032f
//# sourceMappingURL=28fc748573f07321.js.map
