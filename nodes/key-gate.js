class KeyGateNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(98, 159, 96, 0.75)', 'rgb(109, 194, 118)', 'KEY', 'Key Gate');

    let self = this;

    this.paramConstants = {
      key: 'unassigned',
      gateOnLevel: 1
    }

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
    $('#settings-panel #key-input, #settings-panel #key-gate-on-level').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();

    let placeholder = multiple ? 'placeholder="<group>"' : '';

    html += '<section><div>Key</div>' +
            '<div><input type="text" id="key-input" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.key) + '">' +
            '</div></section>' +

            '<section><div>Gate On Level</div>' +
            '<div><input type="number" id="key-gate-on-level" ' + placeholder +
            'value="' + (multiple?'':this.paramConstants.gateOnLevel) + '" step="any">' +
            '</div></section>'
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;

    $('#settings-panel #key-input').keypress(function(e) {
      let key = e.key;
      if(key) {
        self.setKey(key);
        $(this).val(e.key);
      }
      // This thing should not allow the event to propagate
      return false;
    });

    $('#settings-panel #key-gate-on-level').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setGateOnLevel(val);
      } else {
        $(this).val(self.paramConstants.gateOnLevel);
      }
    })
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #key-input').keypress(function(e) {
      let key = e.key;
      if(key) {
        World.selectedNodes.forEach(node => node.setKey(val));
        $(this).val(e.key);
      }

      return false;
    });

    $('#settings-panel #key-gate-on-level').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => node.setGateOnLevel(val));
      }
    })
  }

  generateSynthNode() {
    let gate = audioCtx.createConstantSource();
    gate.offset.value = 0;

    gate.start();

    return new SynthNodeWrapper(gate, {});
  }

  setKey(key) {
    let oldKey = this.paramConstants.key;
    if(World.keybindings[oldKey]) {
      World.keybindings[oldKey].removeObject(this);
    }

    this.paramConstants.key = key;

    if(!World.keybindings[key]) {
      World.keybindings[key] = [];
    }

    World.keybindings[key].push(this);
    console.log(World.keybindings);
  }

  gateOn() {
    this.synthNodes.forEach(synthNode =>
      synthNode.outputtingNode.offset.value = this.paramConstants.gateOnLevel);
  }

  gateOff() {
    this.synthNodes.forEach(synthNode => synthNode.outputtingNode.offset.value = 0);
  }

  setGateOnLevel(level) {
    this.paramConstants.gateOnLevel = level;
    this.synthNodes.forEach(synthNode => {
      if (synthNode.outputtingNode.offset.value !== 0)
        synthNode.outputtingNode.offset.value = level;
    });
  }
}
