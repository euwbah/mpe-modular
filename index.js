// Declare Contexts

var canvas = new fabric.Canvas($('#viewport')[0], {
  allowTouchScrolling: true,
  backgroundColor: 'rgb(52, 52, 52)'
});

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Defaults

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';
fabric.Object.prototype.lockScalingX = fabric.Object.prototype.lockScalingY
                                     = fabric.Object.prototype.lockRotation
                                     = true;

// fabric.Object.prototype.hasBorders =
fabric.Object.prototype.hasControls =
fabric.Object.prototype.hasRotatingPoint = false;

canvas.setWidth(window.innerWidth);
canvas.setHeight(window.innerHeight);

var oscilloscope = new WavyJones(audioCtx, 'oscilloscope');
oscilloscope.lineColor = 'rgb(89, 255, 0)';
oscilloscope.lineThickness = 3;

// Global Mouyse & Keyboard events

// keyboard model
var keyboard = {
  isShiftDown: false
}

// Key events
$(window).keydown(function(e) {
  if (e.key === 'Shift') {
    keyboard.isShiftDown = true;
  }
});

$(window).keyup(function(e) {
  if (e.key === 'Shift') {
    keyboard.isShiftDown = false;
  }
})

// mouse model
var pointer = {
  x: 0,       // Coordinates with scaling and panning applied
  y: 0,
  clientX: 0, // Raw coordinates
  clientY: 0,

  // The following is used to determine if a double click was performed on a synth node
  timestampOfFirstClickOfAPossibleDoubleClick: 0,
  panMode: false,
  zoomEnabled: true,

  // The following properties are regarding connection-making:

  // Refers to the connected half of a connection-to-be
  connectingFrom: undefined,
  // The temporary line it makes while it's still a half-connected connection
  tempLine: undefined,
  currentHoveredInput: undefined
};

canvas.on('mouse:over', function(e) {
  if(e.target) {
    if(pointer.connectingFrom && e.target.inputParent) {
      // Input object
      e.target.inputParent.mouseOver();
    }
    if(e.target.connection) {
      e.target.connection.mouseOver();
    }
  }
});

canvas.on('mouse:out', function(e) {
  if(e.target) {
    if(pointer.connectingFrom && e.target.inputParent) { // Input parent => Input object
      e.target.inputParent.mouseOut();
    }
    if(e.target.connection) {
      e.target.connection.mouseOut();
    }
  }
})

canvas.on('mouse:move', function(options) {
  let p = canvas.getPointer(options.e);

  if (pointer.panMode) {
    let deltaX = options.e.clientX - pointer.clientX;
    let deltaY = options.e.clientY - pointer.clientY;

    canvas.relativePan({x: deltaX, y: deltaY});
  }
  if (pointer.tempLine) {
    pointer.tempLine.set('x2', p.x).set('y2', p.y);
    canvas.renderAll();
  }

  pointer.x = p.x;
  pointer.y = p.y;

  pointer.clientX = options.e.clientX;
  pointer.clientY = options.e.clientY;

});

canvas.on('mouse:down', function(e) {
  let activeObject = canvas.getActiveObject();
  let activeGroup = canvas.getActiveGroup();

  if(pointer.connectingFrom) {
    World.finalizeConnection();
  }

  if(!(activeObject || activeGroup) && !keyboard.isShiftDown) {

    // Reset timestamp
    pointer.timestampOfFirstClickOfAPossibleDoubleClick = 0;

    // Trigger background moving
    canvas.selection = false;
    pointer.panMode = true;
  } else {
    if(activeObject && activeObject.synthNode) {
      // This means one object selected only
      // which is a proper candidate for the double click
      if(Date.now() - pointer.timestampOfFirstClickOfAPossibleDoubleClick < 200) {
        // A double click has been performed
        activeObject.synthNode.doubleClick();
        pointer.timestampOfFirstClickOfAPossibleDoubleClick = 0;
      } else {
        pointer.timestampOfFirstClickOfAPossibleDoubleClick = Date.now();
      }
    }
  }
});

