class NoiseNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(190, 0, 154, 0.75)', 'rgb(143, 0, 255)', 'NOISE', 'Noise');

    let self = this;

    this.paramConstants = {
      type: 'white'
    };

    // Synth Nodes represents an array with index being the MIDI channel if
    // this Node is directly connected to an MPE Controller Node
    this.synthNodes[0] = this.generateSynthNode();
  }

  //@Override
  select() {
    super.select();
  }

  //@Override
  deselect() {
    super.deselect();
    $('#settings-panel #noise-type').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let html = super.generateOptionsHTML();

    let placeholderOption = multiple?
      '<option value="" selected="selected">&lt;group&gt;</option>':'';

    let whiteSelected, pinkSelected, brownSelected;
    if (multiple === false) {
      whiteSelected = this.paramConstants.type == 'white'?' selected="selected"':'';
      pinkSelected = this.paramConstants.type == 'pink'?' selected="selected"':'';
      brownSelected = this.paramConstants.type == 'brown'?' selected="selected"':'';
    }

    html += '<section><div>Type:</div>' +
            '<div><select id="noise-type">' + placeholderOption +
            '<option value="white"' + whiteSelected + '>White</option>' +
            '<option value="pink"' + pinkSelected + '>Pink</option>' +
            '<option value="brown"' + brownSelected + '>Brown</option>' +
            '</select></div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #noise-type').change(function() {
      let val = $(this).find(':selected').val();
      self.setType(val);
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #noise-type').change(function() {
      let val = $(this).find(':selected').val();
      World.selectedNodes.forEach(node => node.setType(val));
    });
  }

  generateSynthNode() {

    // Defaults to white noise

    let bufferSize = 2 * audioCtx.sampleRate,
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate),
    output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    let whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start(0);

    return new SynthNodeWrapper(whiteNoise, {});
  }

  setType(type) {
    let self = this;

    let bufferSize = 2.5 * audioCtx.sampleRate;
    let noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    let output = noiseBuffer.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      // http://noisehack.com/generate-noise-web-audio-api/
      var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;

        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;

        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    self.synthNodes.forEach(synthNode => synthNode.outputtingNode.buffer = noiseBuffer);

    this.paramConstants.type = type;
  }
}
