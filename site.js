/* 学生団体ココカラ 公式サイト v3 ─ 共通スクリプト */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* GAS Web App の /exec（events.html と同じデプロイ）。差し替えるときはここだけ */
  var GAS_EXEC_URL = "https://script.google.com/macros/s/AKfycbznc0dICsGVCcRx9nWc_ZJGVRBqb39G26IHRNZax7gp_ZYoa-wE2Ripgglyea68FaZ7/exec";

  /* ---- ヘッダー: スクロールで背景 ---- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- フルスクリーンメニュー ---- */
  var menuBtn = document.querySelector(".menu-btn");
  var overlay = document.getElementById("menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuBtn && overlay) {
    menuBtn.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        var href = a.getAttribute("href") || "";
        var cur = location.pathname.split("/").pop() || "index.html";
        /* 別ページへ遷移するリンクは閉じない（遷移するまでメニューを保持）。
           同じページ・ページ内アンカーのときだけ閉じる。 */
        if (href === "" || href.charAt(0) === "#" || href === cur) setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---- メニュー内の「前のページに戻る」 ---- */
  var backBtn = document.querySelector(".menu-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      /* メニューはオーバーレイなので「前のページ」＝開く直前に見ていた今のページ。
         履歴を遡るとホーム等へ飛ぶため、メニューを閉じて元のページに戻す。 */
      setMenu(false);
    });
  }

  /* ---- リビール演出 ---- */
  var targets = document.querySelectorAll(".reveal, .cta-copy, .cta-clark");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  /* ---- 協賛CTA：背景動画（パリ＋博士が一体）を先頭フレームで静止 → スライドイン(1.3s)後に再生 ---- */
  var ctaBg = document.querySelector(".cta-bg");
  if (ctaBg && ctaBg.tagName === "VIDEO" && !reduce && "IntersectionObserver" in window) {
    /* 一時停止のまま先頭フレームを表示 */
    var bgPainted = false;
    var paintBgFirst = function () {
      if (bgPainted) return;
      bgPainted = true;
      try { ctaBg.pause(); ctaBg.currentTime = 0; } catch (e) {}
    };
    if (ctaBg.readyState >= 1) { paintBgFirst(); }
    ctaBg.addEventListener("loadedmetadata", paintBgFirst);

    var bgStarted = false;
    var playCtaBg = function () {
      if (bgStarted) return;
      bgStarted = true;
      try { ctaBg.currentTime = 0; } catch (e) {}
      var p = ctaBg.play();
      if (p && p.catch) { p.catch(function () {}); }
    };
    /* テキストのスライドイン(1.3s)完了に合わせて動き出す */
    var ctaBgIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          ctaBgIO.unobserve(e.target);
          setTimeout(playCtaBg, 1300);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    ctaBgIO.observe(ctaBg);
  }

  /* ---- MBTIキャラ画像の有無を判定して画像モードへ切替 ----
     assets/mbti/ に1枚でも画像があれば .has-art を付けて画像表示に切り替える。
     画像が無い間はタイプ名のテキスト表示のまま（表示は壊れない）。 */
  (function () {
    var stage = document.querySelector(".mbti-stage");
    if (!stage) return;
    var first = stage.querySelector(".mbti-chip");
    if (!first) return;
    var m = /url\(['"]?([^'")]+)['"]?\)/.exec(first.getAttribute("style") || "");
    if (!m) return;
    var probe = new Image();
    probe.onload = function () { stage.classList.add("has-art"); };
    probe.onerror = function () { /* 未設置ならテキスト表示のまま */ };
    probe.src = m[1];
  })();

  /* ---- 背景動画を確実に再生（autoplayブロック対策） ---- */
  (function () {
    var vids = document.querySelectorAll("video[autoplay]");
    if (!vids.length) return;
    vids.forEach(function (v) {
      v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
      function tryPlay() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      tryPlay();
      v.addEventListener("canplay", tryPlay, { once: true });
      v.addEventListener("loadeddata", tryPlay, { once: true });
    });
    /* 一部ブラウザは最初のユーザー操作まで待つため、その時点でも再生を試みる */
    var kick = function () {
      vids.forEach(function (v) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    };
    document.addEventListener("pointerdown", kick, { once: true });
    document.addEventListener("touchstart", kick, { once: true });
    document.addEventListener("scroll", kick, { once: true, passive: true });
  })();

  /* ---- 現在の年 ---- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- モーダル（活動内容の詳細ポップアップ） ---- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(m) {
    m.classList.remove("open");
    if (!document.querySelector(".modal.open")) document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-modal-open]").forEach(function (t) {
    t.addEventListener("click", function () { openModal(t.getAttribute("data-modal-open")); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(t.getAttribute("data-modal-open")); }
    });
  });
  document.querySelectorAll(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) {
      if (e.target === m || (e.target.closest && e.target.closest("[data-modal-close]"))) closeModal(m);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") document.querySelectorAll(".modal.open").forEach(closeModal);
  });

  /* ---- フッター背景：薄い四角が下から上へ ---- */
  (function () {
    var box = document.querySelector(".footer-fall");
    if (!box) return;
    return; /* ミニマル化: フッターの装飾（昇る四角）は生成しない */
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (a) { return a[(Math.random() * a.length) | 0]; };
    var N = window.innerWidth < 760 ? 12 : 22;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var depth = Math.pow(Math.random(), 1.4);
      var size = Math.round(rand(10, 20) + depth * 34);
      var hue = rand(150, 260), sat = rand(66, 92), lit = rand(58, 74);  /* カラフルで鮮やか（緑〜青〜紫） */
      var outline = Math.random() < 0.4;
      var op = +(0.22 + depth * 0.30).toFixed(2);                        /* 濃紺の上で発色しつつKOKOKARAを邪魔しない */
      var dur = +(rand(20, 32) - depth * 9).toFixed(1);
      var radius = pick([2, 4, 8, 12, size / 2 | 0]);
      var rot = Math.round(rand(-90, 90)), amp = Math.round(rand(4, 12));
      var swayDur = +(rand(3.5, 7)).toFixed(1);
      var chip = document.createElement("span");
      chip.className = "foot-chip";
      chip.style.cssText =
        "left:" + rand(-2, 98).toFixed(2) + "%;width:" + size + "px;height:" + size + "px;" +
        "animation-duration:" + dur + "s;animation-delay:" + (-rand(0, dur)).toFixed(2) + "s;--op:" + op + ";";
      var inner = document.createElement("i");
      var col = "hsl(" + hue.toFixed(0) + "," + sat.toFixed(0) + "%," + lit.toFixed(0) + "%)";
      inner.style.cssText =
        "border-radius:" + radius + "px;" +
        (outline ? "background:transparent;border:2px solid " + col + ";box-sizing:border-box;" : "background:" + col + ";") +
        "animation-duration:" + swayDur + "s;animation-delay:" + (-rand(0, swayDur)).toFixed(2) + "s;--amp:" + amp + "px;--rot:" + rot + "deg;";
      chip.appendChild(inner);
      if (reduce) {
        chip.style.top = rand(4, 84).toFixed(1) + "%";
        chip.style.transform = "translateY(0)"; chip.style.opacity = op;
      }
      chip.dataset.depth = depth.toFixed(3);
      frag.appendChild(chip);
    }
    box.appendChild(frag);

    /* フッターの四角にもカーソル連動の視差を効かせる */
    if (!reduce) {
      var footer = box.closest(".site-footer") || box.parentElement;
      var fchips = [].slice.call(box.querySelectorAll(".foot-chip"));
      fchips.forEach(function (ch) {
        var d = parseFloat(ch.dataset.depth || "0.5");
        ch.__k = 20 + d * 60; ch.__tilt = 5 + d * 12;
        var mv = document.createElement("b"); mv.className = "foot-move";
        while (ch.firstChild) mv.appendChild(ch.firstChild);
        ch.appendChild(mv); ch.__mv = mv;
      });
      var ftx = 0, fty = 0, fcx = 0, fcy = 0, fticking = false;
      function fapply() {
        fcx += (ftx - fcx) * 0.09; fcy += (fty - fcy) * 0.09;
        for (var i = 0; i < fchips.length; i++) {
          var ch = fchips[i];
          ch.__mv.style.setProperty("--px", (fcx * ch.__k).toFixed(2) + "px");
          ch.__mv.style.setProperty("--py", (fcy * ch.__k).toFixed(2) + "px");
          ch.__mv.style.setProperty("--pr", (fcx * ch.__tilt).toFixed(2) + "deg");
        }
        if (Math.abs(ftx - fcx) > 0.001 || Math.abs(fty - fcy) > 0.001) requestAnimationFrame(fapply);
        else fticking = false;
      }
      footer.addEventListener("pointermove", function (e) {
        var r = footer.getBoundingClientRect();
        ftx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        fty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!fticking) { fticking = true; requestAnimationFrame(fapply); }
      }, { passive: true });
      footer.addEventListener("pointerleave", function () {
        ftx = 0; fty = 0;
        if (!fticking) { fticking = true; requestAnimationFrame(fapply); }
      }, { passive: true });
    }
  })();

  /* ---- フッターの大型ワードマークを親幅にフィット（はみ出し防止） ---- */
  function fitFooterWord() {
    var el = document.querySelector(".footer-word");
    if (!el) return;
    var parent = el.parentElement;
    var cs = window.getComputedStyle(parent);
    var avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!(avail > 0)) return;
    el.style.fontSize = "100px";
    var w = el.scrollWidth;
    if (w > 0) el.style.fontSize = Math.floor(100 * avail / w) + "px";
  }
  fitFooterWord();
  window.addEventListener("load", fitFooterWord);
  var fwT;
  window.addEventListener("resize", function () { clearTimeout(fwT); fwT = setTimeout(fitFooterWord, 150); });

  /* ---- 数字が0からカウントアップして増える ---- */
  var statsShown = false;
  function countUp(el, target, dur) {
    if (reduce) { el.textContent = String(target); return; }
    var from = parseInt(el.textContent, 10);
    if (isNaN(from)) from = 0;
    var t0 = null;
    function tick(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);            /* 最後にゆっくり止まる */
      el.textContent = String(Math.round(from + (target - from) * e));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function runStats() {
    document.querySelectorAll("[data-stat]").forEach(function (el) {
      var tv = parseInt(el.getAttribute("data-target") || el.textContent, 10);
      if (isNaN(tv)) return;
      el.setAttribute("data-target", tv);
      el.textContent = "0";
      countUp(el, tv, 1500);
    });
  }
  (function () {
    var box = document.querySelector(".stats");
    if (!box) return;
    if (!("IntersectionObserver" in window)) { statsShown = true; runStats(); return; }
    var io2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting && !statsShown) { statsShown = true; runStats(); io2.disconnect(); }
      });
    }, { threshold: 0.35 });
    io2.observe(box);
  })();

  /* ---- サイトデータ（イベント／メンバー数／協賛企業数）の読み込み ----
     ENDPOINT が空なら events.json（イベントのみ）を読む。
     GAS の公開URL(/exec)を ENDPOINT に入れると
     {members, sponsors, events:[...]} をまとめて取得し、
     ステートメント欄の数値（活動メンバー・協賛企業）も自動反映する。
     開催日を過ぎたイベントは自動で表示から外れる。
     イベントに "square"（1:1画像パス）があればそれを正方形で表示する。 */
  (function () {
    // HOMEのイベントプレビュー：GAS(public_events)から動的取得（events.htmlと同じSSOT）
    var box = document.querySelector("[data-event-preview]");
    if (!box) return;
    var LIMIT = parseInt(box.getAttribute("data-limit") || "2", 10);
    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function fmtDate(s) {
      var d = new Date(s); if (isNaN(d)) return "";
      var w = ["日", "月", "火", "水", "木", "金", "土"];
      return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + w[d.getDay()] + "）";
    }
    function renderPreview(list) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var up = (Array.isArray(list) ? list : [])
        .filter(function (e) { var d = new Date(e.date); return !isNaN(d) && d >= today; })
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })
        .slice(0, LIMIT);
      if (!up.length) {
        box.classList.add("is-empty");
        box.innerHTML = '<p class="event-empty">次回イベントは近日公開予定です。お楽しみに！</p>';
        return;
      }
      box.classList.remove("is-empty");
      box.innerHTML = up.map(function (e, i) {
        var img = e.posterUrl || e.poster || e.square || "";
        var name = e.name || e.title || "イベント";
        var cls = "reveal d" + (i + 1) + " in";
        if (img) {
          return '<a href="events.html" class="' + cls + '">' +
                 '<img src="' + esc(img) + '" alt="' + esc(name) + '" loading="lazy" /></a>';
        }
        // ポスター画像が無い場合は、詳細（名称・日時）を見やすいテキストカードで表示
        var emoji = e.emoji ? e.emoji + " " : "";
        var when = e.dateLabel || fmtDate(e.date);
        var badge = (e.status === "締切") ? "🔒 締切" : "🔥 募集中";
        return '<a href="events.html" class="ev-text ' + cls + '">' +
               '<span class="ev-badge">' + esc(badge) + '</span>' +
               '<h3 class="ev-name">' + esc(emoji + name) + '</h3>' +
               (when ? '<span class="ev-date">' + esc(when) + '</span>' : '') +
               '<span class="ev-go">詳細・申込へ <span class="arrow">→</span></span>' +
               '</a>';
      }).join("");
    }
    var cbName = "__cocokaraHomeEvents_" + Math.floor(Math.random() * 1e9);
    window[cbName] = function (data) {
      try { renderPreview((data && data.events) ? data.events : []); }
      catch (e) { /* noop */ }
      delete window[cbName];
    };
    var s = document.createElement("script");
    s.src = GAS_EXEC_URL + "?action=public_events&callback=" + cbName;
    s.onerror = function () { /* 取得失敗時はHTMLの静的フォールバックを維持 */ };
    document.body.appendChild(s);
  })();

  /* ---- VOICEページ：参加者の声（GAS public_voices を JSONP で取得） ---- */
  (function () {
    var box = document.querySelector("[data-voices]");
    if (!box) return;
    function str(v) { return String(v == null ? "" : v).trim(); }
    function addMeta(meta, cls, value) {
      if (!value) return;
      var span = document.createElement("span");
      span.className = cls;
      span.textContent = value;
      meta.appendChild(span);
    }
    function renderVoices(list) {
      var cards = [];
      for (var i = 0; i < list.length && cards.length < 50; i++) {
        var v = list[i] || {};
        var comment = str(v.comment);
        if (!comment) continue;
        var card = document.createElement("article");
        card.className = "voice-card reveal in d" + ((i % 3) + 1);
        var rating = parseInt(str(v.rating), 10);
        if (rating >= 1 && rating <= 5) {
          var stars = document.createElement("span");
          stars.className = "voice-stars";
          stars.setAttribute("role", "img");
          stars.setAttribute("aria-label", "満足度 " + rating + "（5段階）");
          var on = document.createElement("span");
          on.className = "voice-star-on";
          on.setAttribute("aria-hidden", "true");
          on.textContent = new Array(rating + 1).join("★");
          stars.appendChild(on);
          if (rating < 5) {
            var off = document.createElement("span");
            off.className = "voice-star-off";
            off.setAttribute("aria-hidden", "true");
            off.textContent = new Array(6 - rating).join("★");
            stars.appendChild(off);
          }
          card.appendChild(stars);
        }
        var text = document.createElement("p");
        text.className = "voice-comment";
        text.textContent = comment;
        card.appendChild(text);
        var meta = document.createElement("p");
        meta.className = "voice-meta";
        var eventName = str(v.eventName);
        var month = /^(\d{4})-(\d{2})$/.exec(str(v.month));
        var who = [str(v.university), str(v.grade)].filter(function (s) { return s !== ""; }).join(" ");
        addMeta(meta, "voice-event", eventName);
        addMeta(meta, "voice-month", month ? month[1] + "年" + parseInt(month[2], 10) + "月" : "");
        addMeta(meta, "voice-who", who);
        card.appendChild(meta);
        cards.push(card);
      }
      if (cards.length) {
        box.textContent = "";
        cards.forEach(function (card) { box.appendChild(card); });
      }
    }
    var cbName = "__kokokaraVoices_" + Math.floor(Math.random() * 1e9);
    window[cbName] = function (data) {
      try { if (data && Array.isArray(data.voices)) renderVoices(data.voices); }
      catch (e) { /* 静的フォールバックを維持 */ }
      delete window[cbName];
    };
    var s = document.createElement("script");
    s.src = GAS_EXEC_URL + "?action=public_voices&callback=" + cbName;
    s.onerror = function () { /* 静的フォールバックを維持 */ };
    document.body.appendChild(s);
  })();

  /* ---- EVENTページ：開催日を過ぎた「募集中」カードは自動で非表示（HOMEと同じ挙動） ---- */
  (function () {
    var grid = document.querySelector(".events-grid");
    if (!grid) return;
    var cards = grid.querySelectorAll(".event-card[data-date]");
    if (!cards.length) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var d = new Date(card.getAttribute("data-date"));
      if (isNaN(d) || d < today) { card.parentNode && card.parentNode.removeChild(card); }
      else { shown++; }
    });
    if (shown === 0 && !grid.querySelector(".event-card")) {
      grid.innerHTML = '<p class="event-empty">現在募集中のイベントはありません。次回の公開をお楽しみに！</p>';
    }
  })();

  /* ---- 開催済ページ：GAS（public_past_events）の開催済イベントと events.json を合わせて自動掲載 ---- */
  (function () {
    var box = document.querySelector("[data-events-past]");
    if (!box) return;
    function fmtDate(s) {
      var d = new Date(s); if (isNaN(d)) return "";
      var w = ["日", "月", "火", "水", "木", "金", "土"];
      return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + w[d.getDay()] + "）";
    }
    function emptyNotice() {
      box.classList.remove("events-grid");
      box.innerHTML = '<div class="notice-box reveal in"><span class="notice-badge">Past Events</span>' +
        '<h2>開催済のイベントはまだありません</h2><p>イベント終了後、こちらに掲載していきます。</p></div>';
    }
    var staticList = null, gasList = null;
    function str(v) {
      return String(v == null ? "" : v).trim();
    }
    function keyOf(date, name) {
      var normalized = str(name);
      if (String.prototype.normalize) normalized = normalized.normalize("NFKC");
      return str(date) + "|" + normalized.replace(/\s+/g, "");
    }
    function fromStatic(list) {
      var result = [];
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (!Array.isArray(list)) return result;
      list.forEach(function (e) {
        if (!e || typeof e !== "object") return;
        var d = new Date(e.date);
        if (isNaN(d) || d >= today) return;
        result.push({ date: str(e.date), name: str(e.title), emoji: str(e.emoji), img: str(e.square || e.poster), d: d });
      });
      return result;
    }
    function fromGas(list) {
      var result = [];
      if (!Array.isArray(list)) return result;
      list.forEach(function (g) {
        if (!g || typeof g !== "object") return;
        var date = str(g.date), d = new Date(date), img = str(g.posterUrl);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(d)) return;
        result.push({ date: date, name: str(g.name), emoji: "", img: /^https:\/\//.test(img) ? img : "", d: d });
      });
      return result;
    }
    function merge() {
      var list = fromGas(gasList || []), keys = Object.create(null);
      list.forEach(function (e) { keys[keyOf(e.date, e.name)] = e; });
      fromStatic(staticList || []).forEach(function (e) {
        var existing = keys[keyOf(e.date, e.name)];
        if (existing) {
          if (!existing.img) existing.img = e.img;
          if (!existing.emoji) existing.emoji = e.emoji;
        } else {
          list.push(e);
        }
      });
      return list.map(function (e, i) { return { event: e, index: i }; })
        .sort(function (a, b) { return b.event.d - a.event.d || a.index - b.index; })
        .map(function (item) { return item.event; });
    }
    function card(e, i) {
      var article = document.createElement("article");
      article.className = "event-card reveal in d" + ((i % 4) + 1) + (e.img ? "" : " event-card--noimg");
      var status = document.createElement("span");
      status.className = "event-status event-status--done";
      status.textContent = "開催済";
      article.appendChild(status);
      var title = document.createElement("h2");
      title.className = "event-title";
      title.textContent = (e.emoji ? e.emoji + " " : "") + (e.name || "イベント");
      article.appendChild(title);
      if (e.img) {
        var img = document.createElement("img");
        img.className = "event-poster";
        img.src = e.img;
        img.alt = e.name || "イベントポスター";
        img.loading = "lazy";
        article.appendChild(img);
      } else {
        var when = fmtDate(e.date);
        if (when) {
          var date = document.createElement("span");
          date.className = "event-when";
          date.textContent = when;
          article.appendChild(date);
        }
      }
      return article;
    }
    function update() {
      var list = merge();
      if (!list.length) { emptyNotice(); return; }
      box.classList.add("events-grid");
      box.textContent = "";
      list.forEach(function (e, i) { box.appendChild(card(e, i)); });
    }
    fetch("events.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        staticList = Array.isArray(data) ? data : (data && data.events) || [];
        try { update(); } catch (e) {}
      })
      .catch(function () { staticList = []; try { update(); } catch (e) {} });
    var cbName = "__kokokaraPastEvents_" + Math.floor(Math.random() * 1e9);
    window[cbName] = function (data) {
      try {
        if (data && Array.isArray(data.events)) { gasList = data.events; update(); }
      } catch (e) {}
      delete window[cbName];
    };
    var s = document.createElement("script");
    s.src = GAS_EXEC_URL + "?action=public_past_events&callback=" + cbName;
    s.onerror = function () { /* 静的分の表示を維持 */ };
    document.body.appendChild(s);
  })();

  /* ---- 申込ページ（apply/・LIFF）：GAS liff_config で受付中イベントと LIFF ID を受け取り、ID トークン付きで liff_apply を POST ---- */
  (function () {
    var root = document.querySelector("[data-liff-apply]");
    if (!root) return;
    var status = root.querySelector("[data-apply-status]");
    var eventsBox = root.querySelector("[data-apply-events]");
    var form = root.querySelector("[data-apply-form]");
    var result = root.querySelector("[data-apply-result]");
    var CONFIG_TIMEOUT_MS = 10000, POST_TIMEOUT_MS = 25000;
    var RESULT_TRIES = 3, RESULT_INTERVAL_MS = 2000, RESULT_TIMEOUT_MS = 5000;
    var LINE_FRIEND_URL = "https://line.me/R/ti/p/@113crihp";
    var GRADES = ["1年", "2年", "3年", "4年", "5年", "6年", "修士1年", "修士2年", "博士", "その他"];
    var FIRST_TIME = ["初参加", "2回目以降"];
    var ROUTES = ["公式LINE", "Instagram", "オープンチャット", "公式サイト（HP）", "チラシ・ポスター", "友人・知人からの紹介", "ココカラメンバーからの招待", "大学・サークルのつながり", "インターネット検索", "その他"];
    var PAY_METHODS = ["PayPay", "銀行振込", "クレジットカード"];
    var MAX = { name: 50, furigana: 50, univ: 60, inviter: 50, question: 1000, extra: 500 };
    var events = [], payMethods = PAY_METHODS;
    var FRIEND_MESSAGE = "申込の受付やお支払いの案内は公式LINEでお送りします。公式LINEを友だち追加してから、もう一度このページを開いてください。";
    var PREPARING = "申込ページを準備中です。しばらくしてから、公式LINEから開き直してください。";
    function str(v) { return String(v == null ? "" : v).trim(); }
    function node(tag, cls, text, parent) {
      var el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text != null) el.textContent = text;
      if (parent) parent.appendChild(el);
      return el;
    }
    function button(cls, text, parent, fn) {
      var el = node("button", cls, text, parent);
      el.type = "button";
      el.addEventListener("click", fn);
      return el;
    }
    function closeButton(parent) {
      button("btn apply-close", "閉じる", parent, function () { try { window.liff.closeWindow(); } catch (e) {} });
      if (!window.liff.isInClient()) node("p", "apply-hint", "このページはブラウザのタブを閉じて終了してください。", parent);
    }
    function showStatus(text, opts) {
      status.textContent = "";
      status.hidden = false;
      eventsBox.hidden = form.hidden = result.hidden = true;
      node("p", "apply-message", text, status);
      if (opts && opts.friendLink) {
        var a = node("a", "btn", "公式LINEを友だち追加する", status);
        a.href = LINE_FRIEND_URL; a.target = "_blank"; a.rel = "noopener";
      }
      if (opts && opts.close) closeButton(status);
    }
    function jsonp(action, prefix, timeout, requestId) {
      return new Promise(function (resolve) {
        var cbName = prefix + Math.floor(Math.random() * 1e9);
        var script = document.createElement("script"), done = false;
        var timer = setTimeout(function () { finish(null); }, timeout);
        function finish(data) {
          if (done) return;
          done = true; clearTimeout(timer); delete window[cbName];
          if (script.parentNode) script.parentNode.removeChild(script);
          resolve(data);
        }
        window[cbName] = finish;
        script.onerror = function () { finish(null); };
        script.src = GAS_EXEC_URL + "?action=" + action + (requestId ? "&requestId=" + encodeURIComponent(requestId) : "") + "&callback=" + cbName;
        document.body.appendChild(script);
      });
    }
    function strings(values) {
      return Array.isArray(values) ? values.filter(function (v) { return typeof v === "string" && str(v); }).map(str) : [];
    }
    function questions(values) {
      var seen = Object.create(null), out = [];
      if (!Array.isArray(values)) return out;
      values.slice(0, 10).forEach(function (q) {
        if (!q) return;
        var id = str(q.id), title = str(q.title), choices = strings(q.choices);
        if (!id || !title || seen[id]) return;
        seen[id] = true;
        var type = ["text", "paragraph", "choice"].indexOf(q.type) >= 0 ? q.type : "text";
        if (type === "choice" && !choices.length) type = "text";
        out.push({ id: id, title: title, type: type, choices: choices, required: q.required === true });
      });
      return out;
    }
    function normalize(values) {
      var out = [];
      if (!Array.isArray(values)) return out;
      values.slice(0, 20).forEach(function (e) {
        if (!e || !str(e.eventId) || !str(e.name)) return;
        var fee = Number(e.fee);
        if (!isFinite(fee) || fee < 0) return;
        out.push({ eventId: str(e.eventId), name: str(e.name), date: str(e.date), dateLabel: str(e.dateLabel), start: str(e.start), end: str(e.end), location: str(e.location), fee: fee, feeLabel: str(e.feeLabel), posterUrl: /^https:\/\//.test(str(e.posterUrl)) ? str(e.posterUrl) : "", payDeadlineLabel: str(e.payDeadlineLabel), extraQuestions: questions(e.extraQuestions) });
      });
      return out;
    }
    function feeLabel(ev) { return ev.feeLabel || (ev.fee === 0 ? "無料" : ev.fee + "円"); }
    function meta(ev, parent, withLocation) {
      node("p", "apply-meta", "日時: " + ev.dateLabel + (ev.start || ev.end ? "（" + ev.start + "〜" + ev.end + "）" : ""), parent);
      if (withLocation && ev.location) node("p", "apply-meta", "場所: " + ev.location, parent);
      node("p", "apply-meta", "参加費: " + feeLabel(ev), parent);
    }
    function renderEvents() {
      status.hidden = form.hidden = result.hidden = true;
      eventsBox.hidden = false; eventsBox.textContent = "";
      events.forEach(function (ev) {
        var card = node("article", "event-card apply-event", null, eventsBox);
        if (ev.posterUrl) {
          var img = node("img", "event-poster", null, card);
          img.src = ev.posterUrl; img.alt = ev.name + " ポスター"; img.loading = "lazy";
        }
        node("h2", "event-title", ev.name, card); meta(ev, card, true);
        button("btn apply-choose", "このイベントに申し込む", card, function () { openForm(ev); });
      });
    }
    function newRequestId() {
      var id = "", bytes, i;
      if (window.crypto && window.crypto.getRandomValues) {
        bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
        for (i = 0; i < bytes.length; i++) id += ("0" + bytes[i].toString(16)).slice(-2);
      } else { for (i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16); }
      return id;
    }
    function openForm(ev) {
      status.hidden = eventsBox.hidden = result.hidden = true;
      form.hidden = false; form.textContent = "";
      var requestId = newRequestId(), fields = [], sending = false;
      var selected = node("div", "apply-selected", null, form);
      node("h2", "event-title", ev.name, selected); meta(ev, selected, true);
      if (events.length > 1) button("btn btn-ghost apply-back", "イベントを選び直す", selected, function () { if (!sending) renderEvents(); });
      function field(name, title, type, required, choices, max, hint, parent) {
        var radio = type === "radio", check = type === "checkbox";
        var wrap = node(radio ? "fieldset" : "div", "apply-field", null, parent || form);
        var label = node(radio ? "legend" : "label", "apply-label", title, wrap);
        var id = "apply-" + name, inputs = [], input;
        if (!radio) label.htmlFor = id;
        node("span", "apply-req", required ? "必須" : "任意", label);
        if (radio || check) {
          var box = node("div", "apply-choices", null, wrap);
          (check ? [title] : choices).forEach(function (value, i) {
            var choice = node("label", "apply-choice", null, box);
            input = node("input", "", null, choice);
            input.type = check ? "checkbox" : "radio"; input.name = name; input.id = check ? id : id + "-" + i; input.value = value;
            node("span", "", value, choice); inputs.push(input);
          });
        } else {
          input = node(type === "select" ? "select" : type === "paragraph" ? "textarea" : "input", "apply-input", null, wrap);
          input.id = id; input.name = name;
          if (type === "select") {
            var option = node("option", "", "選んでください", input); option.value = "";
            choices.forEach(function (value) { var opt = node("option", "", value, input); opt.value = value; });
          } else {
            if (type !== "paragraph") input.type = "text";
            if (max) input.maxLength = max;
            if (name === "name") input.autocomplete = "name";
          }
          inputs.push(input);
        }
        if (hint) node("p", "apply-hint", hint, wrap);
        var error = node("p", "apply-error", null, wrap); error.setAttribute("role", "alert"); error.hidden = true; error.id = id + "-error";
        inputs.forEach(function (el) { el.required = required; el.setAttribute("aria-describedby", error.id); });
        fields.push({ name: name, type: type, required: required, choices: choices, max: max, inputs: inputs, error: error });
      }
      field("name", "お名前（漢字フルネーム）", "text", true, null, MAX.name, "例: 山田太郎（スペースなし）");
      field("furigana", "フリガナ（全角カタカナ）", "text", true, null, MAX.furigana, "例: ヤマダタロウ");
      field("univ", "大学名", "text", true, null, MAX.univ, "例: 京都先端科学大学");
      field("grade", "学年", "select", true, GRADES);
      field("firstTime", "ココカラのイベントは初参加ですか？", "radio", true, FIRST_TIME);
      field("inviter", "招待者", "text", false, null, MAX.inviter, "ココカラメンバーからの招待で参加される方は、招待してくれた方のフルネーム（漢字）を入力してください。");
      field("route", "このイベントを何で知りましたか？", "select", true, ROUTES, null, "いちばん近いものを1つ選んでください。");
      ev.extraQuestions.forEach(function (q, i) { field("extra-" + i, q.title, q.type === "choice" ? "radio" : q.type, q.required, q.choices, MAX.extra); });
      field("question", "質問・食物アレルギーなど", "paragraph", false, null, MAX.question);
      if (ev.fee > 0) field("payMethod", "支払方法", "radio", true, payMethods, null, "お支払いは事前決済のみです（当日の現金払いはありません）。申込のあと、選んだ方法でのお支払いの案内が公式LINEに届きます。");
      var policy = node("div", "apply-policy", null, form);
      if (ev.fee > 0) {
        var ul = node("ul", "", null, policy);
        node("li", "", "参加費 " + feeLabel(ev) + " は事前にお支払いください。当日の現金払いはありません。", ul);
        node("li", "", "お支払い期限: " + (ev.payDeadlineLabel || "開催日の2日前 23:59"), ul);
        node("li", "", "キャンセル: お支払い期限までのキャンセルは全額返金します。期限を過ぎてからのキャンセルは返金できません。", ul);
      }
      field("confirm", ev.fee > 0 ? "上記の内容を確認しました" : "無料イベントであることを確認しました", "checkbox", true, null, null, null, policy);
      var privacy = node("p", "apply-privacy", "送信した内容は", form);
      var link = node("a", "", "プライバシーポリシー", privacy); link.href = "../privacy.html";
      privacy.appendChild(document.createTextNode("に沿って取り扱います。"));
      var formError = node("p", "apply-form-error", null, form); formError.setAttribute("role", "alert"); formError.hidden = true;
      var submit = node("button", "btn apply-submit", "申し込む", form); submit.type = "submit";
      function formMessage(text, retry, label) {
        formError.textContent = text; formError.hidden = false; sending = false;
        submit.disabled = !retry; submit.textContent = label || "申し込む";
      }
      function validate() {
        var values = {}, first = null;
        fields.forEach(function (f) {
          var value = "", message = "";
          if (f.type === "radio" || f.type === "checkbox") {
            f.inputs.forEach(function (el) { if (el.checked) value = str(el.value); });
          } else value = str(f.inputs[0].value);
          if (f.required && !value) message = f.type === "checkbox" ? "確認してください" : f.type === "radio" || f.type === "select" ? "選んでください" : "入力してください";
          else if (f.max && value.length > f.max) message = f.max + "文字以内で入力してください";
          else if (f.choices && f.choices.length && value && f.choices.indexOf(value) < 0) message = "選んでください";
          f.error.textContent = message; f.error.hidden = !message;
          f.inputs.forEach(function (el) { if (message) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); });
          if (message && !first) first = f.inputs[0];
          values[f.name] = value;
        });
        if (first) { first.focus(); return null; }
        var extra = {};
        ev.extraQuestions.forEach(function (q, i) { Object.defineProperty(extra, q.id, { value: values["extra-" + i], enumerable: true }); });
        return { name: values.name, furigana: values.furigana, univ: values.univ, grade: values.grade, firstTime: values.firstTime, inviter: values.inviter, route: values.route, question: values.question, payMethod: ev.fee > 0 ? values.payMethod : "", extra: extra };
      }
      function response(res, answers) {
        if (res && res.ok === true) {
          form.hidden = true; result.hidden = false; result.textContent = "";
          node("h2", "", "申込を受け付けました", result);
          node("p", "", (str(res.eventName) || ev.name) + "（" + ev.dateLabel + "）", result);
          if (str(res.applyId)) node("p", "", "受付番号: " + str(res.applyId), result);
          var fee = res.fee != null && isFinite(Number(res.fee)) ? Number(res.fee) : ev.fee;
          if (fee > 0) {
            node("p", "", "参加費: " + fee + "円　お支払い方法: " + (str(res.payMethod) || answers.payMethod), result);
            node("p", "", "お支払いの案内を公式LINEにお送りします。お支払い期限までにお手続きください。", result);
          } else node("p", "", "当日お会いできるのを楽しみにしています。", result);
          closeButton(result); return true;
        }
        if (!res || res.ok !== false) return false;
        if (res.code === "not_friend") { showStatus(FRIEND_MESSAGE, { friendLink: true }); return true; }
        var errors = {
          token_invalid: "LINEの認証の有効期限が切れました。このページを閉じて、公式LINEから開き直してください。",
          token_expired: "LINEの認証の有効期限が切れました。このページを閉じて、公式LINEから開き直してください。",
          event_closed: "このイベントの受付は終了しました。",
          duplicate: "このイベントにはすでに申し込み済みです。内容を変えたいときは公式LINEのトークでお知らせください。",
          invalid_input: "入力内容を確認して、もう一度送信してください。"
        };
        formMessage(Object.prototype.hasOwnProperty.call(errors, res.code) ? errors[res.code] : "申込を受け付けられませんでした。時間をおいて、もう一度お試しください。", ["token_invalid", "token_expired", "event_closed", "duplicate"].indexOf(res.code) < 0);
        return true;
      }
      function checkResult(answers, attempt) {
        jsonp("liff_apply_result", "__kokokaraApplyResult_", RESULT_TIMEOUT_MS, requestId).then(function (data) {
          if (data && data.found === true && response(data, answers)) return;
          if (attempt < RESULT_TRIES) setTimeout(function () { checkResult(answers, attempt + 1); }, RESULT_INTERVAL_MS);
          else formMessage("送信結果を確認できませんでした。数分以内に公式LINEに受付のメッセージが届けば、申込は完了しています。届かないときは、下のボタンでもう一度送信してください（同じ申込として扱うので二重にはなりません）。", true, "もう一度送信する");
        });
      }
      form.onsubmit = function (event) {
        event.preventDefault(); if (sending || submit.disabled) return;
        var answers = validate(); if (!answers) return;
        formError.hidden = true;
        var idToken = window.liff.getIDToken();
        if (!str(idToken)) { formMessage("LINEの認証情報を取得できませんでした。このページを閉じて、公式LINEから開き直してください。", false); return; }
        sending = true; submit.disabled = true; submit.textContent = "送信中…";
        var controller = typeof AbortController === "function" ? new AbortController() : null, timer;
        var options = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "liff_apply", requestId: requestId, idToken: idToken, eventId: ev.eventId, answers: answers }), redirect: "follow", cache: "no-store" };
        if (controller) options.signal = controller.signal;
        var timeout = new Promise(function (resolve, reject) {
          timer = setTimeout(function () { if (controller) controller.abort(); reject(new Error("timeout")); }, POST_TIMEOUT_MS);
        });
        var post = Promise.resolve().then(function () { return fetch(GAS_EXEC_URL, options); }).then(function (r) { return r.text(); }).then(function (text) { return JSON.parse(text); });
        Promise.race([post, timeout]).then(function (res) { clearTimeout(timer); if (!response(res, answers)) checkResult(answers, 1); }, function () { clearTimeout(timer); checkResult(answers, 1); });
      };
    }
    if (!window.liff) { showStatus("LINEの読み込みに失敗しました。通信環境を確かめて、公式LINEから開き直してください。"); return; }
    jsonp("liff_config", "__kokokaraLiffConfig_", CONFIG_TIMEOUT_MS).then(function (cfg) {
      if (!cfg || !str(cfg.liffId)) { showStatus(PREPARING); return; }
      window.liff.init({ liffId: str(cfg.liffId), withLoginOnExternalBrowser: false }).then(function () {
        if (!window.liff.isLoggedIn()) { window.liff.login(); return; }
        var friendship = typeof window.liff.getFriendship === "function" ? Promise.resolve().then(function () { return window.liff.getFriendship(); }).catch(function () { return null; }) : Promise.resolve(null);
        friendship.then(function (r) {
          if (r && r.friendFlag === false) { showStatus(FRIEND_MESSAGE, { friendLink: true }); return; }
          events = normalize(cfg.events);
          var methods = strings(cfg.payMethods); if (methods.length) payMethods = methods;
          if (!events.length) { showStatus("現在、受付中のイベントはありません。", { close: true }); return; }
          var match = window.location.search.match(/[?&]eventId=([^&#]*)/), id = "";
          try { if (match) id = decodeURIComponent(match[1]); } catch (e) {}
          for (var i = 0; i < events.length; i++) { if (events[i].eventId === id) { openForm(events[i]); return; } }
          renderEvents();
        });
      }).catch(function () { showStatus("LINEとの接続に失敗しました。公式LINEのトークから開き直してください。"); });
    });
  })();

  /* =====================================================
     ヒーロー: 光の帯（CSSアニメーション）
     描画はGPUに任せ、JSはカーソルのわずかな視差だけを担当する。
     ===================================================== */
  /* =====================================================
     ヒーロー: 色とりどりの四角が上から降ってくる
     生成は初回のみ。落下・横揺れ・回転はCSSアニメーション（GPU合成）で回すため、
     JSの毎フレーム処理は発生しない。奥行きで速度と濃さを変え視差を出す。
     ===================================================== */
  (function () {
    var aura = document.querySelector(".hero-aura");
    if (!aura) return;
    return; /* ミニマル化: ヒーローの装飾（降る四角）は生成しない */
    var rand = function (a, b) { return a + Math.random() * (b - a); };
    var pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
    var N = window.innerWidth < 760 ? 26 : 46;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < N; i++) {
      /* 奥行き 0=遠(小さく遅く薄い) 〜 1=近(大きく速く濃い) */
      var depth = Math.pow(Math.random(), 1.4);
      var size = Math.round(rand(12, 26) + depth * 46);          /* 12〜72px */
      var hue = rand(158, 220);                                   /* 緑〜青 */
      var sat = rand(52, 74), lit = rand(52, 64);
      var outline = Math.random() < 0.28;                          /* 3割は枠だけ */
      var op = +(0.16 + depth * 0.26).toFixed(2);                 /* 近いほど濃い */
      var dur = +(rand(22, 34) - depth * 12).toFixed(1);          /* 近いほど速い */
      var delay = -rand(0, dur).toFixed(2);
      var radius = pick([2, 4, 8, 14, 22, size / 2 | 0]);
      var rot = Math.round(rand(-120, 120));
      var amp = Math.round(rand(4, 16));
      var swayDur = +(rand(3.5, 7.5)).toFixed(1);

      var chip = document.createElement("span");
      chip.className = "fall-chip";
      var mover = document.createElement("b");
      mover.className = "fall-move";
      chip.style.cssText =
        "left:" + rand(-2, 98).toFixed(2) + "%;" +
        "width:" + size + "px;height:" + size + "px;" +
        "animation-duration:" + dur + "s;animation-delay:" + delay + "s;" +
        "--op:" + op + ";";
      chip.dataset.depth = depth.toFixed(3);
      var inner = document.createElement("i");
      var col = "hsl(" + hue.toFixed(0) + "," + sat.toFixed(0) + "%," + lit.toFixed(0) + "%)";
      inner.style.cssText =
        "border-radius:" + radius + "px;" +
        (outline
          ? "background:transparent;border:" + (depth > 0.6 ? 3 : 2) + "px solid " + col + ";box-sizing:border-box;"
          : "background:" + col + ";") +
        "animation-duration:" + swayDur + "s;animation-delay:" + (-rand(0, swayDur)).toFixed(2) + "s;" +
        "--amp:" + amp + "px;--rot:" + rot + "deg;";
      mover.appendChild(inner);
      chip.appendChild(mover);

      if (reduce) {
        /* 動きを止める設定では、画面内に静止配置して見せる */
        chip.style.top = rand(2, 88).toFixed(1) + "%";
        chip.style.transform = "translateY(0)";
        chip.style.opacity = op;
        inner.style.transform = "rotate(" + (rot / 2 | 0) + "deg)";
      }
      frag.appendChild(chip);
    }
    aura.appendChild(frag);
  })();

  (function () {
    var aura = document.querySelector(".hero-aura");
    var heroEl = document.querySelector(".hero");
    if (!aura || !heroEl || reduce) return;
    var chips = [].slice.call(aura.querySelectorAll(".fall-chip"));
    /* 各chipに奥行き係数を持たせる。手前(depth大)ほど大きく動き、
       奥は控えめ。カーソルから離れた向きへ押しやり、傾きも加える。 */
    chips.forEach(function (ch) {
      var d = parseFloat(ch.dataset.depth || "0.5");
      ch.__k = 26 + d * 74;                 /* 移動量 26〜100px */
      ch.__tilt = 6 + d * 12;               /* 傾き 6〜18deg */
      ch.__mv = ch.querySelector(".fall-move");
    });
    var tx = 0, ty = 0, cx = 0, cy = 0, ticking = false;
    function apply() {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      for (var i = 0; i < chips.length; i++) {
        var ch = chips[i];
        ch.__mv.style.setProperty("--px", (cx * ch.__k).toFixed(2) + "px");
        ch.__mv.style.setProperty("--py", (cy * ch.__k).toFixed(2) + "px");
        ch.__mv.style.setProperty("--pr", (cx * ch.__tilt).toFixed(2) + "deg");
      }
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(apply);
      else ticking = false;
    }
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;   /* -1〜1 */
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    heroEl.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  })();
})();
