
    // NOTE: Inputs do not hold the parameters themselves
    // Nor do they point to the actual AudioNode's inputs
    // They just bridge the two and deal with the UI and connection logic

class Input {
  // name refers to the long name that appears in the settings panel.
  // display name is the shortened version that shows up on the canvas.
  // Theta refers to the angle (in degrees) of which the text is from the origin;
  // counterclockwise respective to the line y = parentNode.getTop(), where
  // x is an increasing value.
  // o: {
  //      name:           string            the full name of this input
  //      displayName:    string            the shortened version
  //      unit:           string            the units of this param if any
  //      parentNode:     Node              the node that contains the Input
  //      theta:          number (degrees)
  //      synthParamName: string            the param name of the webaudio synth node to connect to
  //    }

  // IMPORTANT NOTE: synthParamName should have the same name as the respective AudioParam
  //                 in the Node.generateSynthNode().inputs property of the generated
  //                 SynthNodeWrapper.
  //                 If synthParamName is 'input', then the inputObject's AudioNode input
  //                 will be the receiving AudioNode itself.
  constructor(o) {
    this.name = o.name;
    this.displayName = o.displayName || o.name;
    this.unit = o.unit || '';
    this.connections = [];
    this.parentNode = o.parentNode;
    this.synthParamName = o.synthParamName;

    let radius = this.parentNode.circle.radius;
    let radians = o.theta / 180.0 * Math.PI;

    // Distances from parentNode.displayGroup origin
    this._dX = (radius - 30) * Math.cos(radians);
    this._dY = (radius - 30) * Math.sin(radians);

    // NOTE: connectable text is the text that would appear when in selection mode
    this.connectableText = new fabric.Text(this.displayName, {
      fontFamily: 'Raleway, sans-serif',
      fontSize: 26,
      fontWeight: 100,
      fill: 'rgb(211, 168, 255)',
      left: this._dX + this.parentNode.displayGroup.left,
      top: this._dY + this.parentNode.displayGroup.top,
      selectable: false
    });

    this.connectableText.inputParent = this;

    // HACK: connectableText can't be added to the parentNode's displayGroup
    // because this text needs to be identifiable on separate from the
    canvas.add(this.connectableText);
    canvas.bringToFront(this.connectableText);

    // ALSO NOTE: There is no 'inside text'. Midway through each connection,
    // there will be text to help identify the destination of the connection.
  }

  updatePositions(left, top, groupObject) {
    this.connectableText.left = this._dX + left;
    this.connectableText.top = this._dY + top;
    if (groupObject) {
      this.connectableText.left += groupObject.getLeft();
      this.connectableText.top += groupObject.getTop();
    }
    this.connections.forEach(connection => {
      connection.drawAndUpdateLine(this, connection.outputtingNode, groupObject);
    });
  }

  updateBoundingBox() {
    canvas.remove(this.connectableText);

    this.connectableText = new fabric.Text(this.displayName, {
      fontFamily: this.connectableText.fontFamily,
      fontSize: this.connectableText.fontSize,
      fontWeight: this.connectableText.fontWeight,
      fill: this.connectableText.fill,
      left: this.connectableText.left,
      top: this.connectableText.top,
      selectable: this.connectableText.selectable
    });

    this.connectableText.inputParent = this;

    canvas.add(this.connectableText);
    canvas.bringToFront(this.connectableText);

    this.connections.forEach(connection => connection.updateBoundingBox());
  }

  mouseOver() {
    this.connectableText.setFill('rgb(255, 208, 117)');
    this.connectableText.setFontWeight(500);
    pointer.currentHoveredInput = this;
    canvas.renderAll();
  }

  mouseOut() {
    this.connectableText.setFill('rgb(211, 168, 255)');
    this.connectableText.setFontWeight(100);
    pointer.currentHoveredInput = undefined;
    canvas.renderAll();
  }

  performConnection(outputtingNode) {
    let connection = new Connection(this, outputtingNode);
    this.connections.push(connection);
    this.mouseOut();

    // Push a reference of this connection to the outputtingNode
    // to enable its move updates to update the connection's position

    outputtingNode.outputConnections.push(connection);
  }
}

class Connection {

  constructor (inputObject, outputtingNode) {
    let self = this;
    // When moving connections, both input and outputs of all connections
    // will be drawn. This may cause conflicts and as such, they should only
    // be drawn once per move.
    // This.accountedFor will be toggled everytime
    this.accountedFor = false;
    this.inputObject = inputObject;
    this.outputtingNode = outputtingNode;

    let receivingNode = inputObject.parentNode;

    this.drawAndUpdateLine(inputObject, outputtingNode);

    let optimisedConnect = inputObject.synthParamName === 'input' ?
                  (oSynthNode, rSynthNode) => {
                    oSynthNode.node.connect(rSynthNode.node);
                  }
                : (oSynthNode, rSynthNode) => {
                    oSynthNode.node.connect(rSynthNode.inputs[inputObject.synthParamName]);
                  };
    if(outputtingNode.isPolyphonic) {
      // Scale receiving node to have the same number of channels
      receivingNode.scaleSynthNodes(outputtingNode.synthNodes.length);


      // input would mean that the output node should connect to the input node itself,
      // and not any of it's AudioParams

      for(let channel = 0; channel < outputtingNode.synthNodes.length; channel++) {
        optimisedConnect(outputtingNode.synthNodes[channel], receivingNode.synthNodes[channel]);
      }
    } else {
      // In this case, there *should* be at least one node with only one synth node channel
      // Either the multiple outputs of the outputting node will be connected to a single
      // synth node channel in the receiving node, or the single channel of the outputting node
      // will be connected to each one of the receiving node's channels
      // Either way, it can be assumed that each Input is connected to every output there is on
      // the other node.

      for(let oChannel = 0; oChannel < outputtingNode.synthNodes.length; oChannel++) {
        for(let rChannel = 0; rChannel < receivingNode.synthNodes.length; rChannel++) {
          optimisedConnect(outputtingNode.synthNodes[oChannel], receivingNode.synthNodes[rChannel]);
        }
      }
    }
  }

