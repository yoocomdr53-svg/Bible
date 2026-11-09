import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts any audio Blob (WebM, OGG, WAV, MP4) into standard MP3 format
 * using Web Audio API decodeAudioData + lamejs MP3 encoder.
 *
 * Speech-optimized: Mono, 64kbps, 44.1kHz (or original sample rate).
 * Produces ultra-lightweight, high-clarity MP3 files (~480KB per minute).
 */
export async function convertBlobToMp3(
  audioBlob: Blob,
  bitrateKbps: number = 64
): Promise<Blob> {
  // If already MP3, return as-is
  if (audioBlob.type === 'audio/mp3' || audioBlob.type === 'audio/mpeg') {
    return audioBlob;
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported, falling back to original blob');
      return audioBlob;
    }

    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const numChannels = 1; // Mono for voice/speech: cut file size in half with zero loss in speech quality
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrateKbps);

    // Get PCM samples
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
    const length = left.length;

    // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
    const samples = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      let monoSample = left[i];
      if (right) {
        monoSample = (left[i] + right[i]) / 2;
      }
      const s = Math.max(-1, Math.min(1, monoSample));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const sampleBlockSize = 1152;
    const mp3Data: Uint8Array[] = [];

    for (let i = 0; i < length; i += sampleBlockSize) {
      const chunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    await audioCtx.close().catch(() => {});

    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (err) {
    console.warn('MP3 conversion failed, falling back to original blob:', err);
    return audioBlob;
  }
}
