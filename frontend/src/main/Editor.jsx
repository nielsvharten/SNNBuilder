import React, { Component } from "react";
import Network from "../network/Network";
import InputValidator from "../utils/InputValidator";
import NetworkDetails from "../details/NetworkDetails";
import ElementDetails from "../details/ElementDetails";

class Editor extends Component {
  state = {
    selectedNodeId: null,
    selectedSynapseId: null,
    connectMode: false,
    editMode: true,
    loaded: false,
    network: {
      id: 1,
      name: "",
      nodes: [],
      synapses: [],
      maxNodeId: 0,
      maxSynapseId: 0,
    },
    duration: 10,
    execution: { timeStep: 0, duration: 10, measurements: {} },
  };

  /*
  Global handlers
  */
  handleSelectNode = (nodeId) => {
    const selectedNodeId = nodeId;
    const selectedSynapseId = null;

    // select node and deselect previous selected node
    this.setState({ selectedNodeId });
    this.setState({ selectedSynapseId });
  };

  handleClickNode = (node) => {
    const { connectMode, selectedNodeId } = this.state;

    if (connectMode) {
      if (node.type === "input") {
        return;
      }
      this.handleAddSynapse(selectedNodeId, node.id);

      // disable connect mode
      this.handleSwitchConnectMode(false);
    } else {
      this.handleSelectNode(node.id);
    }
  };

  handleSelectSynapse = (synapseId) => {
    const selectedSynapseId = synapseId;
    const selectedNodeId = null;

    // select node and deselect previous selected node
    this.setState({ selectedSynapseId });
    this.setState({ selectedNodeId });
  };

  handleClickSynapse = (synapseId) => {
    this.handleSelectSynapse(synapseId);
  };

  handleSwitchEditMode = (editMode) => {
    const execution = { ...this.state.execution };
    execution.measurements = {};
    this.setState({ execution }); // remove execution
    this.setState({ editMode }); // set edit mode
    this.setState({ connectMode: false }); // disable connectMode
  };

  /*
  Handlers for modifying the network
  */
  handleSaveNetwork = () => {
    console.log("save network", this.state.network);

    const jsonState = JSON.stringify(this.state.network);
    window.localStorage.setItem("network", jsonState);
  };

  handleAddNode = (type) => {
    const network = { ...this.state.network };
    const id = network.maxNodeId + 1;

    const node = {
      id: id,
      type: type,
      read_out: false,
      name: "",
      x: 100,
      y: 100,
    };

    if (type === "lif") {
      node.m = 0.0;
      node.V_init = 0.0;
      node.V_reset = 0.0;
      node.thr = 1.0;
      node.I_e = 0.0;
    } else if (type === "input") {
      node.train = "[]";
      node.loop = false;
    }

    network.nodes = network.nodes.concat(node);
    network.maxNodeId = id;

    this.setState({ network });
  };

  handleDeleteNode = (nodeId) => {
    const network = { ...this.state.network };
    network.nodes = network.nodes.filter((node) => node.id !== nodeId);
    network.synapses = network.synapses.filter(
      (synapse) => synapse.pre !== nodeId && synapse.post !== nodeId
    );

    this.setState({ network });
  };

  handleStopDragNode = (node, x, y) => {
    const network = { ...this.state.network };
    const index = network.nodes.indexOf(node);
    network.nodes[index] = { ...node };
    network.nodes[index].x = x;
    network.nodes[index].y = y;

    this.setState({ network });
  };

  handleRenameNode = (node, newName) => {
    const network = { ...this.state.network };
    const index = network.nodes.indexOf(node);
    network.nodes[index] = { ...node };
    network.nodes[index].name = newName;

    this.setState({ network });
  };

  handleAddSynapse = (preId, postId) => {
    console.log("create", preId, postId);
    const network = { ...this.state.network };
    const id = network.maxSynapseId + 1;

    const synapse = {
      id: id,
      pre: preId,
      post: postId,
      w: 1.0,
      d: 1,
    };

    network.synapses = network.synapses.concat(synapse);
    network.maxSynapseId = id;

    this.setState({ network });
  };

  handleDeleteSynapse = (synapseId) => {
    const network = { ...this.state.network };
    network.synapses = network.synapses.filter((s) => s.id !== synapseId);
    console.log(synapseId);
    this.setState({ network });
  };

  handleChangeOption = (element, elementType, option, newValue) => {
    const network = { ...this.state.network };
    const index = network[elementType].indexOf(element);
    const oldValue = network[elementType][index][option.name];

    // TODO: check if input is valid
    const validatedValue = InputValidator(option.type, oldValue, newValue);

    network[elementType][index] = { ...element };
    network[elementType][index][option.name] = validatedValue;

    this.setState({ network });
  };

