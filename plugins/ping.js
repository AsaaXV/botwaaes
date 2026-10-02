/*═══════════════════════════════════════════════════════
 *  ⌬  YT NeoShiroko Labs
 *═══════════════════════════════════════════════════════
 *  🌐  Website     : https://shirokode.web.id
 *  ⌨︎  Developer   : https://zass.in
 *  ▶︎  YouTube     : https://www.youtube.com/@shirokode
 *  ⚙︎  Panel Murah : pterokudesu.web.id
 *
 *  ⚠︎  Mohon untuk tidak menghapus watermark ini
 *═══════════════════ © 2025 Zass Desuta ─════════════════════
 */

import os from "os";
import fs from "fs";

function fmtGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

function getDiskUsage() {
  try {
    const stat = fs.statfsSync("/");
    const total = stat.blocks * stat.bsize;
    const free = stat.bfree * stat.bsize;
    const used = total - free;
    return { total, free, used, pct: Number(((used / total) * 100).toFixed(1)) };
  } catch {
    return null;
  }
}

let handler = async (m, { zassbtz, runtime }) => {
  const start = Date.now();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const ramPct = Number(((usedMem / totalMem) * 100).toFixed(1));

  const cpus = os.cpus();
  const cpuCount = cpus.length || 1;
  const [load1, load5, load15] = os.loadavg();
  const cpuPct = Number(Math.min(100, (load1 / cpuCount) * 100).toFixed(1));

  const disk = getDiskUsage();
  const diskPct = disk ? disk.pct : 0;

  let totalGroups = 0;
  try {
    const groups = await zassbtz.groupFetchAllParticipating();
    totalGroups = Object.keys(groups).length;
  } catch {}

  let totalPlugins = 0;
  try {
    totalPlugins = fs.readdirSync("./plugins").filter((f) => f.endsWith(".js")).length;
  } catch {}

  const rawShare = ramPct + cpuPct + diskPct || 1;
  const ramDeg = (ramPct / rawShare) * 360;
  const cpuDeg = (cpuPct / rawShare) * 360;
  const diskDeg = 360 - ramDeg - cpuDeg;

  const colorRam = "#22d3ee";
  const colorCpu = "#f472b6";
  const colorDisk = "#facc15";
  const colorIdle = "#334155";

  const speed = Date.now() - start;

  const html = `
<div style="display:flex; align-items:center; gap:24px; font-family:sans-serif; color:#e2e8f0; background:#0f172a; padding:20px; border-radius:16px;">
  <div style="position:relative; width:150px; height:150px; border-radius:50%;
    background: conic-gradient(${colorRam} 0deg ${ramDeg}deg, ${colorCpu} ${ramDeg}deg ${ramDeg + cpuDeg}deg, ${colorDisk} ${ramDeg + cpuDeg}deg ${ramDeg + cpuDeg + diskDeg}deg, ${colorIdle} ${ramDeg + cpuDeg + diskDeg}deg 360deg);
    display:flex; align-items:center; justify-content:center;">
    <div style="width:98px; height:98px; border-radius:50%; background:#0f172a; display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <span style="font-size:16px; font-weight:bold; color:${colorRam};">${ramPct}%</span>
      <span style="font-size:10px; color:#94a3b8;">RAM</span>
    </div>
  </div>
  <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
    <div>
      <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Ram: ${fmtGB(usedMem)} / ${fmtGB(totalMem)}</div>
      <div style="background:${colorIdle}; border-radius:6px; height:10px; width:100%;">
        <div style="background:${colorRam}; border-radius:6px; height:10px; width:${ramPct}%;"></div>
      </div>
    </div>
    <div>
      <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">CPU Load: ${cpuPct}% (${load1.toFixed(2)} / ${cpuCount} core)</div>
      <div style="background:${colorIdle}; border-radius:6px; height:10px; width:100%;">
        <div style="background:${colorCpu}; border-radius:6px; height:10px; width:${cpuPct}%;"></div>
      </div>
    </div>
    <div>
      <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Disk: ${disk ? `${fmtGB(disk.used)} / ${fmtGB(disk.total)}` : "Tidak tersedia"}</div>
      <div style="background:${colorIdle}; border-radius:6px; height:10px; width:100%;">
        <div style="background:${colorDisk}; border-radius:6px; height:10px; width:${diskPct}%;"></div>
      </div>
    </div>
  </div>
</div>`;

  await zassbtz.messageBuilder(m.chat, { quoted: m })
    .setType("AIRich")
    .setTitle("Pong!")
    .addTable([
      ["Info", "Value"],
      ["Kecepatan", `${speed} ms`],
      ["Hostname", os.hostname()],
      ["Platform", `${os.platform()} ${os.release()} (${os.arch()})`],
      ["Node.js", process.version],
      ["CPU", `${cpus[0]?.model || "Unknown"} (${cpuCount} core)`],
      ["Load Avg", `${load1.toFixed(2)} / ${load5.toFixed(2)} / ${load15.toFixed(2)}`],
      ["Total Grup", `${totalGroups}`],
      ["Total Plugin", `${totalPlugins}`],
      ["Runtime Bot", runtime(process.uptime())],
      ["Uptime Server", runtime(os.uptime())],
    ])
    .addHtml(html, { trustedSources: [] })
    .addSource([
      [global.favicon, "https://shirokode.web.id", "Shirokode"],
      [global.favicon, "https://www.youtube.com/@shirokode", "YT Neoshiroko Labs"],
    ])
    .send();
};

handler.command = ["ping", "p", "speed"];
handler.tags = ["main"];
handler.help = ["ping"];

export default handler;
