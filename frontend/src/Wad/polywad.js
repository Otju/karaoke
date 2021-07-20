import {
  logMessage,
  context,
  constructFilter,
  constructReverb,
  constructPanning,
  constructDelay,
  constructCompressor,
  setUpPanningOnPlay,
  setUpDelayOnPlay,
  setUpTunaOnPlay,
  plugEmIn,
  setUpReverbOnPlay,
  createFilters,
} from './common'
import { pitches, pitchesArray } from './pitches'

let buflen = 2048
let buf = new Uint8Array(buflen)

let noteFromPitch = function (frequency) {
  let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2))
  return Math.round(noteNum) + 69
}

let autoCorrelate = function (buf, sampleRate) {
  let MIN_SAMPLES = 4 // corresponds to an 11kHz signal
  let MAX_SAMPLES = 1000 // corresponds to a 44Hz signal
  let SIZE = 1000
  let best_offset = -1
  let best_correlation = 0
  let rms = 0
  let foundGoodCorrelation = false

  if (buf.length < SIZE + MAX_SAMPLES - MIN_SAMPLES) return -1 // Not enough data

  for (let i = 0; i < SIZE; i++) {
    let val = (buf[i] - 128) / 128
    rms += val * val
  }
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.01) {
    return -1
  }

  let lastCorrelation = 1
  for (let offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
    let correlation = 0

    for (let i = 0; i < SIZE; i++) {
      correlation += Math.abs((buf[i] - 128) / 128 - (buf[i + offset] - 128) / 128)
    }
    correlation = 1 - correlation / SIZE
    if (correlation > 0.9 && correlation > lastCorrelation) foundGoodCorrelation = true
    else if (foundGoodCorrelation) {
      // short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
      return sampleRate / best_offset
    }
    lastCorrelation = correlation
    if (correlation > best_correlation) {
      best_correlation = correlation
      best_offset = offset
    }
  }
  if (best_correlation > 0.01) {
    // logMessage("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
    return sampleRate / best_offset
  }
  return -1
  //  var best_frequency = sampleRate/best_offset;
}

let volumeAudioProcess = function (event) {
  let buf = event.inputBuffer.getChannelData(0)
  let bufLength = buf.length
  let sum = 0
  let x

  // Do a root-mean-square on the samples: sum up the squares...
  for (let i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true
      this.lastClip = window.performance.now()
    }
    sum += x * x
  }

  // ... then take the square root of the sum.
  let rms = Math.sqrt(sum / bufLength)

  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  this.volume = Math.max(rms, this.volume * this.averaging)
}

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
  let processor = audioContext.createScriptProcessor(512)
  processor.onaudioprocess = volumeAudioProcess
  processor.clipping = false
  processor.lastClip = 0
  processor.volume = 0
  processor.clipLevel = clipLevel || 0.98
  processor.averaging = averaging || 0.95
  processor.clipLag = clipLag || 750

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination)

  processor.checkClipping = function () {
    if (!this.clipping) {
      return false
    }
    if (this.lastClip + this.clipLag < window.performance.now()) {
      this.clipping = false
    }
    return this.clipping
  }

  processor.shutdown = function () {
    this.disconnect()
    this.onaudioprocess = null
  }

  return processor
}

let constructRecorder = function (thatWad, arg) {
  thatWad.recorder = {}
  thatWad.recorder.mediaStreamDestination = context.createMediaStreamDestination()
  thatWad.output.connect(thatWad.recorder.mediaStreamDestination)
  thatWad.recorder.mediaRecorder = new MediaRecorder(
    thatWad.recorder.mediaStreamDestination.stream,
    arg.recorder.options || {
      //audioBitsPerSecond : 128000,
      mimeType: 'audio/webm',
    }
  )
  thatWad.recorder.chunks = []
  thatWad.recorder.mediaRecorder.ondataavailable = function (evt) {
    // push each chunk (blobs) in an array
    thatWad.recorder.chunks.push(evt.data)
  }

  thatWad.recorder.mediaRecorder.onstop =
    arg.recorder.onstop ||
    function (evt) {
      // Make blob out of our chunks, and open it.
      let blob = new Blob(this.recorder.chunks, { type: 'audio/webm;codecs=opus' })
      window.open(URL.createObjectURL(blob))
    }
  thatWad.recorder.mediaRecorder.onstop = thatWad.recorder.mediaRecorder.onstop.bind(thatWad)

  // add some aliases to make the API a bit simpler
  for (let method of ['start', 'stop', 'pause', 'resume', 'requestData']) {
    thatWad.recorder[method] = thatWad.recorder.mediaRecorder[method].bind(
      thatWad.recorder.mediaRecorder
    )
  }
}

const Polywad = function (arg) {
  if (!arg) {
    arg = {}
  }
  this.isSetUp = false
  this.playable = 1

  if (arg.reverb) {
    constructReverb(this, arg) // We need to make sure we have downloaded the impulse response before continuing with the setup.
  } else {
    this.setUp(arg)
  }
}

