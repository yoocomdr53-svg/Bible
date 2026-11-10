import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts any audio Blob (WebM, OGG, WAV, MP4) into standard, crystal-clear MP3 format
 * using Web Audio API decodeAudioData + lamejs MP3 encoder.
 *
 * Speech-optimized:
 * - 128 kbps high fidelity (CD-quality speech, zero underwater/swishy compression artifacts)
 * - Automatic speech peak normalization: boosts quiet microphone audio clearly without digital clipping
 * - Universal playback compatibility across all smartphones, PCs, cars, and messengers.
 */
export async function convertBlobToMp3(
  audioBlob: Blob,
  bitrateKbps: number = 128
): Promise<Blob> {
  // If already MP3 with valid content, return as-is
  if ((audioBlob.type === 'audio/mp3' || audioBlob.type === 'audio/mpeg') && audioBlob.size > 0) {
    return audioBlob;
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return audioBlob;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported, falling back to original blob');
      return audioBlob;
    }

    const audioCtx = new AudioContextClass();
    // Use arrayBuffer slice so original buffer isn't detached if reused
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    if (length === 0) {
      await audioCtx.close().catch(() => {});
      return audioBlob;
    }

    // 1. Extract PCM samples & convert to Mono
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;

    // 2. Compute peak amplitude for clean voice normalization
    let maxPeak = 0;
    for (let i = 0; i < length; i++) {
      const mono = right ? (left[i] + right[i]) * 0.5 : left[i];
      const abs = Math.abs(mono);
      if (abs > maxPeak) maxPeak = abs;
    }

    // Target peak 0.92: ensures loud, clear, crisp voice without clipping
    // Limit boost to 4.0x (+12dB) to prevent over-amplifying low-level room noise
    let gain = 1.0;
    if (maxPeak > 0.01 && maxPeak < 0.85) {
      gain = Math.min(4.0, 0.92 / maxPeak);
    }

    // 3. Convert Float32 to Int16 PCM with normalization & hard clamping
    const samples = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      let mono = (right ? (left[i] + right[i]) * 0.5 : left[i]) * gain;
      const clamped = Math.max(-1.0, Math.min(1.0, mono));
      samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    // 4. Encode to MP3 using lamejs
    const numChannels = 1; // Mono for voice recitation: studio speech quality at ~960KB/minute
    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrateKbps);
    const sampleBlockSize = 1152;
    const mp3Data: Uint8Array[] = [];

    for (let i = 0; i < length; i += sampleBlockSize) {
      const chunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(new Uint8Array(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
      }
    }

    const flushBuf = mp3encoder.flush();
    if (flushBuf && flushBuf.length > 0) {
      mp3Data.push(new Uint8Array(flushBuf.buffer, flushBuf.byteOffset, flushBuf.length));
    }

    await audioCtx.close().catch(() => {});

    if (mp3Data.length === 0) {
      return audioBlob;
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (err) {
    console.warn('MP3 conversion fallback to raw blob:', err);
    return audioBlob;
  }
}
