class EnvelopeNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(0, 167, 127, 0.75)', 'rgb(63, 204, 145)', 'ENV', 'Envelope');

    let self = this;

    // NOTE: Time values are in seconds.
    this.paramConstants = {
      attack: 0.003,
      decay: 0.001,
      sustain: 1,
      release: 0.2
    };

    // A constant, just in case it should be changed later.
    this.MAX_PHASE_DURATION = 4;

    this.inputs.push(new Input({
      name: 'Gate',
      displayName: 'gate',
      unit: '',
      parentNode: self,
      theta: 180,
      synthParamName: 'gate'
    }));
    this.inputs.push(new Input({
      name: 'Attack',
      displayName: 'a',
      unit: 'seconds',
      parentNode: self,
      theta: 60,
      synthParamName: 'attack'
    }));
    this.inputs.push(new Input({
      name: 'Decay',
      displayName: 'd',
      unit: 'seconds',
      parentNode: self,
      theta: 120,
      synthParamName: 'decay'
    }));
    this.inputs.push(new Input({
      name: 'Sustain',
      displayName: 's',
      unit: '',
      parentNode: self,
      theta: 300,
      synthParamName: 'sustain'
    }));
    this.inputs.push(new Input({
      name: 'Release',
      displayName: 'r',
      unit: 'seconds',
      parentNode: self,
      theta: 240,
      synthParamName: 'release'
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
    $('#settings-panel #env-a, #settings-panel #env-d' +
      '#settings-panel #env-s, #settings-panel #env-r').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let html = super.generateOptionsHTML();

    let placeholder = multiple ? 'placeholder="<group>"' : '';

    let max = this.MAX_PHASE_DURATION;

    html += '<section><div>Attack (s)</div>' +
            '<div><input type="number" id="env-a" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.attack) +
            '"step="0.001" min="0.001" max="' + max + '">' +
            '</div></section>' +

            '<section><div>Decay (s)</div>' +
            '<div><input type="number" id="env-d" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.decay) +
            '" step="0.001" min="0.001" max="' + max + '">' +
            '</div></section>' +

            '<section><div>Sustain (s)</div>' +
            '<div><input type="number" id="env-s" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.sustain) +
            '"step="any" min="0" max="1">' +
            '</div></section>' +

            '<section><div>Release (s)</div>' +
            '<div><input type="number" id="env-r" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.release) +
            '" step="0.001" min="0.001" max="' + max + '">' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #env-a').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setAttack(val);
      } else if (validity.rangeOverflow) {
        self.setAttack(self.MAX_PHASE_DURATION);
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        self.setAttack(0.001);
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        self.setAttack(Math.floor(val * 1000) / 1000);
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-d').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setDecay(val);
      } else if (validity.rangeOverflow) {
        self.setDecay(self.MAX_PHASE_DURATION);
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        self.setDecay(0.001);
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        self.setDecay(Math.floor(val * 1000) / 1000);
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-s').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setSustain(val);
      } else if (validity.rangeOverflow) {
        self.setSustain(1);
        $(this).val('1');
      } else if (validity.rangeUnderflow) {
        self.setSustain(0);
        $(this).val('0');
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-r').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        self.setRelease(val);
      } else if (validity.rangeOverflow) {
        self.setRelease(self.MAX_PHASE_DURATION);
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        self.setRelease(0.001);
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        self.setRelease(Math.floor(val * 1000) / 1000);
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #env-a').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setAttack(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setAttack(node.MAX_PHASE_DURATION));
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setAttack(0.001));
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        World.selectedNodes.forEach(node => node.setAttack(Math.floor(val * 1000) / 1000));
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-d').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setDecay(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setDecay(node.MAX_PHASE_DURATION));
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setDecay(0.001));
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        World.selectedNodes.forEach(node => node.setDecay(Math.floor(val * 1000) / 1000));
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-s').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setSustain(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setSustain(1));
        $(this).val('1');
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setSustain(0));
        $(this).val('0');
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #env-r').change(function() {
      let val = $(this).val();
      let validity = $(this)[0].validity;

      if(validity.valid) {
        World.selectedNodes.forEach(node => node.setRelease(val));
      } else if (validity.rangeOverflow) {
        World.selectedNodes.forEach(node => node.setRelease(node.MAX_PHASE_DURATION));
        $(this).val(self.MAX_PHASE_DURATION);
      } else if (validity.rangeUnderflow) {
        World.selectedNodes.forEach(node => node.setRelease(0.001));
        $(this).val('0.001');
      } else if (validity.stepMismatch) {
        World.selectedNodes.forEach(node => node.setRelease(Math.floor(val * 1000) / 1000));
        $(this).val('' + Math.floor(val * 1000) / 1000);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
  }

  generateSynthNode() {
    let self = this;

    let COMP_RATIO = 17;
    let THRESHOLD = -80;
    let KNEE = 2;
    let RELEASE = 0.08;
    let TEN_DB_COEFF = 1 / 4.5;

    let COMP_GAIN_CORRECTION = 0.05;
    let ROOT10_CURVE_RESOLUTION = 8000;
    let ROOT10_COEFF = 0.1;

    let DC_OFFSET_COEFF = 0.001;

    let ATTACK_IN_FRAC = 0.001;

    let out = audioCtx.createGain();
    out.gain.value = 1;

    let gateIn = audioCtx.createConstantSource(),
        attackIn = audioCtx.createConstantSource(),
        decayIn = audioCtx.createConstantSource(),
        sustainIn = audioCtx.createConstantSource(),
        releaseIn = audioCtx.createConstantSource();

    gateIn.offset.value = 0;
    attackIn.offset.value = this.paramConstants.attack;
    decayIn.offset.value = this.paramConstants.decay;
    sustainIn.offset.value = this.paramConstants.sustain;
    releaseIn.offset.value = this.paramConstants.release;

    gateIn.start();
    attackIn.start();
    decayIn.start();
    sustainIn.start();
    releaseIn.start();

    let dy = audioCtx.createGain();
    dy.gain.value = 0; // Reset gain offset to 0

      /*
        Calculate decay y offset:
          dy = (sustain - 1) * (attack + decay) / decay
      */
    {
      let minusOne = audioCtx.createConstantSource();
      minusOne.offset.value = -1;
      minusOne.start();

      let sustainMinusOneTimesAttackAndDecay = audioCtx.createGain();
      sustainMinusOneTimesAttackAndDecay.gain.value = 0;
      minusOne.connect(sustainMinusOneTimesAttackAndDecay);
      sustainIn.connect(sustainMinusOneTimesAttackAndDecay);
      attackIn.connect(sustainMinusOneTimesAttackAndDecay.gain);
      decayIn.connect(sustainMinusOneTimesAttackAndDecay.gain);

      // This scales the decayIn level from 0.001s to 2*max to a level from 0 to 2
      let decayInScaled = audioCtx.createGain();
      decayInScaled.gain.value = 1 / self.MAX_PHASE_DURATION;
      decayIn.connect(decayInScaled);

      let decayInScaledAndOffset = audioCtx.createConstantSource();
      decayInScaledAndOffset.offset.value = -1;
      decayInScaled.connect(decayInScaledAndOffset.offset);
      decayInScaledAndOffset.start();

      // NOTE: input level of -1 -> 0, level of 1 -> MAX_PHASE_DURATION * 2
      let decayInReciprocated = audioCtx.createWaveShaper();

      // 16000 => Input accuracy of 0.5ms time from values 0.001s to 2 x maximum duration
      let curve = new Float32Array(self.MAX_PHASE_DURATION * 1000 * 2 * 2);
      for(let i = 0; i < curve.length; i++) {
        // Perform descaling and detransposing
        let num = (i / curve.length) * self.MAX_PHASE_DURATION * 2;

        if(num <= 0.001)
          num = 0.001;
        else if (num >= self.MAX_PHASE_DURATION * 2)
          num = self.MAX_PHASE_DURATION * 2;

        curve[i] = 1 / num;
      }

      decayInReciprocated.curve = curve;

      decayInScaledAndOffset.connect(decayInReciprocated);

      sustainMinusOneTimesAttackAndDecay.connect(dy);
      decayInReciprocated.connect(dy.gain);
    }

      /*
        Implement Decay
      */
    {
      
    }

    return new SynthNodeWrapper(out, {
      gate: gateInRaw.offset,
      attack: attackIn.offset,
      decay: decayIn.offset,
      sustain: sustainIn.offset,
      release: releaseIn.offset
    });
  }

  setAttack(attack) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.attack.value = attack);
    this.paramConstants.attack = attack;
  }
  setDecay(decay) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.decay.value = decay);
    this.paramConstants.decay = decay;
  }
  setSustain(sustain) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.sustain.value = sustain);
    this.paramConstants.sustain = sustain;
  }
  setRelease(release) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.release.value = release);
    this.paramConstants.release = release;
  }
}