canvas.on('mouse:up', function(e) {
  if (pointer.panMode) {
    canvas.selection = true;
    pointer.panMode = false;
  }
});

// Mouse scroll event. NOTE: Don't zoom if mouse is not hovering over the canvas

$('#settings-panel').mouseenter(() => {pointer.zoomEnabled = false;})
                    .mouseleave(() => {pointer.zoomEnabled = true;});

document.addEventListener('wheel', function(e) {
  if (pointer.zoomEnabled) {
    let scrollAmt = - e.deltaY * 0.02 + 1;
    let zoomLvl = canvas.getZoom();
    if (zoomLvl * scrollAmt > 0.3 && zoomLvl * scrollAmt < 2) {
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), zoomLvl * scrollAmt);
    }
  }
});

let settingsPanelDefault = $('#settings-panel #default');
let settingsPanelDynamic = $('#settings-panel #dynamic');

let World = {
  nodes: [],
  selectedNodes: [],
  selectedConnections: [],
  doSelectionUpdate: function() {
    if (this.selectedNodes.length === 0 && this.selectedConnections.length === 0) {
      settingsPanelDefault.show();
      settingsPanelDynamic.hide();
    } else {
      // There are selections
      settingsPanelDefault.hide();
      settingsPanelDynamic.show();

      if (this.selectedNodes.length !== 0 && this.selectedConnections.length === 0) {
        // Only nodes are selected
        if(this.selectedNodes.length === 1) {
          // Only one node selected: show all settings
          let selectedNode = this.selectedNodes[0];
          settingsPanelDynamic.html('');                                  // Clear
          settingsPanelDynamic.append(selectedNode.generateHeaderHTML()); // Append header
          settingsPanelDynamic.append(selectedNode.generateOptionsHTML(false));
          // Single name change event
          $('#settings-panel #object-name').keyup(function() {
            if (World.selectedNodes.length === 1) {
              World.selectedNodes[0].changeName($(this).val());
            }
          });
          selectedNode.applySingleSelectionEvents();

        } else if (this.checkSelectedNodesAreSameType()) {
          // Multiple nodes of same type are selected: show all settings and
          // apply changes to all the selected nodes
          let didYouJustAssumeMyNodeType = this.selectedNodes[0];
          settingsPanelDynamic.html('');                        // Clear
          settingsPanelDynamic.append(
            didYouJustAssumeMyNodeType.generateCategorizedGroupHeaderHTML()); // Append Cat Header
          settingsPanelDynamic.append(didYouJustAssumeMyNodeType.generateOptionsHTML(true));

          // Group change event
          $('#settings-panel #object-name').keyup(function() {
            World.selectedNodes.forEach(node => {
              node.changeName($(this).val());
            })
          });

          didYouJustAssumeMyNodeType.applyGroupSelectionEvents();
        } else {
          // Nodes are of differing types, only give the generalized options:
          // Duplicate, delete, disconnect connections amongst the nodes
          let didYouJustAssumeMyGenericity = this.selectedNodes[0];
          settingsPanelDynamic.html('');
          settingsPanelDynamic.append(
            didYouJustAssumeMyGenericity.generateGenericGroupHeaderHTML());

          // Group change event
          $('#settings-panel #object-name').keyup(function() {
            World.selectedNodes.forEach(node => {
              node.changeName($(this).val());
            })
          });
        }
      } else if (this.selectedConnections.length !== 0 && this.selectedNodes.length === 0) {
        // Only connections are selected
        if(this.selectedConnections.length === 1) {
          // A single connection
          let selectedConnection = this.selectedConnections[0];
          settingsPanelDynamic.html('');
          settingsPanelDynamic.append(selectedConnection.generateHTML(false));
        } else {
          // A group of connections
          let genericAssumption = this.selectedConnections[0];
          settingsPanelDynamic.html('');
          settingsPanelDynamic.append(genericAssumption.generateHTML(true));
        }
      } else {
        // Both nodes and connections are selected
        // Only give the option to delete
        settingsPanelDynamic.html('');
        settingsPanelDynamic.append();
      }
    }
  },
  checkSelectedNodesAreSameType: function() {
    if (this.selectedNodes.length != 0) {
      let cmpNodeType = this.selectedNodes[0].type;
      let problem = false;
      for(let node of this.selectedNodes.slice(1)) {
        if (cmpNodeType !== node.type) {
          return false;
        }
      }

      return true;
    }

    return false;
  },
  enterConnectionMode: function(nodeConnectingFrom) {
    pointer.tempLine = new fabric.Line([
      nodeConnectingFrom.displayGroup.getLeft(),
      nodeConnectingFrom.displayGroup.getTop(),
      pointer.x,
      pointer.y
    ], {
      stroke: 'rgba(72, 208, 50, 0.7)',
      strokeWidth: 10
    });

    canvas.add(pointer.tempLine);

    pointer.connectingFrom = nodeConnectingFrom;

    this.nodes.forEach(node => {
      node.inputs.forEach(input => {
        canvas.bringToFront(input.connectableText);
      });
    });
  },
  finalizeConnection: function() {

    // NOTE: 'finalize connection' does not necessarily mean a connection is made
    // A connection will only be made if inputConnectedTo exists

    if(pointer.currentHoveredInput) {
      pointer.currentHoveredInput.performConnection(pointer.connectingFrom);
    }

    canvas.remove(pointer.tempLine);

    pointer.connectingFrom = undefined;
    pointer.currentHoveredInput = undefined;
    pointer.tempLine = undefined;
    canvas.renderAll();
  }
}