  drawAndUpdateLine(inputObject, outputtingNode, groupObject) {
    let self = this;

    this.inputObject = inputObject;
    this.outputtingNode = outputtingNode;

    let a = {
      x: this.outputtingNode.displayGroup.getLeft(),
      y: this.outputtingNode.displayGroup.getTop()
    }
    let b = {
      x: this.inputObject.connectableText.getLeft(),
      y: this.inputObject.connectableText.getTop()
    }

    if(groupObject) {
      let aInGroupObject = false;
      groupObject.getObjects().forEach(displayObject => {
        if(displayObject.synthNode) {
          if(displayObject.synthNode === this.outputtingNode)
            aInGroupObject = true;
        }
      });

      if (aInGroupObject) {
        a.x += groupObject.getLeft();
        a.y += groupObject.getTop();
      }
    }

    let length = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    let theta = Math.acos((b.x - a.x) / length) / Math.PI * 180;
    // Invert theta is b is higher than a (counter-clockwise rotation is negative)
    if (b.y < a.y) theta *= -1;

    let middleX = (a.x + b.x) / 2;
    let middleY = (a.y + b.y) / 2;

    if(this.line) {
      this.line.set('x1', middleX - length / 2)
               .set('y1', middleY)
               .set('x2', middleX + length / 2)
               .set('y2', middleY)
               .set('angle', theta);

      canvas.renderAll();
    } else {
      // init
      this.line = new fabric.Line([
        middleX - length / 2,
        middleY,
        middleX + length / 2,
        middleY
      ], {
        stroke: 'rgba(48, 172, 94, 0.7)',
        strokeWidth: 10,
        hasBorders: false,
        angle: theta,
        lockMovementX: true,
        lockMovementY: true
      });

      this.line.connection = this;

      this.line.on('selected', function() {
        self.select();
        World.selectedConnections.forEach(con => con.deselect());
        World.selectedConnections = [self];
        World.doSelectionUpdate();
      });

      canvas.add(this.line);
      canvas.sendToBack(this.line);
      canvas.renderAll();
    }
  }

  updateBoundingBox() {
    let self = this;

    if (this.line) {
      canvas.remove(this.line);
    }
    this.line = new fabric.Line([
      this.line.x1,
      this.line.y1,
      this.line.x2,
      this.line.y2
    ], {
      stroke: this.line.stroke,
      strokeWidth: this.line.strokeWidth,
      hasBorders: this.line.hasBorders,
      angle: this.line.angle,
      lockMovementX: true,
      lockMovementY: true
    });

    this.line.connection = this;

    this.line.on('selected', function() {
      self.select();
      World.selectedConnections.forEach(con => con.deselect());
      World.selectedConnections = [self];
      World.selectedNodes.forEach(node => node.deselect());
      World.selectedNodes = [];
      World.doSelectionUpdate();
    });

    canvas.add(this.line);
    canvas.sendToBack(this.line);
    canvas.renderAll();
  }

  disconnect() {

  }

  select() {
    this.line.setStroke('rgba(128, 255, 0, 0.7)');
  }

  deselect() {
    this.line.setStroke('rgba(48, 172, 94, 0.7)');
    this.line.set('lockMovementX', true).set('lockMovementY', true);
  }

  mouseOver() {
    let strs = this.toStrings();
    let html = strs[0] + '<br>v<br>' + strs[1];
    $('#fullscreen').html(html.toLowerCase());
  }

  mouseOut() {
    $('#fullscreen').html('');
  }

  toStrings() {
    let outputter = this.outputtingNode.type + ' ' + this.outputtingNode.name + ' Out';

    let inputted = this.inputObject.parentNode.type + ' ' + this.inputObject.parentNode.name;
    if (this.inputObject.synthParamName !== 'input')
      inputted += ' ' + this.inputObject.name;

    return [outputter, inputted];
  }

  generateHTML(multiple) {
    let html = '';
    if(!multiple) {
      html += '<h1>connection</h1>';
      let infoStrs = this.toStrings();
      html += '<h2>' + infoStrs[0] + '<br>' + infoStrs[1] + '</h2>';
    } else {
      html += '<h1>group</h1>';
      html += '<h2>connections</h2>'
    }

    html += '<section class="center"><button id="remove">remove</button></section>';
    return html;
  }

  applySingleSelectionEvents() {

  }

  applyGroupSelectionEvents() {

  }
}
