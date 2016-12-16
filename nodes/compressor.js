class CompressorNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(0, 28, 82, 0.75)', 'rgb(2, 18, 161)', 'COMP', 'Compressor');

    let self = this;

    this.paramConstants = {
      threshold: -24,
      knee: 30,
      ratio: 12,
      attack: 0.003,
      release: 0.25
    };

    this.inputs.push(new Input({
      name: 'Threshold',
      displayName: 'thres',
      unit: 'dB',
      parentNode: self,
      theta: 60,
      synthParamName: 'threshold'
    }));
    this.inputs.push(new Input({
      name: 'Knee',
      displayName: 'knee',
      unit: 'dB',
      parentNode: self,
      theta: 120,
      synthParamName: 'knee'
    }));
    this.inputs.push(new Input({
      name: 'Ratio',
      displayName: 'rat',
      unit: 'dB',
      parentNode: self,
      theta: 0,
      synthParamName: 'ratio'
    }));
    this.inputs.push(new Input({
      name: 'Attack',
      displayName: 'attk',
      unit: 's/10dB',
      parentNode: self,
      theta: 240,
      synthParamName: 'attack'
    }));
    this.inputs.push(new Input({
      name: 'Release',
      displayName: 'rel',
      unit: 's/10dB',
      parentNode: self,
      theta: 300,
      synthParamName: 'release'
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
    $('#settings-panel #comp-attack, #settings-panel #comp-release' +
      '#settings-panel #comp-ratio, #settings-panel #comp-knee, #settings-panel #comp-threshold').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();

    let placeholder = multiple ? 'placeholder="<group>"' : '';

    html += '<section><div>Threshold (dB)</div>' +
            '<div><input type="number" id="comp-threshold" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.threshold) +
            '"step="any" min="-100" max="0">' +
            '</div></section>' +

            '<section><div>Knee (dB)</div>' +
            '<div><input type="number" id="comp-knee" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.knee) +
            '" step="any" min="0" max="40">' +
            '</div></section>' +

            '<section><div>Ratio (dB)</div>' +
            '<div><input type="number" id="comp-ratio" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.ratio) +
            '" step="any" min="1" max="20">' +
            '</div></section>' +

            '<section><div>Attack (s/10dB)</div>' +
            '<div><input type="number" id="comp-attack" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.attack) +
            '" step="any" min="0" max="1">' +
            '</div></section>' +

            '<section><div>Release (s/10dB)</div>' +
            '<div><input type="number" id="comp-release" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.release) +
            '" step="any" min="0" max="1">' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #comp-attack').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setAttack(val);
      } else if (validity.rangeOverflow) {
        self.setAttack(1);
        $(this).val(1);
      } else if (validity.rangeUnderflow) {
        self.setAttack(0);
        $(this).val(0);
      } else {
        $(this).val(self.paramConstants.attack);
      }
    });
    $('#settings-panel #comp-release').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setRelease(val);
      } else if (validity.rangeOverflow) {
        self.setRelease(1);
        $(this).val(1);
      } else if (validity.rangeUnderflow) {
        self.setRelease(0);
        $(this).val(0);
      } else {
        $(this).val(self.paramConstants.release);
      }
    });
    $('#settings-panel #comp-ratio').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setRatio(val);
      } else if (validity.rangeOverflow) {
        self.setRatio(20);
        $(this).val(20);
      } else if (validity.rangeUnderflow) {
        self.setRatio(1);
        $(this).val(1);
      } else {
        $(this).val(self.paramConstants.ratio);
      }
    });
    $('#settings-panel #comp-knee').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setKnee(val);
      } else if (validity.rangeOverflow) {
        self.setKnee(40);
        $(this).val(40);
      } else if (validity.rangeUnderflow) {
        self.setKnee(0);
        $(this).val(0);
      } else {
        $(this).val(self.paramConstants.knee);
      }
    });
    $('#settings-panel #comp-threshold').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setThreshold(val);
      } else if (validity.rangeOverflow) {
        self.setThreshold(0);
        $(this).val(0);
      } else if (validity.rangeUnderflow) {
        self.setThreshold(-100);
        $(this).val(-100);
      } else {
        $(this).val(self.paramConstants.threshold);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #comp-attack').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setAttack(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setAttack(1));
        $(this).val(1);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setAttack(0));
        $(this).val(0);
      }
    });
    $('#settings-panel #comp-release').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setRelease(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setRelease(1));
        $(this).val(1);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setRelease(0));
        $(this).val(0);
      }
    });
    $('#settings-panel #comp-ratio').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setRatio(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setRatio(20));
        $(this).val(20);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setRatio(1));
        $(this).val(1);
      }
    });
    $('#settings-panel #comp-knee').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setKnee(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setKnee(40));
        $(this).val(40);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setKnee(0));
        $(this).val(0);
      }
    });
    $('#settings-panel #comp-threshold').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setThreshold(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setThreshold(0));
        $(this).val(0);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setThreshold(-100));
        $(this).val(-100);
      }
    });
  }

  generateSynthNode() {
    let comp = audioCtx.createDynamicsCompressor();

    return new SynthNodeWrapper(comp, {
      input: comp,
      threshold: comp.threshold,
      knee: comp.knee,
      ratio: comp.ratio,
      attack: comp.attack,
      release: comp.release
    });
  }

  setAttack(attack) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.attack.value = attack);
    this.paramConstants.attack = attack;
  }
  setRelease(release) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.release.value = release);
    this.paramConstants.release = release;
  }
  setRatio(ratio) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.ratio.value = ratio);
    this.paramConstants.ratio = ratio;
  }
  setKnee(knee) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.knee.value = knee);
    this.paramConstants.knee = knee;
  }
  setThreshold(threshold) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.threshold.value = threshold);
    this.paramConstants.threshold = threshold;
  }
}
