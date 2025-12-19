self.onmessage = async e => {
  const file = e.data;
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());

  const data = buffer.getChannelData(0);
  const rate = buffer.sampleRate;

  const threshold = Math.pow(10, -30 / 20);
  const minSilence = rate * 0.6;

  let out = [];
  let silence = 0;

  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) < threshold) {
      silence++;
      if (silence < minSilence) out.push(data[i]);
    } else {
      silence = 0;
      out.push(data[i]);
    }

    if (i % 500000 === 0) {
      self.postMessage({ progress: Math.floor((i / data.length) * 100) });
      await new Promise(r => setTimeout(r, 0));
    }
  }

  const wav = audioBufferToWav(out, rate);
  const blob = new Blob([wav], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  self.postMessage({ done: true, url });
};

function audioBufferToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const write = (o, s) => [...s].forEach((c, i) => view.setUint8(o+i, c.charCodeAt(0)));

  write(0,"RIFF"); view.setUint32(4,36+samples.length*2,true);
  write(8,"WAVEfmt "); view.setUint32(16,16,true);
  view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true); view.setUint16(34,16,true);
  write(36,"data"); view.setUint32(40,samples.length*2,true);

  let o=44;
  samples.forEach(s=>{
    view.setInt16(o, Math.max(-1,Math.min(1,s))*0x7fff, true);
    o+=2;
  });

  return buffer;
}