// XXX XXX MAIN

$(function() {

  World.nodes.push(new OscillatorNode(300, 200));
  World.nodes.push(new OscillatorNode(400, 500));
  World.nodes.push(new DestinationNode(800, 350));

  // Window Resize event

  $(window).resize(function() {
    canvas.setWidth(window.innerWidth);
    canvas.setHeight(window.innerHeight);
  })

  // Remove button
  $('#remove').click(function() {

  });

  // Selection Clear
  canvas.on('before:selection:cleared', function(e) {
    World.nodes.forEach(node => node.deselect());
    World.selectedNodes = [];

    World.selectedConnections.forEach(connection => connection.deselect());
    World.selectedConnections = [];
    World.doSelectionUpdate();
  });

  // Group selection
  canvas.on('selection:created', function(e) {
    let selectedObjects = canvas.getActiveGroup().getObjects();
    let alsoHasNodes = false;
    for(let displayObject of selectedObjects) {
      if(displayObject.synthNode) {
        alsoHasNodes = true;
        break;
      }
    }
    selectedObjects.forEach((displayObject) => {
      if(displayObject.synthNode) {
        displayObject.synthNode.select();
        World.selectedNodes.push(displayObject.synthNode);
      } else if(displayObject.connection) {
        displayObject.connection.select();
        // Make sure that a group selection involving nodes can move
        if(alsoHasNodes)
          displayObject.set('lockMovementX', false).set('lockMovementY', false);
        World.selectedConnections.push(displayObject.connection);
      }
    });
    World.doSelectionUpdate();
  });

  canvas.on('object:moving', function(e) {
    let activeGroup = canvas.getActiveGroup();

    if(activeGroup) {
      let selectedObjects = activeGroup.getObjects();
      // Remove all selected connections during moving
      selectedObjects.forEach(displayObject => {
        if (displayObject.connection) {
          activeGroup.removeWithUpdate(displayObject);
        }
      });
      selectedObjects = activeGroup.getObjects();
      selectedObjects.forEach(displayObject => {
        if (displayObject.synthNode)
          displayObject.synthNode.updatePositions(activeGroup);
      });
    }
  });

  canvas.on('object:modified', function(e) {
    let activeGroup = canvas.getActiveGroup();
    if(activeGroup) {
      let selectedObjects = canvas.getActiveGroup().getObjects();
      selectedObjects.forEach(displayObject => {
        if(displayObject.synthNode)
          displayObject.synthNode.updateBoundingBox();
      });
    }
  });

});