  handleSwitchConnectMode = (connectMode) => {
    this.setState({ connectMode });
  };

  /* 
  Handlers for executing the network
  */
  handleExecuteNetwork = () => {
    this.handleSwitchEditMode(false);

    fetch("http://127.0.0.1:5000/network", {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "localhost:5000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: this.state.network,
        duration: this.state.duration,
      }),
    })
      .then((response) => response.json())
      .then((execution) => this.setState({ execution }))
      .catch();
  };

  handleChangeDuration = (newValue) => {
    const duration = InputValidator("int", this.state.duration, newValue);
    this.setState({ duration });
  };

  handleUpdateTimeStep = (newValue) => {
    const execution = { ...this.state.execution };
    if (newValue >= execution.duration || newValue < 0) {
      return;
    }

    execution.timeStep = newValue;
    this.setState({ execution });
  };

  /*
  Components of the Editor 
  */
  getExecutionSlider() {
    const execution = this.state.execution;
    const nrNodes = Object.keys(execution.measurements).length;

    if (nrNodes > 0) {
      const nrTimeSteps = Object.values(execution.measurements)[0]["voltages"]
        .length;

      return (
        <div className="form-group row m-2" style={{ width: "700px" }}>
          <input
            className="col-sm-4 m-2"
            type="range"
            min={0}
            max={nrTimeSteps - 1}
            value={execution.timeStep}
            onChange={(e) => this.handleUpdateTimeStep(e.target.value)}
          />
          <br />
          <button
            className="btn btn-secondary col-sm-1"
            onClick={() =>
              this.handleUpdateTimeStep(Number(execution.timeStep) - 1)
            }
          >
            prev
          </button>
          <p className="col-sm-1 m-2" style={{ textAlign: "center" }}>
            {execution.timeStep}
          </p>
          <button
            className="btn btn-secondary col-sm-1"
            onClick={() =>
              this.handleUpdateTimeStep(Number(execution.timeStep) + 1)
            }
          >
            next
          </button>
        </div>
      );
    }
  }

  getButtons() {
    if (this.state.editMode) {
      return (
        <React.Fragment>
          <button
            onClick={() => this.handleAddNode("lif")}
            className="btn btn-primary m-2"
          >
            Add lif
          </button>
          <button
            onClick={() => this.handleAddNode("input")}
            className="btn btn-warning m-2"
          >
            Add input
          </button>
        </React.Fragment>
      );
    }
  }

  getEditor() {
    const { network, editMode, execution, selectedNodeId, selectedSynapseId } =
      this.state;

    return (
      <React.Fragment>
        <div className="builder">
          <Network
            network={network}
            execution={execution}
            editMode={editMode}
            // selected element
            selectedNodeId={selectedNodeId}
            selectedSynapseId={selectedSynapseId}
            // handlers
            onStopDragNode={this.handleStopDragNode}
            onClickNode={this.handleClickNode}
            onClickSynapse={this.handleClickSynapse}
            onRenameNode={this.handleRenameNode}
          />
          <div className="column-right">
            <NetworkDetails
              editMode={this.state.editMode}
              duration={this.state.duration}
              nrNodes={network.nodes.length}
              nrSynapses={network.synapses.length}
              // handlers
              onExecuteNetwork={this.handleExecuteNetwork}
              onSaveNetwork={this.handleSaveNetwork}
              onSwitchEditMode={this.handleSwitchEditMode}
              onChangeDuration={this.handleChangeDuration}
            />
            <ElementDetails
              nodes={network.nodes}
              synapses={network.synapses}
              measurements={execution.measurements}
              // selected element
              selectedNodeId={selectedNodeId}
              selectedSynapseId={selectedSynapseId}
              // current mode
              connectMode={this.state.connectMode}
              editMode={this.state.editMode}
              // handlers
              onDeleteNode={this.handleDeleteNode}
              onDeleteSynapse={this.handleDeleteSynapse}
              onChangeOption={this.handleChangeOption}
              onSwitchConnectMode={this.handleSwitchConnectMode}
            />
          </div>
        </div>
        {this.getExecutionSlider()}
        {this.getButtons()}
      </React.Fragment>
    );
  }

  // try loading network json object from local storage
  componentDidMount() {
    const jsonState = window.localStorage.getItem("network");
    if (jsonState === null) {
      console.log("no network defined");
      this.setState({ loaded: true });
      return;
    }

    const network = JSON.parse(jsonState);
    this.setState({ network, loaded: true });
  }

  render() {
    if (this.state.loaded) {
      return this.getEditor();
    }
  }
}

export default Editor;
