class FilterNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(6, 161, 182, 0.75)', 'rgb(0, 157, 215)', 'FILT', 'Filter');

    let self = this;

    this.paramConstants = {
      type: 'lowpass',
      frequency: 350, // From 10 to 22150 Hz
      detune: 0, // In cents
      Q: 1, // 0.0001 to 1000
      gain: 0 // -40dB to 40dB
    };

    this.inputs.push(new Input({
      name: 'Frequency',
      displayName: 'freq',
      unit: 'Hz',
      parentNode: self,
      theta: 60,
      synthParamName: 'frequency'
    }));
    this.inputs.push(new Input({
      name: 'Detune',
      displayName: 'detune',
      unit: 'cents',
      parentNode: self,
      theta: 120,
      synthParamName: 'detune'
    }));
    this.inputs.push(new Input({
      name: 'Q',
      displayName: 'Q',
      unit: '',
      parentNode: self,
      theta: 240,
      synthParamName: 'Q'
    }));
    this.inputs.push(new Input({
      name: 'Gain',
      displayName: 'gain',
      unit: 'dB',
      parentNode: self,
      theta: 300,
      synthParamName: 'gain'
    }));
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
    $('#settings-panel #filter-type, #settings-panel #filter-frequency' +
      '#settings-panel #filter-detune, #settings-panel #filter-q, #settings-panel #filter-gain').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();

    let placeholder = multiple ? ' placeholder="<group>" ' : '';

    let placeholderOption = multiple?
      '<option value="" selected="selected">&lt;group&gt;</option>':'';

    if(!multiple) {
      var lpSelected = this.paramConstants.type === 'lowpass' ? 'selected="selected"' : '';
      var hpSelected = this.paramConstants.type === 'highpass' ? 'selected="selected"' : '';
      var bpSelected = this.paramConstants.type === 'bandpass' ? 'selected="selected"' : '';
      var lsSelected = this.paramConstants.type === 'lowshelf' ? 'selected="selected"' : '';
      var hsSelected = this.paramConstants.type === 'highshelf' ? 'selected="selected"' : '';
      var pSelected = this.paramConstants.type === 'peaking' ? 'selected="selected"' : '';
      var nSelected = this.paramConstants.type === 'notch' ? 'selected="selected"' : '';
      var apSelected = this.paramConstants.type === 'allpass' ? 'selected="selected"' : '';
    }

    let QDisabled = this.paramConstants.type === 'lowshelf' ||
                    this.paramConstants.type === 'highshelf' ?
                    ' disabled ' : '';

    let gainDisabled = this.paramConstants.type === 'lowpass' ||
                       this.paramConstants.type === 'highpass' ||
                       this.paramConstants.type === 'bandpass' ||
                       this.paramConstants.type === 'notch' ||
                       this.paramConstants.type === 'allpass' ?
                       ' disabled ' : '';

    html += '<section><div>Type:</div>' +
            '<div><select id="filter-type">' + placeholderOption +
            '<option value="lowpass"' + lpSelected + '>Low Pass</option>' +
            '<option value="highpass"' + hpSelected + '>High Pass</option>' +
            '<option value="bandpass"' + bpSelected + '>Band Pass</option>' +
            '<option value="lowshelf"' + lsSelected + '>Low Shelf</option>' +
            '<option value="highshelf"' + hsSelected + '>High Shelf</option>' +
            '<option value="peaking"' + pSelected + '>Peaking</option>' +
            '<option value="notch"' + nSelected + '>Notch</option>' +
            '<option value="allpass"' + apSelected + '>All Pass</option>' +
            '</select></div></section>' +

            '<section><div>Frequency (Hz)</div>' +
            '<div><input type="number" id="filter-frequency" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.frequency) +
            '"step="any" min="10" max="22150">' +
            '</div></section>' +

            '<section><div>Detune (cents)</div>' +
            '<div><input type="number" id="filter-detune" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.detune) +
            '" step="any">' +
            '</div></section>' +

            '<section><div>Q</div>' +
            '<div><input type="number" id="filter-q" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.Q) +
            '" step="any" min="0.0001" max="1000" ' + QDisabled + '>' +
            '</div></section>' +

            '<section><div>Gain (dB)</div>' +
            '<div><input type="number" id="filter-gain" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.gain) +
            '" step="any" min="-40" max="40" ' + gainDisabled + '>' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #filter-type').change(function() {
      let val = $(this).find(':selected').val();

      self.setType(val);

      if(val === 'lowshelf' || val === 'highshelf') {
        $('#settings-panel #filter-q').prop('disabled', true);
      } else
        $('#settings-panel #filter-q').prop('disabled', false);
      if (val === 'lowpass' || val === 'highpass' || val === 'bandpass' ||
        val === 'notch' || val === 'allpass') {
        $('#settings-panel #filter-gain').prop('disabled', true)
      } else
        $('#settings-panel #filter-gain').prop('disabled', false)
    });

    $('#settings-panel #filter-frequency').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setFrequency(val);
      } else if (validity.rangeOverflow) {
        self.setFrequency(22150);
        $(this).val(22150);
      } else if (validity.rangeUnderflow) {
        self.setFrequency(10);
        $(this).val(10);
      } else {
        $(this).val(self.paramConstants.frequency);
      }
    });
    $('#settings-panel #filter-detune').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setDetune(val);
      } else {
        $(this).val(self.paramConstants.detune);
      }
    });
    $('#settings-panel #filter-q').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setQ(val);
      } else if (validity.rangeOverflow) {
        self.setQ(1000);
        $(this).val(1000);
      } else if (validity.rangeUnderflow) {
        self.setQ(0.0001);
        $(this).val(0.0001);
      } else {
        $(this).val(self.paramConstants.Q);
      }
    });
    $('#settings-panel #filter-gain').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setGain(val);
      } else if (validity.rangeOverflow) {
        self.setGain(40);
        $(this).val(40);
      } else if (validity.rangeUnderflow) {
        self.setGain(-40);
        $(this).val(-40);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #filter-type').change(function() {
      let val = $(this).find(':selected').val();

      if (val !== '') {
        World.selectedNodes.forEach(node => node.setType(val));

        if(val === 'lowshelf' || val === 'highshelf') {
          $('#settings-panel #filter-q').prop('disabled', '');
        } else if (val === 'lowpass' || val === 'highpass' || val === 'bandpass' ||
          val === 'notch' || val === 'allpass') {
          $('#settings-panel #filter-gain').prop('disabled', '')
        }
      }
    });

    $('#settings-panel #filter-frequency').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setFrequency(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setFrequency(22150));
        $(this).val(22150);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setFrequency(10));
        $(this).val(10);
      }
    });
    $('#settings-panel #filter-detune').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setDetune(val));
      }
    });
    $('#settings-panel #filter-q').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setQ(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setQ(1000));
        $(this).val(1000);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setQ(0.0001));
        $(this).val(0.0001);
      }
    });
    $('#settings-panel #filter-gain').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setGain(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setGain(40));
        $(this).val(40);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setGain(-40));
        $(this).val(-40);
      }
    });
  }

  generateSynthNode() {
    let filter = audioCtx.createBiquadFilter();

    return new SynthNodeWrapper(filter, {
      input: filter,
      frequency: filter.frequency,
      detune: filter.detune,
      Q: filter.Q,
      gain: filter.gain
    });
  }

  setType(type) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.input.type = type);
    this.paramConstants.type = type;
  }
  setFrequency(freq) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.frequency.value = freq);
    this.paramConstants.frequency = freq;
  }
  setDetune(detune) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.detune.value = detune);
    this.paramConstants.detune = detune;
  }
  setQ(Q) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.Q.value = Q);
    this.paramConstants.Q = Q;
  }
  setGain(gain) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.gain.value = gain);
    this.paramConstants.gain = gain;
  }
}