Polywad.prototype.setUp = function (arg) {
  // Anything that needs to happen before reverb is set up can go here.
  this.wads = []
  this.input = context.createAnalyser()
  this.input.fftSize = 2048
  this.nodes = [this.input]
  this.destination = arg.destination || context.destination // the last node the sound is routed to
  this.volume = arg.volume || 1
  this.gain = context.createGain()
  this.gain.gain.value = this.volume
  this.output = context.createAnalyser()
  this.tuna = arg.tuna || null
  this.audioMeter = null
  this.recorder = null

  if (arg.audioMeter) {
    this.audioMeter = createAudioMeter(
      context,
      arg.audioMeter.clipLevel,
      arg.audioMeter.averaging,
      arg.audioMeter.clipLag
    )
    this.output.connect(this.audioMeter)
  }

  constructFilter(this, arg)
  if (this.filter) {
    createFilters(this, arg)
  }

  if (this.reverb) {
    setUpReverbOnPlay(this, arg)
  }

  this.constructExternalFx(arg, context)

  constructPanning(this, arg)
  setUpPanningOnPlay(this, arg)
  if (arg.compressor) {
    constructCompressor(this, arg)
  }
  if (arg.recorder) {
    constructRecorder(this, arg)
  }

  constructDelay(this, arg)
  setUpDelayOnPlay(this, arg)
  setUpTunaOnPlay(this, arg)
  this.nodes.push(this.gain)
  this.nodes.push(this.output)
  plugEmIn(this, arg)
  this.isSetUp = true
  if (arg.callback) {
    arg.callback(this)
  }
}

Polywad.prototype.updatePitch = function (time) {
  this.input.getByteTimeDomainData(buf)
  let ac = autoCorrelate(buf, context.sampleRate)

  if (ac !== -1 && ac !== 11025 && ac !== 12000) {
    let pitch = ac
    this.pitch = Math.floor(pitch)
    let note = noteFromPitch(pitch)
    this.noteName = pitchesArray[note - 12]
    // Detune doesn't seem to work.
    // var detune = centsOffFromPitch( pitch, note );
    // if (detune == 0 ) {
    //     this.detuneEstimate = 0;
    // } else {

    //     this.detuneEstimate = detune
    // }
  }
  let that = this
  that.rafID = window.requestAnimationFrame(function () {
    that.updatePitch()
  })
}

Polywad.prototype.stopUpdatingPitch = function () {
  cancelAnimationFrame(this.rafID)
}

Polywad.prototype.setVolume = function (volume) {
  if (this.isSetUp) {
    this.gain.gain.value = volume
  } else {
    logMessage('This PolyWad is not set up yet.')
  }
  return this
}

Polywad.prototype.setPitch = function (pitch) {
  this.wads.forEach(function (wad) {
    if (pitch in pitches) {
      if (wad.soundSource) {
        wad.soundSource.frequency.value = pitches[pitch]
      }
      wad.pitch = pitches[pitch]
    } else {
      if (wad.soundSource) {
        wad.soundSource.frequency.value = pitch
      }
      wad.pitch = pitch
    }
    return this
  })
}

Polywad.prototype.play = function (arg) {
  if (this.isSetUp) {
    if (this.playable < 1) {
      this.playOnLoad = true
      this.playOnLoadArg = arg
    } else {
      if (arg && arg.volume) {
        this.gain.gain.value = arg.volume // if two notes are played with volume set as a play arg, does the second one overwrite the first? maybe input should be an array of gain nodes, like regular wads.
        arg.volume = undefined // if volume is set, it should change the gain on the polywad's gain node, NOT the gain nodes for individual wads inside the polywad.
      }
      for (var i = 0; i < this.wads.length; i++) {
        this.wads[i].play(arg)
      }
    }
  } else {
    logMessage('This PolyWad is not set up yet.')
  }
  return this
}

Polywad.prototype.stop = function (arg) {
  if (this.isSetUp) {
    for (let i = 0; i < this.wads.length; i++) {
      this.wads[i].stop(arg)
    }
  }
}

Polywad.prototype.add = function (wad) {
  if (this.isSetUp) {
    wad.destination = this.input
    this.wads.push(wad)
    if (wad instanceof Polywad) {
      wad.output.disconnect(0)
      wad.output.connect(this.input)
    }
  } else {
    logMessage('This PolyWad is not set up yet.')
  }
  return this
}

Polywad.prototype.remove = function (wad) {
  if (this.isSetUp) {
    for (let i = 0; i < this.wads.length; i++) {
      if (this.wads[i] === wad) {
        this.wads[i].destination = context.destination
        this.wads.splice(i, 1)
        if (wad instanceof Polywad) {
          wad.output.disconnect(0)
          wad.output.connect(context.destination)
        }
      }
    }
  }
  return this
}

Polywad.prototype.constructExternalFx = function (arg, context) {}

export default Polywad
