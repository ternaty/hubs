import React from "react";
import { Button } from "../input/Button";
import { getReticulumMeta, connectToReticulum, createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import HubChannel from "../../utils/hub-channel";
import "aframe";
import "networked-aframe";
import { Presence } from "phoenix";
import { DialogAdapter } from "../../naf-dialog-adapter";
import PhoenixAdapter from "../../phoenix-adapter";
import { emitter } from "../../emitter";

import { App } from "../../app";
window.APP = new App();
const store = window.APP.store;

import styles from "../../assets/stylesheets/connection-test.scss";

class TestState {
  constructor(name) {
    this.name = name;
    this.state = "";
    this.notes = "";
  }

  start() {
    this.state = "Running";
    this._startMs = performance.now();
  }

  stop(success) {
    this.state = success ? "OK" : "Error";
    this._endMs = performance.now();
  }

  durationMs() {
    if (this._startMs && this._endMs) {
      return this._endMs - this._startMs;
    }
    return null;
  }
}

export class ConnectionTest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isStarted: false,
      copyButtonLabel: "Copy results to clipboard",
      downloadButtonLabel: "Download results",
      tests: {
        fetchUserAgentTest: new TestState("Fetch User Agent"),
        metadataTest: new TestState("Fetch Metadata"),
        roomTest: new TestState("Open Room"),
        reticulumTest: new TestState("Connect to Reticulum"),
        retChannelTest: new TestState("Open RET Channel"),
        hubChannelTest: new TestState("Open HUB Channel"),
        joinTest: new TestState("Join Room"),
        enterTest: new TestState("Enter Room"),
        micTest: new TestState("Open Microphone")
      },
      hubId: null
    };

    // Uncomment to test with existing room ID rather than creating a new one each time
    this._roomId = "rLhU2RT";
  }

  fetchUserAgent = async () => {
    console.info("Called fetchUserAgent");
    const test = this.state.tests.fetchUserAgentTest;
    test.start();
    this.setState(state => (state.tests.fetchUserAgentTest = test));

    try {
      const userAgent = window.navigator.userAgent;
      test.stop(true);
      test.notes = userAgent;
    } catch (error) {
      console.error(error);
      test.stop(false);
      test.notes = error.toString();
    }
    this.setState(state => (state.tests.fetchUserAgentTest = test));
    this.setState({ isStarted: true });
    this.dowloadMetadata();
  };

  dowloadMetadata = async () => {
    console.info("Called dowloadMetadata");
    const test = this.state.tests.metadataTest;
    test.start();
    this.setState(state => (state.tests.metadataTest = test));
    getReticulumMeta()
      .then(reticulumMeta => {
        test.stop(true);
        test.notes = `Reticulum @ ${reticulumMeta.phx_host}: v${reticulumMeta.version} on ${reticulumMeta.pool}`;
        this.openNewRoom();
      })
      .catch(error => {
        test.stop(false);
        test.notes = error.toString();
      })
      .finally(() => {
        this.setState(state => (state.tests.metadataTest = test));
      });
    // this.setState({ isStarted: true });
  };

  openNewRoom = async () => {
    console.info("Called openNewRoom");
    const test = this.state.tests.roomTest;
    if (this._roomId) {
      test.state = "Skipped";
      test.notes = `Room ID ${this._roomId}`;
      this.connectToReticulum();
    } else {
      test.start();
      this.setState(state => (state.tests.roomTest = test));
      try {
        const hub = await createAndRedirectToNewHub(null, null, false, false);
        test.stop(true);
        test.notes = `Room ID ${hub.hub_id}`;
        this._roomId = hub.hub_id;
        this.connectToReticulum();
      } catch (error) {
        test.stop(false);
        test.notes = error.toString();
      } finally {
        this.setState(state => (state.tests.roomTest = test));
      }
    }
  };

  connectToReticulum = async () => {
    console.info("Called connectToReticulum");
    const test = this.state.tests.reticulumTest;
    test.start();
    const socket = await connectToReticulum(true);
    test.notes = socket.endPointURL();
    this.setState(state => (state.tests.reticulumTest = test));
    socket.onOpen(() => {
      test.stop(true);
      this._socket = socket;
      this.setState(state => (state.tests.reticulumTest = test));
      this.openRetChannel();
    });
    socket.onError(error => {
      test.stop(false);
      this.setState(state => (state.tests.reticulumTest = test));
    });
  };

  openRetChannel = async () => {
    console.info("Called openRetChannel");
    const test = this.state.tests.retChannelTest;
    test.start();
    this.setState(state => (state.tests.retChannelTest = test));
    const retPhxChannel = this._socket.channel(`ret`, { hub_id: this._roomId });
    retPhxChannel
      .join()
      .receive("ok", async data => {
        test.stop(true);
        console.info(data);
        this._clientId = data.session_id;
        test.notes = `Session ID ${data.session_id}`;
        this.setState(state => (state.tests.retChannelTest = test));
        this.openHubChannel();
      })
      .receive("error", error => {
        test.stop(false);
        test.notes = error.reason;
        this.setState(state => (state.tests.retChannelTest = test));
      });
  };

  openHubChannel = async () => {
    console.info("Called openHubChannel");
    const test = this.state.tests.hubChannelTest;
    test.start();
    this.setState(state => (state.tests.hubChannelTest = test));
    const params = {
      profile: {
        displayName: "CONNECTION_TEST"
      },
      context: {
        mobile: false,
        embed: false
      },
      push_subscription_endpoint: null,
      perms_token: null,
      hub_invite_id: null
    };
    const hubPhxChannel = this._socket.channel(`hub:${this._roomId}`, params);
    const hubChannel = new HubChannel(store, this._roomId);
    this._hubChannel = hubChannel;
    window.APP.hubChannel = hubChannel;
    hubChannel.channel = hubPhxChannel;
    hubChannel.presence = new Presence(hubPhxChannel);
    hubPhxChannel
      .join()
      .receive("ok", async data => {
        test.stop(true);
        console.info(data);
        this.setState(state => (state.tests.hubChannelTest = test));
        this._hub = data.hubs[0];
        this._perms_token = data.perms_token;
        this.joinRoom();
      })
      .receive("error", error => {
        console.error(error);
        test.stop(false);
        test.notes = error.reason;
        this.setState(state => (state.tests.hubChannelTest = test));
      });
  };

  joinRoom = async () => {
    console.info("Called joinRoom");
    const connectionUrl = `wss://${this._hub.host}:${this._hub.port}`;
    const test = this.state.tests.joinTest;
    test.notes = connectionUrl;
    test.start();
    this.setState(state => (state.tests.joinTest = test));

    try {
      window.APP.dialog = new DialogAdapter();
      // const dialogAdapter = new DialogAdapter();
      // this._adapter = dialogAdapter;
      const qs = new URLSearchParams(location.search);
      const events = emitter();

      NAF.adapters.register("phoenix", PhoenixAdapter);
      const adapter = NAF.adapters.make("phoenix");
      // this._adapter = adapter;
      NAF.connection.setNetworkAdapter(adapter);

      const surrogateFunction = (...payload) => {
        payload.forEach(arg => {
          console.info("surrogateFunction arg,", arg);
        });
      };
      const scene = { emit: surrogateFunction };

      // // Normally set in hubs.js in response to the adapter-ready event
      adapter.session_id = this._clientId;
      adapter.hubChannel = this._hubChannel;
      adapter.events = events;
      adapter.scene = scene;
      adapter.setServerConnectListeners(surrogateFunction, surrogateFunction);
      adapter.setDataChannelListeners(surrogateFunction, surrogateFunction, surrogateFunction);
      // adapter.setRoom(this._roomId);
      // adapter.setJoinToken(this._perms_token);

      // // Normally hubs.js links these up to the phoenix hub channel
      adapter.reliableTransport = (clientId, dataType, data) => {
        console.info(`adapter.reliableTransport: ${clientId} ${dataType} ${data}}`);
      };
      adapter.unreliableTransport = (clientId, dataType, data) => {
        console.info(`adapter.unreliableTransport: ${clientId} ${dataType} ${data}}`);
      };

      await Promise.all([
        APP.dialog.connect({
          serverUrl: connectionUrl,
          roomId: this._roomId,
          joinToken: this._perms_token,
          serverParams: { host: this._hub.host, port: this._hub.port, turn: this._hub.turn },
          scene,
          clientId: this._clientId,
          forceTcp: qs.get("force_tcp"),
          forceTurn: qs.get("force_turn"),
          iceTransportPolicy: qs.get("force_tcp") || qs.get("force_turn") ? "relay" : "all"
        }),
        NAF.connection.adapter
          .connect()
          .then(async () => {
            test.stop(true);
            this.setState(state => (state.tests.joinTest = test));
            this.enterRoom();
          })
          .catch(error => {
            console.error(error);
            test.stop(false);
            test.notes = error.reason;
            this.setState(state => (state.tests.joinTest = test));
          })
      ]);
    } catch (error) {
      console.error(error);
      test.stop(false);
      test.notes = error.toString();
      this.setState(state => (state.tests.joinTest = test));
    }
  };

  enterRoom = async () => {
    console.info("Called enterRoom");
    const test = this.state.tests.enterTest;
    test.start();
    this.setState(state => (state.tests.enterTest = test));

    try {
      this._hubChannel.sendEnteredEvent();
      test.stop(true);
      this.openMic();
    } catch (error) {
      console.error(error);
      test.stop(false);
      test.notes = error.toString();
    } finally {
      this.setState(state => (state.tests.enterTest = test));
    }
  };

  openMic = async () => {
    console.info("Called openMic");
    const test = this.state.tests.micTest;
    test.start();
    this.setState(state => (state.tests.micTest = test));

    try {
      // Normally handled by the hubs media-devices-manager
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // this._adapter.setLocalMediaStream(newStream);
      // this._adapter.enableMicrophone(true);
      APP.dialog.setLocalMediaStream(newStream);
      APP.dialog.enableMicrophone(true);
      newStream.getAudioTracks().forEach(track => {
        test.notes = `Microphone: ${track.label}`;
      });
      test.stop(true);
    } catch (error) {
      console.error(error);
      test.stop(false);
      test.notes = error.toString();
    } finally {
      this.setState(state => (state.tests.micTest = test));
    }

    // Comment out to keep connection open after test
    this.disconnectAll();
  };

  disconnectAll = async () => {
    console.info("Called disconnectAll");
    this._socket.disconnect();
  };

  copyTable = () => {
    // does not work with firefox, since it has ClipboardItem not implemented
    const html = document.getElementById("resultsTable").outerHTML;
    const data = [new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }) })];
    navigator.clipboard.write(data).then(
      () => {
        this.setState({ copyButtonLabel: "Copied!" });
      },
      function (reason) {
        alert("Clipboard error: " + reason);
      }
    );
  };

  downloadTable = () => {
    const html = document.getElementById("resultsTable").outerHTML;
    let dateTime = new Date().toISOString();
    dateTime = dateTime.replaceAll(":", "-");
    const blob = new Blob([html], { type: "text/html" });
    const link = window.document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "connection-test_" + dateTime + "_UTC." + "html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  render() {
    if (this.state.isStarted) {
      return (
        <div className={styles.resultsContainer}>
          <table id="resultsTable" className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Test</th>
                <th>State</th>
                <th>Latency (ms)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(this.state.tests).map(test => (
                <tr key={test.name}>
                  <td className={styles.testName}>{test.name}</td>
                  <td>{test.state}</td>
                  <td className={styles.numeric}>{test.durationMs()?.toFixed(0)}</td>
                  <td>{test.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* <Button preset="blue" className={styles.actionButton} onClick={this.copyTable}>
            {this.state.copyButtonLabel}
          </Button> */}
          <Button preset="accept" className={styles.actionButton} onClick={this.downloadTable}>
            {this.state.downloadButtonLabel}
          </Button>
        </div>
      );
    } else {
      return (
        // <Button preset="basic" className={styles.actionButton} onClick={this.dowloadMetadata}>
        <Button preset="basic" className={styles.actionButton} onClick={this.fetchUserAgent}>
          Start Connection Test
        </Button>
      );
    }
  }
}
