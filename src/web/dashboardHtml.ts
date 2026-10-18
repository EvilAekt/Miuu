// src/web/dashboardHtml.ts: Ultra-Modern Premium PWA Dashboard UI Template

export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#ffa6c9">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/jpeg" href="/assets/miu_avatar.jpg">
  <title>🌸 Miu Music — Kawaii Studio Dashboard</title>
  
  <!-- Premium Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-dark: #120914;
      --card-bg: rgba(28, 14, 32, 0.72);
      --card-border: rgba(255, 166, 201, 0.18);
      --card-hover-border: rgba(255, 141, 178, 0.55);
      --primary: #ffa6c9;
      --primary-hover: #ff85ab;
      --primary-glow: rgba(255, 166, 201, 0.45);
      --accent: #ffd1dc;
      --accent-glow: rgba(255, 209, 220, 0.4);
      --text-main: #fff0f5;
      --text-muted: #d8b4c8;
      --text-dim: #99788f;
      --success: #77dd77;
      --warning: #fbcfe8;
      --error: #ff6b81;
      --font-display: 'Outfit', sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    body.theme-cosmic {
      --bg-dark: #080c16;
      --card-bg: rgba(15, 23, 42, 0.65);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover-border: rgba(99, 102, 241, 0.4);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --accent: #06b6d4;
      --accent-glow: rgba(6, 182, 212, 0.35);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }

    body.theme-oled {
      --bg-dark: #000000;
      --card-bg: rgba(14, 14, 18, 0.88);
      --card-border: rgba(255, 255, 255, 0.12);
      --card-hover-border: rgba(255, 255, 255, 0.35);
      --primary: #ffffff;
      --primary-hover: #e4e4e7;
      --primary-glow: rgba(255, 255, 255, 0.25);
      --accent: #a1a1aa;
      --accent-glow: rgba(161, 161, 170, 0.25);
    }

    body.theme-cyberpunk {
      --bg-dark: #06020e;
      --card-bg: rgba(24, 7, 43, 0.75);
      --card-border: rgba(244, 63, 94, 0.25);
      --card-hover-border: rgba(0, 245, 255, 0.5);
      --primary: #f43f5e;
      --primary-hover: #e11d48;
      --primary-glow: rgba(244, 63, 94, 0.45);
      --accent: #00f5ff;
      --accent-glow: rgba(0, 245, 255, 0.45);
    }

    body.theme-emerald {
      --bg-dark: #03140f;
      --card-bg: rgba(6, 32, 25, 0.75);
      --card-border: rgba(16, 185, 129, 0.2);
      --card-hover-border: rgba(110, 231, 183, 0.5);
      --primary: #10b981;
      --primary-hover: #059669;
      --primary-glow: rgba(16, 185, 129, 0.4);
      --accent: #6ee7b7;
      --accent-glow: rgba(110, 231, 183, 0.35);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Ambient Dynamic Aurora Background */
    .ambient-glow {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.28;
      animation: floatOrb 18s ease-in-out infinite alternate;
    }
    .orb-1 {
      width: 500px; height: 500px;
      top: -150px; left: -100px;
      background: var(--primary);
    }
    .orb-2 {
      width: 450px; height: 450px;
      bottom: -150px; right: -100px;
      background: #e0b0ff;
      animation-duration: 22s;
    }
    .orb-3 {
      width: 350px; height: 350px;
      top: 40%; left: 60%;
      background: #ff85a2;
      opacity: 0.20;
      animation-duration: 26s;
    }
    @keyframes floatOrb {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(60px, 40px) scale(1.12); }
      100% { transform: translate(-40px, 80px) scale(0.95); }
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 0.85rem 2rem;
      background: rgba(8, 12, 22, 0.75);
      backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      header {
        padding: 0.75rem 1rem;
        flex-wrap: wrap;
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    .brand-avatar-box {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--primary);
      box-shadow: 0 0 14px var(--primary-glow);
      flex-shrink: 0;
      background: #1e1122;
    }
    .brand-avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .brand-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.25rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .brand-sub {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* Miu Kawaii Hero Banner */
    .miu-hero-banner {
      position: relative;
      width: 100%;
      height: 140px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--card-border);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      margin-bottom: 0.5rem;
    }
    .miu-hero-banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 35%;
      transition: transform 0.6s ease;
      display: block;
    }
    .miu-hero-banner:hover .miu-hero-banner-img {
      transform: scale(1.03);
    }
    .miu-hero-banner-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(18, 9, 20, 0.90) 0%, rgba(18, 9, 20, 0.50) 55%, transparent 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 1.5rem 2rem;
      gap: 0.4rem;
    }
    .miu-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 166, 201, 0.22);
      border: 1px solid rgba(255, 166, 201, 0.45);
      color: #ffccd9;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      width: fit-content;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .miu-hero-quote {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 600;
      color: #fff0f5;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    }
    @media (max-width: 680px) {
      .miu-hero-banner { height: 110px; }
      .miu-hero-banner-overlay { padding: 1rem 1.25rem; }
      .miu-hero-quote { font-size: 0.85rem; }
    }

    /* Top Search / Quick Play Bar */
    .top-search-bar {
      flex: 1;
      max-width: 480px;
      position: relative;
      display: flex;
      align-items: center;
    }
    @media (max-width: 900px) {
      .top-search-bar {
        order: 3;
        max-width: 100%;
        width: 100%;
        margin-top: 0.5rem;
      }
    }
    .search-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      border-radius: 9999px;
      padding: 0.55rem 3.2rem 0.55rem 1.1rem;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
      transition: all 0.25s ease;
      font-family: var(--font-body);
    }
    .search-input:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .search-input::placeholder {
      color: var(--text-dim);
    }
    .search-submit-btn {
      position: absolute;
      right: 4px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      border: none;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .search-submit-btn:hover {
      background: var(--primary-hover);
      transform: scale(1.05);
    }

    /* Header Badges & Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .dot-live {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulseDot 2s infinite;
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    .btn-top {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 0.4rem 0.85rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all 0.2s ease;
    }
    .btn-top:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    .theme-select {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 0.4rem 0.65rem;
      border-radius: 10px;
      font-size: 0.8rem;
      outline: none;
      cursor: pointer;
      font-weight: 500;
    }

    /* Main Grid Layout */
    main {
      position: relative;
      z-index: 10;
      flex: 1;
      padding: 2rem;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 2rem;
    }
    @media (max-width: 1100px) {
      main {
        grid-template-columns: 1fr;
        padding: 1.25rem;
        gap: 1.5rem;
      }
    }

    /* Glass Cards */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      backdrop-filter: blur(24px) saturate(180%);
      padding: 1.75rem;
      box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.12);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    }
    .card:hover {
      border-color: var(--card-hover-border);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255, 255, 255, 0.2);
    }

    /* Ambient Dynamic Artwork Glow Backdrop */
    .ambient-art-blur {
      position: absolute;
      top: -24px; left: -24px; right: -24px; bottom: -24px;
      background-size: cover;
      background-position: center;
      filter: blur(65px) saturate(220%);
      opacity: 0.36;
      pointer-events: none;
      z-index: 0;
      transition: background-image 0.8s ease, opacity 0.5s ease;
      border-radius: 32px;
    }

    /* Hero Section - Now Playing */
    .now-playing-container {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .hero-media-wrapper {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      position: relative;
    }
    @media (max-width: 680px) {
      .hero-media-wrapper {
        flex-direction: column;
        text-align: center;
        gap: 1.5rem;
      }
    }

    /* Vinyl Disc 3D Effect */
    .art-and-disc {
      position: relative;
      width: 180px;
      height: 180px;
      flex-shrink: 0;
      margin-right: 2.8rem;
    }
    .artwork {
      width: 180px;
      height: 180px;
      border-radius: 18px;
      object-fit: cover;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.15);
      position: relative;
      z-index: 3;
      background: #1e293b;
      transition: transform 0.3s ease;
    }
    .vinyl-disc {
      position: absolute;
      top: 10px;
      right: -25px;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, #0a0a0f 26%, #1c1c24 28%, #0e0e14 42%, #222230 58%, #0d0d12 72%, #1a1a24 88%, #060608 100%);
      box-shadow: 0 12px 30px rgba(0,0,0,0.8);
      border: 3px solid #2d2d3a;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }
    .vinyl-disc::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      background: conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.08) 45deg, transparent 90deg, rgba(255,255,255,0.08) 225deg, transparent 270deg);
      pointer-events: none;
    }
    .vinyl-disc.playing {
      transform: translateX(45px);
      animation: spinDisc 8s linear infinite;
    }
    .vinyl-disc.paused {
      transform: translateX(20px);
      animation-play-state: paused;
    }
    .vinyl-center {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary);
      border: 4px solid #fff;
      position: relative;
      z-index: 2;
    }
    @keyframes spinDisc {
      from { transform: translateX(45px) rotate(0deg); }
      to { transform: translateX(45px) rotate(360deg); }
    }

    /* Turntable Tone Arm (Needle) */
    .tone-arm-wrapper {
      position: absolute;
      top: -10px;
      right: -22px;
      width: 65px;
      height: 110px;
      z-index: 4;
      transform-origin: 50px 18px;
      transition: transform 0.65s cubic-bezier(0.34, 1.3, 0.64, 1);
      pointer-events: none;
      filter: drop-shadow(0 8px 12px rgba(0,0,0,0.6));
    }
    .tone-arm-wrapper.playing {
      transform: rotate(18deg);
    }
    .tone-arm-wrapper.paused {
      transform: rotate(-28deg);
    }
    .tone-arm-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    @media (max-width: 680px) {
      .art-and-disc {
        margin: 0 auto;
      }
      .vinyl-disc.playing {
        transform: translateY(20px) rotate(0deg);
      }
      .tone-arm-wrapper {
        display: none;
      }
    }

    /* Track Metadata */
    .track-meta {
      flex: 1;
      min-width: 0;
      position: relative;
      z-index: 5;
    }
    .audio-specs-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      background: rgba(6, 182, 212, 0.12);
      color: var(--accent);
      border: 1px solid rgba(6, 182, 212, 0.25);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 0.6rem;
    }
    .track-title {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.25;
      color: #fff;
      margin-bottom: 0.35rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .track-artist {
      font-size: 1.1rem;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 1.25rem;
    }

    /* Interactive Scrubbing Progress Bar */
    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-top: 0.75rem;
    }
    .progress-bar-wrapper {
      position: relative;
      width: 100%;
      height: 10px;
      background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 2px, rgba(255, 255, 255, 0.12) 2px, rgba(255, 255, 255, 0.12) 4px);
      border-radius: 9999px;
      cursor: pointer;
      overflow: visible;
      transition: height 0.2s ease;
    }
    .progress-bar-wrapper:hover {
      height: 12px;
    }
    .hover-time-badge {
      position: absolute;
      top: -28px;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-family: var(--font-mono);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 10;
    }
    .hover-time-badge.visible {
      opacity: 1;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      border-radius: 9999px;
      width: 0%;
      position: relative;
      box-shadow: 0 0 12px var(--accent-glow);
      transition: width 0.2s linear;
    }
    .progress-scrubber-handle {
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%) scale(0);
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 8px rgba(0,0,0,0.6);
      transition: transform 0.2s;
    }
    .progress-bar-wrapper:hover .progress-scrubber-handle {
      transform: translateY(-50%) scale(1);
    }
    .time-readout {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Player Controls Bar */
    .player-controls-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--card-border);
      flex-wrap: wrap;
    }
    .primary-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .ctrl-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ctrl-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.08);
      color: #fff;
    }
    .ctrl-btn.active {
      color: var(--accent);
      border-color: var(--accent);
      background: rgba(6, 182, 212, 0.15);
    }
    .ctrl-btn-play {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: #fff;
      border: none;
      box-shadow: 0 8px 24px var(--primary-glow);
    }
    .ctrl-btn-play:hover {
      transform: scale(1.1);
      box-shadow: 0 10px 30px var(--accent-glow);
    }

    /* Volume Slider */
    .volume-ctrl {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-family: var(--font-mono);
    }
    .volume-slider {
      -webkit-appearance: none;
      width: 110px;
      height: 6px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.12);
      outline: none;
      cursor: pointer;
    }
    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      box-shadow: 0 0 6px var(--accent-glow);
    }

    /* Visualizer Canvas */
    .visualizer-box {
      margin-top: 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--card-border);
      padding: 0.4rem;
    }
    #audioVisualizer {
      width: 100%;
      height: 52px;
      display: block;
    }

    /* Live Synced Lyrics */
    .lyrics-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .lyrics-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lyrics-box {
      height: 340px;
      overflow-y: auto;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.28);
      border: 1px solid var(--card-border);
      padding: 1.5rem;
      position: relative;
      scroll-behavior: smooth;
    }
    .lyrics-line {
      padding: 0.65rem 1rem;
      border-radius: 12px;
      font-size: 1.05rem;
      color: var(--text-dim);
      font-weight: 500;
      line-height: 1.5;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      filter: blur(0.4px);
      opacity: 0.45;
    }
    .lyrics-line:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
      filter: blur(0);
      opacity: 0.9;
    }
    .lyrics-line.active {
      color: #fff;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.45rem;
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.28), rgba(6, 182, 212, 0.16));
      border-left: 4px solid var(--accent);
      transform: scale(1.025);
      transform-origin: left;
      text-shadow: 0 0 22px var(--accent-glow);
      filter: blur(0);
      opacity: 1;
      position: relative;
      overflow: hidden;
    }
    .lyrics-line.active::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
      animation: lyricShimmer 2.2s infinite;
    }
    @keyframes lyricShimmer {
      0% { left: -100%; }
      100% { left: 200%; }
    }

    /* Sidebar - Queue & Tools */
    .sidebar-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Queue Card */
    .queue-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .queue-title {
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 700;
    }
    .queue-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      max-height: 380px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .queue-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.65rem 0.85rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      transition: all 0.2s ease;
    }
    .queue-item:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateX(3px);
    }
    .queue-idx {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-dim);
      min-width: 22px;
    }
    .queue-info {
      flex: 1;
      min-width: 0;
    }
    .queue-item-title {
      font-weight: 600;
      font-size: 0.88rem;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .queue-item-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Soundboard SFX Grid */
    .sfx-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.55rem;
      margin-top: 0.6rem;
    }
    .sfx-btn {
      padding: 0.55rem 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .sfx-btn:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    .sfx-btn:active {
      transform: scale(0.96);
    }

    /* Stats Grid */
    .stats-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.03);
      padding: 0.85rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .stat-val {
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--accent);
      line-height: 1.2;
    }
    .stat-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Fullscreen Karaoke Overlay */
    .karaoke-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(5, 8, 16, 0.94);
      backdrop-filter: blur(30px);
      z-index: 2000;
      display: none;
      flex-direction: column;
      padding: 2.5rem;
      box-sizing: border-box;
    }
    .karaoke-overlay.active {
      display: flex;
    }
    .karaoke-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1rem;
    }
    .karaoke-content {
      flex: 1;
      overflow-y: auto;
      text-align: center;
      padding: 3rem 1rem;
      scroll-behavior: smooth;
    }
    .karaoke-line {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-dim);
      padding: 1.25rem 0;
      transition: all 0.35s ease;
      cursor: pointer;
    }
    .karaoke-line.active {
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
      transform: scale(1.05);
      text-shadow: 0 0 35px var(--accent-glow);
    }

    /* Toast Notification */
    .toast-pill {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(60px);
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid var(--accent);
      color: #fff;
      padding: 0.65rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      z-index: 3000;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .toast-pill.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* Modal QR Code Remote HP */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2500;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 2.25rem;
      max-width: 440px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      animation: modalScale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes modalScale {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }
    .qr-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 18px;
      display: inline-block;
      margin: 1.25rem 0;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <!-- Ambient Aurora Orbs -->
  <div class="ambient-glow">
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>
    <div class="glow-orb orb-3"></div>
  </div>

  <!-- Header -->
  <header>
    <div class="brand">
      <div class="brand-avatar-box">
        <img src="/assets/miu_avatar.jpg" class="brand-avatar-img" alt="Miu" />
      </div>
      <div>
        <div class="brand-title">Miu Music 🌸</div>
        <div class="brand-sub">Kawaii Studio 🎀</div>
      </div>
    </div>

    <!-- Quick Search / Play input -->
    <div class="top-search-bar">
      <input type="text" id="topSearchInput" class="search-input" placeholder="Cari lagu atau paste link YouTube / Spotify..." />
      <button id="btnTopSearch" class="search-submit-btn" title="Putar Lagu">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>

    <!-- Header Tools -->
    <div class="header-actions">
      <button id="btnOpenKaraoke" class="btn-top" title="Buka Mode Karaoke Layar Penuh">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        Karaoke
      </button>

      <button id="btnOpenQrModal" class="btn-top" style="color: var(--accent); border-color: rgba(6,182,212,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
          <path d="M12 18h.01"/>
        </svg>
        Remote HP
      </button>

      <select id="themeSelector" class="theme-select">
        <option value="default">🌸 Miu Kawaii Pink</option>
        <option value="cosmic">Modern Cosmic</option>
        <option value="cyberpunk">Cyberpunk Neon</option>
        <option value="emerald">Emerald Studio</option>
        <option value="oled">OLED Pitch Black</option>
      </select>

      <div class="status-badge" id="statusBadge">
        <div class="dot-live"></div>
        <span id="statusText">Online</span>
      </div>
    </div>
  </header>

  <!-- Main Content Layout -->
  <main>
    <!-- Left Column: Player & Live Lyrics -->
    <section class="now-playing-container">
      <!-- Miu Kawaii Hero Banner -->
      <div class="miu-hero-banner">
        <img src="/assets/miu_banner.jpg" alt="Miu Banner" class="miu-hero-banner-img" />
        <div class="miu-hero-banner-overlay">
          <div class="miu-hero-badge">🎀 Karakter Resmi Miu</div>
          <div class="miu-hero-quote">Miu siap menemani setiap harimu dengan melodi manis dan alunan santai ~ ✨</div>
        </div>
      </div>

      <!-- Now Playing Hero Card -->
      <div class="card">
        <div class="hero-media-wrapper">
          <!-- Dynamic Ambient Artwork Glow Backdrop -->
          <div class="ambient-art-blur" id="ambientArtBlur"></div>

          <!-- Album Art with 3D Vinyl Disc & Animated Tone Arm -->
          <div class="art-and-disc">
            <img id="trackArtwork" class="artwork" src="/assets/miu_avatar.jpg" alt="Artwork Lagu" />
            <div id="vinylDisc" class="vinyl-disc paused">
              <div class="vinyl-center"></div>
            </div>
            <!-- Turntable Tone Arm Needle -->
            <div id="toneArm" class="tone-arm-wrapper paused">
              <svg class="tone-arm-svg" viewBox="0 0 70 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Base Pivot -->
                <circle cx="50" cy="18" r="14" fill="#1e293b" stroke="#64748b" stroke-width="2.5"/>
                <circle cx="50" cy="18" r="7" fill="url(#pivotGrad)" />
                <!-- Metallic Curved Arm -->
                <path d="M50 18 L46 65 L26 98" stroke="url(#armMetalGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Headshell Cartridge & Stylus -->
                <rect x="14" y="94" width="16" height="10" rx="2" transform="rotate(-32 14 94)" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5"/>
                <circle cx="21" cy="106" r="2" fill="#38bdf8"/>
                <defs>
                  <linearGradient id="pivotGrad" x1="43" y1="11" x2="57" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#94a3b8"/>
                    <stop offset="1" stop-color="#334155"/>
                  </linearGradient>
                  <linearGradient id="armMetalGrad" x1="50" y1="18" x2="26" y2="98" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#f8fafc"/>
                    <stop offset="0.5" stop-color="#94a3b8"/>
                    <stop offset="1" stop-color="#cbd5e1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <!-- Metadata & Details -->
          <div class="track-meta">
            <div class="audio-specs-badge" id="specsBadge">Lossless Hi-Res • Lavalink v4 • 48kHz</div>
            <h1 class="track-title" id="trackTitle">Tidak ada lagu yang sedang diputar</h1>
            <p class="track-artist" id="trackArtist">Miu Music Bot</p>

            <!-- Scrubbing Progress Bar -->
            <div class="progress-section">
              <div class="progress-bar-wrapper" id="progressBarWrapper">
                <div class="hover-time-badge" id="hoverTimeBadge">00:00</div>
                <div class="progress-fill" id="progressFill">
                  <div class="progress-scrubber-handle"></div>
                </div>
              </div>
              <div class="time-readout">
                <span id="currentTime">00:00</span>
                <span id="totalDuration">00:00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls Row -->
        <div class="player-controls-row">
          <!-- Playback Actions -->
          <div class="primary-controls">
            <button class="ctrl-btn" id="btnShuffle" title="Acak Antrean">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/>
                <path d="m18 2 4 4-4 4"/>
                <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l2 2.8"/>
                <path d="m18 14 4 4-4 4"/>
                <path d="M12.8 14.5l1.4 2c.8 1.1 2 1.7 3.3 1.7H22"/>
              </svg>
            </button>

            <button class="ctrl-btn" id="btnPrev" title="Lagu Sebelumnya (J)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="19 20 9 12 19 4 19 20"/>
                <line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" stroke-width="3"/>
              </svg>
            </button>

            <button class="ctrl-btn ctrl-btn-play" id="btnPlayPause" title="Jeda / Putar (Spasi)">
              <svg id="playIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4"/>
              </svg>
            </button>

            <button class="ctrl-btn" id="btnNext" title="Lewati Lagu (L)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" stroke-width="3"/>
              </svg>
            </button>

            <button class="ctrl-btn" id="btnLoop" title="Mode Repeat (Off / Track / Queue)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="m17 2 4 4-4 4"/>
                <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
                <path d="m7 22-4-4 4-4"/>
                <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
              </svg>
            </button>
          </div>

          <!-- Volume Controls -->
          <div class="volume-ctrl">
            <svg id="volIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <input type="range" id="volSlider" class="volume-slider" min="0" max="150" value="50">
            <span id="volValue">50%</span>
          </div>
        </div>

        <!-- 60FPS Audio Visualizer -->
        <div class="visualizer-box">
          <canvas id="audioVisualizer" height="52"></canvas>
        </div>
      </div>

      <!-- Live Synced Lyrics Card -->
      <div class="card">
        <div class="lyrics-card-header">
          <div class="lyrics-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" x2="8" y1="13" y2="13"/>
              <line x1="16" x2="8" y1="17" y2="17"/>
            </svg>
            Lirik Real-Time
          </div>
          <span style="font-size: 0.78rem; font-weight: 600; color: var(--accent);" id="lyricsSourceBadge">
            LRCLIB Synced Engine
          </span>
        </div>

        <div class="lyrics-box" id="lyricsBox">
          <div style="color: var(--text-dim); text-align: center; padding-top: 6rem;">
            Pilih lagu untuk menampilkan lirik bersinkronisasi...
          </div>
        </div>
      </div>
    </section>

    <!-- Right Column: Queue, Soundboard & Stats -->
    <aside class="sidebar-wrapper">
      <!-- Antrean Musik Card -->
      <div class="card">
        <div class="queue-header-row">
          <div class="queue-title">Antrean Lagu (<span id="queueCount" style="color: var(--accent);">0</span>)</div>
          <button class="btn-top" style="padding: 0.25rem 0.65rem;" onclick="fetchStatus()">Refresh</button>
        </div>
        <div class="queue-list" id="queueList">
          <div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 2.5rem 0;">
            Antrean kosong. Putar lagu dari search bar di atas!
          </div>
        </div>
      </div>

      <!-- Quick Soundboard SFX Card -->
      <div class="card">
        <div style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">
          🔊 Quick Soundboard SFX
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.6rem;">
          Kirim efek suara instan ke Voice Channel Discord:
        </p>
        <div class="sfx-grid">
          <button class="sfx-btn" onclick="playSfx('airhorn')">
            <span>🎺</span>
            <span>Airhorn</span>
          </button>
          <button class="sfx-btn" onclick="playSfx('bruh')">
            <span>🗿</span>
            <span>Bruh</span>
          </button>
          <button class="sfx-btn" onclick="playSfx('applause')">
            <span>👏</span>
            <span>Applause</span>
          </button>
          <button class="sfx-btn" onclick="playSfx('badumtss')">
            <span>🥁</span>
            <span>Ba-Dum-Tss</span>
          </button>
          <button class="sfx-btn" onclick="playSfx('victory')">
            <span>🏆</span>
            <span>Victory</span>
          </button>
          <button class="sfx-btn" onclick="playSfx('sadviolin')">
            <span>🎻</span>
            <span>Sad Violin</span>
          </button>
        </div>
      </div>

      <!-- Server Stats Card -->
      <div class="card">
        <div style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700;">
          📊 Statistik Bot & Server
        </div>
        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-val" id="statPlays">0</div>
            <div class="stat-lbl">Lagu Diputar</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="statDuration">0m</div>
            <div class="stat-lbl">Total Durasi</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="statPing">0ms</div>
            <div class="stat-lbl">Discord Ping</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="statGuilds">1</div>
            <div class="stat-lbl">Server Terkoneksi</div>
          </div>
        </div>
      </div>
    </aside>
  </main>

  <!-- Fullscreen Karaoke Modal -->
  <div class="karaoke-overlay" id="karaokeOverlay">
    <div class="karaoke-header">
      <div style="text-align: left;">
        <h2 id="karaokeTrackTitle" style="font-family: var(--font-display); font-size: 1.6rem; color: #fff;">Lirik Lagu</h2>
        <p id="karaokeTrackArtist" style="color: var(--accent); font-weight: 600;">Miu Music Bot</p>
      </div>
      <button class="btn-top" id="btnCloseKaraoke" style="padding: 0.6rem 1.2rem; font-size: 0.95rem;">
        ✕ Tutup Karaoke
      </button>
    </div>
    <div class="karaoke-content" id="karaokeBox">
      <!-- Fullscreen Synced Lyrics Lines -->
    </div>
  </div>

  <!-- Modal QR Code Remote HP -->
  <div class="modal-overlay" id="qrModal">
    <div class="modal-card">
      <h2 style="font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">
        📱 Remote HP (Multi-Device)
      </h2>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem;">
        Hubungkan smartphone Anda ke Wi-Fi yang sama, lalu pindai QR Code di bawah untuk membuka remote controller:
      </p>
      <div class="qr-container">
        <img id="qrCodeImg" style="width: 200px; height: 200px; display: block;" alt="QR Code Remote" />
      </div>
      <div style="margin-bottom: 1.25rem;">
        <input type="text" id="lanUrlInput" readonly style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.4); border: 1px solid var(--card-border); border-radius: 10px; padding: 0.65rem; color: #fff; text-align: center; font-size: 0.85rem; font-family: var(--font-mono); margin-bottom: 0.6rem;" />
        <button class="btn-top" id="btnCopyLanUrl" style="width: 100%; justify-content: center; font-weight: 700;">
          📋 Salin Tautan
        </button>
      </div>
      <button class="btn-top" id="btnCloseQrModal" style="width: 100%; justify-content: center;">
        Tutup
      </button>
    </div>
  </div>

  <!-- Notification Toast -->
  <div class="toast-pill" id="toastPill">
    <span id="toastIcon">✨</span>
    <span id="toastMsg">Berhasil</span>
  </div>

  <script>
    let currentTrackTitle = "";
    let currentTrackArtist = "";
    let syncedLines = [];
    let currentPosition = 0;
    let trackDuration = 0;
    let isPlaying = false;
    let repeatMode = "off";
    let isUserDraggingVolume = false;
    let eventSource = null;

    // Token Otentikasi QR Remote
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    if (queryToken) {
      sessionStorage.setItem('mmb_token', queryToken);
    }
    const lanToken = queryToken || sessionStorage.getItem('mmb_token') || '';

    function showToast(msg, icon = '✨') {
      const toast = document.getElementById('toastPill');
      document.getElementById('toastMsg').innerText = msg;
      document.getElementById('toastIcon').innerText = icon;
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    function formatTime(ms) {
      if (!ms || isNaN(ms)) return "00:00";
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return String(min).padStart(2, '0') + ":" + String(sec).padStart(2, '0');
    }

    function updatePlayPauseUi(playing) {
      const playBtn = document.getElementById('btnPlayPause');
      const vinylDisc = document.getElementById('vinylDisc');
      const toneArm = document.getElementById('toneArm');
      if (playing) {
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        if (vinylDisc) vinylDisc.className = 'vinyl-disc playing';
        if (toneArm) toneArm.className = 'tone-arm-wrapper playing';
      } else {
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
        if (vinylDisc) vinylDisc.className = 'vinyl-disc paused';
        if (toneArm) toneArm.className = 'tone-arm-wrapper paused';
      }
    }

    async function sendPlayerAction(action, data = {}) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (lanToken) {
          headers['X-Remote-Token'] = lanToken;
        }
        const res = await fetch('/api/player/' + action, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.message) {
          showToast(json.message, json.success ? '✅' : '⚠️');
        }
        // Fallback polling jika SSE lambat
        fetchStatus();
      } catch (e) {
        console.error("Action error:", e);
      }
    }

    // Controls Event Listeners (Optimistic UI Zero-Lag)
    document.getElementById('btnPlayPause').addEventListener('click', () => {
      isPlaying = !isPlaying;
      updatePlayPauseUi(isPlaying);
      sendPlayerAction(isPlaying ? 'resume' : 'pause');
    });
    document.getElementById('btnNext').addEventListener('click', () => {
      showToast('Skipping lagu...', '⏭️');
      sendPlayerAction('skip');
    });
    document.getElementById('btnPrev').addEventListener('click', () => {
      showToast('Lagu sebelumnya...', '⏮️');
      sendPlayerAction('previous');
    });
    document.getElementById('btnShuffle').addEventListener('click', () => {
      showToast('Mengacak antrean...', '🔀');
      sendPlayerAction('shuffle');
    });
    
    const btnLoop = document.getElementById('btnLoop');
    btnLoop.addEventListener('click', () => {
      sendPlayerAction('loop');
    });

    // Interactive Scrubbing Progress Bar (Optimistic UI & Live Hover Preview)
    const progressBarWrapper = document.getElementById('progressBarWrapper');
    const hoverTimeBadge = document.getElementById('hoverTimeBadge');

    progressBarWrapper.addEventListener('mousemove', (e) => {
      if (!trackDuration || trackDuration <= 0) return;
      const rect = progressBarWrapper.getBoundingClientRect();
      const hoverX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = hoverX / rect.width;
      const previewMs = Math.floor(ratio * trackDuration);
      if (hoverTimeBadge) {
        hoverTimeBadge.innerText = formatTime(previewMs);
        hoverTimeBadge.style.left = hoverX + 'px';
        hoverTimeBadge.classList.add('visible');
      }
    });

    progressBarWrapper.addEventListener('mouseleave', () => {
      if (hoverTimeBadge) hoverTimeBadge.classList.remove('visible');
    });

    progressBarWrapper.addEventListener('click', (e) => {
      if (!trackDuration || trackDuration <= 0) return;
      const rect = progressBarWrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetMs = Math.floor(ratio * trackDuration);

      // Instan lompat di UI lokal (0ms feedback)
      currentPosition = targetMs;
      document.getElementById('currentTime').innerText = formatTime(currentPosition);
      document.getElementById('progressFill').style.width = (ratio * 100) + '%';
      updateLyricsHighlight(currentPosition);

      sendPlayerAction('seek', { position: targetMs });
    });

    // Volume Slider (Optimistic drag and display)
    const volSlider = document.getElementById('volSlider');
    volSlider.addEventListener('input', (e) => {
      isUserDraggingVolume = true;
      document.getElementById('volValue').innerText = e.target.value + '%';
    });
    volSlider.addEventListener('change', (e) => {
      isUserDraggingVolume = false;
      const vol = e.target.value;
      document.getElementById('volValue').innerText = vol + '%';
      sendPlayerAction('volume', { volume: vol });
    });

    // Top Search / Quick Play
    const topSearchInput = document.getElementById('topSearchInput');
    const btnTopSearch = document.getElementById('btnTopSearch');
    
    function triggerPlaySearch() {
      const q = topSearchInput.value.trim();
      if (!q) return;
      sendPlayerAction('play', { query: q });
      topSearchInput.value = '';
    }
    btnTopSearch.addEventListener('click', triggerPlaySearch);
    topSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerPlaySearch();
    });

    // Soundboard SFX
    async function playSfx(effect) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (lanToken) headers['X-Remote-Token'] = lanToken;
        const res = await fetch('/api/player/sfx', {
          method: 'POST',
          headers,
          body: JSON.stringify({ effect })
        });
        const json = await res.json();
        showToast(json.message || "SFX Diputar", '🔊');
        fetchStatus();
      } catch (e) {
        console.error("SFX Error:", e);
      }
    }

    // Lyrics Fetcher & Synchronizer
    async function loadLyrics(title, artist) {
      const lyricsBox = document.getElementById('lyricsBox');
      const karaokeBox = document.getElementById('karaokeBox');
      lyricsBox.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding-top: 5rem;">Mencari lirik di database terbuka...</div>';
      karaokeBox.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding-top: 5rem;">Mencari lirik...</div>';
      syncedLines = [];

      try {
        const res = await fetch('/api/lyrics?title=' + encodeURIComponent(title) + '&artist=' + encodeURIComponent(artist));
        const data = await res.json();

        if (data.syncedLines && data.syncedLines.length > 0) {
          syncedLines = data.syncedLines;
          lyricsBox.innerHTML = syncedLines.map((line, idx) => 
            \`<div class="lyrics-line" id="lyric-\${idx}">\${line.text || "♪"}</div>\`
          ).join('');
          karaokeBox.innerHTML = syncedLines.map((line, idx) => 
            \`<div class="karaoke-line" id="k-lyric-\${idx}">\${line.text || "♪"}</div>\`
          ).join('');
        } else if (data.plainLyrics) {
          lyricsBox.innerHTML = '<div style="white-space: pre-wrap; line-height: 1.8; color: #cbd5e1;">' + data.plainLyrics + '</div>';
          karaokeBox.innerHTML = '<div style="white-space: pre-wrap; line-height: 2; font-size: 1.5rem; color: #fff;">' + data.plainLyrics + '</div>';
        } else {
          lyricsBox.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding-top: 5rem;">Lirik tidak ditemukan di database terbuka.</div>';
          karaokeBox.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding-top: 5rem;">Lirik tidak ditemukan.</div>';
        }
      } catch (e) {
        lyricsBox.innerHTML = '<div style="color: var(--error); text-align: center; padding-top: 5rem;">Gagal memuat lirik.</div>';
      }
    }

    function updateLyricsHighlight(pos) {
      if (!syncedLines || syncedLines.length === 0) return;
      let activeIdx = -1;
      for (let i = 0; i < syncedLines.length; i++) {
        if (pos >= syncedLines[i].time) {
          activeIdx = i;
        } else {
          break;
        }
      }

      if (activeIdx !== -1) {
        const prevActive = document.querySelector('.lyrics-line.active');
        const nextActive = document.getElementById('lyric-' + activeIdx);
        if (prevActive && prevActive !== nextActive) {
          prevActive.classList.remove('active');
        }
        if (nextActive && !nextActive.classList.contains('active')) {
          nextActive.classList.add('active');
          nextActive.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Fullscreen Karaoke Synced lines
        const prevK = document.querySelector('.karaoke-line.active');
        const nextK = document.getElementById('k-lyric-' + activeIdx);
        if (prevK && prevK !== nextK) prevK.classList.remove('active');
        if (nextK && !nextK.classList.contains('active')) {
          nextK.classList.add('active');
          nextK.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    // Media Session API Integration
    function updateMediaSession(current, playing) {
      if (!('mediaSession' in navigator)) return;
      if (current) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.title,
          artist: current.author || 'Discord Music Bot',
          album: 'Discord Live Session',
          artwork: current.artworkUrl ? [
            { src: current.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: current.artworkUrl, sizes: '256x256', type: 'image/jpeg' }
          ] : [
            { src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      } else {
        navigator.mediaSession.playbackState = 'none';
      }
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => sendPlayerAction('resume'));
      navigator.mediaSession.setActionHandler('pause', () => sendPlayerAction('pause'));
      navigator.mediaSession.setActionHandler('previoustrack', () => sendPlayerAction('previous'));
      navigator.mediaSession.setActionHandler('nexttrack', () => sendPlayerAction('skip'));
    }

    // Menerapkan data snapshot status ke seluruh elemen antarmuka (DOM)
    function applyStatusData(data) {
      if (!data) return;

      document.getElementById('statusText').innerText = data.connected ? 'Online (' + (data.ping || 0) + 'ms)' : 'Offline';
      document.getElementById('statPing').innerText = (data.ping || 0) + 'ms';
      document.getElementById('statGuilds').innerText = data.guildCount || 1;

      const vinylDisc = document.getElementById('vinylDisc');

      if (data.player && data.player.current) {
        const cur = data.player.current;
        isPlaying = data.player.playing && !data.player.paused;

        // Drift correction: jika selisih posisi server dengan estimasi lokal > 2000ms atau player dijeda
        const serverPos = data.player.position || 0;
        if (!isPlaying || Math.abs(currentPosition - serverPos) > 2000) {
          currentPosition = serverPos;
        }

        trackDuration = cur.duration || 0;
        repeatMode = data.player.repeatMode || "off";

        // Track info
        document.getElementById('trackTitle').innerText = cur.title;
        document.getElementById('trackArtist').innerText = cur.author || 'Miu Music';
        document.getElementById('trackArtwork').src = cur.artworkUrl || '/assets/miu_avatar.jpg';
        
        // Ambient Artwork Backdrop Glow
        const ambientArt = document.getElementById('ambientArtBlur');
        if (ambientArt) {
          ambientArt.style.backgroundImage = cur.artworkUrl ? 'url(' + cur.artworkUrl + ')' : 'none';
        }

        document.getElementById('karaokeTrackTitle').innerText = cur.title;
        document.getElementById('karaokeTrackArtist').innerText = cur.author || 'Unknown Artist';

        // Play/Pause icon, Vinyl disc & Turntable needle
        updatePlayPauseUi(isPlaying);

        // Loop Mode UI state
        if (repeatMode === 'track') {
          btnLoop.classList.add('active');
          btnLoop.title = "Mode Repeat: Lagu Ini (Track)";
        } else if (repeatMode === 'queue') {
          btnLoop.classList.add('active');
          btnLoop.title = "Mode Repeat: Seluruh Antrean (Queue)";
        } else {
          btnLoop.classList.remove('active');
          btnLoop.title = "Mode Repeat: Mati (Off)";
        }

        // Volume Slider (hanya update jika pengguna tidak sedang menggeser)
        if (!isUserDraggingVolume && typeof data.player.volume === 'number') {
          volSlider.value = data.player.volume;
          document.getElementById('volValue').innerText = data.player.volume + '%';
        }

        // Progress
        document.getElementById('currentTime').innerText = formatTime(currentPosition);
        document.getElementById('totalDuration').innerText = formatTime(trackDuration);
        const pct = trackDuration > 0 ? (currentPosition / trackDuration) * 100 : 0;
        document.getElementById('progressFill').style.width = pct + '%';

        // Lyrics update check
        if (cur.title !== currentTrackTitle || cur.author !== currentTrackArtist) {
          currentTrackTitle = cur.title;
          currentTrackArtist = cur.author;
          loadLyrics(cur.title, cur.author);
        }

        updateLyricsHighlight(currentPosition);

        // Queue List
        const qList = data.player.queue || [];
        document.getElementById('queueCount').innerText = qList.length;
        if (qList.length > 0) {
          document.getElementById('queueList').innerHTML = qList.map((t, i) => \`
            <div class="queue-item">
              <span class="queue-idx">\${i + 1}</span>
              <div class="queue-info">
                <div class="queue-item-title">\${t.title}</div>
                <div class="queue-item-sub">\${t.author} • \${formatTime(t.duration)}</div>
              </div>
            </div>
          \`).join('');
        } else {
          document.getElementById('queueList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 2.5rem 0;">Antrean kosong. Putar lagu dari search bar di atas!</div>';
        }

        updateMediaSession(cur, isPlaying);
      } else {
        updateMediaSession(null, false);
        isPlaying = false;
        currentPosition = 0;
        trackDuration = 0;
        updatePlayPauseUi(false);
        const ambientArt = document.getElementById('ambientArtBlur');
        if (ambientArt) {
          ambientArt.style.backgroundImage = 'none';
        }
        document.getElementById('trackTitle').innerText = 'Menunggu Lagu Dimulai ~ 🌸';
        document.getElementById('trackArtist').innerText = 'Miu siap menemani harimu dengan musik manis! 🎀';
        document.getElementById('trackArtwork').src = '/assets/miu_avatar.jpg';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('currentTime').innerText = '00:00';
        document.getElementById('totalDuration').innerText = '00:00';
        document.getElementById('queueList').innerHTML = '<div style="color: var(--text-dim); font-size: 0.85rem; text-align: center; padding: 2.5rem 0;">Antrean kosong. Yuk cari lagu atau paste link YouTube / Spotify di atas! 🐇</div>';
      }

      // Stats
      if (data.stats) {
        document.getElementById('statPlays').innerText = data.stats.totalPlays;
        const mins = Math.floor(data.stats.totalDurationMs / (1000 * 60));
        document.getElementById('statDuration').innerText = mins + 'm';
      }
    }

    // Fetch Status Polling (Heartbeat & Fallback)
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        applyStatusData(data);
      } catch (e) {
        console.error("Fetch status error:", e);
      }
    }

    // Real-Time Server-Sent Events (SSE) Stream
    function initSSE() {
      if (!('EventSource' in window)) {
        console.warn("Browser tidak mendukung EventSource (SSE), menggunakan fallback polling.");
        return;
      }
      try {
        const sseUrl = '/api/events' + (lanToken ? '?token=' + encodeURIComponent(lanToken) : '');
        if (eventSource) {
          eventSource.close();
        }
        eventSource = new EventSource(sseUrl);

        const handleSseMessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            applyStatusData(data);
          } catch (err) {
            console.error("SSE parse error:", err);
          }
        };

        eventSource.addEventListener('init', handleSseMessage);
        eventSource.addEventListener('state_change', handleSseMessage);
        eventSource.addEventListener('track_change', handleSseMessage);

        eventSource.onerror = () => {
          // Browser otomatis melakukan reconnect pada SSE jika terputus
        };
      } catch (err) {
        console.warn("Gagal menginisialisasi SSE:", err);
      }
    }

    // Dynamic High-Precision Clock Interpolation with Page Visibility Throttling
    let clockIntervalTimer = null;
    let clockTickMs = 100;

    function runClockTick() {
      if (isPlaying && trackDuration > 0) {
        currentPosition = Math.min(trackDuration, currentPosition + clockTickMs);
        document.getElementById('currentTime').innerText = formatTime(currentPosition);
        const pct = (currentPosition / trackDuration) * 100;
        document.getElementById('progressFill').style.width = pct + '%';
        updateLyricsHighlight(currentPosition);
      }
    }

    function setupClockTicker(intervalMs = 100) {
      if (clockIntervalTimer) clearInterval(clockIntervalTimer);
      clockTickMs = intervalMs;
      clockIntervalTimer = setInterval(runClockTick, intervalMs);
    }
    setupClockTicker(100);

    // Page Visibility API: Hemat CPU & baterai HP saat background/tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setupClockTicker(1000); // Throttle ke 1000ms saat layar HP mati / tab diminimize
      } else {
        setupClockTicker(100);  // Pulihkan ke 100ms ultra-smooth 60 FPS saat layar aktif
        fetchStatus();          // Kalibrasi ulang posisi server seketika
      }
    });

    // Modal QR Code Remote HP Handler
    const btnOpenQrModal = document.getElementById('btnOpenQrModal');
    const btnCloseQrModal = document.getElementById('btnCloseQrModal');
    const qrModal = document.getElementById('qrModal');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const lanUrlInput = document.getElementById('lanUrlInput');
    const btnCopyLanUrl = document.getElementById('btnCopyLanUrl');

    if (btnOpenQrModal) {
      btnOpenQrModal.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/lan-info');
          const data = await res.json();
          lanUrlInput.value = data.lanUrl;
          qrCodeImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(data.lanUrl);
        } catch {
          lanUrlInput.value = window.location.origin;
          qrCodeImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(window.location.origin);
        }
        qrModal.classList.add('active');
      });
    }

    if (btnCloseQrModal) {
      btnCloseQrModal.addEventListener('click', () => qrModal.classList.remove('active'));
    }
    if (qrModal) {
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.classList.remove('active');
      });
    }
    if (btnCopyLanUrl) {
      btnCopyLanUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(lanUrlInput.value);
        showToast('Tautan LAN Remote Disalin!', '📋');
      });
    }

    // Fullscreen Karaoke Mode
    const btnOpenKaraoke = document.getElementById('btnOpenKaraoke');
    const btnCloseKaraoke = document.getElementById('btnCloseKaraoke');
    const karaokeOverlay = document.getElementById('karaokeOverlay');

    if (btnOpenKaraoke) {
      btnOpenKaraoke.addEventListener('click', () => {
        karaokeOverlay.classList.add('active');
      });
    }
    if (btnCloseKaraoke) {
      btnCloseKaraoke.addEventListener('click', () => {
        karaokeOverlay.classList.remove('active');
      });
    }

    // Theme Switcher & Storage
    const themeSelector = document.getElementById('themeSelector');
    const savedTheme = localStorage.getItem('mmb_theme') || 'default';
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);

    themeSelector.addEventListener('change', (e) => {
      const selected = e.target.value;
      localStorage.setItem('mmb_theme', selected);
      applyTheme(selected);
    });

    function applyTheme(theme) {
      document.body.classList.remove('theme-oled', 'theme-cyberpunk', 'theme-emerald', 'theme-cosmic');
      if (theme !== 'default') {
        document.body.classList.add('theme-' + theme);
      }
    }

    // 60FPS Dynamic Audio Visualizer
    const canvas = document.getElementById('audioVisualizer');
    const ctx = canvas.getContext('2d');
    const barCount = 36;
    const peakCaps = new Array(barCount).fill(0);

    function resizeCanvas() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 52;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function renderVisualizer() {
      if (document.hidden) {
        requestAnimationFrame(renderVisualizer);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const totalWidth = canvas.width;
      const barWidth = Math.max(4, Math.floor((totalWidth - (barCount * 3)) / barCount));
      const time = Date.now() / 250;

      // Layer 1: Spectrum frequency bars & falling peak caps
      for (let i = 0; i < barCount; i++) {
        let h = 4;
        if (isPlaying) {
          // Kombinasi gelombang audio multitonal
          const wave1 = Math.sin(time + i * 0.28) * Math.cos(time * 0.7 + i * 0.15);
          const wave2 = Math.cos(time * 1.2 + i * 0.4) * Math.sin(time * 0.5 + i * 0.1);
          const magnitude = Math.abs(wave1 * 0.7 + wave2 * 0.5);
          h = Math.max(4, magnitude * (canvas.height - 10));
        }

        // Peak caps decay physics
        if (h > peakCaps[i]) {
          peakCaps[i] = h;
        } else {
          peakCaps[i] = Math.max(4, peakCaps[i] - 0.45);
        }

        const x = i * (barWidth + 3);
        const y = canvas.height - h;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.95)');

        ctx.fillStyle = isPlaying ? grad : 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, [3, 3, 0, 0]);
        ctx.fill();

        // Draw Peak Cap
        if (isPlaying) {
          const capY = canvas.height - peakCaps[i] - 2;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x, Math.max(0, capY), barWidth, 2);
        }
      }

      // Layer 2: Real-time Oscillograph Sinusoidal Neon Wave
      if (isPlaying) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        const midY = canvas.height * 0.45;
        for (let x = 0; x <= canvas.width; x += 4) {
          const freq = (x / canvas.width) * Math.PI * 4;
          const waveY = midY + Math.sin(time * 1.6 + freq) * Math.cos(time * 0.9 + freq * 0.5) * 8;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
        ctx.restore();
      }

      requestAnimationFrame(renderVisualizer);
    }
    renderVisualizer();

    // Hotkeys Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        sendPlayerAction(isPlaying ? 'pause' : 'resume');
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        sendPlayerAction('skip');
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        sendPlayerAction('previous');
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const v = Math.min(150, parseInt(volSlider.value) + 5);
        volSlider.value = v;
        volSlider.dispatchEvent(new Event('change'));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const v = Math.max(0, parseInt(volSlider.value) - 5);
        volSlider.value = v;
        volSlider.dispatchEvent(new Event('change'));
      }
    });

    // Real-Time SSE Stream Initialization & Fallback Heartbeat (10s)
    initSSE();
    setInterval(fetchStatus, 10000);
    fetchStatus();
  </script>
</body>
</html>`;
}
