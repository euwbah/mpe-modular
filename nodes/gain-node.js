class GainNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(255, 188, 74, 0.75)', 'rgb(255, 209, 107)', 'AMP', 'Gain');

    let self = this;

    this.paramConstants = {
      gain: 1,
      offset: 0
    };

    this.inputs.push(new Input({
      name: 'Gain',
      displayName: 'gain',
      unit: 'x',
      parentNode: self,
      theta: 90,
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
    $('#settings-panel #gain-gain, #settings-panel #gain-offset').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();

    let placeholder = multiple ? 'placeholder="<group>"' : '';

    html += '<section><div>Gain Mult.</div>' +
            '<div><input type="number" id="gain-gain" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.gain) + '">' +
            '</div></section>' +

            '<section><div>Offset</div>' +
            '<div><input type="number" id="gain-offset" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.offset) + '">' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #gain-gain').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setGain(val);
      } else {
        $(this).val(self.paramConstants.gain);
      }
    });
    $('#settings-panel #gain-offset').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setOffset(val);
      } else {
        $(this).val(self.paramConstants.offset);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #gain-gain').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setGain(val);
        });
      }
    });
    $('#settings-panel #gain-offset').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setOffset(val);
        });
      }
    });
  }

  generateSynthNode() {
    let gain = audioCtx.createGain();
    gain.gain.value = this.paramConstants.gain;

    let constantSource = audioCtx.createConstantSource();
    constantSource.offset.value = this.paramConstants.offset;

    // This just intends to add the two nodes together.
    let out = audioCtx.createGain();
    out.gain.value = 1;
    gain.connect(out);
    constantSource.connect(out);

    return new SynthNodeWrapper(out, {
      input: gain,
      gain: gain.gain,

      // NOTE: offset is not actually an input because it's unecessary,
      //       but a pointer is stored for assignment purposes.
      offset: constantSource.offset,
    });
  }

  setGain(gain) {
    console.log(this.synthNodes);
    this.synthNodes.forEach(synthNode => synthNode.inputs.gain.value = gain);
    this.paramConstants.gain = gain;
  }

  setOffset(offset) {
    this.synthNodes.forEach(synthNode => synthNode.inputs.offset.value = offset);
    this.paramConstants.offset = offset;
  }
}
