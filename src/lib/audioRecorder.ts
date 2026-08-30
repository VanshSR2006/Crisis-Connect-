/**
 * Audio Recording and WAV Conversion Utility
 * Converts any browser audio stream/recording into pristine 16kHz 16-bit Mono WAV format
 * perfectly optimized for Sarvam Saaras v3 Speech-to-Text.
 */

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Converts an AudioBuffer to a standard 16kHz Mono 16-bit PCM WAV Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer, targetSampleRate = 16000): Blob {
  // Downmix to mono if multi-channel
  let monoData: Float32Array;
  if (buffer.numberOfChannels === 1) {
    monoData = buffer.getChannelData(0);
  } else {
    monoData = new Float32Array(buffer.length);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < buffer.length; i++) {
      monoData[i] = (left[i] + right[i]) / 2;
    }
  }

  // Resample to 16,000 Hz if needed
  const sourceSampleRate = buffer.sampleRate;
  let resampledData: Float32Array;
  if (sourceSampleRate === targetSampleRate) {
    resampledData = monoData;
  } else {
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(monoData.length / ratio);
    resampledData = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const frac = sourceIndex - index;
      const nextIndex = Math.min(index + 1, monoData.length - 1);
      resampledData[i] = monoData[index] * (1 - frac) + monoData[nextIndex] * frac;
    }
  }

  // Convert Float32 [-1.0, 1.0] to 16-bit PCM Int16
  const pcmData = new Int16Array(resampledData.length);
  for (let i = 0; i < resampledData.length; i++) {
    const s = Math.max(-1, Math.min(1, resampledData[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Create standard 44-byte WAV header
  const dataSize = pcmData.length * 2;
  const bufferArray = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufferArray);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, targetSampleRate, true); // SampleRate (16000)
  view.setUint32(28, targetSampleRate * 2, true); // ByteRate (16000 * 1 * 2 = 32000)
  view.setUint16(32, 2, true); // BlockAlign (1 * 2 = 2)
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM samples
  const pcmBytes = new Int16Array(bufferArray, 44, pcmData.length);
  pcmBytes.set(pcmData);

  return new Blob([bufferArray], { type: 'audio/wav' });
}

/**
 * Converts any browser recorded audio blob (webm, mp4, ogg) to 16kHz mono WAV Blob.
 */
export async function convertBlobToWav(audioBlob: Blob): Promise<Blob> {
  // If already a valid WAV with reasonable size, return as is
  if (audioBlob.type === 'audio/wav' && audioBlob.size > 44) {
    return audioBlob;
  }

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return audioBlob;
    }

    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWav(audioBuffer, 16000);
    await audioCtx.close();
    return wavBlob;
  } catch (err) {
    console.warn('[convertBlobToWav] Fallback to original blob due to decode error:', err);
    return audioBlob;
  }
}
