import test from "node:test";
import assert from "node:assert/strict";
import { renderDashboardHtml } from "../src/web/server.js";

test("Visual Upgrade - Ambient Artwork Glow Backdrop is embedded in markup and styles", () => {
  const html = renderDashboardHtml();

  // Markup element presence
  assert.ok(html.includes('id="ambientArtBlur"'), "ambientArtBlur ID must be present in DOM");
  assert.ok(html.includes('class="ambient-art-blur"'), "ambient-art-blur class must be present");

  // CSS rules
  assert.ok(html.includes("filter: blur(65px) saturate(220%)"), "Blur and saturation filter must be defined");
  assert.ok(html.includes("pointer-events: none"), "Ambient blur must have pointer-events: none for zero-interaction interference");

  // JS binding in applyStatusData
  assert.ok(html.includes("ambientArt.style.backgroundImage"), "ambientArt backdrop must be dynamically updated with artwork URL");
});

test("Visual Upgrade - Realistic 3D Vinyl Disc & Turntable Tone Arm (Needle) are present", () => {
  const html = renderDashboardHtml();

  // Vinyl disc groove specular conic gradient
  assert.ok(html.includes("conic-gradient(from 45deg"), "Vinyl disc must feature realistic groove reflection");

  // Turntable Tone Arm SVG and classes
  assert.ok(html.includes('id="toneArm"'), "toneArm ID must be present");
  assert.ok(html.includes('class="tone-arm-wrapper paused"'), "tone-arm-wrapper must default to paused");
  assert.ok(html.includes('<svg class="tone-arm-svg"'), "Tone arm must be rendered via scalable vector SVG");

  // Tone Arm Needle GPU CSS transitions and rotation angles
  assert.ok(html.includes(".tone-arm-wrapper.playing"), "Tone arm playing CSS state must exist");
  assert.ok(html.includes("transform: rotate(18deg)"), "Tone arm must rotate onto the vinyl disc when playing");
  assert.ok(html.includes("transform: rotate(-28deg)"), "Tone arm must rest off the vinyl disc when paused");

  // JS Zero-latency optimistic synchronization
  assert.ok(html.includes("if (toneArm) toneArm.className = 'tone-arm-wrapper playing'"), "Tone arm class must be set to playing");
  assert.ok(html.includes("if (toneArm) toneArm.className = 'tone-arm-wrapper paused'"), "Tone arm class must be set to paused");
});

test("Visual Upgrade - Acoustic Waveform Seekbar & Hover Time Badge", () => {
  const html = renderDashboardHtml();

  // Seekbar acoustic ticks background
  assert.ok(html.includes("repeating-linear-gradient(90deg"), "Progress bar must feature acoustic ticks gradient");

  // Hover Time Badge element and styles
  assert.ok(html.includes('id="hoverTimeBadge"'), "hoverTimeBadge ID must be present inside seekbar");
  assert.ok(html.includes(".hover-time-badge.visible"), "hover-time-badge.visible style must exist");

  // Event listeners in JS
  assert.ok(html.includes("progressBarWrapper.addEventListener('mousemove'"), "Mousemove listener for seekbar hover badge must be bound");
  assert.ok(html.includes("progressBarWrapper.addEventListener('mouseleave'"), "Mouseleave listener for seekbar hover badge must be bound");
});

test("Visual Upgrade - 60 FPS Dual-Layer Visualizer (Oscillograph Sinusoidal Wave)", () => {
  const html = renderDashboardHtml();

  // Canvas visualizer presence
  assert.ok(html.includes('id="audioVisualizer"'), "audioVisualizer canvas element must exist");

  // Dual layer rendering
  assert.ok(html.includes("Layer 1: Spectrum frequency bars"), "Visualizer must contain Layer 1 spectrum bars");
  assert.ok(html.includes("Layer 2: Real-time Oscillograph Sinusoidal Neon Wave"), "Visualizer must contain Layer 2 neon wave");
  assert.ok(html.includes("ctx.shadowColor = '#06b6d4'"), "Neon oscillograph glow shadow color must be cyan accent");

  // CPU & GPU efficiency check
  assert.ok(html.includes("if (document.hidden)"), "Visualizer render loop must respect Page Visibility API to save CPU cycles");
});

test("Visual Upgrade - Synced Shimmer Lyrics with Depth-of-Field Blur", () => {
  const html = renderDashboardHtml();

  // Depth of field CSS for lyrics
  assert.ok(html.includes("filter: blur(0.4px)"), "Unfocused lyrics lines must have depth-of-field blur");
  assert.ok(html.includes("opacity: 0.45"), "Unfocused lyrics lines must be softened");

  // Active line highlight & shimmer animation
  assert.ok(html.includes("animation: lyricShimmer 2.2s infinite"), "Active lyric line must have animated shimmer sweep");
  assert.ok(html.includes("@keyframes lyricShimmer"), "lyricShimmer keyframes must be defined");
});
