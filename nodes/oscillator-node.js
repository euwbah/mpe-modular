class OscillatorNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(255, 64, 64, 0.75)', 'rgb(250, 120, 120)', 'OSC', 'Oscillator');

    let self = this;

    this.paramConstants = {
      type: 'sine',   //sine, triangle, square, sawtooth
      frequency: 440, //Hertz
      detune: 0       //Cents
    };

    this.inputs.push(new Input({
      name: 'Frequency',
      displayName: 'freq',
      unit: 'Hz',
      parentNode: self,
      theta: 0,
      synthParamName: 'frequency'
    }));
    this.inputs.push(new Input({
      name: 'Detune',
      displayName: 'det',
      unit: 'semitones',
      parentNode: self,
      theta: 180,
      synthParamName: 'detune'
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
    $('#settings-panel #osc-type, #settings-panel #osc-detune, #settings-panel #osc-frequency').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();
    let sineSelected = '', triSelected = '', sawSelected = '', sqSelected = '';
    if (multiple === false) {
      sineSelected = this.paramConstants.type == 'sine'?' selected="selected"':'';
      triSelected = this.paramConstants.type == 'triangle'?' selected="selected"':'';
      sawSelected = this.paramConstants.type == 'sawtooth'?' selected="selected"':'';
      sqSelected = this.paramConstants.type == 'square'?' selected="selected"':'';
    }

    let placeholderOption = multiple?
      '<option value="" selected="selected" disabled>&lt;group&gt;</option>':'';
    let placeholder = multiple?'placeholder="<group>"':'';

    html += '<section><div>Waveform:</div>' +
            '<div><select id="osc-type">' + placeholderOption +
            '<option value="sine"' + sineSelected + '>Sine</option>' +
            '<option value="triangle"' + triSelected + '>Triangle</option>' +
            '<option value="sawtooth"' + sawSelected + '>Saw</option>' +
            '<option value="square"' + sqSelected + '>Square</option>' +
            '</select></div></section>' +

            '<section><div>Frequency (Hz)</div>' +
            '<div><input type="number" id="osc-frequency" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.frequency) + '">' +
            '</div></section>' +

            '<section><div>Detune (Cents)</div>' +
            '<div><input type="number" id="osc-detune" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.detune) + '">' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;
    $('#settings-panel #osc-type').change(function() {
      let val = $(this).val();
      self.setType($(this).find(':selected').val());
    });
    $('#settings-panel #osc-frequency').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setFrequency($(this).val());
      } else {
        $(this).val(self.paramConstants.frequency);
      }
    });
    $('#settings-panel #osc-detune').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setDetune($(this).val());
      } else {
        $(this).val(self.paramConstants.detune);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #osc-type').change(function() {
      let val = $(this).val();
      // Empty val is the value attribute of the '<Group>' option
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setType($(this).find(':selected').val());
        });
      }
    });
    $('#settings-panel #osc-frequency').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setFrequency($(this).val());
        });
      }
    });
    $('#settings-panel #osc-detune').change(function() {
      let val = $(this).val();
      if(val !=='') {
        World.selectedNodes.forEach(node => {
          node.setDetune($(this).val());
        });
      }
    });
  }

  generateSynthNode() {
    let osc = audioCtx.createOscillator();
    osc.type = this.paramConstants.type;
    osc.frequency.value = this.paramConstants.frequency;
    osc.detune.value = this.paramConstants.detune;
    osc.start();
    return new SynthNodeWrapper(osc, {
      frequency: osc.frequency,
      detune: osc.detune
    });
  }

  setType(typeStr) {
    this.synthNodes.forEach(synthNode => synthNode.node.type = typeStr);
    this.paramConstants.type = typeStr;
  }

  setFrequency(freq) {
    this.synthNodes.forEach(synthNode => synthNode.node.frequency.value = freq);
    this.paramConstants.frequency = freq;
  }

  setDetune(detune) {
    this.synthNodes.forEach(synthNode => synthNode.node.detune.value = detune);
    this.paramConstants.detune = detune;
  }
}
