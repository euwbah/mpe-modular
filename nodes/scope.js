class ScopeNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(93, 88, 199, 0.75)', 'rgb(125, 117, 213)', 'SCOPE', 'Scope');
    this.hasOutput = false;

    let self = this;

    this.paramConstants = {
      gain: 1
    }

    this.inputs.push(new Input({
      name: 'Input',
      displayName: 'in',
      unit: '',
      parentNode: self,
      theta: 180,
      synthParamName: 'input'
    }));

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
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let placeholder = multiple ? 'placeholder="<group>"' : '';

    return '<section><div>Gain Mult.</div>' +
            '<div><input type="number" id="scope-gain" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.gain) +
            '"step="any">' +
            '</div></section>';
  }

  applySingleSelectionEvents() {
    $('#settings-panel #scope-gain').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setGain(val);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #scope-gain').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setGain(val);
        });
      }
    });
  }

  generateSynthNode() {
    let input = audioCtx.createGain();

    let oscilloscope = new WavyJones(audioCtx, 'oscilloscope');
    oscilloscope.lineColor = 'rgb(89, 255, 0)';
    oscilloscope.lineThickness = 3;

    input.connect(oscilloscope);

    const PEAK_METER_SAMPLE_SIZE = 16384;
    const scopeInfo = $('#scope-info');
    let peakMeter = audioCtx.createScriptProcessor(PEAK_METER_SAMPLE_SIZE, 1, 0);

    let repCount = 0;
    let highestSoFar = 0;
    peakMeter.onaudioprocess = function(audioProcessingEvent) {
      let inputBuffer = audioProcessingEvent.inputBuffer;
      let inputData = inputBuffer.getChannelData(0)
      for(let sample = 0; sample < PEAK_METER_SAMPLE_SIZE; sample++) {
        let val = Math.abs(inputData[sample]);
        if (val > highestSoFar)
          highestSoFar = val;
      }

      repCount++;

      if (repCount === 2) {
        scopeInfo.text('peak level: ' + highestSoFar);
        highestSoFar = 0;
        repCount = 0;
      }
    }

    input.connect(peakMeter);

    return new SynthNodeWrapper(input, {
      gain: input.gain,
      input: input
    });
  }

  setGain(gain) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.gain.value = gain);
  }
}
