import React, { Component } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

class Navigation extends Component {
  state = {};

  handleImportFile = () => {
    const { onImportNetwork } = this.props;

    document.getElementById("uploadFile").click();
    document.getElementById("uploadFile").onchange = (e) => {
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        onImportNetwork(JSON.parse(e.target.result));
      };
    };
  };

  async exportWithFilePicker(content) {
    const opts = {
      types: [
        {
          description: "JSON file",
          accept: { "application/json": [".json"] },
        },
      ],
    };

    const handle = await window.showSaveFilePicker(opts);
    const writable = await handle.createWritable();
    await writable.write(content);
    writable.close();
  }

  exportWithoutFilePicker(content) {
    const saveNetwork = document.createElement("a");
    const blob = new Blob([content], { type: "application/json" });

    saveNetwork.href = URL.createObjectURL(blob);
    saveNetwork.download = "network.json";
    saveNetwork.click();
    setTimeout(() => URL.revokeObjectURL(saveNetwork.href), 60000);
  }

  handleExportFile = () => {
    const content = JSON.stringify(this.props.network, null, 2);
    if (window.showSaveFilePicker) {
      this.exportWithFilePicker(content);
    } else {
      this.exportWithoutFilePicker(content);
    }
  };

  render() {
    return (
      <Navbar bg="dark" expand="sm" variant="dark">
        <Container>
          <Navbar.Brand href="#home">SNN-Builder</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavDropdown title="File" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">
                  New network
                </NavDropdown.Item>
                <NavDropdown.Item onClick={this.handleImportFile}>
                  Import network
                </NavDropdown.Item>
                <NavDropdown.Item onClick={this.handleExportFile}>
                  Export network
                </NavDropdown.Item>
                <NavDropdown.Divider />
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
        <input type="file" id="uploadFile" hidden />
      </Navbar>
    );
  }
}

export default Navigation;